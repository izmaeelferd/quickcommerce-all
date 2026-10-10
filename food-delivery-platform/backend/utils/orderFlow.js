const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const DeliveryPartner = require('../models/DeliveryPartner');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getConfig } = require('./configCache');
const { notifyUser } = require('./notify');
const { events } = require('../sockets/orderTracking');
const { round2 } = require('./helpers');

/** Allowed transitions per actor role. */
const TRANSITIONS = {
  vendor: { placed: ['accepted', 'rejected'], accepted: ['preparing', 'cancelled'], preparing: ['ready'] },
  delivery: { ready: ['picked'], preparing: ['picked'], picked: ['delivered'] },
  admin: {
    placed: ['accepted', 'rejected', 'cancelled'],
    accepted: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['picked', 'cancelled'],
    picked: ['delivered', 'cancelled'],
  },
  customer: { placed: ['cancelled'], accepted: ['cancelled'] },
  system: { placed: ['rejected', 'cancelled'] },
};

function canTransition(actor, from, to) {
  const map = TRANSITIONS[actor === 'superadmin' ? 'admin' : actor] || {};
  return (map[from] || []).includes(to);
}

const populateOrder = (q) =>
  q
    .populate('restaurant', 'name logo phone address location avgPrepTimeMinutes')
    .populate('customer', 'name phone avatar')
    .populate('deliveryPartner', 'name phone avatar');

async function loadFull(orderId) {
  return populateOrder(Order.findById(orderId));
}

async function creditWallet(userId, amount, { type = 'wallet_credit', order, description, currencyCode }) {
  if (!amount || amount <= 0) return;
  await User.updateOne({ _id: userId }, { $inc: { walletBalance: round2(amount) } });
  await Transaction.create({ user: userId, order, type, direction: 'credit', amount: round2(amount), currencyCode, description });
}

/** Settles all money flows once an order is delivered. */
async function settleDelivered(order) {
  const cfg = await getConfig();
  const currencyCode = cfg.businessRules.currencyCode;
  await Restaurant.updateOne({ _id: order.restaurant._id || order.restaurant }, { $inc: { walletBalance: order.vendorEarning, totalOrders: 1 } });
  await Transaction.create({
    restaurant: order.restaurant._id || order.restaurant,
    order: order._id,
    type: 'commission',
    direction: 'credit',
    amount: order.commission.amount,
    currencyCode,
    description: `commission ${order.commission.percent}%`,
  });
  if (order.deliveryPartner) {
    await DeliveryPartner.updateOne(
      { user: order.deliveryPartner._id || order.deliveryPartner },
      { $inc: { totalDeliveries: 1, totalEarnings: order.deliveryEarning, walletBalance: order.deliveryEarning }, $set: { activeOrder: null } }
    );
    await Transaction.create({
      user: order.deliveryPartner._id || order.deliveryPartner,
      order: order._id,
      type: 'delivery_payout',
      direction: 'credit',
      amount: order.deliveryEarning,
      currencyCode,
      description: 'delivery.earning',
    });
  }
  if (order.payment.method === 'cod' && order.payment.status !== 'paid') {
    order.payment.status = 'paid';
    order.payment.paidAt = new Date();
  }
  // Referral reward on the referee's first delivered order
  const customer = await User.findById(order.customer._id || order.customer);
  if (cfg.features.referral && customer && customer.referredBy && !customer.referralRewarded) {
    customer.referralRewarded = true;
    await customer.save({ validateBeforeSave: false });
    if (cfg.features.wallet) {
      await creditWallet(customer.referredBy, cfg.businessRules.referralBonus, { type: 'referral_bonus', order: order._id, description: 'referral.reward', currencyCode });
    }
  }
}

