const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { format } = require("date-fns");
const { fr } = require("date-fns/locale");

/**
 * Service de génération de reçus PDF pour les cotisations
 */
class PDFService {
  /**
   * Générer un reçu PDF pour une cotisation
   * @param {Object} cotisation - Données de la cotisation avec le membre
   * @returns {Promise<String>} Chemin du fichier PDF généré
   */
  async genererRecuCotisation(cotisation) {
    return new Promise(async (resolve, reject) => {
      try {
        // Créer le dossier uploads/receipts s'il n'existe pas
        const uploadsDir = path.join(__dirname, "../../uploads/receipts");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Nom du fichier
        const fileName = `recu_${cotisation.reference}.pdf`;
        const filePath = path.join(uploadsDir, fileName);

        // Créer le document PDF
        const doc = new PDFDocument({
          size: "A4",
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
          },
        });

        // Stream vers le fichier
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // === EN-TÊTE ===
        this._ajouterEnTete(doc);

        // === TITRE ===
        doc.moveDown(2);
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("REÇU DE COTISATION", { align: "center" });

        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#666666")
          .text(`Référence : ${cotisation.reference}`, { align: "center" });

        // === INFORMATIONS DU MEMBRE ===
        doc.moveDown(2);
        this._ajouterSectionMembre(doc, cotisation.membre);

        // === DÉTAILS DE LA COTISATION ===
        doc.moveDown(1.5);
        this._ajouterDetailsCotisation(doc, cotisation);

        // === MONTANT ===
        doc.moveDown(2);
        this._ajouterMontant(doc, cotisation.montant);

        // === MODE DE PAIEMENT ===
        doc.moveDown(1.5);
        this._ajouterModePaiement(doc, cotisation.modePaiement);

        // === NOTES (si présentes) ===
        if (cotisation.notes) {
          doc.moveDown(1.5);
          this._ajouterNotes(doc, cotisation.notes);
        }

        // === PIED DE PAGE ===
        this._ajouterPiedDePage(doc, cotisation);

        // === SIGNATURE ===
        doc.moveDown(3);
        this._ajouterSignature(doc);

        // Finaliser le PDF
        doc.end();

        // Attendre que le fichier soit écrit
        stream.on("finish", () => {
          resolve({ filePath, fileName });
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Ajouter l'en-tête avec logo et coordonnées de l'association
   * @private
   */
  _ajouterEnTete(doc) {
    const headerY = 50;

    // Logo (cercle avec initiales pour l'exemple)
    doc.circle(50, headerY, 25).fillAndStroke("#2563eb", "#1e40af");

    doc
      .fontSize(16)
      .fillColor("white")
      .font("Helvetica-Bold")
      .text("GA", 32, headerY - 8);

    // Informations de l'association
    doc
      .fillColor("#1f2937")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("GESTION ASSOCIATIVE", 90, headerY - 5);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6b7280")
      .text("Association loi 1901", 90, headerY + 15);

    doc.text("Email: contact@association.org", 90, headerY + 28);
    doc.text("Tél: +225 01 02 03 04 05", 90, headerY + 40);

    // Ligne de séparation
    doc
      .moveTo(50, headerY + 65)
      .lineTo(545, headerY + 65)
      .strokeColor("#e5e7eb")
      .stroke();
  }

  /**
   * Ajouter la section informations du membre
   * @private
   */
  _ajouterSectionMembre(doc, membre) {
    const startY = doc.y;

    // Cadre
    doc.rect(50, startY, 495, 80).fillAndStroke("#f9fafb", "#e5e7eb");

    // Contenu
    doc
      .fillColor("#1f2937")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("INFORMATIONS DU MEMBRE", 65, startY + 15);

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    doc.text(`Nom complet : ${membre.prenom} ${membre.nom}`, 65, startY + 35);
    doc.text(`Email : ${membre.email}`, 65, startY + 50);

    if (membre.telephone) {
      doc.text(`Téléphone : ${membre.telephone}`, 65, startY + 65);
    }

    doc.moveDown();
  }

  /**
   * Ajouter les détails de la cotisation
   * @private
   */
  _ajouterDetailsCotisation(doc, cotisation) {
    const startY = doc.y;

    // Cadre
    doc.rect(50, startY, 495, 95).fillAndStroke("#eff6ff", "#bfdbfe");

    // Contenu
    doc
      .fillColor("#1e40af")
      .fontSize(11)
      .font("Helvetica-Bold")
      .text("DÉTAILS DE LA COTISATION", 65, startY + 15);

    doc.fontSize(10).font("Helvetica").fillColor("#374151");

    const datePaiement = format(
      new Date(cotisation.datePaiement),
      "dd MMMM yyyy",
      { locale: fr }
    );
    const dateExpiration = format(
      new Date(cotisation.dateExpiration),
      "dd MMMM yyyy",
      { locale: fr }
    );

    doc.text(`Date de paiement : ${datePaiement}`, 65, startY + 35);
    doc.text(`Date d'expiration : ${dateExpiration}`, 65, startY + 50);
    doc.text(`Période de validité : 12 mois`, 65, startY + 65);
    doc.text(
      `Statut : ${this._getStatutLabel(cotisation.statut)}`,
      65,
      startY + 80
    );

    doc.moveDown();
  }

  /**
   * Ajouter le montant de manière mise en valeur
   * @private
   */
  _ajouterMontant(doc, montant) {
    const startY = doc.y;

    // Grand cadre coloré
    doc.rect(50, startY, 495, 60).fillAndStroke("#dcfce7", "#86efac");

    // Label
    doc
      .fillColor("#166534")
      .fontSize(11)
      .font("Helvetica")
      .text("MONTANT PAYÉ", 65, startY + 12);

    // Montant
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(`${parseFloat(montant).toFixed(0)} FCFA`, 65, startY + 28);

    doc.moveDown();
  }

  /**
   * Ajouter le mode de paiement
   * @private
   */
  _ajouterModePaiement(doc, modePaiement) {
    doc.fillColor("#374151").fontSize(10).font("Helvetica");

    const modePaiementLabel = this._getModePaiementLabel(modePaiement);

    doc
      .text(`Mode de paiement : `, 50, doc.y, { continued: true })
      .font("Helvetica-Bold")
      .text(modePaiementLabel);
  }

  /**
   * Ajouter les notes (si présentes)
   * @private
   */
  _ajouterNotes(doc, notes) {
    const startY = doc.y;

    doc
      .fillColor("#6b7280")
      .fontSize(9)
      .font("Helvetica-Oblique")
      .text("Notes :", 50, startY);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#374151")
      .text(notes, 50, startY + 15, {
        width: 495,
        align: "justify",
      });
  }

  /**
   * Ajouter le pied de page
   * @private
   */
  _ajouterPiedDePage(doc, cotisation) {
    const bottomY = 700;

    doc.fontSize(8).fillColor("#9ca3af").font("Helvetica");

    const dateGeneration = format(new Date(), "dd/MM/yyyy à HH:mm", {
      locale: fr,
    });

    doc.text(`Document généré le ${dateGeneration}`, 50, bottomY, {
      align: "center",
    });
    doc.text(
      "Ce reçu certifie le paiement de la cotisation pour la période mentionnée.",
      50,
      bottomY + 12,
      { align: "center" }
    );
    doc.text(
      "Conservez ce document, il vous sera demandé en cas de besoin.",
      50,
      bottomY + 24,
      { align: "center" }
    );
  }

  /**
   * Ajouter la zone de signature
   * @private
   */
  _ajouterSignature(doc) {
    const startY = doc.y;

    doc.fontSize(10).fillColor("#374151").font("Helvetica");

    // Signature du trésorier
    doc.text("Le Trésorier", 350, startY);

    // Ligne pour signature
    doc
      .moveTo(350, startY + 60)
      .lineTo(500, startY + 60)
      .strokeColor("#d1d5db")
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#9ca3af")
      .text("(Signature et cachet)", 350, startY + 65);
  }

  /**
   * Obtenir le label du statut
   * @private
   */
  _getStatutLabel(statut) {
    const labels = {
      A_JOUR: "À jour",
      EXPIRE: "Expiré",
      EN_ATTENTE: "En attente",
    };
    return labels[statut] || statut;
  }

  /**
   * Obtenir le label du mode de paiement
   * @private
   */
  _getModePaiementLabel(mode) {
    const labels = {
      ESPECES: "Espèces",
      CHEQUE: "Chèque",
      VIREMENT: "Virement bancaire",
      CARTE_BANCAIRE: "Carte bancaire",
    };
    return labels[mode] || mode;
  }

  /**
   * Supprimer un fichier PDF
   * @param {String} filePath - Chemin du fichier
   */
  async deleteRecuPDF(filePath) {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ message: "Fichier supprimé avec succès" });
        }
      });
    });
  }
}

module.exports = new PDFService();
