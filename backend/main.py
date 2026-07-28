"""
API FastAPI — couche HTTP au-dessus du pipeline Python existant.

Aucune logique métier ici : chaque endpoint appelle un module déjà codé
et testé (Phases 2 à 9). Lancer avec :

    uvicorn main:app --reload --port 8000

AJOUTS de cette version (par rapport à la précédente) :
- POST /api/chat renvoie maintenant un champ `table` optionnel (tableau
  structuré des recommandations correspondant à la question posée), en
  plus du texte habituel `answer`. Rien d'existant n'est modifié : si
  aucun produit/machine n'est identifié dans la question, `table` est
  simplement `None`, comme avant cet ajout.
- GET /api/export/recommendations.xlsx : télécharge un classeur Excel de
  toutes les recommandations (ou filtré par produit/machine en query
  params), pour usage hors-ligne par l'atelier.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import text

from export import build_recommendations_workbook
from schemas import (
    ChatRequest,
    ChatResponse,
    FileLogEntry,
    HealthResponse,
    StatsResponse,
    UploadResponse,
)
from state import state
from tables import build_recommendation_table

from src.extract.exceptions import ExtractionError
from src.extract.excel_extractor import ExcelExtractor
from src.load.history_loader import HistoryLoader
from src.load.models import ImportLog
from src.quality.quality_engine import QualityEngine

app = FastAPI(title="Kadansa API", version="0.2.0")

_default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
_env_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
allow_origins = _default_origins + _env_origins

_default_preview_regex = r"^https://factory-ai-agents-frontend(-[a-z0-9]+)*(-valisoa)?\.vercel\.app$"
allow_origin_regex = os.getenv("VERCEL_PREVIEW_REGEX", _default_preview_regex)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    try:
        with state.engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:  # noqa: BLE001
        db_status = f"error: {exc}"
    return HealthResponse(status="ok", database=db_status)


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


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    agent = state.get_agent()
    if agent is None:
        return ChatResponse(
            answer="Aucune donnée en base pour l'instant. Déposez un export Excel avant de me poser des questions.",
            llm_mode=False,
            table=None,
        )

    answer = agent.answer(request.message)
    table = build_recommendation_table(agent, request.message)

    return ChatResponse(answer=answer, llm_mode=agent.llm_mode, table=table)


@app.get("/api/export/recommendations.xlsx")
def export_recommendations(
    produit: str | None = Query(default=None, description="Filtrer par produit (code ou libellé)"),
    machine: str | None = Query(default=None, description="Filtrer par machine"),
):
    agent = state.get_agent()
    if agent is None:
        raise HTTPException(status_code=404, detail="Aucune donnée en base pour générer un export.")

    recommendations = agent.recommendations
    if produit:
        recommendations = [r for r in recommendations if produit.lower() in r.produit.lower()]
    if machine:
        recommendations = [r for r in recommendations if machine.lower() in r.machine.lower()]

    if not recommendations:
        raise HTTPException(status_code=404, detail="Aucune recommandation ne correspond aux filtres donnés.")

    content = build_recommendations_workbook(recommendations)
    filename = "recommandations_cadences.xlsx"

    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )