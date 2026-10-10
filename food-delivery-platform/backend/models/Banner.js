const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    placement: { type: String, enum: ['home', 'offers', 'restaurant', 'cart'], default: 'home' },
    linkType: { type: String, enum: ['none', 'restaurant', 'category', 'cuisine', 'url', 'coupon'], default: 'none' },
    linkValue: { type: String, default: '' },
    order: { type: Number, default: 0 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    backgroundColor: { type: String, default: '' },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bannerSchema.statics.activeQuery = function activeQuery(placement) {
  const now = new Date();
  const q = {
    isActive: true,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  };
  if (placement) q.placement = placement;
  return this.find(q).sort({ order: 1, createdAt: -1 });
};

module.exports = mongoose.model('Banner', bannerSchema);
