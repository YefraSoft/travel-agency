"""
config.py

Configuración centralizada de la aplicación.

Variables de entorno y configuraciones por defecto.
"""

import os
from pathlib import Path

# Directorios
ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
STORAGE_DIR = ROOT_DIR / "storage"
KNOWLEDGE_DIR = DATA_DIR / "knowledge"

# Ollama
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL", "qwen3-embedding:latest")
LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b")

# RAG
TOP_K = int(os.getenv("RAG_TOP_K", "5"))
SIMILARITY_THRESHOLD = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.0"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "50"))

# ChromaDB
CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", str(STORAGE_DIR / "chroma"))
CHROMA_COLLECTION = os.getenv("CHROMA_COLLECTION", "documents")


# Configuración de servicios
class Settings:
    """Configuración de la aplicación."""

    # Directorios
    ROOT_DIR = ROOT_DIR
    DATA_DIR = DATA_DIR
    STORAGE_DIR = STORAGE_DIR
    KNOWLEDGE_DIR = KNOWLEDGE_DIR

    # Ollama
    OLLAMA_HOST = OLLAMA_HOST
    EMBEDDING_MODEL = EMBEDDING_MODEL
    LLM_MODEL = LLM_MODEL

    # RAG
    TOP_K = TOP_K
    SIMILARITY_THRESHOLD = SIMILARITY_THRESHOLD
    CHUNK_SIZE = CHUNK_SIZE
    CHUNK_OVERLAP = CHUNK_OVERLAP

    # ChromaDB
    CHROMA_PERSIST_DIR = CHROMA_PERSIST_DIR
    CHROMA_COLLECTION = CHROMA_COLLECTION


settings = Settings()
