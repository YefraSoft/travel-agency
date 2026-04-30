# CLAUDE.md — Agencia de Viajes

Este archivo provee contexto persistente del proyecto para agentes de IA (Claude Code, Cursor, Copilot, etc.).
Léelo completo antes de cualquier tarea. Si trabajas en un submódulo específico, lee también el AGENTS.md de ese directorio.

---

## Descripción del Proyecto

Sistema de gestión para una agencia de viajes. Opera con paquetes todo incluido, cruceros y viajes a la medida.
El sistema es un monorepo con cuatro aplicaciones principales y una capa de infraestructura compartida.

Documentación completa en `docs/`. Léela antes de hacer cambios arquitectónicos.

## Contexto de Negocio

La agencia opera principalmente por WhatsApp. El flujo central del MVP es:
cliente contacta por WhatsApp → RAG responde y puede registrar una cotización →
el agente humano confirma la reserva y define el esquema de pago →
el sistema envía recordatorios automáticos hasta que se liquide el total.

Los pagos son anticipo + saldo, con montos definidos por el agente caso a caso.
No hay pasarela de pagos en línea en el MVP — todo se registra manualmente.

Las reseñas solo pueden crearlas clientes con reservas completadas.
Los costos internos y márgenes son visibles solo para el rol Administrador.

- Los clientes agendan viajes por **WhatsApp**; el RAG es el primer contacto
- Pagos: **anticipo + saldo**, montos definidos por el agente humano caso a caso
- El RAG **nunca procesa pagos** — siempre redirige al agente humano
- Las reseñas solo las pueden crear clientes con reservas en estado `completada`
- Costos internos y márgenes: visibles solo para el rol `administrador`

---

## Estructura del Monorepo

```txt
agencia-viajes/
├── backend/          # API REST — Go + Fiber + GORM
├── frontend/         # Sitio web público — Astro + Tailwind
├── rag/              # Agente conversacional — Python + LlamaIndex + ChromaDB + Ollama
├── mobile/           # App admin — Flutter (no iniciado aún)
├── infra/            # Docker Compose, Nginx, scripts, flujos n8n
│   ├── sql/          # Migraciones SQL numeradas (001_, 002_, ...)
│   └── n8n/          # Flujos exportados de n8n en JSON
└── docs/
    ├── requisitos_v2.md   # Requisitos funcionales aprobados
    ├── plan.md            # Plan de desarrollo fase a fase
    ├── db_schema.md       # Schema de BD documentado
    └── api_spec.md        # Especificación de endpoints REST
```

---

## Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Go 1.22+, Fiber v2, GORM, MySQL 8, Redis 7 |
| Frontend | Astro 4+, Tailwind CSS, TypeScript |
| RAG | Python 3.11+, LlamaIndex, ChromaDB, Ollama |
| Infra | Docker, Docker Compose, Nginx, n8n |
| Observabilidad | Prometheus, Grafana, Loki, Uptime Kuma |
| CI/CD | GitHub Actions |

---

## Reglas Globales (aplican a todos los submódulos)

### Git

- Hacer commit al cerrar cada sub-tarea del plan
- Formato de commit: `tipo(módulo): descripción corta`
  - Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `infra`, `chore`
  - Ejemplos: `feat(backend): agregar endpoint POST /viajes`, `fix(rag): corregir identificación de cliente por WhatsApp`
- Nunca hacer commit de archivos `.env` ni credenciales
- El archivo `.env.example` siempre debe estar actualizado con todas las variables (sin valores reales)

### Variables de Entorno

- Nunca hardcodear valores de configuración en el código
- Todas las variables de entorno van en `.env` (ignorado por git) y documentadas en `.env.example`
- En producción, las variables se inyectan en el servidor; nunca en el repositorio

### Migraciones de BD

- Toda modificación al schema va en un nuevo archivo SQL numerado en `infra/sql/`
- Nunca modificar un archivo de migración ya ejecutado
- Formato: `NNN_descripcion_corta.sql` (ej. `003_agregar_highlights_viaje.sql`)
- Actualizar `docs/db_schema.md` al crear una migración

### Seguridad

- Los endpoints `/admin/*` requieren JWT válido con rol apropiado
- Los endpoints públicos (`GET /viajes`, `GET /viajes/:id`, reseñas) no requieren auth
- Nunca loguear tokens JWT, contraseñas ni datos personales completos
- Las contraseñas se almacenan con bcrypt, costo mínimo 12

### Testing

- Antes de marcar una tarea como "Done", probar el caso feliz y al menos un caso de error
- Los endpoints de la API se prueban con Bruno (colección en `backend/api/`)

---

## Lo que NO debes hacer

- No modificar archivos de migración SQL ya aplicados — crear uno nuevo
- No hardcodear URLs, credenciales ni configuración en el código fuente
- No saltar fases del plan de desarrollo — respetar el orden de `docs/plan.md`
- No hacer cambios al schema de BD sin actualizar `docs/db_schema.md`
- No agregar dependencias nuevas sin verificar que no rompan el build existente
- No loguear información sensible (tokens, contraseñas, datos personales completos)
- No implementar lógica de negocio en los handlers — va en `services/`
- No procesar pagos en el RAG — el agente siempre redirige al humano para eso
- No avanzar a la siguiente fase si la actual no pasa sus criterios de "Done cuando"
- No saltar fases del plan sin decisión explícita
- No agregar dependencias sin verificar compatibilidad con el build existente
- No hardcodear URLs ni configuración — todo via variables de entorno
