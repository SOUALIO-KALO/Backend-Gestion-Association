const { body, query, validationResult } = require("express-validator");
const { isPast, isAfter } = require("date-fns");

/**
 * Validation middleware pour créer une cotisation
 */
exports.validateCreateCotisation = [
  body("membreId")
    .isString()
    .withMessage("membreId doit être une chaîne valide (UUID)"),
  body("datePaiement")
    .isISO8601()
    .withMessage("datePaiement doit être une date valide")
    .custom((value) => {
      if (isAfter(new Date(value), new Date())) {
        throw new Error("La date de paiement ne peut pas être dans le futur");
      }
      return true;
    }),
  body("montant")
    .isFloat({ min: 0.01 })
    .withMessage("montant doit être un nombre positif"),
  body("modePaiement")
    .isIn(["VIREMENT", "ESPECES", "CHEQUE", "CARTE_BANCAIRE"])
    .withMessage(
      "modePaiement doit être VIREMENT, ESPECES, CHEQUE ou CARTE_BANCAIRE"
    ),
  body("notes").optional().isString().withMessage("notes doit être un texte"),

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
 * Validation middleware pour mettre à jour une cotisation
 */
exports.validateUpdateCotisation = [
  body("datePaiement")
    .optional()
    .isISO8601()
    .withMessage("datePaiement doit être une date valide")
    .custom((value) => {
      if (isAfter(new Date(value), new Date())) {
        throw new Error("La date de paiement ne peut pas être dans le futur");
      }
      return true;
    }),
  body("montant")
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage("montant doit être un nombre positif"),
  body("modePaiement")
    .optional()
    .isIn(["VIREMENT", "ESPECES", "CHEQUE", "CARTE_BANCAIRE"])
    .withMessage(
      "modePaiement doit être VIREMENT, ESPECES, CHEQUE ou CARTE_BANCAIRE"
    ),
  body("statut")
    .optional()
    .isIn(["A_JOUR", "EXPIRE", "EN_ATTENTE"])
    .withMessage("statut doit être A_JOUR, EXPIRE ou EN_ATTENTE"),
  body("notes").optional().isString().withMessage("notes doit être un texte"),

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
 * Validation middleware pour récupérer une cotisation par ID
 */
exports.validateGetCotisationById = [
  (req, res, next) => {
    const { id } = req.params;
    // UUID format: 8-4-4-4-12 hex digits
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID doit être un UUID valide",
      });
    }
    next();
  },
];

/**
 * Validation middleware pour récupérer les cotisations d'un membre
 */
exports.validateGetCotisationsByMembreId = [
  (req, res, next) => {
    const { membreId } = req.params;
    // UUID format: 8-4-4-4-12 hex digits
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(membreId)) {
      return res.status(400).json({
        success: false,
        message: "membreId doit être un UUID valide",
      });
    }
    next();
  },
];

/**
 * Validation middleware pour supprimer une cotisation
 */
exports.validateDeleteCotisation = [
  (req, res, next) => {
    const { id } = req.params;
    // UUID format: 8-4-4-4-12 hex digits
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "ID doit être un UUID valide",
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
  query("statut")
    .optional()
    .isIn(["A_JOUR", "EXPIRE", "EN_ATTENTE"])
    .withMessage("statut doit être A_JOUR, EXPIRE ou EN_ATTENTE"),
  query("membreId")
    .optional()
    .isUUID()
    .withMessage("membreId doit être un UUID valide"),

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
 * Validation middleware pour les cotisations expirées
 */
exports.validateCotisationsExpirees = [
  (req, res, next) => {
    next();
  },
];

/**
 * Validation middleware pour les alertes cotisations
 */
exports.validateCotisationsAlertes = [
  query("jours")
    .optional()
    .isInt({ min: 1 })
    .withMessage("jours doit être un entier >= 1"),

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
 * Validation middleware pour vérifier le statut de cotisation d'un membre
 */
exports.validateCheckStatutMembre = [
  (req, res, next) => {
    const { membreId } = req.params;
    // UUID format: 8-4-4-4-12 hex digits
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(membreId)) {
      return res.status(400).json({
        success: false,
        message: "membreId doit être un UUID valide",
      });
    }
    next();
  },
];
