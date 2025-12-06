// backend/src/services/emailService.js

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const { transporter, emailFrom } = require("../config/email");
const { formatDateFR } = require("../utils/helpers");

/**
 * Service d'envoi d'emails
 */
class EmailService {
  constructor() {
    this.templatesDir = path.join(__dirname, "../templates/emails");
    this.templates = {};
    this.loadTemplates();
  }

  /**
   * Charge tous les templates email au démarrage
   */
  loadTemplates() {
    const templateFiles = ["welcome", "resetPassword", "passwordChanged"];

    templateFiles.forEach((name) => {
      const templatePath = path.join(this.templatesDir, `${name}.hbs`);
      if (fs.existsSync(templatePath)) {
        const templateSource = fs.readFileSync(templatePath, "utf8");
        this.templates[name] = handlebars.compile(templateSource);
      }
    });

    console.log(
      `✅ ${Object.keys(this.templates).length} templates email chargés`
    );
  }

  /**
   * Envoie un email
   * @param {Object} options - Options de l'email
   */
  async sendEmail({ to, subject, template, data }) {
    try {
      // Compiler le template
      let html;
      if (this.templates[template]) {
        html = this.templates[template](data);
      } else {
        // Fallback si le template n'existe pas
        html = `<p>${data.message || "Message de l'association"}</p>`;
      }

      const mailOptions = {
        from: emailFrom,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email envoyé à ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("❌ Erreur envoi email:", error);
      throw error;
    }
  }

  /**
   * Email de bienvenue après inscription
   * @param {Object} membre - Données du membre
   */
  async sendWelcomeEmail(membre) {
    await this.sendEmail({
      to: membre.email,
      subject: "Bienvenue dans notre association !",
      template: "welcome",
      data: {
        prenom: membre.prenom,
        nom: membre.nom,
        email: membre.email,
        dateInscription: formatDateFR(membre.dateCreation),
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        associationName: "Notre Association",
      },
    });
  }

  /**
   * Email de réinitialisation de mot de passe
   * @param {Object} membre - Données du membre
   * @param {string} resetToken - Token de réinitialisation
   */
  async sendPasswordResetEmail(membre, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to: membre.email,
      subject: "Réinitialisation de votre mot de passe",
      template: "resetPassword",
      data: {
        prenom: membre.prenom,
        resetUrl,
        expirationTime: "1 heure",
        associationName: "Notre Association",
      },
    });
  }

  /**
   * Email de confirmation de changement de mot de passe
   * @param {Object} membre - Données du membre
   */
  async sendPasswordChangedEmail(membre) {
    await this.sendEmail({
      to: membre.email,
      subject: "Votre mot de passe a été modifié",
      template: "passwordChanged",
      data: {
        prenom: membre.prenom,
        dateModification: formatDateFR(new Date()),
        contactEmail: process.env.SMTP_USER || "contact@association.fr",
        associationName: "Notre Association",
      },
    });
  }
}

module.exports = new EmailService();
