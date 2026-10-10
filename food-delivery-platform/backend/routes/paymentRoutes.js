const router = require('express').Router();
const c = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.post('/webhook/:provider', c.webhook);
router.post('/create-intent', protect, validate(rules.createIntent), c.createIntent);
router.post('/verify', protect, validate(rules.verifyPayment), c.verify);
router.get('/history', protect, c.history);
router.post('/refund', protect, authorize('admin'), validate(rules.refund), c.refund);

module.exports = router;
