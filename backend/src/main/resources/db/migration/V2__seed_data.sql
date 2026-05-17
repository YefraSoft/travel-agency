-- =============================================================
-- TRAVEL AGENCY — SEED DE DATOS
-- Solo para entorno de desarrollo.
-- Ejecutar despues de V1__full_schema.sql
-- =============================================================

-- =============================================================
-- USERS
-- Contraseñas: Admin123!, Agent123!, Seller123!
-- =============================================================

INSERT INTO users (name, email, password, rol)
VALUES
    ('Admin Principal',  'admin@godiego.com',  '$2b$12$NMso1MVft6kjTuOxurOAse7kaAwvyqWMSfRt7XOMPd3Y4DGShbi6i',  'ADMIN'),
    ('Agente Ventas',    'agente@godiego.com',  '$2b$12$N931E/DE.LIhWGlp5jj5UOvyn90yirqyAri.PZ.Cb7msAQnsO7TR.',  'AGENT'),
    ('Vendedor Uno',     'vendedor@godiego.com', '$2b$12$bWDpPL1LHUSr1e4Fye852u/unGrVwl.CWHyToDoe5WwvXhdnSr9oO', 'SELLER');

-- =============================================================
-- CUSTOMERS
-- =============================================================

INSERT INTO customers (name, email, phone, birthdate, origin)
VALUES
    ('Maria Garcia Lopez',  'maria.garcia@example.com',    '+5213312345678', '1990-05-14', 'WHATSAPP'),
    ('Carlos Rodriguez Perez', 'carlos.rodriguez@example.com', '+5213398765432', '1985-11-22', 'WEB'),
    ('Ana Martinez Ruiz',   NULL,                          '+5213311223344', NULL,         'WHATSAPP');

-- =============================================================
-- COMPANIONS
-- =============================================================

INSERT INTO companions (customer_id, name, age)
VALUES
    (1, 'Luis Garcia Lopez', 35),
    (1, 'Sofia Garcia Lopez', 8),
    (2, 'Elena Rodriguez Ruiz', 30);

-- =============================================================
-- TRAVELS
-- =============================================================

INSERT INTO travels (name, slug, type, destination, origin, duration_days, duration_nights, stars, description, is_featured, status)
VALUES
    ('Cancun Todo Incluido 8 Dias', 'cancun-todo-incluido-8-dias', 'ALL_INCLUSIVE', 'Cancun, Quintana Roo, Mexico', 'Ciudad de Mexico', 8, 7, 5,
     'Disfruta 7 noches en el Caribe mexicano con todo incluido de primera clase. Playas de arena blanca, aguas turquesas y entretenimiento para toda la familia.', TRUE, 'ACTIVE'),
    ('Crucero Caribe - Royal Caribbean', 'crucero-caribe-royal-caribbean', 'CRUISE', 'Caribe (Cozumel - Jamaica - Bahamas)', 'Miami, Florida', 8, 7, 5,
     'Navega por las islas del Caribe a bordo del Harmony of the Seas con escalas en Cozumel, Jamaica y las Bahamas.', TRUE, 'ACTIVE'),
    ('Europa a tu Medida - Paris, Roma y Barcelona', 'europa-paris-roma-barcelona', 'CUSTOM', 'Paris - Roma - Barcelona', 'Ciudad de Mexico', 11, 10, 4,
     'Recorre tres ciudades iconicas de Europa con itinerario personalizado, guia privado y hoteles boutique en centros historicos.', FALSE, 'ACTIVE');

-- =============================================================
-- TRAVEL_PACKAGES
-- =============================================================

INSERT INTO travel_packages (travel_id, name, persons_included, hotel_stars, price_per_person, currency, capacity, available_spots, is_active)
VALUES
    (1, 'Doble estandar',  2, NULL, 18900.00, 'MXN', 20, 20, TRUE),
    (1, 'Suite familiar',  4, NULL, 16500.00, 'MXN', 10, 10, TRUE),
    (2, 'Cabina interior', 2, NULL, 32000.00, 'MXN', 15, 15, TRUE),
    (2, 'Cabina con balcon', 2, NULL, 41000.00, 'MXN', 8, 8, TRUE),
    (3, 'Viaje a la medida', 2, NULL, 45000.00, 'MXN', NULL, NULL, TRUE);

-- =============================================================
-- TRAVEL_HIGHLIGHTS
-- =============================================================

INSERT INTO travel_highlights (travel_id, icon, label, sort)
VALUES
    (1, 'plane',    'Vuelo redondo desde CDMX',            1),
    (1, 'utensils', 'Alimentos y bebidas ilimitados',      2),
    (1, 'hotel',    'Hotel 5 estrellas frente al mar',     3),
    (1, 'map-pin',  'Visita a Chichen Itza incluida',      4),
    (2, 'ship',     'Harmony of the Seas',                 1),
    (2, 'map',      '3 destinos: Cozumel, Jamaica, Bahamas', 2),
    (2, 'music',    'Shows y entretenimiento incluidos',   3),
    (3, 'user',     'Guia privado en las 3 ciudades',      1),
    (3, 'train',    'Trenes de alta velocidad',            2),
    (3, 'hotel',    'Hoteles boutique centro historico',   3),
    (3, 'utensils', 'Experiencias gastronomicas',          4);

-- =============================================================
-- TRAVEL_INCLUDES
-- =============================================================

