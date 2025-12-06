// backend/src/middlewares/validators/membreValidator.js

const { body, param, validationResult } = require("express-validator");

/**
 * Middleware de gestion des erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Règles de validation pour la création d'un membre
 */
const createMembreValidation = [
  body("nom")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le nom contient des caractères non autorisés"),

  body("prenom")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis")
    .isLength({ min: 2, max: 100 })
    .withMessage("Le prénom doit contenir entre 2 et 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le prénom contient des caractères non autorisés"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email trop long (max 255 caractères)"),

  body("motDePasse")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
    ),

  body("telephone")
    .optional()
    .trim()
    .matches(/^(\+?33|0)[1-9](?:[0-9]{8})$/)
    .withMessage("Numéro de téléphone invalide"),

  body("role")
    .optional()
    .isIn(["ADMIN", "MEMBRE"])
    .withMessage("Rôle invalide"),

  body("statut")
    .optional()
    .isIn(["ACTIF", "INACTIF", "BUREAU"])
    .withMessage("Statut invalide"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la mise à jour d'un membre
 */
const updateMembreValidation = [
  body("nom")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Le nom doit contenir entre 2 et 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le nom contient des caractères non autorisés"),

  body("prenom")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Le prénom doit contenir entre 2 et 100 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le prénom contient des caractères non autorisés"),

  body("telephone")
    .optional()
    .trim()
    .matches(/^(\+?33|0)[1-9](?:[0-9]{8})$/)
    .withMessage("Numéro de téléphone invalide"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email invalide")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email trop long (max 255 caractères)"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la mise à jour du statut
 */
const updateStatutValidation = [
  body("statut")
    .notEmpty()
    .withMessage("Le statut est requis")
    .isIn(["ACTIF", "INACTIF", "BUREAU"])
    .withMessage("Statut invalide. Valeurs autorisées: ACTIF, INACTIF, BUREAU"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la mise à jour du rôle
 */
const updateRoleValidation = [
  body("role")
    .notEmpty()
    .withMessage("Le rôle est requis")
    .isIn(["ADMIN", "MEMBRE"])
    .withMessage("Rôle invalide. Valeurs autorisées: ADMIN, MEMBRE"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la récupération par ID
 */
const getMembreValidation = [
  param("id").isUUID().withMessage("ID invalide"),

  handleValidationErrors,
];

module.exports = {
  createMembreValidation,
  updateMembreValidation,
  updateStatutValidation,
  updateRoleValidation,
  getMembreValidation,
  handleValidationErrors,
};
