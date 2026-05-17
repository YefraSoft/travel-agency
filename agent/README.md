# Agente RAG — Agencia de Viajes (TypeScript)

Agente conversacional RAG para la agencia de viajes, operando por WhatsApp a través de n8n.

## Arquitectura

```
WhatsApp → n8n (buffer 1min inactividad) → POST /api/chat → Agente TS
                                                    ↓
                                    { answer, sources, model, chat_id, escalate? }
                                                    ↓
                    n8n envía respuesta al cliente O redirige a humano (si escalate=true)
                                                    ↓
                          n8n → POST /api/chat/summarize (async)
                                                    ↓
                        Agente TS genera summary con LLM
                        → POST /api/rag/chats/phone/{phone}/close (backend)
                        → Backend persiste en PostgreSQL + borra Redis
```

## Stack

- **Runtime**: Bun
- **Web**: Express 5
- **LLM**: Google Gemini 2.5 Flash
- **Embeddings**: Google gemini-embedding-2
- **Vector Store**: ChromaDB (vía LangChain)
- **Validación**: Zod v4

## Endpoints

### Chat (producción)

| Method | Path | Descripción |
|--------|------|-------------|
| `POST` | `/api/chat` | Procesa mensaje con RAG completo |
| `POST` | `/api/chat/summarize` | Genera summary y cierra chat |

### RAG (debug/admin)

| Method | Path | Descripción |
|--------|------|-------------|
| `POST` | `/api/rag/ingest` | Ingesta documentos del filesystem |
| `POST` | `/api/rag/ingest/viajes` | Refresca viajes del backend |
| `POST` | `/api/rag/query` | Búsqueda semántica (sin LLM) |

### Utilidades

| Method | Path | Descripción |
|--------|------|-------------|
| `GET` | `/api/health` | Health check (backend, LLM, ChromaDB) |
| `GET` | `/api/translate` | Demo LLM |

## Variables de Entorno

Ver `.env.example`. Las principales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | — | API key de Google para Gemini |
| `BACKEND_URL` | `http://localhost:8080` | URL del backend Spring |
| `PORT` | `3000` | Puerto del agente |
| `CORS_ORIGINS` | `*` | Orígenes permitidos (comma-separated) |
| `CHUNK_SIZE` | `500` | Tamaño de chunk para documentos |
| `CHUNK_OVERLAP` | `50` | Overlap entre chunks |

## Desarrollo

```bash
bun install        # Instalar dependencias
bun run dev        # Modo desarrollo con hot reload
bun run start      # Modo producción
bun test           # Ejecutar tests
```

## Integración con n8n

n8n envía mensajes al agente cuando detecta 1 minuto de inactividad del cliente:

```json
// POST /api/chat
{
  "message": "¿Cuánto cuesta un viaje a Cancún?",
  "phone": "+5213312345678",
  "history": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "¡Hola! ¿En qué puedo ayudarte?" }
  ]
}
```

Para cerrar la conversación:

```json
// POST /api/chat/summarize
{
  "phone": "+5213312345678"
}
```
