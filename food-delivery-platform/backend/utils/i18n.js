const Translation = require('../models/Translation');
const { getConfig, onConfigChange } = require('./configCache');

let cache = new Map();
onConfigChange(() => {
  cache = new Map();
});

function clearTranslationCache() {
  cache = new Map();
}

async function loadStrings(code) {
  if (cache.has(code)) return cache.get(code);
  const doc = await Translation.findOne({ code, isActive: true });
  const strings = doc ? doc.getStrings() : {};
  cache.set(code, strings);
  return strings;
}

/** Returns t(key, vars) for the requested language falling back to the default language, then to the key itself. */
async function getTranslator(lang) {
  const cfg = await getConfig();
  const primary = await loadStrings(lang || cfg.defaultLanguage);
  const fallback = await loadStrings(cfg.defaultLanguage);
  return (key, vars = {}) => {
    const raw = primary[key] || fallback[key] || key;
    return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
  };
}

module.exports = { getTranslator, clearTranslationCache };
