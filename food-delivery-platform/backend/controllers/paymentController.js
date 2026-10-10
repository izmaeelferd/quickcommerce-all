const crypto = require('crypto');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const gateway = require('../config/payments');
const env = require('../config/env');
const { getConfig } = require('../utils/configCache');
const { loadFull, refundCancelled } = require('../utils/orderFlow');
const { events } = require('../sockets/orderTracking');
const { notifyUser } = require('../utils/notify');
const { asyncHandler, ok, ApiError, paginate, paged, round2 } = require('../utils/helpers');

/** POST /api/payments/create-intent { orderId } or { purpose: 'wallet_topup', amount } */
const createIntent = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const { orderId, purpose, amount } = req.body;
  if (purpose === 'wallet_topup') {
    if (!cfg.features.wallet) throw new ApiError(403, 'feature.disabled');
    const amt = round2(amount);
    if (!(amt > 0)) throw new ApiError(400, 'payment.invalidAmount');
    const intent = await gateway.createIntent({ amount: amt, currency: cfg.businessRules.currencyCode, receipt: `wallet_${req.user._id}_${Date.now()}`, notes: { purpose, userId: req.user._id.toString() } });
    await Transaction.create({ user: req.user._id, type: 'wallet_credit', direction: 'credit', amount: amt, currencyCode: cfg.businessRules.currencyCode, provider: intent.provider, providerRef: intent.id, status: 'pending', description: 'wallet.topup' });
    return ok(res, { ...intent, publicKey: gateway.publicKey(), branding: { name: cfg.branding.appName, color: cfg.theme.primaryColor } });
  }
  const order = await Order.findOne({ _id: orderId, customer: req.user._id });
  if (!order) throw new ApiError(404, 'order.notFound');
  if (order.payment.status === 'paid') throw new ApiError(400, 'payment.alreadyPaid');
  if (order.payment.method === 'cod') throw new ApiError(400, 'payment.notRequired');
  const intent = await gateway.createIntent({
    amount: order.pricing.payable,
    currency: cfg.businessRules.currencyCode,
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString() },
  });
  order.payment.provider = intent.provider;
  order.payment.intentId = intent.id;
  await order.save();
  return ok(res, {
    ...intent,
    publicKey: gateway.publicKey(),
    orderNumber: order.orderNumber,
    prefill: { name: req.user.name, email: req.user.email, contact: req.user.phone },
    branding: { name: cfg.branding.appName, color: cfg.theme.primaryColor, logo: cfg.theme.appIconUrl },
  });
});

async function markOrderPaid(order, paymentId) {
  if (order.payment.status === 'paid') return loadFull(order._id);
  const cfg = await getConfig();
  order.payment.status = 'paid';
  order.payment.paymentId = paymentId;
  order.payment.paidAt = new Date();
  await order.save();
  await Transaction.create({
    user: order.customer,
    order: order._id,
    type: 'payment',
    direction: 'debit',
    amount: order.pricing.payable,
    currencyCode: cfg.businessRules.currencyCode,
    method: order.payment.method,
    provider: order.payment.provider,
    providerRef: paymentId,
  });
  const full = await loadFull(order._id);
  events.orderNew(full);
  const r = await Restaurant.findById(order.restaurant).select('owner');
  if (r) notifyUser(r.owner, { titleKey: 'notif.vendorNewOrder', bodyKey: 'notif.vendorNewOrderBody', vars: { order: full.orderNumber }, type: 'order', data: { orderId: full._id.toString() } }).catch(() => {});
  return full;
}

/** POST /api/payments/verify { orderId?, intentId, paymentId, signature } */
const verify = asyncHandler(async (req, res) => {
  const { orderId, intentId, paymentId, signature } = req.body;
  const result = await gateway.verify({ intentId, paymentId, signature });
  if (!result.verified) {
    if (orderId) await Order.updateOne({ _id: orderId, customer: req.user._id }, { 'payment.status': 'failed' });
    throw new ApiError(400, 'payment.verificationFailed');
  }
  if (orderId) {
    const order = await Order.findOne({ _id: orderId, customer: req.user._id, 'payment.intentId': intentId });
    if (!order) throw new ApiError(404, 'order.notFound');
    const full = await markOrderPaid(order, result.paymentId);
    return ok(res, full, 'payment.success');
  }
  const txn = await Transaction.findOne({ user: req.user._id, providerRef: intentId, status: 'pending', type: 'wallet_credit' });
  if (!txn) throw new ApiError(404, 'payment.notFound');
  txn.status = 'success';
  txn.meta = { paymentId: result.paymentId };
  await txn.save();
  await User.updateOne({ _id: req.user._id }, { $inc: { walletBalance: txn.amount } });
  return ok(res, { walletBalance: (await User.findById(req.user._id)).walletBalance }, 'wallet.toppedUp');
});

/** POST /api/payments/webhook/:provider — gateway webhooks (raw body). */
const webhook = asyncHandler(async (req, res) => {
  const provider = req.params.provider;
  if (provider === 'stripe') {
    const Stripe = require('stripe');
    const stripe = new Stripe(env.payments.stripe.secretKey);
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], env.payments.stripe.webhookSecret);
    } catch (e) {
      return res.status(400).send(`Webhook Error: ${e.message}`);
    }
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const order = await Order.findOne({ 'payment.intentId': intent.id });
      if (order) await markOrderPaid(order, intent.latest_charge || intent.id);
    }
    return res.json({ received: true });
  }
  if (provider === 'razorpay') {
    const sig = req.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', env.payments.razorpay.keySecret).update(req.rawBody || '').digest('hex');
    if (sig !== expected) return res.status(400).send('invalid signature');
    const body = req.body;
    if (body.event === 'payment.captured' || body.event === 'order.paid') {
      const pay = body.payload.payment && body.payload.payment.entity;
      if (pay && pay.order_id) {
        const order = await Order.findOne({ 'payment.intentId': pay.order_id });
        if (order) await markOrderPaid(order, pay.id);
      }
    }
    return res.json({ received: true });
  }
  return res.status(404).send('unknown provider');
});

/** POST /api/payments/refund (admin) { orderId, amount? } */
const refund = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId || req.body.orderId);
  if (!order) throw new ApiError(404, 'order.notFound');
  if (order.payment.status !== 'paid') throw new ApiError(400, 'payment.notRefundable');
  const cfg = await getConfig();
  const amount = round2(req.body.amount || order.pricing.payable);
  if (req.body.toWallet && cfg.features.wallet) {
    await User.updateOne({ _id: order.customer }, { $inc: { walletBalance: amount } });
    await Transaction.create({ user: order.customer, order: order._id, type: 'refund', direction: 'credit', amount, currencyCode: cfg.businessRules.currencyCode, description: 'admin.refundToWallet' });
  } else if (order.payment.method === 'cod' || order.payment.method === 'wallet') {
    await refundCancelled(order, 0);
  } else {
    const r = await gateway.refund({ paymentId: order.payment.paymentId, amount });
    await Transaction.create({ user: order.customer, order: order._id, type: 'refund', direction: 'credit', amount, currencyCode: cfg.businessRules.currencyCode, provider: gateway.provider(), providerRef: r.id });
  }
  order.refundAmount = round2((order.refundAmount || 0) + amount);
  order.payment.status = amount >= order.pricing.payable ? 'refunded' : 'partially_refunded';
  await order.save();
  return ok(res, order, 'payment.refunded');
});

const history = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { user: req.user._id };
  const [items, total] = await Promise.all([
    Transaction.find(q).populate('order', 'orderNumber').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Transaction.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

module.exports = { createIntent, verify, webhook, refund, history, markOrderPaid };
