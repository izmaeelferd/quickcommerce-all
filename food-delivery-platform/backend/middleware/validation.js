const { validationResult, body, param } = require('express-validator');
const { ApiError } = require('../utils/helpers');

/** Runs the given express-validator chains and turns failures into a 422 ApiError. */
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    return next(new ApiError(422, 'validation.failed', result.array().map((e) => ({ field: e.path, message: e.msg }))));
  },
];

const ROLES_SELF = ['customer', 'vendor', 'delivery'];
const ORDER_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled', 'rejected'];
const PAYMENT_METHODS = ['card', 'upi', 'wallet', 'cod', 'netbanking'];
const ACCOUNT_STATUSES = ['pending', 'approved', 'suspended', 'rejected'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const id = (name = 'id') => param(name).isMongoId().withMessage('validation.invalidId');
const optStr = (f, max = 500) => body(f).optional({ values: 'null' }).isString().isLength({ max });
const optNum = (f, min = 0, max) => body(f).optional({ values: 'null' }).isFloat({ min, ...(max !== undefined ? { max } : {}) }).withMessage('validation.number');
const optBool = (f) => body(f).optional().isBoolean().withMessage('validation.failed');
const reqBool = (f) => body(f).isBoolean().withMessage('validation.failed');
const latLng = [body('lat').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }), body('lng').optional({ values: 'null' }).isFloat({ min: -180, max: 180 })];
const idsArray = [body('ids').isArray({ max: 500 }), body('ids.*').isMongoId()];
const cartItems = [
  body('restaurantId').isMongoId(),
  body('items').isArray({ min: 1, max: 100 }),
  body('items.*.menuItemId').isMongoId(),
  body('items.*.quantity').isInt({ min: 1, max: 99 }),
  body('items.*.addOns').optional().isArray(),
  body('items.*.instructions').optional().isString().isLength({ max: 300 }),
  body('couponCode').optional({ values: 'null' }).isString().isLength({ max: 40 }),
  body('tip').optional().isFloat({ min: 0 }),
  body('useWallet').optional().isBoolean(),
  body('addressId').optional({ values: 'null' }).isMongoId(),
];

