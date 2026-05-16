-- =============================================================
-- TRAVEL AGENCY — SCHEMA PRINCIPAL
-- Motor: PostgreSQL 16
-- =============================================================

-- DROP DATABASE IF EXISTS travel_agency;
-- CREATE DATABASE travel_agency;

-- =============================================================
-- SECCIÓN 1 — TABLAS SIN RELACIONES
-- =============================================================

-- USERS [.]
-- -----------------------------------------------
/*
Empleados de la agencia con acceso al panel administrativo.
Maneja autenticación, roles y auditoría de operaciones.
*/
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CUSTOMERS [.]
-- -----------------------------------------------
/*
Clientes registrados de la agencia. Un cliente puede existir
sin haber completado una reserva. El teléfono es el identificador
principal usado por el agente RAG vía WhatsApp.
*/
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(14) NOT NULL UNIQUE,
    birthdate DATE,
    origin VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TRAVELS [.]
-- -----------------------------------------------
/*
Producto base ofertado por la agencia, mostrado como card en el sitio web.
El precio "desde X MXN" se calcula con MIN(price_per_person) de travel_packages.
La puntuación se calcula con AVG(calification) de reviews.
*/
CREATE TABLE travels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(170) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    origin VARCHAR(150),
    duration_days SMALLINT NOT NULL CHECK (duration_days > 0),
    duration_nights SMALLINT NOT NULL CHECK (duration_nights > 0),
    stars SMALLINT CHECK (stars BETWEEN 1 AND 5),
    description TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- SECCIÓN 2 — TABLAS CON RELACIONES
-- =============================================================

