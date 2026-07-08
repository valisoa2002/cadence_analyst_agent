"""
État partagé de l'application — un seul endroit qui détient la config, la
connexion DB, et l'instance de CadenceAgent (recalculée après chaque upload).

Volontairement simple (pas de dépendance FastAPI Depends() imbriquée) :
un objet global, protégé par un verrou pour les accès concurrents.
"""

from __future__ import annotations

import os
import sys
import threading
from pathlib import Path


def _locate_cadence_agent_dir() -> Path:
    """
    Localise le dossier du projet Python existant (celui qui contient
    src/, config/, main_load.py...), sans supposer un nom de dossier figé.

    Ordre de recherche :
    1. Variable d'environnement CADENCE_AGENT_PATH (si définie explicitement)
    2. Un sous-dossier frère de backend/ nommé "cadence-agent"
    3. Le dossier PARENT de backend/ lui-même, s'il contient déjà src/
       et config/ directement (structure "à plat", sans sous-dossier dédié)
    """
    backend_dir = Path(__file__).parent
    project_root = backend_dir.parent

    env_path = os.getenv("CADENCE_AGENT_PATH")
    if env_path:
        candidate = Path(env_path)
        if (candidate / "src").is_dir():
            return candidate
        raise RuntimeError(
            f"CADENCE_AGENT_PATH='{env_path}' ne contient pas de dossier 'src/'. Vérifiez le chemin."
        )

    candidate = project_root / "cadence_engine"
    if (candidate / "src").is_dir():
        return candidate

    if (project_root / "src").is_dir() and (project_root / "config").is_dir():
        return project_root

    raise RuntimeError(
        "Impossible de localiser le projet Python (dossier contenant 'src/' et 'config/').\n"
        f"Cherché : '{candidate}' et '{project_root}'.\n"
        "Solution : définissez la variable d'environnement CADENCE_AGENT_PATH avec le bon "
        "chemin absolu, par exemple :\n"
        '  $env:CADENCE_AGENT_PATH = "Y:\\PROJET VALISOA 2026\\ANALYSE CADENCE"'
    )


CADENCE_AGENT_DIR = _locate_cadence_agent_dir()
sys.path.insert(0, str(CADENCE_AGENT_DIR))

from src.agent.agent import CadenceAgent
from src.analytics.db_reader import load_history_dataframe
from src.load.db import get_engine, get_session_factory
from src.load.models import Base
from src.utils.config import load_config
from src.utils.console import setup_console_encoding
from src.utils.logger import setup_logger

setup_console_encoding()


class AppState:
    def __init__(self):
        self.config = load_config(str(CADENCE_AGENT_DIR / "config" / "settings.yaml"))
        self.logger = setup_logger(self.config, name="kadansa_api")
        self.engine = get_engine(self.config)
        self.SessionLocal = get_session_factory(self.engine)
        Base.metadata.create_all(self.engine)

        self.agent: CadenceAgent | None = None
        self._lock = threading.Lock()

        self.refresh_agent()

    def load_dataframe(self):
        session = self.SessionLocal()
        try:
            return load_history_dataframe(session)
        finally:
            session.close()

    def refresh_agent(self) -> None:
        """Recharge tout l'historique et reconstruit l'agent — appelé au
        démarrage et après chaque upload réussi."""
        with self._lock:
            df = self.load_dataframe()
            if df.empty:
                self.logger.info("Base vide — agent non initialisé pour l'instant.")
                self.agent = None
            else:
                self.agent = CadenceAgent(df, self.config, logger=self.logger)
                self.logger.info(
                    f"Agent (re)chargé : {len(df)} lignes, "
                    f"{df['produit'].nunique()} produit(s), {df['machine'].nunique()} machine(s)."
                )

    def get_agent(self) -> CadenceAgent | None:
        with self._lock:
            return self.agent


state = AppState()
