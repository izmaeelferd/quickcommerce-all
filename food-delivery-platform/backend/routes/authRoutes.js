const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate, rules } = require('../middleware/validation');

router.post('/register', authLimiter, validate(rules.register), c.register);
router.post('/login', authLimiter, validate(rules.login), c.login);
router.post('/send-otp', authLimiter, validate(rules.sendOtp), c.sendOtp);
router.post('/verify-otp', authLimiter, validate(rules.verifyOtp), c.verifyOtp);
router.post('/forgot-password', authLimiter, validate(rules.forgotPassword), c.forgotPassword);
router.post('/reset-password', authLimiter, validate(rules.resetPassword), c.resetPassword);
router.post('/refresh-token', authLimiter, validate(rules.refreshToken), c.refreshToken);
router.post('/google-signin', authLimiter, validate(rules.googleSignIn), c.googleSignIn);
router.post('/apple-signin', authLimiter, validate(rules.appleSignIn), c.appleSignIn);
router.post('/logout', protect, validate(rules.logout), c.logout);
router.get('/me', protect, c.me);

module.exports = router;
