"""
md_loader.py

Loader para documentos Markdown de la base de conocimiento.
"""

from __future__ import annotations

import re
from pathlib import Path

try:
    from .base_loader import BaseLoader
    from .models import Document
except ImportError as exc:  # pragma: no cover - permite ejecutar el modulo suelto
    if exc.name:
        raise
    from base_loader import BaseLoader
    from models import Document


class MdLoader(BaseLoader):
    """Carga Markdown completo o dividido por secciones de encabezado."""

    def __init__(self, split_sections: bool = True) -> None:
        self.split_sections = split_sections

    def load(self, path: str) -> list[Document]:
        source = Path(path)
        if source.is_dir():
            documents: list[Document] = []
            for file_path in sorted(source.glob("*.md")):
                documents.extend(self.load(str(file_path)))
            return documents

        text = source.read_text(encoding="utf-8")
        sections = self._split(text) if self.split_sections else [(None, text.strip())]

        documents: list[Document] = []
        for index, (title, content) in enumerate(sections):
            if not content:
                continue
            documents.append(
                Document(
                    source=str(source),
                    content=content,
                    metadata={
                        "loader": "markdown",
                        "source": str(source),
                        "section_index": index,
                        "section_title": title,
                    },
                )
            )
        return documents

    def _split(self, text: str) -> list[tuple[str | None, str]]:
        normalized = re.sub(r"\n{3,}", "\n\n", text.strip())
        if not normalized:
            return []

        sections = re.split(r"(?=^#{1,3}\s+)", normalized, flags=re.MULTILINE)
        result: list[tuple[str | None, str]] = []
        for section in sections:
            clean = section.strip()
            if not clean:
                continue
            first_line = clean.splitlines()[0].strip()
            title = re.sub(r"^#{1,6}\s+", "", first_line) if first_line.startswith("#") else None
            result.append((title, clean))
        return result
