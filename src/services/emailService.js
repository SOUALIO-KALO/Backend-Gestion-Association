// backend/src/services/emailService.js

const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");
const Brevo = require("@getbrevo/brevo");
const { transporter, emailFrom } = require("../config/email");
const { formatDateFR } = require("../utils/helpers");

// Initialiser Brevo si la clé API est disponible
let brevoClient = null;
if (process.env.BREVO_API_KEY) {
  brevoClient = new Brevo.TransactionalEmailsApi();
  brevoClient.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  console.log("✅ Brevo configuré avec succès");
} else {
  console.log("⚠️ BREVO_API_KEY non configurée - mode SMTP/simulation");
}

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
    const templateFiles = ["welcome", "resetPassword", "passwordChanged", "rappelCotisation"];

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
   * Envoie un email via Resend (prioritaire) ou SMTP (fallback)
   * @param {Object} options - Options de l'email
   */
  async sendEmail({ to, subject, template, data }) {
    // Compiler le template
    let html;
    if (this.templates[template]) {
      html = this.templates[template](data);
    } else {
      html = `<p>${data.message || "Message de l'association"}</p>`;
    }

    // Utiliser Brevo si disponible
    if (brevoClient) {
      try {
        console.log(`📤 [Brevo] Envoi en cours à ${to}...`);
        
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.sender = { 
          name: process.env.BREVO_SENDER_NAME || "Association", 
          email: process.env.BREVO_SENDER_EMAIL || "noreply@association.fr" 
        };
        sendSmtpEmail.to = [{ email: to }];
        
        const result = await brevoClient.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ [Brevo] Email envoyé à ${to} - ID: ${result.messageId}`);
        return result;
      } catch (error) {
        console.error("❌ [Brevo] Erreur:", error.body || error.message);
        throw new Error(error.body?.message || error.message || "Erreur Brevo");
      }
    }

    // Fallback SMTP
    try {
      const mailOptions = {
        from: emailFrom,
        to,
        subject,
        html,
      };
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 [SMTP] Email envoyé à ${to}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error("❌ [SMTP] Erreur:", error.message);
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

  /**
   * Email de rappel de cotisation
   * @param {Object} membre - Données du membre
   * @param {Object} cotisation - Données de la cotisation
   */
  async sendCotisationRappelEmail(membre, cotisation) {
    const joursRestants = Math.ceil(
      (new Date(cotisation.dateExpiration) - new Date()) / (1000 * 60 * 60 * 24)
    );

    await this.sendEmail({
      to: membre.email,
      subject: `Rappel : Votre cotisation expire ${joursRestants > 0 ? `dans ${joursRestants} jours` : 'bientôt'}`,
      template: "rappelCotisation",
      data: {
        prenom: membre.prenom,
        nom: membre.nom,
        dateExpiration: formatDateFR(cotisation.dateExpiration),
        joursRestants: joursRestants > 0 ? joursRestants : 0,
        montant: cotisation.montant,
        associationName: "Notre Association",
        contactEmail: process.env.SMTP_USER || "contact@association.fr",
      },
    });
  }
}

module.exports = new EmailService();
