const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { hashToken } = require('./helpers');

const signAccess = (user) => jwt.sign({ id: user._id.toString(), role: user.role }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
const signRefresh = (user) => jwt.sign({ id: user._id.toString(), type: 'refresh' }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn });

async function issueTokens(user) {
  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user);
  const User = require('../models/User');
  const fresh = await User.findById(user._id).select('+refreshTokens');
  const tokens = (fresh.refreshTokens || []).slice(-9);
  tokens.push(hashToken(refreshToken));
  fresh.refreshTokens = tokens;
  fresh.lastLoginAt = new Date();
  await fresh.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
}

module.exports = { signAccess, signRefresh, issueTokens };
