# Requisitos del Sistema — Agencia de Viajes

**Versión:** 2.0  
**Fecha:** 2026-04-29  
**Estado:** Aprobado

---

## Historial de Versiones

| Versión | Fecha | Cambios |
| --- | --- | --- |
| 1.0 | 2026-04-28 | Versión inicial |
| 2.0 | 2026-04-29 | Modificado RF-CV-02: detalles de viaje extendidos. Eliminado RF-CV-06 (costos internos por viaje, se gestiona en proveedores). Agregados RF-CV-09 (highlights) y RF-CV-10 (reseñas de clientes). Modificado RF-CL-05: notas visibles también para el Bot RAG. Modificado RF-PA-02: incluye información del cliente en el registro de pago. Eliminada sección 4.5 Proveedores (pendiente de redefinición). Agregado flujo principal en sección 7. Eliminada sección 9 Glosario (se moverá a documentación técnica). |

---

## 1. Descripción General

Sistema de gestión para agencia de viajes que opera con paquetes todo incluido, cruceros y viajes a la medida. El sistema contempla un sitio web público, un backend de administración, un agente conversacional por WhatsApp (RAG) y, en fases posteriores, un cliente móvil para el administrador.

---

## 2. Actores del Sistema

| Actor | Descripción |
| --- | --- |
| **Visitante** | Usuario anónimo que navega el sitio web |
| **Cliente** | Persona que ha iniciado o completado una reserva |
| **Agente / Admin** | Empleado de la agencia con acceso al panel de administración |
| **Bot RAG** | Agente conversacional de WhatsApp |
| **Sistema** | Procesos automáticos (recordatorios, notificaciones) |

---

## 3. Módulos del Sistema

1. Catálogo de viajes
2. Gestión de clientes
3. Reservas
4. Pagos y cobranza
5. Agente conversacional (RAG / WhatsApp)
6. Autenticación y roles
7. Notificaciones

---

## 4. Requisitos Funcionales

### 4.1 Catálogo de Viajes

| ID | Requisito | Prioridad | Versión |
| --- | --- | --- | --- |
| RF-CV-01 | El sistema debe permitir crear viajes de tipo: paquete todo incluido, crucero o viaje a la medida | Alta | 1.0 |
| RF-CV-02 | Cada viaje debe tener: nombre, descripción, destino, fecha de salida, fecha de regreso, precio base por persona, estado (activo / inactivo / agotado) y detalles del viaje (comidas incluidas, transporte, actividades y otros) | Alta | **2.0** |
| RF-CV-03 | El sistema debe soportar cupo máximo opcional por viaje; si se define, el sistema controla disponibilidad automáticamente | Alta | 1.0 |
| RF-CV-04 | El admin debe poder adjuntar imágenes al viaje (mínimo 1, máximo 10) | Media | 1.0 |
| RF-CV-05 | Los viajes deben poder marcarse como destacados para aparecer en la página principal | Media | 1.0 |
| RF-CV-07 | El admin debe poder clonar un viaje existente como base para uno nuevo | Baja | 1.0 |
| RF-CV-08 | El sistema debe filtrar viajes por tipo, destino, rango de fechas y rango de precio | Media | 1.0 |
| RF-CV-09 | El sistema debe permitir agregar highlights destacados por viaje (lista de puntos clave visibles en la ficha del viaje) | Alta | **2.0** |
| RF-CV-10 | El sistema debe permitir a los clientes calificar un viaje (escala numérica) y dejar comentarios públicos una vez completada su reserva | Media | **2.0** |

> **Nota v2.0:** Se eliminó RF-CV-06 (registro de costo interno por viaje). Esta información se gestionará a nivel de proveedores cuando se redefina ese módulo.

---

### 4.2 Gestión de Clientes

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-CL-01 | El sistema debe registrar clientes con: nombre completo, teléfono (WhatsApp), correo electrónico, fecha de nacimiento | Alta | 1.0 |
| RF-CL-02 | El número de WhatsApp debe ser único por cliente | Alta | 1.0 |
| RF-CL-03 | El sistema debe registrar el canal de origen del cliente (WhatsApp, sitio web, referido, otro) | Media | 1.0 |
| RF-CL-04 | El admin debe poder ver el historial completo de reservas y pagos de cada cliente | Alta | 1.0 |
| RF-CL-05 | El sistema debe permitir agregar notas internas por cliente; estas notas son visibles para el agente humano y para el Bot RAG al momento de atender al cliente | Media | **2.0** |
| RF-CL-06 | El sistema debe detectar si un número de WhatsApp ya existe antes de crear un cliente nuevo | Alta | 1.0 |

