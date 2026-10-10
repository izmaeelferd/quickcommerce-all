const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const { getConfig } = require('../utils/configCache');
const { asyncHandler, ok, ApiError, pick, paginate, paged, escapeRegex } = require('../utils/helpers');

const EDITABLE = [
  'name', 'description', 'logo', 'coverImage', 'images', 'cuisines', 'categories', 'phone', 'email', 'address',
  'isPureVeg', 'priceForTwo', 'avgPrepTimeMinutes', 'timings', 'offerText', 'tags', 'bankDetails', 'licenseNumber', 'gstNumber',
];

const withOpenFlag = (r) => {
  const obj = typeof r.toObject === 'function' ? r.toObject() : r;
  const doc = typeof r.isOpenNow === 'function' ? r : new Restaurant(obj);
  return { ...obj, isOpenNow: doc.isOpenNow() };
};

/**
 * GET /api/restaurants
 * Query: q, lat, lng, radiusKm, cuisine, category, veg, minRating, sort(rating|distance|priceLow|priceHigh|deliveryTime|popular),
 *        featured, page, limit
 */
const listRestaurants = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const p = paginate(req.query);
  const { q, lat, lng, cuisine, category, veg, minRating, sort, featured, maxPriceForTwo } = req.query;
  const filter = { status: 'approved' };
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    const itemRestaurants = await MenuItem.distinct('restaurant', { name: rx, isAvailable: true });
    filter.$or = [{ name: rx }, { cuisines: rx }, { tags: rx }, { _id: { $in: itemRestaurants } }];
  }
  if (cuisine) filter.cuisines = { $in: String(cuisine).split(',').map((c) => new RegExp(`^${escapeRegex(c)}$`, 'i')) };
  if (category && mongoose.isValidObjectId(category)) filter.categories = category;
  if (veg === 'true' && cfg.features.vegOnlyFilter) filter.isPureVeg = true;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (featured === 'true') filter.isFeatured = true;
  if (maxPriceForTwo) filter.priceForTwo = { $lte: Number(maxPriceForTwo) };

  const hasGeo = lat != null && lng != null && lat !== '' && lng !== '';
  const radiusKm = Number(req.query.radiusKm) || cfg.businessRules.radiusKm;
  const sortMap = {
    rating: { rating: -1 },
    priceLow: { priceForTwo: 1 },
    priceHigh: { priceForTwo: -1 },
    deliveryTime: { avgPrepTimeMinutes: 1 },
    popular: { totalOrders: -1 },
    newest: { createdAt: -1 },
  };

  if (hasGeo) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          distanceField: 'distanceMeters',
          maxDistance: radiusKm * 1000,
          query: filter,
          spherical: true,
        },
      },
      { $sort: sort && sortMap[sort] ? { ...sortMap[sort], distanceMeters: 1 } : { isFeatured: -1, distanceMeters: 1 } },
      { $facet: { items: [{ $skip: p.skip }, { $limit: p.limit }], total: [{ $count: 'n' }] } },
    ];
    const [agg] = await Restaurant.aggregate(pipeline);
    const items = agg.items.map((r) => ({ ...withOpenFlag(r), distanceKm: Math.round((r.distanceMeters / 1000) * 10) / 10 }));
    return ok(res, paged(items, agg.total[0] ? agg.total[0].n : 0, p));
  }

  const [items, total] = await Promise.all([
    Restaurant.find(filter).sort(sortMap[sort] || { isFeatured: -1, rating: -1 }).skip(p.skip).limit(p.limit),
    Restaurant.countDocuments(filter),
  ]);
  return ok(res, paged(items.map(withOpenFlag), total, p));
});

const getRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const r = mongoose.isValidObjectId(id) ? await Restaurant.findById(id) : await Restaurant.findOne({ slug: id });
  if (!r || (r.status !== 'approved' && !(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin' || r.owner.equals(req.user._id))))) {
    throw new ApiError(404, 'restaurant.notFound');
  }
  const cfg = await getConfig();
  const offers = cfg.features.coupons
    ? await Coupon.find({ isActive: true, showInOffers: true, $or: [{ restaurant: r._id }, { restaurant: null }], $and: [{ $or: [{ validTo: null }, { validTo: { $gte: new Date() } }] }] })
        .select('code title description discountType value maxDiscount minOrderValue')
        .limit(10)
    : [];
  const isFavorite = !!(req.user && req.user.favorites && req.user.favorites.some((f) => f.toString() === r._id.toString()));
  return ok(res, { ...withOpenFlag(r), offers, isFavorite });
});

const getMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { veg, q } = req.query;
  const categories = await MenuCategory.find({ restaurant: id, isActive: true }).sort({ order: 1, name: 1 }).lean();
  const itemFilter = { restaurant: id };
  if (veg === 'true') itemFilter.isVeg = true;
  if (q) itemFilter.name = new RegExp(escapeRegex(q), 'i');
  const items = await MenuItem.find(itemFilter).sort({ order: 1, name: 1 });
  const grouped = categories.map((c) => ({ ...c, items: items.filter((i) => i.category.toString() === c._id.toString()) }));
  const recommended = items.filter((i) => i.isBestseller && i.isAvailable).slice(0, 10);
  return ok(res, { categories: grouped.filter((g) => g.items.length > 0 || !q), recommended });
});

const getRestaurantReviews = asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const q = { restaurant: req.params.id, isVisible: true };
  const [items, total] = await Promise.all([
    Review.find(q).populate('user', 'name avatar').sort({ createdAt: -1 }).skip(p.skip).limit(p.limit),
    Review.countDocuments(q),
  ]);
  return ok(res, paged(items, total, p));
});

/* -------- Vendor-owned -------- */
const getMyRestaurant = asyncHandler(async (req, res) => {
  const r = await Restaurant.findOne({ owner: req.user._id }).populate('categories', 'name');
  return ok(res, r ? withOpenFlag(r) : null);
});

const createRestaurant = asyncHandler(async (req, res) => {
  if (req.user.role === 'vendor' && (await Restaurant.exists({ owner: req.user._id }))) throw new ApiError(409, 'restaurant.alreadyExists');
  const data = pick(req.body, EDITABLE);
  if (req.body.lat != null && req.body.lng != null) data.location = { type: 'Point', coordinates: [Number(req.body.lng), Number(req.body.lat)] };
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  const owner = isAdmin && req.body.owner ? req.body.owner : req.user._id;
  if (isAdmin) Object.assign(data, pick(req.body, ['status', 'commissionPercent', 'isFeatured']));
  const r = await Restaurant.create({ ...data, owner });
  return ok(res, r, 'restaurant.created', 201);
});

const loadOwned = async (req) => {
  const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
  const r = req.params.id ? await Restaurant.findById(req.params.id) : await Restaurant.findOne({ owner: req.user._id });
  if (!r) throw new ApiError(404, 'restaurant.notFound');
  if (!isAdmin && !r.owner.equals(req.user._id)) throw new ApiError(403, 'auth.forbidden');
  return { r, isAdmin };
};

const updateRestaurant = asyncHandler(async (req, res) => {
  const { r, isAdmin } = await loadOwned(req);
  const data = pick(req.body, EDITABLE);
  if (req.body.lat != null && req.body.lng != null) data.location = { type: 'Point', coordinates: [Number(req.body.lng), Number(req.body.lat)] };
  if (isAdmin) Object.assign(data, pick(req.body, ['status', 'statusReason', 'commissionPercent', 'isFeatured']));
  Object.assign(r, data);
  await r.save();
  return ok(res, withOpenFlag(r), 'restaurant.updated');
});

/** Vendor toggles open/closed + accepting orders. */
const updateStatus = asyncHandler(async (req, res) => {
  const { r } = await loadOwned(req);
  if (req.body.isOpen !== undefined) r.isOpen = !!req.body.isOpen;
  if (req.body.acceptingOrders !== undefined) r.acceptingOrders = !!req.body.acceptingOrders;
  await r.save();
  return ok(res, withOpenFlag(r), 'restaurant.statusUpdated');
});

const updateTimings = asyncHandler(async (req, res) => {
  const { r } = await loadOwned(req);
  if (!Array.isArray(req.body.timings)) throw new ApiError(422, 'validation.failed');
  r.timings = req.body.timings;
  await r.save();
  return ok(res, withOpenFlag(r), 'restaurant.timingsUpdated');
});

module.exports = {
  listRestaurants,
  getRestaurant,
  getMenu,
  getRestaurantReviews,
  getMyRestaurant,
  createRestaurant,
  updateRestaurant,
  updateStatus,
  updateTimings,
  withOpenFlag,
};
