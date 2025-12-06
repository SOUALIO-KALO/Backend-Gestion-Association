# API Membres - Documentation

## 📋 Vue d'ensemble

L'API Membres permet de gérer les membres de l'association avec un système complet de CRUD, pagination, filtres, recherche et export CSV.

## 🔐 Authentification

Toutes les routes nécessitent un token JWT dans le header :
```
Authorization: Bearer <token>
```

## 📍 Endpoints

### 1. Récupérer tous les membres

**GET** `/api/membres`

**Accès** : Admin uniquement

**Query Parameters** :
- `page` (integer, optional) : Numéro de page (défaut: 1)
- `limit` (integer, optional) : Éléments par page (défaut: 25, max: 100)
- `search` (string, optional) : Recherche sur nom, prénom ou email
- `statut` (enum, optional) : ACTIF | INACTIF | BUREAU
- `role` (enum, optional) : ADMIN | MEMBRE
- `sortBy` (string, optional) : nom | prenom | email | dateCreation | dateModification
- `sortOrder` (string, optional) : asc | desc (défaut: desc)

**Exemple de requête** :
```bash
GET /api/membres?page=1&limit=25&search=Jean&statut=ACTIF&sortBy=nom&sortOrder=asc
```

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@email.com",
      "telephone": "0102030405",
      "role": "MEMBRE",
      "statut": "ACTIF",
      "dateCreation": "2024-01-15T10:00:00.000Z",
      "dateModification": "2024-01-15T10:00:00.000Z",
      "_count": {
        "cotisations": 2,
        "inscriptions": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150,
    "totalPages": 6
  }
}
```

---

### 2. Récupérer un membre par ID

**GET** `/api/membres/:id`

**Accès** : Admin ou propriétaire du profil

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@email.com",
    "telephone": "0102030405",
    "role": "MEMBRE",
    "statut": "ACTIF",
    "dateCreation": "2024-01-15T10:00:00.000Z",
    "dateModification": "2024-01-15T10:00:00.000Z",
    "cotisations": [
      {
        "id": "uuid",
        "datePaiement": "2024-01-10T00:00:00.000Z",
        "montant": "50.00",
        "modePaiement": "VIREMENT",
        "dateExpiration": "2025-01-10T00:00:00.000Z",
        "statut": "A_JOUR"
      }
    ],
    "inscriptions": [
      {
        "id": "uuid",
        "dateInscription": "2024-02-01T10:00:00.000Z",
        "statut": "CONFIRMEE",
        "evenement": {
          "id": "uuid",
          "titre": "Assemblée Générale 2024",
          "dateDebut": "2024-03-15T14:00:00.000Z",
          "lieu": "Salle municipale"
        }
      }
    ],
    "_count": {
      "cotisations": 2,
      "inscriptions": 5
    }
  }
}
```

**Erreurs** :
- `404` : Membre non trouvé
- `403` : Accès non autorisé

---

### 3. Récupérer son propre profil

**GET** `/api/membres/me`

**Accès** : Membre connecté

**Réponse** (200 OK) : Identique à GET /api/membres/:id

---

### 4. Créer un nouveau membre

**POST** `/api/membres`

**Accès** : Admin uniquement

