// backend/src/utils/constants.js

/**
 * Constantes de l'application
 */
module.exports = {
  // Rôles utilisateur
  ROLES: {
    ADMIN: "ADMIN",
    MEMBRE: "MEMBRE",
  },

  // Statuts membre
  STATUT_MEMBRE: {
    ACTIF: "ACTIF",
    INACTIF: "INACTIF",
    BUREAU: "BUREAU",
  },

  // Statuts cotisation
  STATUT_COTISATION: {
    A_JOUR: "A_JOUR",
    EXPIRE: "EXPIRE",
    EN_ATTENTE: "EN_ATTENTE",
  },

  // Modes de paiement
  MODE_PAIEMENT: {
    ESPECES: "ESPECES",
    CHEQUE: "CHEQUE",
    VIREMENT: "VIREMENT",
    CARTE_BANCAIRE: "CARTE_BANCAIRE",
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 25,
    MAX_LIMIT: 100,
  },

  // Durées en millisecondes
  DURATIONS: {
    RESET_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 heure
    COTISATION_YEAR: 365 * 24 * 60 * 60 * 1000, // 1 an
  },

  // Messages d'erreur
  ERRORS: {
    UNAUTHORIZED: "Non autorisé",
    FORBIDDEN: "Accès interdit",
    NOT_FOUND: "Ressource non trouvée",
    INVALID_CREDENTIALS: "Email ou mot de passe incorrect",
    EMAIL_EXISTS: "Cet email est déjà utilisé",
    INVALID_TOKEN: "Token invalide ou expiré",
    SERVER_ERROR: "Erreur interne du serveur",
  },
};
