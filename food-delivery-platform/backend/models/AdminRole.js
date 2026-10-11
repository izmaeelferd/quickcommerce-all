const mongoose = require('mongoose');

const PERMISSIONS = [
  'dashboard', 'users', 'vendors', 'restaurants', 'categories', 'orders', 'transactions',
  'coupons', 'delivery', 'notifications', 'reports', 'config', 'banners', 'translations',
  'legal', 'roles', 'settings',
];

const adminRoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    permissions: [{ type: String, enum: PERMISSIONS }],
  },
  { timestamps: true }
);

adminRoleSchema.statics.PERMISSIONS = PERMISSIONS;

module.exports = mongoose.model('AdminRole', adminRoleSchema);
