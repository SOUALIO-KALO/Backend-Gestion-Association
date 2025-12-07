const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Chemin vers ton fichier YAML
const yamlPath = path.join(__dirname, "../../docs/swagger.yaml");

// Si le fichier existe → on le charge et on injecte dynamiquement l'URL
if (fs.existsSync(yamlPath)) {
  try {
    let yamlContent = fs.readFileSync(yamlPath, "utf8");

    // URL dynamique selon l'environnement
    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl = isProduction
      ? "https://gestion-asso-api.onrender.com/api"
      : "http://localhost:3001/api";

    // Remplace la ligne magique {BASE_URL_AUTO} par la vraie URL
    yamlContent = yamlContent.replace("{BASE_URL_AUTO}", baseUrl);

    // Charge et exporte la spec YAML modifiée
    const spec = yaml.load(yamlContent);
    module.exports = spec;
    console.log(`Swagger → Serveur chargé : ${baseUrl}`);
    process.exit(); // ← important : on arrête ici, pas de fallback JSDoc
  } catch (err) {
    console.error("Erreur lors du chargement de swagger.yaml :", err);
  }
}

// ====================
// Fallback JSDoc (au cas où le YAML est supprimé ou corrompu)
// ====================
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gestion Associative API",
      version: "1.0.0",
      description: "API REST complète pour la gestion des associations",
    },
    servers: [
      {
        url: process.env.NODE_ENV === "production"
          ? "https://gestion-asso-api.onrender.com/api"
          : "http://localhost:3001/api",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

module.exports = swaggerJsdoc(options);