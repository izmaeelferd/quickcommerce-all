const nodemailer = require('nodemailer');
const env = require('../config/env');
const { getConfig } = require('./configCache');

let transporter = null;
function getTransporter() {
  if (!transporter && env.smtp.host && env.smtp.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

async function wrapTemplate(title, html) {
  const cfg = await getConfig();
  const { theme, branding } = cfg;
  return `<!doctype html><html><body style="margin:0;background:${theme.surfaceColor};font-family:${theme.fontFamily},Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px">
  <table width="560" cellpadding="0" cellspacing="0" style="background:${theme.backgroundColor};border-radius:${theme.cardRadius}px;overflow:hidden">
    <tr><td style="background:${theme.primaryColor};color:#fff;padding:20px 24px;font-size:20px;font-weight:bold">${branding.appName}</td></tr>
    <tr><td style="padding:24px;color:${theme.textColor}"><h2 style="margin-top:0">${title}</h2>${html}</td></tr>
    <tr><td style="padding:16px 24px;font-size:12px;color:#888">${branding.copyright || ''} · ${branding.supportEmail}</td></tr>
  </table></td></tr></table></body></html>`;
}

async function sendEmail({ to, subject, html, text }) {
  const cfg = await getConfig();
  if (!cfg.features.emailNotifications) return { skipped: 'feature_disabled' };
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return { skipped: 'not_configured' };
  }
  const body = await wrapTemplate(subject, html || `<p>${text || ''}</p>`);
  const from = env.smtp.from || `${cfg.branding.appName} <${cfg.branding.supportEmail}>`;
  return t.sendMail({ from, to, subject, html: body, text });
}

module.exports = { sendEmail };
