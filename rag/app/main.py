from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .backend_client import BACKEND_URL, BackendClient
from .knowledge_base import build_index, retrieve
from .rag_chain import generate as llm_generate

DEMO_PHONE = os.getenv("DEMO_PHONE", "+521234567890")

backend = BackendClient()


class _ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    phone: str = Field(default=DEMO_PHONE, max_length=20)
    history: list[_ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str
    chat_id: int | None = None


app = FastAPI(title="Travel Agency RAG", version="0.3.0")
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


@app.on_event("shutdown")
def shutdown() -> None:
    backend.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _format_travels(travels: list[dict]) -> str:
    lines: list[str] = []
    for t in travels:
        pkgs = t.get("availablePackages", [])
        pkg_lines = []
        for p in pkgs:
            if p.get("active", True):
                pkg_lines.append(
                    f"  - {p['name']}: ${p['pricePerPerson']} MXN por persona, "
                    f"{p['personsIncluded']} personas incluidas, "
                    f"cupo: {p.get('availableSpots', 'N/A')}"
                )
        lines.append(f"- {t['name']} ({t['destination']})")
        lines.append(f"  Tipo: {t['type']}, precio desde: ${t['minPrice']} MXN")
        if pkg_lines:
            lines.append("  Paquetes:")
            lines.extend(pkg_lines)
        lines.append("")
    return "\n".join(lines).strip() or "No hay viajes disponibles."


def _format_history(history: list[dict]) -> str:
    if not history:
        return "Sin historial previo."
    lines = []
    for msg in history:
        role = "Cliente" if msg["type"] == "HUMAN" else "Asistente"
        lines.append(f"{role}: {msg['content']}")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model": os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
        "backend_url": BACKEND_URL,
    }


@app.post("/reindex")
def reindex() -> dict[str, Any]:
    try:
        index = build_index()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"status": "ok", "documents": len(index["documents"])}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    phone = request.phone or DEMO_PHONE

    try:
        active = backend.get_active_chat(phone)

        if active is None:
            created = backend.create_chat(phone)
            chat_id: int = created["id"]
            chat_history: list[dict] = []
        else:
            chat_id = active["id"]
            chat_history = active.get("chatHistory", []) or []

        user_msg = {"type": "HUMAN", "content": request.message}
        backend.add_message(chat_id, [user_msg], intention="UNKNOWN", escalated=False)

        updated = backend.get_active_chat(phone)
        full_history = (
            (updated.get("chatHistory", []) or [])
            if updated
            else chat_history + [user_msg]
        )

        travels = backend.get_travels()
        contexts = retrieve(request.message)

        answer = llm_generate({
            "question": request.message,
            "history": _format_history(full_history),
            "travels": _format_travels(travels),
            "contexts": "\n\n---\n\n".join(
                f"Fuente: {c['source']}\n{c['text']}" for c in contexts
            ),
        })

        ai_msg = {"type": "AI", "content": answer}
        backend.add_message(chat_id, [ai_msg], intention="UNKNOWN", escalated=False)

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(
        answer=answer,
        sources=sorted({c["source"].split("#", 1)[0] for c in contexts}),
        model=os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b"),
        chat_id=chat_id,
    )