---

### 4.3 Reservas

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-RE-01 | Una reserva asocia uno o más pasajeros a un viaje específico | Alta | 1.0 |
| RF-RE-02 | El titular de la reserva debe ser un cliente registrado | Alta | 1.0 |
| RF-RE-03 | El sistema debe registrar el número de pasajeros por reserva | Alta | 1.0 |
| RF-RE-04 | El precio total de la reserva se calcula como: precio por persona × número de pasajeros, con posibilidad de descuento manual | Alta | 1.0 |
| RF-RE-05 | Una reserva debe tener uno de los siguientes estados: cotización, confirmada, cancelada, completada | Alta | 1.0 |
| RF-RE-06 | Al confirmar una reserva, si el viaje tiene cupo, el sistema debe decrementarlo automáticamente | Alta | 1.0 |
| RF-RE-07 | Al cancelar una reserva confirmada, el sistema debe liberar el cupo | Alta | 1.0 |
| RF-RE-08 | El sistema debe registrar la fecha y hora de creación de cada reserva | Alta | 1.0 |
| RF-RE-09 | El admin debe poder agregar notas internas a una reserva | Media | 1.0 |

---

### 4.4 Pagos y Cobranza

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-PA-01 | El esquema de pagos es anticipo + saldo; ambos montos son definidos por el agente al confirmar la reserva | Alta | 1.0 |
| RF-PA-02 | El sistema debe registrar cada pago recibido con: monto, fecha, método de pago (efectivo, transferencia, tarjeta, otro), quién lo registró e información del cliente asociado | Alta | **2.0** |
| RF-PA-03 | El sistema debe calcular automáticamente el saldo pendiente en cada reserva | Alta | 1.0 |
| RF-PA-04 | El sistema debe permitir registrar múltiples pagos parciales hasta completar el total | Alta | 1.0 |
| RF-PA-05 | El sistema debe generar alertas cuando una fecha de pago acordada esté próxima (configurable: 3, 5 o 7 días antes) | Alta | 1.0 |
| RF-PA-06 | El sistema debe generar alertas cuando un pago esté vencido (fecha acordada superada sin pago registrado) | Alta | 1.0 |
| RF-PA-07 | El admin debe poder registrar manualmente una fecha límite de pago por reserva | Alta | 1.0 |
| RF-PA-08 | El sistema debe mostrar un resumen financiero por viaje: total esperado, total recibido, saldo pendiente | Media | 1.0 |

---

### 4.5 Agente Conversacional — RAG / WhatsApp

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-RAG-01 | El agente debe responder consultas sobre viajes disponibles: destino, fechas, precio y cupo | Alta | 1.0 |
| RF-RAG-02 | El agente debe registrar una pre-reserva (cotización) cuando el cliente muestre intención de compra | Alta | 1.0 |
| RF-RAG-03 | El agente debe enviar recordatorios de pago automáticos según las fechas límite registradas en el sistema | Alta | 1.0 |
| RF-RAG-04 | El agente debe responder preguntas generales sobre destinos: requisitos de visa, clima, recomendaciones | Alta | 1.0 |
| RF-RAG-05 | El agente debe identificar al cliente por su número de WhatsApp y personalizar la respuesta con su historial y notas internas | Alta | 1.0 |
| RF-RAG-06 | Si el agente no puede resolver una consulta, debe escalar al agente humano notificando por WhatsApp o correo | Alta | 1.0 |
| RF-RAG-07 | El agente no debe procesar pagos directamente; debe instruir al cliente a coordinar con el agente humano | Alta | 1.0 |
| RF-RAG-08 | Todas las conversaciones del agente deben quedar registradas en el sistema | Media | 1.0 |
| RF-RAG-09 | n8n se encarga del filtrado, enrutamiento y orquestación entre WhatsApp Business API y el agente RAG | Alta | 1.0 |

---

### 4.6 Autenticación y Roles

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-AU-01 | El sistema debe soportar autenticación mediante usuario y contraseña con JWT | Alta | 1.0 |
| RF-AU-02 | Deben existir al menos dos roles: Administrador y Agente | Alta | 1.0 |
| RF-AU-03 | El Administrador tiene acceso completo al sistema incluyendo configuración y reportes financieros | Alta | 1.0 |
| RF-AU-04 | El Agente puede gestionar clientes, reservas y pagos, pero no puede ver costos internos ni márgenes | Alta | 1.0 |
| RF-AU-05 | Las sesiones deben expirar tras un período de inactividad configurable | Media | 1.0 |

