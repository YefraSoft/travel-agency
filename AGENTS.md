# AGENTS.md — Go Diego Travel Agency

Este archivo provee contexto persistente del proyecto para agentes de IA.
Léelo completo antes de cualquier tarea. Si trabajas en un submódulo específico, lee también el AGENTS.md de ese directorio.

---

## Descripción del Proyecto

Sistema de gestión para una agencia de viajes llamada "Go Diego". Opera con paquetes todo incluido, cruceros y viajes a la medida.
El sistema es un monorepo con tres aplicaciones principales y una capa de infraestructura compartida.

Documentación completa en `docs/` y `plan-final.md`. Léelos antes de hacer cambios arquitectónicos.

## Contexto de Negocio

La agencia opera principalmente por WhatsApp. El flujo central del MVP es:
cliente contacta por WhatsApp → RAG responde y puede registrar una cotización →
si el cliente menciona pagos o solicitudes complejas, el RAG escala la conversación →
el agente humano recibe la escalación en el dashboard y responde por WhatsApp.

Los pagos son anticipo + saldo, con montos definidos por el agente caso a caso.
No hay pasarela de pagos en línea en el MVP — todo se registra manualmente.

Las reseñas solo pueden crearlas clientes con reservas completadas.
Los costos internos y márgenes son visibles solo para el rol Administrador.

- Los clientes agendan viajes por **WhatsApp**; el RAG es el primer contacto
- Pagos: **anticipo + saldo**, montos definidos por el agente humano caso a caso
- El RAG **nunca procesa pagos** — siempre redirige al agente humano
- Las escalaciones por pago/solicitud compleja van al **dashboard del agente humano**
- El agente humano responde al cliente via **WhatsApp Web** (`wa.me/{phone}`)
- Las reseñas solo las pueden crear clientes con reservas en estado `completada`
- Costos internos y márgenes: visibles solo para el rol `administrador`

---

## Estructura del Monorepo

```txt
travel-agency/
├── backend/          # API REST — Spring Boot 4 + Kotlin + JPA + Flyway
├── frontend/         # Sitio web público — Astro 6 + Tailwind + React islands
├── agent/            # Agente conversacional — TypeScript + Express + Gemini + ChromaDB
├── deprecated/       # Código obsoleto (no eliminar hasta release v1.0)
│   ├── rag-python/   #   Antigua implementación Python RAG (reemplazada por agent/)
│   └── sql-legacy/   #   Migraciones SQL antiguas (reemplazadas por Flyway)
├── mobile/           # App admin — Flutter (no iniciado aún)
├── test/             # Archivos de testing generados durante desarrollo
├── infra/            # Docker Compose, scripts, flujos n8n
│   └── n8n/          #   Flujos exportados de n8n en JSON
└── docs/
    ├── requisitos_v2.md   # Requisitos funcionales aprobados
    ├── db_schema.md       # Schema de BD documentado
    └── api_spec.md        # Especificación de endpoints REST
```

---

## Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| Backend | Spring Boot 4.0.6, Kotlin 2.2.21, JPA/Hibernate, Flyway, PostgreSQL 16, Redis 7 |
| Frontend | Astro 6+, Tailwind CSS, React 19 (islas), TypeScript |
| Agent (RAG) | TypeScript (Bun), Express 5, Google Gemini 2.5 Flash, ChromaDB, LangChain |
| Infra | Docker, Docker Compose, n8n |
| Observabilidad | Prometheus, Grafana, Loki, Uptime Kuma |
| CI/CD | GitHub Actions |

---

## Arquitectura de Comunicación Interna

Todos los servicios internos se comunican mediante **API_KEY** (`RAG_API_KEY`):

```
n8n ──[X-API-Key]──→ Agent (POST /api/chat)
Backend ──[X-API-Key]──→ Agent (POST /chat)
Frontend ──→ Backend (endpoints públicos /admin)
```

- El header `X-API-Key` se valida en el middleware del Agent
- `/api/health` del Agent es público (necesario para healthcheck de Docker)
- El frontend consume la API del backend directamente (sin API_KEY para endpoints públicos)

---

