/**
 * NoSQL-injection guard: removes keys that start with "$" or contain "." from
 * req.body, req.query and req.params (recursively), so user input can never be
 * interpreted as a MongoDB operator like {"$ne": null}.
 * Translation editing sends dotted keys inside `strings`, so that one subtree is
 * only stripped of "$" keys.
 */
const DOTTED_ALLOWED = new Set(['strings', 'values']);

function clean(value, allowDots = false) {
  if (Array.isArray(value)) return value.map((v) => clean(v, allowDots));
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    const out = {};
    Object.keys(value).forEach((k) => {
      if (k.startsWith('$') || k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      if (!allowDots && k.includes('.')) return;
      out[k] = clean(value[k], allowDots || DOTTED_ALLOWED.has(k));
    });
    return out;
  }
  return value;
}

const sanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.query && typeof req.query === 'object') {
    const q = clean(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, q);
  }
  if (req.params) req.params = clean(req.params);
  next();
};

module.exports = { sanitize, clean };
