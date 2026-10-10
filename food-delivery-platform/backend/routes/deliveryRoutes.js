const router = require('express').Router();
const c = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect, authorize('delivery'));
router.post('/register', c.register);
router.get('/profile', c.getProfile);
router.patch('/online', c.setOnline);
router.post('/location', c.updateLocation);
router.get('/available-orders', c.availableOrders);
router.get('/active', c.activeOrder);
router.post('/orders/:id/accept', c.accept);
router.post('/orders/:id/reject', c.reject);
router.patch('/orders/:id/status', c.updateStatus);
router.get('/history', c.history);
router.get('/earnings', c.earnings);

module.exports = router;
