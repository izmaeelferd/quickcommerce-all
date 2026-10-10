const { validationResult, body, param } = require('express-validator');
const { ApiError } = require('../utils/helpers');

const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    return next(new ApiError(422, 'validation.failed', result.array().map((e) => ({ field: e.path, message: e.msg }))));
  },
];

const rules = {
  register: [
    body('name').trim().notEmpty().withMessage('validation.nameRequired'),
    body('email').optional({ values: 'falsy' }).isEmail().withMessage('validation.emailInvalid'),
    body('phone').optional({ values: 'falsy' }).isLength({ min: 7 }).withMessage('validation.phoneInvalid'),
    body('password').isLength({ min: 6 }).withMessage('validation.passwordMin'),
    body().custom((v) => !!(v.email || v.phone)).withMessage('validation.emailOrPhone'),
  ],
  login: [body('identifier').trim().notEmpty(), body('password').notEmpty()],
  sendOtp: [body('phone').trim().notEmpty()],
  verifyOtp: [body('phone').trim().notEmpty(), body('otp').trim().notEmpty()],
  objectId: (name = 'id') => [param(name).isMongoId().withMessage('validation.invalidId')],
  address: [body('fullAddress').trim().notEmpty()],
  restaurant: [body('name').trim().notEmpty()],
  menuItem: [body('name').trim().notEmpty(), body('price').isFloat({ min: 0 }), body('category').isMongoId()],
  order: [
    body('restaurantId').isMongoId(),
    body('items').isArray({ min: 1 }),
    body('items.*.menuItemId').isMongoId(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('paymentMethod').isString(),
  ],
  coupon: [body('code').trim().notEmpty(), body('discountType').isIn(['percent', 'flat', 'free_delivery'])],
  review: [body('orderId').isMongoId(), body('rating').isInt({ min: 1, max: 5 })],
  translation: [body('code').trim().notEmpty(), body('name').trim().notEmpty()],
  banner: [body('imageUrl').trim().notEmpty()],
};

module.exports = { validate, rules };
