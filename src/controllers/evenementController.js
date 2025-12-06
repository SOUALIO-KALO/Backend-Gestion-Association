const { PrismaClient } = require("@prisma/client");
const { createError } = require("../utils/helpers");

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
      orderBy: { dateEvenement: "desc" },
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
      where: { id: parseInt(id) },
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
    const { titre, description, dateEvenement, lieu, capacite } = req.body;

    const evenement = await prisma.evenement.create({
      data: {
        titre,
        description: description || null,
        dateEvenement: new Date(dateEvenement),
        lieu: lieu || null,
        capacite: capacite ? parseInt(capacite) : null,
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
    const { titre, description, dateEvenement, lieu, capacite } = req.body;

    const evenement = await prisma.evenement.findUnique({
      where: { id: parseInt(id) },
    });

    if (!evenement) {
      throw createError("Événement introuvable", 404);
    }

    const updateData = {};
    if (titre) updateData.titre = titre;
    if (description !== undefined) updateData.description = description;
    if (dateEvenement) updateData.dateEvenement = new Date(dateEvenement);
    if (lieu !== undefined) updateData.lieu = lieu;
    if (capacite !== undefined)
      updateData.capacite = capacite ? parseInt(capacite) : null;

    const updated = await prisma.evenement.update({
      where: { id: parseInt(id) },
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
      where: { id: parseInt(id) },
    });

    if (!evenement) {
      throw createError("Événement introuvable", 404);
    }

    await prisma.evenement.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Événement supprimé",
    });
  } catch (error) {
    next(error);
  }
};
