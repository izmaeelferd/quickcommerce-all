const AppConfig = require('../models/AppConfig');
const Banner = require('../models/Banner');
const Translation = require('../models/Translation');
const Category = require('../models/Category');
const { getConfig, invalidateConfig } = require('../utils/configCache');
const { clearTranslationCache } = require('../utils/i18n');
const { asyncHandler, ok, ApiError, toDotPaths, isPlainObject } = require('../utils/helpers');
const env = require('../config/env');
const payments = require('../config/payments');
const { normalizeLayout } = require('../utils/layoutSections');

let io = null;
const attachIo = (socketServer) => {
  io = socketServer;
};

const broadcastConfigChange = (section) => {
  if (io) io.emit('config:updated', { section, at: Date.now() });
};

async function updateSection(req, section, payload, { replace = false } = {}) {
  if (!isPlainObject(payload) && !Array.isArray(payload)) throw new ApiError(400, 'config.invalidPayload');
  const update = replace || Array.isArray(payload) ? { [section]: payload } : toDotPaths(payload, section);
  update.updatedBy = req.user._id;
  await AppConfig.findOneAndUpdate({ key: 'main' }, { $set: update, $inc: { version: 1 } }, { upsert: true, new: true, runValidators: true });
  invalidateConfig();
  broadcastConfigChange(section);
  const cfg = await getConfig({ fresh: true });
  return cfg[section];
}

/** GET /api/config — public, full runtime configuration consumed by every app. */
const getPublicConfig = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const banners = await Banner.activeQuery().lean();
  const categories = await Category.find({ isActive: true }).sort({ order: 1 }).lean();
  const languages = await Translation.find({ code: { $in: cfg.languages }, isActive: true })
    .select('code name nativeName isRTL')
    .lean();
  res.set('Cache-Control', 'no-cache');
  return ok(res, {
    ...cfg,
    banners,
    categories: categories.filter((c) => c.type === 'category'),
    cuisines: categories.filter((c) => c.type === 'cuisine'),
    languageMeta: languages,
    payment: { provider: payments.provider(), publicKey: payments.publicKey() },
    serverTime: new Date().toISOString(),
  });
});

const getAdminConfig = asyncHandler(async (req, res) => ok(res, await getConfig({ fresh: true })));

const sectionUpdater = (section, opts) =>
  asyncHandler(async (req, res) => ok(res, await updateSection(req, section, req.body, opts), 'config.updated'));

const updateTheme = sectionUpdater('theme');
const updateBranding = sectionUpdater('branding');
const updateFeatures = sectionUpdater('features');
const updateBusiness = sectionUpdater('businessRules');
const updateLegal = sectionUpdater('legal');
const updateMaintenance = sectionUpdater('maintenance');
const updateOnboarding = sectionUpdater('onboarding');
const updateAppVersions = sectionUpdater('appVersions');

const updateLayout = asyncHandler(async (req, res) => {
  const sections = normalizeLayout(Array.isArray(req.body) ? req.body : req.body.homeLayout);
  return ok(res, await updateSection(req, 'homeLayout', sections, { replace: true }), 'config.updated');
});

const updateLanguages = asyncHandler(async (req, res) => {
  const { languages, defaultLanguage } = req.body;
  const set = {};
  if (Array.isArray(languages)) set.languages = languages;
  if (defaultLanguage) set.defaultLanguage = defaultLanguage;
  set.updatedBy = req.user._id;
  await AppConfig.findOneAndUpdate({ key: 'main' }, { $set: set, $inc: { version: 1 } }, { upsert: true });
  invalidateConfig();
  clearTranslationCache();
  broadcastConfigChange('languages');
  const cfg = await getConfig({ fresh: true });
  return ok(res, { languages: cfg.languages, defaultLanguage: cfg.defaultLanguage }, 'config.updated');
});

/* ---------------- Banners ---------------- */
const listBanners = asyncHandler(async (req, res) => {
  const q = req.query.placement ? { placement: req.query.placement } : {};
  return ok(res, await Banner.find(q).sort({ order: 1, createdAt: -1 }));
});
const createBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.create(req.body);
  broadcastConfigChange('banners');
  return ok(res, banner, 'banner.created', 201);
});
const updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!banner) throw new ApiError(404, 'banner.notFound');
  broadcastConfigChange('banners');
  return ok(res, banner, 'banner.updated');
});
const deleteBanner = asyncHandler(async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  broadcastConfigChange('banners');
  return ok(res, null, 'banner.deleted');
});
const reorderBanners = asyncHandler(async (req, res) => {
  const ids = req.body.ids || [];
  await Promise.all(ids.map((id, i) => Banner.updateOne({ _id: id }, { order: i + 1 })));
  broadcastConfigChange('banners');
  return ok(res, await Banner.find().sort({ order: 1 }), 'banner.reordered');
});
const trackBannerClick = asyncHandler(async (req, res) => {
  await Banner.updateOne({ _id: req.params.id }, { $inc: { clicks: 1 } });
  return ok(res, null);
});

