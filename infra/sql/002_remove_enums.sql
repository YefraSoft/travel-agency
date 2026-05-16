-- =============================================================
-- 002: Remove PostgreSQL native enum types → VARCHAR
-- =============================================================
-- Motivo: los enums nativos causaban problemas de mapeo JPA.
-- La validacion se mantiene en el backend (Kotlin enums).
-- =============================================================

BEGIN;

-- =============================================================
-- Convertir columnas enum → VARCHAR
-- =============================================================

ALTER TABLE users             ALTER COLUMN rol          TYPE VARCHAR(20) USING rol::text;

ALTER TABLE customers         ALTER COLUMN origin       TYPE VARCHAR(20) USING origin::text;
ALTER TABLE customers         ALTER COLUMN origin       SET DEFAULT 'WHATSAPP';

ALTER TABLE travels           ALTER COLUMN type         TYPE VARCHAR(20) USING type::text;
ALTER TABLE travels           ALTER COLUMN status       TYPE VARCHAR(20) USING status::text;
ALTER TABLE travels           ALTER COLUMN status       SET DEFAULT 'ACTIVE';

ALTER TABLE travel_packages   ALTER COLUMN currency     TYPE VARCHAR(5) USING currency::text;
ALTER TABLE travel_packages   ALTER COLUMN currency     SET DEFAULT 'MXN';

ALTER TABLE bookings          ALTER COLUMN status       TYPE VARCHAR(20) USING status::text;
ALTER TABLE bookings          ALTER COLUMN status       SET DEFAULT 'RESERVED';

ALTER TABLE payments          ALTER COLUMN method       TYPE VARCHAR(20) USING method::text;
ALTER TABLE payments          ALTER COLUMN type         TYPE VARCHAR(20) USING type::text;

ALTER TABLE reviews           ALTER COLUMN type         TYPE VARCHAR(20) USING type::text;

ALTER TABLE chats             ALTER COLUMN attended_by  TYPE VARCHAR(20) USING attended_by::text;
ALTER TABLE chats             ALTER COLUMN attended_by  SET DEFAULT 'IA-AGENT';
ALTER TABLE chats             ALTER COLUMN closed_by    TYPE VARCHAR(20) USING closed_by::text;

-- =============================================================
-- Eliminar tipos enum (ya no hay columnas que los referencien)
-- =============================================================

DROP TYPE IF EXISTS chat_intention;
DROP TYPE IF EXISTS review_type;
DROP TYPE IF EXISTS payment_type;
DROP TYPE IF EXISTS payment_method;
DROP TYPE IF EXISTS booking_status;
DROP TYPE IF EXISTS currency;
DROP TYPE IF EXISTS travel_type;
DROP TYPE IF EXISTS travel_status;
DROP TYPE IF EXISTS customer_origin;
DROP TYPE IF EXISTS user_role;

COMMIT;
