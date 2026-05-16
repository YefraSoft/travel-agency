# Schema de Base de Datos — Travel Agency

**Versión:** 2.0
**Fecha:** 2026-04-29
**Motor:** PostgreSQL 16

---

## Diagrama E-R — Mermaid

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : "created_by"
    USERS ||--o{ PAYMENTS : "verified_by"

    CUSTOMERS ||--o{ COMPANIONS : "owns"
    CUSTOMERS ||--o{ BOOKINGS : "customer_id nullable"
    CUSTOMERS ||--o{ PAYMENTS : "customer_id nullable"
    CUSTOMERS ||--o{ REVIEWS : "customer_id nullable"
    CUSTOMERS ||--o{ CHATS : "customer_id nullable"

    TRAVELS ||--o{ TRAVEL_PACKAGES : "has"
    TRAVELS ||--o{ TRAVEL_HIGHLIGHTS : "has"
    TRAVELS ||--o{ TRAVEL_INCLUDES : "has"
    TRAVELS ||--o{ TRAVEL_IMAGES : "has"
    TRAVELS ||--o{ BOOKINGS : "reserved"
    TRAVELS ||--o{ REVIEWS : "reviewed nullable"

    TRAVEL_PACKAGES ||--o{ TRAVEL_INCLUDES : "package-specific nullable"
    TRAVEL_PACKAGES ||--o{ BOOKINGS : "selected"

    BOOKINGS ||--o{ BOOKING_COMPANIONS : "has passengers"
    COMPANIONS ||--o{ BOOKING_COMPANIONS : "included in"
    BOOKINGS ||--o{ PAYMENTS : "receives"
    BOOKINGS ||--o{ REVIEWS : "verified nullable"

    CHATS ||--o{ RAG_CHATS : "processed messages"

    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password
        user_role rol
        boolean is_active
        timestamp created_at
    }

    CUSTOMERS {
        int id PK
        varchar name
        varchar email UK
        varchar phone UK
        date birthdate
        customer_origin origin
        timestamp created_at
        timestamp updated_at
    }

    TRAVELS {
        int id PK
        varchar name
        varchar slug UK
        travel_type type
        varchar destination
        varchar origin
        smallint duration_days
        smallint duration_nights
        smallint stars
        text description
        boolean is_featured
        travel_status status
        timestamp created_at
        timestamp updated_at
    }

    COMPANIONS {
        int id PK
        int customer_id FK
        varchar name
        smallint age
        timestamp created_at
    }

    TRAVEL_PACKAGES {
        int id PK
        int travel_id FK
        varchar name
        smallint persons_included
        smallint hotel_stars
        numeric price_per_person
        currency currency
        smallint capacity
        smallint available_spots
        boolean is_active
        timestamp created_at
    }

    TRAVEL_HIGHLIGHTS {
        int id PK
        int travel_id FK
        varchar icon
        varchar label
        smallint sort
    }

    TRAVEL_INCLUDES {
        int id PK
        int travel_id FK
        int package_id FK
        varchar icon
        varchar label
        varchar description
        smallint sort
    }

    TRAVEL_IMAGES {
        int id PK
        int travel_id FK
        varchar url
        varchar alt_text
        smallint sort
        timestamp created_at
    }

    BOOKINGS {
        int id PK
        int travel_id FK
        int package_id FK
        int customer_id FK
        int created_by FK
        varchar customer_phone
        numeric price_of_sale
        numeric discount
        booking_status status
        text notes
        date pay_limit
        timestamp created_at
        timestamp updated_at
    }

    BOOKING_COMPANIONS {
        int booking_id PK,FK
        int companion_id PK,FK
    }

    PAYMENTS {
        int id PK
        int booking_id FK
        int customer_id FK
        int verified_by FK
        numeric amount
        payment_method method
        payment_type type
        varchar reference
        boolean is_active
        timestamp created_at
    }

    REVIEWS {
        int id PK
        int travel_id FK
        int customer_id FK
        int booking_id FK
        review_type type
        smallint calification
        text commentary
        boolean is_visible
        timestamp created_at
    }

    CHATS {
        int id PK
        int customer_id FK
        varchar phone
        user_role attended_by
        user_role closed_by
        jsonb chat_history
        text context_summary
        timestamp created_at
        timestamp closed_at
    }

```

## Diagrama E-R — PlantUML

```plantuml
@startuml
hide circle
skinparam linetype ortho

entity users {
  * id : SERIAL <<PK>>
  --
  name : VARCHAR(100)
  email : VARCHAR(100) <<UK>>
  password : VARCHAR(255)
  rol : user_role
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity customers {
  * id : SERIAL <<PK>>
  --
  name : VARCHAR(100)
  email : VARCHAR(100) <<UK>>
  phone : VARCHAR(14) <<UK>>
  birthdate : DATE
  origin : customer_origin
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity travels {
  * id : SERIAL <<PK>>
  --
  name : VARCHAR(150)
  slug : VARCHAR(170) <<UK>>
  type : travel_type
  destination : VARCHAR(150)
  origin : VARCHAR(150)
  duration_days : SMALLINT
  duration_nights : SMALLINT
  stars : SMALLINT
  description : TEXT
  is_featured : BOOLEAN
  status : travel_status
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity companions {
  * id : SERIAL <<PK>>
  --
  customer_id : INT <<FK>>
  name : VARCHAR(100)
  age : SMALLINT
  created_at : TIMESTAMP
}

entity travel_packages {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK>>
  name : VARCHAR(100)
  persons_included : SMALLINT
  hotel_stars : SMALLINT
  price_per_person : NUMERIC(10,2)
  currency : currency
  capacity : SMALLINT
  available_spots : SMALLINT
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity travel_highlights {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK>>
  icon : VARCHAR(100)
  label : VARCHAR(80)
  sort : SMALLINT
}

entity travel_includes {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK>>
  package_id : INT <<FK nullable>>
  icon : VARCHAR(100)
  label : VARCHAR(150)
  description : VARCHAR(255)
  sort : SMALLINT
}

entity travel_images {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK>>
  url : VARCHAR(500)
  alt_text : VARCHAR(255)
  sort : SMALLINT
  created_at : TIMESTAMP
}

entity bookings {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK>>
  package_id : INT <<FK>>
  customer_id : INT <<FK nullable>>
  created_by : INT <<FK nullable>>
  customer_phone : VARCHAR(14)
  price_of_sale : NUMERIC(10,2)
  discount : NUMERIC(10,2)
  status : booking_status
  notes : TEXT
  pay_limit : DATE
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity booking_companions {
  * booking_id : INT <<PK, FK>>
  * companion_id : INT <<PK, FK>>
}

entity payments {
  * id : SERIAL <<PK>>
  --
  booking_id : INT <<FK>>
  customer_id : INT <<FK nullable>>
  verified_by : INT <<FK nullable>>
  amount : NUMERIC(10,2)
  method : payment_method
  type : payment_type
  reference : VARCHAR(255)
  is_active : BOOLEAN
  created_at : TIMESTAMP
}

entity reviews {
  * id : SERIAL <<PK>>
  --
  travel_id : INT <<FK nullable>>
  customer_id : INT <<FK nullable>>
  booking_id : INT <<FK nullable>>
  type : review_type
  calification : SMALLINT
  commentary : TEXT
  is_visible : BOOLEAN
  created_at : TIMESTAMP
}

entity chats {
  * id : SERIAL <<PK>>
  --
  customer_id : INT <<FK nullable>>
  phone : VARCHAR(14)
  attended_by : user_role
  closed_by : user_role
  chat_history : JSONB
  context_summary : TEXT
  created_at : TIMESTAMP
  closed_at : TIMESTAMP
}

users ||--o{ bookings : created_by
users ||--o{ payments : verified_by
customers ||--o{ companions : owns
customers ||--o{ bookings : customer_id
customers ||--o{ payments : customer_id
customers ||--o{ reviews : customer_id
customers ||--o{ chats : customer_id
travels ||--o{ travel_packages : has
travels ||--o{ travel_highlights : has
travels ||--o{ travel_includes : has
travels ||--o{ travel_images : has
travels ||--o{ bookings : reserved
travels ||--o{ reviews : reviewed
travel_packages ||--o{ travel_includes : package_id
travel_packages ||--o{ bookings : selected
bookings ||--o{ booking_companions : has
companions ||--o{ booking_companions : included
bookings ||--o{ payments : receives
bookings ||--o{ reviews : verifies
@enduml
```

---

## Sección 1 — Tablas sin relaciones

### `users`

Empleados de la agencia con acceso al panel administrativo.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `email` | `VARCHAR(100)` | NOT NULL, UNIQUE | |
| `password` | `VARCHAR(255)` | NOT NULL | bcrypt costo mínimo 12 |
| `rol` | `user_role` | NOT NULL | IA-AGENT, AGENT, SELLER, ADMIN |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | |
| `created_at` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() | |

---

### `customers`

Clientes registrados. El teléfono es el identificador principal para el RAG.

| Columna | Tipo | Restricciones | Descripción |
| --- | --- | --- | --- |
| `id` | `SERIAL` | PK | |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `email` | `VARCHAR(100)` | UNIQUE, nullable | |
| `phone` | `VARCHAR(14)` | NOT NULL, UNIQUE | Formato E.164 |
| `birthdate` | `DATE` | nullable | |
| `origin` | `customer_origin` | NOT NULL, DEFAULT 'WHATSAPP' | WEB, WHATSAPP |
| `created_at` | `TIMESTAMP` | NOT NULL | |
| `updated_at` | `TIMESTAMP` | NOT NULL | Auto-actualizado por trigger |

---

### `travels`

Producto base mostrado como card en el sitio web.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `name` | `VARCHAR(150)` | NOT NULL | Ej: "Bahía Mujeres Tulum" |
| `slug` | `VARCHAR(170)` | NOT NULL, UNIQUE | Para URLs del frontend |
| `type` | `travel_type` | NOT NULL | ALL_INCLUSIVE, CRUISE, CUSTOM |
| `destination` | `VARCHAR(150)` | NOT NULL | Ej: "Tulum, México" |
| `origin` | `VARCHAR(150)` | nullable | Ej: "Ciudad de México" |
| `duration_days` | `SMALLINT` | NOT NULL, > 0 | |
| `duration_nights` | `SMALLINT` | NOT NULL, > 0 | |
| `stars` | `SMALLINT` | 1–5, nullable | Estrellas del hotel |
| `description` | `TEXT` | NOT NULL | |
| `is_featured` | `BOOLEAN` | NOT NULL, DEFAULT FALSE | Aparece en el home |
| `status` | `travel_status` | NOT NULL, DEFAULT 'ACTIVE' | ACTIVE, INACTIVE, SOLD_OUT |
| `created_at` | `TIMESTAMP` | NOT NULL | |
| `updated_at` | `TIMESTAMP` | NOT NULL | Auto-actualizado por trigger |

**Lógica calculada al momento:**

- `"desde X MXN"` → `MIN(price_per_person) FROM travel_packages WHERE travel_id = ?`
- `puntuación` → `AVG(calification) FROM reviews WHERE travel_id = ?`

---

## Sección 2 — Tablas con relaciones

### `companions` → `customers`

Acompañantes vinculados a un cliente.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `customer_id` | `INT` | NOT NULL, FK → customers, CASCADE | |
| `name` | `VARCHAR(100)` | NOT NULL | |
| `age` | `SMALLINT` | NOT NULL, > 0 | |
| `created_at` | `TIMESTAMP` | NOT NULL | |

---

### `travel_packages` → `travels`

Variantes de precio y ocupación de un viaje.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `travel_id` | `INT` | NOT NULL, FK → travels, CASCADE | |
| `name` | `VARCHAR(100)` | NOT NULL | Ej: "Doble estándar" |
| `persons_included` | `SMALLINT` | NOT NULL, > 0 | |
| `hotel_stars` | `SMALLINT` | 1–5, nullable | |
| `price_per_person` | `NUMERIC(10,2)` | NOT NULL, > 0 | |
| `currency` | `currency` | NOT NULL, DEFAULT 'MXN' | MXN, USD |
| `capacity` | `SMALLINT` | nullable | NULL = sin límite |
| `available_spots` | `SMALLINT` | nullable | NULL cuando capacity es NULL |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | |
| `created_at` | `TIMESTAMP` | NOT NULL | |

**Restricción:** `capacity` y `available_spots` ambos NULL o ambos NOT NULL.

---

### `travel_highlights` → `travels`

Badges de lectura rápida del card.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `travel_id` | `INT` | NOT NULL, FK → travels, CASCADE |
| `icon` | `VARCHAR(100)` | NOT NULL |
| `label` | `VARCHAR(80)` | NOT NULL |
| `sort` | `SMALLINT` | NOT NULL, DEFAULT 0 |

---

### `travel_includes` → `travels`, `travel_packages` (nullable)

Detalle de qué incluye el viaje. Si `package_id` es NULL aplica a todos los paquetes.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `travel_id` | `INT` | NOT NULL, FK → travels, CASCADE |
| `package_id` | `INT` | nullable, FK → travel_packages, CASCADE |
| `icon` | `VARCHAR(100)` | NOT NULL |
| `label` | `VARCHAR(150)` | NOT NULL |
| `description` | `VARCHAR(255)` | nullable |
| `sort` | `SMALLINT` | NOT NULL, DEFAULT 0 |

---

### `travel_images` → `travels`

Galería de fotos. `sort = 0` es la portada.

| Columna | Tipo | Restricciones |
|---|---|---|
| `id` | `SERIAL` | PK |
| `travel_id` | `INT` | NOT NULL, FK → travels, CASCADE |
| `url` | `VARCHAR(500)` | NOT NULL |
| `alt_text` | `VARCHAR(255)` | NOT NULL |
| `sort` | `SMALLINT` | NOT NULL, DEFAULT 0 |
| `created_at` | `TIMESTAMP` | NOT NULL |

---

### `bookings` → `travels`, `travel_packages`, `customers` (nullable), `users` (nullable)

Reserva de un viaje. El cliente es opcional; el teléfono es obligatorio.
Pasajeros = `COUNT(*) FROM booking_companions WHERE booking_id = ?`.
Saldo = `price_of_sale - SUM(payments.amount WHERE is_active = TRUE)`.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `travel_id` | `INT` | NOT NULL, FK → travels | |
| `package_id` | `INT` | NOT NULL, FK → travel_packages | |
| `customer_id` | `INT` | nullable, FK → customers, SET NULL | |
| `created_by` | `INT` | nullable, FK → users, SET NULL | |
| `customer_phone` | `VARCHAR(14)` | NOT NULL | Teléfono al momento de reservar |
| `price_of_sale` | `NUMERIC(10,2)` | NOT NULL, > 0 | Snapshot del precio acordado |
| `discount` | `NUMERIC(10,2)` | NOT NULL, DEFAULT 0 | |
| `status` | `booking_status` | NOT NULL, DEFAULT 'RESERVED' | RESERVED, CONFIRMED, CANCELLED, COMPLETED |
| `notes` | `TEXT` | nullable | Notas internas del agente |
| `pay_limit` | `DATE` | nullable | Fecha límite del saldo |
| `created_at` | `TIMESTAMP` | NOT NULL | |
| `updated_at` | `TIMESTAMP` | NOT NULL | Auto-actualizado por trigger |

---

### `booking_companions` → `bookings`, `companions`

Relación N:M. El conteo de esta tabla determina el número de pasajeros.

| Columna | Tipo | Restricciones |
|---|---|---|
| `booking_id` | `INT` | PK compuesta, FK → bookings, CASCADE |
| `companion_id` | `INT` | PK compuesta, FK → companions, CASCADE |

---

### `payments` → `bookings`, `customers` (nullable), `users` (nullable)

Pagos recibidos. Nunca se eliminan — `is_active = FALSE` para anular.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `booking_id` | `INT` | NOT NULL, FK → bookings | |
| `customer_id` | `INT` | nullable, FK → customers, SET NULL | |
| `verified_by` | `INT` | nullable, FK → users, SET NULL | |
| `amount` | `NUMERIC(10,2)` | NOT NULL, > 0 | |
| `method` | `payment_method` | NOT NULL | CASH, TRANSFER, CARD, MIX |
| `type` | `payment_type` | NOT NULL | TOTAL, PARTIAL |
| `reference` | `VARCHAR(255)` | nullable | Número de transferencia, etc. |
| `is_active` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | FALSE = pago anulado |
| `created_at` | `TIMESTAMP` | NOT NULL | |

---

### `reviews` → `travels` (nullable), `customers` (nullable), `bookings` (nullable)

Reseñas visibles en el sitio. Cualquier visitante puede dejar una.
Los FK nullable permiten distinguir el origen de cada reseña.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `travel_id` | `INT` | nullable, FK → travels | NULL = reseña general de la agencia |
| `customer_id` | `INT` | nullable, FK → customers | NULL = visitante anónimo |
| `booking_id` | `INT` | nullable, FK → bookings | NOT NULL = reseña verificada |
| `type` | `review_type` | NOT NULL | POSITIVE, NEGATIVE, FEEDBACK, QUESTION, COMPLAINT |
| `calification` | `SMALLINT` | 1–5, nullable | |
| `commentary` | `TEXT` | nullable | |
| `is_visible` | `BOOLEAN` | NOT NULL, DEFAULT TRUE | |
| `created_at` | `TIMESTAMP` | NOT NULL | |

**Restricción:** `UNIQUE (customer_id, travel_id)` — un cliente, una reseña por viaje.

---

### `chats` → `customers` (nullable)

Almacenamiento frío. El RAG usa Redis como contexto activo.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `SERIAL` | PK | |
| `customer_id` | `INT` | nullable, FK → customers, SET NULL | |
| `phone` | `VARCHAR(14)` | NOT NULL | Identificador principal |
| `attended_by` | `user_role` | NOT NULL, DEFAULT 'IA-AGENT' | |
| `closed_by` | `user_role` | nullable | NULL = chat abierto |
| `chat_history` | `JSONB` | NOT NULL, DEFAULT '[]' | Formato LangChain |
| `context_summary` | `TEXT` | nullable | Cargado en Redis en arranque frío |
| `created_at` | `TIMESTAMP` | NOT NULL | |
| `closed_at` | `TIMESTAMP` | nullable | NULL = chat abierto |

---

## Decisiones de diseño

**`customer_id` nullable en bookings, payments, reviews, chats**
Permite operar sin cliente registrado. El teléfono actúa como identificador provisional.

**Pasajeros via `booking_companions`**
El número de pasajeros no se guarda como campo — se obtiene contando `booking_companions`. Elimina inconsistencias entre un campo numérico y los acompañantes reales.

**Saldo calculado dinámicamente**
`price_of_sale - SUM(payments.amount WHERE is_active = TRUE)`. Nunca persiste para evitar inconsistencias con pagos anulados.

**`is_active` en payments**
Los pagos nunca se eliminan para conservar auditoría financiera completa.

**`context_summary` en chats**
El RAG usa Redis (TTL 24h) como contexto activo. Al cerrarse o expirar, el backend genera un `ConversationSummary` y lo persiste aquí. En arranque frío el RAG carga este campo en lugar del historial completo.

**Reviews abiertas y verificadas**
`customer_id` nullable permite reseñas generales anónimas de la agencia. Para reseñas públicas de un viaje asociadas a cliente, `booking_id` distingue reseñas verificadas; la regla de que la reserva esté `COMPLETED` se valida en backend.