/** Refund paid/wallet amounts after a cancellation (minus penalty). */
async function refundCancelled(order, penaltyPercent = 0) {
  const cfg = await getConfig();
  const currencyCode = cfg.businessRules.currencyCode;
  const paidOnline = order.payment.status === 'paid' && order.payment.method !== 'cod' ? order.pricing.payable : 0;
  const totalPaid = paidOnline + (order.pricing.walletUsed || 0);
  const penalty = round2((totalPaid * penaltyPercent) / 100);
  const refund = round2(totalPaid - penalty);
  order.cancellationFee = penalty;
  order.refundAmount = refund;
  if (refund > 0) {
    // Refunds go to the wallet when enabled (instant), otherwise back to source via gateway.
    if (cfg.features.wallet || paidOnline === 0) {
      await creditWallet(order.customer._id || order.customer, refund, { type: 'refund', order: order._id, description: 'order.refund', currencyCode });
      order.payment.status = penalty > 0 ? 'partially_refunded' : 'refunded';
    } else {
      const gateway = require('../config/payments');
      try {
        const r = await gateway.refund({ paymentId: order.payment.paymentId, amount: Math.min(refund, paidOnline) });
        await Transaction.create({ user: order.customer._id || order.customer, order: order._id, type: 'refund', direction: 'credit', amount: refund, currencyCode, provider: gateway.provider(), providerRef: r.id });
        order.payment.status = penalty > 0 ? 'partially_refunded' : 'refunded';
      } catch (e) {
        console.error('[refund] gateway refund failed', e.message);
      }
    }
  }
  if (penalty > 0) {
    await Transaction.create({ user: order.customer._id || order.customer, order: order._id, type: 'cancellation_fee', direction: 'debit', amount: penalty, currencyCode });
  }
  if (order.coupon && order.coupon.couponId) {
    const Coupon = require('../models/Coupon');
    await Coupon.updateOne({ _id: order.coupon.couponId }, { $inc: { usedCount: -1 } });
    await Coupon.updateOne({ _id: order.coupon.couponId, 'usedBy.user': order.customer._id || order.customer }, { $inc: { 'usedBy.$.count': -1 } });
  }
  if (order.deliveryPartner) {
    await DeliveryPartner.updateOne({ user: order.deliveryPartner._id || order.deliveryPartner }, { $set: { activeOrder: null } });
  }
}

const STATUS_NOTIFY_KEYS = {
  accepted: 'notif.orderAccepted',
  preparing: 'notif.orderPreparing',
  ready: 'notif.orderReady',
  picked: 'notif.orderPicked',
  delivered: 'notif.orderDelivered',
  cancelled: 'notif.orderCancelled',
  rejected: 'notif.orderRejected',
};

/** Transitions an order, records history, emits sockets and notifies. */
async function transition(order, to, { actor, by, note, extra = {} }) {
  if (!canTransition(actor, order.status, to)) {
    const { ApiError } = require('./helpers');
    throw new ApiError(400, 'order.invalidTransition', { from: order.status, to });
  }
  order.status = to;
  order.statusHistory.push({ status: to, by, note });
  Object.assign(order, extra);
  if (to === 'accepted') {
    const r = await Restaurant.findById(order.restaurant._id || order.restaurant).select('avgPrepTimeMinutes');
    const rules = (await getConfig()).businessRules;
    const travel = (rules.etaBufferMinutes || 0) + (order.distanceKm || 0) * (rules.etaMinutesPerKm || 0);
    order.estimatedDeliveryAt = new Date(Date.now() + (((r && r.avgPrepTimeMinutes) || 0) + travel) * 60000);
  }
  if (to === 'delivered') {
    order.deliveredAt = new Date();
    await settleDelivered(order);
  }
  if (to === 'cancelled' || to === 'rejected') {
    const cfg = await getConfig();
    const placedAt = order.createdAt || new Date();
    const minutes = (Date.now() - new Date(placedAt).getTime()) / 60000;
    const penalty = actor === 'customer' && minutes > cfg.businessRules.cancellationWindowMinutes ? cfg.businessRules.cancellationPenaltyPercent : 0;
    await refundCancelled(order, penalty);
  }
  await order.save();
  const full = await loadFull(order._id);
  if (to === 'accepted') events.orderAccepted(full);
  events.orderStatus(full);
  if (['ready', 'accepted', 'preparing'].includes(to) && !full.deliveryPartner) {
    const cfg = await getConfig();
    if (cfg.businessRules.autoAssignDelivery && (to === 'ready' || to === 'preparing')) events.deliveryAvailable(full);
  }
  if (STATUS_NOTIFY_KEYS[to]) {
    notifyUser(full.customer._id, {
      titleKey: STATUS_NOTIFY_KEYS[to],
      bodyKey: `${STATUS_NOTIFY_KEYS[to]}Body`,
      vars: { order: full.orderNumber, restaurant: full.restaurant.name },
      type: 'order',
      data: { orderId: full._id.toString(), status: to },
    }).catch((e) => console.error('[notify]', e.message));
  }
  return full;
}

module.exports = { TRANSITIONS, canTransition, transition, loadFull, populateOrder, creditWallet, refundCancelled, settleDelivered };
