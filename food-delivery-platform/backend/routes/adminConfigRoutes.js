const router = require('express').Router();
const c = require('../controllers/configController');
const { protect } = require('../middleware/auth');
const { authorize, requirePermission } = require('../middleware/roles');
const { validate, rules } = require('../middleware/validation');

router.use(protect, authorize('admin'));

router.get('/', requirePermission('config'), c.getAdminConfig);
router.put('/theme', requirePermission('config'), c.updateTheme);
router.put('/branding', requirePermission('config'), c.updateBranding);
router.put('/layout', requirePermission('config'), c.updateLayout);
router.put('/features', requirePermission('config'), c.updateFeatures);
router.put('/business', requirePermission('config'), c.updateBusiness);
router.put('/legal', requirePermission('legal'), c.updateLegal);
router.put('/maintenance', requirePermission('config'), c.updateMaintenance);
router.put('/onboarding', requirePermission('config'), c.updateOnboarding);
router.put('/app-versions', requirePermission('config'), c.updateAppVersions);
router.put('/languages', requirePermission('translations'), c.updateLanguages);

router.get('/banners', requirePermission('banners'), c.listBanners);
router.post('/banners', requirePermission('banners'), validate(rules.banner), c.createBanner);
router.put('/banners/reorder', requirePermission('banners'), c.reorderBanners);
router.put('/banners/:id', requirePermission('banners'), c.updateBanner);
router.delete('/banners/:id', requirePermission('banners'), c.deleteBanner);

router.get('/translations', requirePermission('translations'), c.listTranslationsAdmin);
router.post('/translations', requirePermission('translations'), validate(rules.translation), c.createTranslation);
router.post('/translations/keys', requirePermission('translations'), c.upsertTranslationKey);
router.get('/translations/:code', requirePermission('translations'), c.getTranslationAdmin);
router.put('/translations/:code', requirePermission('translations'), c.updateTranslation);
router.delete('/translations/:code', requirePermission('translations'), c.deleteTranslation);

module.exports = router;
