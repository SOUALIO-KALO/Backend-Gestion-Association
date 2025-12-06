const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

describe("Membres API", () => {
  let adminToken;
  let membreToken;
  let adminId;
  let membreId;
  let membreTestId;

  beforeAll(async () => {
    // Nettoyer la base de données
    await prisma.inscription.deleteMany({});
    await prisma.cotisation.deleteMany({});
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

  describe("POST /api/membres", () => {
    it("devrait créer un nouveau membre (Admin)", async () => {
      const res = await request(app)
        .post("/api/membres")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nom: "Nouveau",
          prenom: "Membre",
          email: "nouveau@test.com",
          telephone: "0102030405",
          motDePasse: "Password123!",
          role: "MEMBRE",
          statut: "ACTIF",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data.email).toBe("nouveau@test.com");

      membreTestId = res.body.data.id;
    });

    it("ne devrait pas créer un membre avec un email existant", async () => {
      const res = await request(app)
        .post("/api/membres")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nom: "Doublon",
          prenom: "Test",
          email: "nouveau@test.com",
          motDePasse: "Password123!",
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("ne devrait pas créer un membre sans authentification", async () => {
      const res = await request(app).post("/api/membres").send({
        nom: "Test",
        prenom: "Test",
        email: "test@test.com",
        motDePasse: "Password123!",
      });

      expect(res.statusCode).toBe(401);
    });

    it("ne devrait pas créer un membre en tant que membre simple", async () => {
      const res = await request(app)
        .post("/api/membres")
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          nom: "Test",
          prenom: "Test",
          email: "test2@test.com",
          motDePasse: "Password123!",
        });

      expect(res.statusCode).toBe(403);
    });

    it("ne devrait pas créer un membre avec des données invalides", async () => {
      const res = await request(app)
        .post("/api/membres")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nom: "T",
          prenom: "",
          email: "invalid-email",
          motDePasse: "123",
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /api/membres", () => {
    it("devrait récupérer tous les membres (Admin)", async () => {
      const res = await request(app)
        .get("/api/membres")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty("pagination");
    });

    it("devrait filtrer les membres par statut", async () => {
      const res = await request(app)
        .get("/api/membres?statut=ACTIF")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.every((m) => m.statut === "ACTIF")).toBe(true);
    });

    it("devrait rechercher des membres", async () => {
      const res = await request(app)
        .get("/api/membres?search=Nouveau")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it("devrait paginer les résultats", async () => {
      const res = await request(app)
        .get("/api/membres?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.page).toBe(1);
    });

    it("ne devrait pas permettre à un membre simple de lister tous les membres", async () => {
      const res = await request(app)
        .get("/api/membres")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/membres/:id", () => {
    it("devrait récupérer un membre par son ID (Admin)", async () => {
      const res = await request(app)
        .get(`/api/membres/${membreTestId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(membreTestId);
      expect(res.body.data).not.toHaveProperty("motDePasse");
    });

    it("devrait permettre à un membre de voir son propre profil", async () => {
      const res = await request(app)
        .get(`/api/membres/${membreId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(membreId);
    });

    it("ne devrait pas permettre à un membre de voir un autre profil", async () => {
      const res = await request(app)
        .get(`/api/membres/${adminId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });

    it("devrait retourner 404 pour un ID inexistant", async () => {
      const res = await request(app)
        .get("/api/membres/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /api/membres/me", () => {
    it("devrait récupérer le profil de l'utilisateur connecté", async () => {
      const res = await request(app)
        .get("/api/membres/me")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(membreId);
      expect(res.body.data.email).toBe("membre@test.com");
    });
  });

  describe("PUT /api/membres/:id", () => {
    it("devrait mettre à jour un membre (Admin)", async () => {
      const res = await request(app)
        .put(`/api/membres/${membreTestId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          nom: "Modifié",
          telephone: "0607080910",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nom).toBe("Modifié");
      expect(res.body.data.telephone).toBe("0607080910");
    });

    it("devrait permettre à un membre de modifier son propre profil", async () => {
      const res = await request(app)
        .put(`/api/membres/${membreId}`)
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          telephone: "0123456789",
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.telephone).toBe("0123456789");
    });

    it("ne devrait pas permettre à un membre de modifier son rôle", async () => {
      const res = await request(app)
        .put(`/api/membres/${membreId}`)
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          role: "ADMIN",
        });

      expect(res.statusCode).toBe(403);
    });

    it("ne devrait pas permettre à un membre de modifier un autre profil", async () => {
      const res = await request(app)
        .put(`/api/membres/${adminId}`)
        .set("Authorization", `Bearer ${membreToken}`)
        .send({
          nom: "Hack",
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/membres/statistiques", () => {
    it("devrait récupérer les statistiques des membres (Admin)", async () => {
      const res = await request(app)
        .get("/api/membres/statistiques")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty("totalMembres");
      expect(res.body.data).toHaveProperty("membresActifs");
      expect(res.body.data).toHaveProperty("repartition");
    });

    it("ne devrait pas permettre à un membre simple d'accéder aux statistiques", async () => {
      const res = await request(app)
        .get("/api/membres/statistiques")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("GET /api/membres/export", () => {
    it("devrait exporter les membres en CSV (Admin)", async () => {
      const res = await request(app)
        .get("/api/membres/export")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.headers["content-type"]).toContain("csv");
    });

    it("ne devrait pas permettre à un membre simple d'exporter", async () => {
      const res = await request(app)
        .get("/api/membres/export")
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe("DELETE /api/membres/:id", () => {
    it("ne devrait pas permettre à un admin de se supprimer lui-même", async () => {
      const res = await request(app)
        .delete(`/api/membres/${adminId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
    });

    it("devrait supprimer un membre (Admin)", async () => {
      const res = await request(app)
        .delete(`/api/membres/${membreTestId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("ne devrait pas permettre à un membre simple de supprimer", async () => {
      const res = await request(app)
        .delete(`/api/membres/${adminId}`)
        .set("Authorization", `Bearer ${membreToken}`);

      expect(res.statusCode).toBe(403);
    });
  });
});
