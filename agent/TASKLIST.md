# TASKLIST — Agente TypeScript a Producción

> **Objetivo**: Convertir el agente TS (`/agent/`) en el agente RAG de producción, reemplazando al Python RAG.
> **Arquitectura**: n8n orquesta mensajes → Agente TS procesa RAG → Backend Spring persiste.

---

## Arquitectura Final

```
WhatsApp → n8n (buffer 1min inactividad) → POST /api/chat → Agente TS
                                                    ↓
                                    { answer, sources, model, chat_id, escalate? }
                                                    ↓
                    n8n envía respuesta al cliente O redirige a humano (si escalate=true)
                                                    ↓
                          n8n → POST /api/chat/summarize (async, segundo plano)
                                                    ↓
                        Agente TS genera summary con LLM
                        → POST /api/rag/chats/phone/{phone}/close
                        → Backend persiste en PostgreSQL + borra Redis
```

**Responsabilidades**:
| Componente | Responsabilidad |
|-----------|----------------|
| **n8n** | Buffer de mensajes, decide cuándo cerrar, redirige a humano |
| **Agente TS** | RAG (retrieval + generación), summary, detección de escalación |
| **Backend Spring** | Persistencia (PostgreSQL), cache activo (Redis), admin frontend |
| **Redis** | Chat activo en memoria (TTL 24h) |
| **PostgreSQL** | Historial cerrado permanente |

---

## Fase 1: Corregir contrato con el Backend

- [ ] **1.1** Renombrar `src/utils/shcemas.ts` → `src/utils/schemas.ts`
- [ ] **1.2** Reescribir `ViajeSchema` para coincidir con `RagTravelResponse` del backend:
  - Campos: `id` (number), `name`, `slug`, `type`, `destination`, `origin` (nullable), `minPrice` (nullable number), `currency` (nullable string), `availablePackages` (array)
- [ ] **1.3** Eliminar `ViajesResponseSchema` wrapper — el backend retorna array plano `RagTravelResponse[]`
- [ ] **1.4** Actualizar `src/core/loaders/ViajesLoader.ts`:
  - URL por defecto: `http://localhost:8080/api/rag/travels` (no `/api/travels`)
  - Parsear: `ViajeSchema.array().parse(raw)`
  - Reescribir `viajeToDocument()` con campos reales: `destination`, `name`, `minPrice`, `currency`, `availablePackages`, `type`
  - Generar texto legible en español con info de paquetes disponibles

**Contrato backend** (`RagTravelResponse`):
```typescript
{
  id: number,
  name: string,
  slug: string,
  type: string,
  destination: string,
  origin: string | null,
  minPrice: number | null,
  currency: string | null,
  availablePackages: Array<{
    id: number, name: string, pricePerPerson: number,
    currency: string, active: boolean, ...
  }>
}
```

---

## Fase 2: Limpiar y organizar código

- [ ] **2.1** Eliminar archivos duplicados:
  - `src/core/vectors/VectorStorage.ts`
  - `src/App/services/VectorStorageService.ts`
- [ ] **2.2** Renombrar `src/config/AppConfing.ts` → `src/config/AppConfig.ts`
- [ ] **2.3** Actualizar todos los imports que referencian los archivos renombrados/eliminados
- [ ] **2.4** Reescribir `AppConfig.ts` con variables de entorno:
  ```
  LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_RETRIES
  EMBEDDINGS_MODEL (Google), EMBEDDINGS_PROVIDER
  OLLAMA_HOST, OLLAMA_LLM_MODEL, OLLAMA_EMBEDDINGS_MODEL
  VECTOR_COLLECTION, CHUNK_SIZE, CHUNK_OVERLAP
  BACKEND_URL, KNOWLEDGE_DIR
  ```
- [ ] **2.5** Crear directorio `data/knowledge/`
- [ ] **2.6** Copiar markdowns del Python RAG a `data/knowledge/`:
  - `viajes_demo.md`, `politicas_demo.md`, `faqs_destinos_demo.md`, `tono_ventas_demo.md`
- [ ] **2.7** Eliminar `src/interfaces.ts` (vacío) y `src/utils/types.ts` si queda redundante con schemas Zod

---

## Fase 3: LLM Service con fallback Gemini → Ollama

- [ ] **3.1** Crear `src/core/llm/LlmService.ts`
- [ ] **3.2** Implementar clase `LlmService`:
  - Primary: `ChatGoogle("gemini-2.5-flash")`
  - Fallback: `ChatOllama({ model: "gemma3:12b", temperature: 0.35 })`
  - Método `generate(messages)`: intenta Gemini, si falla → Ollama
  - Retorna `{ content: string, model: string }`
- [ ] **3.3** Actualizar `src/core/Models.ts`:
  - Exportar solo instancias base de embeddings
  - Mover lógica de LLM a `LlmService`
- [ ] **3.4** Configurar variables de entorno para Ollama fallback en `.env`

---

## Fase 4: Prompt Builder

