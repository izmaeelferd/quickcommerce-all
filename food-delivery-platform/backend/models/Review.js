const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rating: { type: Number, min: 1, max: 5, required: true },
    deliveryRating: { type: Number, min: 1, max: 5, default: null },
    comment: { type: String, default: '' },
    images: [String],
    reply: { text: String, at: Date },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

reviewSchema.statics.recalculate = async function recalculate(restaurantId) {
  const Restaurant = mongoose.model('Restaurant');
  const [agg] = await this.aggregate([
    { $match: { restaurant: new mongoose.Types.ObjectId(restaurantId), isVisible: true } },
    { $group: { _id: '$restaurant', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Restaurant.findByIdAndUpdate(restaurantId, {
    rating: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.count : 0,
  });
};

module.exports = mongoose.model('Review', reviewSchema);
