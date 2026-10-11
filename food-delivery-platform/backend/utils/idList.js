const { ApiError } = require('./helpers');

/** 24-character hex ObjectId (mongoose.isValidObjectId also accepts any 12-byte string). */
const isObjectIdHex = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

/** Parses a comma-separated list of ObjectIds (max 50). Returns null when absent. */
function parseIdList(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  const ids = [...new Set(String(raw).split(',').map((x) => x.trim()).filter(Boolean))];
  if (ids.length > 50 || ids.some((x) => !isObjectIdHex(x))) throw new ApiError(422, 'validation.invalidId');
  return ids;
}

/** Re-orders documents to match the given id order. */
function orderByIds(list, ids) {
  const rank = new Map(ids.map((x, i) => [x, i]));
  return [...list].sort((a, b) => (rank.get(String(a._id)) ?? 0) - (rank.get(String(b._id)) ?? 0));
}

module.exports = { isObjectIdHex, parseIdList, orderByIds };
