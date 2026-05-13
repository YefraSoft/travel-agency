"""
base_loader.py

Módulo que define la interfaz base para los cargadores de documentos.

Los loaders son responsables de leer archivos, recursos o fuentes externas
y convertirlos en instancias del modelo `Document`.

Clases
-------
BaseLoader
    Clase abstracta que define el contrato para cualquier loader.
"""

from abc import ABC, abstractmethod

try:
    from .models import Document
except ImportError as exc:  # pragma: no cover - permite ejecutar el modulo suelto
    if exc.name:
        raise
    from models import Document


class BaseLoader(ABC):
    """
    Clase base abstracta para cargadores de documentos.

    Esta clase define la interfaz que deben implementar todos los loaders
    de la aplicación. Un loader debe encargarse de leer una fuente de datos
    y devolver una lista de objetos `Document`.

    Methods
    -------
    load(path: str) -> list[Document]
        Carga documentos desde una ruta o recurso específico.

    Example
    -------
    >>> class TextLoader(BaseLoader):
    ...     def load(self, path: str) -> list[Document]:
    ...         return [
    ...             Document(
    ...                 source=path,
    ...                 content="Contenido del archivo"
    ...             )
    ...         ]
    """

    @abstractmethod
    def load(self, path: str) -> list[Document]:
        """
        Carga documentos desde una ruta específica.

        Args:
            path (str):
                Ruta del archivo, directorio o recurso a cargar.

        Returns:
            list[Document]:
                Lista de documentos cargados y procesados.

        Raises:
            NotImplementedError:
                Si la clase hija no implementa este método.
        """
        raise NotImplementedError
