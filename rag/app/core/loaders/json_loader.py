"""
json_loader.py

Loader para normalizar JSON de viajes del backend a documentos de texto.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

try:
    from .base_loader import BaseLoader
    from .models import Document
except ImportError as exc:  # pragma: no cover - permite ejecutar el modulo suelto
    if exc.name:
        raise
    from base_loader import BaseLoader
    from models import Document


class JsonLoader(BaseLoader):
    """
    Carga archivos JSON y normaliza viajes del backend para indexarlos en el RAG.

    Soporta las respuestas de:
    - GET /api/rag/travels: List[RagTravelResponse]
    - GET /api/travels y /api/admin/travels: List[TravelResponse]
    - Envolturas comunes como {"data": [...]}, {"travels": [...]} o {"items": [...]}
    """

    def load(self, path: str) -> list[Document]:
        source = Path(path)
        if source.is_dir():
            documents: list[Document] = []
            for file_path in sorted(source.glob("*.json")):
                documents.extend(self.load(str(file_path)))
            return documents

        payload = json.loads(source.read_text(encoding="utf-8"))
        records = self._extract_records(payload)

        return [
            Document(
                source=str(source),
                content=self._travel_to_markdown(record),
                metadata=self._travel_metadata(record, str(source)),
            )
            for record in records
        ]

    def _extract_records(self, payload: Any) -> list[dict[str, Any]]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]

        if isinstance(payload, dict):
            for key in ("data", "travels", "items", "results", "content"):
                value = payload.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
            return [payload]

        raise ValueError("El JSON debe ser un objeto, una lista o una respuesta paginada/envoltorio.")

    def _travel_to_markdown(self, travel: dict[str, Any]) -> str:
        lines = [
            f"# {self._value(travel.get('name'))}",
            "",
            f"- ID: {self._value(travel.get('id'))}",
            f"- Slug: {self._value(travel.get('slug'))}",
            f"- Tipo: {self._value(travel.get('type'))}",
            f"- Destino: {self._value(travel.get('destination'))}",
        ]

        if travel.get("origin"):
            lines.append(f"- Origen: {self._value(travel.get('origin'))}")

        duration = self._duration(travel)
        if duration:
            lines.append(f"- Duracion: {duration}")

        if travel.get("stars") is not None:
            lines.append(f"- Hotel/estrellas: {travel['stars']}")

        if travel.get("status"):
            lines.append(f"- Estado: {self._value(travel.get('status'))}")

        min_price = travel.get("minPrice")
        currency = travel.get("currency") or self._first_currency(travel)
        if min_price is not None:
            lines.append(f"- Precio desde: {min_price} {self._value(currency)}".rstrip())

        if travel.get("rating") is not None:
            lines.append(f"- Calificacion: {travel['rating']}")

        if travel.get("description"):
            lines.extend(["", "## Descripcion", str(travel["description"]).strip()])

        highlights = self._sorted_items(travel.get("highlights"))
        if highlights:
            lines.extend(["", "## Highlights"])
            lines.extend(f"- {self._value(item.get('label'))}" for item in highlights if item.get("label"))

        includes = self._sorted_items(travel.get("includes"))
        if includes:
            lines.extend(["", "## Incluye"])
            for item in includes:
                label = self._value(item.get("label"))
                description = item.get("description")
                package_id = item.get("packageId")
                suffix = f" (paquete {package_id})" if package_id is not None else ""
                detail = f": {description}" if description else ""
                lines.append(f"- {label}{suffix}{detail}")

        packages = travel.get("availablePackages") or travel.get("packages") or []
        packages = self._sorted_items(packages, key="id")
        if packages:
            lines.extend(["", "## Paquetes disponibles"])
            for package in packages:
                if package.get("active") is False:
                    continue
                lines.append(self._package_line(package))

        images = self._sorted_items(travel.get("images"))
        cover_image = travel.get("coverImage")
        if cover_image or images:
            lines.extend(["", "## Imagenes"])
            image_items = [cover_image] if isinstance(cover_image, dict) else []
            image_items.extend(images)
            seen: set[Any] = set()
            for image in image_items:
                image_id = image.get("id") or image.get("url")
                if image_id in seen:
                    continue
                seen.add(image_id)
                alt_text = self._value(image.get("altText"))
                url = self._value(image.get("url"))
                lines.append(f"- {alt_text}: {url}")

        return "\n".join(line for line in lines if line is not None).strip()

    def _travel_metadata(self, travel: dict[str, Any], source: str) -> dict[str, Any]:
        currency = travel.get("currency") or self._first_currency(travel)
        packages = travel.get("availablePackages") or travel.get("packages") or []
        return {
            "loader": "json",
            "source": source,
            "kind": "travel",
            "id": travel.get("id"),
            "slug": travel.get("slug"),
            "name": travel.get("name"),
            "type": travel.get("type"),
            "destination": travel.get("destination"),
            "status": travel.get("status"),
            "min_price": travel.get("minPrice"),
            "currency": currency,
            "package_ids": [item.get("id") for item in packages if isinstance(item, dict)],
        }

    def _package_line(self, package: dict[str, Any]) -> str:
        parts = [
            f"{self._value(package.get('name'))}",
            f"ID {self._value(package.get('id'))}",
            f"{self._value(package.get('personsIncluded'))} persona(s)",
        ]
        if package.get("hotelStars") is not None:
            parts.append(f"{package['hotelStars']} estrellas")
        if package.get("pricePerPerson") is not None:
            price = package["pricePerPerson"]
            currency = self._value(package.get("currency"))
            parts.append(f"{price} {currency}".rstrip())
        if package.get("availableSpots") is not None:
            parts.append(f"{package['availableSpots']} lugares disponibles")
        if package.get("capacity") is not None:
            parts.append(f"capacidad {package['capacity']}")
        return "- " + " | ".join(parts)

    def _duration(self, travel: dict[str, Any]) -> str | None:
        days = travel.get("durationDays")
        nights = travel.get("durationNights")
        if days is None and nights is None:
            return None
        values = []
        if days is not None:
            values.append(f"{days} dia(s)")
        if nights is not None:
            values.append(f"{nights} noche(s)")
        return " / ".join(values)

    def _first_currency(self, travel: dict[str, Any]) -> Any:
        packages = travel.get("availablePackages") or travel.get("packages") or []
        for package in packages:
            if isinstance(package, dict) and package.get("currency"):
                return package["currency"]
        return None

    def _sorted_items(self, value: Any, key: str = "sort") -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []
        items = [item for item in value if isinstance(item, dict)]
        return sorted(items, key=lambda item: item.get(key) if item.get(key) is not None else 0)

    def _value(self, value: Any) -> str:
        if value is None:
            return "No especificado"
        return str(value).strip()
