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

- [x] **1.1** Renombrar `src/utils/shcemas.ts` → `src/utils/schemas.ts`
- [x] **1.2** Reescribir `ViajeSchema` para coincidir con `RagTravelResponse` del backend:
  - Campos: `id` (number), `name`, `slug`, `type`, `destination`, `origin` (nullable), `minPrice` (nullable number), `currency` (nullable string), `availablePackages` (array)
- [x] **1.3** Eliminar `ViajesResponseSchema` wrapper — el backend retorna array plano `RagTravelResponse[]`
- [x] **1.4** Actualizar `src/core/loaders/ViajesLoader.ts`:
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

- [x] **2.1** Eliminar archivos duplicados:
  - `src/core/vectors/VectorStorage.ts`
  - `src/App/services/VectorStorageService.ts`
- [x] **2.2** Renombrar `src/config/AppConfing.ts` → `src/config/AppConfig.ts`
- [x] **2.3** Actualizar todos los imports que referencian los archivos renombrados/eliminados
- [x] **2.4** Reescribir `AppConfig.ts` con variables de entorno
- [x] **2.5** Crear directorio `data/knowledge/`
- [x] **2.6** Copiar markdowns del Python RAG a `data/knowledge/`
- [x] **2.7** Eliminar `src/interfaces.ts` (vacío)

---

## Fase 3: LLM Service (solo Gemini)

- [x] **3.1** Crear `src/core/llm/LlmService.ts`
- [x] **3.2** Implementar clase `LlmService` con `ChatGoogle("gemini-2.5-flash")`
- [x] **3.3** Actualizar `src/core/Models.ts` — solo exporta embeddings
- [x] **3.4** Configurar variables de entorno en `AppConfig.ts`

---

## Fase 4: Prompt Builder

- [x] **4.1** Crear `src/core/llm/PromptBuilder.ts`
- [x] **4.2** Definir system prompt (español, agente WhatsApp agencia mexicana):
  - Siempre responder en español
  - Usar solo información proporcionada (travels + context)
  - Nunca procesar pagos — redirigir al agente humano
  - Preguntar datos necesarios para cotizar (destino, fechas, personas)
  - Si no sabe algo, invocar EscalationTool
  - Si el cliente menciona un pago, invocar EscalationTool
- [x] **4.3** Implementar `buildRagPrompt(question, travels, contexts, history?)`:
  - Formatea travels en texto legible
  - Inyecta contexto del vector store
  - Incluye historial si existe
  - Retorna array de mensajes para el LLM
- [x] **4.4** Implementar `buildSummaryPrompt(history)`:
  - Instrucciones para generar resumen estructurado
  - Extraer: intereses, acciones, pendientes

---

## Fase 5: Reescribir Pipeline RAG

- [x] **5.1** Reescribir `src/core/PipeLine.ts`
- [x] **5.2** Nuevo método `queryWithRag(question, travels, history?, k)`:
  - `PromptBuilder.buildRagPrompt()` → `LlmService.generate()` → `{ answer, model }`
- [x] **5.3** Mantener métodos de ingestión:
  - `ingestFiles()` — documentos del filesystem
  - `ingestViajes()` — travels del backend
  - `ingestDocs()` — documentos arbitrarios
- [x] **5.4** Agregar método `generateSummary(history)`:
  - Usa `PromptBuilder.buildSummaryPrompt()` → `LlmService.generate()`

---

## Fase 6: Backend Client (simplificado)

- [x] **6.1** Crear `src/services/BackendClient.ts`
- [x] **6.2** Implementar métodos
- [x] **6.3** Manejo de errores con `BackendClientError`
- [x] **6.4** Timeout configurable (15s default)
- [x] **6.5** Base URL desde `BACKEND_URL` env var
- [x] **6.6** Crear test permanente `src/services/BackendClient.test.ts`
- [x] **6.7** Corregir bug backend: enums PostgreSQL → VARCHAR (migración 002)

---

## Fase 7: Summary Tool