## Reglas Globales (aplican a todos los submódulos)

### Git

- Generar un mensaje de commit al cerrar cada sub-tarea del plan, **pero no ejecutar el commit**
- Guardar el mensaje generado en `./.git-commits.log`
- Formato de commit: `tipo(módulo): descripción corta`
  - Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `infra`, `chore`
  - Ejemplos:
    - `feat(backend): agregar endpoint POST /api/rag/escalations`
    - `fix(agent): corregir chat_id null en respuesta`
- Nunca hacer commit de archivos `.env` ni credenciales
- El archivo `.env.example` siempre debe estar actualizado con todas las variables (sin valores reales)
- Archivos en `deprecated/` se agregan al `.gitignore`, no se eliminan hasta el release v1.0

### Variables de Entorno

- Nunca hardcodear valores de configuración en el código
- Todas las variables de entorno van en `.env` (ignorado por git) y documentadas en `.env.example`
- En producción, las variables se inyectan en el servidor; nunca en el repositorio

### Migraciones de BD

- Toda modificación al schema va en un nuevo archivo Flyway en `backend/src/main/resources/db/migration/`
- Formato Flyway: `V{N}__descripcion_corta.sql` (ej. `V3__add_escalations.sql`)
- Nunca modificar un archivo de migración ya ejecutado
- Actualizar `docs/db_schema.md` al crear una migración

### Seguridad

- Los endpoints `/api/admin/*` requieren autenticación (JWT en futuro, contraseña simple para demo)
- Los endpoints públicos (`GET /api/travels`, `GET /api/travels/:id`, reseñas) no requieren auth
- El Agent valida `X-API-Key` en todos los endpoints excepto `/api/health`
- Nunca loguear tokens, contraseñas ni datos personales completos
- Las contraseñas se almacenan con bcrypt, costo mínimo 12
- La `RAG_API_KEY` se genera aleatoriamente y nunca se commitea

### Testing

- Antes de marcar una tarea como "Done", probar el caso feliz y al menos un caso de error
- Los archivos de testing generados durante el desarrollo van en la carpeta `/test/`
- Los endpoints de la API se prueban con curl o scripts en `/test/`
- Los servicios los ejecuta el usuario; si necesitas correr uno para testing, ejecútalo y luego bájalo
- El usuario ejecuta los servicios permanentemente después de completar el testing

### Flujo de Trabajo por Fases

- **Al final de cada fase, debes pedir autorización al usuario antes de continuar con la siguiente**
- Testear cada fase y reportar en el chat los detalles del testing
- **No generar reportes escritos** a menos que se te pida explícitamente
- Reportar resultados de testing directamente en el chat de forma concisa

---

## Lo que NO debes hacer

- No modificar archivos de migración SQL ya aplicados — crear uno nuevo
- No hardcodear URLs, credenciales ni configuración en el código fuente
- No saltar fases del plan de desarrollo — respetar el orden de `plan-final.md`
- No hacer cambios al schema de BD sin actualizar `docs/db_schema.md`
- No agregar dependencias nuevas sin verificar que no rompan el build existente
- No loguear información sensible (tokens, contraseñas, datos personales completos)
- No implementar lógica de negocio en los controllers — va en `services/`
- No procesar pagos en el RAG — el agente siempre redirige al humano para eso
- No avanzar a la siguiente fase sin autorización explícita del usuario
- No agregar dependencias sin verificar compatibilidad con el build existente
- No hardcodear URLs ni configuración — todo via variables de entorno
- No eliminar archivos de `deprecated/` hasta la Fase 7 (release v1.0)
- No ejecutar servicios permanentemente — el usuario los gestiona

---

## Plan de Desarrollo

El plan detallado está en `plan-final.md` con 7 fases:

1. **Fase 1**: Deprecated + Migraciones consolidadas
2. **Fase 2**: API_KEY + Seguridad interna
3. **Fase 3**: Backend — Escalaciones + endpoints faltantes
4. **Fase 4**: Frontend Astro — Landing + Dashboard
5. **Fase 5**: n8n + Integración final
6. **Fase 6**: Documentación
7. **Fase 7**: Release v1.0
