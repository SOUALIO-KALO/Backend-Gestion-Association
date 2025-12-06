# API Cotisations - Documentation Complète

## 📋 Vue d'ensemble

L'API Cotisations permet de gérer les cotisations des membres avec :
- CRUD complet
- Calcul automatique de la date d'expiration (1 an)
- Génération de reçus PDF
- Statistiques et alertes
- Mise à jour automatique des statuts (cron jobs)

## 🔐 Authentification

Toutes les routes nécessitent un token JWT :
```
Authorization: Bearer <token>
```

## 📍 Endpoints

### 1. Récupérer toutes les cotisations

**GET** `/api/cotisations`

**Accès** : Admin uniquement

**Query Parameters** :
- `page` (integer, optional) : Numéro de page (défaut: 1)
- `limit` (integer, optional) : Éléments par page (défaut: 25, max: 100)
- `statut` (enum, optional) : A_JOUR | EXPIRE | EN_ATTENTE
- `membreId` (uuid, optional) : Filtrer par membre
- `modePaiement` (enum, optional) : ESPECES | CHEQUE | VIREMENT | CARTE_BANCAIRE
- `dateDebut` (ISO date, optional) : Date de début de paiement
- `dateFin` (ISO date, optional) : Date de fin de paiement
- `sortBy` (string, optional) : datePaiement | montant | dateExpiration | dateCreation
- `sortOrder` (string, optional) : asc | desc (défaut: desc)

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "membreId": "uuid",
      "datePaiement": "2024-01-15T00:00:00.000Z",
      "montant": "10000.00",
      "modePaiement": "VIREMENT",
      "dateExpiration": "2025-01-15T00:00:00.000Z",
      "statut": "A_JOUR",
      "reference": "uuid",
      "notes": "Paiement annuel",
      "membre": {
        "id": "uuid",
        "nom": "Dupont",
        "prenom": "Jean",
        "email": "jean@email.com",
        "statut": "ACTIF"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 50,
    "totalPages": 2
  }
}
```

---

### 2. Récupérer une cotisation par ID

**GET** `/api/cotisations/:id`

**Accès** : Admin ou propriétaire

**Réponse** (200 OK) : Même structure qu'une cotisation ci-dessus avec tous les détails du membre

---

### 3. Récupérer les cotisations d'un membre

**GET** `/api/cotisations/membre/:membreId`

**Accès** : Admin ou propriétaire

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": [/* Liste des cotisations */]
}
```

---

### 4. Créer une nouvelle cotisation

**POST** `/api/cotisations`

**Accès** : Admin uniquement

**Body** :
```json
{
  "membreId": "uuid",
  "datePaiement": "2024-12-06T00:00:00.000Z",
  "montant": 10000,
  "modePaiement": "VIREMENT",
  "notes": "Paiement par virement bancaire"
}
```

**Validations** :
- `membreId` : requis, UUID valide, membre existant
- `datePaiement` : requis, format ISO 8601, max aujourd'hui, min 1 an
- `montant` : requis, > 0, max 1 000 000 FCFA
- `modePaiement` : requis, enum valide
- `notes` : optionnel, max 500 caractères

