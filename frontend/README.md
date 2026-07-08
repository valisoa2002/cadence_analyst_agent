# Frontend — Kadansa

Interface React (Vite + TypeScript + Tailwind + DaisyUI) pour l'agent
d'analyse des cadences. Consomme l'API FastAPI du dossier `backend/`.

## Structure attendue

```
ANALYSE CADENCE/
├── Analyseur des cadences v1/   # projet Python (inchangé)
├── backend/                       # API FastAPI
└── frontend/                      # ce dossier
```

## Installation

```powershell
cd frontend
npm install
```

## Configuration

Par défaut, le frontend appelle `http://localhost:8000` (le backend). Si
besoin de changer ça, copiez `.env.example` vers `.env.local` et modifiez
`VITE_API_BASE`.

## Lancement (développement)

**Le backend doit déjà tourner** (`uvicorn main:app --reload --port 8000`
dans `backend/`), sinon les stats/fichiers/chat afficheront des erreurs de
connexion.

```powershell
npm run dev
```

Ouvrez `http://localhost:5173`.

## Build de production

```powershell
npm run build
npm run preview   # pour tester le build localement
```

## Ce qui est implémenté

- **Thème clair/sombre** (`kadansaLight` / `kadansaDark`), persistant via
  `localStorage`, avec la palette exacte fournie (voir `tailwind.config.js`).
- **Sidebar** : statistiques en direct (`GET /api/stats`), dépôt de fichier
  Excel par glisser-déposer ou clic (`POST /api/upload`), liste des imports
  récents avec badges de statut qualité (`GET /api/files`).
- **Chat** : conversation avec l'agent (`POST /api/chat`), rendu markdown
  minimal (gras, listes), chips de suggestions pour démarrer, auto-scroll.
- Après un upload réussi, les stats/fichiers se rafraîchissent automatiquement
  (l'agent backend se recharge de son côté, voir `backend/state.py`).

## Ce qui n'est PAS encore fait (volontairement, pour rester simple)

- Le composant "fiche technique" (tampon Fiable/À vérifier, métriques
  alignées) du prototype visuel initial **n'est pas encore branché** — le
  backend renvoie actuellement du texte déjà formulé par l'agent, pas des
  données structurées. Les réponses s'affichent donc en bulles de texte
  stylées (avec rendu du gras), pas en fiches interactives. À ajouter plus
  tard si besoin, en enrichissant `ChatResponse` côté backend.
- Pas de mémoire conversationnelle multi-tour narrative dans l'UI (chaque
  message est envoyé indépendamment, comme côté backend).
- Pas de gestion d'erreur réseau avancée (retry, offline) — un message
  d'erreur simple s'affiche dans le chat en cas d'échec.
