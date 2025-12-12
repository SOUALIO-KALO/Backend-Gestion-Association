// backend/src/middlewares/validators/authValidator.js

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
 * Règles de validation pour l'inscription
 */
const registerValidation = [
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

  body("telephone")
    .notEmpty()
    .withMessage("Le téléphone est requis")
    .bail()
    .trim()
    .matches(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
    .withMessage("Format de téléphone invalide"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la connexion
 */
const loginValidation = [
  body("email").trim().isEmail().withMessage("Email invalide").normalizeEmail(),

  body("motDePasse").notEmpty().withMessage("Le mot de passe est requis"),

  handleValidationErrors,
];

/**
 * Règles de validation pour la demande de réinitialisation
 */
const forgotPasswordValidation = [
  body("email").trim().isEmail().withMessage("Email invalide").normalizeEmail(),

  handleValidationErrors,
];

/**
 * Règles de validation pour la réinitialisation du mot de passe
 */
const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("Token requis")
    .isLength({ min: 64, max: 64 })
    .withMessage("Token invalide"),

  body("motDePasse")
    .isLength({ min: 8 })
    .withMessage("Le mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
    ),

  body("confirmMotDePasse").custom((value, { req }) => {
    if (value !== req.body.motDePasse) {
      throw new Error("Les mots de passe ne correspondent pas");
    }
    return true;
  }),

  handleValidationErrors,
];

/**
 * Règles de validation pour le changement de mot de passe
 */
const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Le mot de passe actuel est requis"),

  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Le nouveau mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error(
          "Le nouveau mot de passe doit être différent de l'ancien"
        );
      }
      return true;
    }),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }
    return true;
  }),

  handleValidationErrors,
];

/**
 * Validation du refresh token
 */
const refreshTokenValidation = [
  body("refreshToken").notEmpty().withMessage("Refresh token requis"),

  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  refreshTokenValidation,
  handleValidationErrors,
};
