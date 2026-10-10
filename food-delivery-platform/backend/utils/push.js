const fs = require('fs');
const env = require('../config/env');
const { getConfig } = require('./configCache');

let messaging = null;
function getMessaging() {
  if (messaging) return messaging;
  let credentials = null;
  if (env.firebase.serviceAccountBase64) {
    credentials = JSON.parse(Buffer.from(env.firebase.serviceAccountBase64, 'base64').toString('utf8'));
  } else if (env.firebase.serviceAccountPath && fs.existsSync(env.firebase.serviceAccountPath)) {
    credentials = JSON.parse(fs.readFileSync(env.firebase.serviceAccountPath, 'utf8'));
  }
  if (!credentials) return null;
  const admin = require('firebase-admin');
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(credentials) });
  messaging = admin.messaging();
  return messaging;
}

const stringifyData = (data = {}) =>
  Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));

async function sendPush({ tokens = [], title, body, data = {}, imageUrl }) {
  const cfg = await getConfig();
  if (!cfg.features.pushNotifications) return { skipped: 'feature_disabled' };
  const list = [...new Set(tokens.filter(Boolean))];
  if (!list.length) return { skipped: 'no_tokens' };
  const m = getMessaging();
  if (!m) {
    console.log(`[push:dev] tokens=${list.length} title="${title}"`);
    return { skipped: 'not_configured' };
  }
  const res = await m.sendEachForMulticast({
    tokens: list,
    notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
    data: stringifyData(data),
  });
  const invalid = [];
  res.responses.forEach((r, i) => {
    if (!r.success && r.error && /registration-token-not-registered|invalid-argument/.test(r.error.code)) invalid.push(list[i]);
  });
  return { successCount: res.successCount, failureCount: res.failureCount, invalid };
}

async function sendTopic({ topic, title, body, data = {} }) {
  const cfg = await getConfig();
  if (!cfg.features.pushNotifications) return { skipped: 'feature_disabled' };
  const m = getMessaging();
  if (!m) {
    console.log(`[push:dev] topic=${topic} title="${title}"`);
    return { skipped: 'not_configured' };
  }
  return m.send({ topic, notification: { title, body }, data: stringifyData(data) });
}

module.exports = { sendPush, sendTopic };
