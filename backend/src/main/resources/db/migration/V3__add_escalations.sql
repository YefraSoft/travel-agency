-- =============================================================
-- TRAVEL AGENCY — Add escalations table
-- Flyway: V3__add_escalations.sql
-- =============================================================

CREATE TABLE escalations (
    id              SERIAL PRIMARY KEY,
    chat_id         INTEGER,
    phone           VARCHAR(14)     NOT NULL,
    reason          VARCHAR(20)     NOT NULL,
    client_question TEXT,
    context         TEXT,
    suggested_action TEXT,
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending',
    attended_by     VARCHAR(100),
    attended_at     TIMESTAMP,
    resolved_at     TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_escalations_phone ON escalations(phone);
CREATE INDEX idx_escalations_status ON escalations(status);