/* ---------------- Translations ---------------- */
const getTranslations = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  const code = (req.params.lang || cfg.defaultLanguage).toLowerCase();
  const doc = await Translation.findOne({ code, isActive: true });
  const fallback = code === cfg.defaultLanguage ? null : await Translation.findOne({ code: cfg.defaultLanguage });
  const strings = { ...(fallback ? fallback.getStrings() : {}), ...(doc ? doc.getStrings() : {}) };
  return ok(res, {
    code: doc ? doc.code : cfg.defaultLanguage,
    name: doc ? doc.name : '',
    isRTL: doc ? doc.isRTL : false,
    strings,
  });
});
const listTranslationsAdmin = asyncHandler(async (req, res) => ok(res, await Translation.find().sort({ code: 1 })));
const getTranslationAdmin = asyncHandler(async (req, res) => {
  const doc = await Translation.findOne({ code: req.params.code.toLowerCase() });
  if (!doc) throw new ApiError(404, 'translation.notFound');
  return ok(res, doc);
});
const createTranslation = asyncHandler(async (req, res) => {
  const { code, name, nativeName, isRTL, strings, copyFrom } = req.body;
  let base = strings || {};
  if (copyFrom) {
    const src = await Translation.findOne({ code: copyFrom });
    if (src) base = { ...src.getStrings(), ...base };
  }
  const doc = await Translation.create({ code, name, nativeName, isRTL, strings: Translation.encodeStrings(base) });
  clearTranslationCache();
  broadcastConfigChange('translations');
  return ok(res, doc, 'translation.created', 201);
});
const updateTranslation = asyncHandler(async (req, res) => {
  const { name, nativeName, isRTL, isActive, strings, merge = true } = req.body;
  const doc = await Translation.findOne({ code: req.params.code.toLowerCase() });
  if (!doc) throw new ApiError(404, 'translation.notFound');
  if (name !== undefined) doc.name = name;
  if (nativeName !== undefined) doc.nativeName = nativeName;
  if (isRTL !== undefined) doc.isRTL = isRTL;
  if (isActive !== undefined) doc.isActive = isActive;
  if (strings && typeof strings === 'object') doc.setStrings(strings, { replace: !merge });
  await doc.save();
  clearTranslationCache();
  broadcastConfigChange('translations');
  return ok(res, doc, 'translation.updated');
});
const deleteTranslation = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  if (req.params.code === cfg.defaultLanguage) throw new ApiError(400, 'translation.cannotDeleteDefault');
  await Translation.deleteOne({ code: req.params.code });
  clearTranslationCache();
  broadcastConfigChange('translations');
  return ok(res, null, 'translation.deleted');
});
/** Adds a key to every language at once (value per language optional). */
const upsertTranslationKey = asyncHandler(async (req, res) => {
  const { key, values = {} } = req.body;
  if (!key) throw new ApiError(400, 'translation.keyRequired');
  const docs = await Translation.find();
  await Promise.all(
    docs.map((d) => {
      d.setString(key, values[d.code] !== undefined ? values[d.code] : d.getString(key) || '');
      return d.save();
    })
  );
  clearTranslationCache();
  broadcastConfigChange('translations');
  return ok(res, { key }, 'translation.keySaved');
});

const health = (req, res) => res.json({ success: true, status: 'ok', env: env.nodeEnv, time: new Date().toISOString() });

module.exports = {
  attachIo,
  getPublicConfig,
  getAdminConfig,
  updateTheme,
  updateBranding,
  updateLayout,
  updateFeatures,
  updateBusiness,
  updateLegal,
  updateMaintenance,
  updateOnboarding,
  updateAppVersions,
  updateLanguages,
  listBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  trackBannerClick,
  getTranslations,
  listTranslationsAdmin,
  getTranslationAdmin,
  createTranslation,
  updateTranslation,
  deleteTranslation,
  upsertTranslationKey,
  health,
};
