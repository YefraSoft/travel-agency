# Plan Final de Unificación — "Go Diego" Travel Agency

## Contexto Actual

### Arquitectura Real
```
WhatsApp → n8n (Redis buffer 60s) → POST /api/chat → Agent TS (Gemini + ChromaDB)
                                                        ↓
                                          { answer, escalate, escalation }
                                                        ↓
                          n8n bifurca: respuesta directa O escalación
                                                        ↓
                          Dashboard Admin (Astro) ← GET /api/admin/escalations
                                                        ↓
                          Agente humano responde via wa.me/{phone}
```

### Componentes
| Servicio | Tech | Puerto | Estado |
|----------|------|--------|--------|
| Backend | Spring Boot 4.0.6 + Kotlin + JPA + Flyway | 8080 | ✅ 52 archivos, 25 endpoints |
| Agent | TypeScript + Express + Gemini + ChromaDB | 3000 (host: 3002) | ✅ 21 archivos, pipeline completo |
| n8n | Workflow automation | 5678 | ⚠️ Workflows definidos, no importados |
| Frontend | Astro + React (islas) | 4321 | ❌ Esqueleto vacío |
| Postgres | 16-alpine | 5432 | ✅ Con ENUMs (V1) |
| Redis | 7-alpine | 6379 | ✅ Cache de chats |

### Problemas Detectados
1. Dos RAGs: `rag/` (Python/Ollama) y `agent/` (TS/Gemini). Solo `agent/` está en Docker
2. Flyway V1 usa ENUMs, pero entities usan VARCHAR. Migraciones `infra/sql/002_remove_enums.sql` no están en path de Flyway
3. Agent no tiene API_KEY — todos los endpoints abiertos
4. n8n no envía API_KEY al llamar al agent
5. Backend no tiene endpoint de escalaciones — el dashboard no tiene de dónde leer
6. `chat_id` siempre es `null` en respuestas del agent
7. Model name duplicado: `gemini-gemini-2.5-flash`
8. pom.xml dice Java 23, Dockerfile usa JDK 26
9. API key real en `.env` — riesgo de seguridad
10. Frontend vacío — sin landing, sin dashboard, sin Tailwind

---

## FASE 1: Deprecated + Migraciones Consolidadas

### 1.1 Crear carpeta `deprecated/`
```
deprecated/
├── rag-python/          ← mover todo contenido de rag/
└── sql-legacy/          ← mover infra/sql/001_*, 002_*, 003_*, 004_*
                         ← mover backend/.../V1__db_schema.sql (ENUMs)
```

### 1.2 `.gitignore` raíz — agregar:
```
rag/
infra/sql/00*.sql
deprecated/
```

### 1.3 Nueva migración Flyway `V1__full_schema.sql`
Ubicación: `backend/src/main/resources/db/migration/V1__full_schema.sql`

Contenido consolidado (VARCHAR, no ENUMs):
- **12 tablas**: users, customers, travels, companions, travel_packages, travel_highlights, travel_includes, travel_images, bookings, booking_companions, payments, reviews, chats
- **VARCHAR para roles/tipos** en lugar de ENUMs (coherente con entities Kotlin)
- **Incluir `is_active`** en users table
- **Todos los índices** (18 total)
- **Triggers** `set_updated_at()` para customers, travels, bookings
- **Constraints** FK, UNIQUE, CHECK

### 1.4 Nueva migración Flyway `V2__seed_data.sql`
Ubicación: `backend/src/main/resources/db/migration/V2__seed_data.sql`

Contenido:
- 3 users con **bcrypt hashes reales** (generar con costo 12):
  - `admin@godiego.com` / `Admin123!` → rol ADMIN
  - `agente@godiego.com` / `Agent123!` → rol AGENT
  - `vendedor@godiego.com` / `Seller123!` → rol SELLER
- 3 customers con teléfonos reales de prueba
- 3 travels con packages, highlights, includes, images
- 2 bookings con payments
- 1 review
- 1 chat de ejemplo

### 1.5 Corregir versiones
- `pom.xml`: cambiar `<java.version>23</java.version>` → `<java.version>26</java.version>`
- Verificar que Spring Boot 4.0.6 sea estable; si no, bajar a 3.4.x

### 1.6 Seguridad `.env`
- Reemplazar `GOOGLE_API_KEY=AIzaSy...` → `GOOGLE_API_KEY=tu_api_key_aqui`
- Generar `RAG_API_KEY` aleatoria (32 chars hex)
- Agregar a `.env.example` todas las variables faltantes

**Criterios de Done**:
- [ ] Carpeta `deprecated/` creada con contenido movido
- [ ] `.gitignore` actualizado
- [ ] `V1__full_schema.sql` creada y válida
- [ ] `V2__seed_data.sql` creada con bcrypt real
- [ ] `pom.xml` Java version alineada con Dockerfile
- [ ] `.env` sin keys reales, `.env.example` completo
- [ ] Backend arranca limpio con BD nueva y aplica migraciones

---

## FASE 2: API_KEY + Seguridad Interna

