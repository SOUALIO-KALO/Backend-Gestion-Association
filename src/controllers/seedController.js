const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { createError } = require("../utils/helpers");

const prisma = new PrismaClient();

/**
 * @desc    Réinitialiser et repeupler la base de données
 * @route   POST /api/admin/seed
 * @access  Private (Admin uniquement)
 */
exports.seedDatabase = async (req, res, next) => {
  try {
    const { confirmReset } = req.body;

    // Double vérification pour éviter les accidents
    if (confirmReset !== "CONFIRMER_RESET_DATABASE") {
      throw createError(
        "Confirmation requise. Envoyez { confirmReset: 'CONFIRMER_RESET_DATABASE' }",
        400
      );
    }

    console.log("🌱 Début du seeding via API...");

    // Nettoyage des tables (dans l'ordre des dépendances)
    await prisma.inscription.deleteMany();
    await prisma.cotisation.deleteMany();
    await prisma.evenement.deleteMany();
    await prisma.membre.deleteMany();

    console.log("✓ Tables nettoyées");

    // Helper pour créer des dates dans le passé
    const getDateMonthsAgo = (monthsAgo) => {
      const date = new Date();
      date.setMonth(date.getMonth() - monthsAgo);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      return date;
    };

    const motDePasseHash = await bcrypt.hash("Password123!", 12);

    // Créer l'admin
    const admin = await prisma.membre.create({
      data: {
        nom: "Martin",
        prenom: "Jean",
        email: "admin@association.fr",
        telephone: "0601020304",
        motDePasse: motDePasseHash,
        role: "ADMIN",
        statut: "BUREAU",
        dateCreation: getDateMonthsAgo(5),
      },
    });

    // Créer les membres avec dates variées
    const membresData = [
      { nom: "Dupont", prenom: "Marie", email: "marie.dupont@email.fr", telephone: "0611223344", statut: "ACTIF", moisAgo: 0 },
      { nom: "Bernard", prenom: "Pierre", email: "pierre.bernard@email.fr", telephone: "0622334455", statut: "ACTIF", moisAgo: 0 },
      { nom: "Petit", prenom: "Sophie", email: "sophie.petit@email.fr", telephone: "0633445566", statut: "INACTIF", moisAgo: 1 },
      { nom: "Leroy", prenom: "François", email: "francois.leroy@email.fr", telephone: "0644556677", statut: "ACTIF", moisAgo: 1, role: "ADMIN" },
      { nom: "Moreau", prenom: "Isabelle", email: "isabelle.moreau@email.fr", telephone: "0655667788", statut: "ACTIF", moisAgo: 1 },
      { nom: "Garcia", prenom: "Lucas", email: "lucas.garcia@email.fr", telephone: "0666778899", statut: "ACTIF", moisAgo: 2 },
      { nom: "Roux", prenom: "Emma", email: "emma.roux@email.fr", telephone: "0677889900", statut: "ACTIF", moisAgo: 2 },
      { nom: "David", prenom: "Thomas", email: "thomas.david@email.fr", telephone: "0688990011", statut: "BUREAU", moisAgo: 2 },
      { nom: "Bertrand", prenom: "Julie", email: "julie.bertrand@email.fr", telephone: "0699001122", statut: "ACTIF", moisAgo: 3 },
      { nom: "Morel", prenom: "Antoine", email: "antoine.morel@email.fr", telephone: "0610112233", statut: "ACTIF", moisAgo: 3 },
      { nom: "Simon", prenom: "Clara", email: "clara.simon@email.fr", telephone: "0621223344", statut: "ACTIF", moisAgo: 4 },
      { nom: "Laurent", prenom: "Hugo", email: "hugo.laurent@email.fr", telephone: "0632334455", statut: "INACTIF", moisAgo: 4 },
      { nom: "Michel", prenom: "Léa", email: "lea.michel@email.fr", telephone: "0643445566", statut: "ACTIF", moisAgo: 4 },
      { nom: "Faure", prenom: "Nathan", email: "nathan.faure@email.fr", telephone: "0654556677", statut: "ACTIF", moisAgo: 4 },
      { nom: "Girard", prenom: "Camille", email: "camille.girard@email.fr", telephone: "0665667788", statut: "ACTIF", moisAgo: 5 },
      { nom: "Andre", prenom: "Louis", email: "louis.andre@email.fr", telephone: "0676778899", statut: "BUREAU", moisAgo: 5 },
    ];

    const membres = await Promise.all(
      membresData.map((m) =>
        prisma.membre.create({
          data: {
            nom: m.nom,
            prenom: m.prenom,
            email: m.email,
            telephone: m.telephone,
            motDePasse: motDePasseHash,
            role: m.role || "MEMBRE",
            statut: m.statut,
            dateCreation: getDateMonthsAgo(m.moisAgo),
          },
        })
      )
    );

    // Créer les cotisations
    const now = new Date();
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const expiredDate = new Date(now);
    expiredDate.setMonth(expiredDate.getMonth() - 1);

    await Promise.all([
      prisma.cotisation.create({
        data: {
          membreId: membres[0].id,
          datePaiement: new Date(now.getFullYear(), 0, 15),
          montant: 50.0,
          modePaiement: "CARTE_BANCAIRE",
          dateExpiration: oneYearFromNow,
          statut: "A_JOUR",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: membres[1].id,
          datePaiement: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          montant: 50.0,
          modePaiement: "CHEQUE",
          dateExpiration: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
          statut: "A_JOUR",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: membres[5].id,
          datePaiement: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          montant: 50.0,
          modePaiement: "VIREMENT",
          dateExpiration: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
          statut: "A_JOUR",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: membres[6].id,
          datePaiement: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          montant: 50.0,
          modePaiement: "CARTE_BANCAIRE",
          dateExpiration: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
          statut: "A_JOUR",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: membres[2].id,
          datePaiement: new Date(now.getFullYear() - 2, 5, 1),
          montant: 45.0,
          modePaiement: "ESPECES",
          dateExpiration: expiredDate,
          statut: "EXPIRE",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: membres[3].id,
          datePaiement: now,
          montant: 50.0,
          modePaiement: "VIREMENT",
          dateExpiration: oneYearFromNow,
          statut: "EN_ATTENTE",
        },
      }),
      prisma.cotisation.create({
        data: {
          membreId: admin.id,
          datePaiement: new Date(now.getFullYear(), 2, 1),
          montant: 50.0,
          modePaiement: "CARTE_BANCAIRE",
          dateExpiration: new Date(now.getFullYear() + 1, 2, 1),
          statut: "A_JOUR",
        },
      }),
    ]);

    // Créer les événements
    const evenements = await Promise.all([
      prisma.evenement.create({
        data: {
          titre: "Assemblée Générale Annuelle",
          description: "Assemblée générale annuelle de l'association.",
          dateDebut: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          dateFin: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
          lieu: "Salle des fêtes - 12 rue de la Mairie",
          placesTotal: 100,
          placesRestantes: 95,
          createurId: admin.id,
        },
      }),
      prisma.evenement.create({
        data: {
          titre: "Atelier Initiation Photographie",
          description: "Atelier d'initiation à la photographie numérique.",
          dateDebut: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          dateFin: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
          lieu: "Salle polyvalente - Centre culturel",
          placesTotal: 15,
          placesRestantes: 10,
          createurId: admin.id,
        },
      }),
      prisma.evenement.create({
        data: {
          titre: "Sortie Randonnée Nature",
          description: "Randonnée découverte de 10km dans la forêt communale.",
          dateDebut: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
          dateFin: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
          lieu: "Parking de la forêt communale",
          placesTotal: 25,
          placesRestantes: 25,
          createurId: admin.id,
        },
      }),
    ]);

    // Créer quelques inscriptions
    await Promise.all([
      prisma.inscription.create({
        data: { membreId: membres[0].id, evenementId: evenements[0].id, statut: "CONFIRMEE" },
      }),
      prisma.inscription.create({
        data: { membreId: membres[1].id, evenementId: evenements[0].id, statut: "CONFIRMEE" },
      }),
      prisma.inscription.create({
        data: { membreId: admin.id, evenementId: evenements[0].id, statut: "CONFIRMEE" },
      }),
    ]);

    console.log("✅ Seeding terminé via API");

    res.status(200).json({
      success: true,
      message: "Base de données réinitialisée avec succès",
      data: {
        membres: membres.length + 1,
        evenements: evenements.length,
        compteAdmin: "admin@association.fr / Password123!",
        compteMembre: "marie.dupont@email.fr / Password123!",
      },
    });
  } catch (error) {
    next(error);
  }
};