**Logique automatique** :
- `dateExpiration` = datePaiement + 1 an
- `statut` = A_JOUR (si date exp > aujourd'hui) ou EXPIRE
- `reference` = UUID généré automatiquement

**Réponse** (201 Created) :
```json
{
  "success": true,
  "message": "Cotisation créée avec succès",
  "data": {
    "id": "uuid",
    "membreId": "uuid",
    "datePaiement": "2024-12-06T00:00:00.000Z",
    "montant": "10000.00",
    "modePaiement": "VIREMENT",
    "dateExpiration": "2025-12-06T00:00:00.000Z",
    "statut": "A_JOUR",
    "reference": "auto-generated-uuid",
    "membre": {/* infos membre */}
  }
}
```

---

### 5. Mettre à jour une cotisation

**PUT** `/api/cotisations/:id`

**Accès** : Admin uniquement

**Body** (tous les champs optionnels) :
```json
{
  "datePaiement": "2024-12-06T00:00:00.000Z",
  "montant": 15000,
  "modePaiement": "ESPECES",
  "statut": "A_JOUR",
  "notes": "Montant mis à jour"
}
```

**Note** : Si `datePaiement` est modifié, `dateExpiration` est recalculée automatiquement

---

### 6. Supprimer une cotisation

**DELETE** `/api/cotisations/:id`

**Accès** : Admin uniquement

**Réponse** (200 OK) :
```json
{
  "success": true,
  "message": "Cotisation supprimée avec succès"
}
```

---

### 7. Récupérer les cotisations expirées

**GET** `/api/cotisations/expirees`

**Accès** : Admin uniquement

**Query Parameters** :
- `jours` (integer, optional) : Nombre de jours (0 = déjà expirées, 30 = expire dans 30j)

**Exemple** :
```bash
GET /api/cotisations/expirees?jours=0  # Cotisations déjà expirées
GET /api/cotisations/expirees?jours=7  # Expire dans 7 jours ou moins
```

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": [/* Liste des cotisations expirées/proches */],
  "count": 15
}
```

---

### 8. Récupérer les alertes de cotisations

**GET** `/api/cotisations/alertes`

**Accès** : Admin uniquement

**Query Parameters** :
- `jours` (integer, optional, default: 30) : Cotisations expirant dans X jours

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": [/* Cotisations proches expiration */],
  "count": 8,
  "periode": "30 jours"
}
```

---

### 9. Mettre à jour les statuts expirés

**POST** `/api/cotisations/update-statuts`

**Accès** : Admin uniquement

Met à jour automatiquement le statut de toutes les cotisations dont la date d'expiration est dépassée.

**Réponse** (200 OK) :
```json
{
  "success": true,
  "message": "5 cotisation(s) mise(s) à jour",
  "count": 5
}
```

**Note** : Cette route est aussi appelée automatiquement par un cron job quotidien à 2h.

---

### 10. Obtenir les statistiques

**GET** `/api/cotisations/statistiques`

**Accès** : Admin uniquement

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": {
    "totalCotisations": 150,
    "cotisationsAJour": 120,
    "cotisationsExpirees": 25,
    "cotisationsEnAttente": 5,
    "cotisationsMoisCourant": 12,
    "montantTotalMois": 120000,
    "repartition": {
      "aJour": 120,
      "expirees": 25,
      "enAttente": 5
    },
    "repartitionModePaiement": [
      { "modePaiement": "VIREMENT", "count": 80 },
      { "modePaiement": "ESPECES", "count": 40 },
      { "modePaiement": "CHEQUE", "count": 20 },
      { "modePaiement": "CARTE_BANCAIRE", "count": 10 }
    ],
    "evolution": [
      { "mois": "2024-07", "total": 15, "montant_total": 150000 },
      { "mois": "2024-08", "total": 22, "montant_total": 220000 },
      { "mois": "2024-09", "total": 18, "montant_total": 180000 }
    ]
  }
}
```

---

### 11. Vérifier le statut de cotisation d'un membre

**GET** `/api/cotisations/statut/:membreId`

**Accès** : Admin ou propriétaire

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": {
    "statut": "A_JOUR",
    "message": "Cotisation à jour",
    "cotisation": {
      "id": "uuid",
      "datePaiement": "2024-06-15T00:00:00.000Z",
      "dateExpiration": "2025-06-15T00:00:00.000Z",
      "montant": "10000.00"
    },
    "joursRestants": 190
  }
}
```

**Statuts possibles** :
- `AUCUNE_COTISATION` : Aucune cotisation enregistrée
- `A_JOUR` : Cotisation valide
- `EXPIRE` : Cotisation expirée

---

### 12. Générer un reçu PDF

**GET** `/api/cotisations/:id/recu`

**Accès** : Admin ou propriétaire

**Réponse** (200 OK) :
- Content-Type: `application/pdf`
- Fichier PDF téléchargé automatiquement

**Le reçu contient** :
- Informations de l'association
- Informations du membre
- Détails de la cotisation
- Montant payé
- Mode de paiement
- Date de génération
- Zone de signature

---

### 13. Récupérer mes cotisations

**GET** `/api/cotisations/mes-cotisations`

**Accès** : Membre connecté

Récupère toutes les cotisations de l'utilisateur connecté.

---

### 14. Récupérer mon statut

**GET** `/api/cotisations/mon-statut`

**Accès** : Membre connecté

