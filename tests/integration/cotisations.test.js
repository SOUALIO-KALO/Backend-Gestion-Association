const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { addYears, subDays, addDays } = require("date-fns");

const prisma = new PrismaClient();

describe("Cotisations API", () => {
  let adminToken;
  let membreToken;
  let adminId;
  let membreId;
  let cotisationId;
  let cotisationTestId;

  beforeAll(async () => {
    // Nettoyer la base de données
    await prisma.cotisation.deleteMany({});
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

    // Créer une cotisation de test
    const cotisation = await prisma.cotisation.create({
      data: {
        membreId: membreId,
        datePaiement: new Date(),
        montant: 10000,
        modePaiement: "VIREMENT",
        dateExpiration: addYears(new Date(), 1),
        statut: "A_JOUR",
      },
    });
    cotisationId = cotisation.id;

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

  describe("POST /api/cotisations", () => {
    it("devrait créer une nouvelle cotisation (Admin)", async () => {
      const res = await request(app)
        .post("/api/cotisations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membreId: membreId,
          datePaiement: new Date().toISOString(),
          montant: 15000,
          modePaiement: "ESPECES",
          notes: "Paiement en espèces",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.montant).toBe("15000");
      expect(res.body.data).toHaveProperty("dateExpiration");
      expect(res.body.data.statut).toBe("A_JOUR");

      cotisationTestId = res.body.data.id;
    });

    it("ne devrait pas créer une cotisation avec un membre inexistant", async () => {
      const res = await request(app)
        .post("/api/cotisations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membreId: "00000000-0000-0000-0000-000000000000",
          datePaiement: new Date().toISOString(),
          montant: 10000,
          modePaiement: "ESPECES",
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas créer une cotisation sans authentification", async () => {
      const res = await request(app).post("/api/cotisations").send({
        membreId: membreId,
        datePaiement: new Date().toISOString(),
        montant: 10000,
        modePaiement: "ESPECES",
      });

      expect(res.statusCode).toBe(401);
    });

    it("ne devrait pas créer une cotisation en tant que membre simple", async () => {
      const res = await request(app)
        .post("/api/cotisations")
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          membreId: membreId,
          datePaiement: new Date().toISOString(),
          montant: 10000,
          modePaiement: "ESPECES",
        });

      expect(res.statusCode).toBe(403);
    });

    it("ne devrait pas créer une cotisation avec des données invalides", async () => {
      const res = await request(app)
        .post("/api/cotisations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membreId: "invalid-uuid",
          datePaiement: "invalid-date",
          montant: -100,
          modePaiement: "INVALID_MODE",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas créer une cotisation avec une date future", async () => {
      const res = await request(app)
        .post("/api/cotisations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          membreId: membreId,
          datePaiement: addDays(new Date(), 10).toISOString(),
          montant: 10000,
          modePaiement: "ESPECES",
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /api/cotisations", () => {
    it("devrait récupérer toutes les cotisations (Admin)", async () => {
      const res = await request(app)
        .get("/api/cotisations")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("devrait filtrer les cotisations par statut", async () => {
      const res = await request(app)
        .get("/api/cotisations?statut=A_JOUR")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((c) => c.statut === "A_JOUR")).toBe(true);
    });

    it("devrait filtrer les cotisations par mode de paiement", async () => {
      const res = await request(app)
        .get("/api/cotisations?modePaiement=ESPECES")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((c) => c.modePaiement === "ESPECES")).toBe(
        true
      );
    });

    it("devrait paginer les résultats", async () => {
      const res = await request(app)
        .get("/api/cotisations?page=1&limit=1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.data.length).toBeLessThanOrEqual(1);
    });

    it("ne devrait pas permettre à un membre simple de lister toutes les cotisations", async () => {
      const res = await request(app)
        .get("/api/cotisations")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/cotisations/:id", () => {
    it("devrait récupérer une cotisation par son ID (Admin)", async () => {
      const res = await request(app)
        .get(`/api/cotisations/${cotisationId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(cotisationId);
      expect(res.body.data).toHaveProperty("membre");
    });

    it("devrait permettre à un membre de voir sa propre cotisation", async () => {
      const res = await request(app)
        .get(`/api/cotisations/${cotisationId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(cotisationId);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const res = await request(app)
        .get("/api/cotisations/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/cotisations/membre/:membreId", () => {
    it("devrait récupérer les cotisations d'un membre (Admin)", async () => {
      const res = await request(app)
        .get(`/api/cotisations/membre/${membreId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.every((c) => c.membreId === membreId)).toBe(true);
    });

    it("devrait permettre à un membre de voir ses propres cotisations", async () => {
      const res = await request(app)
        .get(`/api/cotisations/membre/${membreId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("ne devrait pas permettre à un membre de voir les cotisations d'un autre", async () => {
      const res = await request(app)
        .get(`/api/cotisations/membre/${adminId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/cotisations/mes-cotisations", () => {
    it("devrait récupérer les cotisations de l'utilisateur connecté", async () => {
      const res = await request(app)
        .get("/api/cotisations/mes-cotisations")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe("GET /api/cotisations/mon-statut", () => {
    it("devrait récupérer le statut de cotisation de l'utilisateur", async () => {
      const res = await request(app)
        .get("/api/cotisations/mon-statut")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("statut");
      expect(res.body.data).toHaveProperty("cotisation");
    });
  });

  describe("PUT /api/cotisations/:id", () => {
    it("devrait mettre à jour une cotisation (Admin)", async () => {
      const res = await request(app)
        .put(`/api/cotisations/${cotisationTestId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          montant: 20000,
          notes: "Montant mis à jour",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.montant).toBe("20000");
    });

    it("ne devrait pas permettre à un membre de modifier une cotisation", async () => {
      const res = await request(app)
        .put(`/api/cotisations/${cotisationId}`)
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          montant: 25000,
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/cotisations/statistiques", () => {
    it("devrait récupérer les statistiques des cotisations (Admin)", async () => {
      const res = await request(app)
        .get("/api/cotisations/statistiques")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("totalCotisations");
      expect(res.body.data).toHaveProperty("cotisationsAJour");
      expect(res.body.data).toHaveProperty("montantTotalMois");
      expect(res.body.data).toHaveProperty("repartition");
    });

    it("ne devrait pas permettre à un membre d'accéder aux statistiques", async () => {
      const res = await request(app)
        .get("/api/cotisations/statistiques")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/cotisations/alertes", () => {
    it("devrait récupérer les cotisations proches de l'expiration (Admin)", async () => {
      const res = await request(app)
        .get("/api/cotisations/alertes?jours=365")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("count");
    });
  });

  describe("GET /api/cotisations/:id/recu", () => {
    it("devrait générer et télécharger un reçu PDF (Admin)", async () => {
      const res = await request(app)
        .get(`/api/cotisations/${cotisationId}/recu`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("pdf");
    });

    it("devrait permettre à un membre de télécharger son propre reçu", async () => {
      const res = await request(app)
        .get(`/api/cotisations/${cotisationId}/recu`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("pdf");
    });
  });

  describe("POST /api/cotisations/update-statuts", () => {
    it("devrait mettre à jour les statuts expirés (Admin)", async () => {
      const res = await request(app)
        .post("/api/cotisations/update-statuts")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("count");
    });
  });

  describe("DELETE /api/cotisations/:id", () => {
    it("devrait supprimer une cotisation (Admin)", async () => {
      const res = await request(app)
        .delete(`/api/cotisations/${cotisationTestId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("ne devrait pas permettre à un membre de supprimer", async () => {
      const res = await request(app)
        .delete(`/api/cotisations/${cotisationId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
