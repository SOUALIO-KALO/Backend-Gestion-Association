// backend/src/utils/AppError.js

/**
 * Classe d'erreur personnalisée pour l'application
 * Permet de créer des erreurs avec un code HTTP et des détails supplémentaires
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Erreur opérationnelle vs erreur de programmation
    this.details = details;
    this.timestamp = new Date().toISOString();

    Error.captureStackTrace(this, this.constructor);
  }

  // Méthodes statiques pour créer des erreurs communes
  static badRequest(message = "Requête invalide", details = null) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = "Non autorisé") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Accès refusé") {
    return new AppError(message, 403);
  }

  static notFound(message = "Ressource non trouvée") {
    return new AppError(message, 404);
  }

  static conflict(message = "Conflit - La ressource existe déjà") {
    return new AppError(message, 409);
  }

  static validationError(errors) {
    const error = new AppError("Erreur de validation", 422, errors);
    error.type = "validation";
    return error;
  }

  static tooManyRequests(message = "Trop de requêtes, veuillez réessayer plus tard") {
    return new AppError(message, 429);
  }

  static internal(message = "Erreur interne du serveur") {
    return new AppError(message, 500);
  }

  static serviceUnavailable(message = "Service temporairement indisponible") {
    return new AppError(message, 503);
  }

  // Convertir en objet JSON pour la réponse
  toJSON() {
    return {
      success: false,
      status: this.status,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV !== "production" && { stack: this.stack }),
    };
  }
}

module.exports = AppError;
