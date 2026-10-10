const crypto = require('crypto');

class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const ok = (res, data = {}, message = 'OK', status = 200) => res.status(status).json({ success: true, message, data });

const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);

/** Deep merge: arrays from `source` replace arrays in `target`. */
function deepMerge(target, source) {
  if (!isPlainObject(source)) return source === undefined ? target : source;
  const out = isPlainObject(target) ? { ...target } : {};
  Object.keys(source).forEach((key) => {
    const s = source[key];
    if (s === undefined || s === null) {
      if (!(key in out)) out[key] = s;
      return;
    }
    out[key] = isPlainObject(s) ? deepMerge(out[key], s) : s;
  });
  return out;
}

/** Flatten nested object to Mongo dot-path $set map. Arrays are set whole. */
function toDotPaths(obj, prefix = '', out = {}) {
  Object.keys(obj || {}).forEach((key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const v = obj[key];
    if (isPlainObject(v) && Object.keys(v).length) toDotPaths(v, path, out);
    else out[path] = v;
  });
  return out;
}

function paginate(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

const paged = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
});

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function generateOtp(length = 6) {
  let otp = '';
  for (let i = 0; i < length; i += 1) otp += crypto.randomInt(0, 10).toString();
  return otp;
}

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
  ApiError,
  asyncHandler,
  ok,
  pick,
  isPlainObject,
  deepMerge,
  toDotPaths,
  paginate,
  paged,
  haversineKm,
  generateOtp,
  hashToken,
  round2,
  escapeRegex,
};
