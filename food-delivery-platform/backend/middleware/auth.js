const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../utils/helpers');

const extractToken = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
};

const protect = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, 'auth.required');
  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch (e) {
    throw new ApiError(401, e.name === 'TokenExpiredError' ? 'auth.tokenExpired' : 'auth.invalidToken');
  }
  const user = await User.findById(payload.id).populate('adminRole');
  if (!user) throw new ApiError(401, 'auth.userNotFound');
  if (user.isBanned) throw new ApiError(403, 'auth.banned');
  req.user = user;
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = await User.findById(payload.id);
  } catch (e) {
    req.user = null;
  }
  return next();
});

module.exports = { protect, optionalAuth };
