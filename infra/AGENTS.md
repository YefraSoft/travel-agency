# Infra — Agencia de Viajes

Infraestructura compartida, Docker Compose, migraciones SQL y flujos n8n.

## Reglas

- Las migraciones SQL van en `infra/sql/` con numeracion incremental.
- No modificar migraciones ya ejecutadas.
- Los flujos exportados de n8n van en `infra/n8n/`.
- Las variables reales viven en `.env`; el repositorio solo debe contener `.env.example`.