INSERT INTO travel_includes (travel_id, package_id, icon, label, description, sort)
VALUES
    (1, NULL, 'plane',    'Vuelo redondo desde Ciudad de Mexico', NULL, 1),
    (1, NULL, 'utensils', 'Alimentos y bebidas ilimitados', NULL, 2),
    (1, NULL, 'wifi',     'WiFi gratuito en habitacion', NULL, 3),
    (1, NULL, 'bus',      'Traslados aeropuerto-hotel-aeropuerto', NULL, 4),
    (1, 2, 'star', 'Habitacion conectada para familia', NULL, 5),
    (2, NULL, 'ship',  'Alojamiento a bordo 7 noches', NULL, 1),
    (2, NULL, 'utensils', 'Comidas principales incluidas', NULL, 2),
    (2, NULL, 'music', 'Shows y entretenimiento a bordo', NULL, 3),
    (3, NULL, 'plane',  'Vuelos CDMX-Paris y Barcelona-CDMX', NULL, 1),
    (3, NULL, 'train',  'Trenes de alta velocidad entre ciudades', NULL, 2),
    (3, NULL, 'hotel',  'Hotel boutique 4 estrellas 10 noches', NULL, 3),
    (3, NULL, 'user',   'Guia privado en Paris, Roma y Barcelona', NULL, 4),
    (3, NULL, 'coffee', 'Desayunos incluidos cada manana', NULL, 5);

-- =============================================================
-- TRAVEL_IMAGES
-- =============================================================

INSERT INTO travel_images (travel_id, url, alt_text, sort)
VALUES
    (1, 'https://placeholder.com/cancun-playa.jpg',   'Playa de arena blanca en Cancun al atardecer',         0),
    (1, 'https://placeholder.com/cancun-hotel.jpg',   'Hotel todo incluido frente al mar en Cancun',        1),
    (1, 'https://placeholder.com/cancun-chichen.jpg', 'Piramide de Chichen Itza al amanecer',               2),
    (2, 'https://placeholder.com/crucero-barco.jpg',  'Harmony of the Seas navegando el Caribe',            0),
    (2, 'https://placeholder.com/crucero-cozumel.jpg','Arrecife de coral en Cozumel',                       1),
    (3, 'https://placeholder.com/paris-torre.jpg',    'Torre Eiffel iluminada al anochecer',                0),
    (3, 'https://placeholder.com/roma-coliseo.jpg',   'Interior del Coliseo Romano',                        1),
    (3, 'https://placeholder.com/bcn-sagrada.jpg',    'Fachada de la Sagrada Familia de Gaudi',             2);

-- =============================================================
-- BOOKINGS
-- =============================================================

INSERT INTO bookings (travel_id, package_id, customer_id, created_by, customer_phone, price_of_sale, discount, status, notes, pay_limit)
VALUES
    (1, 1, 1, 2, '+5213312345678', 37800.00, 0.00, 'COMPLETED',
     'Cliente solicito habitacion en piso alto con vista al mar.', '2026-06-01'),
    (2, 3, 2, 2, '+5213398765432', 32000.00, 2000.00, 'RESERVED', NULL, NULL);

-- =============================================================
-- BOOKING_COMPANIONS
-- =============================================================

INSERT INTO booking_companions (booking_id, companion_id)
VALUES (1, 1), (1, 2);

-- Decrementar cupo del paquete confirmado
UPDATE travel_packages
SET available_spots = available_spots - 1
WHERE id = 1;

-- =============================================================
-- PAYMENTS
-- =============================================================

INSERT INTO payments (booking_id, customer_id, verified_by, amount, method, type, reference)
VALUES
    (1, 1, 2, 10000.00, 'TRANSFER', 'PARTIAL', 'SPEI-20260420-001');

-- =============================================================
-- REVIEWS
-- =============================================================

INSERT INTO reviews (travel_id, customer_id, booking_id, type, calification, commentary, is_visible)
VALUES
    (1, 1, 1, 'POSITIVE', 5,
     'Excelente experiencia, el hotel supero todas nuestras expectativas. Los ninos quedaron encantados.', TRUE),
    (NULL, NULL, NULL, 'POSITIVE', 5,
     'Muy buena atencion por WhatsApp, respondieron todas mis dudas rapidamente.', TRUE),
    (2, NULL, NULL, 'FEEDBACK', 4,
     'El crucero por el Caribe es espectacular, ojala agreguen mas fechas disponibles.', TRUE);

-- =============================================================
-- CHATS
-- =============================================================

INSERT INTO chats (customer_id, phone, attended_by, closed_by, chat_history, context_summary, closed_at)
VALUES (
    1,
    '+5213312345678',
    'IA-AGENT',
    'IA-AGENT',
    '[
        {"type": "HUMAN", "content": "Hola, quiero info del viaje a Cancun"},
        {"type": "AI", "content": "Hola Maria! Tenemos el paquete Cancun Todo Incluido 8 dias desde $18,900 MXN por persona. Te gustaria conocer los detalles?"},
        {"type": "HUMAN", "content": "Si, para 2 adultos y una nina de 8 anos"},
        {"type": "AI", "content": "Perfecto, para ese grupo el paquete Suite Familiar quedaria en $49,500 MXN. Te interesa apartar una fecha?"}
    ]',
    'La cliente Maria pregunto por el viaje a Cancun para 2 adultos y una nina de 8 anos. Se le cotizo la Suite Familiar en $49,500 MXN. Mostro interes en apartar fecha.',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
);