---

### 4.7 Notificaciones

| ID | Requisito | Prioridad | Versión |
|---|---|---|---|
| RF-NO-01 | El sistema debe enviar recordatorio de pago al cliente por WhatsApp N días antes de la fecha límite | Alta | 1.0 |
| RF-NO-02 | El sistema debe notificar al agente cuando un pago esté vencido | Alta | 1.0 |
| RF-NO-03 | El sistema debe confirmar al cliente por WhatsApp cuando se registre un pago | Media | 1.0 |
| RF-NO-04 | El sistema debe notificar al agente cuando el RAG registre una nueva cotización | Media | 1.0 |

---

## 5. Requisitos No Funcionales

### 5.1 Rendimiento

| ID | Requisito |
|---|---|
| RNF-RE-01 | Los endpoints de la API deben responder en menos de 300ms en condiciones normales (p95) |
| RNF-RE-02 | El sitio web debe obtener un score de Lighthouse ≥ 90 en Performance y SEO |
| RNF-RE-03 | El agente RAG debe responder en menos de 10 segundos por mensaje en WhatsApp |

### 5.2 Seguridad

| ID | Requisito |
|---|---|
| RNF-SE-01 | Todos los endpoints de la API deben requerir autenticación JWT, excepto los de consulta pública del catálogo |
| RNF-SE-02 | Las contraseñas deben almacenarse con bcrypt (costo mínimo 12) |
| RNF-SE-03 | La comunicación entre todos los servicios debe ser por HTTPS |
| RNF-SE-04 | Los costos internos y márgenes solo deben ser accesibles para el rol Administrador |
| RNF-SE-05 | Los tokens JWT deben tener expiración máxima de 24 horas |

### 5.3 Disponibilidad y Operación

| ID | Requisito |
|---|---|
| RNF-OP-01 | El sistema debe tener disponibilidad mínima del 99% mensual |
| RNF-OP-02 | Debe existir backup automático diario de la base de datos |
| RNF-OP-03 | Los logs de errores deben centralizarse (Loki) con retención mínima de 30 días |

### 5.4 Escalabilidad

| ID | Requisito |
|---|---|
| RNF-ES-01 | El backend debe soportar al menos 100 usuarios concurrentes en el MVP |
| RNF-ES-02 | La arquitectura debe permitir migrar el modelo RAG de autoalojado a API externa sin rediseño |

### 5.5 SEO y Accesibilidad (Frontend)

| ID | Requisito |
|---|---|
| RNF-SEO-01 | Cada página de viaje debe tener meta tags únicos: title, description, og:image |
| RNF-SEO-02 | El sitio debe generar un sitemap.xml automático |
| RNF-SEO-03 | Las imágenes deben incluir atributo alt descriptivo |
| RNF-SEO-04 | El sitio debe ser completamente funcional sin JavaScript habilitado (SSG/SSR) |

---

## 6. Restricciones Técnicas

| Área | Decisión |
|---|---|
| Frontend | Astro (SSG/SSR) |
| Backend | Go + Fiber |
| Base de datos | PostgreSQL con GORM |
| Cache / Colas | Redis |
| RAG | LlamaIndex + ChromaDB + Ollama |
| Automatización | n8n |
| Infraestructura | Docker + VPS (Hetzner o Fly.io) |
| CI/CD | GitHub Actions |
| Observabilidad | Prometheus + Grafana + Loki |

---

## 7. Flujo Principal — Reserva por WhatsApp (MVP)

``` TXT
Cliente contacta por WhatsApp
        ↓
n8n recibe el mensaje y lo enruta al RAG
        ↓
RAG identifica al cliente por número de teléfono
RAG consulta notas internas del cliente (si existen)
        ↓
RAG consulta viajes disponibles en la API
        ↓
Cliente elige un viaje → RAG registra cotización vía API
        ↓
n8n notifica al agente humano (nueva cotización)
        ↓
Agente humano confirma reserva y define esquema de pago
        ↓
Sistema programa recordatorios automáticos de pago
        ↓
n8n envía recordatorios al cliente por WhatsApp en fechas acordadas
```

---

## 8. Fuera de Alcance (MVP)

- Pasarela de pagos en línea (pagos se registran manualmente)
- Portal de auto-servicio para clientes
- App móvil para el administrador
- Integración con GDS (Amadeus, Sabre)
- Multi-agencia o multi-sucursal
- Facturación electrónica
- Módulo de proveedores (pendiente de redefinición para v3.0)
