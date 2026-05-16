from __future__ import annotations

from app.schemas.backend import ChatMessage


def format_history(history: list[ChatMessage]) -> str:
    if not history:
        return "Sin historial previo."
    lines: list[str] = []
    for msg in history:
        role = "Cliente" if msg.type == "HUMAN" else "Asistente"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)
