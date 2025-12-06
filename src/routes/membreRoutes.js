// backend/src/routes/membreRoutes.js

const express = require("express");
const router = express.Router();
const membreController = require("../controllers/membreController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");
const {
  createMembreValidation,
  updateMembreValidation,
  updateStatutValidation,
  updateRoleValidation,
} = require("../middlewares/validators/membreValidator");

// ========== ROUTES SPÉCIFIQUES (STATIQUES) ==========
// Doivent être avant les routes paramétrées pour éviter les conflits

/**
 * @route   POST /api/membres
 * @desc    Créer un nouveau membre
 * @access  Private (Admin)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  createMembreValidation,
  membreController.createMembre
);

/**
 * @route   GET /api/membres/export
 * @desc    Exporter les membres en CSV
 * @access  Private (Admin)
 */
router.get(
  "/export",
  authMiddleware,
  requireRole("ADMIN"),
  membreController.exportMembresCSV
);

/**
 * @route   POST /api/membres/import
 * @desc    Importer des membres depuis un CSV
 * @access  Private (Admin)
 */
router.post(
  "/import",
  authMiddleware,
  requireRole("ADMIN"),
  membreController.importMembresCSV
);

/**
 * @route   GET /api/membres/statistiques
 * @desc    Récupérer les statistiques des membres
 * @access  Private (Admin)
 */
router.get(
  "/statistiques",
  authMiddleware,
  requireRole("ADMIN"),
  membreController.getStatistiques
);

/**
 * @route   GET /api/membres/me
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get("/me", authMiddleware, membreController.getMembreCurrentUser);

// ========== ROUTE GÉNÉRIQUE LIST ==========

/**
 * @route   GET /api/membres
 * @desc    Récupérer tous les membres avec pagination et filtres
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  requireRole("ADMIN"),
  membreController.getAllMembres
);

// ========== ROUTES AVEC ID ET SOUS-ROUTES ==========
// Les routes avec ID doivent venir après les routes statiques

/**
 * @route   GET /api/membres/:id/cotisations
 * @desc    Récupérer les cotisations d'un membre
 * @access  Private
 */
router.get(
  "/:id/cotisations",
  authMiddleware,
  membreController.getCotisationsMembre
);

/**
 * @route   GET /api/membres/:id/inscriptions
 * @desc    Récupérer les inscriptions d'un membre
 * @access  Private
 */
router.get(
  "/:id/inscriptions",
  authMiddleware,
  membreController.getInscriptionsMembre
);

/**
 * @route   PUT /api/membres/:id/statut
 * @desc    Modifier le statut d'un membre
 * @access  Private (Admin)
 */
router.put(
  "/:id/statut",
  authMiddleware,
  requireRole("ADMIN"),
  updateStatutValidation,
  membreController.updateStatutMembre
);

/**
 * @route   PUT /api/membres/:id/role
 * @desc    Modifier le rôle d'un membre
 * @access  Private (Admin)
 */
router.put(
  "/:id/role",
  authMiddleware,
  requireRole("ADMIN"),
  updateRoleValidation,
  membreController.updateRoleMembre
);

/**
 * @route   GET /api/membres/:id
 * @desc    Récupérer un membre par ID
 * @access  Private
 */
router.get("/:id", authMiddleware, membreController.getMembreById);

/**
 * @route   PUT /api/membres/:id
 * @desc    Mettre à jour un membre
 * @access  Private
 */
router.put(
  "/:id",
  authMiddleware,
  updateMembreValidation,
  membreController.updateMembre
);

/**
 * @route   DELETE /api/membres/:id
 * @desc    Supprimer un membre
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authMiddleware,
  requireRole("ADMIN"),
  membreController.deleteMembre
);

module.exports = router;
