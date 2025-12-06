// backend/tests/unit/services/authService.test.js

const bcrypt = require("bcryptjs");

// Mock des dépendances
jest.mock("@prisma/client", () => {
  const mockPrisma = {
    membre: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

jest.mock("../../src/services/emailService", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendPasswordChangedEmail: jest.fn().mockResolvedValue(true),
}));

const { PrismaClient } = require("@prisma/client");
const authService = require("../../src/services/authService");
const emailService = require("../../src/services/emailService");

const prisma = new PrismaClient();

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("devrait créer un nouveau membre avec mot de passe hashé", async () => {
      const userData = {
        nom: "Dupont",
        prenom: "Jean",
        email: "jean.dupont@example.com",
        telephone: "0612345678",
        motDePasse: "Password123!",
      };

      prisma.membre.findUnique.mockResolvedValue(null);
      prisma.membre.create.mockResolvedValue({
        id: "uuid-123",
        ...userData,
        role: "MEMBRE",
        statut: "ACTIF",
        dateCreation: new Date(),
      });

      const result = await authService.register(userData);

      expect(result.membre).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.membre.email).toBe(userData.email.toLowerCase());
      expect(prisma.membre.create).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it("devrait rejeter si l'email existe déjà", async () => {
      prisma.membre.findUnique.mockResolvedValue({ id: "existing-id" });

      await expect(
        authService.register({
          nom: "Test",
          prenom: "User",
          email: "existing@example.com",
          motDePasse: "Password123!",
        })
      ).rejects.toThrow();
    });
  });

  describe("login", () => {
    it("devrait retourner un token pour des identifiants valides", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);

      prisma.membre.findUnique.mockResolvedValue({
        id: "uuid-123",
        email: "test@example.com",
        motDePasse: hashedPassword,
        role: "MEMBRE",
        statut: "ACTIF",
      });

      const result = await authService.login(
        "test@example.com",
        "Password123!"
      );

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.membre.id).toBe("uuid-123");
    });

    it("devrait rejeter pour un email inconnu", async () => {
      prisma.membre.findUnique.mockResolvedValue(null);

      await expect(
        authService.login("unknown@example.com", "Password123!")
      ).rejects.toThrow("Email ou mot de passe incorrect");
    });

    it("devrait rejeter pour un mot de passe incorrect", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);

      prisma.membre.findUnique.mockResolvedValue({
        id: "uuid-123",
        email: "test@example.com",
        motDePasse: hashedPassword,
        role: "MEMBRE",
        statut: "ACTIF",
      });

      await expect(
        authService.login("test@example.com", "WrongPassword!")
      ).rejects.toThrow("Email ou mot de passe incorrect");
    });

    it("devrait rejeter un compte inactif", async () => {
      const hashedPassword = await bcrypt.hash("Password123!", 10);

      prisma.membre.findUnique.mockResolvedValue({
        id: "uuid-123",
        email: "test@example.com",
        motDePasse: hashedPassword,
        role: "MEMBRE",
        statut: "INACTIF",
      });

      await expect(
        authService.login("test@example.com", "Password123!")
      ).rejects.toThrow("désactivé");
    });
  });
});
