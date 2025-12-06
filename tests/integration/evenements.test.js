const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { addDays } = require("date-fns");

const prisma = new PrismaClient();

describe("Evenements API", () => {
  let adminToken;
  let membreToken;
  let adminId;
  let membreId;
  let evenementId;

  beforeAll(async () => {
    // Nettoyer la base de données
    await prisma.inscription.deleteMany({});
    await prisma.evenement.deleteMany({});
    await prisma.membre.deleteMany({});

    // Créer un admin
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const admin = await prisma.membre.create({
      data: {
        nom: "Admin",
        prenom: "Test",
        email: "admin@test.com",
        motDePasse: adminPassword,
        role: "ADMIN",
        statut: "ACTIF",
      },
    });
    adminId = admin.id;

    // Créer un membre
    const membrePassword = await bcrypt.hash("Membre123!", 10);
    const membre = await prisma.membre.create({
      data: {
        nom: "Membre",
        prenom: "Test",
        email: "membre@test.com",
        motDePasse: membrePassword,
        role: "MEMBRE",
        statut: "ACTIF",
      },
    });
    membreId = membre.id;

    // Créer un événement de test
    const dateDebut = addDays(new Date(), 7);
    const dateFin = addDays(dateDebut, 2);
    const evenement = await prisma.evenement.create({
      data: {
        titre: "Réunion mensuelle",
        description: "Réunion mensuelle de l'association",
        dateDebut,
        dateFin,
        lieu: "Salle principale",
        placesTotal: 50,
        placesRestantes: 50,
        createurId: adminId,
      },
    });
    evenementId = evenement.id;

    // Se connecter pour obtenir les tokens
    const adminLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", motDePasse: "Admin123!" });
    adminToken = adminLoginRes.body.token;

    const membreLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "membre@test.com", motDePasse: "Membre123!" });
    membreToken = membreLoginRes.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/evenements", () => {
    it("devrait créer un nouvel événement (Admin)", async () => {
      const res = await request(app)
        .post("/api/evenements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          titre: "Conférence spéciale",
          description: "Une conférence sur les associations",
          dateDebut: addDays(new Date(), 14),
          dateFin: addDays(new Date(), 14),
          lieu: "Amphithéâtre",
          placesTotal: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titre).toBe("Conférence spéciale");
      expect(res.body.data.placesTotal).toBe(100);
    });

    it("ne devrait pas créer un événement sans authentification", async () => {
      const res = await request(app)
        .post("/api/evenements")
        .send({
          titre: "Événement",
          dateDebut: addDays(new Date(), 14),
          lieu: "Salle",
          placesTotal: 50,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas créer un événement en tant que membre simple", async () => {
      const res = await request(app)
        .post("/api/evenements")
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          titre: "Événement",
          dateDebut: addDays(new Date(), 14),
          lieu: "Salle",
          placesTotal: 50,
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas créer un événement avec des données invalides", async () => {
      const res = await request(app)
        .post("/api/evenements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          titre: "", // Titre vide
          lieu: "Salle",
          placesTotal: "invalid",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/evenements", () => {
    it("devrait récupérer tous les événements", async () => {
      const res = await request(app)
        .get("/api/evenements")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    it("devrait paginer les résultats", async () => {
      const res = await request(app)
        .get("/api/evenements?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });

    it("devrait permettre à un membre de lister les événements", async () => {
      const res = await request(app)
        .get("/api/evenements")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("ne devrait pas permettre l'accès sans authentification", async () => {
      const res = await request(app).get("/api/evenements");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/evenements/:id", () => {
    it("devrait récupérer un événement par son ID", async () => {
      const res = await request(app)
        .get(`/api/evenements/${evenementId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(evenementId);
      expect(res.body.data.titre).toBe("Réunion mensuelle");
    });

    it("devrait permettre à un membre de voir un événement", async () => {
      const res = await request(app)
        .get(`/api/evenements/${evenementId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await request(app)
        .get(`/api/evenements/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas permettre l'accès sans authentification", async () => {
      const res = await request(app).get(`/api/evenements/${evenementId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("PUT /api/evenements/:id", () => {
    it("devrait mettre à jour un événement (Admin)", async () => {
      const res = await request(app)
        .put(`/api/evenements/${evenementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          titre: "Réunion mensuelle - Mise à jour",
          placesTotal: 75,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titre).toBe("Réunion mensuelle - Mise à jour");
      expect(res.body.data.placesTotal).toBe(75);
    });

    it("ne devrait pas permettre à un membre de modifier un événement", async () => {
      const res = await request(app)
        .put(`/api/evenements/${evenementId}`)
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          titre: "Titre modifié",
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas modifier avec des données invalides", async () => {
      const res = await request(app)
        .put(`/api/evenements/${evenementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          placesTotal: -5, // Nombre négatif invalide
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await request(app)
        .put(`/api/evenements/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          titre: "Titre",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/evenements/:id", () => {
    let evenementASupprimer;

    beforeEach(async () => {
      // Créer un événement pour chaque test de suppression
      const dateDebut = addDays(new Date(), 21);
      const dateFin = addDays(dateDebut, 1);
      evenementASupprimer = await prisma.evenement.create({
        data: {
          titre: "Événement à supprimer",
          description: "Cet événement sera supprimé",
          dateDebut,
          dateFin,
          lieu: "Salle test",
          placesTotal: 30,
          placesRestantes: 30,
          createurId: adminId,
        },
      });
    });

    it("devrait supprimer un événement (Admin)", async () => {
      const res = await request(app)
        .delete(`/api/evenements/${evenementASupprimer.id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Vérifier que l'événement a été supprimé
      const checkRes = await request(app)
        .get(`/api/evenements/${evenementASupprimer.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(checkRes.status).toBe(404);
    });

    it("ne devrait pas permettre à un membre de supprimer un événement", async () => {
      const res = await request(app)
        .delete(`/api/evenements/${evenementASupprimer.id}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const fakeId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await request(app)
        .delete(`/api/evenements/${fakeId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas permettre l'accès sans authentification", async () => {
      const res = await request(app).delete(
        `/api/evenements/${evenementASupprimer.id}`
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
