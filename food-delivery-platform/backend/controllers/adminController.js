const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const DeliveryPartner = require('../models/DeliveryPartner');
const Category = require('../models/Category');
const AdminRole = require('../models/AdminRole');
const Review = require('../models/Review');
const { getConfig, invalidateConfig } = require('../utils/configCache');
const AppConfig = require('../models/AppConfig');
const { transition, loadFull, populateOrder } = require('../utils/orderFlow');
const { events } = require('../sockets/orderTracking');
const { notifyUser } = require('../utils/notify');
const { asyncHandler, ok, ApiError, pick, paginate, paged, escapeRegex, round2 } = require('../utils/helpers');

const rangeFrom = (query) => {
  const days = Math.min(parseInt(query.days, 10) || 30, 365);
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - days * 86400000);
  return { from, to };
};

/* ---------------- Dashboard ---------------- */
const stats = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [users, vendors, pendingVendors, partners, onlinePartners, orders, todayAgg, totalAgg, statusAgg, recent] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Restaurant.countDocuments({ status: 'approved' }),
    Restaurant.countDocuments({ status: 'pending' }),
    DeliveryPartner.countDocuments({ status: 'approved' }),
    DeliveryPartner.countDocuments({ status: 'approved', isOnline: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { createdAt: { $gte: startOfDay }, status: { $nin: ['cancelled', 'rejected'] } } },
      { $group: { _id: null, orders: { $sum: 1 }, gmv: { $sum: '$pricing.total' }, commission: { $sum: '$commission.amount' } } },
    ]),
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, gmv: { $sum: '$pricing.total' }, commission: { $sum: '$commission.amount' }, deliveryFees: { $sum: '$pricing.deliveryFee' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    populateOrder(Order.find().sort({ createdAt: -1 }).limit(8)),
  ]);
  return ok(res, {
    currencySymbol: cfg.businessRules.currencySymbol,
    counts: { users, vendors, pendingVendors, partners, onlinePartners, orders },
    today: todayAgg[0] || { orders: 0, gmv: 0, commission: 0 },
    totals: totalAgg[0] || { gmv: 0, commission: 0, deliveryFees: 0, orders: 0 },
    ordersByStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
    recentOrders: recent,
  });
});

