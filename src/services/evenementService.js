// backend/src/services/evenementService.js

const { PrismaClient } = require("@prisma/client");
const { createError } = require("../utils/helpers");
const emailService = require("./emailService");

const prisma = new PrismaClient();

/**
 * Récupère tous les événements avec pagination et filtres
 */
exports.getAllEvenements = async (options = {}) => {
  const { page = 1, limit = 10, estPublie, aVenir, search } = options;
  const skip = (page - 1) * limit;

  const where = {};

  if (estPublie !== undefined) {
    where.estPublie = estPublie;
  }

  if (aVenir) {
    where.dateDebut = { gte: new Date() };
  }

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { lieu: { contains: search, mode: "insensitive" } },
    ];
  }

  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dateDebut: "asc" },
      include: {
        createur: {
          select: { id: true, nom: true, prenom: true },
        },
        _count: {
          select: { inscriptions: true },
        },
      },
    }),
    prisma.evenement.count({ where }),
  ]);

  return {
    data: evenements,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Récupère un événement par son ID
 */
exports.getEvenementById = async (id) => {
  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      createur: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      inscriptions: {
        include: {
          membre: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
      },
    },
  });

  if (!evenement) {
    throw createError("Événement introuvable", 404);
  }

  return evenement;
};

/**
 * Crée un nouvel événement
 */
exports.createEvenement = async (data, createurId) => {
  const { titre, description, dateDebut, dateFin, lieu, placesTotal } = data;

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

  return evenement;
};

/**
 * Met à jour un événement
 */
exports.updateEvenement = async (id, data) => {
  const evenement = await prisma.evenement.findUnique({ where: { id } });

  if (!evenement) {
    throw createError("Événement introuvable", 404);
  }

  const { titre, description, dateDebut, dateFin, lieu, placesTotal, estPublie } = data;

  const updateData = {};
  if (titre !== undefined) updateData.titre = titre;
  if (description !== undefined) updateData.description = description;
  if (dateDebut !== undefined) updateData.dateDebut = new Date(dateDebut);
  if (dateFin !== undefined) updateData.dateFin = dateFin ? new Date(dateFin) : null;
  if (lieu !== undefined) updateData.lieu = lieu;
  if (estPublie !== undefined) updateData.estPublie = estPublie;

  if (placesTotal !== undefined) {
    const newPlacesTotal = parseInt(placesTotal);
    const oldPlacesUsed = evenement.placesTotal - evenement.placesRestantes;
    updateData.placesTotal = newPlacesTotal;
    updateData.placesRestantes = Math.max(0, newPlacesTotal - oldPlacesUsed);
  }

  return prisma.evenement.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Supprime un événement
 */
exports.deleteEvenement = async (id) => {
  const evenement = await prisma.evenement.findUnique({ where: { id } });

  if (!evenement) {
    throw createError("Événement introuvable", 404);
  }

  await prisma.evenement.delete({ where: { id } });
  return { message: "Événement supprimé" };
};

/**
 * Récupère le calendrier des événements pour un mois donné
 */
exports.getCalendrier = async (mois, annee) => {
  const startDate = new Date(annee, mois - 1, 1);
  const endDate = new Date(annee, mois, 0, 23, 59, 59);

  const evenements = await prisma.evenement.findMany({
    where: {
      estPublie: true,
      dateDebut: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { dateDebut: "asc" },
    select: {
      id: true,
      titre: true,
      dateDebut: true,
      dateFin: true,
      lieu: true,
      placesRestantes: true,
      placesTotal: true,
    },
  });

  return evenements;
};

/**
 * Récupère les participants d'un événement
 */
exports.getParticipants = async (evenementId) => {
  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });

  if (!evenement) {
    throw createError("Événement introuvable", 404);
  }

  const inscriptions = await prisma.inscription.findMany({
    where: {
      evenementId,
      statut: "CONFIRMEE",
    },
    include: {
      membre: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
        },
      },
    },
    orderBy: { dateInscription: "asc" },
  });

  return {
    evenement: {
      id: evenement.id,
      titre: evenement.titre,
      dateDebut: evenement.dateDebut,
    },
    participants: inscriptions.map((i) => ({
      ...i.membre,
      dateInscription: i.dateInscription,
      statut: i.statut,
    })),
    total: inscriptions.length,
  };
};

/**
 * Inscription d'un membre à un événement
 */
