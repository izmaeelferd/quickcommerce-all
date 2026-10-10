const router = require('express').Router();
const c = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.use(protect, authorize('delivery'));
router.post('/register', validate(rules.deliveryRegister), c.register);
router.get('/profile', c.getProfile);
router.patch('/online', validate(rules.online), c.setOnline);
router.post('/location', validate(rules.location), c.updateLocation);
router.get('/available-orders', c.availableOrders);
router.get('/active', c.activeOrder);
router.post('/orders/:id/accept', validate([rules.objectId()]), c.accept);
router.post('/orders/:id/reject', validate([rules.objectId()]), c.reject);
router.patch('/orders/:id/status', validate(rules.deliveryStatus), c.updateStatus);
router.get('/history', c.history);
router.get('/earnings', c.earnings);

module.exports = router;