### 2.1 Agent — Middleware API_KEY
Archivo nuevo: `agent/src/middleware/AuthMiddleware.ts`

Aplicar en `App.ts` a:
- `/api/chat`
- `/api/chat/summarize`
- `/api/rag/ingest`
- `/api/rag/ingest/viajes`
- `/api/rag/query`

**NO aplicar a**: `/api/health` (necesario para healthcheck)

### 2.2 Agent — `.env` y `.env.example`
Agregar:
```
RAG_API_KEY=tu_clave_aqui
```

### 2.3 n8n — Agregar API_KEY al workflow
En `infra/n8n/workflows/whatsapp-agent.json`, nodo "Call Agent":
```json
"headers": {
  "X-API-Key": "={{ $env.RAG_API_KEY }}"
}
```

### 2.4 Backend — `RagGatewayService` envía API_KEY
Modificar `RagGatewayService.kt` para incluir header `X-API-Key` en requests al agent.

### 2.5 `application.properties` — agregar:
```properties
rag.api.key=${RAG_API_KEY:}
```

### 2.6 `docker-compose.yml` — agregar `RAG_API_KEY` a agent y n8n

### 2.7 Fix model name duplicado
`agent/src/core/llm/LlmService.ts`: `model: LLM_CONFIG.model` (eliminar prefijo `gemini-`)

**Criterios de Done**:
- [ ] Agent rechaza requests sin API_KEY válida (401)
- [ ] Agent acepta requests con API_KEY correcta
- [ ] `/api/health` sigue funcionando sin auth
- [ ] n8n workflow tiene header X-API-Key
- [ ] Backend envía X-API-Key al agent
- [ ] Model name en respuestas es `gemini-2.5-flash` (no duplicado)

---

## FASE 3: Backend — Escalaciones + Endpoints Faltantes

### 3.1 Nueva Entity `Escalation`
Archivo: `backend/src/main/kotlin/com/api/travel_api/escalation/model/Escalation.kt`

Campos: id, chat_id, phone, reason, client_question, context, suggested_action, status, attended_by, attended_at, resolved_at, created_at

### 3.2 Repository, Service, Controller
- `EscalationRepository`: findByStatusOrderByCreatedAtDesc, findByPhoneOrderByCreatedAtDesc
- `EscalationService`: create, listPending, getById, updateStatus
- `EscalationController`:
  - `POST /api/rag/escalations` — crear escalación (desde n8n)
  - `GET /api/rag/escalations/pending` — listar pendientes (para dashboard)
  - `GET /api/rag/escalations/{id}` — detalle
  - `PATCH /api/rag/escalations/{id}/status` — cambiar estado

### 3.3 Fix `chat_id` en Agent
Modificar `POST /api/chat` en `ChatRoutes.ts`:
1. Llamar `backendClient.getActiveChat(phone)`
2. Si no existe, `backendClient.createChat(phone)`
3. Retornar `chat_id: activeChat.id` en la respuesta

### 3.4 Endpoint `GET /api/rag/chats/active`
Agregar en `RagController.kt` y `ChatService.kt` para listar chats sin cerrar.

### 3.5 Migración Flyway `V3__add_escalations.sql`
Crear tabla `escalations` en Flyway.

**Criterios de Done**:
- [ ] POST /api/rag/escalations crea registro correctamente
- [ ] GET /api/rag/escalations/pending retorna solo pendientes
- [ ] PATCH /api/rag/escalations/{id}/status cambia estado
- [ ] Agent retorna chat_id real (no null)
- [ ] GET /api/rag/chats/active retorna chats abiertos
- [ ] Migración V3 aplicada sin errores

---

## FASE 4: Frontend Astro — "Go Diego"

### 4.1 Setup
- Instalar Tailwind: `npx astro add tailwind`
- Configurar React islands (ya está `@astrojs/react`)
- Estructura de carpetas:
```
frontend/src/
├── layouts/BaseLayout.astro
├── components/ (Header, Footer, Hero, etc.)
├── islands/ (TravelCards, ChatWidget, AdminDashboard)
└── pages/
    ├── index.astro
    ├── viajes/[slug].astro
    └── admin/dashboard.astro
```

### 4.2 Landing Page (`index.astro`)
- Header: Logo "Go Diego", nav, CTA
- Hero: Imagen, título, subtítulo, botón WhatsApp
- Servicios: 3 cards (Todo incluido, Cruceros, A la medida)
- Viajes destacados: Isla React `TravelCards` → `GET /api/travels`
- Testimonios: Estáticos
- Chat widget: Isla React `ChatWidget`
- Footer: Contacto, redes, legales
- SEO: title, meta description, Open Graph, Schema.org JSON-LD

### 4.3 Isla React: `ChatWidget.tsx`
Flujo:
1. Botón flotante "💬 Chatea con nosotros"
2. Modal con input de teléfono
3. Envía a backend `POST /api/rag/whatsapp/messages`
4. Polling cada 2s para respuestas
5. Si `escalate: true` → mensaje de transferencia + botón WhatsApp → `wa.me/{numero}?text=...`

### 4.4 Dashboard Admin (`/admin/dashboard.astro`)
Protección: contraseña simple via cookie/session (`ADMIN_DASHBOARD_PASSWORD`).

