const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    label: { type: String, default: 'Home' },
    fullAddress: { type: String, required: true },
    landmark: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    contactName: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    name: { type: String, trim: true, default: '' },
    email: { type: String, lowercase: true, trim: true, sparse: true, unique: true },
    phone: { type: String, trim: true, sparse: true, unique: true },
    password: { type: String, select: false },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'delivery', 'admin', 'superadmin'],
      default: 'customer',
      index: true,
    },
    adminRole: { type: Schema.Types.ObjectId, ref: 'AdminRole', default: null },
    avatar: { type: String, default: '' },
    addresses: [addressSchema],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Restaurant' }],
    walletBalance: { type: Number, default: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    referralRewarded: { type: Boolean, default: false },
    language: { type: String, default: '' },
    fcmTokens: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    googleId: { type: String, sparse: true },
    appleId: { type: String, sparse: true },
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpSentAt: { type: Date, select: false },
    resetAttempts: { type: Number, default: 0, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    refreshTokens: { type: [String], select: false, default: [] },
    notificationPrefs: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, env.bcryptRounds);
  return next();
});

userSchema.pre('save', function ensureReferral(next) {
  if (!this.referralCode) {
    this.referralCode = `${(this.name || 'USR').replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'USR'}${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;
  }
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.otpAttempts;
  delete obj.otpSentAt;
  delete obj.resetAttempts;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.refreshTokens;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
