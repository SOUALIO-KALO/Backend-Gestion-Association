const { PrismaClient } = require("@prisma/client");
const { addYears, startOfDay, endOfDay, subDays } = require("date-fns");
const { createError } = require("../utils/helpers");
const cotisationService = require("../services/cotisationService");
const emailService = require("../services/emailService");

const prisma = new PrismaClient();

/**
 * @desc    Récupérer les cotisations de l'utilisateur connecté
 * @route   GET /api/cotisations/mes-cotisations
 * @access  Private
 */
exports.getMesCotisations = async (req, res, next) => {
  try {
    const membreId = req.user.id;

    const cotisations = await prisma.cotisation.findMany({
      where: { membreId },
      include: { membre: true },
      orderBy: { datePaiement: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Cotisations récupérées avec succès",
      data: cotisations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir le statut de cotisation de l'utilisateur connecté
 * @route   GET /api/cotisations/mon-statut
 * @access  Private
 */
exports.getMonStatut = async (req, res, next) => {
  try {
    const membreId = req.user.id;

    const cotisation = await prisma.cotisation.findFirst({
      where: { membreId },
      orderBy: { dateExpiration: "desc" },
      include: { membre: true },
    });

    if (!cotisation) {
      throw createError("Aucune cotisation trouvée", 404);
    }

    res.status(200).json({
      success: true,
      message: "Statut de cotisation récupéré",
      data: {
        cotisation,
        statut: cotisation.statut,
        dateExpiration: cotisation.dateExpiration,
        datePaiement: cotisation.datePaiement,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Obtenir les statistiques des cotisations
 * @route   GET /api/cotisations/statistiques
 * @access  Private (Admin)
 */
exports.getStatistiques = async (req, res, next) => {
  try {
    const stats = await cotisationService.getStatistiques();

    res.status(200).json({
      success: true,
      message: "Statistiques récupérées",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les cotisations expirées
 * @route   GET /api/cotisations/expirees
 * @access  Private (Admin)
 */
exports.getCotisationsExpirees = async (req, res, next) => {
  try {
    const today = new Date();

    const cotisations = await prisma.cotisation.findMany({
      where: {
        dateExpiration: {
          lt: today,
        },
        statut: "A_JOUR",
      },
      include: { membre: true },
      orderBy: { dateExpiration: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Cotisations expirées récupérées",
      data: cotisations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les cotisations proches de l'expiration
 * @route   GET /api/cotisations/alertes
 * @access  Private (Admin)
 */
exports.getCotisationsProchesExpiration = async (req, res, next) => {
  try {
    const joursAlerte = parseInt(req.query.jours || 30);
    const today = new Date();
    const alerteDate = addYears(subDays(today, -joursAlerte), 0);

    const cotisations = await prisma.cotisation.findMany({
      where: {
        statut: "A_JOUR",
        dateExpiration: {
          lte: alerteDate,
          gte: today,
        },
      },
      include: { membre: true },
      orderBy: { dateExpiration: "asc" },
    });

    res.status(200).json({
      success: true,
      message: "Cotisations proches de l'expiration",
      data: cotisations,
      count: cotisations.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour les statuts des cotisations expirées
 * @route   POST /api/cotisations/update-statuts
 * @access  Private (Admin)
 */
exports.updateStatutsExpires = async (req, res, next) => {
  try {
    const today = new Date();

    const result = await prisma.cotisation.updateMany({
      where: {
        statut: "A_JOUR",
        dateExpiration: {
          lt: today,
        },
      },
      data: {
        statut: "EXPIRE",
      },
    });

    res.status(200).json({
      success: true,
      message: "Statuts mis à jour",
      count: result.count,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les cotisations d'un membre spécifique
 * @route   GET /api/cotisations/membre/:membreId
 * @access  Private (Admin ou propriétaire)
 */
exports.getCotisationsByMembreId = async (req, res, next) => {
  try {
    const { membreId } = req.params;
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    // Vérifier accès (admin ou propriétaire)
    if (req.user.role !== "ADMIN" && req.user.id !== membreId) {
      throw createError("Accès refusé", 403);
    }

    const cotisations = await prisma.cotisation.findMany({
      where: { membreId },
      include: { membre: true },
      orderBy: { datePaiement: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.cotisation.count({
      where: { membreId },
    });

    res.status(200).json({
      success: true,
      message: "Cotisations du membre récupérées",
      data: cotisations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Vérifier le statut de cotisation d'un membre
 * @route   GET /api/cotisations/statut/:membreId
 * @access  Private (Admin ou propriétaire)
 */
exports.checkStatutCotisationMembre = async (req, res, next) => {
  try {
    const { membreId } = req.params;

    // Vérifier accès
    if (req.user.role !== "ADMIN" && req.user.id !== membreId) {
      throw createError("Accès refusé", 403);
    }

    const cotisation = await prisma.cotisation.findFirst({
      where: { membreId },
      orderBy: { dateExpiration: "desc" },
    });

    if (!cotisation) {
      throw createError("Aucune cotisation trouvée pour ce membre", 404);
    }

    res.status(200).json({
      success: true,
      message: "Statut vérifié",
      data: {
        statut: cotisation.statut,
        estActive: cotisation.statut === "A_JOUR",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Générer et télécharger le reçu PDF d'une cotisation
 * @route   GET /api/cotisations/:id/recu
 * @access  Private (Admin ou propriétaire)
 */
exports.genererRecuPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
      include: { membre: true },
    });

    if (!cotisation) {
      throw createError("Cotisation introuvable", 404);
    }

    // Vérifier accès
    if (req.user.role !== "ADMIN" && req.user.id !== cotisation.membreId) {
      throw createError("Accès refusé", 403);
    }

    // Générer le PDF avec PDFKit
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Collecter les chunks en buffer
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="recu-${cotisation.reference || id}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // Formatage des dates et montants
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatMontant = (montant) => {
      const formatted = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(montant);
      return `${formatted} FCFA`;
    };

    const modePaiementLabels = {
      ESPECES: "Espèces",
      CHEQUE: "Chèque",
      VIREMENT: "Virement bancaire",
      CARTE_BANCAIRE: "Carte bancaire",
    };

    // En-tête
    doc
      .fontSize(24)
      .fillColor("#1e40af")
      .text("REÇU DE COTISATION", { align: "center" });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .fillColor("#6b7280")
      .text("Association - Gestion Associative", { align: "center" });
    doc.moveDown(2);

    // Ligne de séparation
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    // Référence
    doc
      .fontSize(11)
      .fillColor("#374151")
      .text(`Référence: ${cotisation.reference || id}`, { align: "right" });
    doc.text(`Date d'émission: ${formatDate(new Date())}`, { align: "right" });
    doc.moveDown(2);

    // Informations membre
    doc.fontSize(14).fillColor("#1e40af").text("MEMBRE");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#374151");
    doc.text(`Nom: ${cotisation.membre.prenom} ${cotisation.membre.nom}`);
    doc.text(`Email: ${cotisation.membre.email}`);
    if (cotisation.membre.telephone) {
      doc.text(`Téléphone: ${cotisation.membre.telephone}`);
    }
    doc.moveDown(1.5);

    // Détails de la cotisation
    doc.fontSize(14).fillColor("#1e40af").text("DÉTAILS DE LA COTISATION");
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#374151");
    doc.text(`Période concernée: ${cotisation.periode || "Non spécifiée"}`);
    doc.text(`Date de paiement: ${formatDate(cotisation.datePaiement)}`);
    doc.text(`Date d'expiration: ${formatDate(cotisation.dateExpiration)}`);
    doc.text(
      `Mode de paiement: ${
        modePaiementLabels[cotisation.modePaiement] || cotisation.modePaiement
      }`
    );
    doc.moveDown(1.5);

    // Montant (encadré)
    const montantY = doc.y;
    doc.rect(50, montantY, 495, 60).fillAndStroke("#f0f9ff", "#3b82f6");
    doc
      .fontSize(14)
      .fillColor("#1e40af")
      .text("MONTANT PAYÉ", 70, montantY + 15);
    doc
      .fontSize(24)
      .fillColor("#1e40af")
      .text(formatMontant(cotisation.montant), 70, montantY + 32);
    doc.moveDown(4);

    // Notes
    if (cotisation.notes) {
      doc.fontSize(14).fillColor("#1e40af").text("NOTES");
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor("#374151").text(cotisation.notes);
      doc.moveDown(1.5);
    }

    // Pied de page
    doc.moveDown(2);
    doc
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);
    doc
      .fontSize(10)
      .fillColor("#9ca3af")
      .text(
        "Ce reçu atteste du paiement de la cotisation. Conservez-le précieusement.",
        { align: "center" }
      );
    doc.text(`Document généré le ${formatDate(new Date())}`, {
      align: "center",
    });

    // Finaliser le PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer toutes les cotisations
 * @route   GET /api/cotisations
 * @access  Private (Admin)
 */
exports.getAllCotisations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;
    const statut = req.query.statut;
    const membreId = req.query.membreId;
    const modePaiement = req.query.modePaiement;

    const where = {};
    if (statut) where.statut = statut;
    if (membreId) where.membreId = membreId;
    if (modePaiement) where.modePaiement = modePaiement;

    const cotisations = await prisma.cotisation.findMany({
      where,
      include: { membre: true },
      orderBy: { datePaiement: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.cotisation.count({ where });

    res.status(200).json({
      success: true,
      message: "Cotisations récupérées",
      data: cotisations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer une cotisation par son ID
 * @route   GET /api/cotisations/:id
 * @access  Private (Admin ou propriétaire)
 */
exports.getCotisationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
      include: { membre: true },
    });

    if (!cotisation) {
      throw createError("Cotisation introuvable", 404);
    }

    // Vérifier accès
    if (req.user.role !== "ADMIN" && req.user.id !== cotisation.membreId) {
      throw createError("Accès refusé", 403);
    }

    res.status(200).json({
      success: true,
      message: "Cotisation récupérée",
      data: cotisation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer une nouvelle cotisation
 * @route   POST /api/cotisations
 * @access  Private (Admin)
 */
exports.createCotisation = async (req, res, next) => {
  try {
    const { membreId, datePaiement, montant, modePaiement, periode, dateExpiration: dateExpirationInput, notes } = req.body;

    // Vérifier que le membre existe
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
    });

    if (!membre) {
      throw createError("Membre introuvable", 404);
    }

    // Valider le format de la période si fournie (MM/YYYY)
    let periodeValue = null;
    if (periode) {
      if (!/^(0[1-9]|1[0-2])\/\d{4}$/.test(periode)) {
        throw createError("Format de période invalide. Utilisez MM/YYYY (ex: 01/2024)", 400);
      }
      
      // Vérifier si une cotisation existe déjà pour ce membre et cette période
      const existingCotisation = await prisma.cotisation.findFirst({
        where: { membreId, periode },
      });

      if (existingCotisation) {
        throw createError(`Une cotisation existe déjà pour la période ${periode}`, 409);
      }
      periodeValue = periode;
    }

    // Déterminer la date d'expiration
    let dateExpiration;
    if (dateExpirationInput) {
      // Utiliser la date d'expiration fournie
      dateExpiration = new Date(dateExpirationInput);
    } else if (periode) {
      // Calculer la date d'expiration (fin du mois de la période)
      const [mois, annee] = periode.split('/').map(Number);
      dateExpiration = new Date(annee, mois, 0, 23, 59, 59); // Dernier jour du mois
    } else {
      // Par défaut: 1 an après la date de paiement
      dateExpiration = addYears(new Date(datePaiement), 1);
    }

    const cotisation = await prisma.cotisation.create({
      data: {
        membreId,
        datePaiement: new Date(datePaiement),
        dateExpiration,
        montant: parseFloat(montant),
        modePaiement,
        periode: periodeValue,
        notes: notes || null,
        statut: "A_JOUR",
      },
      include: { membre: true },
    });

    res.status(201).json({
      success: true,
      message: "Cotisation créée avec succès",
      data: {
        ...cotisation,
        montant: cotisation.montant.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour une cotisation
 * @route   PUT /api/cotisations/:id
 * @access  Private (Admin)
 */
exports.updateCotisation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { datePaiement, montant, modePaiement, periode, dateExpiration, notes, statut } = req.body;

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
    });

    if (!cotisation) {
      throw createError("Cotisation introuvable", 404);
    }

    const updateData = {};
    if (datePaiement) updateData.datePaiement = new Date(datePaiement);
    if (montant) updateData.montant = parseFloat(montant);
    if (modePaiement) updateData.modePaiement = modePaiement;
    if (notes !== undefined) updateData.notes = notes;
    if (statut) updateData.statut = statut;
    if (dateExpiration) updateData.dateExpiration = new Date(dateExpiration);

    // Gérer la période si fournie
    if (periode !== undefined) {
      if (periode && !/^(0[1-9]|1[0-2])\/\d{4}$/.test(periode)) {
        throw createError("Format de période invalide. Utilisez MM/YYYY (ex: 01/2024)", 400);
      }
      
      if (periode) {
        // Vérifier si une autre cotisation existe déjà pour cette période
        const existingCotisation = await prisma.cotisation.findFirst({
          where: { 
            membreId: cotisation.membreId, 
            periode,
            id: { not: id }
          },
        });

        if (existingCotisation) {
          throw createError(`Une cotisation existe déjà pour la période ${periode}`, 409);
        }
      }

      updateData.periode = periode || null;
    }

    const updated = await prisma.cotisation.update({
      where: { id },
      data: updateData,
      include: { membre: true },
    });

    res.status(200).json({
      success: true,
      message: "Cotisation mise à jour",
      data: {
        ...updated,
        montant: updated.montant.toString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer une cotisation
 * @route   DELETE /api/cotisations/:id
 * @access  Private (Admin)
 */
exports.deleteCotisation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
    });

    if (!cotisation) {
      throw createError("Cotisation introuvable", 404);
    }

    await prisma.cotisation.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Cotisation supprimée",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Envoyer un rappel de cotisation par email
 * @route   POST /api/cotisations/:id/rappel
 * @access  Private (Admin)
 */
exports.envoyerRappel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
      include: { membre: true },
    });

    if (!cotisation) {
      throw createError("Cotisation introuvable", 404);
    }

    if (!cotisation.membre.email) {
      throw createError("Le membre n'a pas d'adresse email", 400);
    }

    // Envoyer l'email de rappel
    await emailService.sendCotisationRappelEmail(cotisation.membre, cotisation);

    res.status(200).json({
      success: true,
      message: `Rappel envoyé à ${cotisation.membre.email}`,
      data: {
        email: cotisation.membre.email,
        membre: `${cotisation.membre.prenom} ${cotisation.membre.nom}`,
      },
    });
  } catch (error) {
    next(error);
  }
};
