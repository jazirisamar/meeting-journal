# Meeting Journal

Application web permettant d'enregistrer une réunion directement depuis le navigateur (écran + micro), de prendre des notes horodatées en temps réel, puis de retrouver rapidement les moments importants lors du visionnage.

Projet réalisé dans le cadre d'un stage de développement — stack MEAN (MongoDB, Express, Angular, Node.js).

---

## Fonctionnalités

- **Créer une réunion** : titre, description, catégorie, participants (nom + email)
- **Invitation automatique** par email dès la création de la réunion
- **Enregistrement écran + micro** directement depuis le navigateur (API `getDisplayMedia` / `MediaRecorder`)
- **Notes horodatées** prises en direct pendant l'enregistrement
- **Upload vidéo** avec barre de progression
- **Page de détail** : lecteur vidéo, clic sur une note → navigation directe au bon moment
- **Édition / suppression** des notes après coup, pendant la relecture
- **Transcription automatique** de la vidéo (via AssemblyAI)
- **Liste des réunions** avec recherche par titre et filtre par date
- **Modification / suppression** d'une réunion

---

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Angular (standalone components) |
| Backend | Node.js / Express |
| Base de données | MongoDB (Mongoose) |
| Upload de fichiers | Multer (stockage local) |
| Emails | Nodemailer (SMTP Gmail) |
| Transcription | AssemblyAI |

---

## Architecture du projet

```
meeting-journal/
├── backend/
│   ├── controllers/
│   │   └── meetingController.js    # Logique métier (CRUD, upload, notes, transcription)
│   ├── models/
│   │   └── Meeting.js              # Schéma Mongoose (réunion + notes en sous-documents)
│   ├── routes/
│   │   └── meetingRoutes.js        # Déclaration des routes REST
│   ├── middleware/
│   │   └── upload.js               # Configuration Multer
│   ├── services/
│   │   ├── emailService.js         # Envoi des invitations par email
│   │   └── transcriptionService.js # Appel à l'API AssemblyAI
│   ├── uploads/videos/             # Stockage local des fichiers vidéo
│   ├── server.js
│   └── .env                        # Variables d'environnement (non versionné)
│
└── frontend/
    └── src/app/
        ├── components/
        │   ├── meeting-list/       # Page d'accueil (liste, recherche, filtres)
        │   ├── create-meeting/     # Formulaire de création
        │   ├── record-meeting/     # Enregistrement écran/micro + notes
        │   └── meeting-detail/     # Relecture, transcription, gestion des notes
        ├── services/
        │   └── meeting.ts          # Appels HTTP vers l'API backend
        └── models/
            └── meeting.model.ts    # Interfaces TypeScript
```

---

## Installation

### Prérequis

- Node.js (v18 ou supérieur)
- MongoDB installé en local (ou une instance MongoDB Atlas)
- Un compte Gmail avec un mot de passe d'application (pour l'envoi d'emails)
- Une clé API AssemblyAI (offre gratuite disponible)

### 1. Backend

```bash
cd backend
npm install
```

Crée un fichier `.env` à la racine de `backend/` :

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/meeting-journal
EMAIL_USER=ton.adresse@gmail.com
EMAIL_PASSWORD=mot_de_passe_application_16_caracteres
ASSEMBLYAI_API_KEY=ta_cle_api_assemblyai
```

Lance le serveur :

```bash
npm run dev
```

Le backend démarre sur `http://localhost:5000`.

### 2. Frontend

```bash
cd frontend
npm install
ng serve
```

L'application est accessible sur `http://localhost:4200`.

---

## API — Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/meetings` | Liste des réunions (paramètres `search`, `date`) |
| GET | `/api/meetings/:id` | Détail d'une réunion |
| POST | `/api/meetings` | Créer une réunion (envoie les invitations) |
| PUT | `/api/meetings/:id` | Modifier une réunion |
| DELETE | `/api/meetings/:id` | Supprimer une réunion |
| POST | `/api/meetings/:id/upload` | Upload de la vidéo + notes + durée |
| POST | `/api/meetings/:id/notes` | Ajouter une note |
| PUT | `/api/meetings/:id/notes/:noteId` | Modifier une note |
| DELETE | `/api/meetings/:id/notes/:noteId` | Supprimer une note |
| POST | `/api/meetings/:id/transcribe` | Lancer la transcription (asynchrone) |

---

## Points techniques notables

- **Capture écran + micro** : combinaison de deux flux (`getDisplayMedia` pour l'écran, `getUserMedia` pour le micro) fusionnés en un seul `MediaStream`, puis encodés avec `MediaRecorder` au format WebM (VP8/Opus).
- **Notes en sous-documents Mongoose** : les notes sont stockées directement dans le document `Meeting` (pas de collection séparée), car elles n'existent jamais indépendamment de leur réunion.
- **Upload avec suivi de progression** : utilisation de `HttpRequest` avec `reportProgress: true` côté Angular pour afficher une barre de progression en temps réel sur un gros fichier vidéo.
- **Transcription asynchrone** : la requête de transcription répond immédiatement (statut `pending`), le traitement se fait en arrière-plan, et le frontend interroge périodiquement (polling) l'état de la réunion jusqu'à ce que la transcription soit terminée.

---

## Limitations connues

- Le stockage vidéo est local (dossier `uploads/videos`) — non adapté à un déploiement en production à grande échelle (prévoir un stockage cloud type S3 pour la suite).
- La capture d'écran nécessite un navigateur compatible (Chrome, Edge, Firefox récents) — non supportée sur Safari.
- L'identification des intervenants dans la transcription n'est pas implémentée (fonctionnalité optionnelle du cahier des charges).
