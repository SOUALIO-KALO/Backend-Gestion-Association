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

module.exports = router;
