const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { getConfig } = require('../utils/configCache');
const { calculateCouponDiscount } = require('../utils/pricing');
const { asyncHandler, ok, ApiError, pick, paginate, paged } = require('../utils/helpers');

const FIELDS = ['code', 'title', 'description', 'discountType', 'value', 'maxDiscount', 'minOrderValue', 'validFrom', 'validTo', 'usageLimit', 'perUserLimit', 'restaurant', 'firstOrderOnly', 'isActive', 'showInOffers', 'bannerImage'];

/** Throws ApiError when the coupon cannot be applied; returns the coupon doc otherwise. */
async function validateCouponFor({ code, user, restaurantId, subtotal }) {
  const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });
  const now = new Date();
  if (!coupon || !coupon.isActive) throw new ApiError(400, 'coupon.invalid');
  if (coupon.validFrom && coupon.validFrom > now) throw new ApiError(400, 'coupon.notStarted');
  if (coupon.validTo && coupon.validTo < now) throw new ApiError(400, 'coupon.expired');
  if (coupon.restaurant && restaurantId && coupon.restaurant.toString() !== restaurantId.toString()) throw new ApiError(400, 'coupon.notApplicable');
  if (subtotal < (coupon.minOrderValue || 0)) throw new ApiError(400, 'coupon.minOrder', { minOrderValue: coupon.minOrderValue });
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'coupon.exhausted');
  const used = (coupon.usedBy.find((u) => u.user.toString() === user._id.toString()) || {}).count || 0;
  if (coupon.perUserLimit != null && used >= coupon.perUserLimit) throw new ApiError(400, 'coupon.alreadyUsed');
  if (coupon.firstOrderOnly && (await Order.exists({ customer: user._id, status: { $nin: ['cancelled', 'rejected'] } }))) throw new ApiError(400, 'coupon.firstOrderOnly');
  return coupon;
}

const ensureEnabled = async () => {
  const cfg = await getConfig();
  if (!cfg.features.coupons) throw new ApiError(403, 'feature.disabled');
  return cfg;
};

const listAvailable = asyncHandler(async (req, res) => {
  await ensureEnabled();
  const now = new Date();
  const q = {
    isActive: true,
    showInOffers: true,
    $and: [{ $or: [{ validTo: null }, { validTo: { $gte: now } }] }, { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] }],
  };
  if (req.query.restaurantId) q.$and.push({ $or: [{ restaurant: null }, { restaurant: req.query.restaurantId }] });
  const coupons = await Coupon.find(q).select('-usedBy').populate('restaurant', 'name logo').sort({ createdAt: -1 }).limit(50);
  return ok(res, coupons);
});

const validate = asyncHandler(async (req, res) => {
  await ensureEnabled();
  const { code, restaurantId, subtotal } = req.body;
  const coupon = await validateCouponFor({ code, user: req.user, restaurantId, subtotal: Number(subtotal) || 0 });
  const { discount, freeDelivery } = calculateCouponDiscount(coupon, Number(subtotal) || 0);
  return ok(res, { code: coupon.code, title: coupon.title, discount, freeDelivery }, 'coupon.applied');
});

/* -------- Admin / vendor CRUD -------- */
const scopeFilter = async (req) => {
  if (req.user.role === 'vendor') {
    const Restaurant = require('../models/Restaurant');
    const r = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (!r) throw new ApiError(404, 'restaurant.notFound');
    return { restaurant: r._id };
  }
  return {};
};

const list = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { ...(await scopeFilter(req)) };
  if (req.query.q) q.code = new RegExp(String(req.query.q).toUpperCase());
  const [items, total] = await Promise.all([
    Coupon.find(q).select('-usedBy').populate('restaurant', 'name').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Coupon.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

const create = asyncHandler(async (req, res) => {
  const scope = await scopeFilter(req);
  const coupon = await Coupon.create({ ...pick(req.body, FIELDS), ...scope, createdBy: req.user._id });
  return ok(res, coupon, 'coupon.created', 201);
});

const update = asyncHandler(async (req, res) => {
  const scope = await scopeFilter(req);
  const data = pick(req.body, FIELDS);
  if (scope.restaurant) delete data.restaurant;
  const coupon = await Coupon.findOneAndUpdate({ _id: req.params.id, ...scope }, data, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, 'coupon.notFound');
  return ok(res, coupon, 'coupon.updated');
});

const remove = asyncHandler(async (req, res) => {
  const scope = await scopeFilter(req);
  await Coupon.deleteOne({ _id: req.params.id, ...scope });
  return ok(res, null, 'coupon.deleted');
});

module.exports = { validateCouponFor, listAvailable, validate, list, create, update, remove };