const revenue = asyncHandler(async (req, res) => {
  const { from, to } = rangeFrom(req.query);
  const fmt = req.query.groupBy === 'month' ? '%Y-%m' : '%Y-%m-%d';
  const [series, byPayment, topRestaurants, topCuisines] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered' } },
      {
        $group: {
          _id: { $dateToString: { format: fmt, date: '$createdAt' } },
          orders: { $sum: 1 },
          gmv: { $sum: '$pricing.total' },
          commission: { $sum: '$commission.amount' },
          deliveryFees: { $sum: '$pricing.deliveryFee' },
          discounts: { $sum: '$pricing.discount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered' } },
      { $group: { _id: '$payment.method', count: { $sum: 1 }, amount: { $sum: '$pricing.total' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered' } },
      { $group: { _id: '$restaurant', orders: { $sum: 1 }, gmv: { $sum: '$pricing.subtotal' }, commission: { $sum: '$commission.amount' } } },
      { $sort: { gmv: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $project: { orders: 1, gmv: 1, commission: 1, name: '$restaurant.name' } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered' } },
      { $lookup: { from: 'restaurants', localField: 'restaurant', foreignField: '_id', as: 'r' } },
      { $unwind: '$r' },
      { $unwind: '$r.cuisines' },
      { $group: { _id: '$r.cuisines', orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 8 },
    ]),
  ]);
  return ok(res, { from, to, series, byPayment, topRestaurants, topCuisines });
});

/* ---------------- Users ---------------- */
const listUsers = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = {};
  if (req.query.role) q.role = { $in: String(req.query.role).split(',') };
  if (req.query.banned) q.isBanned = req.query.banned === 'true';
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(req.query.q), 'i');
    q.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(q).populate('adminRole', 'name').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    User.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('adminRole', 'name');
  if (!user) throw new ApiError(404, 'user.notFound');
  const [orders, spent] = await Promise.all([
    Order.find({ customer: user._id }).sort({ createdAt: -1 }).limit(10).populate('restaurant', 'name'),
    Order.aggregate([{ $match: { customer: user._id, status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$pricing.total' }, count: { $sum: 1 } } }]),
  ]);
  return ok(res, { user, recentOrders: orders, lifetime: spent[0] || { total: 0, count: 0 } });
});

const setBan = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+refreshTokens');
  if (!user) throw new ApiError(404, 'user.notFound');
  if (user.role === 'superadmin') throw new ApiError(400, 'user.cannotBanSuperadmin');
  user.isBanned = !!req.body.banned;
  user.banReason = req.body.reason || '';
  if (user.isBanned) user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
  return ok(res, user, user.isBanned ? 'user.banned' : 'user.unbanned');
});

const adjustWallet = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const amount = round2(req.body.amount);
  if (!amount) throw new ApiError(400, 'wallet.invalidAmount');
  const user = await User.findByIdAndUpdate(req.params.id, { $inc: { walletBalance: amount } }, { new: true });
  if (!user) throw new ApiError(404, 'user.notFound');
  await Transaction.create({ user: user._id, type: amount > 0 ? 'wallet_credit' : 'wallet_debit', direction: amount > 0 ? 'credit' : 'debit', amount: Math.abs(amount), currencyCode: cfg.businessRules.currencyCode, description: req.body.reason || 'admin.adjustment' });
  return ok(res, user, 'wallet.adjusted');
});

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, adminRole, role = 'admin' } = req.body;
  if (!['admin', 'vendor', 'delivery', 'customer'].includes(role)) throw new ApiError(400, 'auth.invalidRole');
  if (role === 'admin' && req.user.role !== 'superadmin' && req.user.adminRole) throw new ApiError(403, 'auth.forbidden');
  const user = await User.create({ name, email, phone, password, role, adminRole: role === 'admin' ? adminRole || null : null, isVerified: true });
  if (role === 'delivery') await DeliveryPartner.create({ user: user._id, status: 'approved' });
  return ok(res, user, 'user.created', 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'phone', 'role', 'adminRole', 'isVerified']);
  const target = await User.findById(req.params.id);
  if (!target) throw new ApiError(404, 'user.notFound');
  if (data.role === 'superadmin' && req.user.role !== 'superadmin') throw new ApiError(403, 'auth.forbidden');
  if (target.role === 'superadmin' && req.user.role !== 'superadmin') throw new ApiError(403, 'auth.forbidden');
  // Nobody changes their own role/permissions (prevents accidental self-demotion or escalation).
  if (target._id.equals(req.user._id)) {
    delete data.role;
    delete data.adminRole;
  }
  const user = await User.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (req.body.password) {
    user.password = req.body.password;
    await user.save();
  }
  return ok(res, user, 'user.updated');
});

/* ---------------- Vendors / restaurants ---------------- */
const listRestaurants = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.q) q.name = new RegExp(escapeRegex(req.query.q), 'i');
  const [items, total] = await Promise.all([
    Restaurant.find(q).populate('owner', 'name email phone').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Restaurant.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const setRestaurantStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  if (!['pending', 'approved', 'suspended', 'rejected'].includes(status)) throw new ApiError(400, 'restaurant.invalidStatus');
  const r = await Restaurant.findByIdAndUpdate(req.params.id, { status, statusReason: reason || '' }, { new: true });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  notifyUser(r.owner, { titleKey: `notif.restaurant_${status}`, bodyKey: `notif.restaurant_${status}Body`, vars: { name: r.name, reason: reason || '' }, type: 'account', channels: ['push', 'inapp', 'email'] }).catch(() => {});
  return ok(res, r, 'restaurant.statusUpdated');
});

const setRestaurantCommission = asyncHandler(async (req, res) => {
  const value = req.body.commissionPercent;
  const r = await Restaurant.findByIdAndUpdate(req.params.id, { commissionPercent: value === null || value === '' ? null : Number(value) }, { new: true });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  return ok(res, r, 'restaurant.commissionUpdated');
});

