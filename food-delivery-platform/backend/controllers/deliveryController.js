const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const { getConfig } = require('../utils/configCache');
const { transition, populateOrder, loadFull } = require('../utils/orderFlow');
const { events } = require('../sockets/orderTracking');
const { notifyUser } = require('../utils/notify');
const { asyncHandler, ok, ApiError, pick, paginate, paged, haversineKm, round2 } = require('../utils/helpers');

async function myProfile(req, { requireApproved = true } = {}) {
  const dp = await DeliveryPartner.findOne({ user: req.user._id });
  if (!dp) throw new ApiError(404, 'delivery.profileNotFound');
  if (requireApproved && dp.status !== 'approved') throw new ApiError(403, 'delivery.notApproved');
  return dp;
}

const register = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['vehicleType', 'vehicleNumber', 'licenseNumber', 'documents', 'bankDetails']);
  const dp = await DeliveryPartner.findOneAndUpdate({ user: req.user._id }, { $set: data, $setOnInsert: { user: req.user._id } }, { new: true, upsert: true });
  return ok(res, dp, 'delivery.registered');
});

const getProfile = asyncHandler(async (req, res) => ok(res, await myProfile(req, { requireApproved: false })));

const setOnline = asyncHandler(async (req, res) => {
  const dp = await myProfile(req);
  dp.isOnline = !!req.body.isOnline;
  if (req.body.lat != null && req.body.lng != null) {
    dp.currentLocation = { type: 'Point', coordinates: [Number(req.body.lng), Number(req.body.lat)] };
    dp.lastLocationAt = new Date();
  }
  await dp.save();
  return ok(res, dp, dp.isOnline ? 'delivery.online' : 'delivery.offline');
});

const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng, heading, speed } = req.body;
  if (lat == null || lng == null) throw new ApiError(400, 'delivery.locationRequired');
  const dp = await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    { currentLocation: { type: 'Point', coordinates: [Number(lng), Number(lat)] }, lastLocationAt: new Date() },
    { new: true }
  );
  if (dp && dp.activeOrder) {
    const order = await Order.findById(dp.activeOrder).select('customer');
    if (order) events.deliveryLocation(dp.activeOrder, order.customer, { lat, lng, heading, speed, at: Date.now() });
  }
  return ok(res, null);
});

const availableOrders = asyncHandler(async (req, res) => {
  const dp = await myProfile(req);
  if (!dp.isOnline) return ok(res, []);
  const cfg = await getConfig();
  const orders = await populateOrder(
    Order.find({
      status: { $in: ['accepted', 'preparing', 'ready'] },
      deliveryPartner: null,
      rejectedByPartners: { $ne: req.user._id },
      $or: [{ 'payment.method': 'cod' }, { 'payment.status': 'paid' }],
    })
      .sort({ createdAt: 1 })
      .limit(50)
  );
  const here = dp.currentLocation && dp.currentLocation.coordinates;
  const radius = cfg.businessRules.radiusKm;
  const result = orders
    .map((o) => {
      const rc = o.restaurant.location && o.restaurant.location.coordinates;
      const pickupKm = here && rc && (here[0] || here[1]) ? round2(haversineKm(here, rc)) : null;
      return {
        _id: o._id,
        orderNumber: o.orderNumber,
        status: o.status,
        restaurant: o.restaurant,
        deliveryAddress: o.deliveryAddress,
        distanceKm: o.distanceKm,
        pickupDistanceKm: pickupKm,
        payout: o.deliveryEarning,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        paymentMethod: o.payment.method,
        collectAmount: o.payment.method === 'cod' ? o.pricing.payable : 0,
        createdAt: o.createdAt,
      };
    })
    .filter((o) => o.pickupDistanceKm == null || o.pickupDistanceKm <= radius);
  return ok(res, { items: result, currencySymbol: cfg.businessRules.currencySymbol });
});

