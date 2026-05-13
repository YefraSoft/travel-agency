"""
txt_loader.py

Loader para archivos de texto plano.
"""

from __future__ import annotations

from pathlib import Path

try:
    from .base_loader import BaseLoader
    from .models import Document
except ImportError as exc:  # pragma: no cover - permite ejecutar el modulo suelto
    if exc.name:
        raise
    from base_loader import BaseLoader
    from models import Document


class TxtLoader(BaseLoader):
    """Carga archivos .txt como documentos."""

    def load(self, path: str) -> list[Document]:
        source = Path(path)
        if source.is_dir():
            documents: list[Document] = []
            for file_path in sorted(source.glob("*.txt")):
                documents.extend(self.load(str(file_path)))
            return documents

        content = source.read_text(encoding="utf-8").strip()
        if not content:
            return []

        return [
            Document(
                source=str(source),
                content=content,
                metadata={"loader": "text", "source": str(source)},
            )
        ]
