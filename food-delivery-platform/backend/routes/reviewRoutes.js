const router = require('express').Router();
const c = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.get('/restaurant/:restaurantId', c.listByRestaurant);
router.post('/', protect, authorize('customer'), validate(rules.review), c.create);
router.get('/mine', protect, c.myReviews);
router.get('/vendor', protect, authorize('vendor'), c.vendorReviews);
router.post('/:id/reply', protect, authorize('vendor', 'admin'), c.reply);
router.patch('/:id/visibility', protect, authorize('admin'), c.setVisibility);

module.exports = router;
