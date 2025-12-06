// backend/src/utils/helpers.js

const crypto = require("crypto");
const AppError = require("./AppError");

/**
 * Génère un token aléatoire sécurisé
 * @param {number} length - Longueur du token (défaut: 32)
 * @returns {string} Token hexadécimal
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Formate une date en français
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée
 */
const formatDateFR = (date) => {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
};

/**
 * Masque partiellement un email
 * @param {string} email - Email à masquer
 * @returns {string} Email masqué
 */
const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  const maskedLocal = local.charAt(0) + "***" + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
};

/**
 * Crée une erreur personnalisée avec code HTTP
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP
 * @param {Object} details - Détails supplémentaires (optionnel)
 * @returns {AppError} Erreur personnalisée
 */
const createError = (message, statusCode = 500, details = null) => {
  return new AppError(message, statusCode, details);
};

/**
 * Nettoie un objet des champs sensibles
 * @param {Object} obj - Objet à nettoyer
 * @param {Array} fields - Champs à supprimer
 * @returns {Object} Objet nettoyé
 */
const sanitizeObject = (
  obj,
  fields = ["motDePasse", "resetToken", "resetTokenExpiration"]
) => {
  const sanitized = { ...obj };
  fields.forEach((field) => delete sanitized[field]);
  return sanitized;
};

/**
 * Calcule la date d'expiration (date + 1 an)
 * @param {Date} startDate - Date de début
 * @returns {Date} Date d'expiration
 */
const calculateExpirationDate = (startDate = new Date()) => {
  const expiration = new Date(startDate);
  expiration.setFullYear(expiration.getFullYear() + 1);
  return expiration;
};

module.exports = {
  generateSecureToken,
  formatDateFR,
  maskEmail,
  createError,
  sanitizeObject,
  calculateExpirationDate,
  AppError,
};
