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
