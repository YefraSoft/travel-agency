# Plan de Desarrollo — Agencia de Viajes

**Versión:** 1.0  
**Fecha:** 2026-04-29  
**Desarrollador:** Solo  
**Gestión:** Git local + este chat como bitácora técnica

---

## Convenciones

- Cada fase produce entregables concretos y verificables antes de avanzar
- Cada tarea tiene un criterio de "hecho" (Definition of Done)
- Las fases de infraestructura y BD se hacen una sola vez; el resto es incremental
- El prefijo `[CHAT]` indica que la tarea se trabaja directamente en este chat

---

## Estructura de Carpetas del Proyecto

```txt
travel-agency/
├── AGENTS.md         # Contexto global mínimo 
├── CLAUDE.md         # Contexto global mínimo
├── README.md         # Descripción y guía inicial del proyecto
├── backend/          # Go + Fiber
│   └── AGENTS.md     # Contexto específico del backend
├── frontend/         # Astro
│   └── AGENTS.md     # Contexto específico del frontend
├── rag/              # LlamaIndex + ChromaDB + Ollama
│   └── AGENTS.md     # Contexto específico del RAG
├── mobile/           # Flutter (fase futura)
├── infra/            # Docker Compose, configs, scripts
│   ├── AGENTS.md     # Contexto específico de infra
│   ├── sql/          # Migraciones SQL numeradas (001_, 002_, ...)
│   └── n8n/          # Flujos exportados de n8n en JSON
└── docs/
    ├── requisitos_v2.md
    ├── plan.md       ← este archivo
    ├── db_schema.md
    └── api_spec.md
```

---

## FASE 0 — Infraestructura Base

> Objetivo: tener el entorno de desarrollo funcionando antes de escribir una línea de negocio.

### 0.1 Repositorio y estructura

- [x] Crear repositorio Git local con la estructura de carpetas definida arriba
- [x] Crear `.gitignore` global (Go, Node, Python, env files)
- [x] Crear `README.md` raíz con descripción del proyecto y cómo levantar cada servicio
- [x] Commit inicial

**Done cuando:** `git log` muestra el commit inicial con la estructura completa.

### 0.2 Docker Compose base

- [x] `docker-compose.yml` con los servicios base:
  - PostgreSQL 16
  - Redis 7
  - Adminer (cliente visual de BD, solo dev)
- [x] Variables de entorno en `.env` (nunca en el compose directamente)
- [x] Verificar que los tres servicios levantan con `docker compose up`

> Verificado localmente: PostgreSQL acepta conexiones, Redis responde `PING` y Adminer abre en `http://localhost:18080`.

**Done cuando:** PostgreSQL acepta conexiones, Redis responde a `PING`, Adminer abre en el browser.

### 0.3 Docker Compose — Observabilidad

- [x] Agregar al compose:
  - Prometheus
  - Grafana
  - Loki
  - Uptime Kuma
- [x] Configurar datasources de Grafana (Prometheus + Loki) vía provisioning

> Verificado localmente: Prometheus abre en `http://localhost:9090`, Grafana responde en `http://localhost:3000`, Loki responde `ready` en `http://localhost:3100/ready` y Uptime Kuma abre en `http://localhost:3001`.

**Done cuando:** Grafana abre, muestra Prometheus y Loki como datasources activos.

### 0.4 Inicializar proyectos

- [x] `go mod init` en `/backend`
- [x] `npm create astro@latest` en `/frontend`
- [x] `python -m venv .venv` en `/rag`
- [x] Instalar Ollama localmente y hacer `ollama pull` del modelo elegido

> Verificado localmente: backend Go compila y arranca en modo mínimo, frontend Astro compila con `npm run build`, RAG tiene `.venv` creado y Ollama responde desde Windows con modelos disponibles.

**Done cuando:** cada proyecto compila/arranca sin errores en modo vacío.

---

## FASE 1 — Diseño e Implementación de la Base de Datos
>
> Objetivo: schema completo, migrado y validado antes de escribir un solo endpoint.

### 1.1 Diseño del schema `[CHAT]`

- [ ] Revisar requisitos v2.0 tabla por tabla
- [ ] Definir todas las entidades, relaciones y tipos de dato
- [ ] Generar diagrama ER
- [ ] Generar el archivo `db_schema.md` con definición de cada tabla
- [ ] Revisión y aprobación del schema

