# Documentation API Swagger

## 📚 Accéder à la Documentation

Une fois le serveur lancé, accédez à la documentation Swagger à:

### Mode Développement:

```
http://localhost:5000/api/docs
```

### Mode Production:

```
https://api.gestion-associative.com/api/docs
```

## 🚀 Pour Démarrer

### Installation

Tous les packages Swagger sont déjà installés:

```bash
npm install swagger-ui-express swagger-jsdoc
```

### Démarrage du serveur

```bash
# Mode développement avec rechargement automatique
npm run dev

# Mode production
npm start
```

## 📖 Structure de la Documentation

### 1. **Configuration** (`src/config/swagger.js`)

- Définition OpenAPI 3.0.0
- Schémas réutilisables
- Configuration de sécurité

### 2. **Documentation YAML** (`docs/swagger.yaml`)

- Spécification complète de l'API
- Tous les endpoints documentés
- Exemples de requêtes/réponses

### 3. **Intégration dans l'app** (`src/app.js`)

- Route `/api/docs` - Interface Swagger UI
- Route `/api/docs.json` - Spécification JSON

## 🔐 Authentification dans Swagger UI

1. **Se connecter** via `/api/auth/login`
2. **Copier le token** retourné dans la réponse
3. **Cliquer le bouton "Authorize"** en haut à droite
4. **Coller le token** dans le champ `bearerAuth`
5. Tous les endpoints protégés sont maintenant accessibles

## 📝 Endpoints Documentés

### 🔑 **Auth** (`/api/auth/`)

- `POST /register` - Créer un compte
- `POST /login` - Se connecter
- `POST /logout` - Se déconnecter
- `GET /me` - Profil utilisateur
- `POST /refresh-token` - Renouveler le token
- `POST /forgot-password` - Réinitialiser mot de passe
- `POST /reset-password` - Définir nouveau mot de passe
- `PUT /change-password` - Changer mot de passe
- `GET /verify` - Vérifier token

### 👥 **Membres** (`/api/membres/`)

- `GET /` - Lister tous les membres (pagination)
- `POST /` - Créer un membre (Admin)
- `GET /{id}` - Récupérer un membre
- `PUT /{id}` - Mettre à jour (Admin)
- `DELETE /{id}` - Supprimer (Admin)
- `GET /export` - Exporter en CSV (Admin)
- `POST /import` - Importer CSV (Admin)
- `GET /statistiques` - Statistiques (Admin)

### 💰 **Cotisations** (`/api/cotisations/`)

- `GET /` - Lister toutes les cotisations
- `POST /` - Créer une cotisation (Admin)
- `GET /{id}` - Récupérer une cotisation
- `PUT /{id}` - Mettre à jour (Admin)
- `DELETE /{id}` - Supprimer (Admin)
- `GET /membre/{membreId}` - Cotisations d'un membre
- `GET /statistiques` - Statistiques (Admin)
- `GET /generer-pdf/{id}` - Générer reçu PDF (Admin)
- `GET /alertes` - Alertes d'expiration (Admin)

### 📅 **Événements** (`/api/evenements/`)

- `GET /` - Lister tous les événements
- `POST /` - Créer un événement (Admin)
- `GET /{id}` - Récupérer un événement
- `PUT /{id}` - Mettre à jour (Admin)
- `DELETE /{id}` - Supprimer (Admin)

## 🧪 Tester l'API

### Exemple de test Login:

1. **POST** `/api/auth/login`
2. **Body**:

```json
{
  "email": "admin@test.com",
  "motDePasse": "Admin123!"
}
```

3. **Response**:

```json
{
  "success": true,
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "..."
}
```

### Exemple de test GET Membres:

1. **Authoriser** avec le token obtenu
2. **GET** `/api/membres?page=1&limit=10`
3. Voir la liste avec pagination

## 📊 Codes de Réponse

### Succès:

- **200** - Requête réussie
- **201** - Ressource créée
- **204** - Pas de contenu

### Erreurs Client:

- **400** - Erreur de validation
- **401** - Non authentifié
- **403** - Accès refusé (rôle insuffisant)
- **404** - Ressource non trouvée
- **409** - Conflit (ex: email déjà utilisé)

### Erreurs Serveur:

- **500** - Erreur serveur

## 🔧 Modifier la Documentation

Pour ajouter/modifier la documentation:

1. **Si c'est une route JSDoc**: Ajouter commentaires `@swagger` dans les routes
2. **Si c'est la spec complète**: Éditer `docs/swagger.yaml`
3. **Rafraîchir** la page Swagger pour voir les changements

## 📦 Format des Réponses

Toutes les réponses suivent ce format:

```json
{
  "success": true/false,
  "message": "Description du résultat",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  },
  "errors": []
}
```

## 🚨 Notes Importantes

- Les tokens JWT expirent après 1h
- Utiliser `refreshToken` pour obtenir un nouveau token
- Les admins ont accès à plus d'endpoints
- La pagination par défaut est `page=1&limit=10`
- Les emails doivent être uniques
- Les mots de passe doivent respecter les règles de complexité

## 📞 Support

Pour toute question sur l'API:

- 📧 Email: support@gestion-associative.com
- 🐛 Issues: GitHub Issues
- 💬 Discord: Serveur support

---

**Dernière mise à jour**: 2025-12-06
**Version API**: 1.0.0