- [ ] **4.1** Crear `src/core/llm/PromptBuilder.ts`
- [ ] **4.2** Definir system prompt (español, agente WhatsApp agencia mexicana):
  - Siempre responder en español
  - Usar solo información proporcionada (travels + context)
  - Nunca procesar pagos — redirigir al agente humano
  - Preguntar datos necesarios para cotizar (destino, fechas, personas)
  - Si no sabe algo, invocar EscalationTool
  - Si el cliente menciona un pago, invocar EscalationTool
- [ ] **4.3** Implementar `buildRagPrompt(question, travels, contexts, history?)`:
  - Formatea travels en texto legible
  - Inyecta contexto del vector store
  - Incluye historial si existe
  - Retorna array de mensajes para el LLM
- [ ] **4.4** Implementar `buildSummaryPrompt(history)`:
  - Instrucciones para generar resumen estructurado
  - Extraer: intereses, acciones, pendientes

---

## Fase 5: Reescribir Pipeline RAG

- [ ] **5.1** Reescribir `src/core/PipeLine.ts`
- [ ] **5.2** Nuevo método `query(question, travels?, contexts?, history?)`:
  - `PromptBuilder.buildRagPrompt()` → `LlmService.generate()` → `{ answer, model }`
- [ ] **5.3** Mantener métodos de ingestión:
  - `ingestFiles()` — documentos del filesystem
  - `ingestViajes()` — travels del backend
  - `ingestDocs()` — documentos arbitrarios
- [ ] **5.4** Agregar método `generateSummary(history)`:
  - Usa `PromptBuilder.buildSummaryPrompt()` → `LlmService.generate()`

---

## Fase 6: Backend Client (simplificado)

- [ ] **6.1** Crear `src/services/BackendClient.ts`
- [ ] **6.2** Implementar métodos:
  | Método | Endpoint | Propósito |
  |--------|----------|-----------|
  | `getActiveChat(phone)` | `GET /api/rag/chats/{phone}` | Obtener chat activo de Redis |
  | `createChat(phone)` | `POST /api/rag/chats` | Crear nueva sesión |
  | `getTravels()` | `GET /api/rag/travels` | Catálogo de viajes |
  | `getCustomer(phone)` | `GET /api/rag/customers/phone/{phone}` | Datos del cliente |
  | `closeChat(phone, summary)` | `POST /api/rag/chats/phone/{phone}/close` | Cerrar + persistir |
- [ ] **6.3** Manejo de errores con `BackendClientError`
- [ ] **6.4** Timeout configurable (15s)
- [ ] **6.5** Base URL desde `BACKEND_URL` env var

---

## Fase 7: Summary Tool

- [ ] **7.1** Crear `src/tools/SummaryTool.ts`
- [ ] **7.2** Crear `src/tools/schemas.ts` con schemas Zod de tools
- [ ] **7.3** Implementar `SummarySchema`:
  ```typescript
  {
    interests: string[],       // destinos, presupuesto, fechas
    actionsTaken: string[],    // cotizaciones, viajes consultados
    pendingItems: string[],    // lo que el humano debe hacer
    needsHumanFollowup: boolean,
    contextSummary: string     // resumen libre para el backend
  }
  ```
- [ ] **7.4** Implementar `SummaryTool.generate(history, travels?)`:
  - Usa LLM para analizar historial
  - Valida salida con `SummarySchema`
  - Retorna objeto tipado

---

## Fase 7.5: Escalation Tool

- [ ] **7.5.1** Crear `src/tools/EscalationTool.ts`
- [ ] **7.5.2** Implementar `EscalationSchema`:
  ```typescript
  {
    reason: "unresolved" | "payment" | "complex_request",
    clientQuestion: string,
    context: string,          // viaje consultado, monto, etc.
    suggestedAction: string   // "verificar pago", "ofrecer descuento", etc.
  }
  ```
- [ ] **7.5.3** Cuándo se invoca (LLM decide):
  1. **unresolved** — pregunta fuera del conocimiento disponible
  2. **payment** — cliente menciona pago realizado o quiere verificar pago
  3. **complex_request** — negociación de precios, casos especiales, quejas
- [ ] **7.5.4** Integrar en el flujo de `/api/chat`:
  - LLM puede decidir invocar el tool durante la generación
  - Si se invoca, la respuesta incluye `escalate: true` + datos de escalación
  - n8n lee el flag y redirige a humano

---

## Fase 8: Endpoints de producción

- [ ] **8.1** Reescribir `src/App/Routes/RagRoutes.ts`
- [ ] **8.2** Crear endpoint `POST /api/chat`:
  - Request: `{ message, phone, history? }`
  - Flujo interno:
    1. Obtener/crear chat activo vía `BackendClient`
    2. Retrieval del vector store
    3. Fetch travels del backend
    4. Build prompt con history + travels + context
    5. LLM generation con fallback
    6. Detectar si LLM invocó EscalationTool
  - Response:
    ```json
    {
      "answer": "...",
      "sources": ["..."],
      "model": "gemini-2.5-flash",
      "chat_id": 42,
      "escalate": false
    }
    ```
    O si hay escalación:
    ```json
    {
      "answer": "...",
      "sources": [],
      "model": "gemini-2.5-flash",
      "chat_id": 42,
      "escalate": true,
      "escalation": {
        "reason": "payment",
        "clientQuestion": "...",
        "context": "...",
        "suggestedAction": "..."
      }
    }
    ```
