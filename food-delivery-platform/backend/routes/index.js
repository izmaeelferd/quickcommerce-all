const router = require('express').Router();
const { health } = require('../controllers/configController');

router.get('/health', health);
router.use('/config', require('./configRoutes'));
router.use('/admin/config', require('./adminConfigRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/restaurants', require('./restaurantRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/menu', require('./menuRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/payments', require('./paymentRoutes'));
router.use('/coupons', require('./couponRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/delivery', require('./deliveryRoutes'));
router.use('/upload', require('./uploadRoutes'));
router.use('/notifications', require('./notificationRoutes'));

module.exports = router;
