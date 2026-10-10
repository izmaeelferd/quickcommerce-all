const router = require('express').Router();
const c = require('../controllers/restaurantController');
const { protect, optionalAuth } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

// vendor-owned (must precede /:id)
router.get('/mine/details', protect, authorize('vendor'), c.getMyRestaurant);
router.put('/mine/details', protect, authorize('vendor'), validate(rules.restaurantUpdate), c.updateRestaurant);
router.patch('/mine/status', protect, authorize('vendor'), validate(rules.restaurantStatus), c.updateStatus);
router.put('/mine/timings', protect, authorize('vendor'), validate(rules.timings), c.updateTimings);

router.get('/', optionalAuth, c.listRestaurants);
router.post('/', protect, authorize('vendor', 'admin'), validate(rules.restaurant), c.createRestaurant);
router.get('/:id', optionalAuth, c.getRestaurant);
router.get('/:id/menu', c.getMenu);
router.get('/:id/reviews', c.getRestaurantReviews);
router.put('/:id', protect, authorize('vendor', 'admin'), validate([rules.objectId(), ...rules.restaurantUpdate]), c.updateRestaurant);
router.patch('/:id/status', protect, authorize('vendor', 'admin'), validate([rules.objectId(), ...rules.restaurantStatus]), c.updateStatus);

module.exports = router;
