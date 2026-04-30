# Backend — Agencia de Viajes

API REST en Go + Fiber + GORM.

## Reglas

- La logica de negocio debe vivir en servicios, no en handlers.
- Los endpoints `/admin/*` requieren JWT valido y rol autorizado.
- Las contrasenas se almacenan con bcrypt, costo minimo 12.
- No loguear tokens, contrasenas ni datos personales completos.
