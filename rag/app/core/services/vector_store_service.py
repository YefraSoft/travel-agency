"""
vector_store_service.py

Servicio de almacenamiento vectorial usando ChromaDB.

Maneja persistencia, indexación y acceso a embeddings almacenados.

Clases
-------
VectorStoreService
    Wrapper modular para ChromaDB con operaciones CRUD.
"""

import os
from pathlib import Path
from typing import Any

import chromadb
from chromadb.config import Settings

from app.core.loaders.models import Chunk


class VectorStoreService:
    """
    Servicio de almacenamiento vectorial usando ChromaDB.

    Proporciona una interfaz modular para:
    - Agregar chunks con embeddings
    - Recuperar chunks por similitud
    - Gestionar colecciones
    - Persistir datos

    Attributes
    ----------
    client : chromadb.Client
        Cliente de ChromaDB.
    collection_name : str
        Nombre de la colección activa.
    collection : chromadb.Collection
        Referencia a la colección.

    Example
    -------
    >>> vs = VectorStoreService(persist_dir="./storage")
    >>> vs.add_chunks(chunks, embeddings)
    >>> results = vs.search(query_embedding, top_k=5)
    """

    def __init__(
        self,
        persist_dir: str | None = None,
        collection_name: str = "documents",
        **kwargs: Any,
    ) -> None:
        """
        Inicializa el servicio de vector store.

        Args:
            persist_dir (str | None):
                Directorio para persistencia. Si es None, usa memoria.
                Default: None (memoria).
            collection_name (str):
                Nombre de la colección. Default: "documents".
            **kwargs:
                Argumentos adicionales para ChromaDB.
        """
        self.collection_name = collection_name
        self.persist_dir = persist_dir

        # Configurar ChromaDB
        if persist_dir:
            Path(persist_dir).mkdir(parents=True, exist_ok=True)
            settings = Settings(
                is_persistent=True,
                persist_directory=persist_dir,
                anonymized_telemetry=False,
            )
            self.client = chromadb.Client(settings)
        else:
            self.client = chromadb.Client()

        # Obtener o crear colección
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def add_chunks(
        self,
        chunks: list[Chunk],
        embeddings: list[list[float]],
    ) -> None:
        """
        Agrega chunks con sus embeddings a la colección.

        Args:
            chunks (list[Chunk]):
                Lista de chunks a agregar.
            embeddings (list[list[float]]):
                Lista de embeddings correspondientes a los chunks.

        Raises:
            ValueError:
                Si la cantidad de chunks y embeddings no coinciden.
        """
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks pero {len(embeddings)} embeddings"
            )

        # Preparar datos para ChromaDB
        ids = [str(chunk.id) for chunk in chunks]
        documents = [chunk.content for chunk in chunks]
        metadatas = [
            {
                "document_id": str(chunk.document_id),
                "source": chunk.metadata.get("source", "unknown"),
                **{k: str(v) for k, v in chunk.metadata.items() if k != "source"},
            }
            for chunk in chunks
        ]

        # Agregar a ChromaDB
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

    def search(
        self,
        query_embedding: list[float],
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[dict[str, Any]]:
        """
        Busca los k chunks más similares a un embedding de consulta.

        Args:
            query_embedding (list[float]):
                Embedding de la consulta.
            top_k (int):
                Número de resultados a retornar. Default: 5.
            threshold (float):
                Umbral mínimo de similitud. Default: 0.0.

        Returns:
            list[dict[str, Any]]:
                Lista de resultados con estructura:
                {
                    "id": str,
                    "content": str,
                    "metadata": dict,
                    "distance": float,
                    "similarity": float
                }
        """
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["embeddings", "documents", "metadatas", "distances"],
        )

        # Procesar resultados
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]

        processed = []
        for doc_id, content, metadata, distance in zip(
            ids, documents, metadatas, distances
        ):
            # ChromaDB retorna distancia, convertir a similitud
            # (distancia coseno: 0=igual, 1=diferente)
            similarity = 1 - distance

            if similarity >= threshold:
                processed.append(
                    {
                        "id": doc_id,
                        "content": content,
                        "metadata": metadata,
                        "distance": distance,
                        "similarity": similarity,
                    }
                )

        return processed

    def delete_collection(self) -> None:
        """Elimina la colección actual."""
        self.client.delete_collection(name=self.collection_name)
        # Recrear colección vacía
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def get_stats(self) -> dict[str, Any]:
        """
        Retorna estadísticas de la colección.

        Returns:
            dict[str, Any]:
                {
                    "collection_name": str,
                    "count": int,
                    "persist_dir": str | None
                }
        """
        count = self.collection.count()
        return {
            "collection_name": self.collection_name,
            "count": count,
            "persist_dir": self.persist_dir,
        }
