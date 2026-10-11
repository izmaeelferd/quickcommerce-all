const mongoose = require('mongoose');

const { Schema } = mongoose;

const ORDER_STATUSES = ['placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered', 'cancelled', 'rejected'];

const orderItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    image: String,
    isVeg: Boolean,
    unitPrice: Number,
    quantity: { type: Number, min: 1 },
    addOns: [{ group: String, name: String, price: Number }],
    instructions: String,
    lineTotal: Number,
  },
  { _id: false }
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    deliveryPartner: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    items: [orderItemSchema],
    deliveryAddress: {
      label: String,
      fullAddress: String,
      landmark: String,
      city: String,
      pincode: String,
      contactName: String,
      contactPhone: String,
      location: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    },
    distanceKm: { type: Number, default: 0 },
    pricing: {
      currencyCode: String,
      currencySymbol: String,
      subtotal: Number,
      deliveryFee: Number,
      packagingFee: Number,
      platformFee: Number,
      surgeFee: Number,
      tax: Number,
      tip: Number,
      discount: Number,
      walletUsed: Number,
      total: Number,
      payable: Number,
    },
    commission: { percent: Number, amount: Number },
    vendorEarning: { type: Number, default: 0 },
    deliveryEarning: { type: Number, default: 0 },
    coupon: { code: String, discount: Number, couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' } },
    payment: {
      method: { type: String, enum: ['card', 'upi', 'wallet', 'cod', 'netbanking'] },
      status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending' },
      provider: String,
      intentId: String,
      paymentId: String,
      paidAt: Date,
    },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed', index: true },
    statusHistory: [statusHistorySchema],
    scheduledFor: { type: Date, default: null },
    deliverySlot: { type: String, default: '' },
    instructions: { type: String, default: '' },
    estimatedDeliveryAt: Date,
    deliveryOtp: { type: String, select: false },
    deliveryPhoto: { type: String, default: '' },
    cancelledBy: { type: String, enum: ['customer', 'vendor', 'admin', 'system', null], default: null },
    cancelReason: { type: String, default: '' },
    cancellationFee: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    isRated: { type: Boolean, default: false },
    rejectedByPartners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deliveredAt: Date,
  },
  { timestamps: true }
);

orderSchema.statics.STATUSES = ORDER_STATUSES;

orderSchema.pre('validate', function genNumber(next) {
  if (!this.orderNumber) {
    const d = new Date();
    const stamp = `${d.getFullYear().toString().slice(-2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    this.orderNumber = `OD${stamp}${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
