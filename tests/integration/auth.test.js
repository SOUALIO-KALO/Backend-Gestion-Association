// backend/tests/integration/auth.test.js

const request = require("supertest");
const app = require("../../src/app");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

describe("Auth API", () => {
  // Données de test
  const testUser = {
    nom: "Test",
    prenom: "User",
    email: "test@example.com",
    telephone: "0612345678",
    motDePasse: "Password123!",
  };

  let authToken;
  let refreshToken;
  let userId;

  // Nettoyage avant les tests
  beforeAll(async () => {
    await prisma.inscription.deleteMany();
    await prisma.cotisation.deleteMany();
    await prisma.evenement.deleteMany();
    await prisma.membre.deleteMany();
  });

  // Nettoyage après les tests
  afterAll(async () => {
    await prisma.inscription.deleteMany();
    await prisma.cotisation.deleteMany();
    await prisma.evenement.deleteMany();
    await prisma.membre.deleteMany();
    await prisma.$disconnect();
  });

  // =============================================
  // TESTS D'INSCRIPTION
  // =============================================
  describe("POST /api/auth/register", () => {
    it("devrait créer un nouveau membre", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.membre.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.membre.nom).toBe(testUser.nom);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.membre.motDePasse).toBeUndefined();

      userId = res.body.data.membre.id;
    });

    it("devrait rejeter un email déjà utilisé", async () => {
      const res = await request(app).post("/api/auth/register").send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("devrait valider le format de l'email", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "invalid-email" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("devrait valider la complexité du mot de passe", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ ...testUser, email: "new@example.com", motDePasse: "123" });

      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it("devrait valider les champs requis", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test2@example.com" });

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  // =============================================
  // TESTS DE CONNEXION
  // =============================================
  describe("POST /api/auth/login", () => {
    it("devrait connecter un membre avec des identifiants valides", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        motDePasse: testUser.motDePasse,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.membre.email).toBe(testUser.email.toLowerCase());

      authToken = res.body.data.token;
      refreshToken = res.body.data.refreshToken;
    });

    it("devrait rejeter un email inconnu", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "unknown@example.com",
        motDePasse: testUser.motDePasse,
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("devrait rejeter un mot de passe incorrect", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        motDePasse: "WrongPassword123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =============================================
  // TESTS DE PROFIL
  // =============================================
  describe("GET /api/auth/me", () => {
    it("devrait retourner le profil avec un token valide", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    });

    it("devrait rejeter une requête sans token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });

    it("devrait rejeter un token invalide", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
    });
  });

  // =============================================
  // TESTS DE REFRESH TOKEN
  // =============================================
  describe("POST /api/auth/refresh-token", () => {
    it("devrait retourner un nouveau token avec un refresh token valide", async () => {
      const res = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it("devrait rejeter un refresh token invalide", async () => {
      const res = await request(app)
        .post("/api/auth/refresh-token")
        .send({ refreshToken: "invalid-refresh-token" });

      expect(res.status).toBe(401);
    });
  });

  // =============================================
  // TESTS DE VÉRIFICATION TOKEN
  // =============================================
  describe("GET /api/auth/verify", () => {
    it("devrait confirmer un token valide", async () => {
      const res = await request(app)
        .get("/api/auth/verify")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
    });
  });

  // =============================================
  // TESTS DE CHANGEMENT DE MOT DE PASSE
  // =============================================
  describe("PUT /api/auth/change-password", () => {
    const newPassword = "NewPassword456!";

    it("devrait changer le mot de passe avec le bon mot de passe actuel", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: testUser.motDePasse,
          newPassword: newPassword,
          confirmPassword: newPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("devrait pouvoir se connecter avec le nouveau mot de passe", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        motDePasse: newPassword,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Mettre à jour le token pour les tests suivants
      authToken = res.body.data.token;
    });

    it("devrait rejeter l'ancien mot de passe", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        motDePasse: testUser.motDePasse,
      });

      expect(res.status).toBe(401);
    });

    it("devrait rejeter si le mot de passe actuel est incorrect", async () => {
      const res = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "WrongPassword!",
          newPassword: "AnotherPassword789!",
          confirmPassword: "AnotherPassword789!",
        });

      expect(res.status).toBe(400);
    });
  });

  // =============================================
  // TESTS DE DÉCONNEXION
  // =============================================
  describe("POST /api/auth/logout", () => {
    it("devrait déconnecter un utilisateur", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =============================================
  // TESTS MOT DE PASSE OUBLIÉ
  // =============================================
  describe("POST /api/auth/forgot-password", () => {
    it("devrait accepter une demande pour un email existant", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("devrait retourner le même message pour un email inexistant (sécurité)", async () => {
      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "nonexistent@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
