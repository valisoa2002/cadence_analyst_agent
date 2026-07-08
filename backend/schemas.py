"""
Schémas Pydantic — le contrat entre le backend et le frontend.
"""

from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str


class StatsResponse(BaseModel):
    n_rows: int
    n_produits: int
    n_machines: int


class FileLogEntry(BaseModel):
    source_file: str
    imported_at: str
    n_rows_extracted: int
    n_rows_inserted: int
    n_rows_skipped_duplicate: int
    n_bloquant: int
    n_avertissement: int
    n_info: int


class UploadResponse(BaseModel):
    source_file: str
    n_rows_extracted: int
    n_rows_inserted: int
    n_rows_skipped_duplicate: int
    n_bloquant: int
    n_avertissement: int
    n_info: int


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    llm_mode: bool