**Done cuando:** el schema está documentado y aprobado en `docs/db_schema.md`.

### 1.2 Script de migración inicial

- [ ] Escribir `infra/sql/001_initial_schema.sql` con todas las tablas
- [ ] Incluir índices para las consultas más frecuentes
- [ ] Incluir datos semilla (`002_seed.sql`): un admin, un agente, 2-3 viajes de prueba

**Done cuando:** el script corre sin errores en el PostgreSQL del compose y las tablas existen con los datos semilla.

### 1.3 Configurar GORM en el backend

- [ ] Instalar dependencias: `gorm.io/gorm`, `gorm.io/driver/postgres`
- [ ] Crear structs Go que mapeen cada tabla
- [ ] Verificar conexión y que GORM puede hacer un SELECT básico

**Done cuando:** el backend arranca, conecta a PostgreSQL y loguea "DB connected" sin errores.

---

## FASE 2 — Backend: CRUD y Endpoints Core
>
> Objetivo: API REST completa para los módulos principales, lista para ser consumida por el frontend y el RAG.

### 2.1 Estructura del proyecto Go

- [ ] Definir estructura de carpetas interna: `cmd/`, `internal/`, `pkg/`
- [ ] Configurar Fiber con middlewares base: logger, CORS, recover
- [ ] Configurar variables de entorno con `godotenv`
- [ ] Exponer endpoint `/health` y `/metrics` (Prometheus)

**Done cuando:** `GET /health` retorna 200 y `/metrics` expone datos a Prometheus.

### 2.2 Autenticación `[CHAT]`

- [ ] Endpoint `POST /auth/login` → retorna JWT
- [ ] Middleware de autenticación JWT
- [ ] Middleware de autorización por rol (admin / agente)
- [ ] Endpoint `POST /auth/refresh`
- [ ] Hash de contraseñas con bcrypt

**Done cuando:** un usuario puede hacer login, recibe JWT, y rutas protegidas rechazan requests sin token válido.

### 2.3 Módulo: Viajes `[CHAT]`

- [ ] `GET    /viajes` — listado público con filtros
- [ ] `GET    /viajes/:id` — detalle público
- [ ] `POST   /admin/viajes` — crear viaje
- [ ] `PUT    /admin/viajes/:id` — editar viaje
- [ ] `DELETE /admin/viajes/:id` — desactivar viaje (soft delete)
- [ ] `POST   /admin/viajes/:id/imagenes` — subir imágenes
- [ ] `POST   /admin/viajes/:id/highlights` — gestionar highlights
- [ ] `POST   /admin/viajes/:id/clonar` — clonar viaje

**Done cuando:** CRUD completo probado con Bruno / Postman, imágenes guardadas en `/uploads`.

### 2.4 Módulo: Clientes `[CHAT]`

- [ ] `GET    /admin/clientes` — listado con búsqueda
- [ ] `GET    /admin/clientes/:id` — detalle + historial
- [ ] `POST   /admin/clientes` — crear cliente
- [ ] `PUT    /admin/clientes/:id` — editar cliente
- [ ] `GET    /admin/clientes/whatsapp/:numero` — buscar por WhatsApp
- [ ] `POST   /admin/clientes/:id/notas` — agregar nota interna
- [ ] `DELETE /admin/clientes/:id/notas/:nota_id` — eliminar nota

**Done cuando:** CRUD completo probado, búsqueda por WhatsApp detecta duplicados correctamente.

### 2.5 Módulo: Reservas `[CHAT]`

- [ ] `GET    /admin/reservas` — listado con filtros (estado, viaje, cliente)
- [ ] `GET    /admin/reservas/:id` — detalle completo
- [ ] `POST   /admin/reservas` — crear reserva
- [ ] `PUT    /admin/reservas/:id` — editar reserva
- [ ] `PATCH  /admin/reservas/:id/estado` — cambiar estado (con lógica de cupo)
- [ ] `POST   /admin/reservas/:id/notas` — agregar nota

**Done cuando:** cambio de estado a "confirmada" decrementa cupo; cancelación lo libera.

### 2.6 Módulo: Pagos `[CHAT]`

