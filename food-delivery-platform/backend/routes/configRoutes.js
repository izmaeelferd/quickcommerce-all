const router = require('express').Router();
const c = require('../controllers/configController');

router.get('/', c.getPublicConfig);
router.get('/translations/:lang?', c.getTranslations);
router.post('/banners/:id/click', c.trackBannerClick);

module.exports = router;
