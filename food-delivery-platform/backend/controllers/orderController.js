const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getConfig } = require('../utils/configCache');
const { calculateBill, calculateCouponDiscount, calculateDeliveryPayout, calculateCommission } = require('../utils/pricing');
const { transition, loadFull, populateOrder } = require('../utils/orderFlow');
const { validateCouponFor } = require('./couponController');
const { events } = require('../sockets/orderTracking');
const { notifyUser } = require('../utils/notify');
const { asyncHandler, ok, ApiError, paginate, paged, haversineKm, round2, generateOtp } = require('../utils/helpers');

/** Builds priced line items from client cart; validates availability and add-ons. */
async function buildLines(restaurantId, items) {
  const ids = items.map((i) => i.menuItemId);
  const docs = await MenuItem.find({ _id: { $in: ids }, restaurant: restaurantId });
  const byId = Object.fromEntries(docs.map((d) => [d._id.toString(), d]));
  return items.map((ci) => {
    const item = byId[ci.menuItemId];
    if (!item) throw new ApiError(400, 'order.itemNotFound', { menuItemId: ci.menuItemId });
    if (!item.isAvailable) throw new ApiError(400, 'order.itemUnavailable', { name: item.name });
    const selected = [];
    (item.addOns || []).forEach((group) => {
      const chosenIds = ((ci.addOns || []).find((a) => a.groupId === group._id.toString()) || {}).optionIds || [];
      if (group.required && chosenIds.length < Math.max(1, group.minSelect || 0)) throw new ApiError(400, 'order.addOnRequired', { item: item.name, group: group.name });
      if (group.maxSelect && chosenIds.length > group.maxSelect) throw new ApiError(400, 'order.addOnTooMany', { item: item.name, group: group.name });
      chosenIds.forEach((oid) => {
        const opt = group.options.id(oid);
        if (!opt || !opt.isAvailable) throw new ApiError(400, 'order.addOnUnavailable', { item: item.name });
        selected.push({ group: group.name, name: opt.name, price: opt.price });
      });
    });
    const quantity = Math.max(1, parseInt(ci.quantity, 10) || 1);
    const unitPrice = item.effectivePrice + selected.reduce((s, a) => s + a.price, 0);
    return {
      menuItem: item._id,
      name: item.name,
      image: item.image,
      isVeg: item.isVeg,
      unitPrice: round2(unitPrice),
      quantity,
      addOns: selected,
      instructions: ci.instructions || '',
      lineTotal: round2(unitPrice * quantity),
    };
  });
}

function resolveAddress(user, body) {
  if (body.addressId) {
    const a = user.addresses.id(body.addressId);
    if (!a) throw new ApiError(400, 'address.notFound');
    return a.toObject();
  }
  if (body.address && body.address.fullAddress) return body.address;
  return null;
}

async function prepare(req, { strict }) {
  const cfg = await getConfig();
  const rules = cfg.businessRules;
  const { restaurantId, items = [], couponCode, tip = 0, useWallet = false } = req.body;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || restaurant.status !== 'approved') throw new ApiError(404, 'restaurant.notFound');
  if (strict && !restaurant.isOpenNow() && !req.body.scheduledFor) throw new ApiError(400, 'restaurant.closed');
  const lines = await buildLines(restaurant._id, items);
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));

  const address = resolveAddress(req.user, req.body);
  let distanceKm = 0;
  if (address && address.location && address.location.coordinates && restaurant.location.coordinates) {
    distanceKm = round2(haversineKm(restaurant.location.coordinates, address.location.coordinates));
    if (strict && rules.radiusKm && distanceKm > rules.radiusKm) throw new ApiError(400, 'order.outOfRadius', { distanceKm, radiusKm: rules.radiusKm });
  }

  let coupon = null;
  let couponError = null;
  if (couponCode && cfg.features.coupons) {
    try {
      coupon = await validateCouponFor({ code: couponCode, user: req.user, restaurantId: restaurant._id, subtotal });
    } catch (e) {
      if (strict) throw e;
      couponError = e.message;
    }
  }
  const { discount, freeDelivery } = calculateCouponDiscount(coupon, subtotal);
  const safeTip = cfg.features.tipping ? Number(tip) || 0 : 0;
  const bill = calculateBill(rules, {
    subtotal,
    distanceKm,
    tip: safeTip,
    couponDiscount: discount,
    freeDelivery,
    walletBalance: req.user.walletBalance,
    useWallet: cfg.features.wallet && useWallet,
  });
  return { cfg, rules, restaurant, lines, subtotal, address, distanceKm, coupon, couponError, bill };
}