exports.inscrire = async (evenementId, membreId) => {
  // Vérifier si l'événement existe
  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });

  if (!evenement) {
    throw createError("Événement introuvable", 404);
  }

  // Vérifier si l'événement est publié
  if (!evenement.estPublie) {
    throw createError("Cet événement n'est pas disponible", 400);
  }

  // Vérifier s'il reste des places
  if (evenement.placesRestantes <= 0) {
    throw createError("Plus de places disponibles", 400);
  }

  // Vérifier si le membre n'est pas déjà inscrit
  const existingInscription = await prisma.inscription.findUnique({
    where: {
      membreId_evenementId: {
        membreId,
        evenementId,
      },
    },
  });

  if (existingInscription) {
    if (existingInscription.statut === "CONFIRMEE") {
      throw createError("Vous êtes déjà inscrit à cet événement", 409);
    }
    // Réactiver une inscription annulée
    const inscription = await prisma.$transaction(async (tx) => {
      await tx.evenement.update({
        where: { id: evenementId },
        data: { placesRestantes: { decrement: 1 } },
      });

      return tx.inscription.update({
        where: { id: existingInscription.id },
        data: { statut: "CONFIRMEE" },
        include: {
          membre: { select: { nom: true, prenom: true, email: true } },
          evenement: { select: { titre: true, dateDebut: true, lieu: true } },
        },
      });
    });

    // Envoyer email de confirmation
    await this.sendConfirmationEmail(inscription);

    return inscription;
  }

  // Créer l'inscription dans une transaction
  const inscription = await prisma.$transaction(async (tx) => {
    // Décrémenter les places restantes
    await tx.evenement.update({
      where: { id: evenementId },
      data: { placesRestantes: { decrement: 1 } },
    });

    // Créer l'inscription
    return tx.inscription.create({
      data: {
        membreId,
        evenementId,
        statut: "CONFIRMEE",
      },
      include: {
        membre: { select: { nom: true, prenom: true, email: true } },
        evenement: { select: { titre: true, dateDebut: true, lieu: true } },
      },
    });
  });

  // Envoyer email de confirmation
  await this.sendConfirmationEmail(inscription);

  return inscription;
};

/**
 * Désinscription d'un membre à un événement
 */
exports.desinscrire = async (evenementId, membreId) => {
  const inscription = await prisma.inscription.findUnique({
    where: {
      membreId_evenementId: {
        membreId,
        evenementId,
      },
    },
  });

  if (!inscription) {
    throw createError("Inscription introuvable", 404);
  }

  if (inscription.statut === "ANNULEE") {
    throw createError("L'inscription est déjà annulée", 400);
  }

  // Annuler dans une transaction
  await prisma.$transaction(async (tx) => {
    // Incrémenter les places restantes
    await tx.evenement.update({
      where: { id: evenementId },
      data: { placesRestantes: { increment: 1 } },
    });

    // Mettre à jour le statut
    await tx.inscription.update({
      where: { id: inscription.id },
      data: { statut: "ANNULEE" },
    });
  });

  return { message: "Désinscription effectuée" };
};

/**
 * Récupère les inscriptions d'un membre
 */
exports.getInscriptionsMembre = async (membreId, options = {}) => {
  const { aVenir = false } = options;

  const where = {
    membreId,
    statut: "CONFIRMEE",
  };

  if (aVenir) {
    where.evenement = {
      dateDebut: { gte: new Date() },
    };
  }

  const inscriptions = await prisma.inscription.findMany({
    where,
    include: {
      evenement: {
        select: {
          id: true,
          titre: true,
          description: true,
          dateDebut: true,
          dateFin: true,
          lieu: true,
          placesRestantes: true,
          placesTotal: true,
        },
      },
    },
    orderBy: { evenement: { dateDebut: "asc" } },
  });

  return inscriptions;
};

/**
 * Envoie un email de confirmation d'inscription
 */
exports.sendConfirmationEmail = async (inscription) => {
  try {
    const { membre, evenement } = inscription;

    await emailService.sendEmail({
      to: membre.email,
      subject: `Confirmation d'inscription - ${evenement.titre}`,
      template: "confirmationInscription",
      data: {
        prenom: membre.prenom,
        nom: membre.nom,
        evenement: evenement.titre,
        date: new Date(evenement.dateDebut).toLocaleDateString("fr-FR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        lieu: evenement.lieu,
      },
    });
  } catch (error) {
    console.error("Erreur envoi email confirmation:", error);
    // Ne pas bloquer l'inscription si l'email échoue
  }
};

/**
 * Envoie les rappels pour les événements du lendemain (cron job)
 */
exports.sendRappelsEvenements = async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const evenements = await prisma.evenement.findMany({
    where: {
      dateDebut: {
        gte: tomorrow,
        lt: dayAfter,
      },
      estPublie: true,
    },
    include: {
      inscriptions: {
        where: { statut: "CONFIRMEE" },
        include: {
          membre: {
            select: { email: true, prenom: true, nom: true },
          },
        },
      },
    },
  });

  let emailsSent = 0;

  for (const evenement of evenements) {
    for (const inscription of evenement.inscriptions) {
      try {
        await emailService.sendEmail({
          to: inscription.membre.email,
          subject: `Rappel - ${evenement.titre} demain`,
          template: "rappelEvenement",
          data: {
            prenom: inscription.membre.prenom,
            nom: inscription.membre.nom,
            evenement: evenement.titre,
            date: new Date(evenement.dateDebut).toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            lieu: evenement.lieu,
            description: evenement.description,
          },
        });
        emailsSent++;
      } catch (error) {
        console.error(`Erreur envoi rappel à ${inscription.membre.email}:`, error);
      }
    }
  }

  return { evenementsCount: evenements.length, emailsSent };
};

/**
 * Récupère les statistiques des événements
 */
exports.getStatistiques = async () => {
  const now = new Date();

  const [total, aVenir, complets, totalInscrits] = await Promise.all([
    prisma.evenement.count(),
    prisma.evenement.count({
      where: { dateDebut: { gte: now }, estPublie: true },
    }),
    prisma.evenement.count({
      where: { placesRestantes: 0, dateDebut: { gte: now } },
    }),
    prisma.inscription.count({
      where: { statut: "CONFIRMEE" },
    }),
  ]);

  return { total, aVenir, complets, totalInscrits };
};
