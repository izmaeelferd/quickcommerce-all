const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDatabase(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, { autoIndex: !env.isProd });
  console.log(`[db] connected: ${conn.connection.host}/${conn.connection.name}`);
  await ensureIndexes();
  mongoose.connection.on('error', (err) => console.error('[db] error', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  return conn;
}

/**
 * autoIndex is off in production (Mongoose recommendation), so indexes — including the
 * 2dsphere geo indexes and the unique email/phone/orderNumber/coupon indexes — are created
 * explicitly here. createIndexes() is idempotent and only builds what is missing.
 */
async function ensureIndexes() {
  require('../models');
  await Promise.all(Object.values(mongoose.models).map((m) => m.createIndexes()));
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase, ensureIndexes };
