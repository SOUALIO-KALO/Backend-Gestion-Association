# 🚀 Installation et Test du Module Membres

## 📋 Prérequis

- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution
- Votre base de données configurée dans `.env`

## 📦 Installation

### 1. Vérifier les dépendances

Assurez-vous que toutes les dépendances sont installées :

```bash
npm install
```

Si la dépendance `csv-writer` n'est pas installée :
```bash
npm install csv-writer
```

### 2. Créer le dossier uploads

Le module Membres génère des fichiers CSV temporaires :

```bash
mkdir -p uploads
```

Ajoutez également `uploads/` à votre `.gitignore` :
```bash
echo "uploads/" >> .gitignore
```

### 3. Vérifier la configuration Prisma

Assurez-vous que votre schéma Prisma est à jour :

```bash
npm run prisma:generate
```

Si vous avez besoin de recréer la base de données :
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Remplacer les fichiers

Copiez les fichiers générés dans votre projet :

**Services** :
- `src/services/membreService.js` ✅

**Controllers** :
- `src/controllers/membreController.js` ✅

**Validators** :
- `src/middlewares/validators/membreValidator.js` ✅

**Routes** :
- `src/routes/membreRoutes.js` ✅
- `src/routes/index.js` ✅ (décommenter la ligne des membres)

**Tests** :
- `tests/integration/membres.test.js` ✅

### 5. Mettre à jour `src/routes/index.js`

Décommentez la ligne suivante :
```javascript
router.use("/membres", membreRoutes);
```

## 🧪 Tests

### 1. Lancer tous les tests du module Membres

```bash
npm test -- tests/integration/membres.test.js
```

### 2. Lancer les tests en mode watch

```bash
npm run test:watch -- tests/integration/membres.test.js
```

### 3. Lancer tous les tests avec couverture

```bash
npm test
```

### Résultats attendus

Tous les tests doivent passer (✅) :

```
PASS  tests/integration/membres.test.js
  Membres API
    POST /api/membres
      ✓ devrait créer un nouveau membre (Admin)
      ✓ ne devrait pas créer un membre avec un email existant
      ✓ ne devrait pas créer un membre sans authentification
      ✓ ne devrait pas créer un membre en tant que membre simple
      ✓ ne devrait pas créer un membre avec des données invalides
    GET /api/membres
      ✓ devrait récupérer tous les membres (Admin)
      ✓ devrait filtrer les membres par statut
      ✓ devrait rechercher des membres
      ✓ devrait paginer les résultats
      ✓ ne devrait pas permettre à un membre simple de lister tous les membres
    GET /api/membres/:id
      ✓ devrait récupérer un membre par son ID (Admin)
      ✓ devrait permettre à un membre de voir son propre profil
      ✓ ne devrait pas permettre à un membre de voir un autre profil
      ✓ devrait retourner 404 pour un ID inexistant
    GET /api/membres/me
      ✓ devrait récupérer le profil de l'utilisateur connecté
    PUT /api/membres/:id
      ✓ devrait mettre à jour un membre (Admin)
      ✓ devrait permettre à un membre de modifier son propre profil
      ✓ ne devrait pas permettre à un membre de modifier son rôle
      ✓ ne devrait pas permettre à un membre de modifier un autre profil
    GET /api/membres/statistiques
      ✓ devrait récupérer les statistiques des membres (Admin)
      ✓ ne devrait pas permettre à un membre simple d'accéder aux statistiques
    GET /api/membres/export
      ✓ devrait exporter les membres en CSV (Admin)
      ✓ ne devrait pas permettre à un membre simple d'exporter
    DELETE /api/membres/:id
      ✓ ne devrait pas permettre à un admin de se supprimer lui-même
      ✓ devrait supprimer un membre (Admin)
      ✓ ne devrait pas permettre à un membre simple de supprimer

Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
```

## 🔍 Tests manuels avec un client HTTP

### 1. Démarrer le serveur

```bash
npm run dev
```

### 2. Tester avec Postman, Insomnia ou cURL

#### Se connecter en tant qu'Admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "motDePasse": "Admin123!"
  }'
```

Récupérez le `token` dans la réponse.

#### Créer un membre

```bash
curl -X POST http://localhost:3000/api/membres \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Kouassi",
    "prenom": "Adjoua",
    "email": "adjoua.kouassi@test.com",
    "telephone": "0707080910",
    "motDePasse": "Password123!"
  }'
```

#### Lister tous les membres

```bash
curl http://localhost:3000/api/membres \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Rechercher des membres

```bash
curl "http://localhost:3000/api/membres?search=Kouassi&statut=ACTIF" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Obtenir les statistiques

```bash
curl http://localhost:3000/api/membres/statistiques \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

#### Exporter en CSV

```bash
curl http://localhost:3000/api/membres/export \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -o membres.csv
```

#### Mettre à jour un membre

```bash
curl -X PUT http://localhost:3000/api/membres/ID_DU_MEMBRE \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telephone": "0123456789",
    "statut": "BUREAU"
  }'
```

#### Supprimer un membre

```bash
curl -X DELETE http://localhost:3000/api/membres/ID_DU_MEMBRE \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## 🐛 Dépannage

### Erreur : "csv-writer not found"

```bash
npm install csv-writer
```

### Erreur : "Cannot find module './membreRoutes'"

Assurez-vous que le fichier `src/routes/membreRoutes.js` existe et est bien nommé.

### Erreur : "uploads directory not found"

```bash
mkdir uploads
```

### Les tests échouent avec "Connection refused"

Vérifiez que PostgreSQL est démarré et que votre `.env` est correct :

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/gestion_associative_test"
```

### Erreur : "Email already exists"

C'est normal si vous testez plusieurs fois. Utilisez un autre email ou nettoyez la base de test :

```bash
npx prisma migrate reset
npm run prisma:seed
```

## ✅ Checklist de vérification

Avant de passer au module suivant, vérifiez que :

- [ ] Tous les tests passent
- [ ] Vous pouvez créer un membre via l'API
- [ ] Vous pouvez lister les membres avec pagination
- [ ] La recherche fonctionne correctement
- [ ] Les filtres (statut, rôle) fonctionnent
- [ ] L'export CSV fonctionne
- [ ] Les statistiques s'affichent correctement
- [ ] Les permissions sont respectées (Admin vs Membre)
- [ ] Un membre peut voir/modifier son propre profil uniquement

## 📊 Prochaines étapes

Une fois le module Membres validé, vous pouvez passer à :

1. **Module Cotisations** : Gestion des paiements avec génération de PDF
2. **Module Événements** : Gestion des événements et inscriptions
3. **Frontend React** : Interface utilisateur complète

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du serveur
2. Consultez la documentation API
3. Relancez les tests pour identifier le problème
4. Vérifiez que tous les fichiers sont au bon endroit

---

**Module Membres complété ! 🎉**