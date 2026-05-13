"""
modelos.py

Módulo que contiene los modelos de datos principales de la aplicación.

Este archivo define estructuras de datos utilizando Pydantic para
validación automática, serialización y manejo seguro de tipos.

Clases
-------
Document
    Representa un documento completo con contenido y metadatos.

Chunk
    Representa un fragmento o sección de un documento.
"""

from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Document(BaseModel):
    """
    Modelo que representa un documento completo.

    Attributes:
        id (UUID):
            Identificador único del documento.
            Se genera automáticamente usando uuid4().

        source (str):
            Fuente u origen del documento.
            Ejemplo: archivo, URL, base de datos, etc.

        content (str):
            Contenido principal del documento.

        metadata (dict):
            Diccionario con información adicional asociada al documento.
            Se inicializa vacío por defecto.

    Example:
        >>> doc = Document(
        ...     source="manual.pdf",
        ...     content="Contenido del documento"
        ... )
        >>> print(doc.id)
    """

    id: UUID = Field(default_factory=uuid4)
    source: str
    content: str
    metadata: dict = Field(default_factory=dict)


class Chunk(BaseModel):
    """
    Modelo que representa un fragmento de un documento.

    Un chunk se utiliza comúnmente para dividir documentos grandes
    en partes más pequeñas para procesamiento, embeddings o búsqueda.

    Attributes:
        id (UUID):
            Identificador único del chunk.
            Se genera automáticamente usando uuid4().

        document_id (UUID):
            Identificador del documento al que pertenece el chunk.

        content (str):
            Texto o contenido del fragmento.

        metadata (dict):
            Información adicional asociada al chunk.
            Se inicializa vacío por defecto.

    Example:
        >>> chunk = Chunk(
        ...     document_id=doc.id,
        ...     content="Primer fragmento del documento"
        ... )
        >>> print(chunk.document_id)
    """

    id: UUID = Field(default_factory=uuid4)
    document_id: UUID
    content: str
    metadata: dict = Field(default_factory=dict)
