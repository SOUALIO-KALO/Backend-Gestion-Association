-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBRE');

-- CreateEnum
CREATE TYPE "StatutMembre" AS ENUM ('ACTIF', 'INACTIF', 'BUREAU');

-- CreateEnum
CREATE TYPE "StatutCotisation" AS ENUM ('A_JOUR', 'EXPIRE', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'CHEQUE', 'VIREMENT', 'CARTE_BANCAIRE');

-- CreateEnum
CREATE TYPE "StatutInscription" AS ENUM ('CONFIRMEE', 'ANNULEE', 'EN_ATTENTE');

-- CreateTable
CREATE TABLE "membres" (
    "id" TEXT NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telephone" VARCHAR(20),
    "mot_de_passe" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBRE',
    "statut" "StatutMembre" NOT NULL DEFAULT 'ACTIF',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,
    "reset_token" TEXT,
    "reset_token_expiration" TIMESTAMP(3),

    CONSTRAINT "membres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotisations" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "mode_paiement" "ModePaiement" NOT NULL,
    "date_expiration" TIMESTAMP(3) NOT NULL,
    "statut" "StatutCotisation" NOT NULL DEFAULT 'EN_ATTENTE',
    "reference" TEXT NOT NULL,
    "notes" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotisations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" TEXT NOT NULL,
    "titre" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3),
    "lieu" VARCHAR(255) NOT NULL,
    "places_total" INTEGER NOT NULL,
    "places_restantes" INTEGER NOT NULL,
    "createur_id" TEXT NOT NULL,
    "est_publie" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "membre_id" TEXT NOT NULL,
    "evenement_id" TEXT NOT NULL,
    "date_inscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutInscription" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "date_modification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membres_email_key" ON "membres"("email");

-- CreateIndex
CREATE INDEX "membres_email_idx" ON "membres"("email");

-- CreateIndex
CREATE INDEX "membres_statut_idx" ON "membres"("statut");

-- CreateIndex
CREATE INDEX "membres_date_creation_idx" ON "membres"("date_creation");

-- CreateIndex
CREATE UNIQUE INDEX "cotisations_reference_key" ON "cotisations"("reference");

-- CreateIndex
CREATE INDEX "cotisations_membre_id_idx" ON "cotisations"("membre_id");

-- CreateIndex
CREATE INDEX "cotisations_date_expiration_idx" ON "cotisations"("date_expiration");

-- CreateIndex
CREATE INDEX "cotisations_statut_idx" ON "cotisations"("statut");

-- CreateIndex
CREATE INDEX "cotisations_date_paiement_idx" ON "cotisations"("date_paiement");

-- CreateIndex
CREATE INDEX "evenements_date_debut_idx" ON "evenements"("date_debut");

-- CreateIndex
CREATE INDEX "evenements_createur_id_idx" ON "evenements"("createur_id");

-- CreateIndex
CREATE INDEX "evenements_est_publie_idx" ON "evenements"("est_publie");

-- CreateIndex
CREATE INDEX "inscriptions_membre_id_idx" ON "inscriptions"("membre_id");

-- CreateIndex
CREATE INDEX "inscriptions_evenement_id_idx" ON "inscriptions"("evenement_id");

-- CreateIndex
CREATE INDEX "inscriptions_statut_idx" ON "inscriptions"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_membre_id_evenement_id_key" ON "inscriptions"("membre_id", "evenement_id");

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_createur_id_fkey" FOREIGN KEY ("createur_id") REFERENCES "membres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_membre_id_fkey" FOREIGN KEY ("membre_id") REFERENCES "membres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_evenement_id_fkey" FOREIGN KEY ("evenement_id") REFERENCES "evenements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
