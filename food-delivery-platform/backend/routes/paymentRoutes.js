const router = require('express').Router();
const c = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.post('/webhook/:provider', c.webhook);
router.post('/create-intent', protect, c.createIntent);
router.post('/verify', protect, c.verify);
router.get('/history', protect, c.history);
router.post('/refund', protect, authorize('admin'), c.refund);

module.exports = router;
