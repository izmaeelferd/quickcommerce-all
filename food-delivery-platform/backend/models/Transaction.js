const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    type: {
      type: String,
      enum: ['payment', 'refund', 'wallet_credit', 'wallet_debit', 'referral_bonus', 'vendor_payout', 'delivery_payout', 'commission', 'cancellation_fee'],
      required: true,
      index: true,
    },
    direction: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    currencyCode: { type: String, default: '' },
    method: { type: String, default: '' },
    provider: { type: String, default: '' },
    providerRef: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'success', 'failed'], default: 'success', index: true },
    description: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
