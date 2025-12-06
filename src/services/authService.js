// backend/src/services/authService.js

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const {
  generateToken,
  generateRefreshToken,
  verifyToken,
} = require("../config/jwt");
const {
  generateSecureToken,
  createError,
  sanitizeObject,
} = require("../utils/helpers");
const { ERRORS, DURATIONS } = require("../utils/constants");
const emailService = require("./emailService");

const prisma = new PrismaClient();

/**
 * Service d'authentification
 * Gère l'inscription, la connexion et la récupération de mot de passe
 */
class AuthService {
  /**
   * Inscrit un nouveau membre
   * @param {Object} userData - Données du membre
   * @returns {Object} Membre créé et token
   */
  async register(userData) {
    const { email, motDePasse, nom, prenom, telephone } = userData;

    // Vérifier si l'email existe déjà
    const existingMembre = await prisma.membre.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingMembre) {
      throw createError(ERRORS.EMAIL_EXISTS, 409);
    }

    // Hasher le mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(motDePasse, saltRounds);

    // Créer le membre
    const membre = await prisma.membre.create({
      data: {
        nom,
        prenom,
        email: email.toLowerCase(),
        telephone,
        motDePasse: hashedPassword,
        role: "MEMBRE",
        statut: "ACTIF",
      },
    });

    // Générer le token
    const token = generateToken({
      id: membre.id,
      email: membre.email,
      role: membre.role,
    });

    // Envoyer l'email de bienvenue
    try {
      await emailService.sendWelcomeEmail(membre);
    } catch (error) {
      console.error("Erreur envoi email bienvenue:", error);
      // On ne bloque pas l'inscription si l'email échoue
    }

    return {
      membre: sanitizeObject(membre),
      token,
    };
  }

  /**
   * Connecte un membre
   * @param {string} email - Email du membre
   * @param {string} motDePasse - Mot de passe
   * @returns {Object} Membre et token
   */
  async login(email, motDePasse) {
    // Rechercher le membre
    const membre = await prisma.membre.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!membre) {
      throw createError(ERRORS.INVALID_CREDENTIALS, 401);
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(motDePasse, membre.motDePasse);

    if (!isPasswordValid) {
      throw createError(ERRORS.INVALID_CREDENTIALS, 401);
    }

    // Vérifier si le compte est actif
    if (membre.statut === "INACTIF") {
      throw createError(
        "Votre compte est désactivé. Contactez l'administrateur.",
        403
      );
    }

    // Générer les tokens
    const token = generateToken({
      id: membre.id,
      email: membre.email,
      role: membre.role,
    });

    const refreshToken = generateRefreshToken({
      id: membre.id,
    });

    return {
      membre: sanitizeObject(membre),
      token,
      refreshToken,
    };
  }

  /**
   * Demande de réinitialisation de mot de passe
   * @param {string} email - Email du membre
   * @returns {Object} Message de confirmation
   */
  async forgotPassword(email) {
    const membre = await prisma.membre.findUnique({
      where: { email: email.toLowerCase() },
    });

    // On retourne toujours un succès pour ne pas révéler si l'email existe
    if (!membre) {
      return {
        message:
          "Si cet email existe, vous recevrez un lien de réinitialisation.",
      };
    }

    // Générer le token de réinitialisation
    const resetToken = generateSecureToken(32);
    const resetTokenExpiration = new Date(
      Date.now() + DURATIONS.RESET_TOKEN_EXPIRY
    );

    // Sauvegarder le token hashé
    const hashedToken = await bcrypt.hash(resetToken, 10);

    await prisma.membre.update({
      where: { id: membre.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiration,
      },
    });

    // Envoyer l'email
    try {
      await emailService.sendPasswordResetEmail(membre, resetToken);
    } catch (error) {
      console.error("Erreur envoi email reset:", error);
      throw createError("Erreur lors de l'envoi de l'email", 500);
    }

    return {
      message:
        "Si cet email existe, vous recevrez un lien de réinitialisation.",
    };
  }

  /**
   * Réinitialise le mot de passe
   * @param {string} token - Token de réinitialisation
   * @param {string} newPassword - Nouveau mot de passe
   * @returns {Object} Message de confirmation
   */
  async resetPassword(token, newPassword) {
    // Trouver les membres avec un token non expiré
    const membres = await prisma.membre.findMany({
      where: {
        resetToken: { not: null },
        resetTokenExpiration: { gt: new Date() },
      },
    });

    // Vérifier le token pour chaque membre
    let targetMembre = null;
    for (const membre of membres) {
      const isTokenValid = await bcrypt.compare(token, membre.resetToken);
      if (isTokenValid) {
        targetMembre = membre;
        break;
      }
    }

    if (!targetMembre) {
      throw createError(ERRORS.INVALID_TOKEN, 400);
    }

    // Hasher le nouveau mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le membre
    await prisma.membre.update({
      where: { id: targetMembre.id },
      data: {
        motDePasse: hashedPassword,
        resetToken: null,
        resetTokenExpiration: null,
      },
    });

    // Envoyer l'email de confirmation
    try {
      await emailService.sendPasswordChangedEmail(targetMembre);
    } catch (error) {
      console.error("Erreur envoi email confirmation:", error);
    }

    return {
      message:
        "Mot de passe modifié avec succès. Vous pouvez maintenant vous connecter.",
    };
  }

  /**
   * Rafraîchit le token d'accès
   * @param {string} refreshToken - Refresh token
   * @returns {Object} Nouveau token
   */
  async refreshAccessToken(refreshToken) {
    try {
      const decoded = verifyToken(refreshToken);

      const membre = await prisma.membre.findUnique({
        where: { id: decoded.id },
      });

      if (!membre || membre.statut === "INACTIF") {
        throw createError(ERRORS.INVALID_TOKEN, 401);
      }

      const newToken = generateToken({
        id: membre.id,
        email: membre.email,
        role: membre.role,
      });

      return {
        token: newToken,
        membre: sanitizeObject(membre),
      };
    } catch (error) {
      throw createError(ERRORS.INVALID_TOKEN, 401);
    }
  }

  /**
   * Récupère le profil du membre connecté
   * @param {string} membreId - ID du membre
   * @returns {Object} Profil du membre
   */
  async getProfile(membreId) {
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
      include: {
        cotisations: {
          orderBy: { datePaiement: "desc" },
          take: 5,
        },
        inscriptions: {
          include: {
            evenement: true,
          },
          orderBy: { dateInscription: "desc" },
          take: 5,
        },
      },
    });

    if (!membre) {
      throw createError(ERRORS.NOT_FOUND, 404);
    }

    return sanitizeObject(membre);
  }

  /**
   * Met à jour le mot de passe (utilisateur connecté)
   * @param {string} membreId - ID du membre
   * @param {string} currentPassword - Mot de passe actuel
   * @param {string} newPassword - Nouveau mot de passe
   */
  async changePassword(membreId, currentPassword, newPassword) {
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
    });

    if (!membre) {
      throw createError(ERRORS.NOT_FOUND, 404);
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      membre.motDePasse
    );
    if (!isPasswordValid) {
      throw createError("Mot de passe actuel incorrect", 400);
    }

    // Hasher le nouveau mot de passe
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.membre.update({
      where: { id: membreId },
      data: { motDePasse: hashedPassword },
    });

    return { message: "Mot de passe modifié avec succès" };
  }
}

module.exports = new AuthService();
