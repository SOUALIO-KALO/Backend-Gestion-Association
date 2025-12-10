// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyage des tables (dans l'ordre des dépendances)
  await prisma.inscription.deleteMany();
  await prisma.cotisation.deleteMany();
  await prisma.evenement.deleteMany();
  await prisma.membre.deleteMany();

  console.log("✓ Tables nettoyées");

  // ============================================
  // CRÉATION DES MEMBRES
  // ============================================
  const motDePasseHash = await bcrypt.hash("Password123!", 12);
  
  // Helper pour créer des dates dans le passé (mois précédents)
  const getDateMonthsAgo = (monthsAgo) => {
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    date.setDate(Math.floor(Math.random() * 28) + 1);
    return date;
  };

  const admin = await prisma.membre.create({
    data: {
      nom: "Martin",
      prenom: "Jean",
      email: "admin@association.fr",
      telephone: "0601020304",
      motDePasse: motDePasseHash,
      role: "ADMIN",
      statut: "BUREAU",
      dateCreation: getDateMonthsAgo(5), // Il y a 5 mois
    },
  });
  console.log("✓ Admin créé:", admin.email);

  // Créer des membres avec des dates de création variées pour le graphique d'évolution
  const membresData = [
    // Mois actuel (0 mois)
    { nom: "Dupont", prenom: "Marie", email: "marie.dupont@email.fr", telephone: "0611223344", statut: "ACTIF", moisAgo: 0 },
    { nom: "Bernard", prenom: "Pierre", email: "pierre.bernard@email.fr", telephone: "0622334455", statut: "ACTIF", moisAgo: 0 },
    // Il y a 1 mois
    { nom: "Petit", prenom: "Sophie", email: "sophie.petit@email.fr", telephone: "0633445566", statut: "INACTIF", moisAgo: 1 },
    { nom: "Leroy", prenom: "François", email: "francois.leroy@email.fr", telephone: "0644556677", statut: "ACTIF", moisAgo: 1, role: "ADMIN" },
    { nom: "Moreau", prenom: "Isabelle", email: "isabelle.moreau@email.fr", telephone: "0655667788", statut: "ACTIF", moisAgo: 1 },
    // Il y a 2 mois
    { nom: "Garcia", prenom: "Lucas", email: "lucas.garcia@email.fr", telephone: "0666778899", statut: "ACTIF", moisAgo: 2 },
    { nom: "Roux", prenom: "Emma", email: "emma.roux@email.fr", telephone: "0677889900", statut: "ACTIF", moisAgo: 2 },
    { nom: "David", prenom: "Thomas", email: "thomas.david@email.fr", telephone: "0688990011", statut: "BUREAU", moisAgo: 2 },
    // Il y a 3 mois
    { nom: "Bertrand", prenom: "Julie", email: "julie.bertrand@email.fr", telephone: "0699001122", statut: "ACTIF", moisAgo: 3 },
    { nom: "Morel", prenom: "Antoine", email: "antoine.morel@email.fr", telephone: "0610112233", statut: "ACTIF", moisAgo: 3 },
    // Il y a 4 mois
    { nom: "Simon", prenom: "Clara", email: "clara.simon@email.fr", telephone: "0621223344", statut: "ACTIF", moisAgo: 4 },
    { nom: "Laurent", prenom: "Hugo", email: "hugo.laurent@email.fr", telephone: "0632334455", statut: "INACTIF", moisAgo: 4 },
    { nom: "Michel", prenom: "Léa", email: "lea.michel@email.fr", telephone: "0643445566", statut: "ACTIF", moisAgo: 4 },
    { nom: "Faure", prenom: "Nathan", email: "nathan.faure@email.fr", telephone: "0654556677", statut: "ACTIF", moisAgo: 4 },
    // Il y a 5 mois
    { nom: "Girard", prenom: "Camille", email: "camille.girard@email.fr", telephone: "0665667788", statut: "ACTIF", moisAgo: 5 },
    { nom: "Andre", prenom: "Louis", email: "louis.andre@email.fr", telephone: "0676778899", statut: "BUREAU", moisAgo: 5 },
  ];

  const membres = await Promise.all(
    membresData.map(m => 
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
  console.log(`✓ ${membres.length} membres créés avec dates variées pour le graphique`);

  // ============================================
  // CRÉATION DES COTISATIONS
  // ============================================
  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiredDate = new Date(now);
  expiredDate.setMonth(expiredDate.getMonth() - 1);

  const cotisations = await Promise.all([
    // Cotisation à jour
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
    // Cotisation expirant dans 5 jours (alerte urgente)
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
    // Cotisation expirant dans 8 jours (alerte)
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
    // Cotisation expirant dans 3 jours (très urgent)
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
    // Cotisation expirée
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
    // Cotisation en attente
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
    // Cotisation admin à jour
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
    // Plus de cotisations pour les autres membres
    prisma.cotisation.create({
      data: {
        membreId: membres[7].id,
        datePaiement: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        montant: 50.0,
        modePaiement: "CARTE_BANCAIRE",
        dateExpiration: new Date(now.getFullYear() + 1, now.getMonth() - 2, 15),
        statut: "A_JOUR",
      },
    }),
    prisma.cotisation.create({
      data: {
        membreId: membres[8].id,
        datePaiement: new Date(now.getFullYear(), now.getMonth() - 1, 10),
        montant: 50.0,
        modePaiement: "ESPECES",
        dateExpiration: new Date(now.getFullYear() + 1, now.getMonth() - 1, 10),
        statut: "A_JOUR",
      },
    }),
  ]);
  console.log(`✓ ${cotisations.length} cotisations créées (dont alertes à 3, 5 et 8 jours)`);

  // ============================================
  // CRÉATION DES ÉVÉNEMENTS
  // ============================================
  const evenements = await Promise.all([
    prisma.evenement.create({
      data: {
        titre: "Assemblée Générale Annuelle",
        description:
          "Assemblée générale annuelle de l'association. Présence obligatoire pour tous les membres. Ordre du jour : bilan moral, bilan financier, élection du bureau.",
        dateDebut: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        dateFin: new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000
        ),
        lieu: "Salle des fêtes - 12 rue de la Mairie",
        placesTotal: 100,
        placesRestantes: 95,
        createurId: admin.id,
      },
    }),
    prisma.evenement.create({
      data: {
        titre: "Atelier Initiation Photographie",
        description:
          "Atelier d'initiation à la photographie numérique. Apportez votre appareil photo ou smartphone.",
        dateDebut: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Dans 14 jours
        dateFin: new Date(
          now.getTime() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
        ),
        lieu: "Salle polyvalente - Centre culturel",
        placesTotal: 15,
        placesRestantes: 10,
        createurId: admin.id,
      },
    }),
    prisma.evenement.create({
      data: {
        titre: "Sortie Randonnée Nature",
        description:
          "Randonnée découverte de 10km dans la forêt communale. Niveau facile, prévoir chaussures de marche.",
        dateDebut: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // Dans 21 jours
        dateFin: new Date(
          now.getTime() + 21 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000
        ),
        lieu: "Parking de la forêt communale",
        placesTotal: 25,
        placesRestantes: 25,
        createurId: membres[3].id,
      },
    }),
    prisma.evenement.create({
      data: {
        titre: "Soirée Jeux de Société",
        description:
          "Venez passer une soirée conviviale autour de jeux de société modernes et classiques.",
        dateDebut: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Dans 10 jours
        dateFin: new Date(
          now.getTime() + 10 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000
        ),
        lieu: "Local associatif - 5 rue du Commerce",
        placesTotal: 20,
        placesRestantes: 18,
        createurId: admin.id,
      },
    }),
    prisma.evenement.create({
      data: {
        titre: "Formation Premiers Secours",
        description:
          "Formation PSC1 dispensée par la Croix-Rouge. Certification officielle à la clé.",
        dateDebut: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // Dans 30 jours
        dateFin: new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000
        ),
        lieu: "Salle de formation - Maison des associations",
        placesTotal: 12,
        placesRestantes: 8,
        createurId: admin.id,
      },
    }),
  ]);
  console.log(`✓ ${evenements.length} événements créés`);

  // ============================================
  // CRÉATION DES INSCRIPTIONS
  // ============================================
  const inscriptions = await Promise.all([
    prisma.inscription.create({
      data: {
        membreId: membres[0].id,
        evenementId: evenements[0].id,
        statut: "CONFIRMEE",
      },
    }),
    prisma.inscription.create({
      data: {
        membreId: membres[1].id,
        evenementId: evenements[0].id,
        statut: "CONFIRMEE",
      },
    }),
    prisma.inscription.create({
      data: {
        membreId: admin.id,
        evenementId: evenements[0].id,
        statut: "CONFIRMEE",
      },
    }),
    prisma.inscription.create({
      data: {
        membreId: membres[0].id,
        evenementId: evenements[1].id,
        statut: "CONFIRMEE",
      },
    }),
    prisma.inscription.create({
      data: {
        membreId: membres[4].id,
        evenementId: evenements[1].id,
        statut: "EN_ATTENTE",
      },
    }),
  ]);
  console.log(`✓ ${inscriptions.length} inscriptions créées`);

  console.log("\n✅ Seeding terminé avec succès !");
  console.log("\n📧 Comptes de test:");
  console.log("   Admin: admin@association.fr / Password123!");
  console.log("   Membre: marie.dupont@email.fr / Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