Récupère le statut de cotisation de l'utilisateur connecté (identique à `/statut/:membreId` mais pour soi-même).

---

## 🔒 Matrice des permissions

| Endpoint | Admin | Membre | Note |
|----------|-------|--------|------|
| GET /cotisations | ✅ | ❌ | Liste complète |
| GET /cotisations/:id | ✅ | ✅* | *Soi-même uniquement |
| GET /membre/:membreId | ✅ | ✅* | *Soi-même uniquement |
| GET /mes-cotisations | ✅ | ✅ | Ses cotisations |
| GET /mon-statut | ✅ | ✅ | Son statut |
| POST /cotisations | ✅ | ❌ | Création |
| PUT /cotisations/:id | ✅ | ❌ | Modification |
| DELETE /cotisations/:id | ✅ | ❌ | Suppression |
| GET /statistiques | ✅ | ❌ | Stats globales |
| GET /expirees | ✅ | ❌ | Alertes |
| GET /alertes | ✅ | ❌ | Alertes |
| POST /update-statuts | ✅ | ❌ | Cron manual |
| GET /statut/:membreId | ✅ | ✅* | *Soi-même uniquement |
| GET /:id/recu | ✅ | ✅* | *Son reçu uniquement |

---

## ⏰ Tâches planifiées (Cron Jobs)

### 1. Mise à jour des statuts expirés
- **Fréquence** : Quotidienne à 2h du matin
- **Action** : Met à jour le statut des cotisations dont `dateExpiration < aujourd'hui`
- **Timezone** : Africa/Abidjan

### 2. Envoi des rappels de cotisations
- **Fréquence** : Hebdomadaire (lundis à 9h)
- **Action** : Envoie un email de rappel aux membres dont la cotisation expire dans 30 jours
- **Template** : `rappelCotisation.hbs`

### 3. Rapport mensuel
- **Fréquence** : Mensuelle (1er du mois à 8h)
- **Action** : Génère un rapport statistique du mois écoulé
- **Note** : Actuellement en log, peut être envoyé par email aux admins

### Démarrage manuel des cron jobs
```javascript
const cronJobs = require('./utils/cronJobs');
cronJobs.startAllJobs();
```

---

## 📊 Exemples d'utilisation

### Créer une cotisation
```bash
curl -X POST http://localhost:3000/api/cotisations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membreId": "uuid-du-membre",
    "datePaiement": "2024-12-06T00:00:00.000Z",
    "montant": 10000,
    "modePaiement": "VIREMENT",
    "notes": "Paiement annuel 2024"
  }'
```

### Télécharger un reçu PDF
```javascript
const response = await axios.get(
  `http://localhost:3000/api/cotisations/${cotisationId}/recu`,
  {
    headers: { 'Authorization': `Bearer ${token}` },
    responseType: 'blob'
  }
);

const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'recu.pdf');
document.body.appendChild(link);
link.click();
```

### Récupérer les cotisations expirant dans 30 jours
```bash
curl http://localhost:3000/api/cotisations/alertes?jours=30 \
  -H "Authorization: Bearer TOKEN"
```

---

## 💡 Logique métier

### Calcul automatique de la date d'expiration
```
dateExpiration = datePaiement + 1 an
```

### Détermination du statut
```
SI dateExpiration > aujourd'hui
  ALORS statut = A_JOUR
SINON
  statut = EXPIRE
```

### Mise à jour automatique des statuts
Un cron job vérifie quotidiennement toutes les cotisations et met à jour leur statut si nécessaire.

---

## ⚠️ Codes d'erreur

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Erreur de validation |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

---

## 🎨 Génération de reçus PDF

Les reçus PDF générés contiennent :
- **En-tête** : Logo et coordonnées de l'association
- **Titre** : "REÇU DE COTISATION" avec référence
- **Informations membre** : Nom, email, téléphone
- **Détails cotisation** : Dates, période de validité, statut
- **Montant** : Mis en valeur dans un cadre coloré
- **Mode de paiement** : Clairement indiqué
- **Notes** : Si présentes
- **Pied de page** : Date de génération, mentions légales
- **Zone de signature** : Pour le trésorier

---

## 📈 Performance

- Liste paginée : < 100ms
- Détails cotisation : < 50ms
- Création/Modification : < 200ms
- Génération PDF : < 1s
- Statistiques : < 150ms