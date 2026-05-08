from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Any

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "knowledge"
STORAGE_DIR = ROOT / "storage"
INDEX_PATH = STORAGE_DIR / "index.json"

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b")
EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "qwen3-embedding:latest")
TOP_K = int(os.getenv("RAG_TOP_K", "5"))


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]
    model: str


app = FastAPI(title="Travel Agency RAG Demo", version="0.1.0")
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


def ollama(endpoint: str, payload: dict[str, Any], timeout: int = 120) -> dict[str, Any]:
    response = requests.post(f"{OLLAMA_BASE_URL}{endpoint}", json=payload, timeout=timeout)
    response.raise_for_status()
    return response.json()


def embed(text: str) -> list[float]:
    payload = {"model": EMBED_MODEL, "prompt": text}
    data = ollama("/api/embeddings", payload, timeout=90)
    embedding = data.get("embedding")
    if not embedding:
        raise RuntimeError("Ollama did not return an embedding")
    return [float(value) for value in embedding]


def generate(prompt: str) -> str:
    payload = {
        "model": LLM_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.35,
            "top_p": 0.9,
            "num_ctx": 8192,
        },
    }
    data = ollama("/api/generate", payload, timeout=180)
    return str(data.get("response", "")).strip()


def split_markdown(text: str, source: str) -> list[dict[str, str]]:
    normalized = re.sub(r"\n{3,}", "\n\n", text.strip())
    sections = re.split(r"(?=^##\s+)", normalized, flags=re.MULTILINE)
    chunks: list[dict[str, str]] = []
    for index, section in enumerate(sections):
        clean = section.strip()
        if not clean:
            continue
        if len(clean) > 1800:
            paragraphs = clean.split("\n\n")
            current = ""
            for paragraph in paragraphs:
                if len(current) + len(paragraph) > 1600 and current:
                    chunks.append({"source": f"{source}#{index}", "text": current.strip()})
                    current = paragraph
                else:
                    current = f"{current}\n\n{paragraph}" if current else paragraph
            if current:
                chunks.append({"source": f"{source}#{index}", "text": current.strip()})
        else:
            chunks.append({"source": f"{source}#{index}", "text": clean})
    return chunks


def build_index() -> dict[str, Any]:
    if not DATA_DIR.exists():
        raise RuntimeError(f"Knowledge directory not found: {DATA_DIR}")
    documents: list[dict[str, Any]] = []
    for path in sorted(DATA_DIR.glob("*.md")):
        chunks = split_markdown(path.read_text(encoding="utf-8"), path.name)
        for chunk in chunks:
            documents.append({**chunk, "embedding": embed(chunk["text"])})
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    index = {"model": EMBED_MODEL, "documents": documents}
    INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    return index


def load_index() -> dict[str, Any]:
    if not INDEX_PATH.exists():
        return build_index()
    return json.loads(INDEX_PATH.read_text(encoding="utf-8"))


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve(question: str, top_k: int = TOP_K) -> list[dict[str, Any]]:
    index = load_index()
    query_vector = embed(question)
    scored = []
    for doc in index["documents"]:
        scored.append({**doc, "score": cosine(query_vector, doc["embedding"])})
    return sorted(scored, key=lambda item: item["score"], reverse=True)[:top_k]


def make_prompt(question: str, history: list[ChatMessage], contexts: list[dict[str, Any]]) -> str:
    context_block = "\n\n---\n\n".join(
        f"Fuente: {item['source']}\n{item['text']}" for item in contexts
    )
    history_block = "\n".join(
        f"{message.role}: {message.content}" for message in history[-6:]
    )
    return f"""
Eres el asistente RAG demo de una agencia de viajes mexicana que vende paquetes todo incluido, cruceros y viajes a la medida por WhatsApp.

Objetivo: ayudar al cliente a elegir viaje, resolver dudas, pedir datos faltantes para cotizar y mostrar profesionalismo comercial.

Reglas obligatorias:
- Responde siempre en español claro, amable y consultivo.
- Usa solo la informacion del CONTEXTO para precios, fechas, cupos, politicas y datos especificos.
- Si falta informacion, dilo y pide los datos necesarios en vez de inventar.
- Nunca proceses pagos ni prometas cobros en linea. Para pagos, explica que un agente humano confirma anticipo, saldo y fechas.
- Si el cliente quiere reservar o cotizar, pide: nombre, WhatsApp, destino, fechas aproximadas, numero de viajeros y presupuesto.
- Si el contexto contiene un paquete que coincide con la solicitud, menciona primero nombre, precio demo, duracion, cupo e incluye antes de pedir datos faltantes.
- Si el caso requiere decision humana, ofrece escalar con un asesor.
- Da respuestas concretas, utiles y con una siguiente accion.

HISTORIAL RECIENTE:
{history_block or "Sin historial previo."}

CONTEXTO RECUPERADO:
{context_block}

PREGUNTA DEL CLIENTE:
{question}

Respuesta final:
""".strip()


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "llm_model": LLM_MODEL,
        "embed_model": EMBED_MODEL,
        "indexed": INDEX_PATH.exists(),
    }


@app.post("/reindex")
def reindex() -> dict[str, Any]:
    try:
        index = build_index()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"status": "ok", "documents": len(index["documents"]), "embed_model": EMBED_MODEL}


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    try:
        contexts = retrieve(request.message)
        answer = generate(make_prompt(request.message, request.history, contexts))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ChatResponse(
        answer=answer,
        sources=sorted({item["source"].split("#", 1)[0] for item in contexts}),
        model=LLM_MODEL,
    )
