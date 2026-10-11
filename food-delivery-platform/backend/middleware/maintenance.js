const { getConfig } = require('../utils/configCache');

/**
 * Blocks non-admin API traffic when maintenance mode is on.
 * Clients send `X-App-Type: customer|vendor|delivery|admin|vendor-web`.
 */
const ALLOW_PREFIXES = ['/config', '/auth/login', '/auth/refresh-token', '/admin', '/health', '/translations', '/payments/webhook'];

const maintenanceGuard = async (req, res, next) => {
  try {
    const cfg = await getConfig();
    const m = cfg.maintenance || {};
    if (!m.appInMaintenance) return next();
    if (ALLOW_PREFIXES.some((p) => req.path.startsWith(p))) return next();
    const appType = (req.headers['x-app-type'] || '').toLowerCase();
    const mapped = appType === 'vendor-web' ? 'vendor' : appType;
    if (mapped && Array.isArray(m.affectedApps) && m.affectedApps.length && !m.affectedApps.includes(mapped)) return next();
    if (appType === 'admin') return next();
    return res.status(503).json({ success: false, message: 'maintenance.active', data: { maintenance: m } });
  } catch (e) {
    return next();
  }
};

module.exports = { maintenanceGuard };
