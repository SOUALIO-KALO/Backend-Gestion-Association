/**
 * Gestionnaire d'erreurs global
 * Capture toutes les erreurs et renvoie une réponse formatée
 */
const errorHandler = (err, req, res, next) => {
  console.error("❌ Erreur:", err);

  // Erreur Prisma - Contrainte unique violée
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "champ";
    return res.status(409).json({
      success: false,
      message: `Un enregistrement avec ce ${field} existe déjà`,
      field,
    });
  }

  // Erreur Prisma - Enregistrement non trouvé
  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Enregistrement non trouvé",
    });
  }

  // Erreur JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expiré, veuillez vous reconnecter",
    });
  }

  // Erreur de validation
  if (err.name === "ValidationError" || err.type === "validation") {
    return res.status(400).json({
      success: false,
      message: "Erreur de validation",
      errors: err.errors || err.message,
    });
  }

  // Erreur personnalisée avec statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erreur serveur par défaut
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Erreur interne du serveur"
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
