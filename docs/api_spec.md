# Especificacion de API — Go Diego Travel Agency

**Estado:** v1.0
**Fecha:** 2026-05-17
**Base URL:** `http://localhost:8080/api`

---

## Convenciones

- Endpoints publicos del catalogo no requieren autenticacion.
- Endpoints bajo `/admin/*` requieren auth (MVP: contraseña simple; futuro: JWT).
- Endpoints del RAG (`/api/rag/*`) son usados internamente por n8n, Agent y Frontend.
- El Agent valida `X-API-Key` en todos sus endpoints excepto `/api/health`.
- Respuestas de error usan formato consistente sin exponer datos sensibles.
- El RAG nunca procesa pagos; siempre escala al agente humano.

---

## Autenticacion Interna

### API_KEY (Agent)

Todos los endpoints del Agent requieren header `X-API-Key`:

```
X-API-Key: ${RAG_API_KEY}
```

Excepcion: `GET /api/health` es publico para Docker healthcheck.

---

## Catalogo Publico

### `GET /api/travels`

Lista todos los viajes activos. Sin autenticacion.

Response `200`:
```json
[
  {
    "id": 1,
    "name": "Bahia Mujeres Tulum",
    "slug": "bahia-mujeres-tulum",
    "type": "ALL_INCLUSIVE",
    "destination": "Tulum, Mexico",
    "durationDays": 5,
    "durationNights": 4,
    "stars": 4,
    "description": "...",
    "isFeatured": true,
    "status": "ACTIVE",
    "priceFrom": 15000.00,
    "rating": 4.5
  }
]
```

### `GET /api/travels/:id`

Detalle de un viaje con paquetes, highlights, includes e imagenes.

Response `200`:
```json
{
  "id": 1,
  "name": "Bahia Mujeres Tulum",
  "packages": [...],
  "highlights": [...],
  "includes": [...],
  "images": [...]
}
```

### `GET /api/travels/:slug`

Busca un viaje por slug (URL amigable).

### `GET /api/reviews`

Lista reseñas visibles. Sin autenticacion.

---

## RAG / Chat

### `POST /api/rag/whatsapp/messages`

Procesa un mensaje entrante y retorna respuesta del asistente. Usado por el ChatWidget del frontend.

Request:
```json
{
  "phone": "+5215511112222",
  "message": "Quiero opciones para Cancun"
}
```

Response `200`:
```json
{
  "answer": "Tenemos estas opciones para Cancun...",
  "sources": [],
  "model": "gemini-2.5-flash",
  "chatId": 1,
  "chat_id": 1,
  "escalate": false,
  "escalation": null
}
```

Si `escalate: true`, el backend crea automaticamente un registro en `escalations`.

### `GET /api/rag/travels`

Lista viajes en formato simplificado para el RAG (nombre, destino, precio desde).

### `GET /api/rag/customers/phone/{phone}`

Busca un cliente por telefono. Retorna `null` si no existe.

### `POST /api/rag/chats`

Crea un nuevo chat.

Request:
```json
{
  "phone": "+5215511112222",
  "attendedBy": "IA-AGENT"
}
```

Response `200`:
```json
{
  "id": 1,
  "customerId": null,
  "phone": "+5215511112222",
  "attendedBy": "IA-AGENT",
  "chatHistory": [],
  "contextSummary": null,
  "createdAt": "2026-05-17T10:00:00"
}
```

### `GET /api/rag/chats/{phone}`

Obtiene el chat activo de un telefono con historial completo.

Response `200` incluye `chatHistory`, `attendedBy`, `closedBy`, `contextSummary` y `closedAt`.

### `GET /api/rag/chats/active`

Lista todos los chats sin cerrar.

### `POST /api/rag/chats/{id}/messages`

Agrega un mensaje al chat.

Request:
```json
{
  "interaction": {
    "type": "HUMAN",
    "content": "Cuanto cuesta?"
  }
}
```

