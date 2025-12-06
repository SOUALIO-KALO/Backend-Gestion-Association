// backend/src/routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  refreshTokenValidation,
} = require("../middlewares/validators/authValidator");

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouveau membre
 * @access  Public
 */
router.post("/register", registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un membre
 * @access  Public
 */
router.post("/login", loginValidation, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion
 * @access  Private
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation du mot de passe
 * @access  Public
 */
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialisation du mot de passe avec token
 * @access  Public
 */
router.post(
  "/reset-password",
  resetPasswordValidation,
  authController.resetPassword
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Rafraîchissement du token d'accès
 * @access  Public (avec refresh token)
 */
router.post(
  "/refresh-token",
  refreshTokenValidation,
  authController.refreshToken
);

/**
 * @route   GET /api/auth/me
 * @desc    Récupère le profil de l'utilisateur connecté
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getProfile);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Changement de mot de passe
 * @access  Private
 */
router.put(
  "/change-password",
  authMiddleware,
  changePasswordValidation,
  authController.changePassword
);

/**
 * @route   GET /api/auth/verify
 * @desc    Vérifie si le token est valide
 * @access  Private
 */
router.get("/verify", authMiddleware, authController.verifyToken);

module.exports = router;