/** POST /api/orders/quote — authoritative bill used by the cart screen. */
const quote = asyncHandler(async (req, res) => {
  const { cfg, rules, restaurant, lines, bill, coupon, couponError, distanceKm } = await prepare(req, { strict: false });
  return ok(res, {
    restaurant: { _id: restaurant._id, name: restaurant.name, isOpenNow: restaurant.isOpenNow() },
    items: lines,
    bill,
    distanceKm,
    coupon: coupon ? { code: coupon.code, title: coupon.title } : null,
    couponError,
    minOrderValue: rules.minOrderValue,
    meetsMinimum: bill.subtotal >= rules.minOrderValue,
    walletBalance: req.user.walletBalance,
    tipPresets: cfg.features.tipping ? rules.tipPresets : [],
    paymentMethods: rules.paymentMethods,
    codMaxAmount: rules.codMaxAmount,
    deliverySlots: cfg.features.scheduleOrder ? (rules.deliverySlots || []).filter((s) => s.enabled) : [],
  });
});

const createOrder = asyncHandler(async (req, res) => {
  const { cfg, rules, restaurant, lines, address, distanceKm, coupon, bill } = await prepare(req, { strict: true });
  const { paymentMethod, scheduledFor, deliverySlot, instructions } = req.body;
  if (!address) throw new ApiError(400, 'order.addressRequired');
  if (bill.subtotal < rules.minOrderValue) throw new ApiError(400, 'order.belowMinimum', { minOrderValue: rules.minOrderValue });
  if (!rules.paymentMethods[paymentMethod]) throw new ApiError(400, 'payment.methodDisabled');
  if (paymentMethod === 'wallet' && !cfg.features.wallet) throw new ApiError(400, 'payment.methodDisabled');
  if (paymentMethod === 'cod' && rules.codMaxAmount && bill.payable > rules.codMaxAmount) throw new ApiError(400, 'payment.codLimit', { max: rules.codMaxAmount });
  if (scheduledFor && !cfg.features.scheduleOrder) throw new ApiError(400, 'feature.disabled');

  let walletUsed = bill.walletUsed;
  let payable = bill.payable;
  if (paymentMethod === 'wallet') {
    if (req.user.walletBalance < bill.total) throw new ApiError(400, 'wallet.insufficient');
    walletUsed = bill.total;
    payable = 0;
  }

  const commission = calculateCommission(rules, restaurant, bill.subtotal - bill.discount);
  const deliveryEarning = calculateDeliveryPayout(rules, distanceKm, cfg.features.deliveryPartnerTips ? bill.tip : 0);
  const vendorEarning = round2(bill.subtotal - bill.discount - commission.amount + bill.packagingFee);

  const order = new Order({
    customer: req.user._id,
    restaurant: restaurant._id,
    items: lines,
    deliveryAddress: address,
    distanceKm,
    pricing: { ...bill, walletUsed: round2(walletUsed), payable: round2(payable) },
    commission,
    vendorEarning,
    deliveryEarning,
    coupon: coupon ? { code: coupon.code, discount: bill.discount, couponId: coupon._id } : undefined,
    payment: {
      method: paymentMethod,
      status: payable <= 0 ? 'paid' : 'pending',
      provider: ['cod', 'wallet'].includes(paymentMethod) ? paymentMethod : '',
      paidAt: payable <= 0 ? new Date() : undefined,
    },
    status: 'placed',
    statusHistory: [{ status: 'placed', by: req.user._id }],
    scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    deliverySlot: deliverySlot || '',
    instructions: instructions || '',
    deliveryOtp: cfg.features.deliveryOtp ? generateOtp(rules.deliveryOtpLength || 4) : undefined,
  });
  // Atomic, conditional wallet debit: concurrent orders can never overdraw the balance.
  if (walletUsed > 0) {
    const debited = await User.updateOne({ _id: req.user._id, walletBalance: { $gte: walletUsed } }, { $inc: { walletBalance: -walletUsed } });
    if (!debited.modifiedCount) throw new ApiError(400, 'wallet.insufficient');
  }
  try {
    await order.save();
  } catch (e) {
    if (walletUsed > 0) await User.updateOne({ _id: req.user._id }, { $inc: { walletBalance: walletUsed } });
    throw e;
  }
  if (walletUsed > 0) {
    await Transaction.create({ user: req.user._id, order: order._id, type: 'wallet_debit', direction: 'debit', amount: walletUsed, currencyCode: rules.currencyCode, description: 'order.payment' });
  }
  if (coupon) {
    const updated = await Coupon.updateOne({ _id: coupon._id, 'usedBy.user': req.user._id }, { $inc: { usedCount: 1, 'usedBy.$.count': 1 } });
    if (!updated.modifiedCount) await Coupon.updateOne({ _id: coupon._id }, { $inc: { usedCount: 1 }, $push: { usedBy: { user: req.user._id, count: 1 } } });
  }

  const full = await loadFull(order._id);
  const readyForVendor = order.payment.method === 'cod' || order.payment.status === 'paid';
  if (readyForVendor) {
    events.orderNew(full);
    notifyUser(restaurant.owner, { titleKey: 'notif.vendorNewOrder', bodyKey: 'notif.vendorNewOrderBody', vars: { order: full.orderNumber }, type: 'order', data: { orderId: full._id.toString() } }).catch(() => {});
  }
  const response = full.toObject();
  if (cfg.features.deliveryOtp) response.deliveryOtp = order.deliveryOtp;
  return ok(res, { order: response, requiresPayment: payable > 0 && paymentMethod !== 'cod' }, 'order.placed', 201);
});

