// backend/src/config/jwt.js

const jwt = require("jsonwebtoken");

/**
 * Configuration et utilitaires JWT
 */
const jwtConfig = {
  secret: process.env.JWT_SECRET || "default-secret-change-in-production",
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} payload - Données à inclure dans le token
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

/**
 * Génère un refresh token
 * @param {Object} payload - Données à inclure dans le token
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
};

/**
 * Vérifie et décode un token JWT
 * @param {string} token - Token à vérifier
 * @returns {Object} Payload décodé
 * @throws {Error} Si le token est invalide ou expiré
 */
const verifyToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

/**
 * Décode un token sans vérification (pour debug)
 * @param {string} token - Token à décoder
 * @returns {Object|null} Payload décodé ou null
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  jwtConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};
