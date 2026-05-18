# Go Diego Travel Agency

Sistema de gestion para una agencia de viajes que opera principalmente por WhatsApp. Paquetes todo incluido, cruceros y viajes a la medida.

## Arquitectura

```
WhatsApp → n8n (Redis buffer 60s) → POST /api/chat → Agent TS (Gemini + ChromaDB)
                                                        ↓
                                          { answer, escalate, escalation }
                                                        ↓
                          n8n bifurca: respuesta directa O escalacion
                                                        ↓
                          Dashboard Admin (Astro) ← GET /api/rag/escalations/pending
                                                        ↓
                          Agente humano responde via wa.me/{phone}
```

## Estructura

```txt
travel-agency/
├── backend/          # API REST — Spring Boot 4 + Kotlin + JPA + Flyway
├── frontend/         # Sitio publico — Astro 6 + Tailwind + React islands
├── agent/            # Agente conversacional — TypeScript + Express + Gemini + ChromaDB
├── deprecated/       # Codigo obsoleto (no eliminar hasta release v1.0)
│   ├── rag-python/   #   Antigua implementacion Python RAG
│   └── sql-legacy/   #   Migraciones SQL antiguas
├── mobile/           # App admin — Flutter (pendiente)
├── infra/            # Docker Compose, scripts, flujos n8n
│   └── n8n/          #   Flujos exportados de n8n en JSON
└── docs/
    ├── requisitos_v2.md   # Requisitos funcionales aprobados
    ├── db_schema.md       # Schema de BD documentado
    └── api_spec.md        # Especificacion de endpoints REST
```

## Stack Tecnologico

| Capa | Tecnologia |
| --- | --- |
| Backend | Spring Boot 4.0.6, Kotlin 2.2.21, JPA/Hibernate, Flyway, PostgreSQL 16, Redis 7 |
| Frontend | Astro 6+, Tailwind CSS, React 19 (islas), TypeScript |
| Agent (RAG) | TypeScript (Bun), Express 5, Google Gemini 2.5 Flash, ChromaDB, LangChain |
| Infra | Docker, Docker Compose, n8n |
| Observabilidad | Prometheus, Grafana, Loki, Uptime Kuma |

## Desarrollo

### Requisitos

- Docker + Docker Compose
- Java 24 (para build del backend)
- Node.js 20+ (para frontend)
- Bun (para agent)

### Levantar Servicios

```bash
# Copiar variables de entorno
cp .env.example .env

# Levantar infraestructura base
docker compose up -d postgres redis
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Puerto: `8080`
Swagger: `http://localhost:8080/swagger-ui.html`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Puerto: `4321`

### Agent (RAG)

```bash
cd agent
bun install
bun run dev
```

Puerto: `3002` (host), `3000` (container)

### n8n

```bash
docker compose up -d n8n
```

Puerto: `5678`

### Servicios de Observabilidad

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`
- Uptime Kuma: `http://localhost:3001`
- Adminer: `http://localhost:18080`

## Variables de Entorno

Ver `.env.example` para la lista completa. Las principales:

| Variable | Descripcion |
| --- | --- |
| `DATABASE_URL` | JDBC URL de PostgreSQL |
| `DATABASE_USERNAME` | Usuario de PostgreSQL |
| `DATABASE_PASSWORD` | Contrasena de PostgreSQL |
| `GOOGLE_API_KEY` | API key de Google para Gemini |
| `RAG_API_KEY` | Clave para autenticar servicios internos |
| `PUBLIC_API_URL` | URL del backend (frontend) |
| `PUBLIC_WHATSAPP_NUMBER` | Numero de WhatsApp de la agencia |
| `ADMIN_DASHBOARD_PASSWORD` | Contrasena server-side del dashboard admin |

## Comunicacion Interna

Todos los servicios internos se comunican mediante `X-API-Key`:

```
n8n ──[X-API-Key]──→ Agent (POST /api/chat)
Backend ──[X-API-Key]──→ Agent (POST /api/chat)
Frontend ──→ Backend (endpoints publicos /admin)
```

## Reglas Importantes

- No commitear `.env` ni credenciales.
- Documentar toda variable de entorno en `.env.example`.
- No modificar migraciones Flyway ya ejecutadas; crear una nueva numerada.
- Mantener la logica de negocio fuera de controllers (usar services).
- El RAG no procesa pagos; siempre escala al agente humano.
- Archivos en `deprecated/` se eliminan hasta release v1.0.

## Documentacion

- `docs/requisitos_v2.md`: requisitos funcionales aprobados.
- `docs/db_schema.md`: schema de base de datos.
- `docs/api_spec.md`: especificacion REST de la API.
- `plan-final.md`: plan de desarrollo por fases.
- `AGENTS.md`: guia para agentes de IA.

## Usuarios de Prueba

| Email | Contrasena | Rol |
| --- | --- | --- |
| `admin@godiego.com` | `Admin123!` | ADMIN |
| `agente@godiego.com` | `Agent123!` | AGENT |
| `vendedor@godiego.com` | `Seller123!` | SELLER |

## Dashboard Admin

URL: `http://localhost:4321/admin/dashboard`
Contrasena: configurar `ADMIN_DASHBOARD_PASSWORD` en `.env` o `frontend/.env`.

## Licencia

Propietario — Go Diego Travel Agency
