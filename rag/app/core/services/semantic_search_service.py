"""
semantic_search_service.py

Servicio unificado de búsqueda semántica.

Integra embeddings, vector store y búsqueda para proporcionar
una interfaz simple para recuperación de documentos similares.

Clases
-------
SemanticSearchService
    Orquesta embeddings y búsqueda semántica.
"""

from typing import Any
from app.core.loaders.models import Chunk
from .embedding_service import EmbeddingService
from .vector_store_service import VectorStoreService


class SemanticSearchService:
    """
    Servicio unificado de búsqueda semántica.

    Integra:
    - EmbeddingService para generar vectores
    - VectorStoreService para almacenamiento
    - Búsqueda por similitud

    Proporciona un flujo completo: texto → embedding → búsqueda.

    Attributes
    ----------
    embedding_service : EmbeddingService
        Servicio para generar embeddings.
    vector_store : VectorStoreService
        Servicio de almacenamiento vectorial.

    Example
    -------
    >>> search = SemanticSearchService(persist_dir="./storage")
    >>> search.index_chunks(chunks)
    >>> results = search.search("¿Cuál es la mejor playa?", top_k=5)
    """

    def __init__(
        self,
        persist_dir: str | None = None,
        collection_name: str = "documents",
        embedding_service: EmbeddingService | None = None,
    ) -> None:
        """
        Inicializa el servicio de búsqueda semántica.

        Args:
            persist_dir (str | None):
                Directorio para persistencia de ChromaDB.
            collection_name (str):
                Nombre de la colección.
            embedding_service (EmbeddingService | None):
                Servicio de embeddings. Si es None, crea uno nuevo.
        """
        self.embedding_service = embedding_service or EmbeddingService()
        self.vector_store = VectorStoreService(
            persist_dir=persist_dir,
            collection_name=collection_name,
        )

    def index_chunks(self, chunks: list[Chunk]) -> int:
        """
        Indexa chunks generando sus embeddings y agregándolos al vector store.

        Args:
            chunks (list[Chunk]):
                Lista de chunks a indexar.

        Returns:
            int:
                Número de chunks indexados.

        Example:
            >>> indexed_count = search.index_chunks(chunks)
            >>> print(f"Indexados: {indexed_count}")
        """
        if not chunks:
            return 0

        # Generar embeddings para todos los chunks
        texts = [chunk.content for chunk in chunks]
        embeddings = self.embedding_service.embed_texts(texts)

        # Agregar al vector store
        self.vector_store.add_chunks(chunks, embeddings)

        return len(chunks)

    def search(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.0,
    ) -> list[dict[str, Any]]:
        """
        Busca documentos similares a una consulta de texto.

        Args:
            query (str):
                Texto de consulta.
            top_k (int):
                Número de resultados. Default: 5.
            threshold (float):
                Umbral mínimo de similitud [0,1]. Default: 0.0.

        Returns:
            list[dict[str, Any]]:
                Resultados ordenados por similitud (mayor primero).
                Cada resultado contiene:
                {
                    "id": str,
                    "content": str,
                    "similarity": float,
                    "metadata": dict
                }

        Example:
            >>> results = search.search("playas de México", top_k=3)
            >>> for result in results:
            ...     print(f"[{result['similarity']:.2%}] {result['content'][:50]}")
        """
        # Generar embedding de la consulta
        query_embedding = self.embedding_service.embed_text(query)

        # Buscar en vector store
        results = self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k,
            threshold=threshold,
        )

        # Ordenar por similitud (mayor primero)
        results.sort(key=lambda x: x["similarity"], reverse=True)

        return results

    def reindex(self, chunks: list[Chunk]) -> dict[str, Any]:
        """
        Reconstruye el índice eliminando el anterior.

        Útil cuando el conocimiento ha sido actualizado significativamente.

        Args:
            chunks (list[Chunk]):
                Nuevos chunks a indexar.

        Returns:
            dict[str, Any]:
                Información sobre la reindexación.

        Example:
            >>> info = search.reindex(new_chunks)
            >>> print(f"Reindexados: {info['count']} chunks")
        """
        self.vector_store.delete_collection()
        count = self.index_chunks(chunks)
        return {
            "status": "success",
            "count": count,
            "collection": self.vector_store.collection_name,
        }

    def get_stats(self) -> dict[str, Any]:
        """
        Retorna estadísticas del servicio.

        Returns:
            dict[str, Any]:
                Información sobre el estado del índice.
        """
        return self.vector_store.get_stats()

    def clear(self) -> None:
        """Limpia completamente el índice de búsqueda."""
        self.vector_store.delete_collection()
