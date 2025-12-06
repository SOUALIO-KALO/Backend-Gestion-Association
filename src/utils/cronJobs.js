const cron = require("node-cron");
const cotisationService = require("../services/cotisationService");
const emailService = require("../services/emailService");

/**
 * Configuration et gestion des tâches planifiées (Cron Jobs)
 */

/**
 * Tâche quotidienne : Mise à jour des statuts de cotisations expirées
 * Exécutée tous les jours à 2h du matin
 */
const updateCotisationsExpireesJob = cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("[CRON] Début de la mise à jour des cotisations expirées...");

    try {
      const result = await cotisationService.updateStatutsExpires();
      console.log(
        `[CRON] ✅ ${result.count} cotisation(s) mise(s) à jour avec succès`
      );
    } catch (error) {
      console.error(
        "[CRON] ❌ Erreur lors de la mise à jour des cotisations:",
        error
      );
    }
  },
  {
    scheduled: false, // Ne démarre pas automatiquement
    timezone: "Africa/Abidjan",
  }
);

/**
 * Tâche hebdomadaire : Envoi des rappels pour cotisations proches de l'expiration
 * Exécutée tous les lundis à 9h
 */
const envoyerRappelsCotisationsJob = cron.schedule(
  "0 9 * * 1",
  async () => {
    console.log("[CRON] Début de l'envoi des rappels de cotisations...");

    try {
      // Récupérer les cotisations qui expirent dans les 30 jours
      const cotisationsProches =
        await cotisationService.getCotisationsProchesExpiration(30);

      console.log(
        `[CRON] ${cotisationsProches.length} cotisation(s) proche(s) de l'expiration`
      );

      let emailsEnvoyes = 0;
      let emailsEchoues = 0;

      // Envoyer un email de rappel à chaque membre
      for (const cotisation of cotisationsProches) {
        try {
          const joursRestants = Math.ceil(
            (new Date(cotisation.dateExpiration) - new Date()) /
              (1000 * 60 * 60 * 24)
          );

          await emailService.envoyerEmail({
            to: cotisation.membre.email,
            subject: "Rappel : Votre cotisation arrive à expiration",
            template: "rappelCotisation",
            context: {
              prenom: cotisation.membre.prenom,
              nom: cotisation.membre.nom,
              dateExpiration: new Date(
                cotisation.dateExpiration
              ).toLocaleDateString("fr-FR"),
              joursRestants,
              montant: cotisation.montant,
            },
          });

          emailsEnvoyes++;
        } catch (emailError) {
          console.error(
            `[CRON] Erreur envoi email à ${cotisation.membre.email}:`,
            emailError
          );
          emailsEchoues++;
        }
      }

      console.log(
        `[CRON] ✅ ${emailsEnvoyes} email(s) envoyé(s), ${emailsEchoues} échec(s)`
      );
    } catch (error) {
      console.error("[CRON] ❌ Erreur lors de l'envoi des rappels:", error);
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Abidjan",
  }
);

/**
 * Tâche mensuelle : Rapport statistique mensuel
 * Exécutée le 1er de chaque mois à 8h
 */
const genererRapportMensuelJob = cron.schedule(
  "0 8 1 * *",
  async () => {
    console.log("[CRON] Début de la génération du rapport mensuel...");

    try {
      const stats = await cotisationService.getStatistiques();

      // Log des statistiques (peut être envoyé par email aux admins)
      console.log("[CRON] Rapport mensuel généré:");
      console.log(`- Total cotisations: ${stats.totalCotisations}`);
      console.log(`- Cotisations à jour: ${stats.cotisationsAJour}`);
      console.log(`- Cotisations expirées: ${stats.cotisationsExpirees}`);
      console.log(`- Montant total du mois: ${stats.montantTotalMois} FCFA`);

      // TODO: Envoyer le rapport par email aux administrateurs

      console.log("[CRON] ✅ Rapport mensuel généré avec succès");
    } catch (error) {
      console.error(
        "[CRON] ❌ Erreur lors de la génération du rapport:",
        error
      );
    }
  },
  {
    scheduled: false,
    timezone: "Africa/Abidjan",
  }
);

/**
 * Démarrer tous les cron jobs
 */
const startAllJobs = () => {
  console.log("[CRON] Démarrage de tous les jobs planifiés...");

  updateCotisationsExpireesJob.start();
  console.log(
    "[CRON] ✅ Job de mise à jour des cotisations démarré (quotidien à 2h)"
  );

  envoyerRappelsCotisationsJob.start();
  console.log(
    "[CRON] ✅ Job de rappels de cotisations démarré (hebdomadaire le lundi à 9h)"
  );

  genererRapportMensuelJob.start();
  console.log("[CRON] ✅ Job de rapport mensuel démarré (1er du mois à 8h)");

  console.log("[CRON] Tous les jobs sont actifs");
};

/**
 * Arrêter tous les cron jobs
 */
const stopAllJobs = () => {
  console.log("[CRON] Arrêt de tous les jobs planifiés...");

  updateCotisationsExpireesJob.stop();
  envoyerRappelsCotisationsJob.stop();
  genererRapportMensuelJob.stop();

  console.log("[CRON] ✅ Tous les jobs sont arrêtés");
};

/**
 * Exécuter manuellement la mise à jour des cotisations
 */
const runUpdateCotisationsManually = async () => {
  console.log(
    "[MANUAL] Exécution manuelle de la mise à jour des cotisations..."
  );

  try {
    const result = await cotisationService.updateStatutsExpires();
    console.log(`[MANUAL] ✅ ${result.count} cotisation(s) mise(s) à jour`);
    return result;
  } catch (error) {
    console.error("[MANUAL] ❌ Erreur:", error);
    throw error;
  }
};

/**
 * Exécuter manuellement l'envoi des rappels
 */
const runRappelsManually = async (jours = 30) => {
  console.log(
    `[MANUAL] Exécution manuelle de l'envoi des rappels (${jours} jours)...`
  );

  try {
    const cotisationsProches =
      await cotisationService.getCotisationsProchesExpiration(jours);
    console.log(
      `[MANUAL] ${cotisationsProches.length} cotisation(s) proche(s) trouvée(s)`
    );

    let emailsEnvoyes = 0;

    for (const cotisation of cotisationsProches) {
      const joursRestants = Math.ceil(
        (new Date(cotisation.dateExpiration) - new Date()) /
          (1000 * 60 * 60 * 24)
      );

      await emailService.envoyerEmail({
        to: cotisation.membre.email,
        subject: "Rappel : Votre cotisation arrive à expiration",
        template: "rappelCotisation",
        context: {
          prenom: cotisation.membre.prenom,
          nom: cotisation.membre.nom,
          dateExpiration: new Date(
            cotisation.dateExpiration
          ).toLocaleDateString("fr-FR"),
          joursRestants,
          montant: cotisation.montant,
        },
      });

      emailsEnvoyes++;
    }

    console.log(`[MANUAL] ✅ ${emailsEnvoyes} email(s) envoyé(s)`);
    return { sent: emailsEnvoyes, total: cotisationsProches.length };
  } catch (error) {
    console.error("[MANUAL] ❌ Erreur:", error);
    throw error;
  }
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  runUpdateCotisationsManually,
  runRappelsManually,
  // Export des jobs individuels pour tests
  jobs: {
    updateCotisationsExpireesJob,
    envoyerRappelsCotisationsJob,
    genererRapportMensuelJob,
  },
};
