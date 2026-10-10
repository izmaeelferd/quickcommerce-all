const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    discountType: { type: String, enum: ['percent', 'flat', 'free_delivery'], default: 'percent' },
    value: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: null },
    minOrderValue: { type: Number, default: 0 },
    validFrom: { type: Date, default: Date.now },
    validTo: { type: Date, default: null },
    usageLimit: { type: Number, default: null },
    perUserLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, count: Number }],
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', default: null },
    firstOrderOnly: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    showInOffers: { type: Boolean, default: true },
    bannerImage: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
