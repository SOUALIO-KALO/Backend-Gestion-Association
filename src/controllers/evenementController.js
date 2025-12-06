const { PrismaClient } = require("@prisma/client");
const { createError } = require("../utils/helpers");
const evenementService = require("../services/evenementService");

const prisma = new PrismaClient();

/**
 * @desc    Récupérer tous les événements
 * @route   GET /api/evenements
 * @access  Private
 */
exports.getAllEvenements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const evenements = await prisma.evenement.findMany({
      skip,
      take: limit,
      orderBy: { dateDebut: "desc" },
    });

    const total = await prisma.evenement.count();

    res.status(200).json({
      success: true,
      message: "Événements récupérés",
      data: evenements,
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
 * @desc    Récupérer un événement par son ID
 * @route   GET /api/evenements/:id
 * @access  Private
 */
exports.getEvenementById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      throw createError("Événement introuvable", 404);
    }

    res.status(200).json({
      success: true,
      message: "Événement récupéré",
      data: evenement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Créer un nouvel événement
 * @route   POST /api/evenements
 * @access  Private (Admin)
 */
exports.createEvenement = async (req, res, next) => {
  try {
    const { titre, description, dateDebut, dateFin, lieu, placesTotal } =
      req.body;
    const { id: createurId } = req.user; // L'utilisateur connecté est le créateur

    const evenement = await prisma.evenement.create({
      data: {
        titre,
        description: description || null,
        dateDebut: new Date(dateDebut),
        dateFin: dateFin ? new Date(dateFin) : null,
        lieu,
        placesTotal: parseInt(placesTotal),
        placesRestantes: parseInt(placesTotal),
        createurId,
        estPublie: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Événement créé",
      data: evenement,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mettre à jour un événement
 * @route   PUT /api/evenements/:id
 * @access  Private (Admin)
 */
exports.updateEvenement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titre, description, dateDebut, dateFin, lieu, placesTotal } =
      req.body;

    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      throw createError("Événement introuvable", 404);
    }

    const updateData = {};
    if (titre) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (dateDebut) updateData.dateDebut = new Date(dateDebut);
    if (dateFin !== undefined)
      updateData.dateFin = dateFin ? new Date(dateFin) : null;
    if (lieu) updateData.lieu = lieu;
    if (placesTotal !== undefined) {
      const newPlacesTotal = parseInt(placesTotal);
      const oldPlacesUsed = evenement.placesTotal - evenement.placesRestantes;
      updateData.placesTotal = newPlacesTotal;
      updateData.placesRestantes = Math.max(0, newPlacesTotal - oldPlacesUsed);
    }

    const updated = await prisma.evenement.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Événement mis à jour",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Supprimer un événement
 * @route   DELETE /api/evenements/:id
 * @access  Private (Admin)
 */
exports.deleteEvenement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      throw createError("Événement introuvable", 404);
    }

    await prisma.evenement.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: "Événement supprimé",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer le calendrier des événements
 * @route   GET /api/evenements/calendrier
 * @access  Private
 */
exports.getCalendrier = async (req, res, next) => {
  try {
    const mois = parseInt(req.query.mois) || new Date().getMonth() + 1;
    const annee = parseInt(req.query.annee) || new Date().getFullYear();

    const evenements = await evenementService.getCalendrier(mois, annee);

    res.status(200).json({
      success: true,
      message: "Calendrier récupéré",
      data: evenements,
      mois,
      annee,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Récupérer les statistiques des événements
 * @route   GET /api/evenements/statistiques
 * @access  Private (Admin)
 */
exports.getStatistiques = async (req, res, next) => {
  try {
    const stats = await evenementService.getStatistiques();

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
 * @desc    Récupérer les participants d'un événement
 * @route   GET /api/evenements/:id/participants
 * @access  Private (Admin)
 */
exports.getParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await evenementService.getParticipants(id);

    res.status(200).json({
      success: true,
      message: "Participants récupérés",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    S'inscrire à un événement
 * @route   POST /api/evenements/:id/inscription
 * @access  Private
 */
exports.inscrire = async (req, res, next) => {
  try {
    const { id: evenementId } = req.params;
    const { id: membreId } = req.user;

    const inscription = await evenementService.inscrire(evenementId, membreId);

    res.status(201).json({
      success: true,
      message: "Inscription confirmée",
      data: inscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Se désinscrire d'un événement
 * @route   DELETE /api/evenements/:id/inscription
 * @access  Private
 */
exports.desinscrire = async (req, res, next) => {
  try {
    const { id: evenementId } = req.params;
    const { id: membreId } = req.user;

    await evenementService.desinscrire(evenementId, membreId);

    res.status(200).json({
      success: true,
      message: "Désinscription effectuée",
    });
  } catch (error) {
    next(error);
  }
};
