const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const DeliveryPartner = require('../models/DeliveryPartner');
const Transaction = require('../models/Transaction');
const { issueTokens } = require('../utils/tokens');
const { getConfig } = require('../utils/configCache');
const { sendSms } = require('../utils/sms');
const { sendEmail } = require('../utils/email');
const { getTranslator } = require('../utils/i18n');
const { asyncHandler, ok, ApiError, generateOtp, hashToken } = require('../utils/helpers');

const SELF_REGISTER_ROLES = ['customer', 'vendor', 'delivery'];

async function roleExtras(user) {
  const extra = {};
  if (user.role === 'vendor') extra.restaurant = await Restaurant.findOne({ owner: user._id });
  if (user.role === 'delivery') extra.deliveryProfile = await DeliveryPartner.findOne({ user: user._id });
  return extra;
}

async function authPayload(user) {
  const tokens = await issueTokens(user);
  return { user, ...tokens, ...(await roleExtras(user)) };
}

async function applyReferral(user, referralCode) {
  if (!referralCode) return;
  const cfg = await getConfig();
  if (!cfg.features.referral) return;
  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
  if (!referrer || referrer._id.equals(user._id)) return;
  user.referredBy = referrer._id;
  const bonus = cfg.businessRules.refereeBonus || 0;
  if (bonus > 0 && cfg.features.wallet) {
    user.walletBalance += bonus;
    await Transaction.create({
      user: user._id,
      type: 'referral_bonus',
      direction: 'credit',
      amount: bonus,
      currencyCode: cfg.businessRules.currencyCode,
      description: 'referral.welcomeBonus',
    });
  }
}

const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role = 'customer', referralCode, language } = req.body;
  if (!SELF_REGISTER_ROLES.includes(role)) throw new ApiError(400, 'auth.invalidRole');
  const exists = await User.findOne({ $or: [email ? { email: email.toLowerCase() } : null, phone ? { phone } : null].filter(Boolean) });
  if (exists) throw new ApiError(409, 'auth.alreadyRegistered');
  const user = new User({ name, email, phone, password, role, language });
  await applyReferral(user, referralCode);
  await user.save();
  if (role === 'delivery') await DeliveryPartner.create({ user: user._id });
  if (email) {
    const t = await getTranslator(language);
    sendEmail({ to: email, subject: t('email.welcomeSubject'), text: t('email.welcomeBody', { name }) }).catch(() => {});
  }
  return ok(res, await authPayload(user), 'auth.registered', 201);
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password, role } = req.body;
  const id = String(identifier).trim();
  const user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'auth.invalidCredentials');
  if (user.isBanned) throw new ApiError(403, 'auth.banned');
  if (role) {
    const allowed = role === 'admin' ? ['admin', 'superadmin'] : [role];
    if (!allowed.includes(user.role)) throw new ApiError(403, 'auth.wrongApp');
  }
  return ok(res, await authPayload(user), 'auth.loggedIn');
});

