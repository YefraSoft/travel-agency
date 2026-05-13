"""
generic_chunker.py

Estrategia de chunking genérica para cualquier tipo de documento.

Divide documentos por párrafos/líneas sin asumir estructura específica.
"""

from app.core.loaders.models import Chunk, Document

from .base_chunker import BaseChunker


class GenericChunker(BaseChunker):
    """
    Estrategia de chunking genérica y universal.

    Divide documentos por párrafos (líneas vacías) o por longitud máxima,
    sin asumir ninguna estructura específica del documento.

    Ideal para texto plano, JSON, logs, etc.

    Example:
        >>> chunker = GenericChunker(chunk_size=800)
        >>> chunks = chunker.chunk(document)
    """

    def chunk(self, document: Document) -> list[Chunk]:
        """
        Divide un documento genérico en chunks por párrafos/longitud.

        Args:
            document (Document):
                Documento a procesar.

        Returns:
            list[Chunk]:
                Lista de chunks generados.
        """
        text = document.content.strip()
        if not text:
            return []

        # Intentar dividir por párrafos primero (líneas vacías)
        paragraphs = text.split("\n\n")

        chunks: list[Chunk] = []
        current_chunk = ""
        para_index = 0

        for paragraph in paragraphs:
            paragraph = paragraph.strip()
            if not paragraph:
                continue

            # Si el párrafo individual es muy grande, dividir por líneas
            if len(paragraph) > self.chunk_size:
                # Primero guardar chunk actual si hay
                if current_chunk:
                    chunks.append(
                        Chunk(
                            document_id=document.id,
                            content=current_chunk.strip(),
                            metadata={
                                "source": document.source,
                                "paragraph_index": para_index,
                                "chunking_strategy": "generic",
                            },
                        )
                    )
                    current_chunk = ""

                # Dividir párrafo grande por líneas
                lines = paragraph.split("\n")
                for line in lines:
                    if not line.strip():
                        continue

                    if (
                        len(current_chunk) + len(line) > self.chunk_size
                        and current_chunk
                    ):
                        chunks.append(
                            Chunk(
                                document_id=document.id,
                                content=current_chunk.strip(),
                                metadata={
                                    "source": document.source,
                                    "paragraph_index": para_index,
                                    "chunking_strategy": "generic",
                                },
                            )
                        )
                        current_chunk = line
                    else:
                        current_chunk = (
                            f"{current_chunk}\n{line}" if current_chunk else line
                        )
            else:
                # Agregar párrafo al chunk actual
                if (
                    len(current_chunk) + len(paragraph) > self.chunk_size
                    and current_chunk
                ):
                    chunks.append(
                        Chunk(
                            document_id=document.id,
                            content=current_chunk.strip(),
                            metadata={
                                "source": document.source,
                                "paragraph_index": para_index,
                                "chunking_strategy": "generic",
                            },
                        )
                    )
                    current_chunk = paragraph
                else:
                    current_chunk = (
                        f"{current_chunk}\n\n{paragraph}"
                        if current_chunk
                        else paragraph
                    )

            para_index += 1

        # Guardar último chunk
        if current_chunk.strip():
            chunks.append(
                Chunk(
                    document_id=document.id,
                    content=current_chunk.strip(),
                    metadata={
                        "source": document.source,
                        "paragraph_index": para_index,
                        "chunking_strategy": "generic",
                    },
                )
            )

        return chunks
