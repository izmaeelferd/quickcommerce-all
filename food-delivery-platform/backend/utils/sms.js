const env = require('../config/env');
const { getConfig } = require('./configCache');

let client = null;
function getClient() {
  if (!client && env.twilio.accountSid && env.twilio.authToken) {
    client = require('twilio')(env.twilio.accountSid, env.twilio.authToken);
  }
  return client;
}

async function sendSms({ to, body, force = false }) {
  const cfg = await getConfig();
  if (!force && !cfg.features.smsNotifications) return { skipped: 'feature_disabled' };
  const c = getClient();
  if (!c) {
    console.log(`[sms:dev] to=${to} body="${body}"`);
    return { skipped: 'not_configured' };
  }
  return c.messages.create({ to, from: env.twilio.from, body });
}

module.exports = { sendSms };
