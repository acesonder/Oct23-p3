/**
 * Authentication and Authorization Middleware
 */

const { verifyToken, extractToken } = require('../auth');
const { User } = require('../models');

/**
 * Authenticate user from JWT token
 */
function authenticate(req, res, next) {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Attach user info to request
  req.user = {
    id: decoded.id,
    username: decoded.username,
    role: decoded.role
  };

  next();
}

/**
 * Authorize based on user roles
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}

/**
 * Check if user has access to specific portal
 */
function portalAccess(portalName) {
  const rolePortalMap = {
    client: ['client', 'admin'],
    outreach: ['outreach', 'admin'],
    provider: ['provider', 'admin'],
    admin: ['admin']
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = rolePortalMap[portalName] || [];
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access to ${portalName} portal denied` });
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role
      };
    }
  }

  next();
}

module.exports = {
  authenticate,
  authorize,
  portalAccess,
  optionalAuth
};
