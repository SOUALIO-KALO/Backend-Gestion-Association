// backend/src/controllers/membreController.js

const membreService = require("../services/membreService");

/**
 * Contrôleur de gestion des membres
 */
class MembreController {
  /**
   * POST /api/membres
   * Créer un nouveau membre
   */
  async createMembre(req, res, next) {
    try {
      const createData = req.body;

      // Vérifier les droits d'admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de créer un membre",
        });
      }

      const membre = await membreService.createMembre(createData);

      res.status(201).json({
        success: true,
        message: "Membre créé avec succès",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres
   * Récupérer tous les membres avec pagination et filtres
   */
  async getAllMembres(req, res, next) {
    try {
      const { page, limit, search, statut, role, sortBy, sortOrder } =
        req.query;

      const options = {
        page: page || 1,
        limit: limit || 25,
        search: search || "",
        statut: statut || null,
        role: role || null,
        sortBy: sortBy || "dateCreation",
        sortOrder: sortOrder || "desc",
      };

      const result = await membreService.getAllMembres(options);

      res.status(200).json({
        success: true,
        message: "Membres récupérés avec succès",
        data: result.membres,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/me
   * Récupérer le profil de l'utilisateur connecté
   */
  async getMembreCurrentUser(req, res, next) {
    try {
      const membre = await membreService.getMembreById(req.user.id);

      res.status(200).json({
        success: true,
        message: "Profil récupéré",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/:id
   * Récupérer un membre par ID
   */
  async getMembreById(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier que l'utilisateur accède à son profil ou est admin
      if (req.user.id !== id && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de voir ce profil",
        });
      }

      const membre = await membreService.getMembreById(id);

      res.status(200).json({
        success: true,
        message: "Membre récupéré avec succès",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/membres/:id
   * Mettre à jour un membre
   */
  async updateMembre(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Vérifier que l'utilisateur modifie son profil ou est admin
      if (req.user.id !== id && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de modifier ce profil",
        });
      }

      // Un utilisateur non-admin ne peut pas modifier le rôle
      if (req.user.role !== "ADMIN" && updateData.role) {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de modifier le rôle",
        });
      }

      const membre = await membreService.updateMembre(id, updateData);

      res.status(200).json({
        success: true,
        message: "Membre mis à jour avec succès",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/membres/:id
   * Supprimer un membre
   */
  async deleteMembre(req, res, next) {
    try {
      const { id } = req.params;

      // Vérifier les droits d'admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de supprimer un membre",
        });
      }

      // Empêcher un admin de se supprimer lui-même
      if (req.user.id === id) {
        return res.status(400).json({
          success: false,
          message: "Vous ne pouvez pas supprimer votre propre compte",
        });
      }

      await membreService.deleteMembre(id);

      res.status(200).json({
        success: true,
        message: "Membre supprimé avec succès",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/membres/:id/statut
   * Modifier le statut d'un membre
   */
  async updateStatutMembre(req, res, next) {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      // Vérifier les droits d'admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de modifier le statut",
        });
      }

      const membre = await membreService.updateStatutMembre(id, statut);

      res.status(200).json({
        success: true,
        message: "Statut du membre mis à jour",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/membres/:id/role
   * Modifier le rôle d'un membre
   */
  async updateRoleMembre(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Vérifier les droits d'admin
      if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Vous n'avez pas la permission de modifier le rôle",
        });
      }

      const membre = await membreService.updateRoleMembre(id, role);

      res.status(200).json({
        success: true,
        message: "Rôle du membre mis à jour",
        data: membre,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/stats/dashboard
   * Récupérer les statistiques des membres
   */
  async getStatistiques(req, res, next) {
    try {
      const stats = await membreService.getStatistiques();

      res.status(200).json({
        success: true,
        message: "Statistiques récupérées",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/export
   * Exporter les membres en CSV
   */
  async exportMembresCSV(req, res, next) {
    try {
      const result = await membreService.exportMembresCSV();

      res.download(result.filePath, "membres-export.csv", (err) => {
        if (err && !res.headersSent) {
          next(err);
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/membres/import/csv
   * Importer des membres depuis un CSV
   */
  async importMembresCSV(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Aucun fichier fourni",
        });
      }

      const result = await membreService.importMembresCSV(req.file.path);

      res.status(201).json({
        success: true,
        message: "Membres importés avec succès",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/:id/cotisations
   * Récupérer les cotisations d'un membre
   */
  async getCotisationsMembre(req, res, next) {
    try {
      const { id } = req.params;
      const cotisations = await membreService.getCotisationsMembre(id);

      res.status(200).json({
        success: true,
        message: "Cotisations récupérées",
        data: cotisations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/membres/:id/inscriptions
   * Récupérer les inscriptions à des événements d'un membre
   */
  async getInscriptionsMembre(req, res, next) {
    try {
      const { id } = req.params;
      const inscriptions = await membreService.getInscriptionsMembre(id);

      res.status(200).json({
        success: true,
        message: "Inscriptions récupérées",
        data: inscriptions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MembreController();
