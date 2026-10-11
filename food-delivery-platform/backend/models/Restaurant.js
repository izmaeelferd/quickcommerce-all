const mongoose = require('mongoose');

const { Schema } = mongoose;

const timingSchema = new Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    open: { type: String, default: '09:00' },
    close: { type: String, default: '23:00' },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const restaurantSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    images: [String],
    cuisines: [{ type: String, trim: true }],
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: {
      fullAddress: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    isPureVeg: { type: Boolean, default: false },
    priceForTwo: { type: Number, default: 0 },
    avgPrepTimeMinutes: { type: Number, default: 25 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'approved', 'suspended', 'rejected'], default: 'pending', index: true },
    statusReason: { type: String, default: '' },
    isOpen: { type: Boolean, default: true },
    acceptingOrders: { type: Boolean, default: true },
    timings: [timingSchema],
    commissionPercent: { type: Number, default: null }, // null => global businessRules.commissionPercent
    offerText: { type: String, default: '' },
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    totalOrders: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifsc: String,
      upiId: String,
    },
    licenseNumber: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ name: 'text', cuisines: 'text', tags: 'text', description: 'text' });

restaurantSchema.pre('save', function slugify(next) {
  if (this.isModified('name') || !this.slug) {
    const base = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }
  next();
});

restaurantSchema.methods.isOpenNow = function isOpenNow(date = new Date()) {
  if (!this.isOpen || !this.acceptingOrders) return false;
  if (!this.timings || this.timings.length === 0) return true;
  const t = this.timings.find((x) => x.day === date.getDay());
  if (!t || t.closed) return false;
  const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  if (t.open <= t.close) return hhmm >= t.open && hhmm <= t.close;
  return hhmm >= t.open || hhmm <= t.close; // overnight
};

module.exports = mongoose.model('Restaurant', restaurantSchema);
