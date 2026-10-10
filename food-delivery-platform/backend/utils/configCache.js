const AppConfig = require('../models/AppConfig');
const defaults = require('../config/defaultConfig');
const { deepMerge } = require('./helpers');

const TTL_MS = 30 * 1000;
let cache = null;
let cachedAt = 0;
const listeners = new Set();

/** Returns the merged runtime config (DB values over factory fallbacks). */
async function getConfig({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL_MS) return cache;
  const doc = await AppConfig.getSingleton();
  const stored = doc.toObject({ depopulate: true });
  delete stored._id;
  delete stored.__v;
  const merged = deepMerge(JSON.parse(JSON.stringify(defaults)), stored);
  if (!stored.homeLayout || stored.homeLayout.length === 0) merged.homeLayout = defaults.homeLayout;
  if (!stored.languages || stored.languages.length === 0) merged.languages = defaults.languages;
  merged.homeLayout = [...merged.homeLayout].sort((a, b) => (a.order || 0) - (b.order || 0));
  cache = merged;
  cachedAt = Date.now();
  return cache;
}

function invalidateConfig() {
  cache = null;
  cachedAt = 0;
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('[config] listener error', e.message);
    }
  });
}

function onConfigChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

module.exports = { getConfig, invalidateConfig, onConfigChange };
