const express = require("express");
const router = express.Router();

const evenementController = require("../controllers/evenementController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

// ============================================
// ROUTES ÉVÉNEMENTS
// ============================================

/**
 * @route   GET /api/evenements
 * @desc    Récupérer tous les événements
 * @access  Private
 */
router.get("/", authMiddleware, evenementController.getAllEvenements);

/**
 * @route   GET /api/evenements/:id
 * @desc    Récupérer un événement par ID
 * @access  Private
 */
router.get("/:id", authMiddleware, evenementController.getEvenementById);

/**
 * @route   POST /api/evenements
 * @desc    Créer un nouvel événement
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  evenementController.createEvenement
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
  evenementController.deleteEvenement
);

module.exports = router;
