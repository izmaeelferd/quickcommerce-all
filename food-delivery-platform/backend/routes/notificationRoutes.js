const router = require('express').Router();
const c = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validate, rules } = require('../middleware/validation');

router.use(protect);
router.get('/', c.listMine);
router.post('/read', validate(rules.markRead), c.markRead);

module.exports = router;
