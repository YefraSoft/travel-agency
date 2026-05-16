from __future__ import annotations

from app.schemas.backend import RagTravelResponse


def format_travels(travels: list[RagTravelResponse]) -> str:
    lines: list[str] = []
    for travel in travels:
        package_lines = []
        for package in travel.availablePackages:
            if package.active:
                package_lines.append(
                    f"  - {package.name}: ${package.pricePerPerson} {package.currency} por persona, "
                    f"{package.personsIncluded} personas incluidas, "
                    f"cupo: {package.availableSpots if package.availableSpots is not None else 'N/A'}"
                )
        min_price = f"${travel.minPrice} {travel.currency or 'MXN'}" if travel.minPrice is not None else "No especificado"
        lines.append(f"- {travel.name} ({travel.destination})")
        lines.append(f"  Tipo: {travel.type}, precio desde: {min_price}")
        if package_lines:
            lines.append("  Paquetes:")
            lines.extend(package_lines)
        lines.append("")
    return "\n".join(lines).strip() or "No hay viajes disponibles."