const sendOtp = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg.features.otpLogin || !cfg.businessRules.otpLogin) throw new ApiError(403, 'feature.disabled');
  const { phone, role = 'customer' } = req.body;
  let user = await User.findOne({ phone }).select('+otp +otpExpires');
  if (!user) {
    if (!SELF_REGISTER_ROLES.includes(role)) throw new ApiError(400, 'auth.invalidRole');
    user = new User({ phone, role });
    if (role === 'delivery') await DeliveryPartner.create({ user: user._id });
  }
  const otp = generateOtp(cfg.businessRules.otpLength || 6);
  user.otp = hashToken(otp);
  user.otpExpires = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
  await user.save();
  const t = await getTranslator(user.language);
  await sendSms({ to: phone, body: t('sms.otp', { otp, app: cfg.branding.appName, minutes: env.otpExpiryMinutes }), force: true });
  return ok(res, { phone, expiresInMinutes: env.otpExpiryMinutes, ...(env.isProd ? {} : { devOtp: otp }) }, 'auth.otpSent');
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp, name, referralCode } = req.body;
  const user = await User.findOne({ phone }).select('+otp +otpExpires');
  if (!user || !user.otp || user.otpExpires < new Date() || user.otp !== hashToken(String(otp))) throw new ApiError(400, 'auth.invalidOtp');
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  const isNew = !user.name;
  if (name && !user.name) user.name = name;
  if (isNew) await applyReferral(user, referralCode);
  await user.save();
  if (user.isBanned) throw new ApiError(403, 'auth.banned');
  return ok(res, { ...(await authPayload(user)), isNewUser: isNew }, 'auth.loggedIn');
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) throw new ApiError(400, 'auth.refreshRequired');
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret);
  } catch (e) {
    throw new ApiError(401, 'auth.invalidRefresh');
  }
  const user = await User.findById(payload.id).select('+refreshTokens');
  const hashed = hashToken(token);
  if (!user || !(user.refreshTokens || []).includes(hashed)) throw new ApiError(401, 'auth.invalidRefresh');
  user.refreshTokens = user.refreshTokens.filter((t) => t !== hashed);
  await user.save({ validateBeforeSave: false });
  return ok(res, await issueTokens(user), 'auth.refreshed');
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token, fcmToken } = req.body;
  const update = {};
  if (token) update.refreshTokens = hashToken(token);
  if (fcmToken) update.fcmTokens = fcmToken;
  if (Object.keys(update).length) await User.updateOne({ _id: req.user._id }, { $pull: update });
  return ok(res, null, 'auth.loggedOut');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const id = String(identifier || '').trim();
  const user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] });
  if (user) {
    const cfg = await getConfig();
    const code = generateOtp(cfg.businessRules.otpLength || 6);
    user.resetPasswordToken = hashToken(code);
    user.resetPasswordExpires = new Date(Date.now() + env.otpExpiryMinutes * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const t = await getTranslator(user.language);
    if (user.email) await sendEmail({ to: user.email, subject: t('email.resetSubject'), text: t('email.resetBody', { code, minutes: env.otpExpiryMinutes }) });
    else if (user.phone) await sendSms({ to: user.phone, body: t('sms.resetCode', { code }), force: true });
    if (!env.isProd) return ok(res, { devCode: code }, 'auth.resetSent');
  }
  return ok(res, null, 'auth.resetSent');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { identifier, code, password } = req.body;
  if (!password || password.length < 6) throw new ApiError(422, 'validation.passwordMin');
  const id = String(identifier || '').trim();
  const user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { phone: id }] }).select('+resetPasswordToken +resetPasswordExpires');
  if (!user || !user.resetPasswordToken || user.resetPasswordExpires < new Date() || user.resetPasswordToken !== hashToken(String(code))) {
    throw new ApiError(400, 'auth.invalidResetCode');
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokens = [];
  await user.save();
  return ok(res, null, 'auth.passwordReset');
});

const googleSignIn = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg.features.googleSignIn) throw new ApiError(403, 'feature.disabled');
  const { idToken, role = 'customer' } = req.body;
  if (!SELF_REGISTER_ROLES.includes(role)) throw new ApiError(400, 'auth.invalidRole');
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client();
  let payload;
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: env.google.clientIds });
    payload = ticket.getPayload();
  } catch (e) {
    throw new ApiError(401, 'auth.googleFailed');
  }
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: (payload.email || '').toLowerCase() }] });
  if (!user) {
    user = await User.create({ name: payload.name, email: payload.email, avatar: payload.picture, googleId: payload.sub, isVerified: true, role });
    if (role === 'delivery') await DeliveryPartner.create({ user: user._id });
  } else if (!user.googleId) {
    user.googleId = payload.sub;
    await user.save();
  }
  if (user.isBanned) throw new ApiError(403, 'auth.banned');
  return ok(res, await authPayload(user), 'auth.loggedIn');
});

/** Verifies an Apple identity token against Apple's JWKS. */
async function verifyAppleToken(identityToken) {
  const [headerB64] = identityToken.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
  const resp = await fetch('https://appleid.apple.com/auth/keys');
  const { keys } = await resp.json();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('apple key not found');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  return jwt.verify(identityToken, publicKey, { algorithms: ['RS256'], issuer: 'https://appleid.apple.com', audience: env.apple.clientId });
}

const appleSignIn = asyncHandler(async (req, res) => {
  const cfg = await getConfig();
  if (!cfg.features.appleSignIn) throw new ApiError(403, 'feature.disabled');
  const { identityToken, name, role = 'customer' } = req.body;
  if (!SELF_REGISTER_ROLES.includes(role)) throw new ApiError(400, 'auth.invalidRole');
  let payload;
  try {
    payload = await verifyAppleToken(identityToken);
  } catch (e) {
    throw new ApiError(401, 'auth.appleFailed');
  }
  let user = await User.findOne({ $or: [{ appleId: payload.sub }, payload.email ? { email: payload.email.toLowerCase() } : { _id: null }] });
  if (!user) {
    user = await User.create({ name: name || '', email: payload.email, appleId: payload.sub, isVerified: true, role });
    if (role === 'delivery') await DeliveryPartner.create({ user: user._id });
  } else if (!user.appleId) {
    user.appleId = payload.sub;
    await user.save();
  }
  if (user.isBanned) throw new ApiError(403, 'auth.banned');
  return ok(res, await authPayload(user), 'auth.loggedIn');
});

const me = asyncHandler(async (req, res) => ok(res, { user: req.user, ...(await roleExtras(req.user)) }));

module.exports = { register, login, sendOtp, verifyOtp, refreshToken, logout, forgotPassword, resetPassword, googleSignIn, appleSignIn, me };
