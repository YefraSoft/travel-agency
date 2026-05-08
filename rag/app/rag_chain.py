from __future__ import annotations

import os
from typing import Any

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_ollama import ChatOllama

LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "gemma3:12b")

_llm: ChatOllama | None = None
_chain: Any = None

SYSTEM_TEMPLATE = """
Eres el asistente virtual de una agencia de viajes mexicana que vende paquetes todo incluido, cruceros y viajes a la medida por WhatsApp.

Objetivo: ayudar al cliente a elegir viaje, resolver dudas, pedir datos para cotizar y mostrar profesionalismo comercial.

Reglas obligatorias:
- Responde siempre en español claro, amable y consultivo.
- Usa SOLO la informacion de VIAJES_DISPONIBLES y CONTEXTO_DOCS para precios, fechas, cupos, politicas y datos especificos.
- Si la informacion es de VIAJES_DISPONIBLES, indica que son datos actualizados del sistema.
- Si falta informacion, dilo y pide los datos necesarios en vez de inventar.
- Nunca proceses pagos ni prometas cobros en linea. Para pagos, explica que un agente humano confirma anticipo, saldo y fechas.
- Si el cliente quiere reservar o cotizar, pide: nombre, WhatsApp, destino, fechas aproximadas, numero de viajeros y presupuesto.
- Si VIAJES_DISPONIBLES contiene un paquete que coincide con la solicitud, menciona primero nombre, precio, duracion, cupo e incluye antes de pedir datos faltantes.
- Si el caso requiere decision humana, ofrece escalar con un asesor.
- Da respuestas concretas, utiles y con una siguiente accion.

VIAJES_DISPONIBLES (datos del sistema):
{travels}

CONTEXTO_DOCS:
{contexts}

HISTORIAL DE LA CONVERSACION:
{history}
""".strip()


def get_chain() -> Any:
    global _llm, _chain
    if _chain is not None:
        return _chain

    _llm = ChatOllama(
        model=LLM_MODEL,
        temperature=0.35,
        top_p=0.9,
        num_ctx=8192,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_TEMPLATE),
        ("user", "{question}"),
    ])

    _chain = prompt | _llm | StrOutputParser()
    return _chain


def generate(prompt_vars: dict[str, str]) -> str:
    chain = get_chain()
    return chain.invoke(prompt_vars).strip()
