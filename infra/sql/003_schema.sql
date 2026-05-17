-- =============================================================
-- TRAVEL AGENCY — SCHEMA COMPLETO (VARCHAR, sin enums nativos)
-- =============================================================
-- Reemplazo total del schema original.
-- Las columnas que antes usaban enums nativos ahora son VARCHAR/TEXT.
-- La validacion se mantiene en el backend (Kotlin enums).
-- =============================================================

BEGIN;

-- =============================================================
-- FUNCTION
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(100)    UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    rol         VARCHAR(20)     NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- CUSTOMERS
-- =============================================================

CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    email       VARCHAR(100),
    phone       VARCHAR(14)     NOT NULL,
    birthdate   DATE,
    origin      TEXT            DEFAULT 'WHATSAPP',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_customers_phone ON customers(phone);

-- =============================================================
-- COMPANIONS
-- =============================================================

CREATE TABLE companions (
    id          SERIAL PRIMARY KEY,
    customer_id INTEGER         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name        VARCHAR(100)    NOT NULL,
    age         SMALLINT        NOT NULL CHECK (age > 0),
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companions_customer ON companions(customer_id);

-- =============================================================
-- TRAVELS
-- =============================================================

CREATE TABLE travels (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200)    NOT NULL,
    slug            VARCHAR(200)    NOT NULL UNIQUE,
    type            VARCHAR(20)     NOT NULL,
    destination     VARCHAR(200)    NOT NULL,
    origin          VARCHAR(200),
    duration_days   SMALLINT        NOT NULL,
    duration_nights SMALLINT        NOT NULL,
    stars           SMALLINT        CHECK (stars BETWEEN 1 AND 5),
    description     TEXT            NOT NULL,
    is_featured     BOOLEAN         NOT NULL DEFAULT FALSE,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_travels_updated_at
    BEFORE UPDATE ON travels
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_travels_featured ON travels(is_featured) WHERE is_featured = TRUE;

-- =============================================================
-- TRAVEL_PACKAGES
-- =============================================================

CREATE TABLE travel_packages (
    id                  SERIAL PRIMARY KEY,
    travel_id           INTEGER         NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
    name                VARCHAR(100)    NOT NULL,
    persons_included    SMALLINT        NOT NULL,
    hotel_stars         SMALLINT        CHECK (hotel_stars BETWEEN 1 AND 5),
    price_per_person    NUMERIC(10,2)   NOT NULL,
    currency            VARCHAR(5)      DEFAULT 'MXN',
    capacity            SMALLINT,
    available_spots     SMALLINT,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_packages_travel ON travel_packages(travel_id);

-- =============================================================
-- TRAVEL_HIGHLIGHTS
-- =============================================================

CREATE TABLE travel_highlights (
    id          SERIAL PRIMARY KEY,
    travel_id   INTEGER     NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
    icon        VARCHAR(50) NOT NULL,
    label       VARCHAR(200) NOT NULL,
    sort        SMALLINT    NOT NULL DEFAULT 0
);

CREATE INDEX idx_highlights_travel ON travel_highlights(travel_id);

-- =============================================================
-- TRAVEL_INCLUDES
-- =============================================================

CREATE TABLE travel_includes (
    id          SERIAL PRIMARY KEY,
    travel_id   INTEGER     NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
    package_id  INTEGER     REFERENCES travel_packages(id) ON DELETE CASCADE,
    icon        VARCHAR(50) NOT NULL,
    label       VARCHAR(200) NOT NULL,
    description TEXT,
    sort        SMALLINT    NOT NULL DEFAULT 0
);

CREATE INDEX idx_includes_travel ON travel_includes(travel_id);

-- =============================================================
-- TRAVEL_IMAGES
-- =============================================================

CREATE TABLE travel_images (
    id          SERIAL PRIMARY KEY,
    travel_id   INTEGER         NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
    url         VARCHAR(500)    NOT NULL,
    alt_text    VARCHAR(255)    NOT NULL,
    sort        SMALLINT        NOT NULL DEFAULT 0
);

CREATE INDEX idx_images_travel ON travel_images(travel_id);

-- =============================================================
-- BOOKINGS
-- =============================================================

CREATE TABLE bookings (
    id              SERIAL PRIMARY KEY,
    travel_id       INTEGER         NOT NULL REFERENCES travels(id),
    package_id      INTEGER         NOT NULL REFERENCES travel_packages(id),
    customer_id     INTEGER         REFERENCES customers(id) ON DELETE SET NULL,
    created_by      INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    customer_phone  VARCHAR(14)     NOT NULL,
    price_of_sale   NUMERIC(10,2)   NOT NULL CHECK (price_of_sale > 0),
    discount        NUMERIC(10,2)   NOT NULL DEFAULT 0 CHECK (discount >= 0),
    status          TEXT            NOT NULL DEFAULT 'RESERVED',
    notes           TEXT,
    pay_limit       DATE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_travel   ON bookings(travel_id);
CREATE INDEX idx_bookings_phone    ON bookings(customer_phone);

-- =============================================================
-- BOOKING_COMPANIONS
-- =============================================================

CREATE TABLE booking_companions (
    booking_id    INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    companion_id  INTEGER NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, companion_id)
);

-- =============================================================
-- PAYMENTS
-- =============================================================

CREATE TABLE payments (
    id          SERIAL PRIMARY KEY,
    booking_id  INTEGER         NOT NULL REFERENCES bookings(id),
    customer_id INTEGER         REFERENCES customers(id) ON DELETE SET NULL,
    verified_by INTEGER         REFERENCES users(id) ON DELETE SET NULL,
    amount      NUMERIC(10,2)   NOT NULL CHECK (amount > 0),
    method      TEXT            NOT NULL,
    type        TEXT            NOT NULL,
    reference   VARCHAR(255),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_booking        ON payments(booking_id);
CREATE INDEX idx_payments_booking_active ON payments(booking_id, is_active);

-- =============================================================
-- REVIEWS
-- =============================================================

CREATE TABLE reviews (
    id          SERIAL PRIMARY KEY,
    travel_id   INTEGER     REFERENCES travels(id) ON DELETE SET NULL,
    customer_id INTEGER     REFERENCES customers(id) ON DELETE SET NULL,
    booking_id  INTEGER     REFERENCES bookings(id) ON DELETE SET NULL,
    type        TEXT        NOT NULL,
    calification SMALLINT   CHECK (calification BETWEEN 1 AND 5),
    commentary  TEXT,
    is_visible  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_review_customer_travel UNIQUE (customer_id, travel_id)
);

CREATE INDEX idx_reviews_customer       ON reviews(customer_id);
CREATE INDEX idx_reviews_travel_visible ON reviews(travel_id, is_visible);

-- =============================================================
-- CHATS
-- =============================================================

CREATE TABLE chats (
    id              SERIAL PRIMARY KEY,
    customer_id     INTEGER     REFERENCES customers(id) ON DELETE SET NULL,
    phone           VARCHAR(14) NOT NULL,
    attended_by     TEXT        NOT NULL DEFAULT 'IA-AGENT',
    closed_by       TEXT,
    chat_history    JSONB       NOT NULL DEFAULT '[]',
    context_summary TEXT,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at       TIMESTAMP
);

CREATE INDEX idx_chats_customer    ON chats(customer_id);
CREATE INDEX idx_chats_open        ON chats(closed_at) WHERE closed_at IS NULL;
CREATE INDEX idx_chats_phone_created ON chats(phone, created_at DESC);

-- =============================================================
-- FLYWAY SCHEMA HISTORY
-- =============================================================

CREATE TABLE flyway_schema_history (
    installed_rank  INTEGER         NOT NULL PRIMARY KEY,
    version         VARCHAR(50),
    description     VARCHAR(200)    NOT NULL,
    type            VARCHAR(20)     NOT NULL,
    script          VARCHAR(1000)   NOT NULL,
    checksum        INTEGER,
    installed_by    VARCHAR(100)    NOT NULL,
    installed_on    TIMESTAMP       NOT NULL DEFAULT NOW(),
    execution_time  INTEGER         NOT NULL,
    success         BOOLEAN         NOT NULL
);

CREATE INDEX flyway_schema_history_s_idx ON flyway_schema_history(success);

COMMIT;
