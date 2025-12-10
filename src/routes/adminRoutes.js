const express = require("express");
const router = express.Router();

const seedController = require("../controllers/seedController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireRole } = require("../middlewares/roleMiddleware");

/**
 * @route   POST /api/admin/seed
 * @desc    Réinitialiser et repeupler la base de données
 * @access  Private (Admin uniquement)
 */
router.post(
  "/seed",
  authMiddleware,
  requireRole("ADMIN"),
  seedController.seedDatabase
);

module.exports = router;
