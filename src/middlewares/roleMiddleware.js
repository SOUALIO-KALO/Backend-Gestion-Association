// backend/src/middlewares/roleMiddleware.js

const { ROLES, ERRORS } = require("../utils/constants");

/**
 * Middleware de vérification des rôles
 * @param {...string} allowedRoles - Rôles autorisés
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERRORS.UNAUTHORIZED,
      });
    }

    // Vérifier le rôle
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: ERRORS.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Middleware pour admin uniquement
 */
const adminOnly = requireRole(ROLES.ADMIN);

/**
 * Middleware pour membres et admins
 */
const memberOrAdmin = requireRole(ROLES.ADMIN, ROLES.MEMBRE);

/**
 * Middleware vérifiant que l'utilisateur accède à ses propres données
 * ou est admin
 */
const selfOrAdmin = (paramName = "id") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: ERRORS.UNAUTHORIZED,
      });
    }

    const targetId = req.params[paramName];

    // Admin peut tout faire
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // L'utilisateur ne peut accéder qu'à ses propres données
    if (req.user.id !== targetId) {
      return res.status(403).json({
        success: false,
        message: ERRORS.FORBIDDEN,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  adminOnly,
  memberOrAdmin,
  selfOrAdmin,
};
