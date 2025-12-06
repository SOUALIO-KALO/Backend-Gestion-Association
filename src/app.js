const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const routes = require("./routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// ============================================
// MIDDLEWARES DE SÉCURITÉ
// ============================================

// Protection des headers HTTP
app.use(helmet());

// Configuration CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Limite de requêtes (protection DDoS)
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: "Trop de requêtes, veuillez réessayer plus tard.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ============================================
// MIDDLEWARES UTILITAIRES
// ============================================

// Parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging des requêtes (dev uniquement)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ============================================
// ROUTES
// ============================================

// Route de santé
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API opérationnelle",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes API
app.use("/api", routes);

// ============================================
// GESTION DES ERREURS
// ============================================

// Route 404
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} non trouvée`,
  });
});

// Gestionnaire d'erreurs global
app.use(errorHandler);

module.exports = app;
