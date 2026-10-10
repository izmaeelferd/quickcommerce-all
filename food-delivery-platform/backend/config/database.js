const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

async function connectDatabase(uri = env.mongoUri) {
  const conn = await mongoose.connect(uri, { autoIndex: !env.isProd });
  console.log(`[db] connected: ${conn.connection.host}/${conn.connection.name}`);
  mongoose.connection.on('error', (err) => console.error('[db] error', err.message));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  return conn;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
