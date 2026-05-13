"""
markdown_chunker.py

Estrategia de chunking especializada para documentos Markdown.

Divide documentos markdown respetando la estructura de encabezados y
manteniendo coherencia temática.
"""

import re
from app.core.loaders.models import Chunk, Document
from .base_chunker import BaseChunker


class MarkdownChunker(BaseChunker):
    """
    Estrategia de chunking para documentos Markdown.

    Respeta la estructura de encabezados (##) y divide párrafos grandes
    manteniendo contexto.

    Example:
        >>> chunker = MarkdownChunker(chunk_size=1000)
        >>> chunks = chunker.chunk(document)
    """

    def chunk(self, document: Document) -> list[Chunk]:
        """
        Divide un documento markdown en chunks temáticos.

        Args:
            document (Document):
                Documento markdown a procesar.

        Returns:
            list[Chunk]:
                Lista de chunks generados.
        """
        # Normalizar espacios en blanco
        normalized = re.sub(r"\n{3,}", "\n\n", document.content.strip())

        # Dividir por encabezados de nivel 2
        sections = re.split(r"(?=^##\s+)", normalized, flags=re.MULTILINE)

        chunks: list[Chunk] = []
        section_index = 0

        for section in sections:
            section = section.strip() # Strip: Elimina caracteres al inicio o al final
            if not section:
                continue

            # Si la sección es pequeña, agregarla como un chunk
            if len(section) <= self.chunk_size:
                chunks.append(
                    Chunk(
                        document_id=document.id,
                        content=section,
                        metadata={
                            "source": document.source,
                            "section_index": section_index,
                            "chunking_strategy": "markdown",
                        },
                    )
                )
            else:
                # Dividir la sección grande por párrafos
                paragraphs = section.split("\n\n")
                current_chunk = ""

                for paragraph in paragraphs:
                    # Si agregar el párrafo excede el límite
                    if (
                        len(current_chunk) + len(paragraph) > self.chunk_size
                        and current_chunk
                    ):
                        # Guardar el chunk actual
                        chunks.append(
                            Chunk(
                                document_id=document.id,
                                content=current_chunk.strip(),
                                metadata={
                                    "source": document.source,
                                    "section_index": section_index,
                                    "chunking_strategy": "markdown",
                                },
                            )
                        )
                        # Reiniciar con overlap
                        current_chunk = paragraph
                    else:
                        # Agregar párrafo al chunk actual
                        current_chunk = (
                            f"{current_chunk}\n\n{paragraph}"
                            if current_chunk
                            else paragraph
                        )

                # Guardar el último chunk de la sección
                if current_chunk.strip():
                    chunks.append(
                        Chunk(
                            document_id=document.id,
                            content=current_chunk.strip(),
                            metadata={
                                "source": document.source,
                                "section_index": section_index,
                                "chunking_strategy": "markdown",
                            },
                        )
                    )

            section_index += 1

        return chunks
