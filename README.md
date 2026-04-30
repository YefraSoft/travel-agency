# Agencia de Viajes

Sistema de gestion para una agencia de viajes que opera principalmente por WhatsApp. El MVP contempla catalogo publico, backend administrativo, agente RAG para atencion inicial y automatizaciones con n8n.

## Estructura

```txt
travel-agency/
├── backend/   # API REST — Go + Fiber + GORM
├── frontend/  # Sitio publico — Astro + Tailwind
├── rag/       # Agente conversacional — Python + LlamaIndex + ChromaDB + Ollama
├── mobile/    # App admin — Flutter, fase futura
├── infra/     # Docker Compose, SQL, n8n e infraestructura compartida
└── docs/      # Requisitos, plan, schema y especificacion de API
```

## Documentacion

- `docs/requisitos_v2.md`: requisitos funcionales aprobados.
- `docs/plan.md`: plan de desarrollo por fases.
- `docs/db_schema.md`: schema de base de datos, pendiente de completar en Fase 1.
- `docs/api_spec.md`: especificacion REST, pendiente de completar en Fase 2.

## Desarrollo

El proyecto se trabaja por fases segun `docs/plan.md`. No se debe avanzar a una fase posterior si la actual no cumple su criterio de "Done cuando".

## Levantar Servicios

La infraestructura base usa PostgreSQL 16, Redis 7 y Adminer. Copia `.env.example` a `.env` para levantar los servicios en desarrollo local.

Cuando la infraestructura base exista, el flujo esperado sera:

```bash
docker compose up
```

Adminer queda disponible en `http://localhost:18080`.

Servicios de observabilidad:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3000`
- Loki: `http://localhost:3100`
- Uptime Kuma: `http://localhost:3001`

Credenciales locales de Grafana se definen en `.env` usando `GRAFANA_ADMIN_USER` y `GRAFANA_ADMIN_PASSWORD`.

## Proyectos

- Backend: modulo Go en `backend/`, verificable con `go test ./...` y `go run ./cmd/api`.
- Frontend: proyecto Astro en `frontend/`, verificable con `npm run build`.
- RAG: entorno virtual Python en `rag/.venv`.
- Ollama: instalado en Windows; validado contra `http://localhost:11434` desde PowerShell.

Si Go no esta en el `PATH` de WSL, agrega temporalmente el binario local instalado:

```bash
export PATH="$HOME/.local/go/bin:$PATH"
```

## Reglas Importantes

- No commitear `.env` ni credenciales.
- Documentar toda variable de entorno en `.env.example`.
- No modificar migraciones SQL ya ejecutadas; crear una nueva migracion numerada.
- Mantener la logica de negocio fuera de handlers.
- El RAG no procesa pagos; siempre escala al agente humano.

## Demo Temporal RAG

Entregable de emergencia para probar el alcance del asistente conversacional antes de continuar con el plan completo.

Servicios del demo:

- Chat web: `http://127.0.0.1:4321/temp/chat`
- API RAG: `http://127.0.0.1:5000`
- Health RAG: `http://127.0.0.1:8001/health`

Ejecutar RAG:

```bash
cd rag
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 5000 --reload
```

Reindexar conocimiento demo:

```bash
curl -X POST http://127.0.0.1:8001/reindex
```

Ejecutar frontend:

```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 4321
```

El demo usa datos ficticios en `rag/data/knowledge/` y Ollama local en Windows. Si WSL no puede conectar directamente a `localhost:11434`, el servicio RAG usa PowerShell como fallback para consultar Ollama.
