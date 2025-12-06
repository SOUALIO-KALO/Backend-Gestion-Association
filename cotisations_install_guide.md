# 🚀 Installation et Test du Module Cotisations

## 📋 Prérequis

- Module Membres déjà installé et fonctionnel ✅
- Node.js 18+ installé
- PostgreSQL configuré
- Base de données à jour avec les migrations

## 📦 Installation

### 1. Installer les dépendances manquantes

```bash
npm install pdfkit date-fns
```

Vérification :
```bash
npm list pdfkit date-fns node-cron
```

### 2. Créer les dossiers nécessaires

```bash
mkdir -p uploads/receipts
mkdir -p src/templates/emails
```

### 3. Mettre à jour .gitignore

Ajoutez si ce n'est pas déjà fait :
```bash
echo "uploads/" >> .gitignore
```

### 4. Copier les fichiers dans votre projet

**Services** :
- `src/services/cotisationService.js` ✅
- `src/services/pdfService.js` ✅

**Controllers** :
- `src/controllers/cotisationController.js` ✅

**Validators** :
- `src/middlewares/validators/cotisationValidator.js` ✅

**Routes** :
- `src/routes/cotisationRoutes.js` ✅

**Utils** :
- `src/utils/cronJobs.js` ✅

**Templates** :
- `src/templates/emails/rappelCotisation.hbs` ✅

**Tests** :
- `tests/integration/cotisations.test.js` ✅

### 5. Activer les routes

Mettez à jour `src/routes/index.js` :
```javascript
router.use("/cotisations", cotisationRoutes); // Décommenter cette ligne
```

### 6. Activer les cron jobs (optionnel)

Dans `server.js`, ajoutez :
```javascript
const cronJobs = require('./src/utils/cronJobs');

// Démarrer les cron jobs en production
if (process.env.NODE_ENV === 'production') {
  cronJobs.startAllJobs();
  console.log('✅ Cron jobs démarrés');
}
```

## 🧪 Tests

### 1. Lancer les tests

```bash
# Tests du module cotisations
npm test -- tests/integration/cotisations.test.js

# Mode watch
npm run test:watch -- tests/integration/cotisations.test.js

# Tous les tests
npm test
```

### Résultats attendus

```
PASS  tests/integration/cotisations.test.js
  Cotisations API
    POST /api/cotisations
      ✓ devrait créer une nouvelle cotisation (Admin)
      ✓ ne devrait pas créer une cotisation avec un membre inexistant
      ✓ ne devrait pas créer une cotisation sans authentification
      ✓ ne devrait pas créer une cotisation en tant que membre simple
      ✓ ne devrait pas créer une cotisation avec des données invalides
      ✓ ne devrait pas créer une cotisation avec une date future
    GET /api/cotisations
      ✓ devrait récupérer toutes les cotisations (Admin)
      ✓ devrait filtrer les cotisations par statut
      ✓ devrait filtrer les cotisations par mode de paiement
      ✓ devrait paginer les résultats
      ✓ ne devrait pas permettre à un membre simple de lister toutes
    GET /api/cotisations/:id
      ✓ devrait récupérer une cotisation par son ID (Admin)
      ✓ devrait permettre à un membre de voir sa propre cotisation
      ✓ devrait retourner 404 pour un ID inexistant
    GET /api/cotisations/membre/:membreId
      ✓ devrait récupérer les cotisations d'un membre (Admin)
      ✓ devrait permettre à un membre de voir ses propres cotisations
      ✓ ne devrait pas permettre à un membre de voir les cotisations d'un autre
    GET /api/cotisations/mes-cotisations
      ✓ devrait récupérer les cotisations de l'utilisateur connecté
    GET /api/cotisations/mon-statut
      ✓ devrait récupérer le statut de cotisation de l'utilisateur
    PUT /api/cotisations/:id
      ✓ devrait mettre à jour une cotisation (Admin)
      ✓ ne devrait pas permettre à un membre de modifier une cotisation
    GET /api/cotisations/statistiques
      ✓ devrait récupérer les statistiques des cotisations (Admin)
      ✓ ne devrait pas permettre à un membre d'accéder aux statistiques
    GET /api/cotisations/alertes
      ✓ devrait récupérer les cotisations proches de l'expiration (Admin)
    GET /api/cotisations/:id/recu
      ✓ devrait générer et télécharger un reçu PDF (Admin)
      ✓ devrait permettre à un membre de télécharger son propre reçu
    POST /api/cotisations/update-statuts
      ✓ devrait mettre à jour les statuts expirés (Admin)
    DELETE /api/cotisations/:id
      ✓ devrait supprimer une cotisation (Admin)
      ✓ ne devrait pas permettre à un membre de supprimer

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

## 🔍 Tests manuels

### 1. Démarrer le serveur

```bash
npm run dev
```

### 2. Se connecter

```bash
# Admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "motDePasse": "Admin123!"}'

