const express = require("express");
const router = express.Router();

// Import des routes
const authRoutes = require("./authRoutes");
const membreRoutes = require("./membreRoutes");
const cotisationRoutes = require("./cotisationRoutes");
const evenementRoutes = require("./evenementRoutes");
const adminRoutes = require("./adminRoutes");

// ============================================
// DÉFINITION DES ROUTES
// ============================================

router.use("/auth", authRoutes);
router.use("/membres", membreRoutes);
router.use("/cotisations", cotisationRoutes);
router.use("/evenements", evenementRoutes);
router.use("/admin", adminRoutes);

// Route d'information API
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Gestion Associative v1.0",
    endpoints: {
      auth: "/api/auth",
      membres: "/api/membres",
      cotisations: "/api/cotisations",
      evenements: "/api/evenements",
    },
    documentation: "/api/docs",
  });
});

module.exports = router;
