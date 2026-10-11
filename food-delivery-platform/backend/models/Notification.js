const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    audience: { type: String, enum: ['user', 'all', 'customer', 'vendor', 'delivery'], default: 'user', index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    type: { type: String, default: 'general' },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    channels: [{ type: String, enum: ['push', 'email', 'sms', 'inapp'] }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isRead: { type: Boolean, default: false },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
