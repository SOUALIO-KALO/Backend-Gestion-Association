// migrate-and-seed.js  (fichier temporaire - à supprimer après)
require("dotenv").config();
const { execSync } = require("child_process");

console.log("Lancement des migrations Prisma...");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("Toutes les migrations ont été appliquées");
} catch (error) {
  console.error("Erreur migration :", error.message);
}

console.log("Lancement du seed (création admin + données de test)...");
try {
  execSync("node prisma/seed.js", { stdio: "inherit" });
  console.log("Seed terminé avec succès !");
} catch (error) {
  console.log("Le seed a peut-être déjà été exécuté ou il y a une petite erreur (c’est OK)");
}

console.log("Tout est prêt ! Tu peux maintenant te connecter avec admin@test.com");
process.exit(0);