# Récupérer le token
```

### 3. Créer une cotisation

```bash
curl -X POST http://localhost:3000/api/cotisations \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membreId": "UUID_DU_MEMBRE",
    "datePaiement": "2024-12-06T00:00:00.000Z",
    "montant": 10000,
    "modePaiement": "VIREMENT",
    "notes": "Cotisation annuelle 2024"
  }'
```

### 4. Lister les cotisations

```bash
curl http://localhost:3000/api/cotisations \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 5. Filtrer par statut

```bash
curl "http://localhost:3000/api/cotisations?statut=A_JOUR&limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 6. Télécharger un reçu PDF

```bash
curl http://localhost:3000/api/cotisations/ID_COTISATION/recu \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -o recu.pdf
```

Vérifiez que le PDF est créé et s'ouvre correctement.

### 7. Obtenir les statistiques

```bash
curl http://localhost:3000/api/cotisations/statistiques \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 8. Vérifier les cotisations expirées

```bash
curl "http://localhost:3000/api/cotisations/alertes?jours=30" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### 9. Tester les cron jobs manuellement

Dans Node.js :
```javascript
const cronJobs = require('./src/utils/cronJobs');

// Mettre à jour les statuts
await cronJobs.runUpdateCotisationsManually();

// Envoyer les rappels
await cronJobs.runRappelsManually(30);
```

## 🐛 Dépannage

### Erreur : "pdfkit not found"

```bash
npm install pdfkit
```

### Erreur : "date-fns not found"

```bash
npm install date-fns
```

### Erreur : "uploads/receipts directory not found"

```bash
mkdir -p uploads/receipts
```

### Les PDF ne se génèrent pas

Vérifiez les permissions :
```bash
chmod -R 755 uploads/
```

### Les cron jobs ne démarrent pas

Vérifiez que `node-cron` est installé :
```bash
npm install node-cron
```

### Erreur dans les tests : "Connection refused"

Assurez-vous que PostgreSQL est démarré et que votre `.env.test` est correct.

### Le template email n'est pas trouvé

Vérifiez que `src/templates/emails/rappelCotisation.hbs` existe.

## ✅ Checklist de vérification

Avant de passer au module suivant :

- [ ] Tous les tests passent (29/29)
- [ ] Vous pouvez créer une cotisation via l'API
- [ ] La date d'expiration est calculée automatiquement (+1 an)
- [ ] Vous pouvez générer et télécharger un reçu PDF
- [ ] Le PDF est correctement formaté et lisible
- [ ] Les statistiques s'affichent correctement
- [ ] Les filtres fonctionnent (statut, mode de paiement, dates)
- [ ] Un membre peut voir ses propres cotisations
- [ ] Un membre ne peut PAS voir les cotisations des autres
- [ ] La pagination fonctionne
- [ ] Les alertes de cotisations proches fonctionnent
- [ ] La mise à jour manuelle des statuts fonctionne
- [ ] Les permissions sont respectées (Admin vs Membre)

## 🔗 Intégration avec le module Membres

Le module Cotisations est déjà intégré avec Membres :

```javascript
// Dans membreService.getMembreById()
include: {
  cotisations: {
    orderBy: { datePaiement: 'desc' },
    take: 5
  }
}
```

Vous pouvez voir les cotisations d'un membre en appelant :
```bash
GET /api/membres/:id
```

## ⏰ Configuration des Cron Jobs

### En développement

Les cron jobs sont désactivés par défaut. Pour les tester :

```javascript
// Dans server.js ou un fichier de test
const cronJobs = require('./src/utils/cronJobs');
cronJobs.startAllJobs();
```

### En production

Les cron jobs démarrent automatiquement si :
```javascript
if (process.env.NODE_ENV === 'production') {
  cronJobs.startAllJobs();
}
```

### Planification

- **Mise à jour statuts** : Quotidien à 2h (Africa/Abidjan)
- **Rappels email** : Hebdomadaire lundi 9h
- **Rapport mensuel** : 1er du mois à 8h

### Modifier les horaires

Éditez `src/utils/cronJobs.js` :
```javascript
// Format cron: minute heure jour mois jour_semaine
cron.schedule('0 2 * * *', async () => { ... });
//            minute ^ ^ ^ ^
//            heure    ^ ^ ^
//            jour     ^ ^
//            mois       ^
//            jour_semaine
```

## 📊 Données de test

Pour générer des cotisations de test :

```javascript
// Via seed ou script
const membres = await prisma.membre.findMany();

for (const membre of membres) {
  await prisma.cotisation.create({
    data: {
      membreId: membre.id,
      datePaiement: new Date('2024-01-15'),
      montant: 10000,
      modePaiement: 'VIREMENT',
      dateExpiration: new Date('2025-01-15'),
      statut: 'A_JOUR'
    }
  });
}
```

## 📈 Prochaines étapes

Module Cotisations complété ! ✅

**Option suivante** :

**Module Événements** 📅
- CRUD événements
- Système d'inscriptions
- Gestion des places
- Notifications email

ou

**Frontend React** 🎨
- Interface d'administration
- Dashboard avec stats
- Gestion visuelle des membres et cotisations

**Que souhaitez-vous développer ensuite ?** 🚀