# Especificacion de API — Agencia de Viajes

**Estado:** Pendiente

Este documento definira la especificacion REST del backend conforme avance la Fase 2 del plan.

## Convenciones

- Los endpoints publicos del catalogo no requieren autenticacion.
- Los endpoints bajo `/admin/*` requieren JWT valido y rol autorizado.
- El RAG nunca procesa pagos; cualquier flujo de pago debe escalar al agente humano.
- Las respuestas de error deben usar un formato consistente y no exponer datos sensibles.

## Modulos previstos

- Autenticacion
- Viajes
- Clientes
- Reservas
- Pagos y cobranza
- Resenas
- RAG / integraciones internas

## RAG / n8n

### `POST /api/rag/whatsapp/messages`

Entrada prevista para n8n. Recibe un mensaje entrante de WhatsApp, lo reenvia al servicio RAG y retorna la respuesta para que n8n la envie al cliente.

Request:

```json
{
  "phone": "+5215511112222",
  "message": "Quiero opciones para Cancun"
}
```

Response:

```json
{
  "answer": "...",
  "sources": [],
  "model": "gemma3:12b",
  "chat_id": 1
}
```

### `POST /api/rag/chats/{id}/messages`

Agrega mensajes al contexto activo. El backend persiste en PostgreSQL y refresca Redis con TTL configurable.

### `POST /api/rag/chats/{id}/close`

Cierra el chat, persiste `contextSummary` y elimina el contexto activo en Redis. Si no se manda resumen, el backend genera un resumen operativo basico.

### `POST /api/rag/chats/phone/{phone}/close`

Cierra el chat activo por telefono. Pensado para n8n cuando no conserva el `chat_id`.