- [x] **7.1** Crear `src/tools/SummaryTool.ts`
- [x] **7.2** Crear `src/tools/schemas.ts` con schemas Zod de tools
- [x] **7.3** Implementar `SummarySchema`
- [x] **7.4** Implementar `SummaryTool.generate(history)`:
  - Usa LLM para analizar historial
  - Valida salida con `SummarySchema`
  - Retorna objeto tipado

---

## Fase 7.5: Escalation Tool

- [x] **7.5.1** Crear `src/tools/EscalationTool.ts`
- [x] **7.5.2** Implementar `EscalationSchema`
- [x] **7.5.3** Cuándo se invoca (LLM decide):
  1. **unresolved** — pregunta fuera del conocimiento disponible
  2. **payment** — cliente menciona pago realizado o quiere verificar pago
  3. **complex_request** — negociación de precios, casos especiales, quejas
- [x] **7.5.4** Integrar en el flujo de `/api/chat`:
  - LLM puede decidir invocar el tool durante la generación
  - Si se invoca, la respuesta incluye `escalate: true` + datos de escalación
  - n8n lee el flag y redirige a humano

---

## Fase 8: Endpoints de producción

- [x] **8.1** Crear `src/App/Routes/ChatRoutes.ts`
- [x] **8.2** Endpoint `POST /api/chat`:
  - Request: `{ message, phone, history? }`
  - Flujo: Escalation check → RAG generation → respuesta
  - Response con `escalate: true/false` + datos de escalación
- [x] **8.3** Endpoint `POST /api/chat/summarize`:
  - Request: `{ phone }`
  - Flujo: Obtener chat → generar summary → cerrar en backend
  - Response: `{ success, summary, chat_id, needsHumanFollowup }`
- [x] **8.4** Mantener endpoints existentes (ingest, query)
- [x] **8.5** Agregar schemas Zod para request bodies

---

## Fase 9: CORS + middleware + App

- [x] **9.1** Actualizar `src/App/App.ts` — CORS + logging middleware
- [x] **9.2** Agregar middleware CORS con `CORS_ORIGINS` env var
- [x] **9.3** Agregar middleware de logging básico
- [x] **9.4** Configurar `dotenv` en `src/index.ts`
- [x] **9.5** Mejorar `GET /api/health` — verifica backend + LLM

---

## Fase 10: Integración con Backend Spring

- [x] **10.1** Modificar `RagGatewayService.kt` — URL default a `http://127.0.0.1:3000/api`
- [x] **10.2** Verificar contrato: `POST /api/chat` → `RagAssistantResponse` compatible

---

## Fase 11: .env + documentación

- [x] **11.1** Crear `.env.example` completo
- [x] **11.2** Actualizar `.env.example` del root (`RAG_SERVICE_URL` → puerto 3000)
- [x] **11.3** Actualizar `README.md` con arquitectura, endpoints, variables de entorno
- [x] **11.4** Actualizar `package.json` scripts (`dev`, `start`, `test`)

---

## Tools del Agente (resumen)

| Tool | Cuándo se invoca | Qué hace |
|------|-----------------|----------|
| **SummaryTool** | n8n llama `/summarize` al cerrar chat | Genera resumen estructurado con LLM |
| **EscalationTool** | LLM decide durante `/api/chat` | Señala a n8n que debe redirigir a humano |

---

## Criterios de Done Global

- [x] `POST /api/rag/ingest/viajes` funciona sin errores de schema
- [x] `POST /api/chat` retorna respuesta conversacional con contexto de travels
- [x] `POST /api/chat` detecta escalación y retorna `escalate: true` cuando corresponde
- [x] `POST /api/chat/summarize` genera summary y cierra chat en backend
- [x] Health check reporta estado de backend y LLM
- [x] El backend puede usar el agente TS cambiando `rag.service.url` a `http://127.0.0.1:3000/api`
- [x] CORS configurado correctamente
- [x] Documentación actualizada (README, .env.example)
- [x] Tests unitarios pasando (13/13)
