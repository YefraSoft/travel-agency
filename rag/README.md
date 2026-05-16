# RAG Agencia de Viajes

Servicio FastAPI del asistente conversacional de la agencia. Consulta datos reales del backend, recupera contexto documental desde ChromaDB y genera respuestas con Ollama.

## Ejecutar

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

## Endpoints

- `GET /health`
- `POST /reindex`
- `POST /chat`

## Estructura

- `app/main.py`: bootstrap de FastAPI.
- `app/api/routes.py`: endpoints HTTP.
- `app/clients/backend_client.py`: cliente backend con validación de payloads y respuestas.
- `app/schemas/`: modelos Pydantic de API y backend.
- `app/services/`: orquestación de chat, LLM y recuperación.
- `app/formatters/`: conversión de viajes/historial a texto para prompt.
- `app/core/`: pipeline RAG, chunking, loaders, embeddings y ChromaDB.

## Notas

- Usa Ollama para embeddings y generacion.
- Si el backend falla o responde con formato inesperado, el RAG escala a un asesor humano en vez de inventar informacion.
- El RAG no procesa pagos; siempre escala pagos al agente humano.
