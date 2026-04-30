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

## Reglas Importantes

- No commitear `.env` ni credenciales.
- Documentar toda variable de entorno en `.env.example`.
- No modificar migraciones SQL ya ejecutadas; crear una nueva migracion numerada.
- Mantener la logica de negocio fuera de handlers.
- El RAG no procesa pagos; siempre escala al agente humano.