const commissionOverview = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const overrides = await Restaurant.find({ commissionPercent: { $ne: null } }).select('name commissionPercent status');
  return ok(res, { globalPercent: cfg.businessRules.commissionPercent, overrides });
});

const setGlobalCommission = asyncHandler(async (req, res) => {
  const v = Number(req.body.commissionPercent);
  if (Number.isNaN(v) || v < 0 || v > 100) throw new ApiError(400, 'validation.failed');
  await AppConfig.updateOne({ key: 'main' }, { $set: { 'businessRules.commissionPercent': v }, $inc: { version: 1 } }, { upsert: true });
  invalidateConfig();
  return ok(res, { globalPercent: v }, 'config.updated');
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  if (await Order.exists({ restaurant: req.params.id, status: { $in: ['placed', 'accepted', 'preparing', 'ready', 'picked'] } })) throw new ApiError(400, 'restaurant.hasActiveOrders');
  await Restaurant.findByIdAndUpdate(req.params.id, { status: 'rejected', isOpen: false });
  return ok(res, null, 'restaurant.deleted');
});

/* ---------------- Platform categories & cuisines ---------------- */
const listCategories = asyncHandler(async (req, res) => {
  const q = req.query.type ? { type: req.query.type } : {};
  return ok(res, await Category.find(q).sort({ type: 1, order: 1 }));
});
const createCategory = asyncHandler(async (req, res) => ok(res, await Category.create(pick(req.body, ['name', 'nameKey', 'type', 'image', 'order', 'isActive'])), 'category.created', 201));
const updateCategory = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, pick(req.body, ['name', 'nameKey', 'type', 'image', 'order', 'isActive']), { new: true });
  if (!c) throw new ApiError(404, 'category.notFound');
  return ok(res, c, 'category.updated');
});
const deleteCategory = asyncHandler(async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  await Restaurant.updateMany({}, { $pull: { categories: req.params.id } });
  return ok(res, null, 'category.deleted');
});
const reorderCategories = asyncHandler(async (req, res) => {
  await Promise.all((req.body.ids || []).map((id, i) => Category.updateOne({ _id: id }, { order: i + 1 })));
  return ok(res, await Category.find().sort({ type: 1, order: 1 }), 'category.reordered');
});

/* ---------------- Orders ---------------- */
const listOrders = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = {};
  if (req.query.status) q.status = { $in: String(req.query.status).split(',') };
  if (req.query.restaurant) q.restaurant = req.query.restaurant;
  if (req.query.paymentStatus) q['payment.status'] = req.query.paymentStatus;
  if (req.query.q) q.orderNumber = new RegExp(escapeRegex(req.query.q), 'i');
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

const assignDelivery = asyncHandler(async (req, res) => {
  const { partnerUserId } = req.body;
  const dp = await DeliveryPartner.findOne({ user: partnerUserId, status: 'approved' });
  if (!dp) throw new ApiError(404, 'delivery.profileNotFound');
  if (dp.activeOrder && dp.activeOrder.toString() !== req.params.id) throw new ApiError(400, 'delivery.alreadyActive');
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'order.notFound');
  if (['delivered', 'cancelled', 'rejected'].includes(order.status)) throw new ApiError(400, 'order.closed');
  if (order.deliveryPartner && !order.deliveryPartner.equals(partnerUserId)) {
    await DeliveryPartner.updateOne({ user: order.deliveryPartner }, { activeOrder: null });
  }
  order.deliveryPartner = partnerUserId;
  await order.save();
  dp.activeOrder = order._id;
  await dp.save();
  const full = await loadFull(order._id);
  events.deliveryAssigned(full);
  notifyUser(partnerUserId, { titleKey: 'notif.deliveryAssigned', bodyKey: 'notif.deliveryAssignedBody', vars: { order: full.orderNumber }, type: 'order', data: { orderId: full._id.toString() } }).catch(() => {});
  return ok(res, full, 'order.assigned');
});

const adminUpdateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'order.notFound');
  const { status, reason } = req.body;
  const extra = status === 'cancelled' || status === 'rejected' ? { cancelledBy: 'admin', cancelReason: reason || '' } : {};
  return ok(res, await transition(order, status, { actor: 'admin', by: req.user._id, note: reason, extra }), 'order.statusUpdated');
});

/* ---------------- Transactions ---------------- */
const listTransactions = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = {};
  if (req.query.type) q.type = { $in: String(req.query.type).split(',') };
  if (req.query.status) q.status = req.query.status;
  if (req.query.from || req.query.to) {
    q.createdAt = {};
    if (req.query.from) q.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) q.createdAt.$lte = new Date(req.query.to);
  }
  const [items, total, sums] = await Promise.all([
    Transaction.find(q).populate('user', 'name email').populate('restaurant', 'name').populate('order', 'orderNumber').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Transaction.countDocuments(q),
    Transaction.aggregate([{ $match: q }, { $group: { _id: '$type', amount: { $sum: '$amount' }, count: { $sum: 1 } } }]),
  ]);
  return ok(res, { ...paged(items, total, p), summary: sums });
});

/** Record a payout to a vendor or delivery partner (manual bank transfer). */
const recordPayout = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const { kind, id, amount, reference } = req.body;
  const amt = round2(amount);
  if (!(amt > 0)) throw new ApiError(400, 'payment.invalidAmount');
  if (kind === 'vendor') {
    const r = await Restaurant.findById(id);
    if (!r) throw new ApiError(404, 'restaurant.notFound');
    if (r.walletBalance < amt) throw new ApiError(400, 'wallet.insufficient');
    r.walletBalance = round2(r.walletBalance - amt);
    await r.save();
    await Transaction.create({ restaurant: r._id, user: r.owner, type: 'vendor_payout', direction: 'debit', amount: amt, currencyCode: cfg.businessRules.currencyCode, providerRef: reference || '', description: 'payout.vendor' });
    return ok(res, r, 'payout.recorded');
  }
  if (kind === 'delivery') {
    const dp = await DeliveryPartner.findOne({ user: id });
    if (!dp) throw new ApiError(404, 'delivery.profileNotFound');
    if (dp.walletBalance < amt) throw new ApiError(400, 'wallet.insufficient');
    dp.walletBalance = round2(dp.walletBalance - amt);
    await dp.save();
    await Transaction.create({ user: id, type: 'delivery_payout', direction: 'debit', amount: amt, currencyCode: cfg.businessRules.currencyCode, providerRef: reference || '', description: 'payout.delivery' });
    return ok(res, dp, 'payout.recorded');
  }
  throw new ApiError(400, 'payout.invalidKind');
});

/* ---------------- Delivery partners ---------------- */
const listPartners = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.online) q.isOnline = req.query.online === 'true';
  const [items, total] = await Promise.all([
    DeliveryPartner.find(q).populate('user', 'name email phone isBanned').populate('activeOrder', 'orderNumber status').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    DeliveryPartner.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const setPartnerStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'suspended', 'rejected'].includes(status)) throw new ApiError(400, 'delivery.invalidStatus');
  const dp = await DeliveryPartner.findByIdAndUpdate(req.params.id, { status, ...(status !== 'approved' ? { isOnline: false } : {}) }, { new: true }).populate('user', 'name');
  if (!dp) throw new ApiError(404, 'delivery.profileNotFound');
  notifyUser(dp.user._id, { titleKey: `notif.partner_${status}`, bodyKey: `notif.partner_${status}Body`, type: 'account' }).catch(() => {});
  return ok(res, dp, 'delivery.statusUpdated');
});

/* ---------------- Reports ---------------- */
const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
};

