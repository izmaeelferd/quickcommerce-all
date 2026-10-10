const router = require('express').Router();
const c = require('../controllers/configController');
const { validate, rules } = require('../middleware/validation');

router.get('/', c.getPublicConfig);
router.get('/translations/:lang?', c.getTranslations);
router.post('/banners/:id/click', validate([rules.objectId()]), c.trackBannerClick);

module.exports = router;
