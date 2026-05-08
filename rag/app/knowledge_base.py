from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data" / "knowledge"
STORAGE_DIR = ROOT / "storage"
INDEX_PATH = STORAGE_DIR / "index.json"

EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "qwen3-embedding:latest")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
TOP_K = int(os.getenv("RAG_TOP_K", "5"))


def _ollama(endpoint: str, payload: dict[str, Any], timeout: int = 120) -> dict[str, Any]:
    resp = requests.post(f"{OLLAMA_BASE_URL}{endpoint}", json=payload, timeout=timeout)
    resp.raise_for_status()
    return resp.json()


def embed(text: str) -> list[float]:
    data = _ollama("/api/embeddings", {"model": EMBED_MODEL, "prompt": text}, timeout=90)
    embedding = data.get("embedding")
    if not embedding:
        raise RuntimeError("Ollama did not return an embedding")
    return [float(v) for v in embedding]


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
