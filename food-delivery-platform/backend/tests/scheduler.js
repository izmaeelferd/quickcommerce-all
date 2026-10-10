/* eslint-disable no-console */
/**
 * Verifies the businessRules-driven background jobs against a seeded database:
 *   MONGODB_URI=... node tests/scheduler.js
 */
const assert = require('assert');
const mongoose = require('mongoose');
const { connectDatabase } = require('../config/database');
const { AppConfig, Order, Restaurant, User, MenuItem } = require('../models');
const { invalidateConfig } = require('../utils/configCache');
const { sweep } = require('../utils/scheduler');

(async () => {
  await connectDatabase();
  const customer = await User.findOne({ role: 'customer' });
  const restaurant = await Restaurant.findOne({ status: 'approved' });
  const item = await MenuItem.findOne({ restaurant: restaurant._id });
  assert.ok(customer && restaurant && item, 'run the seeder first');
  await AppConfig.updateOne({ key: 'main' }, { $set: { 'businessRules.vendorAcceptTimeoutMinutes': 5, 'businessRules.paymentTimeoutMinutes': 15 } });
  invalidateConfig();

  const base = { customer: customer._id, restaurant: restaurant._id, items: [{ menuItem: item._id, name: item.name, unitPrice: 100, quantity: 1, lineTotal: 100 }], pricing: { subtotal: 100, total: 100, payable: 100, walletUsed: 0 }, commission: { percent: 10, amount: 10 }, status: 'placed', statusHistory: [{ status: 'placed' }] };
  const old = new Date(Date.now() - 60 * 60000);
  const unaccepted = await Order.create({ ...base, payment: { method: 'cod', status: 'pending' } });
  const unpaid = await Order.create({ ...base, payment: { method: 'card', status: 'pending' } });
  const fresh = await Order.create({ ...base, payment: { method: 'cod', status: 'pending' } });
  // createdAt is immutable in Mongoose, so backdate it on the raw collection.
  await Order.collection.updateMany({ _id: { $in: [unaccepted._id, unpaid._id] } }, { $set: { createdAt: old } });

  await sweep();
  const [a, b, c] = await Promise.all([Order.findById(unaccepted._id), Order.findById(unpaid._id), Order.findById(fresh._id)]);
  assert.strictEqual(a.status, 'rejected', 'unaccepted order should be auto-rejected');
  assert.strictEqual(a.cancelledBy, 'system');
  assert.strictEqual(b.status, 'cancelled', 'unpaid online order should be auto-cancelled');
  assert.strictEqual(c.status, 'placed', 'fresh order must be untouched');
  await Order.deleteMany({ _id: { $in: [unaccepted._id, unpaid._id, fresh._id] } });
  console.log('  ✓ scheduler: vendor accept timeout, payment timeout, fresh orders untouched');
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