**Body** :
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean.dupont@email.com",
  "telephone": "0102030405",
  "motDePasse": "Password123!",
  "role": "MEMBRE",
  "statut": "ACTIF"
}
```

**Validations** :
- `nom` : requis, 2-100 caractères, lettres uniquement
- `prenom` : requis, 2-100 caractères, lettres uniquement
- `email` : requis, format email valide, unique
- `telephone` : optionnel, format téléphone valide
- `motDePasse` : requis, min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
- `role` : optionnel, ADMIN ou MEMBRE (défaut: MEMBRE)
- `statut` : optionnel, ACTIF, INACTIF ou BUREAU (défaut: ACTIF)

**Réponse** (201 Created) :
```json
{
  "success": true,
  "message": "Membre créé avec succès",
  "data": {
    "id": "uuid",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@email.com",
    "telephone": "0102030405",
    "role": "MEMBRE",
    "statut": "ACTIF",
    "dateCreation": "2024-01-15T10:00:00.000Z"
  }
}
```

**Erreurs** :
- `409` : Email déjà utilisé
- `400` : Erreurs de validation

---

### 5. Mettre à jour un membre

**PUT** `/api/membres/:id`

**Accès** : Admin ou propriétaire (restrictions pour propriétaire)

**Body** (tous les champs sont optionnels) :
```json
{
  "nom": "Nouveau nom",
  "prenom": "Nouveau prénom",
  "email": "newemail@email.com",
  "telephone": "0607080910",
  "motDePasse": "NewPassword123!",
  "role": "ADMIN",
  "statut": "BUREAU"
}
```

**Restrictions** :
- Un membre simple ne peut pas modifier son `role` ou `statut`
- Un membre simple ne peut modifier que son propre profil

**Réponse** (200 OK) :
```json
{
  "success": true,
  "message": "Membre mis à jour avec succès",
  "data": {
    "id": "uuid",
    "nom": "Nouveau nom",
    "prenom": "Nouveau prénom",
    "email": "newemail@email.com",
    "telephone": "0607080910",
    "role": "ADMIN",
    "statut": "BUREAU",
    "dateCreation": "2024-01-15T10:00:00.000Z",
    "dateModification": "2024-01-20T15:30:00.000Z"
  }
}
```

**Erreurs** :
- `404` : Membre non trouvé
- `409` : Email déjà utilisé
- `403` : Accès non autorisé

---

### 6. Mettre à jour son propre profil

**PUT** `/api/membres/me`

**Accès** : Membre connecté

**Body** : Identique à PUT /api/membres/:id mais sans `role` et `statut`

---

### 7. Supprimer un membre

**DELETE** `/api/membres/:id`

**Accès** : Admin uniquement

**Réponse** (200 OK) :
```json
{
  "success": true,
  "message": "Membre supprimé avec succès"
}
```

**Erreurs** :
- `404` : Membre non trouvé
- `400` : Impossible de supprimer son propre compte

**Note** : La suppression est en cascade (cotisations et inscriptions sont également supprimées)

---

### 8. Obtenir les statistiques

**GET** `/api/membres/statistiques`

**Accès** : Admin uniquement

**Réponse** (200 OK) :
```json
{
  "success": true,
  "data": {
    "totalMembres": 150,
    "membresActifs": 120,
    "membresInactifs": 20,
    "membresBureau": 10,
    "repartition": {
      "actifs": 120,
      "inactifs": 20,
      "bureau": 10
    },
    "evolution": [
      {
        "mois": "2024-01",
        "total": 15
      },
      {
        "mois": "2024-02",
        "total": 22
      },
      {
        "mois": "2024-03",
        "total": 18
      }
    ]
  }
}
```

---

### 9. Exporter les membres en CSV

**GET** `/api/membres/export`

**Accès** : Admin uniquement

**Query Parameters** :
- `statut` (enum, optional) : ACTIF | INACTIF | BUREAU
- `role` (enum, optional) : ADMIN | MEMBRE
- `search` (string, optional) : Recherche sur nom, prénom ou email

**Exemple** :
```bash
GET /api/membres/export?statut=ACTIF
```

**Réponse** (200 OK) :
- Content-Type: `text/csv`
- Fichier CSV téléchargé avec toutes les données des membres

**Format CSV** :
```csv
ID;Nom;Prénom;Email;Téléphone;Rôle;Statut;Date de création
uuid;Dupont;Jean;jean@email.com;0102030405;MEMBRE;ACTIF;2024-01-15
```

---

## 🔒 Gestion des permissions

| Route | Admin | Membre | Public |
|-------|-------|--------|--------|
| GET /membres | ✅ | ❌ | ❌ |
| GET /membres/:id | ✅ | ✅ (soi-même) | ❌ |
| GET /membres/me | ✅ | ✅ | ❌ |
| POST /membres | ✅ | ❌ | ❌ |
| PUT /membres/:id | ✅ | ✅ (soi-même, limité) | ❌ |
| PUT /membres/me | ✅ | ✅ | ❌ |
| DELETE /membres/:id | ✅ | ❌ | ❌ |
| GET /membres/statistiques | ✅ | ❌ | ❌ |
| GET /membres/export | ✅ | ❌ | ❌ |

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
| 409 | Conflit (email déjà existant) |
| 500 | Erreur serveur |

---

## 📝 Exemples d'utilisation

### Créer un membre avec cURL
```bash
curl -X POST http://localhost:3000/api/membres \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean@test.com",
    "motDePasse": "Password123!",
    "telephone": "0102030405"
  }'
```

### Rechercher des membres avec JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/membres?search=Jean&statut=ACTIF', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
console.log(data.data); // Liste des membres
```

### Exporter en CSV avec axios
```javascript
const response = await axios.get('http://localhost:3000/api/membres/export', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  responseType: 'blob'
});

// Créer un lien de téléchargement
const url = window.URL.createObjectURL(new Blob([response.data]));
const link = document.createElement('a');
link.href = url;
link.setAttribute('download', 'membres.csv');
document.body.appendChild(link);
link.click();
```