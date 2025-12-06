const { PrismaClient } = require("@prisma/client");
const { addYears, startOfDay, endOfDay, subDays } = require("date-fns");
const { createError } = require("../utils/helpers");

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
    const totalCotisations = await prisma.cotisation.count();
    const cotisationsAJour = await prisma.cotisation.count({
      where: { statut: "A_JOUR" },
    });
    const cotisationsExpires = await prisma.cotisation.count({
      where: { statut: "EXPIRE" },
    });

    const montantTotal = await prisma.cotisation.aggregate({
      _sum: { montant: true },
      where: { statut: "A_JOUR" },
    });

    res.status(200).json({
      success: true,
      message: "Statistiques récupérées",
      data: {
        totalCotisations,
        cotisationsAJour,
        cotisationsExpires,
        montantTotalMois: montantTotal._sum.montant || 0,
        repartition: {
          aJour: cotisationsAJour,
          expirees: cotisationsExpires,
        },
      },
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

    // TODO: Générer le PDF avec pdfkit ou similar
    // Pour l'instant, retourner un PDF simple en base64
    const pdfContent = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Reçu Cotisation) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000244 00000 n\n0000000333 00000 n\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n427\n%%EOF"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="recu-${cotisation.reference}.pdf"`
    );
    res.send(pdfContent);
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
    const { membreId, datePaiement, montant, modePaiement, notes } = req.body;

    // Vérifier que le membre existe
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
    });

    if (!membre) {
      throw createError("Membre introuvable", 404);
    }

    // Calculer la date d'expiration (1 an après la date de paiement)
    const dateExpiration = addYears(new Date(datePaiement), 1);

    const cotisation = await prisma.cotisation.create({
      data: {
        membreId,
        datePaiement: new Date(datePaiement),
        dateExpiration,
        montant: parseFloat(montant),
        modePaiement,
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
    const { datePaiement, montant, modePaiement, notes, statut } = req.body;

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

    // Recalculer la date d'expiration si datePaiement est modifiée
    if (datePaiement) {
      updateData.dateExpiration = addYears(new Date(datePaiement), 1);
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
