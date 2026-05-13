"""
rag_pipeline.py

Pipeline modular para la orquestación completa del RAG.

Integra: Loaders → Chunking → Embeddings → Vector Store → Búsqueda.

Clases
-------
RAGPipeline
    Orquestación completa del proceso de RAG.
"""

from typing import Any

from app.core.chunking import BaseChunker, GenericChunker, MarkdownChunker
from app.core.config import settings
from app.core.loader_factory import LoaderFactory
from app.core.loaders.models import Chunk
from app.core.services.embedding_service import EmbeddingService
from app.core.services.semantic_search_service import SemanticSearchService


class RAGPipeline:
    """
    Pipeline modular de RAG.

    Orquesta:
    1. Carga de documentos (LoaderFactory)
    2. Chunking (BaseChunker)
    3. Embeddings (EmbeddingService)
    4. Almacenamiento vectorial (VectorStoreService)
    5. Búsqueda semántica (SemanticSearchService)

    Attributes
    ----------
    loader_factory : LoaderFactory
        Fábrica para cargar documentos según tipo.
    chunker : BaseChunker
        Estrategia de chunking.
    search_service : SemanticSearchService
        Servicio de búsqueda semántica.

    Example
    -------
    >>> pipeline = RAGPipeline()
    >>> pipeline.ingest("./data/knowledge")
    >>> results = pipeline.search("¿Dónde ir en México?", top_k=3)
    """

    def __init__(
        self,
        chunker: BaseChunker | MarkdownChunker |None = None,
        embedding_service: EmbeddingService | None = None,
        persist_dir: str | None = None,
        collection_name: str = "documents",
    ) -> None:
        """
        Inicializa el pipeline RAG.

        Args:
            chunker (BaseChunker | None):
                Estrategia de chunking. Default: GenericChunker.
            embedding_service (EmbeddingService | None):
                Servicio de embeddings. Default: crea uno nuevo.
            persist_dir (str | None):
                Directorio de persistencia. Default: usa config.
            collection_name (str):
                Nombre de la colección.
        """
        self.loader_factory = LoaderFactory()
        self.chunker = chunker or GenericChunker(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
        )
        self.embedding_service = embedding_service or EmbeddingService()

        persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR

        self.search_service = SemanticSearchService(
            persist_dir=persist_dir,
            collection_name=collection_name,
            embedding_service=self.embedding_service,
        )

    def ingest_file(self, file_path: str) -> dict[str, Any]:
        """
        Ingesta un archivo individual.

        Args:
            file_path (str):
                Ruta del archivo.

        Returns:
            dict[str, Any]:
                {
                    "file": str,
                    "documents": int,
                    "chunks": int,
                    "status": str
                }
        """
        try:
            # Cargar documento
            loader = self.loader_factory.get_loader(file_path)
            documents = loader.load(file_path)

            # Chunking
            chunks: list[Chunk] = []
            for doc in documents:
                chunks.extend(self.chunker.chunk(doc))

            # Indexar
            indexed = self.search_service.index_chunks(chunks)

            return {
                "file": file_path,
                "documents": len(documents),
                "chunks": indexed,
                "status": "success",
            }
        except Exception as e:
            return {
                "file": file_path,
                "documents": 0,
                "chunks": 0,
                "status": "failed",
                "error": str(e),
            }

    def ingest_directory(self, directory_path: str) -> dict[str, Any]:
        """
        Ingesta todos los archivos de un directorio.

        Soporta .md, .txt, .json basado en extensión.

        Args:
            directory_path (str):
                Ruta del directorio.

        Returns:
            dict[str, Any]:
                Estadísticas de ingesta:
                {
                    "directory": str,
                    "total_files": int,
                    "total_documents": int,
                    "total_chunks": int,
                    "successful": int,
                    "failed": int,
                    "files": list[dict]
                }
        """
        from pathlib import Path

        dir_path = Path(directory_path)
        if not dir_path.exists() or not dir_path.is_dir():
            return {
                "directory": directory_path,
                "status": "failed",
                "error": "Directory not found",
            }

        results = []
        total_docs = 0
        total_chunks = 0

        # Procesar archivos soportados
        for ext in ["*.md", "*.txt", "*.json"]:
            for file_path in dir_path.glob(ext):
                result = self.ingest_file(str(file_path))
                results.append(result)
                total_docs += result.get("documents", 0)
                total_chunks += result.get("chunks", 0)

        successful = sum(1 for r in results if r["status"] == "success")
        failed = sum(1 for r in results if r["status"] == "failed")

        return {
            "directory": directory_path,
            "total_files": len(results),
            "total_documents": total_docs,
            "total_chunks": total_chunks,
            "successful": successful,
            "failed": failed,
            "files": results,
        }

    def search(
        self,
        query: str,
        top_k: int | None = None,
        threshold: float | None = None,
    ) -> list[dict[str, Any]]:
        """
        Búsqueda semántica en la base de conocimiento indexada.

        Args:
            query (str):
                Consulta de texto.
            top_k (int | None):
                Número de resultados. Default: usa config.
            threshold (float | None):
                Umbral mínimo de similitud. Default: usa config.

        Returns:
            list[dict[str, Any]]:
                Resultados ordenados por similitud.
        """
        top_k = top_k or settings.TOP_K
        threshold = threshold or settings.SIMILARITY_THRESHOLD

        return self.search_service.search(
            query=query,
            top_k=top_k,
            threshold=threshold,
        )

    def get_stats(self) -> dict[str, Any]:
        """Retorna estadísticas del pipeline."""
        return {
            "embedding_model": settings.EMBEDDING_MODEL,
            "chunker_type": self.chunker.__class__.__name__,
            "vector_store": self.search_service.get_stats(),
        }

    def clear(self) -> None:
        """Limpia completamente el índice."""
        self.search_service.clear()
