// backend/src/controllers/authController.js

const authService = require("../services/authService");

/**
 * Contrôleur d'authentification
 */
class AuthController {
  /**
   * POST /api/auth/register
   * Inscription d'un nouveau membre
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        success: true,
        message: "Inscription réussie",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Connexion d'un membre
   */
  async login(req, res, next) {
    try {
      const { email, motDePasse } = req.body;
      const result = await authService.login(email, motDePasse);

      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Déconnexion (côté client principalement)
   */
  async logout(req, res, next) {
    try {
      // La déconnexion est gérée côté client (suppression du token)
      // Ici on peut ajouter une logique de blacklist si nécessaire

      res.status(200).json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Demande de réinitialisation du mot de passe
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Réinitialisation du mot de passe avec token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, motDePasse } = req.body;
      const result = await authService.resetPassword(token, motDePasse);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Rafraîchissement du token d'accès
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        message: "Token rafraîchi",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Récupère le profil de l'utilisateur connecté
   */
  async getProfile(req, res, next) {
    try {
      const membre = await authService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/change-password
   * Changement de mot de passe (utilisateur connecté)
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/verify
   * Vérifie si le token est valide
   */
  async verifyToken(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: "Token valide",
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
