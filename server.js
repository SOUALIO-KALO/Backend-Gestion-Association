// backend/server.js

require("dotenv").config();
const app = require("./src/app");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// ============================================
// CONNEXION BASE DE DONNÉES ET DÉMARRAGE
// ============================================
async function startServer() {
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log("✅ Connexion à PostgreSQL établie");

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`
🚀 Serveur démarré avec succès !
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:${PORT}
🔧 Environnement: ${process.env.NODE_ENV || "development"}
📊 Base de données: connectée
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage:", error);
    process.exit(1);
  }
}

// ============================================
// GESTION ARRÊT PROPRE
// ============================================
process.on("SIGINT", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Arrêt du serveur...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
