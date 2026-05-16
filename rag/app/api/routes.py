from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, HTTPException

from app.clients import BACKEND_URL, BackendClientError
from app.schemas.api import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.services.retrieval_service import RetrievalService


def create_router(chat_service: ChatService, retrieval_service: RetrievalService) -> APIRouter:
    router = APIRouter()

    @router.get("/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "model": os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
            "backend_url": BACKEND_URL,
        }

    @router.post("/reindex")
    def reindex() -> dict[str, Any]:
        result = retrieval_service.reindex()
        if result.get("status") == "failed":
            raise HTTPException(status_code=500, detail=result.get("error", "Reindex failed"))
        return {"status": "ok", **result}

    @router.post("/chat", response_model=ChatResponse)
    def chat(request: ChatRequest) -> ChatResponse:
        try:
            return chat_service.chat(request)
        except BackendClientError as exc:
            return chat_service.fallback_response(exc)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc

    return router
