from __future__ import annotations

from typing import Any

from app.core.config import settings
from app.core.services import RAGPipeline


class RetrievalService:
    def __init__(self, pipeline: RAGPipeline | None = None) -> None:
        self.pipeline = pipeline or RAGPipeline()

    def reindex(self) -> dict[str, Any]:
        return self.pipeline.ingest_directory(str(settings.KNOWLEDGE_DIR))

    def search(self, query: str) -> list[dict[str, Any]]:
        return self.pipeline.search(query, top_k=settings.TOP_K)