- [ ] `GET    /admin/reservas/:id/pagos` — historial de pagos de una reserva
- [ ] `POST   /admin/reservas/:id/pagos` — registrar pago
- [ ] `DELETE /admin/pagos/:id` — anular pago
- [ ] `GET    /admin/viajes/:id/resumen-financiero` — resumen por viaje
- [ ] `GET    /admin/cobranza/alertas` — pagos próximos y vencidos

**Done cuando:** el saldo pendiente se recalcula correctamente tras cada pago; las alertas retornan los casos correctos.

### 2.7 Módulo: Reseñas `[CHAT]`

- [ ] `POST   /reseñas` — crear reseña (requiere reserva completada)
- [ ] `GET    /viajes/:id/reseñas` — listar reseñas públicas de un viaje

**Done cuando:** un cliente sin reserva completada no puede crear reseña (validación en backend).

### 2.8 Jobs asincrónicos (Redis + asynq)

- [ ] Configurar asynq worker
- [ ] Job: `CheckPaymentDeadlines` — se ejecuta diariamente, genera alertas
- [ ] Job: `SendPaymentReminder` — envía mensaje a n8n para que dispare WhatsApp

**Done cuando:** el job corre en el scheduler, detecta pagos próximos/vencidos y los encola.

---

## FASE 3 — RAG: Agente Conversacional
>
> Objetivo: agente funcional que responde por WhatsApp, agenda cotizaciones y envía recordatorios.

### 3.1 Setup del entorno RAG

- [ ] Instalar dependencias: `llama-index`, `chromadb`, `langchain` (según decisión final)
- [ ] Agregar Ollama y ChromaDB al `docker-compose.yml`
- [ ] Elegir y descargar modelo base (recomendado: `llama3` o `mistral`)
- [ ] Verificar inferencia local con un prompt simple

**Done cuando:** una llamada a Ollama desde Python retorna una respuesta coherente.

### 3.2 Fuentes de conocimiento (indexación) `[CHAT]`

- [ ] Definir qué documentos indexar: FAQs de destinos, políticas de la agencia, info de visas
- [ ] Crear pipeline de indexación en ChromaDB
- [ ] Crear endpoint interno `POST /rag/reindex` para re-indexar cuando cambien los datos
- [ ] Conectar el RAG a la API del backend para consultar viajes en tiempo real

**Done cuando:** el RAG responde correctamente preguntas sobre viajes usando datos de la BD.

### 3.3 Agente conversacional `[CHAT]`

- [ ] Implementar lógica de identificación de cliente por número de WhatsApp
- [ ] Implementar intención: consulta de viajes
- [ ] Implementar intención: registro de cotización
- [ ] Implementar intención: consulta de estado de reserva/pago
- [ ] Implementar intención: pregunta general de destino
- [ ] Implementar fallback: escalar a agente humano
- [ ] Registrar todas las conversaciones en BD

**Done cuando:** el agente maneja las 5 intenciones en un flujo de conversación completo.

### 3.4 Integración n8n ↔ RAG `[CHAT]`

- [ ] Agregar n8n al `docker-compose.yml`
- [ ] Crear flujo n8n: recibe webhook de WhatsApp Business → filtra spam → enruta al RAG
- [ ] Crear flujo n8n: RAG responde → n8n envía respuesta por WhatsApp
- [ ] Crear flujo n8n: job de recordatorios → genera mensaje → WhatsApp
- [ ] Crear flujo n8n: nueva cotización → notifica al agente

**Done cuando:** una conversación de WhatsApp real pasa por n8n → RAG → respuesta en WhatsApp.

### 3.5 Recordatorios automáticos

- [ ] El backend encola el job `SendPaymentReminder`
- [ ] n8n recibe el evento y dispara el mensaje de WhatsApp al cliente
- [ ] Verificar que el recordatorio incluye: nombre del cliente, viaje, monto y fecha límite

**Done cuando:** un pago próximo a vencer genera automáticamente un mensaje en WhatsApp sin intervención humana.

---

## FASE 4 — Frontend: Sitio Web Público
>
> Objetivo: sitio Astro con SEO completo, que consuma la API del backend.

### 4.1 Setup y diseño base `[CHAT]`

- [ ] Definir paleta de colores, tipografía e identidad visual básica
- [ ] Instalar dependencias: Tailwind CSS, integraciones Astro necesarias
- [ ] Crear layout base: header, footer, nav
- [ ] Configurar variables de entorno para la URL del backend

### 4.2 Páginas

- [ ] `/` — Home: viajes destacados, hero, sección de contacto WhatsApp
- [ ] `/viajes` — Catálogo: listado con filtros (tipo, destino, precio, fecha)
- [ ] `/viajes/[slug]` — Ficha del viaje: galería, highlights, detalle, reseñas, CTA WhatsApp
- [ ] `/contacto` — Formulario de contacto (dispara mensaje a n8n)
- [ ] `404` — Página de error personalizada

### 4.3 SEO y rendimiento

- [ ] Meta tags dinámicos por página
- [ ] `sitemap.xml` generado automáticamente
- [ ] `robots.txt`
- [ ] Imágenes con `alt` y lazy loading
- [ ] Verificar Lighthouse ≥ 90 en Performance y SEO

**Done cuando:** Lighthouse en producción (o preview) pasa el umbral en todas las páginas.

---

## FASE 5 — Cliente Móvil Admin (Flutter)

> Objetivo: app móvil para que el admin gestione viajes, clientes, reservas y pagos desde el celular.
> ⚠️ Esta fase inicia cuando las Fases 0–3 estén estables en producción.

### 5.1 Setup Flutter

- [ ] Crear proyecto Flutter en `/mobile`
- [ ] Configurar cliente HTTP para consumir la API del backend
- [ ] Configurar manejo de tokens JWT

### 5.2 Módulos de la app

- [ ] Autenticación (login)
- [ ] Dashboard: resumen financiero, reservas del día, alertas de pago
- [ ] Viajes: ver, crear, editar
- [ ] Clientes: ver, crear, editar, notas
- [ ] Reservas: ver, cambiar estado, agregar pago
- [ ] Notificaciones push para alertas de pago y nuevas cotizaciones

---

## FASE 6 — Producción
>
> Objetivo: sistema desplegado, monitoreado y con backups funcionando.

### 6.1 Servidor

- [ ] Contratar VPS (Hetzner CX21 recomendado para iniciar)
- [ ] Configurar SSH, firewall (ufw), fail2ban
- [ ] Instalar Docker y Docker Compose en el servidor

### 6.2 Deploy

- [ ] Crear `docker-compose.prod.yml` con configuración de producción
- [ ] Configurar Nginx como reverse proxy con SSL (Let's Encrypt / Certbot)
- [ ] Configurar GitHub Actions para deploy automático en push a `main`
- [ ] Variables de entorno de producción en servidor (nunca en el repo)

### 6.3 Operación

- [ ] Backup automático diario de PostgreSQL a storage externo (S3 / Cloudflare R2)
- [ ] Alertas en Grafana para: CPU > 80%, errores 5xx, RAG latencia > 10s
- [ ] Verificar Uptime Kuma monitorea todos los servicios públicos
- [ ] Runbook básico: qué hacer si cae cada servicio

**Done cuando:** el sistema lleva 48 horas en producción sin intervención manual.

---

## Resumen de Fases

| Fase | Descripción | Entregable principal |
| --- | --- | --- |
| 0 | Infraestructura base | Docker Compose funcionando |
| 1 | Base de datos | Schema migrado + GORM conectado |
| 2 | Backend CRUD | API REST completa y documentada |
| 3 | RAG | Agente WhatsApp funcional end-to-end |
| 4 | Frontend | Sitio web público en producción |
| 5 | App móvil | Cliente Flutter para el admin |
| 6 | Producción | Sistema desplegado y monitoreado |

---

## Reglas de trabajo en este chat

1. **Una tarea a la vez** — trabajamos en orden; no saltamos fases salvo decisión explícita
2. **Cada entregable se revisa antes de avanzar** — si algo no pasa el "Done cuando", se arregla ahí
3. **Todo código generado aquí se adapta al contexto real** — nada de código genérico que no compile
4. **Las decisiones de diseño quedan documentadas** — si cambiamos algo del schema o la API, actualizamos los docs
5. **Git commit al cerrar cada sub-tarea** — mensaje de commit sugerido al terminar cada ítem