const myOrders = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { customer: req.user._id };
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  const [items, total] = await Promise.all([
    populateOrder(Order.find(q).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit)),
    Order.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const activeOrders = asyncHandler(async (req, res) => {
  const items = await populateOrder(
    Order.find({ customer: req.user._id, status: { $in: ['placed', 'accepted', 'preparing', 'ready', 'picked'] } }).sort({ createdAt: -1 })
  );
  return ok(res, items);
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await populateOrder(Order.findById(req.params.id).select('+deliveryOtp'));
  if (!order) throw new ApiError(404, 'order.notFound');
  const u = req.user;
  const isAdmin = ['admin', 'superadmin'].includes(u.role);
  const isCustomer = order.customer._id.equals(u._id);
  const isPartner = order.deliveryPartner && order.deliveryPartner._id.equals(u._id);
  let isVendor = false;
  if (u.role === 'vendor') isVendor = !!(await Restaurant.exists({ _id: order.restaurant._id, owner: u._id }));
  if (!isAdmin && !isCustomer && !isPartner && !isVendor) throw new ApiError(403, 'auth.forbidden');
  const obj = order.toObject();
  if (!isCustomer && !isAdmin) delete obj.deliveryOtp;
  const cfg = await getConfig();
  obj.canCancel = isCustomer && ['placed', 'accepted'].includes(order.status);
  obj.cancellationWindowMinutes = cfg.businessRules.cancellationWindowMinutes;
  obj.cancellationPenaltyPercent = cfg.businessRules.cancellationPenaltyPercent;
  return ok(res, obj);
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'order.notFound');
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  if (!isAdmin && !order.customer.equals(req.user._id)) throw new ApiError(403, 'auth.forbidden');
  const actor = isAdmin ? 'admin' : 'customer';
  const full = await transition(order, 'cancelled', {
    actor,
    by: req.user._id,
    note: req.body.reason,
    extra: { cancelledBy: actor, cancelReason: req.body.reason || '' },
  });
  return ok(res, full, 'order.cancelled');
});

const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new ApiError(404, 'order.notFound');
  const ids = order.items.map((i) => i.menuItem);
  const available = await MenuItem.find({ _id: { $in: ids }, isAvailable: true });
  const availableIds = new Set(available.map((a) => a._id.toString()));
  const cartItems = order.items
    .filter((i) => availableIds.has(i.menuItem.toString()))
    .map((i) => {
      const item = available.find((a) => a._id.equals(i.menuItem));
      const addOns = [];
      (item.addOns || []).forEach((g) => {
        const optionIds = g.options.filter((o) => i.addOns.some((a) => a.group === g.name && a.name === o.name)).map((o) => o._id.toString());
        if (optionIds.length) addOns.push({ groupId: g._id.toString(), optionIds });
      });
      return { menuItemId: i.menuItem, name: i.name, quantity: i.quantity, addOns, item };
    });
  return ok(res, { restaurantId: order.restaurant, items: cartItems, unavailableCount: order.items.length - cartItems.length });
});

