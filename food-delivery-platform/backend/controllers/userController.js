const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Transaction = require('../models/Transaction');
const { getConfig } = require('../utils/configCache');
const { asyncHandler, ok, ApiError, pick, paginate, paged } = require('../utils/helpers');

const getProfile = asyncHandler(async (req, res) => ok(res, req.user));

const updateProfile = asyncHandler(async (req, res) => {
  const data = pick(req.body, ['name', 'email', 'phone', 'avatar', 'language', 'notificationPrefs']);
  Object.assign(req.user, data);
  await req.user.save();
  return ok(res, req.user, 'profile.updated');
});

const deleteAccount = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const active = ['placed', 'accepted', 'preparing', 'ready', 'picked'];
  if (await Order.exists({ $or: [{ customer: req.user._id }, { deliveryPartner: req.user._id }], status: { $in: active } })) throw new ApiError(400, 'profile.hasActiveOrders');
  if (['admin', 'superadmin'].includes(req.user.role)) throw new ApiError(400, 'profile.adminCannotDelete');
  await User.deleteOne({ _id: req.user._id });
  return ok(res, null, 'profile.deleted');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) throw new ApiError(422, 'validation.passwordMin');
  const user = await User.findById(req.user._id).select('+password');
  if (user.password && !(await user.comparePassword(currentPassword || ''))) throw new ApiError(400, 'auth.wrongPassword');
  user.password = newPassword;
  await user.save();
  return ok(res, null, 'auth.passwordChanged');
});

const registerFcmToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'push.tokenRequired');
  await User.updateOne({ _id: req.user._id }, { $addToSet: { fcmTokens: token } });
  return ok(res, null, 'push.tokenSaved');
});

/* -------- Addresses -------- */
const normalizeAddress = (body) => {
  const a = pick(body, ['label', 'fullAddress', 'landmark', 'city', 'state', 'pincode', 'contactName', 'contactPhone', 'isDefault']);
  if (body.lat != null && body.lng != null) a.location = { type: 'Point', coordinates: [Number(body.lng), Number(body.lat)] };
  else if (body.location && body.location.coordinates) a.location = body.location;
  return a;
};

const listAddresses = asyncHandler(async (req, res) => ok(res, req.user.addresses));

const addAddress = asyncHandler(async (req, res) => {
  const addr = normalizeAddress(req.body);
  if (addr.isDefault || req.user.addresses.length === 0) {
    req.user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addr.isDefault = true;
  }
  req.user.addresses.push(addr);
  await req.user.save();
  return ok(res, req.user.addresses, 'address.added', 201);
});

const updateAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, 'address.notFound');
  const data = normalizeAddress(req.body);
  if (data.isDefault) req.user.addresses.forEach((a) => { a.isDefault = false; });
  Object.assign(addr, data);
  await req.user.save();
  return ok(res, req.user.addresses, 'address.updated');
});

const deleteAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, 'address.notFound');
  const wasDefault = addr.isDefault;
  addr.deleteOne();
  if (wasDefault && req.user.addresses.length) req.user.addresses[0].isDefault = true;
  await req.user.save();
  return ok(res, req.user.addresses, 'address.deleted');
});

/* -------- Favorites -------- */
const ensureFeature = async (flag) => {
  const cfg = await getConfig();
  if (!cfg.features[flag]) throw new ApiError(403, 'feature.disabled');
  return cfg;
};

const listFavorites = asyncHandler(async (req, res) => {
  await ensureFeature('favorites');
  const user = await User.findById(req.user._id).populate({ path: 'favorites', match: { status: 'approved' } });
  return ok(res, user.favorites);
});

const toggleFavorite = asyncHandler(async (req, res) => {
  await ensureFeature('favorites');
  const id = req.params.restaurantId;
  if (!(await Restaurant.exists({ _id: id }))) throw new ApiError(404, 'restaurant.notFound');
  const has = req.user.favorites.some((f) => f.toString() === id);
  await User.updateOne({ _id: req.user._id }, has ? { $pull: { favorites: id } } : { $addToSet: { favorites: id } });
  return ok(res, { restaurantId: id, isFavorite: !has }, has ? 'favorite.removed' : 'favorite.added');
});

/* -------- Wallet & referral -------- */
const getWallet = asyncHandler(async (req, res) => {
  const cfg = await ensureFeature('wallet');
  const p = paginate(req.query);
  const q = { user: req.user._id, type: { $in: ['wallet_credit', 'wallet_debit', 'referral_bonus', 'refund'] } };
  const [items, total] = await Promise.all([Transaction.find(q).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit), Transaction.countDocuments(q)]);
  return ok(res, {
    balance: req.user.walletBalance,
    maxUsePercent: cfg.businessRules.walletMaxUsePercent,
    currencySymbol: cfg.businessRules.currencySymbol,
    ...paged(items, total, p),
  });
});

const getReferral = asyncHandler(async (req, res) => {
  const cfg = await ensureFeature('referral');
  const [referredCount, earned] = await Promise.all([
    User.countDocuments({ referredBy: req.user._id }),
    Transaction.aggregate([
      { $match: { user: req.user._id, type: 'referral_bonus' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  return ok(res, {
    referralCode: req.user.referralCode,
    referralBonus: cfg.businessRules.referralBonus,
    refereeBonus: cfg.businessRules.refereeBonus,
    currencySymbol: cfg.businessRules.currencySymbol,
    referredCount,
    totalEarned: earned[0] ? earned[0].total : 0,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  changePassword,
  registerFcmToken,
  listAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  listFavorites,
  toggleFavorite,
  getWallet,
  getReferral,
};
