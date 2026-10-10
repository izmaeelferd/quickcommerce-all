const { ApiError } = require('../utils/helpers');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'auth.required'));
  if (req.user.role === 'superadmin') return next();
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'auth.forbidden'));
  return next();
};

/** Admin RBAC — superadmin bypasses, admins need the permission in their AdminRole (no role => full access). */
const requirePermission = (permission) => (req, res, next) => {
  const u = req.user;
  if (!u) return next(new ApiError(401, 'auth.required'));
  if (u.role === 'superadmin') return next();
  if (u.role !== 'admin') return next(new ApiError(403, 'auth.forbidden'));
  if (!u.adminRole) return next();
  if ((u.adminRole.permissions || []).includes(permission)) return next();
  return next(new ApiError(403, 'auth.permissionDenied'));
};

module.exports = { authorize, requirePermission };
