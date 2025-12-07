const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const yamlPath = path.join(__dirname, "../../docs/swagger.yaml");

if (fs.existsSync(yamlPath)) {
  try {
    let yamlContent = fs.readFileSync(yamlPath, "utf8");

    const isProduction = process.env.NODE_ENV === "production";
    const baseUrl = isProduction
      ? "https://gestion-asso-api.onrender.com/api"
      : "http://localhost:3001/api";

    yamlContent = yamlContent.replace("{BASE_URL_AUTO}", baseUrl);

    const spec = yaml.load(yamlContent);
    console.log(`Swagger → Serveur chargé : ${baseUrl}`);
    module.exports = spec;
    return; // ← on sort proprement, pas de fallback
  } catch (err) {
    console.error("Erreur chargement swagger.yaml :", err);
  }
}

// Fallback JSDoc (au cas où)
const swaggerJsdoc = require("swagger-jsdoc");
const options = { /* ... ton fallback actuel ... */ };
module.exports = swaggerJsdoc(options);