const reports = asyncHandler(async (req, res) => {
  const { from, to } = rangeFrom(req.query);
  const type = req.query.type || 'orders';
  let rows = [];
  if (type === 'orders') {
    const orders = await Order.find({ createdAt: { $gte: from, $lte: to } }).populate('restaurant', 'name').populate('customer', 'name').sort({ createdAt: -1 }).limit(5000);
    rows = orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt.toISOString(),
      restaurant: o.restaurant ? o.restaurant.name : '',
      customer: o.customer ? o.customer.name : '',
      status: o.status,
      paymentMethod: o.payment.method,
      paymentStatus: o.payment.status,
      subtotal: o.pricing.subtotal,
      discount: o.pricing.discount,
      deliveryFee: o.pricing.deliveryFee,
      tax: o.pricing.tax,
      tip: o.pricing.tip,
      total: o.pricing.total,
      commission: o.commission.amount,
      vendorEarning: o.vendorEarning,
      deliveryEarning: o.deliveryEarning,
    }));
  } else if (type === 'restaurants') {
    rows = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered' } },
      { $group: { _id: '$restaurant', orders: { $sum: 1 }, gmv: { $sum: '$pricing.subtotal' }, commission: { $sum: '$commission.amount' }, vendorEarning: { $sum: '$vendorEarning' } } },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'r' } },
      { $unwind: '$r' },
      { $project: { _id: 0, restaurant: '$r.name', orders: 1, gmv: 1, commission: 1, vendorEarning: 1 } },
      { $sort: { gmv: -1 } },
    ]);
  } else if (type === 'delivery') {
    rows = await Order.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to }, status: 'delivered', deliveryPartner: { $ne: null } } },
      { $group: { _id: '$deliveryPartner', deliveries: { $sum: 1 }, earnings: { $sum: '$deliveryEarning' }, tips: { $sum: '$pricing.tip' }, km: { $sum: '$distanceKm' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
      { $unwind: '$u' },
      { $project: { _id: 0, partner: '$u.name', phone: '$u.phone', deliveries: 1, earnings: 1, tips: 1, km: 1 } },
      { $sort: { deliveries: -1 } },
    ]);
  } else if (type === 'reviews') {
    const reviews = await Review.find({ createdAt: { $gte: from, $lte: to } }).populate('restaurant', 'name').populate('user', 'name').limit(5000);
    rows = reviews.map((r) => ({ date: r.createdAt.toISOString(), restaurant: r.restaurant ? r.restaurant.name : '', user: r.user ? r.user.name : '', rating: r.rating, deliveryRating: r.deliveryRating || '', comment: r.comment }));
  }
  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
    return res.send(toCsv(rows));
  }
  return ok(res, { type, from, to, rows });
});

/* ---------------- Admin roles ---------------- */
const listRoles = asyncHandler(async (req, res) => ok(res, { roles: await AdminRole.find().sort({ name: 1 }), permissions: AdminRole.PERMISSIONS }));
const createRole = asyncHandler(async (req, res) => ok(res, await AdminRole.create(pick(req.body, ['name', 'description', 'permissions'])), 'role.created', 201));
const updateRole = asyncHandler(async (req, res) => {
  const r = await AdminRole.findByIdAndUpdate(req.params.id, pick(req.body, ['name', 'description', 'permissions']), { new: true, runValidators: true });
  if (!r) throw new ApiError(404, 'role.notFound');
  return ok(res, r, 'role.updated');
});
const deleteRole = asyncHandler(async (req, res) => {
  if (await User.exists({ adminRole: req.params.id })) throw new ApiError(400, 'role.inUse');
  await AdminRole.findByIdAndDelete(req.params.id);
  return ok(res, null, 'role.deleted');
});

module.exports = {
  stats,
  revenue,
  listUsers,
  getUser,
  setBan,
  adjustWallet,
  createAdmin,
  updateUser,
  listRestaurants,
  setRestaurantStatus,
  setRestaurantCommission,
  commissionOverview,
  setGlobalCommission,
  deleteRestaurant,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  listOrders,
  assignDelivery,
  adminUpdateOrderStatus,
  listTransactions,
  recordPayout,
  listPartners,
  setPartnerStatus,
  reports,
  listRoles,
  createRole,
  updateRole,
  deleteRole,
};
