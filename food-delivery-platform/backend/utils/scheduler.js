const Order = require('../models/Order');
const { getConfig } = require('./configCache');
const { transition } = require('./orderFlow');

/**
 * Background jobs driven by businessRules:
 *  - vendorAcceptTimeoutMinutes: orders a vendor has not accepted in time are auto-rejected (refunds run).
 *  - paymentTimeoutMinutes: online orders that were never paid are auto-cancelled (wallet/coupon restored).
 * A value of 0 disables the corresponding job.
 */
async function sweep() {
  const rules = (await getConfig()).businessRules;
  const now = Date.now();

  if (rules.vendorAcceptTimeoutMinutes > 0) {
    const cutoff = new Date(now - rules.vendorAcceptTimeoutMinutes * 60000);
    const stale = await Order.find({
      status: 'placed',
      scheduledFor: null,
      $or: [{ 'payment.method': 'cod' }, { 'payment.status': 'paid' }],
      // Clock starts when the order became visible to the vendor (paid time for online orders).
      $expr: { $lt: [{ $ifNull: ['$payment.paidAt', '$createdAt'] }, cutoff] },
    }).limit(100);
    for (const o of stale) {
      await transition(o, 'rejected', { actor: 'system', note: 'vendor.acceptTimeout', extra: { cancelledBy: 'system', cancelReason: 'order.autoRejected' } }).catch((e) => console.error('[scheduler] reject', o._id, e.message));
    }
  }

  if (rules.paymentTimeoutMinutes > 0) {
    const cutoff = new Date(now - rules.paymentTimeoutMinutes * 60000);
    const unpaid = await Order.find({ status: 'placed', 'payment.method': { $ne: 'cod' }, 'payment.status': { $in: ['pending', 'failed'] }, createdAt: { $lt: cutoff } }).limit(100);
    for (const o of unpaid) {
      await transition(o, 'cancelled', { actor: 'system', note: 'payment.timeout', extra: { cancelledBy: 'system', cancelReason: 'order.paymentTimeout' } }).catch((e) => console.error('[scheduler] cancel', o._id, e.message));
    }
  }
}

let timer = null;
function startScheduler(intervalMs = 60 * 1000) {
  if (timer) return timer;
  timer = setInterval(() => sweep().catch((e) => console.error('[scheduler]', e.message)), intervalMs);
  timer.unref();
  return timer;
}

module.exports = { startScheduler, sweep };
