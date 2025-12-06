// backend/src/utils/asyncHandler.js

/**
 * Wrapper pour les fonctions async des contrôleurs
 * Évite d'avoir à écrire try-catch dans chaque contrôleur
 * Les erreurs sont automatiquement passées au middleware errorHandler
 * 
 * @param {Function} fn - Fonction async du contrôleur
 * @returns {Function} Fonction middleware Express
 * 
 * @example
 * // Avant (avec try-catch)
 * exports.getUsers = async (req, res, next) => {
 *   try {
 *     const users = await userService.getAll();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * // Après (avec asyncHandler)
 * exports.getUsers = asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * });
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wrapper pour les services async
 * Ajoute du logging et de la gestion d'erreurs standardisée
 * 
 * @param {Function} fn - Fonction async du service
 * @param {string} operationName - Nom de l'opération pour le logging
 * @returns {Function} Fonction wrappée
 */
const asyncService = (fn, operationName = "operation") => {
  return async (...args) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      if (process.env.NODE_ENV === "development") {
        console.log(`✅ ${operationName} completed in ${duration}ms`);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error.message);
      throw error;
    }
  };
};

module.exports = { asyncHandler, asyncService };