- [ ] **8.3** Crear endpoint `POST /api/chat/summarize`:
  - Request: `{ phone }`
  - Flujo interno:
    1. Obtener chat activo de Redis vía backend
    2. Extraer historial completo
    3. `SummaryTool.generate(history)` → summary
    4. `BackendClient.closeChat(phone, summary)` → persiste + borra Redis
  - Response: `{ success: true, summary: "...", chat_id: 42 }`
- [ ] **8.4** Mantener endpoints existentes (actualizados):
  - `POST /api/rag/ingest` — ingesta documentos filesystem
  - `POST /api/rag/ingest/viajes` — refresca viajes del backend
  - `POST /api/rag/query` — búsqueda semántica (sin LLM, para debug)
- [ ] **8.5** Agregar schemas Zod para request bodies de los nuevos endpoints

---

## Fase 9: CORS + middleware + App

- [ ] **9.1** Actualizar `src/App/App.ts`
- [ ] **9.2** Agregar middleware CORS con `CORS_ORIGINS` env var
- [ ] **9.3** Agregar middleware de logging básico (método, path, status, tiempo)
- [ ] **9.4** Configurar `dotenv` en el entry point `src/index.ts`
- [ ] **9.5** Mejorar `GET /api/health`:
  - Verificar conexión a ChromaDB
  - Verificar conexión a Backend (`GET /api/rag/travels`)
  - Verificar LLM (ping rápido)
  - Response: `{ ok, chromadb, backend, llm, embeddings, timestamp }`

---

## Fase 10: Integración con Backend Spring

- [ ] **10.1** Modificar `backend/.../rag/RagGatewayService.kt`
- [ ] **10.2** Cambiar `rag.service.url` de `http://127.0.0.1:8001` (Python) a `http://127.0.0.1:3000` (TS)
- [ ] **10.3** Verificar que el contrato de `POST /api/chat` en el agente TS coincide con lo que `RagGatewayService` espera:
  - Envía: `{ phone, message }` (`WhatsAppInboundRequest`)
  - Espera: `{ answer, sources, model, chat_id }` (`RagAssistantResponse`)
- [ ] **10.4** El `RagGatewayService` llama a `/chat` — el agente TS debe responder en ese path o actualizar la URL en el gateway

---

## Fase 11: .env + documentación

- [ ] **11.1** Crear `.env.example` completo:
  ```env
  # Server
  PORT=3000
  CORS_ORIGINS=http://localhost:4321,http://localhost:8080

  # LLM (Primary: Google Gemini)
  GOOGLE_API_KEY=
  LLM_MODEL=gemini-2.5-flash
  LLM_TEMPERATURE=0.35

  # LLM (Fallback: Ollama)
  OLLAMA_HOST=http://localhost:11434
  OLLAMA_LLM_MODEL=gemma3:12b

  # Embeddings
  EMBEDDINGS_PROVIDER=google
  EMBEDDINGS_MODEL=text-embedding-004
  OLLAMA_EMBEDDINGS_MODEL=qwen3-embedding

  # Vector Store
  CHROMA_COLLECTION=knowledge-base
  CHROMA_PERSIST_DIR=./chromadb

  # Chunking
  CHUNK_SIZE=500
  CHUNK_OVERLAP=50

  # Backend
  BACKEND_URL=http://localhost:8080

  # Knowledge Base
  KNOWLEDGE_DIR=./data/knowledge
  ```
- [ ] **11.2** Actualizar `.env` actual con las nuevas variables (sin exponer API keys reales en el repo)
- [ ] **11.3** Actualizar `README.md` con:
  - Arquitectura del agente
  - Cómo ejecutar (dev + prod)
  - Endpoints disponibles
  - Variables de entorno
  - Flujo de integración con n8n y backend
- [ ] **11.4** Actualizar `package.json` scripts:
  ```json
  {
    "scripts": {
      "dev": "bun --watch src/index.ts",
      "start": "bun src/index.ts",
      "typecheck": "tsc --noEmit"
    }
  }
  ```

---

## Tools del Agente (resumen)

| Tool | Cuándo se invoca | Qué hace |
|------|-----------------|----------|
| **SummaryTool** | n8n llama `/summarize` al cerrar chat | Genera resumen estructurado con LLM |
| **EscalationTool** | LLM decide durante `/api/chat` | Señala a n8n que debe redirigir a humano |

---

## Criterios de Done Global

- [ ] `POST /api/rag/ingest/viajes` funciona sin errores de schema
- [ ] `POST /api/chat` retorna respuesta conversacional con contexto de travels
- [ ] `POST /api/chat` detecta escalación y retorna `escalate: true` cuando corresponde
- [ ] `POST /api/chat/summarize` genera summary y cierra chat en backend
- [ ] Fallback a Ollama si Gemini no responde
- [ ] Health check reporta estado de todos los componentes
- [ ] El backend puede usar el agente TS cambiando `rag.service.url`
- [ ] CORS configurado correctamente
- [ ] Documentación actualizada
