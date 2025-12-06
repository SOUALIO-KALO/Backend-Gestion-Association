const { body, query, validationResult } = require("express-validator");

/**
 * Validation middleware pour créer un événement
 */
exports.validateCreateEvenement = [
  body("titre").isString().trim().notEmpty().withMessage("titre est requis"),
  body("description").optional().isString().trim(),
  body("dateEvenement")
    .isISO8601()
    .withMessage("dateEvenement doit être une date valide"),
  body("lieu").optional().isString().trim(),
  body("capacite")
    .optional()
    .isInt({ min: 1 })
    .withMessage("capacite doit être un nombre positif"),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Erreurs de validation",
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * Validation middleware pour mettre à jour un événement
 */
exports.validateUpdateEvenement = [
  body("titre").optional().isString().trim(),
  body("description").optional().isString().trim(),
  body("dateEvenement")
    .optional()
    .isISO8601()
    .withMessage("dateEvenement doit être une date valide"),
  body("lieu").optional().isString().trim(),
  body("capacite")
    .optional()
    .isInt({ min: 1 })
    .withMessage("capacite doit être un nombre positif"),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Erreurs de validation",
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * Validation middleware pour récupérer un événement par ID
 */
exports.validateGetEvenementById = [
  (req, res, next) => {
    const { id } = req.params;
    if (!Number.isInteger(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: "ID doit être un entier valide",
      });
    }
    next();
  },
];

/**
 * Validation middleware pour les paramètres de recherche
 */
exports.validateSearchParams = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page doit être un entier >= 1"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit doit être entre 1 et 100"),

  // Middleware pour gérer les erreurs de validation
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Erreurs de validation",
        errors: errors.array(),
      });
    }
    next();
  },
];
