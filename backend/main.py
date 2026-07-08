"""
API FastAPI — couche HTTP au-dessus du pipeline Python existant.

Aucune logique métier ici : chaque endpoint appelle un module déjà codé
et testé (Phases 2 à 9). Lancer avec :

    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from schemas import (
    ChatRequest,
    ChatResponse,
    FileLogEntry,
    HealthResponse,
    StatsResponse,
    UploadResponse,
)
from state import state

from src.extract.exceptions import ExtractionError
from src.extract.excel_extractor import ExcelExtractor
from src.load.history_loader import HistoryLoader
from src.load.models import ImportLog
from src.quality.quality_engine import QualityEngine

app = FastAPI(title="Kadansa API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------
# Santé
# ----------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        with state.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {exc}"
    return HealthResponse(status="ok", database=db_status)


# ----------------------------------------------------------------------
# Statistiques (toujours lues fraîches, pas depuis le cache de l'agent)
# ----------------------------------------------------------------------

@app.get("/api/stats", response_model=StatsResponse)
def stats() -> StatsResponse:
    df = state.load_dataframe()
    if df.empty:
        return StatsResponse(n_rows=0, n_produits=0, n_machines=0)
    return StatsResponse(
        n_rows=len(df),
        n_produits=int(df["produit"].nunique()),
        n_machines=int(df["machine"].nunique()),
    )


# ----------------------------------------------------------------------
# Historique des imports
# ----------------------------------------------------------------------

@app.get("/api/files", response_model=list[FileLogEntry])
def files() -> list[FileLogEntry]:
    session = state.SessionLocal()
    try:
        logs = session.query(ImportLog).order_by(ImportLog.imported_at.desc()).limit(50).all()
        return [
            FileLogEntry(
                source_file=log.source_file,
                imported_at=log.imported_at.isoformat() if log.imported_at else "",
                n_rows_extracted=log.n_rows_extracted or 0,
                n_rows_inserted=log.n_rows_inserted or 0,
                n_rows_skipped_duplicate=log.n_rows_skipped_duplicate or 0,
                n_bloquant=log.n_bloquant or 0,
                n_avertissement=log.n_avertissement or 0,
                n_info=log.n_info or 0,
            )
            for log in logs
        ]
    finally:
        session.close()


# ----------------------------------------------------------------------
# Upload — extraction + qualité + historisation, puis rechargement de l'agent
# ----------------------------------------------------------------------

@app.post("/api/upload", response_model=UploadResponse)
async def upload(file: UploadFile = File(...)) -> UploadResponse:
    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(status_code=400, detail="Seuls les fichiers .xlsx/.xlsm sont acceptés.")

    raw_dir = state.config.paths.raw_data_dir
    raw_dir.mkdir(parents=True, exist_ok=True)
    dest_path = raw_dir / file.filename

    content = await file.read()
    dest_path.write_bytes(content)

    extractor = ExcelExtractor(state.config, logger=state.logger)
    try:
        result = extractor.extract(dest_path)
    except ExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    quality_engine = QualityEngine(state.config, logger=state.logger)
    quality_report = quality_engine.run(result.dataframe, source_file=result.source_file.name)

    session = state.SessionLocal()
    try:
        loader = HistoryLoader(logger=state.logger)
        load_result = loader.load(
            session, result.dataframe, quality_report, source_file=result.source_file.name
        )
    except Exception as exc:  # noqa: BLE001
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Échec du chargement en base : {exc}") from exc
    finally:
        session.close()

    # La base a changé : on recharge l'agent (metrics/anomalies/recommandations)
    state.refresh_agent()

    counts = quality_report.count_by_severity()
    return UploadResponse(
        source_file=result.source_file.name,
        n_rows_extracted=load_result.n_rows_extracted,
        n_rows_inserted=load_result.n_rows_inserted,
        n_rows_skipped_duplicate=load_result.n_rows_skipped_duplicate,
        n_bloquant=counts["BLOQUANT"],
        n_avertissement=counts["AVERTISSEMENT"],
        n_info=counts["INFO"],
    )


# ----------------------------------------------------------------------
# Chat — délègue entièrement à CadenceAgent (Phase 9)
# ----------------------------------------------------------------------

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    agent = state.get_agent()
    if agent is None:
        return ChatResponse(
            answer="Aucune donnée en base pour l'instant. Déposez un export Excel avant de me poser des questions.",
            llm_mode=False,
        )

    answer = agent.answer(request.message)
    return ChatResponse(answer=answer, llm_mode=agent.llm_mode)