### `POST /api/rag/chats/phone/{phone}/close`

Cierra el chat de un telefono. Persiste `contextSummary`.

Request:
```json
{
  "contextSummary": "Cliente interesado en Cancun, solicita pago a meses"
}
```

---

## Escalaciones

### `POST /api/rag/escalations`

Crea una escalacion (usado por n8n o automaticamente por `RagService`).

Request:
```json
{
  "chatId": 1,
  "phone": "+5215511112222",
  "reason": "payment",
  "clientQuestion": "Como puedo pagar a meses?",
  "context": "Cliente pregunta sobre MSI",
  "suggestedAction": "Ofrecer 3, 6 o 12 meses sin intereses"
}
```

Response `201`:
```json
{
  "id": 1,
  "chatId": 1,
  "phone": "+5215511112222",
  "reason": "payment",
  "clientQuestion": "Como puedo pagar a meses?",
  "context": "Cliente pregunta sobre MSI",
  "suggestedAction": "Ofrecer 3, 6 o 12 meses sin intereses",
  "status": "pending",
  "attendedBy": null,
  "attendedAt": null,
  "resolvedAt": null,
  "createdAt": "2026-05-17T10:05:00"
}
```

### `GET /api/rag/escalations/pending`

Lista escalaciones pendientes. Usado por el Dashboard Admin.

Response `200`:
```json
[
  {
    "id": 1,
    "phone": "+5215511112222",
    "reason": "payment",
    "clientQuestion": "Como puedo pagar a meses?",
    "status": "pending",
    "createdAt": "2026-05-17T10:05:00"
  }
]
```

### `GET /api/rag/escalations/{id}`

Detalle de una escalacion.

### `PATCH /api/rag/escalations/{id}/status`

Cambia el estado de una escalacion.

Request:
```json
{
  "status": "resolved",
  "attendedBy": "admin@godiego.com"
}
```

---

## Agent (TypeScript + Express)

Puerto: `3002` (host), `3000` (container)

Todos los endpoints requieren `X-API-Key` excepto `/api/health`.

### `POST /api/chat`

Envia un mensaje al agente RAG (Gemini + ChromaDB).

Request:
```json
{
  "message": "Hola, quiero informacion sobre viajes",
  "phone": "+5215511112222",
  "chatHistory": [
    { "role": "user", "content": "Hola" },
    { "role": "assistant", "content": "Hola, en que puedo ayudarte?" }
  ]
}
```

Response `200`:
```json
{
  "answer": "Claro, tenemos paquetes a Cancun, Tulum...",
  "sources": ["Cancun All Inclusive", "Tulum Beach Resort"],
  "model": "gemini-2.5-flash",
  "chatId": 1,
  "escalate": false,
  "escalation": null
}
```

### `POST /api/chat/summarize`

Genera un resumen de un chat.

### `POST /api/rag/ingest`

Ingesta un documento al vector store (ChromaDB).

### `POST /api/rag/ingest/viajes`

Ingesta todos los viajes desde el backend al vector store.

### `GET /api/health`

Healthcheck publico. Sin autenticacion.

Response `200`:
```json
{ "status": "ok" }
```

---

## Admin (MVP — contraseña simple)

### `GET /api/admin/users`

Lista usuarios del sistema.

### `POST /api/admin/users`

Crea un nuevo usuario.

### `GET /api/admin/bookings`

Lista todas las reservas.

### `POST /api/admin/bookings`

Crea una reserva.

### `PATCH /api/admin/bookings/{id}/status`

Cambia el estado de una reserva.

### `POST /api/admin/payments`

Registra un pago.

### `GET /api/admin/customers`

Lista clientes.

---

## Codigo de Error

| Codigo | Descripcion |
|--------|-------------|
| `400` | Bad Request — datos invalidos |
| `401` | Unauthorized — API_KEY invalida o faltante |
| `404` | Not Found — recurso no existe |
| `409` | Conflict — recurso duplicado |
| `500` | Internal Server Error |
