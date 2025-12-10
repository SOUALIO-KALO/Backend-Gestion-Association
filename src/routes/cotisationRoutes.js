const express = require("express");
const router = express.Router();

const cotisationController = require("../controllers/cotisationController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const {
  validateCreateCotisation,
  validateUpdateCotisation,
  validateGetCotisationById,
  validateGetCotisationsByMembreId,
  validateDeleteCotisation,
  validateSearchParams,
  validateCotisationsExpirees,
  validateCotisationsAlertes,
  validateCheckStatutMembre,
} = require("../middlewares/validators/cotisationValidator");

// ============================================
// ROUTES STATIC (doivent venir en premier)
// ============================================

/**
 * @route   POST /api/cotisations
 * @desc    Créer une nouvelle cotisation
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  validateCreateCotisation,
  cotisationController.createCotisation
);

/**
 * @route   GET /api/cotisations
 * @desc    Récupérer toutes les cotisations avec pagination et filtres
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  validateSearchParams,
  cotisationController.getAllCotisations
);

/**
 * @route   GET /api/cotisations/mes-cotisations
 * @desc    Récupérer les cotisations de l'utilisateur connecté
 * @access  Private
 */
router.get(
  "/mes-cotisations",
  authMiddleware,
  cotisationController.getMesCotisations
);

/**
 * @route   GET /api/cotisations/mon-statut
 * @desc    Obtenir le statut de cotisation de l'utilisateur connecté
 * @access  Private
 */
router.get("/mon-statut", authMiddleware, cotisationController.getMonStatut);

/**
 * @route   GET /api/cotisations/statistiques
 * @desc    Obtenir les statistiques des cotisations
 * @access  Private (Admin)
 */
router.get(
  "/statistiques",
  authMiddleware,
  requireRole("ADMIN"),
  cotisationController.getStatistiques
);

/**
 * @route   GET /api/cotisations/expirees
 * @desc    Récupérer les cotisations expirées ou proches de l'expiration
 * @access  Private (Admin)
 */
router.get(
  "/expirees",
  authMiddleware,
  requireRole("ADMIN"),
  validateCotisationsExpirees,
  cotisationController.getCotisationsExpirees
);

/**
 * @route   GET /api/cotisations/alertes
 * @desc    Récupérer les cotisations proches de l'expiration (30 jours par défaut)
 * @access  Private (Admin)
 */
router.get(
  "/alertes",
  authMiddleware,
  requireRole("ADMIN"),
  validateCotisationsAlertes,
  cotisationController.getCotisationsProchesExpiration
);

/**
 * @route   POST /api/cotisations/update-statuts
 * @desc    Mettre à jour les statuts des cotisations expirées (Cron job)
 * @access  Private (Admin)
 */
router.post(
  "/update-statuts",
  authMiddleware,
  requireRole("ADMIN"),
  cotisationController.updateStatutsExpires
);

// ============================================
// ROUTES PARAMÉTRISÉES (/:id et variantes)
// ============================================

/**
 * @route   GET /api/cotisations/:id/recu
 * @desc    Générer et télécharger le reçu PDF d'une cotisation
 * @access  Private (Admin ou propriétaire)
 */
router.get(
  "/:id/recu",
  authMiddleware,
  validateGetCotisationById,
  cotisationController.genererRecuPDF
);

/**
 * @route   POST /api/cotisations/:id/rappel
 * @desc    Envoyer un email de rappel de cotisation
 * @access  Private (Admin)
 */
router.post(
  "/:id/rappel",
  authMiddleware,
  requireRole("ADMIN"),
  validateGetCotisationById,
  cotisationController.envoyerRappel
);

/**
 * @route   GET /api/cotisations/membre/:membreId
 * @desc    Récupérer les cotisations d'un membre spécifique
 * @access  Private (Admin ou propriétaire)
 */
router.get(
  "/membre/:membreId",
  authMiddleware,
  validateGetCotisationsByMembreId,
  cotisationController.getCotisationsByMembreId
);

/**
 * @route   GET /api/cotisations/statut/:membreId
 * @desc    Vérifier le statut de cotisation d'un membre
 * @access  Private (Admin ou propriétaire)
 */
router.get(
  "/statut/:membreId",
  authMiddleware,
  validateCheckStatutMembre,
  cotisationController.checkStatutCotisationMembre
);

/**
 * @route   GET /api/cotisations/:id
 * @desc    Récupérer une cotisation par son ID
 * @access  Private (Admin ou propriétaire)
 */
router.get(
  "/:id",
  authMiddleware,
  validateGetCotisationById,
  cotisationController.getCotisationById
);

/**
 * @route   PUT /api/cotisations/:id
 * @desc    Mettre à jour une cotisation
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  validateUpdateCotisation,
  cotisationController.updateCotisation
);

/**
 * @route   DELETE /api/cotisations/:id
 * @desc    Supprimer une cotisation
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  validateDeleteCotisation,
  cotisationController.deleteCotisation
);

module.exports = router;
