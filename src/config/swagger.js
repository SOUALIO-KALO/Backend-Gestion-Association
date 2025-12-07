const swaggerJsdoc = require("swagger-jsdoc");
const fs = require("fs");
const path = require("path");

// Charger le fichier YAML s'il existe
let swaggerYamlSpec = null;
try {
  const yamlPath = path.join(__dirname, "../../docs/swagger.yaml");
  if (fs.existsSync(yamlPath)) {
    const yaml = require("js-yaml");
    swaggerYamlSpec = yaml.load(fs.readFileSync(yamlPath, "utf8"));
  }
} catch (err) {
  console.warn("⚠️ Fichier swagger.yaml non trouvé ou non parsable");
}

// URL de base dynamique selon l'environnement
const getBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return process.env.BACKEND_URL || "https://gestion-asso-api.onrender.com";
  }
  return "http://localhost:3001";
};

const baseUrl = getBaseUrl();

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gestion Associative API",
      version: "1.0.0",
      description: "API REST complète pour la gestion des associations",
      contact: {
        name: "Support API",
        email: "support@gestion-associative.com",
      },
      license: {
        name: "MIT",
      },
    },
    servers: [
      {
        url: `${baseUrl}/api`,
        description: "Serveur actuel (production ou dev)",
      },
      {
        url: "http://localhost:3001/api",
        description: "Serveur de développement local",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Entrez votre token JWT (Bearer)",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Erreur lors du traitement" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 10 },
            total: { type: "integer", example: 100 },
            pages: { type: "integer", example: 10 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

// Si le fichier swagger.yaml existe, on le garde en priorité
if (swaggerYamlSpec) {
  // Optionnel : tu peux aussi injecter dynamiquement les servers dans le YAML
  if (!swaggerYamlSpec.servers || swaggerYamlSpec.servers.length === 0) {
    swaggerYamlSpec.servers = [{ url: `${baseUrl}/api` }];
  }
  module.exports = swaggerYamlSpec;
} else {
  module.exports = swaggerJsdoc(options);
}