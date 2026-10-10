const router = require('express').Router();
const c = require('../controllers/configController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission } = require('../middleware/roles');
const { param } = require('express-validator');
const { validate, rules } = require('../middleware/validation');

router.use(protect, authorize('admin'));

router.get('/', requirePermission('config'), c.getAdminConfig);
router.put('/theme', requirePermission('config'), validate(rules.configSection), c.updateTheme);
router.put('/branding', requirePermission('config'), validate(rules.configSection), c.updateBranding);
router.put('/layout', requirePermission('config'), validate(rules.layout), c.updateLayout);
router.put('/features', requirePermission('config'), validate(rules.configSection), c.updateFeatures);
router.put('/business', requirePermission('config'), validate(rules.configSection), c.updateBusiness);
router.put('/legal', requirePermission('legal'), validate(rules.configSection), c.updateLegal);
router.put('/maintenance', requirePermission('config'), validate(rules.configSection), c.updateMaintenance);
router.put('/onboarding', requirePermission('config'), validate(rules.configSection), c.updateOnboarding);
router.put('/app-versions', requirePermission('config'), validate(rules.configSection), c.updateAppVersions);
router.put('/languages', requirePermission('translations'), validate(rules.languages), c.updateLanguages);

router.get('/banners', requirePermission('banners'), c.listBanners);
router.post('/banners', requirePermission('banners'), validate(rules.banner), c.createBanner);
router.put('/banners/reorder', requirePermission('banners'), validate(rules.reorder), c.reorderBanners);
router.put('/banners/:id', requirePermission('banners'), validate(rules.bannerUpdate), c.updateBanner);
router.delete('/banners/:id', requirePermission('banners'), validate([rules.objectId()]), c.deleteBanner);

router.get('/translations', requirePermission('translations'), c.listTranslationsAdmin);
router.post('/translations', requirePermission('translations'), validate(rules.translation), c.createTranslation);
router.post('/translations/keys', requirePermission('translations'), validate(rules.translationKey), c.upsertTranslationKey);
router.get('/translations/:code', requirePermission('translations'), c.getTranslationAdmin);
router.put('/translations/:code', requirePermission('translations'), validate(rules.translationUpdate), c.updateTranslation);
router.delete('/translations/:code', requirePermission('translations'), validate([param('code').isString().isLength({ min: 2, max: 16 })]), c.deleteTranslation);

module.exports = router;