const accept = asyncHandler(async (req, res) => {
  const dp = await myProfile(req);
  if (!dp.isOnline) throw new ApiError(400, 'delivery.mustBeOnline');
  if (dp.activeOrder) throw new ApiError(400, 'delivery.alreadyActive');
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, deliveryPartner: null, status: { $in: ['accepted', 'preparing', 'ready'] } },
    { deliveryPartner: req.user._id },
    { new: true }
  );
  if (!order) throw new ApiError(409, 'delivery.orderTaken');
  dp.activeOrder = order._id;
  await dp.save();
  const full = await loadFull(order._id);
  events.deliveryAssigned(full);
  notifyUser(full.customer._id, { titleKey: 'notif.partnerAssigned', bodyKey: 'notif.partnerAssignedBody', vars: { name: req.user.name, order: full.orderNumber }, type: 'order', data: { orderId: full._id.toString() } }).catch(() => {});
  return ok(res, full, 'delivery.accepted');
});

const reject = asyncHandler(async (req, res) => {
  await myProfile(req);
  await Order.updateOne({ _id: req.params.id }, { $addToSet: { rejectedByPartners: req.user._id } });
  return ok(res, null, 'delivery.rejected');
});

const activeOrder = asyncHandler(async (req, res) => {
  const dp = await myProfile(req, { requireApproved: false });
  if (!dp.activeOrder) return ok(res, null);
  return ok(res, await loadFull(dp.activeOrder));
});

const updateStatus = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const order = await Order.findOne({ _id: req.params.id, deliveryPartner: req.user._id }).select('+deliveryOtp');
  if (!order) throw new ApiError(404, 'order.notFound');
  const { status, otp, photoUrl } = req.body;
  const extra = {};
  if (status === 'delivered') {
    if (cfg.features.deliveryOtp && order.deliveryOtp && String(otp) !== order.deliveryOtp) throw new ApiError(400, 'delivery.invalidOtp');
    if (cfg.features.deliveryPhotoProof && !photoUrl) throw new ApiError(400, 'delivery.photoRequired');
    if (photoUrl) extra.deliveryPhoto = photoUrl;
  }
  const full = await transition(order, status, { actor: 'delivery', by: req.user._id, extra });
  return ok(res, full, 'order.statusUpdated');
});

const history = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { deliveryPartner: req.user._id, status: { $in: ['delivered', 'cancelled'] } };
  const [items, total] = await Promise.all([
    populateOrder(Order.find(q).sort({ updatedAt: -1 }).skip(p.skip).limit(p.limit)),
    Order.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const earnings = asyncHandler(async (req, res) => {
  const dp = await myProfile(req, { requireApproved: false });
  const cfg = await getConfig();
  const days = Math.min(parseInt(req.query.days, 10) || 7, 90);
  const since = new Date(Date.now() - days * 86400000);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [daily, today, txns] = await Promise.all([
    Order.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'delivered', deliveredAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } }, deliveries: { $sum: 1 }, earnings: { $sum: '$deliveryEarning' }, tips: { $sum: '$pricing.tip' } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: { deliveryPartner: req.user._id, status: 'delivered', deliveredAt: { $gte: startOfDay } } },
      { $group: { _id: null, deliveries: { $sum: 1 }, earnings: { $sum: '$deliveryEarning' } } },
    ]),
    Transaction.find({ user: req.user._id, type: { $in: ['delivery_payout'] } }).sort({ createdAt: -1 }).limit(50),
  ]);
  return ok(res, {
    totalEarnings: dp.totalEarnings,
    walletBalance: dp.walletBalance,
    totalDeliveries: dp.totalDeliveries,
    rating: dp.rating,
    today: today[0] || { deliveries: 0, earnings: 0 },
    daily,
    transactions: txns,
    payoutRules: cfg.businessRules.deliveryPartnerPayout,
    currencySymbol: cfg.businessRules.currencySymbol,
  });
});

module.exports = { register, getProfile, setOnline, updateLocation, availableOrders, accept, reject, activeOrder, updateStatus, history, earnings };
