// backend/src/config/email.js

const nodemailer = require("nodemailer");

/**
 * Configuration du transporteur email
 * Supporte Gmail, SMTP personnalisé et MailHog (dev)
 */
const createTransporter = () => {
  // Mode développement avec MailHog
  if (process.env.NODE_ENV === "development" && !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      ignoreTLS: true,
    });
  }

  // Configuration SMTP personnalisée
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Vérifie la connexion au serveur email
 * @returns {Promise<boolean>}
 */
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Connexion au serveur email établie");
    return true;
  } catch (error) {
    console.warn("⚠️ Serveur email non disponible:", error.message);
    return false;
  }
};

module.exports = {
  transporter,
  verifyConnection,
  emailFrom: process.env.EMAIL_FROM || "Association <noreply@association.fr>",
};
