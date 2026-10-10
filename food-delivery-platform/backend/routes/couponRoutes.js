const router = require('express').Router();
const c = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.get('/available', c.listAvailable);
router.post('/validate', protect, validate(rules.couponValidate), c.validate);

router.get('/', protect, authorize('admin', 'vendor'), c.list);
router.post('/', protect, authorize('admin', 'vendor'), validate(rules.coupon), c.create);
router.put('/:id', protect, authorize('admin', 'vendor'), validate(rules.couponUpdate), c.update);
router.delete('/:id', protect, authorize('admin', 'vendor'), validate([rules.objectId()]), c.remove);

module.exports = router;