const rules = {
  objectId: id,
  // ---------- auth ----------
  register: [
    body('name').trim().notEmpty().withMessage('validation.nameRequired').isLength({ max: 100 }),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('validation.emailInvalid'),
    body('phone').optional({ values: 'falsy' }).isString().isLength({ min: 7, max: 20 }).withMessage('validation.phoneInvalid'),
    body('password').isString().isLength({ min: 6, max: 128 }).withMessage('validation.passwordMin'),
    body('role').optional().isIn(ROLES_SELF),
    body().custom((v) => !!(v.email || v.phone)).withMessage('validation.emailOrPhone'),
  ],
  login: [body('identifier').isString().trim().notEmpty(), body('password').isString().notEmpty(), body('role').optional().isString()],
  sendOtp: [body('phone').isString().trim().isLength({ min: 7, max: 20 }).withMessage('validation.phoneInvalid'), body('role').optional().isIn(ROLES_SELF)],
  verifyOtp: [body('phone').isString().trim().notEmpty(), body('otp').isString().trim().isLength({ min: 3, max: 10 }), optStr('name', 100)],
  forgotPassword: [body('identifier').isString().trim().notEmpty()],
  resetPassword: [body('identifier').isString().trim().notEmpty(), body('code').isString().trim().notEmpty(), body('password').isString().isLength({ min: 6, max: 128 }).withMessage('validation.passwordMin')],
  refreshToken: [body('refreshToken').isString().notEmpty()],
  logout: [optStr('refreshToken', 2048), optStr('fcmToken', 4096)],
  markRead: [body('ids').optional().isArray({ max: 500 }), body('ids.*').optional().isMongoId()],
  googleSignIn: [body('idToken').isString().notEmpty(), body('role').optional().isIn(ROLES_SELF)],
  appleSignIn: [body('identityToken').isString().notEmpty(), optStr('name', 100), body('role').optional().isIn(ROLES_SELF)],
  // ---------- users ----------
  profile: [optStr('name', 100), body('email').optional({ values: 'falsy' }).isEmail().withMessage('validation.emailInvalid'), optStr('phone', 20), optStr('avatar', 1000), optStr('language', 10), body('notificationPrefs').optional().isObject()],
  changePassword: [body('newPassword').isString().isLength({ min: 6, max: 128 }).withMessage('validation.passwordMin'), optStr('currentPassword', 128)],
  fcmToken: [body('token').isString().isLength({ min: 10, max: 4096 })],
  address: [body('fullAddress').isString().trim().notEmpty().isLength({ max: 500 }), optStr('label', 40), optStr('landmark', 200), optStr('city', 100), optStr('pincode', 20), optStr('contactName', 100), optStr('contactPhone', 20), optBool('isDefault'), ...latLng],
  addressUpdate: [id('addressId'), body('fullAddress').optional().isString().trim().notEmpty().isLength({ max: 500 }), optBool('isDefault'), ...latLng],
  // ---------- restaurants & menu ----------
  restaurant: [body('name').isString().trim().notEmpty().isLength({ max: 120 }), optNum('priceForTwo'), optNum('avgPrepTimeMinutes'), optNum('commissionPercent', 0, 100), body('cuisines').optional().isArray(), ...latLng],
  restaurantUpdate: [body('name').optional().isString().trim().notEmpty().isLength({ max: 120 }), optNum('priceForTwo'), optNum('avgPrepTimeMinutes'), optNum('commissionPercent', 0, 100), body('cuisines').optional().isArray(), body('status').optional().isIn(ACCOUNT_STATUSES), ...latLng],
  restaurantStatus: [optBool('isOpen'), optBool('acceptingOrders')],
  timings: [body('timings').isArray({ max: 7 }), body('timings.*.day').isInt({ min: 0, max: 6 }), body('timings.*.open').matches(HHMM), body('timings.*.close').matches(HHMM), body('timings.*.closed').optional().isBoolean()],
  menuCategory: [body('name').isString().trim().notEmpty().isLength({ max: 80 }), optStr('description', 300), optBool('isActive')],
  menuCategoryUpdate: [id(), body('name').optional().isString().trim().notEmpty().isLength({ max: 80 }), optBool('isActive')],
  reorder: idsArray,
  menuItem: [body('name').isString().trim().notEmpty().isLength({ max: 120 }), body('price').isFloat({ min: 0 }), body('category').isMongoId(), optNum('discountPrice'), body('addOns').optional().isArray({ max: 20 }), optBool('isVeg'), optBool('isAvailable')],
  menuItemUpdate: [id(), body('name').optional().isString().trim().notEmpty(), optNum('price'), optNum('discountPrice'), body('category').optional().isMongoId(), body('addOns').optional().isArray({ max: 20 })],
  availability: [id(), optBool('isAvailable')],
  addOns: [id(), body('addOns').isArray({ max: 20 }), body('addOns.*.name').isString().notEmpty(), body('addOns.*.options').isArray()],
  // ---------- orders & payments ----------
  quote: cartItems,
  order: [...cartItems, body('paymentMethod').isIn(PAYMENT_METHODS), body('scheduledFor').optional({ values: 'null' }).isISO8601(), optStr('deliverySlot', 40), optStr('instructions', 500)],
  cancel: [id(), optStr('reason', 300)],
  vendorStatus: [id(), body('status').isIn(['accepted', 'rejected', 'preparing', 'ready', 'cancelled']), optStr('reason', 300)],
  createIntent: [body('orderId').optional().isMongoId(), body('purpose').optional().isIn(['wallet_topup']), body('amount').optional().isFloat({ min: 1 }), body().custom((v) => !!(v.orderId || v.purpose)).withMessage('validation.failed')],
  verifyPayment: [body('intentId').isString().notEmpty(), body('orderId').optional().isMongoId(), optStr('paymentId', 200), optStr('signature', 200)],
  refund: [body('orderId').optional().isMongoId(), param('orderId').optional().isMongoId(), optNum('amount'), optBool('toWallet')],
  // ---------- coupons & reviews ----------
  coupon: [body('code').isString().trim().notEmpty().isLength({ max: 40 }), body('discountType').isIn(['percent', 'flat', 'free_delivery']), optNum('value'), optNum('maxDiscount'), optNum('minOrderValue'), body('restaurant').optional({ values: 'falsy' }).isMongoId()],
  couponUpdate: [id(), body('discountType').optional().isIn(['percent', 'flat', 'free_delivery']), optNum('value'), optNum('maxDiscount'), optNum('minOrderValue')],
  couponValidate: [body('code').isString().notEmpty(), body('restaurantId').optional().isMongoId(), optNum('subtotal')],
  review: [body('orderId').isMongoId(), body('rating').isInt({ min: 1, max: 5 }), body('deliveryRating').optional({ values: 'null' }).isInt({ min: 1, max: 5 }), optStr('comment', 2000), body('images').optional().isArray({ max: 6 })],
  reviewReply: [id(), body('text').isString().trim().notEmpty().isLength({ max: 1000 })],
  reviewVisibility: [id(), reqBool('isVisible')],
  // ---------- delivery ----------
  deliveryRegister: [body('vehicleType').optional().isIn(['bicycle', 'bike', 'scooter', 'car']), optStr('vehicleNumber', 30), optStr('licenseNumber', 50), body('bankDetails').optional().isObject()],
  online: [reqBool('isOnline'), ...latLng],
  location: [body('lat').isFloat({ min: -90, max: 90 }), body('lng').isFloat({ min: -180, max: 180 }), body('heading').optional({ values: 'null' }).isFloat(), body('speed').optional({ values: 'null' }).isFloat()],
  deliveryStatus: [id(), body('status').isIn(['picked', 'delivered']), optStr('otp', 10), optStr('photoUrl', 1000)],
  // ---------- admin ----------
  adminUser: [body('name').isString().trim().notEmpty(), body('role').optional().isIn(['admin', 'vendor', 'delivery', 'customer']), body('password').isString().isLength({ min: 6, max: 128 }).withMessage('validation.passwordMin'), body('email').optional({ values: 'falsy' }).isEmail(), body('adminRole').optional({ values: 'falsy' }).isMongoId(), body().custom((v) => !!(v.email || v.phone)).withMessage('validation.emailOrPhone')],
  adminUserUpdate: [id(), body('email').optional({ values: 'falsy' }).isEmail(), body('role').optional().isIn(['admin', 'vendor', 'delivery', 'customer', 'superadmin']), body('adminRole').optional({ values: 'falsy' }).isMongoId(), body('password').optional({ values: 'falsy' }).isLength({ min: 6, max: 128 })],
  ban: [id(), reqBool('banned'), optStr('reason', 300)],
  walletAdjust: [id(), body('amount').isFloat().custom((v) => Number(v) !== 0).withMessage('wallet.invalidAmount'), optStr('reason', 300)],
  accountStatus: [id(), body('status').isIn(ACCOUNT_STATUSES), optStr('reason', 300)],
  commission: [id(), body('commissionPercent').optional({ values: 'null' }).custom((v) => v === '' || (Number(v) >= 0 && Number(v) <= 100)).withMessage('validation.number')],
  globalCommission: [body('commissionPercent').isFloat({ min: 0, max: 100 })],
  category: [body('name').isString().trim().notEmpty().isLength({ max: 80 }), body('type').optional().isIn(['category', 'cuisine']), optStr('image', 1000), optStr('nameKey', 120), optNum('order')],
  categoryUpdate: [id(), body('name').optional().isString().trim().notEmpty(), body('type').optional().isIn(['category', 'cuisine'])],
  assign: [id(), body('partnerUserId').isMongoId()],
  adminOrderStatus: [id(), body('status').isIn(ORDER_STATUSES), optStr('reason', 300)],
  payout: [body('kind').isIn(['vendor', 'delivery']), body('id').isMongoId(), body('amount').isFloat({ min: 0.01 }), optStr('reference', 120)],
  notify: [body('title').isString().trim().notEmpty().isLength({ max: 120 }).withMessage('validation.titleRequired'), optStr('body', 1000), body('audience').optional().isIn(['all', 'customer', 'vendor', 'delivery']), body('channels').optional().isArray(), body('channels.*').optional().isIn(['push', 'inapp', 'email', 'sms']), body('userIds').optional().isArray({ max: 1000 }), body('userIds.*').optional().isMongoId()],
  role: [body('name').isString().trim().notEmpty().isLength({ max: 60 }), body('permissions').optional().isArray()],
  roleUpdate: [id(), body('name').optional().isString().trim().notEmpty(), body('permissions').optional().isArray()],
  // ---------- config ----------
  configSection: [body().custom((v) => v !== null && typeof v === 'object' && !Array.isArray(v)).withMessage('config.invalidPayload')],
  layout: [body().custom((v) => Array.isArray(v) || Array.isArray(v && v.homeLayout)).withMessage('config.layoutMustBeArray')],
  languages: [body('languages').optional().isArray(), body('languages.*').optional().isString().isLength({ min: 2, max: 10 }), body('defaultLanguage').optional().isString().isLength({ min: 2, max: 10 })],
  banner: [body('imageUrl').isString().trim().notEmpty().isLength({ max: 1000 }), body('linkType').optional().isIn(['none', 'restaurant', 'category', 'cuisine', 'url', 'coupon']), body('placement').optional().isIn(['home', 'offers', 'restaurant', 'cart']), body('startDate').optional({ values: 'null' }).isISO8601(), body('endDate').optional({ values: 'null' }).isISO8601()],
  bannerUpdate: [id(), body('imageUrl').optional().isString().notEmpty(), body('linkType').optional().isIn(['none', 'restaurant', 'category', 'cuisine', 'url', 'coupon']), body('startDate').optional({ values: 'null' }).isISO8601(), body('endDate').optional({ values: 'null' }).isISO8601()],
  translation: [body('code').isString().trim().matches(/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/i), body('name').isString().trim().notEmpty(), body('strings').optional().isObject()],
  translationUpdate: [body('strings').optional().isObject(), optBool('isRTL'), optBool('isActive')],
  translationKey: [body('key').isString().trim().matches(/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)+$/), body('values').optional().isObject()],
};

module.exports = { validate, rules };
