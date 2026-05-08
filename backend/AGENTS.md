# Backend - Agencia de Viajes

API REST en Spring Boot + Kotlin + Spring Data JPA.

## Reglas

- La logica de negocio debe vivir en servicios, no en controllers.
- MVP actual: los endpoints `/api/admin/*` estan abiertos temporalmente; conservar el prefijo para agregar JWT despues sin romper contratos.
- No implementar JWT en el MVP hasta decision explicita.
- No loguear tokens, contrasenas ni datos personales completos.
- Swagger/OpenAPI debe documentar todos los endpoints disponibles.