/* -------- Vendor -------- */
async function vendorRestaurant(req) {
  const r = await Restaurant.findOne({ owner: req.user._id });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  return r;
}

const vendorOrders = asyncHandler(async (req, res) => {
  const r = await vendorRestaurant(req);
  const p = paginate(req.query);
  const q = { restaurant: r._id, $or: [{ 'payment.method': 'cod' }, { 'payment.status': { $in: ['paid', 'refunded', 'partially_refunded'] } }] };
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  if (req.query.from || req.query.to) {
    q.createdAt = {};
    if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
  }
  const [items, total] = await Promise.all([
    populateOrder(Order.find(q).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit)),
    Order.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const vendorUpdateStatus = asyncHandler(async (req, res) => {
  const r = await vendorRestaurant(req);
  const order = await Order.findOne({ _id: req.params.id, restaurant: r._id });
  if (!order) throw new ApiError(404, 'order.notFound');
  const { status, reason } = req.body;
  const extra = {};
  if (status === 'rejected' || status === 'cancelled') Object.assign(extra, { cancelledBy: 'vendor', cancelReason: reason || '' });
  const full = await transition(order, status, { actor: 'vendor', by: req.user._id, note: reason, extra });
  return ok(res, full, 'order.statusUpdated');
});

const vendorStats = asyncHandler(async (req, res) => {
  const r = await vendorRestaurant(req);
  const cfg = await getConfig();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
  const since = new Date(Date.now() - days * 86400000);
  const [today, pending, totals, daily, topItems] = await Promise.all([
    Order.aggregate([
      { $match: { restaurant: r._id, createdAt: { $gte: startOfDay }, status: { $nin: ['cancelled', 'rejected'] } } },
      { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: '$vendorEarning' } } },
    ]),
    Order.countDocuments({ restaurant: r._id, status: 'placed' }),
    Order.aggregate([
      { $match: { restaurant: r._id, status: 'delivered' } },
      { $group: { _id: null, orders: { $sum: 1 }, gross: { $sum: '$pricing.subtotal' }, earnings: { $sum: '$vendorEarning' }, commission: { $sum: '$commission.amount' } } },
    ]),
    Order.aggregate([
      { $match: { restaurant: r._id, createdAt: { $gte: since }, status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, earnings: { $sum: '$vendorEarning' } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { restaurant: r._id, status: 'delivered', createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' }, revenue: { $sum: '$items.lineTotal' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
  ]);
  return ok(res, {
    restaurant: { _id: r._id, name: r.name, isOpen: r.isOpen, rating: r.rating, walletBalance: r.walletBalance },
    commissionPercent: r.commissionPercent != null ? r.commissionPercent : cfg.businessRules.commissionPercent,
    currencySymbol: cfg.businessRules.currencySymbol,
    today: today[0] || { orders: 0, revenue: 0 },
    pendingOrders: pending,
    totals: totals[0] || { orders: 0, gross: 0, earnings: 0, commission: 0 },
    daily,
    topItems,
  });
});

const vendorPayouts = asyncHandler(async (req, res) => {
  const r = await vendorRestaurant(req);
  const cfg = await getConfig();
  const p = paginate(req.query);
  const q = { restaurant: r._id, type: { $in: ['vendor_payout', 'commission'] } };
  const [items, total, delivered] = await Promise.all([
    Transaction.find(q).populate('order', 'orderNumber pricing.subtotal vendorEarning createdAt').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Transaction.countDocuments(q),
    Order.find({ restaurant: r._id, status: 'delivered' }).select('orderNumber pricing.subtotal pricing.discount commission vendorEarning deliveredAt').sort({ deliveredAt: -1 }).limit(50),
  ]);
  return ok(res, {
    walletBalance: r.walletBalance,
    minPayoutAmount: cfg.businessRules.minPayoutAmount,
    commissionPercent: r.commissionPercent != null ? r.commissionPercent : cfg.businessRules.commissionPercent,
    currencySymbol: cfg.businessRules.currencySymbol,
    recentSettlements: delivered,
    ...paged(items, total, p),
  });
});

module.exports = {
  quote,
  createOrder,
  myOrders,
  activeOrders,
  getOrder,
  cancelOrder,
  reorder,
  vendorOrders,
  vendorUpdateStatus,
  vendorStats,
  vendorPayouts,
};
