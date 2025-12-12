const AppError = require("../utils/AppError");

/**
 * Messages d'erreur Prisma en français
 */
const PRISMA_ERROR_MESSAGES = {
  P2000: "La valeur fournie est trop longue pour ce champ",
  P2001: "L'enregistrement recherché n'existe pas",
  P2002: "Un enregistrement avec cette valeur existe déjà",
  P2003: "Violation de contrainte de clé étrangère",
  P2004: "Contrainte de base de données violée",
  P2005: "Valeur invalide pour ce type de champ",
  P2006: "La valeur fournie n'est pas valide",
  P2007: "Erreur de validation des données",
  P2008: "Requête invalide",
  P2009: "Requête invalide",
  P2010: "Transaction échouée",
  P2011: "Contrainte de non-nullité violée",
  P2012: "Valeur requise manquante",
  P2013: "Argument requis manquant",
  P2014: "Violation de relation requise",
  P2015: "Enregistrement lié non trouvé",
  P2016: "Erreur d'interprétation de la requête",
  P2017: "Enregistrements liés non connectés",
  P2018: "Enregistrements liés requis non trouvés",
  P2019: "Erreur d'entrée",
  P2020: "Valeur hors limites",
  P2021: "Table non trouvée",
  P2022: "Colonne non trouvée",
  P2023: "Données de colonne incohérentes",
  P2024: "Timeout de connexion à la base de données",
  P2025: "Enregistrement non trouvé",
  P2026: "Fonctionnalité non supportée",
  P2027: "Erreurs multiples lors de l'exécution",
  P2028: "Erreur de l'API de transaction",
  P2030: "Index fulltext non trouvé",
  P2031: "MongoDB replica set requis",
  P2033: "Nombre trop grand pour ce type",
  P2034: "Transaction échouée en raison d'un conflit ou deadlock",
};

/**
 * Logger d'erreurs structuré
 */
const logError = (err, req) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || "anonymous",
    errorName: err.name,
    errorMessage: err.message,
    errorCode: err.code,
    statusCode: err.statusCode || 500,
  };

  if (process.env.NODE_ENV === "development") {
    console.error("❌ ERROR LOG:", JSON.stringify(errorLog, null, 2));
    console.error("Stack:", err.stack);
  } else {
    // En production, on log de manière plus concise
    console.error(`❌ [${errorLog.timestamp}] ${errorLog.method} ${errorLog.url} - ${errorLog.errorMessage}`);
  }
};

/**
 * Gère les erreurs Prisma
 */
const handlePrismaError = (err, res) => {
  const code = err.code;
  
  // Contrainte unique violée
  if (code === "P2002") {
    const field = err.meta?.target?.[0] || "champ";
    const fieldMessages = {
      email: "Cette adresse email est déjà utilisée",
      telephone: "Ce numéro de téléphone est déjà utilisé",
      reference: "Cette référence existe déjà",
    };
    return res.status(409).json({
      success: false,
      code: "DUPLICATE_ENTRY",
      message: fieldMessages[field] || `Un enregistrement avec ce ${field} existe déjà`,
      field,
    });
  }

  // Enregistrement non trouvé
  if (code === "P2025") {
    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      message: err.meta?.cause || "Enregistrement non trouvé",
    });
  }

  // Violation de clé étrangère
  if (code === "P2003") {
    return res.status(400).json({
      success: false,
      code: "FOREIGN_KEY_VIOLATION",
      message: "Référence à un enregistrement inexistant",
      field: err.meta?.field_name,
    });
  }

  // Timeout de connexion
  if (code === "P2024") {
    return res.status(503).json({
      success: false,
      code: "DATABASE_TIMEOUT",
      message: "La base de données ne répond pas. Veuillez réessayer.",
    });
  }

  // Autres erreurs Prisma
  const message = PRISMA_ERROR_MESSAGES[code] || "Erreur de base de données";
  return res.status(400).json({
    success: false,
    code: `PRISMA_${code}`,
    message,
  });
};

/**
 * Gère les erreurs JWT
 */
const handleJWTError = (err, res) => {
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Token invalide. Veuillez vous reconnecter.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Votre session a expiré. Veuillez vous reconnecter.",
      expiredAt: err.expiredAt,
    });
  }

  if (err.name === "NotBeforeError") {
    return res.status(401).json({
      success: false,
      code: "TOKEN_NOT_ACTIVE",
      message: "Le token n'est pas encore actif.",
    });
  }

  return null;
};

/**
 * Gère les erreurs de validation (express-validator)
 */
const handleValidationError = (err, res) => {
  if (err.type === "validation" || err.name === "ValidationError") {
    return res.status(422).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Les données fournies sont invalides",
      errors: err.errors || err.details || [{ message: err.message }],
    });
  }
  return null;
};

/**
 * Gère les erreurs de syntaxe JSON
 */
const handleSyntaxError = (err, res) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      code: "INVALID_JSON",
      message: "Le corps de la requête contient du JSON invalide",
    });
  }
  return null;
};

/**
 * Gère les erreurs de payload trop grand
 */
const handlePayloadError = (err, res) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      code: "PAYLOAD_TOO_LARGE",
      message: "La taille des données envoyées dépasse la limite autorisée",
    });
  }
  return null;
};

/**
 * Gestionnaire d'erreurs global
 * Capture toutes les erreurs et renvoie une réponse formatée
 */
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur
  logError(err, req);

  // Ne pas renvoyer de réponse si déjà envoyée
  if (res.headersSent) {
    return next(err);
  }

  // Erreur de syntaxe JSON
  const syntaxResponse = handleSyntaxError(err, res);
  if (syntaxResponse) return;

  // Erreur de payload
  const payloadResponse = handlePayloadError(err, res);
  if (payloadResponse) return;

  // Erreurs Prisma
  if (err.code && err.code.startsWith("P")) {
    return handlePrismaError(err, res);
  }

  // Erreurs JWT
  const jwtResponse = handleJWTError(err, res);
  if (jwtResponse) return;

  // Erreurs de validation
  const validationResponse = handleValidationError(err, res);
  if (validationResponse) return;

  // AppError personnalisée
  if (err instanceof AppError || err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      code: err.code || "APP_ERROR",
      message: err.message,
      // Exposer directement le champ concerné si fourni dans details
      ...(err.details?.field && { field: err.details.field }),
      ...(err.details && { details: err.details }),
    });
  }

  // Erreur avec statusCode personnalisé
  if (err.statusCode && err.statusCode !== 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Erreur serveur par défaut (500)
  const isProduction = process.env.NODE_ENV === "production";
  
  res.status(500).json({
    success: false,
    code: "INTERNAL_ERROR",
    message: isProduction 
      ? "Une erreur inattendue s'est produite. Veuillez réessayer plus tard."
      : err.message,
    ...(!isProduction && { 
      stack: err.stack,
      name: err.name,
    }),
  });
};

/**
 * Middleware pour les routes non trouvées
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    code: "ROUTE_NOT_FOUND",
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
  });
};

module.exports = { errorHandler, notFoundHandler };
