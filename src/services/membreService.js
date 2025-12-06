const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");
const fs = require("fs").promises;
const { createError } = require("../utils/helpers");

const prisma = new PrismaClient();

/**
 * Service de gestion des membres
 */
class MembreService {
  /**
   * Récupérer tous les membres avec pagination et filtres
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Liste paginée des membres
   */
  async getAllMembres(options = {}) {
    const {
      page = 1,
      limit = 25,
      search = "",
      statut = null,
      role = null,
      sortBy = "dateCreation",
      sortOrder = "desc",
    } = options;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construction des filtres
    const where = {};

    // Recherche textuelle sur nom, prénom ou email
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: "insensitive" } },
        { prenom: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre par statut
    if (statut) {
      where.statut = statut;
    }

    // Filtre par rôle
    if (role) {
      where.role = role;
    }

    // Récupération des membres
    const [membres, total] = await Promise.all([
      prisma.membre.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          role: true,
          statut: true,
          dateCreation: true,
          dateModification: true,
          _count: {
            select: {
              cotisations: true,
              inscriptions: true,
            },
          },
        },
      }),
      prisma.membre.count({ where }),
    ]);

    return {
      membres,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  /**
   * Récupérer un membre par son ID
   * @param {String} id - ID du membre
   * @returns {Promise<Object>} Membre trouvé
   */
  async getMembreById(id) {
    const membre = await prisma.membre.findUnique({
      where: { id },
      include: {
        cotisations: {
          orderBy: { datePaiement: "desc" },
          take: 5,
        },
        inscriptions: {
          include: {
            evenement: {
              select: {
                id: true,
                titre: true,
                dateDebut: true,
                lieu: true,
              },
            },
          },
          orderBy: { dateInscription: "desc" },
          take: 5,
        },
        _count: {
          select: {
            cotisations: true,
            inscriptions: true,
          },
        },
      },
    });

    if (!membre) {
      throw createError("Membre non trouvé", 404);
    }

    // Ne pas retourner le mot de passe
    const {
      motDePasse,
      resetToken,
      resetTokenExpiration,
      ...membreSansMotDePasse
    } = membre;

    return membreSansMotDePasse;
  }

  /**
   * Créer un nouveau membre
   * @param {Object} data - Données du membre
   * @returns {Promise<Object>} Membre créé
   */
  async createMembre(data) {
    const { email, motDePasse, nom, prenom, telephone, role, statut } = data;

    // Vérifier si l'email existe déjà
    const membreExistant = await prisma.membre.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (membreExistant) {
      throw createError("Un membre avec cet email existe déjà", 409);
    }

    // Hasher le mot de passe
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    // Créer le membre
    const nouveauMembre = await prisma.membre.create({
      data: {
        nom,
        prenom,
        email: email.toLowerCase(),
        telephone: telephone || null,
        motDePasse: motDePasseHash,
        role: role || "MEMBRE",
        statut: statut || "ACTIF",
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        dateCreation: true,
      },
    });

    return nouveauMembre;
  }

  /**
   * Mettre à jour un membre
   * @param {String} id - ID du membre
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} Membre mis à jour
   */
  async updateMembre(id, data) {
    const { email, motDePasse, ...autresDonnees } = data;

    // Vérifier que le membre existe
    const membreExistant = await prisma.membre.findUnique({
      where: { id },
    });

    if (!membreExistant) {
      throw createError("Membre non trouvé", 404);
    }

    // Préparer les données de mise à jour
    const dataUpdate = { ...autresDonnees };

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (email && email.toLowerCase() !== membreExistant.email) {
      const emailExiste = await prisma.membre.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailExiste) {
        throw createError(
          "Cet email est déjà utilisé par un autre membre",
          409
        );
      }

      dataUpdate.email = email.toLowerCase();
    }

    // Si le mot de passe est modifié, le hasher
    if (motDePasse) {
      dataUpdate.motDePasse = await bcrypt.hash(motDePasse, 10);
    }

    // Mettre à jour le membre
    const membreMaj = await prisma.membre.update({
      where: { id },
      data: dataUpdate,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        dateCreation: true,
        dateModification: true,
      },
    });

    return membreMaj;
  }

  /**
   * Supprimer un membre
   * @param {String} id - ID du membre
   * @returns {Promise<Object>} Message de confirmation
   */
  async deleteMembre(id) {
    // Vérifier que le membre existe
    const membre = await prisma.membre.findUnique({
      where: { id },
    });

    if (!membre) {
      throw createError("Membre non trouvé", 404);
    }

    // Supprimer le membre (les cotisations et inscriptions seront supprimées en cascade)
    await prisma.membre.delete({
      where: { id },
    });

    return {
      message: "Membre supprimé avec succès",
      id,
    };
  }

  /**
   * Exporter les membres en CSV
   * @param {Object} filters - Filtres à appliquer
   * @returns {Promise<String>} Chemin du fichier CSV
   */
  async exportMembresCSV(filters = {}) {
    // Récupérer tous les membres selon les filtres
    const where = {};

    if (filters.statut) {
      where.statut = filters.statut;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { nom: { contains: filters.search, mode: "insensitive" } },
        { prenom: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const membres = await prisma.membre.findMany({
      where,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        dateCreation: true,
      },
      orderBy: { nom: "asc" },
    });

    // Créer le fichier CSV
    const fileName = `membres_export_${Date.now()}.csv`;
    const filePath = path.join(__dirname, "../../uploads", fileName);

    // Créer le dossier uploads s'il n'existe pas
    await fs.mkdir(path.join(__dirname, "../../uploads"), { recursive: true });

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: "id", title: "ID" },
        { id: "nom", title: "Nom" },
        { id: "prenom", title: "Prénom" },
        { id: "email", title: "Email" },
        { id: "telephone", title: "Téléphone" },
        { id: "role", title: "Rôle" },
        { id: "statut", title: "Statut" },
        { id: "dateCreation", title: "Date de création" },
      ],
      fieldDelimiter: ";",
      encoding: "utf8",
    });

    // Formater les données
    const records = membres.map((m) => ({
      ...m,
      telephone: m.telephone || "",
      dateCreation: m.dateCreation.toISOString().split("T")[0],
    }));

    await csvWriter.writeRecords(records);

    return { filePath, fileName };
  }

  /**
   * Obtenir les statistiques des membres
   * @returns {Promise<Object>} Statistiques
   */
  async getStatistiques() {
    const [
      totalMembres,
      membresActifs,
      membresInactifs,
      membresBureau,
      membresParMois,
    ] = await Promise.all([
      // Total des membres
      prisma.membre.count(),

      // Membres actifs
      prisma.membre.count({ where: { statut: "ACTIF" } }),

      // Membres inactifs
      prisma.membre.count({ where: { statut: "INACTIF" } }),

      // Membres bureau
      prisma.membre.count({ where: { statut: "BUREAU" } }),

      // Membres créés par mois (6 derniers mois)
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(date_creation, 'YYYY-MM') as mois,
          COUNT(*)::int as total
        FROM membres
        WHERE date_creation >= NOW() - INTERVAL '6 months'
        GROUP BY mois
        ORDER BY mois ASC
      `,
    ]);

    return {
      totalMembres,
      membresActifs,
      membresInactifs,
      membresBureau,
      repartition: {
        actifs: membresActifs,
        inactifs: membresInactifs,
        bureau: membresBureau,
      },
      evolution: membresParMois,
    };
  }
}

module.exports = new MembreService();
