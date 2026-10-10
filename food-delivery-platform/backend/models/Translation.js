const mongoose = require('mongoose');

/**
 * Translation keys are dotted ("home.title") but Mongoose Maps cannot store keys
 * containing ".", so keys are encoded with U+FF0E (fullwidth full stop) at rest and
 * decoded transparently through the helpers below. Always use the helpers.
 */
const DOT = '．';
const encodeKey = (k) => String(k).split('.').join(DOT);
const decodeKey = (k) => String(k).split(DOT).join('.');

const translationSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    nativeName: { type: String, default: '' },
    isRTL: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    strings: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

translationSchema.methods.getStrings = function getStrings() {
  const out = {};
  if (this.strings) this.strings.forEach((v, k) => { out[decodeKey(k)] = v; });
  return out;
};
translationSchema.methods.getString = function getString(key) {
  return this.strings ? this.strings.get(encodeKey(key)) : undefined;
};
translationSchema.methods.setString = function setString(key, value) {
  this.strings.set(encodeKey(key), String(value));
};
translationSchema.methods.deleteString = function deleteString(key) {
  this.strings.delete(encodeKey(key));
};
translationSchema.methods.setStrings = function setStrings(obj = {}, { replace = false } = {}) {
  if (replace) this.strings = new Map();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === null) this.deleteString(k);
    else this.setString(k, v);
  });
};

/** Converts a plain { "a.b": "x" } object into the encoded form for create/insert. */
translationSchema.statics.encodeStrings = (obj = {}) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [encodeKey(k), String(v)]));
/** Decodes a lean() document's strings object. */
translationSchema.statics.decodeStrings = (obj = {}) => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [decodeKey(k), v]));

translationSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.strings = doc.getStrings();
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Translation', translationSchema);
