"""
chunking package

Módulo para dividir documentos en fragmentos (chunks) de tamaño manejable.
"""

from .base_chunker import BaseChunker
from .generic_chunker import GenericChunker
from .markdown_chunker import MarkdownChunker

__all__ = ["BaseChunker", "GenericChunker", "MarkdownChunker"]
