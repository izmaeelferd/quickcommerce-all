const mongoose = require('mongoose');

const { Schema } = mongoose;

const addOnOptionSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: true }
);

const addOnGroupSchema = new Schema(
  {
    name: { type: String, required: true },
    required: { type: Boolean, default: false },
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 1 },
    options: [addOnOptionSchema],
  },
  { _id: true }
);

const menuItemSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null },
    image: { type: String, default: '' },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true },
    isBestseller: { type: Boolean, default: false },
    spiceLevel: { type: Number, min: 0, max: 3, default: 0 },
    addOns: [addOnGroupSchema],
    tags: [String],
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.discountPrice != null && this.discountPrice < this.price ? this.discountPrice : this.price;
});
menuItemSchema.set('toJSON', { virtuals: true });
menuItemSchema.set('toObject', { virtuals: true });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
