// backend/src/middlewares/authMiddleware.js

const { verifyToken } = require("../config/jwt");
const { PrismaClient } = require("@prisma/client");
const { ERRORS } = require("../utils/constants");

const prisma = new PrismaClient();

/**
 * Middleware d'authentification JWT
 * Vérifie le token et ajoute l'utilisateur à la requête
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token d'authentification manquant",
      });
    }

    const token = authHeader.split(" ")[1];

    // Vérifier le token
    const decoded = verifyToken(token);

    // Récupérer le membre depuis la BDD
    const membre = await prisma.membre.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        statut: true,
      },
    });

    if (!membre) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (membre.statut === "INACTIF") {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé",
      });
    }

    // Ajouter le membre à la requête
    req.user = membre;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expiré",
        code: "TOKEN_EXPIRED",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token invalide",
      });
    }

    console.error("Erreur authMiddleware:", error);
    return res.status(500).json({
      success: false,
      message: ERRORS.SERVER_ERROR,
    });
  }
};

/**
 * Middleware optionnel - n'échoue pas si pas de token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const membre = await prisma.membre.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        statut: true,
      },
    });

    if (membre && membre.statut !== "INACTIF") {
      req.user = membre;
    }

    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuth,
};
