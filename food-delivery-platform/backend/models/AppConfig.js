const mongoose = require('mongoose');
const { SECTION_TYPES } = require('../utils/layoutSections');

const { Schema } = mongoose;

const homeSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: SECTION_TYPES,
    },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    title: { type: String, default: '' },
    titleKey: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    layout: { type: String, enum: ['grid', 'list', 'carousel'], default: 'list' },
    columns: { type: Number, default: 2 },
    limit: { type: Number, default: 10 },
    filter: { type: Schema.Types.Mixed, default: {} },
    style: { type: Schema.Types.Mixed, default: {} },
    // Type-specific data for custom content sections (promo, pickedRestaurants, pickedDishes, text).
    content: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const deliverySlotSchema = new Schema(
  {
    id: String,
    label: String,
    start: String, // HH:mm
    end: String,
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const onboardingPageSchema = new Schema(
  { title: String, description: String, imageUrl: String, order: Number },
  { _id: false }
);

const appConfigSchema = new Schema(
  {
    key: { type: String, default: 'main', unique: true },
    version: { type: Number, default: 1 },
    theme: {
      primaryColor: String,
      secondaryColor: String,
      accentColor: String,
      backgroundColor: String,
      surfaceColor: String,
      textColor: String,
      successColor: String,
      warningColor: String,
      errorColor: String,
      vegColor: String,
      nonVegColor: String,
      darkModeDefault: Boolean,
      fontFamily: String,
      appFontScale: Number,
      buttonRadius: Number,
      cardRadius: Number,
      inputRadius: Number,
      appIconUrl: String,
      splashLogoUrl: String,
      splashBackgroundColor: String,
      splashDuration: Number,
      faviconUrl: String,
      adminLogoUrl: String,
    },
    branding: {
      appName: String,
      appTagline: String,
      vendorAppName: String,
      deliveryAppName: String,
      supportEmail: String,
      supportPhone: String,
      websiteUrl: String,
      whatsappNumber: String,
      address: String,
      copyright: String,
      socialLinks: {
        facebook: String,
        instagram: String,
        twitter: String,
        youtube: String,
        linkedin: String,
      },
    },
    onboarding: {
      enabled: Boolean,
      pages: [onboardingPageSchema],
    },
    homeLayout: [homeSectionSchema],
    features: {
      wallet: Boolean,
      coupons: Boolean,
      tipping: Boolean,
      reviews: Boolean,
      favorites: Boolean,
      referral: Boolean,
      liveTracking: Boolean,
      chatWithVendor: Boolean,
      deliveryPartnerTips: Boolean,
      scheduleOrder: Boolean,
      vegOnlyFilter: Boolean,
      searchFilters: Boolean,
      googleSignIn: Boolean,
      appleSignIn: Boolean,
      otpLogin: Boolean,
      emailNotifications: Boolean,
      smsNotifications: Boolean,
      pushNotifications: Boolean,
      onboarding: Boolean,
      darkModeToggle: Boolean,
      deliveryPhotoProof: Boolean,
      deliveryOtp: Boolean,
    },
    businessRules: {
      currencySymbol: String,
      currencyCode: String,
      commissionPercent: Number,
      deliveryFee: {
        base: Number,
        perKm: Number,
        baseKm: Number,
        freeAbove: Number,
      },
      deliveryPartnerPayout: {
        base: Number,
        perKm: Number,
        tipSharePercent: Number,
      },
      taxPercent: Number,
      taxLabel: String,
      packagingFee: Number,
      platformFee: Number,
      minOrderValue: Number,
      maxTipPercent: Number,
      tipPresets: [Number],
      surgePricing: {
        enabled: Boolean,
        multiplier: Number,
        reason: String,
      },
      radiusKm: Number,
      cancellationWindowMinutes: Number,
      cancellationPenaltyPercent: Number,
      referralBonus: Number,
      refereeBonus: Number,
      walletMaxUsePercent: Number,
      otpLogin: Boolean,
      otpLength: Number,
      autoAssignDelivery: Boolean,
      vendorAcceptTimeoutMinutes: Number,
      paymentTimeoutMinutes: Number,
      etaBufferMinutes: Number,
      etaMinutesPerKm: Number,
      deliveryOtpLength: Number,
      deliverySlots: [deliverySlotSchema],
      paymentMethods: {
        card: Boolean,
        upi: Boolean,
        wallet: Boolean,
        cod: Boolean,
        netbanking: Boolean,
      },
      codMaxAmount: Number,
      minPayoutAmount: Number,
    },
    legal: {
      privacyPolicy: String,
      termsAndConditions: String,
      refundPolicy: String,
      aboutUs: String,
    },
    languages: [String],
    defaultLanguage: String,
    maintenance: {
      appInMaintenance: Boolean,
      maintenanceMessage: String,
      maintenanceImageUrl: String,
      affectedApps: [String],
    },
    appVersions: {
      customer: { minVersion: String, latestVersion: String, forceUpdate: Boolean, storeUrlAndroid: String, storeUrlIos: String },
      vendor: { minVersion: String, latestVersion: String, forceUpdate: Boolean, storeUrlAndroid: String, storeUrlIos: String },
      delivery: { minVersion: String, latestVersion: String, forceUpdate: Boolean, storeUrlAndroid: String, storeUrlIos: String },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false }
);

appConfigSchema.statics.getSingleton = async function getSingleton() {
  let doc = await this.findOne({ key: 'main' });
  if (!doc) doc = await this.create({ key: 'main' });
  return doc;
};

module.exports = mongoose.model('AppConfig', appConfigSchema);
