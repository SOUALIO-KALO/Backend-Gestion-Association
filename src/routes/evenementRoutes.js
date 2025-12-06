const express = require("express");
const router = express.Router();

const evenementController = require("../controllers/evenementController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const {
  validateCreateEvenement,
  validateUpdateEvenement,
  validateGetEvenementById,
  validateSearchParams,
} = require("../middlewares/validators/evenementValidator");

// ============================================
// ROUTES STATIQUES (doivent venir en premier)
// ============================================

/**
 * @route   POST /api/evenements
 * @desc    Créer un nouvel événement
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  validateCreateEvenement,
  evenementController.createEvenement
);

/**
 * @route   GET /api/evenements
 * @desc    Récupérer tous les événements
 * @access  Private
 */
router.get(
  "/",
  authMiddleware,
  validateSearchParams,
  evenementController.getAllEvenements
);

/**
 * @route   GET /api/evenements/calendrier
 * @desc    Récupérer les événements pour le calendrier
 * @access  Private
 */
router.get("/calendrier", authMiddleware, evenementController.getCalendrier);

/**
 * @route   GET /api/evenements/statistiques
 * @desc    Récupérer les statistiques des événements
 * @access  Private (Admin)
 */
router.get(
  "/statistiques",
  authMiddleware,
  requireRole("ADMIN"),
  evenementController.getStatistiques
);

// ============================================
// ROUTES PARAMÉTRISÉES (/:id et variantes)
// ============================================

/**
 * @route   GET /api/evenements/:id
 * @desc    Récupérer un événement par ID
 * @access  Private
 */
router.get(
  "/:id",
  authMiddleware,
  validateGetEvenementById,
  evenementController.getEvenementById
);

/**
 * @route   PUT /api/evenements/:id
 * @desc    Mettre à jour un événement
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  validateUpdateEvenement,
  evenementController.updateEvenement
);

/**
 * @route   DELETE /api/evenements/:id
 * @desc    Supprimer un événement
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  validateGetEvenementById,
  evenementController.deleteEvenement
);

/**
 * @route   GET /api/evenements/:id/participants
 * @desc    Récupérer les participants d'un événement
 * @access  Private (Admin)
 */
router.get(
  "/:id/participants",
  authMiddleware,
  requireRole("ADMIN"),
  validateGetEvenementById,
  evenementController.getParticipants
);

/**
 * @route   POST /api/evenements/:id/inscription
 * @desc    S'inscrire à un événement
 * @access  Private
 */
router.post(
  "/:id/inscription",
  authMiddleware,
  validateGetEvenementById,
  evenementController.inscrire
);

/**
 * @route   DELETE /api/evenements/:id/inscription
 * @desc    Se désinscrire d'un événement
 * @access  Private
 */
router.delete(
  "/:id/inscription",
  authMiddleware,
  validateGetEvenementById,
  evenementController.desinscrire
);

module.exports = router;
