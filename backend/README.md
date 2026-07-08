# Backend API — Kadansa

Couche HTTP au-dessus du pipeline Python existant (`cadence-agent/`).
Aucune logique métier ici : chaque endpoint appelle un module déjà codé et
testé (Phases 2 à 9).

## Structure attendue

```
ANALYSE CADENCE/
├── Analyseur des cadences v1/     # projet Python existant, INCHANGÉ
└── backend/                        # ce dossier
    ├── main.py
    ├── state.py
    ├── schemas.py
    └── requirements.txt
```

`backend/` doit être un dossier **frère** de `Analyseur des cadences v1/`
(même niveau), pas à l'intérieur.

## Installation

Deux commandes séparées (le chemin du projet Python contient des espaces,
peu fiable dans une directive `-r` à l'intérieur d'un requirements.txt) :

```powershell
cd backend
pip install -r requirements.txt
pip install -r "..\Analyseur des cadences v1\requirements.txt"
```

## Prérequis avant de lancer

- PostgreSQL démarré (Docker, comme configuré dans `cadence-agent/`)
- `cadence-agent/.env` renseigné (`DB_PASSWORD`, `CADENCE_TRS_API_KEY`)

## Lancement

```powershell
uvicorn main:app --reload --port 8000
```

L'API est alors disponible sur `http://localhost:8000`, avec une
documentation interactive automatique sur `http://localhost:8000/docs`
(pratique pour tester les endpoints sans frontend, à l'aide du bouton
"Try it out" de Swagger).

## Endpoints

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/health` | Vérifie que l'API et la base répondent |
| GET | `/api/stats` | Lignes / produits / machines en base (toujours à jour) |
| GET | `/api/files` | Historique des imports (`import_log`) |
| POST | `/api/upload` | Dépose un `.xlsx` → extraction + qualité + historisation |
| POST | `/api/chat` | `{"message": "..."}` → réponse de l'agent (Phase 9) |

## Comportement à connaître

- **L'agent est mis en cache** au démarrage et **rechargé automatiquement**
  après chaque upload réussi (recalcul des métriques/recommandations/
  anomalies) — pas besoin de redémarrer le serveur.
- Si la base est vide, `/api/chat` répond poliment qu'il faut d'abord
  déposer un export, plutôt que de planter.
- Si `CADENCE_TRS_API_KEY` (clé Mistral) est absente ou invalide, l'agent
  bascule automatiquement en mode mots-clés local (voir Phase 9) — aucun
  crash, juste une réponse moins riche.
- CORS est ouvert pour `http://localhost:5173` (Vite dev server) — à
  élargir plus tard si le frontend tourne ailleurs.

## Ce qui n'est pas encore fait (volontairement, pour rester simple)

- Pas d'authentification (usage interne mono-utilisateur pour l'instant).
- Pas de tâche de fond pour l'upload (traitement synchrone — acceptable au
  volume de données actuel, à revoir si les exports deviennent très gros).
- Pas de mémoire conversationnelle multi-tour côté API (chaque question est
  traitée indépendamment) — à ajouter si le frontend a besoin de garder le
  contexte entre les messages.
