const { PrismaClient } = require("@prisma/client");
const {
  addYears,
  isBefore,
  addDays,
  startOfMonth,
  endOfMonth,
} = require("date-fns");

const prisma = new PrismaClient();

/**
 * Service de gestion des cotisations
 */
class CotisationService {
  /**
   * Récupérer toutes les cotisations avec pagination et filtres
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Liste paginée des cotisations
   */
  async getAllCotisations(options = {}) {
    const {
      page = 1,
      limit = process.env.DEFAULT_PAGE_SIZE || 25,
      statut = null,
      membreId = null,
      modePaiement = null,
      dateDebut = null,
      dateFin = null,
      sortBy = "datePaiement",
      sortOrder = "desc",
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construction des filtres
    const where = {};

    if (statut) {
      where.statut = statut;
    }

    if (membreId) {
      where.membreId = membreId;
    }

    if (modePaiement) {
      where.modePaiement = modePaiement;
    }

    // Filtre par période de paiement
    if (dateDebut || dateFin) {
      where.datePaiement = {};
      if (dateDebut) {
        where.datePaiement.gte = new Date(dateDebut);
      }
      if (dateFin) {
        where.datePaiement.lte = new Date(dateFin);
      }
    }

    // Récupération des cotisations
    const [cotisations, total] = await Promise.all([
      prisma.cotisation.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          membre: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              statut: true,
            },
          },
        },
      }),
      prisma.cotisation.count({ where }),
    ]);

    return {
      cotisations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Récupérer une cotisation par son ID
   * @param {String} id - ID de la cotisation
   * @returns {Promise<Object>} Cotisation trouvée
   */
  async getCotisationById(id) {
    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
      include: {
        membre: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            statut: true,
          },
        },
      },
    });

    if (!cotisation) {
      throw new Error("Cotisation non trouvée");
    }

    return cotisation;
  }

  /**
   * Récupérer toutes les cotisations d'un membre
   * @param {String} membreId - ID du membre
   * @returns {Promise<Array>} Liste des cotisations
   */
  async getCotisationsByMembreId(membreId) {
    // Vérifier que le membre existe
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
    });

    if (!membre) {
      throw new Error("Membre non trouvé");
    }

    const cotisations = await prisma.cotisation.findMany({
      where: { membreId },
      orderBy: { datePaiement: "desc" },
      include: {
        membre: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    return cotisations;
  }

  /**
   * Créer une nouvelle cotisation
   * @param {Object} data - Données de la cotisation
   * @returns {Promise<Object>} Cotisation créée
   */
  async createCotisation(data) {
    const { membreId, datePaiement, montant, modePaiement, notes } = data;

    // Vérifier que le membre existe
    const membre = await prisma.membre.findUnique({
      where: { id: membreId },
    });

    if (!membre) {
      throw new Error("Membre non trouvé");
    }

    // Calculer la date d'expiration (1 an après la date de paiement)
    const dateExpiration = addYears(new Date(datePaiement), 1);

    // Déterminer le statut initial
    const statut = isBefore(new Date(), dateExpiration) ? "A_JOUR" : "EXPIRE";

    // Créer la cotisation
    const cotisation = await prisma.cotisation.create({
      data: {
        membreId,
        datePaiement: new Date(datePaiement),
        montant: parseFloat(montant),
        modePaiement,
        dateExpiration,
        statut,
        notes: notes || null,
      },
      include: {
        membre: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    return cotisation;
  }

  /**
   * Mettre à jour une cotisation
   * @param {String} id - ID de la cotisation
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Cotisation mise à jour
   */
  async updateCotisation(id, data) {
    const { datePaiement, montant, modePaiement, statut, notes } = data;

    // Vérifier que la cotisation existe
    const cotisationExistante = await prisma.cotisation.findUnique({
      where: { id },
    });

    if (!cotisationExistante) {
      throw new Error("Cotisation non trouvée");
    }

    // Préparer les données de mise à jour
    const dataUpdate = {};

    if (montant !== undefined) {
      dataUpdate.montant = parseFloat(montant);
    }

    if (modePaiement) {
      dataUpdate.modePaiement = modePaiement;
    }

    if (statut) {
      dataUpdate.statut = statut;
    }

    if (notes !== undefined) {
      dataUpdate.notes = notes;
    }

    // Si la date de paiement change, recalculer la date d'expiration
    if (datePaiement) {
      dataUpdate.datePaiement = new Date(datePaiement);
      dataUpdate.dateExpiration = addYears(new Date(datePaiement), 1);

      // Recalculer le statut si non spécifié
      if (!statut) {
        dataUpdate.statut = isBefore(new Date(), dataUpdate.dateExpiration)
          ? "A_JOUR"
          : "EXPIRE";
      }
    }

    // Mettre à jour la cotisation
    const cotisation = await prisma.cotisation.update({
      where: { id },
      data: dataUpdate,
      include: {
        membre: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    return cotisation;
  }

  /**
   * Supprimer une cotisation
   * @param {String} id - ID de la cotisation
   * @returns {Promise<Object>} Message de confirmation
   */
  async deleteCotisation(id) {
    // Vérifier que la cotisation existe
    const cotisation = await prisma.cotisation.findUnique({
      where: { id },
    });

    if (!cotisation) {
      throw new Error("Cotisation non trouvée");
    }

    await prisma.cotisation.delete({
      where: { id },
    });

    return {
      message: "Cotisation supprimée avec succès",
      id,
    };
  }

  /**
   * Récupérer les cotisations expirées
   * @param {Number} joursAvant - Nombre de jours avant expiration (défaut: 0 = déjà expirées)
   * @returns {Promise<Array>} Liste des cotisations expirées ou proches de l'expiration
   */
  async getCotisationsExpirees(joursAvant = 0) {
    const dateReference = addDays(new Date(), joursAvant);

    const cotisations = await prisma.cotisation.findMany({
      where: {
        dateExpiration: {
          lte: dateReference,
        },
        statut: {
          in: ["A_JOUR", "EXPIRE"],
        },
      },
      include: {
        membre: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            statut: true,
          },
        },
      },
      orderBy: {
        dateExpiration: "asc",
      },
    });

    return cotisations;
  }

  /**
   * Récupérer les cotisations qui expirent bientôt (dans les X jours)
   * @param {Number} jours - Nombre de jours (défaut: 30)
   * @returns {Promise<Array>} Liste des cotisations proches de l'expiration
   */
  async getCotisationsProchesExpiration(jours = 30) {
    const dateDebut = new Date();
    const dateFin = addDays(new Date(), jours);

    const cotisations = await prisma.cotisation.findMany({
      where: {
        dateExpiration: {
          gte: dateDebut,
          lte: dateFin,
        },
        statut: "A_JOUR",
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
      orderBy: {
        dateExpiration: "asc",
      },
    });

    return cotisations;
  }

  /**
   * Mettre à jour les statuts des cotisations expirées
   * @returns {Promise<Object>} Nombre de cotisations mises à jour
   */
  async updateStatutsExpires() {
    const maintenant = new Date();

    const result = await prisma.cotisation.updateMany({
      where: {
        dateExpiration: {
          lt: maintenant,
        },
        statut: {
          not: "EXPIRE",
        },
      },
      data: {
        statut: "EXPIRE",
      },
    });

    return {
      message: `${result.count} cotisation(s) mise(s) à jour`,
      count: result.count,
    };
  }

  /**
   * Obtenir les statistiques des cotisations
   * @returns {Promise<Object>} Statistiques
   */
  async getStatistiques() {
    const maintenant = new Date();
    const debutMois = startOfMonth(maintenant);
    const finMois = endOfMonth(maintenant);

    const [
      totalCotisations,
      cotisationsAJour,
      cotisationsExpirees,
      cotisationsEnAttente,
      cotisationsMoisCourant,
      montantTotalMois,
      cotisationsParMois,
    ] = await Promise.all([
      // Total des cotisations
      prisma.cotisation.count(),

      // Cotisations à jour
      prisma.cotisation.count({
        where: {
          statut: "A_JOUR",
          dateExpiration: { gte: maintenant },
        },
      }),

      // Cotisations expirées
      prisma.cotisation.count({ where: { statut: "EXPIRE" } }),

      // Cotisations en attente
      prisma.cotisation.count({ where: { statut: "EN_ATTENTE" } }),

      // Cotisations du mois courant
      prisma.cotisation.count({
        where: {
          datePaiement: {
            gte: debutMois,
            lte: finMois,
          },
        },
      }),

      // Montant total du mois
      prisma.cotisation.aggregate({
        where: {
          datePaiement: {
            gte: debutMois,
            lte: finMois,
          },
        },
        _sum: {
          montant: true,
        },
      }),

      // Cotisations par mois (6 derniers mois)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(date_paiement, 'YYYY-MM') as mois,
          COUNT(*)::int as total,
          SUM(montant)::float as montant_total
        FROM cotisations
        WHERE date_paiement >= NOW() - INTERVAL '6 months'
        GROUP BY mois
        ORDER BY mois ASC
      `,
    ]);

    // Répartition par mode de paiement
    const repartitionModePaiement = await prisma.cotisation.groupBy({
      by: ["modePaiement"],
      _count: {
        id: true,
      },
    });

    return {
      totalCotisations,
      cotisationsAJour,
      cotisationsExpirees,
      cotisationsEnAttente,
      cotisationsMoisCourant,
      montantTotalMois: montantTotalMois._sum.montant || 0,
      repartition: {
        aJour: cotisationsAJour,
        expirees: cotisationsExpirees,
        enAttente: cotisationsEnAttente,
      },
      repartitionModePaiement: repartitionModePaiement.map((r) => ({
        modePaiement: r.modePaiement,
        count: r._count.id,
      })),
      evolution: cotisationsParMois,
    };
  }

  /**
   * Vérifier le statut de cotisation d'un membre
   * @param {String} membreId - ID du membre
   * @returns {Promise<Object>} Statut de la cotisation
   */
  async checkStatutCotisationMembre(membreId) {
    // Récupérer la dernière cotisation du membre
    const derniereCotisation = await prisma.cotisation.findFirst({
      where: { membreId },
      orderBy: { datePaiement: "desc" },
    });

    if (!derniereCotisation) {
      return {
        statut: "AUCUNE_COTISATION",
        message: "Aucune cotisation enregistrée",
        cotisation: null,
      };
    }

    const maintenant = new Date();
    const estAJour = isBefore(maintenant, derniereCotisation.dateExpiration);

    return {
      statut: estAJour ? "A_JOUR" : "EXPIRE",
      message: estAJour ? "Cotisation à jour" : "Cotisation expirée",
      cotisation: derniereCotisation,
      joursRestants: estAJour
        ? Math.ceil(
            (derniereCotisation.dateExpiration - maintenant) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  }
}

module.exports = new CotisationService();
