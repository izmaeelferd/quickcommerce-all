const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    vehicleType: { type: String, enum: ['bicycle', 'bike', 'scooter', 'car'], default: 'bike' },
    vehicleNumber: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    documents: [{ name: String, url: String }],
    status: { type: String, enum: ['pending', 'approved', 'suspended', 'rejected'], default: 'pending', index: true },
    isOnline: { type: Boolean, default: false, index: true },
    currentLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    lastLocationAt: Date,
    activeOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    bankDetails: { accountName: String, accountNumber: String, ifsc: String, upiId: String },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
