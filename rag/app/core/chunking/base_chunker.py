"""
base_chunker.py

Módulo que define la interfaz base para los estrategias de chunking.

Los chunkers son responsables de dividir documentos en fragmentos de
tamaño manejable para procesamiento de embeddings.

Clases
-------
BaseChunker
    Clase abstracta que define el contrato para cualquier estrategia de chunking.
"""

from abc import ABC, abstractmethod

from app.core.loaders.models import Chunk, Document


class BaseChunker(ABC):
    """
    Clase base abstracta para estrategias de chunking.

    Define la interfaz que deben implementar todas las estrategias de
    división de documentos en fragmentos.

    Attributes
    ----------
    chunk_size : int
        Tamaño aproximado de cada chunk en caracteres.
    chunk_overlap : int
        Superposición entre chunks consecutivos para mantener contexto.

    Methods
    -------
    chunk(document: Document) -> list[Chunk]
        Divide un documento en fragmentos.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50) -> None:
        """
        Inicializa el chunker.

        Args:
            chunk_size (int):
                Tamaño aproximado de cada chunk. Default: 500 chars.
            chunk_overlap (int):
                Caracteres compartidos entre chunks. Default: 50 chars.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    @abstractmethod
    def chunk(self, document: Document) -> list[Chunk]:
        """
        Divide un documento en fragmentos.

        Args:
            document (Document):
                Documento a dividir.

        Returns:
            list[Chunk]:
                Lista de chunks generados.

        Raises:
            NotImplementedError:
                Si la clase hija no implementa este método.
        """
        raise NotImplementedError
