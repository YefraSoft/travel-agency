from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import create_router
from app.clients import BackendClient
from app.services import ChatService, LLMService, RetrievalService

backend = BackendClient()
retrieval_service = RetrievalService()
llm_service = LLMService()
chat_service = ChatService(backend, retrieval_service, llm_service)

app = FastAPI(title="Travel Agency RAG", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4321",
        "http://localhost:4322",
        "http://127.0.0.1:4321",
        "https://lanky-violator-freight.ngrok-free.dev",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(create_router(chat_service, retrieval_service))


@app.on_event("shutdown")
def shutdown() -> None:
    backend.close()
