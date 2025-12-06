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
        url: "http://localhost:3001",
        description: "Serveur de développement",
      },
      {
        url: "https://api.gestion-associative.com",
        description: "Serveur de production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Entrez le token JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Erreur lors du traitement",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 100,
            },
            pages: {
              type: "integer",
              example: 10,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

// Si le fichier swagger.yaml existe, l'utiliser directement
if (swaggerYamlSpec) {
  module.exports = swaggerYamlSpec;
} else {
  // Sinon utiliser la génération JSDoc
  module.exports = swaggerJsdoc(options);
}
