const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.use(protect);

// vendor
router.get('/vendor/list', authorize('vendor'), c.vendorOrders);
router.get('/vendor/stats', authorize('vendor'), c.vendorStats);
router.get('/vendor/payouts', authorize('vendor'), c.vendorPayouts);
router.patch('/vendor/:id/status', authorize('vendor'), c.vendorUpdateStatus);

// customer
router.post('/quote', authorize('customer'), c.quote);
router.post('/', authorize('customer'), validate(rules.order), c.createOrder);
router.get('/', authorize('customer'), c.myOrders);
router.get('/active', authorize('customer'), c.activeOrders);
router.get('/:id', c.getOrder);
router.post('/:id/cancel', authorize('customer', 'admin'), c.cancelOrder);
router.get('/:id/reorder', authorize('customer'), c.reorder);

module.exports = router;