Isla React `AdminDashboard.tsx`:
- Panel izquierdo: Tabla de escalaciones pendientes (`GET /api/rag/escalations/pending`)
- Panel derecho: Click en fila → abre chat (`GET /api/rag/chats/{phone}`)
- Input texto + botón "Responder por WhatsApp" → abre `wa.me/{phone}?text={mensaje}`
- Botón "Marcar como resuelta" → `PATCH /api/rag/escalations/{id}/status`

### 4.5 Variables de entorno frontend
`frontend/.env`:
```
PUBLIC_API_URL=http://localhost:8080
PUBLIC_WHATSAPP_NUMBER=+521XXXXXXXXXX
```

### 4.6 Docker-compose — agregar servicio frontend

**Criterios de Done**:
- [ ] Landing page carga con SEO correcto
- [ ] Viajes se muestran dinámicamente desde API
- [ ] Chat widget funciona: teléfono → chat → respuesta RAG
- [ ] Escalación muestra botón WhatsApp
- [ ] Dashboard accesible con contraseña
- [ ] Dashboard muestra escalaciones pendientes
- [ ] Click en escalación abre chat
- [ ] Botón WhatsApp abre wa.me correctamente
- [ ] Marcar como resuelta funciona

---

## FASE 5: n8n + Integración Final

### 5.1 Script auto-import workflows
`infra/n8n/import-workflows.sh` — importa JSONs via n8n API al iniciar.

### 5.2 n8n workflow — agregar nodo POST escalación
Después de "Check Escalate" (rama true), antes de "Send Escalation":
- POST → `{{BACKEND_URL}}/api/rag/escalations`
- Body: phone, reason, clientQuestion, context, suggestedAction
- Header: X-API-Key

### 5.3 Fix formato mensajes en n8n
Code node después de "Get Chat History":
```javascript
const history = $json.chatHistory.map(msg => ({
  role: msg.type === "HUMAN" ? "user" : "assistant",
  content: msg.content
}));
```

### 5.4 Agregar `phone` al body del Call Agent

**Criterios de Done**:
- [ ] Workflows se importan automáticamente al iniciar n8n
- [ ] Escalaciones se registran en backend via n8n
- [ ] Formato mensajes correcto (user/assistant)
- [ ] Phone se envía al agent en cada request

---

## FASE 6: Documentación

### 6.1 Actualizar `AGENTS.md` raíz
- Stack real: Kotlin/Spring Boot, no Go/Fiber
- Sección API_KEY
- Flujo de escalaciones

### 6.2 Actualizar `docs/db_schema.md`
- Nueva tabla `escalations`
- Eliminar referencia a `rag_chats`
- Tipos VARCHAR

### 6.3 Actualizar `docs/api_spec.md`
- Endpoints de escalaciones
- API_KEY headers

### 6.4 Actualizar `README.md`
- Stack real
- Setup con Docker Compose
- Variables de entorno

**Criterios de Done**:
- [ ] AGENTS.md actualizado
- [ ] db_schema.md actualizado
- [ ] api_spec.md actualizado
- [ ] README.md actualizado

---

## FASE 7: Release v1.0

### 7.1 Limpiar BD
```bash
docker compose down -v
docker compose up -d postgres
# Flyway aplica V1 y V2 limpias
```

### 7.2 Verificar todos los servicios
```bash
docker compose ps  # todos healthy
curl http://localhost:8080/actuator/health
curl http://localhost:3002/api/health
curl http://localhost:5678/
```

### 7.3 Test end-to-end
1. Landing page carga → viajes se muestran
2. Chat widget → ingresa teléfono → chatea con RAG
3. Dice "quiero pagar" → RAG escala → aparece en dashboard
4. Dashboard → click en escalación → abre chat → responde por WhatsApp
5. Marca como resuelta → desaparece de pendientes

### 7.4 Eliminar `deprecated/`
```bash
rm -rf deprecated/
```

### 7.5 Tag
```bash
git add .
git commit -m "release: v1.0.0 - Go Diego MVP"
git tag v1.0.0
```

**Criterios de Done**:
- [ ] BD limpia, migraciones aplicadas sin errores
- [ ] Todos los servicios healthy
- [ ] Test E2E pasa completo
- [ ] Carpeta deprecated eliminada
- [ ] Tag v1.0.0 creado

---

## Orden de Ejecución

| Orden | Fase | Dependencias | Tiempo Est. |
|-------|------|-------------|-------------|
| 1 | Fase 1 (Deprecated + Migraciones) | Ninguna | 2h |
| 2 | Fase 2 (API_KEY) | Fase 1 | 1h |
| 3 | Fase 3 (Backend Escalaciones) | Fase 2 | 3h |
| 4 | Fase 5 (n8n Integration) | Fase 3 | 1h |
| 5 | Fase 4 (Frontend Astro) | Fase 3 | 6h |
| 6 | Fase 6 (Documentación) | Todas | 2h |
| 7 | Fase 7 (Release) | Todas | 1h |

**Total estimado: ~16 horas**