-- COMPANIONS: resumen (CUSTOMERS 1:N) [.]
-- -----------------------------------------------
/*
Acompañantes vinculados a un cliente. Permiten registrar
personas adicionales en una reserva sin necesidad de que
sean clientes registrados.
*/
CREATE TABLE companions (
    id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age SMALLINT NOT NULL CHECK (age > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TRAVEL_PACKAGES: resumen (TRAVELS 1:N)
-- -----------------------------------------------
/*
Variantes de un viaje con diferente ocupación y precio.
Ejemplo: "2 adultos desde $1,899 MXN", "4 adultos desde $3,200 MXN".
El cupo se decrementa al confirmar una reserva y se restaura al cancelarla.
*/
CREATE TABLE travel_packages (
    id SERIAL PRIMARY KEY,
    travel_id INT NOT NULL REFERENCES travels (id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    persons_included SMALLINT NOT NULL CHECK (persons_included > 0),
    hotel_stars SMALLINT CHECK (hotel_stars BETWEEN 1 AND 5),
    price_per_person NUMERIC(10, 2) NOT NULL CHECK (price_per_person > 0),
    currency VARCHAR(5) NOT NULL DEFAULT 'MXN',
    capacity SMALLINT CHECK (capacity > 0),
    available_spots SMALLINT CHECK (available_spots >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_package_capacity_pair CHECK (
        (capacity IS NULL AND available_spots IS NULL)
        OR (capacity IS NOT NULL AND available_spots IS NOT NULL)
    ),
    CONSTRAINT chk_package_available_spots_capacity CHECK (
        capacity IS NULL OR available_spots <= capacity
    )
);

-- TRAVEL_HIGHLIGHTS: resumen (TRAVELS 1:N)
-- -----------------------------------------------
/*
Badges de lectura rápida visibles en el card y página de detalle.
Ejemplo: "WiFi gratis", "Vuelo incluido", "Tours por la zona".
*/
CREATE TABLE travel_highlights (
    id SERIAL PRIMARY KEY,
    travel_id INT NOT NULL REFERENCES travels (id) ON DELETE CASCADE,
    icon VARCHAR(100) NOT NULL,
    label VARCHAR(80) NOT NULL,
    sort SMALLINT NOT NULL DEFAULT 0
);

-- TRAVEL_INCLUDES: resumen (TRAVELS 1:N, TRAVEL_PACKAGES 1:N nullable)
-- -----------------------------------------------
/*
Lista detallada de qué incluye el viaje, mostrada en la página de detalle.
Si package_id es NULL aplica a todos los paquetes del viaje.
Si package_id tiene valor, aplica solo a ese paquete específico.
*/
CREATE TABLE travel_includes (
    id SERIAL PRIMARY KEY,
    travel_id INT NOT NULL REFERENCES travels (id) ON DELETE CASCADE,
    package_id INT REFERENCES travel_packages (id) ON DELETE CASCADE,
    icon VARCHAR(100) NOT NULL,
    label VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    sort SMALLINT NOT NULL DEFAULT 0
);

-- TRAVEL_IMAGES: resumen (TRAVELS 1:N)
-- -----------------------------------------------
/*
Galería de fotos del viaje. La imagen con sort = 0 es la portada.
El campo alt_text es obligatorio para SEO y accesibilidad.
*/
CREATE TABLE travel_images (
    id SERIAL PRIMARY KEY,
    travel_id INT NOT NULL REFERENCES travels (id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) NOT NULL,
    sort SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BOOKINGS: resumen (TRAVELS 1:N, TRAVEL_PACKAGES 1:N, CUSTOMERS N:1 nullable, USERS N:1 nullable)
-- -----------------------------------------------
/*
Registro de compra o reserva de un viaje. El cliente es opcional
ya que se puede reservar sin estar registrado, usando solo el teléfono.
El número de pasajeros se deduce del conteo de booking_companions.
El saldo pendiente se calcula como price_of_sale - SUM(payments.amount WHERE is_active = TRUE).
*/
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    travel_id INT NOT NULL REFERENCES travels (id),
    package_id INT NOT NULL REFERENCES travel_packages (id),
    customer_id INT REFERENCES customers (id) ON DELETE SET NULL,
    created_by INT REFERENCES users (id) ON DELETE SET NULL,
    customer_phone VARCHAR(14) NOT NULL,
    price_of_sale NUMERIC(10, 2) NOT NULL CHECK (price_of_sale > 0),
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'RESERVED',
    notes TEXT,
    pay_limit DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BOOKING_COMPANIONS: resumen (BOOKINGS N:M COMPANIONS)
-- -----------------------------------------------
/*
Relaciona acompañantes con una reserva. Una reserva puede incluir
acompañantes registrados en el sistema. El total de pasajeros
se obtiene contando las filas de esta tabla por booking_id.
*/
CREATE TABLE booking_companions (
    booking_id INT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
    companion_id INT NOT NULL REFERENCES companions (id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, companion_id)
);

-- PAYMENTS: resumen (BOOKINGS 1:N, CUSTOMERS N:1 nullable, USERS N:1 nullable)
-- -----------------------------------------------
/*
Registro de cada pago recibido por una reserva. Los pagos nunca
se eliminan físicamente; se anulan con is_active = FALSE para
conservar la auditoría financiera completa.
El saldo pendiente siempre se calcula dinámicamente.
*/
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings (id),
    customer_id INT REFERENCES customers (id) ON DELETE SET NULL,
    verified_by INT REFERENCES users (id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL,
    reference VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS: resumen (TRAVELS 1:N, CUSTOMERS N:1 nullable, BOOKINGS N:1 nullable)
-- -----------------------------------------------
/*
Reseñas visibles en el sitio web. Pueden hacerlas visitantes anónimos
o clientes registrados. Los campos travel_id y booking_id son opcionales
para diferenciar reseñas generales de reseñas de viajes completados.
Un cliente solo puede dejar una reseña por viaje.
*/
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    travel_id INT REFERENCES travels (id) ON DELETE SET NULL,
    customer_id INT REFERENCES customers (id) ON DELETE SET NULL,
    booking_id INT REFERENCES bookings (id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    calification SMALLINT CHECK (calification BETWEEN 1 AND 5),
    commentary TEXT,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_review_customer_travel UNIQUE (customer_id, travel_id)
);

-- CHATS: resumen (CUSTOMERS N:1 nullable)
-- -----------------------------------------------
/*
Almacenamiento frío del historial completo de conversaciones.
Se escribe al cerrar la sesión o al expirar el TTL de Redis.
El agente RAG nunca lee chat_history directamente; usa Redis como
contexto activo y context_summary solo en arranque en frío.
*/
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers (id) ON DELETE SET NULL,
    phone VARCHAR(14) NOT NULL,
    attended_by VARCHAR(20) NOT NULL DEFAULT 'IA-AGENT',
    closed_by VARCHAR(20),
    chat_history JSONB NOT NULL DEFAULT '[]',
    context_summary TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

-- =============================================================
-- ÍNDICES
-- =============================================================

-- customers
CREATE INDEX idx_customers_phone ON customers (phone);
-- companions
CREATE INDEX idx_companions_customer ON companions (customer_id);
-- travels
CREATE INDEX idx_travels_status ON travels (status);
CREATE INDEX idx_travels_type             ON travels (type);
CREATE INDEX idx_travels_featured ON travels (is_featured)
WHERE is_featured = TRUE;
-- travel relationships
CREATE INDEX idx_packages_travel ON travel_packages (travel_id);
CREATE INDEX idx_highlights_travel ON travel_highlights (travel_id);
CREATE INDEX idx_includes_travel ON travel_includes (travel_id);
CREATE INDEX idx_images_travel ON travel_images (travel_id);
-- bookings
CREATE INDEX idx_bookings_customer ON bookings (customer_id);
CREATE INDEX idx_bookings_travel ON bookings (travel_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_phone ON bookings (customer_phone);
CREATE INDEX idx_bookings_pay_limit ON bookings (pay_limit)
WHERE status = 'CONFIRMED';
-- payments
CREATE INDEX idx_payments_booking ON payments (booking_id);
CREATE INDEX idx_payments_booking_active ON payments (booking_id, is_active);
-- reviews
CREATE INDEX idx_reviews_travel_visible ON reviews (travel_id, is_visible);
CREATE INDEX idx_reviews_customer ON reviews (customer_id);
-- chats
CREATE INDEX idx_chats_phone_created ON chats (phone, created_at DESC);
CREATE INDEX idx_chats_open ON chats (closed_at)
WHERE closed_at IS NULL;
CREATE INDEX idx_chats_customer ON chats (customer_id);
-- =============================================================
-- ÍNDICES COMPUESTOS (Performance Optimization)
-- =============================================================
-- Querys comunes en cobranza y historial
CREATE INDEX idx_bookings_customer_status ON bookings (customer_id, status);
CREATE INDEX idx_payments_booking_created ON payments (booking_id, created_at DESC);
-- Query: buscar pagos recientes de un cliente vía booking
CREATE INDEX idx_payments_created ON payments (created_at DESC)
WHERE is_active = TRUE;
-- Query: historial de cliente con estado filtrado
CREATE INDEX idx_bookings_customer_created ON bookings (customer_id, created_at DESC);
-- Query: viajes activos filtrados por tipo/destino
CREATE INDEX idx_travels_active_type ON travels (type)
WHERE status = 'ACTIVE';

-- =============================================================
-- FUNCIÓN: updated_at automático
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_travels_updated_at
    BEFORE UPDATE ON travels
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
