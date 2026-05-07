-- =============================================================
-- TRAVEL AGENCY — SEED DE DATOS
-- Solo para entorno de desarrollo.
-- Ejecutar después de 001_schema.sql
-- =============================================================

BEGIN;

-- =============================================================
-- USERS
-- NOTA: Los hashes son placeholders.
-- Generar con bcrypt costo 12 antes de usar en cualquier entorno real.
-- =============================================================

INSERT INTO
    users (name, email, password, rol)
VALUES (
        'Admin Principal',
        'admin@travelagency.com',
        '$2a$12$PLACEHOLDER_ADMIN_HASH',
        'ADMIN'
    ),
    (
        'Agente Ventas',
        'agente@travelagency.com',
        '$2a$12$PLACEHOLDER_AGENT_HASH',
        'AGENT'
    ),
    (
        'Vendedor Uno',
        'seller@travelagency.com',
        '$2a$12$PLACEHOLDER_SELLER_HASH',
        'SELLER'
    );

-- =============================================================
-- CUSTOMERS
-- =============================================================

INSERT INTO
    customers (
        name,
        email,
        phone,
        birthdate,
        origin
    )
VALUES (
        'María García López',
        'maria.garcia@example.com',
        '+5213312345678',
        '1990-05-14',
        'WHATSAPP'
    ),
    (
        'Carlos Rodríguez Pérez',
        'carlos.rodriguez@example.com',
        '+5213398765432',
        '1985-11-22',
        'WEB'
    ),
    (
        'Ana Martínez Ruiz',
        NULL,
        '+5213311223344',
        NULL,
        'WHATSAPP'
    );

-- =============================================================
-- COMPANIONS
-- =============================================================

INSERT INTO
    companions (customer_id, name, age)
VALUES (1, 'Luis García López', 35),
    (1, 'Sofía García López', 8),
    (2, 'Elena Rodríguez Ruiz', 30);

-- =============================================================
-- TRAVELS
-- =============================================================

INSERT INTO
    travels (
        name,
        slug,
        type,
        destination,
        origin,
        duration_days,
        duration_nights,
        stars,
        description,
        is_featured,
        status
    )
VALUES (
        'Cancún Todo Incluido 8 Días',
        'cancun-todo-incluido-8-dias',
        'ALL_INCLUSIVE',
        'Cancún, Quintana Roo, México',
        'Ciudad de México',
        8,
        7,
        5,
        'Disfruta 7 noches en el Caribe mexicano con todo incluido de primera clase. Playas de arena blanca, aguas turquesas y entretenimiento para toda la familia.',
        TRUE,
        'ACTIVE'
    ),
    (
        'Crucero Caribe — Royal Caribbean',
        'crucero-caribe-royal-caribbean',
        'CRUISE',
        'Caribe (Cozumel · Jamaica · Bahamas)',
        'Miami, Florida',
        8,
        7,
        5,
        'Navega por las islas del Caribe a bordo del Harmony of the Seas con escalas en Cozumel, Jamaica y las Bahamas.',
        TRUE,
        'ACTIVE'
    ),
    (
        'Europa a tu Medida — París, Roma y Barcelona',
        'europa-paris-roma-barcelona',
        'CUSTOM',
        'París · Roma · Barcelona',
        'Ciudad de México',
        11,
        10,
        4,
        'Recorre tres ciudades icónicas de Europa con itinerario personalizado, guía privado y hoteles boutique en centros históricos.',
        FALSE,
        'ACTIVE'
    );

-- =============================================================
-- TRAVEL_PACKAGES
-- =============================================================

INSERT INTO
    travel_packages (
        travel_id,
        name,
        persons_included,
        price_per_person,
        currency,
        capacity,
        available_spots
    )
VALUES (
        1,
        'Doble estándar',
        2,
        18900.00,
        'MXN',
        20,
        20
    ),
    (
        1,
        'Suite familiar',
        4,
        16500.00,
        'MXN',
        10,
        10
    ),
    (
        2,
        'Cabina interior',
        2,
        32000.00,
        'MXN',
        15,
        15
    ),
    (
        2,
        'Cabina con balcón',
        2,
        41000.00,
        'MXN',
        8,
        8
    ),
    (
        3,
        'Viaje a la medida',
        2,
        45000.00,
        'MXN',
        NULL,
        NULL
    );

-- =============================================================
-- TRAVEL_HIGHLIGHTS
-- =============================================================

INSERT INTO
    travel_highlights (travel_id, icon, label, sort)
VALUES (
        1,
        'plane',
        'Vuelo redondo desde CDMX',
        1
    ),
    (
        1,
        'utensils',
        'Alimentos y bebidas ilimitados',
        2
    ),
    (
        1,
        'hotel',
        'Hotel 5 estrellas frente al mar',
        3
    ),
    (
        1,
        'map-pin',
        'Visita a Chichén Itzá incluida',
        4
    ),
    (
        2,
        'ship',
        'Harmony of the Seas',
        1
    ),
    (
        2,
        'map',
        '3 destinos: Cozumel, Jamaica, Bahamas',
        2
    ),
    (
        2,
        'music',
        'Shows y entretenimiento incluidos',
        3
    ),
    (
        3,
        'user',
        'Guía privado en las 3 ciudades',
        1
    ),
    (
        3,
        'train',
        'Trenes de alta velocidad',
        2
    ),
    (
        3,
        'hotel',
        'Hoteles boutique centro histórico',
        3
    ),
    (
        3,
        'utensils',
        'Experiencias gastronómicas',
        4
    );

-- =============================================================
-- TRAVEL_INCLUDES
-- =============================================================

INSERT INTO
    travel_includes (
        travel_id,
        package_id,
        icon,
        label,
        sort
    )
VALUES
    -- Cancún — todos los paquetes
    (
        1,
        NULL,
        'plane',
        'Vuelo redondo desde Ciudad de México',
        1
    ),
    (
        1,
        NULL,
        'utensils',
        'Alimentos y bebidas ilimitados',
        2
    ),
    (
        1,
        NULL,
        'wifi',
        'WiFi gratuito en habitación',
        3
    ),
    (
        1,
        NULL,
        'bus',
        'Traslados aeropuerto–hotel–aeropuerto',
        4
    ),
    -- Cancún — solo suite familiar
    (
        1,
        2,
        'star',
        'Habitación conectada para familia',
        5
    ),
    -- Crucero — todos los paquetes
    (
        2,
        NULL,
        'ship',
        'Alojamiento a bordo 7 noches',
        1
    ),
    (
        2,
        NULL,
        'utensils',
        'Comidas principales incluidas',
        2
    ),
    (
        2,
        NULL,
        'music',
        'Shows y entretenimiento a bordo',
        3
    ),
    -- Europa — todos los paquetes
    (
        3,
        NULL,
        'plane',
        'Vuelos CDMX–París y Barcelona–CDMX',
        1
    ),
    (
        3,
        NULL,
        'train',
        'Trenes de alta velocidad entre ciudades',
        2
    ),
    (
        3,
        NULL,
        'hotel',
        'Hotel boutique 4 estrellas 10 noches',
        3
    ),
    (
        3,
        NULL,
        'user',
        'Guía privado en París, Roma y Barcelona',
        4
    ),
    (
        3,
        NULL,
        'coffee',
        'Desayunos incluidos cada mañana',
        5
    );

-- =============================================================
-- TRAVEL_IMAGES
-- =============================================================

INSERT INTO
    travel_images (
        travel_id,
        url,
        alt_text,
        sort
    )
VALUES (
        1,
        'https://placeholder.com/cancun-playa.jpg',
        'Playa de arena blanca en Cancún al atardecer',
        0
    ),
    (
        1,
        'https://placeholder.com/cancun-hotel.jpg',
        'Hotel todo incluido frente al mar en Cancún',
        1
    ),
    (
        1,
        'https://placeholder.com/cancun-chichen.jpg',
        'Pirámide de Chichén Itzá al amanecer',
        2
    ),
    (
        2,
        'https://placeholder.com/crucero-barco.jpg',
        'Harmony of the Seas navegando el Caribe',
        0
    ),
    (
        2,
        'https://placeholder.com/crucero-cozumel.jpg',
        'Arrecife de coral en Cozumel',
        1
    ),
    (
        3,
        'https://placeholder.com/paris-torre.jpg',
        'Torre Eiffel iluminada al anochecer',
        0
    ),
    (
        3,
        'https://placeholder.com/roma-coliseo.jpg',
        'Interior del Coliseo Romano',
        1
    ),
    (
        3,
        'https://placeholder.com/bcn-sagrada.jpg',
        'Fachada de la Sagrada Família de Gaudí',
        2
    );

-- =============================================================
-- BOOKINGS
-- =============================================================

INSERT INTO
    bookings (
        travel_id,
        package_id,
        customer_id,
        created_by,
        customer_phone,
        price_of_sale,
        discount,
        status,
        notes,
        pay_limit
    )
VALUES (
        1,
        1,
        1,
        2,
        '+5213312345678',
        37800.00,
        0.00,
        'COMPLETED',
        'Cliente solicitó habitación en piso alto con vista al mar.',
        '2026-06-01'
    ),
    (
        2,
        3,
        2,
        2,
        '+5213398765432',
        32000.00,
        2000.00,
        'RESERVED',
        NULL,
        NULL
    );

-- =============================================================
-- BOOKING_COMPANIONS
-- =============================================================

INSERT INTO
    booking_companions (booking_id, companion_id)
VALUES (1, 1),
    (1, 2);

-- Decrementar cupo del paquete confirmado (1 habitación ocupada)
UPDATE travel_packages
SET
    available_spots = available_spots - 1
WHERE
    id = 1;

-- =============================================================
-- PAYMENTS
-- =============================================================

INSERT INTO
    payments (
        booking_id,
        customer_id,
        verified_by,
        amount,
        method,
        type,
        reference
    )
VALUES (
        1,
        1,
        2,
        10000.00,
        'TRANSFER',
        'PARTIAL',
        'SPEI-20260420-001'
    );

-- =============================================================
-- REVIEWS
-- =============================================================

INSERT INTO
    reviews (
        travel_id,
        customer_id,
        booking_id,
        type,
        calification,
        commentary,
        is_visible
    )
VALUES
    -- Reseña verificada: tiene travel_id, customer_id y booking_id
    (
        1,
        1,
        1,
        'POSITIVE',
        5,
        'Excelente experiencia, el hotel superó todas nuestras expectativas. Los niños quedaron encantados.',
        TRUE
    ),
    -- Reseña anónima general de la agencia (sin ningún FK)
    (
        NULL,
        NULL,
        NULL,
        'POSITIVE',
        5,
        'Muy buena atención por WhatsApp, respondieron todas mis dudas rápidamente.',
        TRUE
    ),
    -- Reseña de visitante sobre un destino sin reserva verificada
    (
        2,
        NULL,
        NULL,
        'FEEDBACK',
        4,
        'El crucero por el Caribe es espectacular, ojalá agreguen más fechas disponibles.',
        TRUE
    );

-- =============================================================
-- CHATS
-- =============================================================

INSERT INTO
    chats (
        customer_id,
        phone,
        attended_by,
        closed_by,
        chat_history,
        context_summary,
        closed_at
    )
VALUES (
        1,
        '+5213312345678',
        'IA-AGENT',
        'IA-AGENT',
        '[
        {"type": "human", "content": "Hola, quiero info del viaje a Cancún"},
        {"type": "ai",    "content": "¡Hola María! Tenemos el paquete Cancún Todo Incluido 8 días desde $18,900 MXN por persona. ¿Te gustaría conocer los detalles?"},
        {"type": "human", "content": "Sí, para 2 adultos y una niña de 8 años"},
        {"type": "ai",    "content": "Perfecto, para ese grupo el paquete Suite Familiar quedaría en $49,500 MXN. ¿Te interesa apartar una fecha?"}
    ]',
        'La cliente María preguntó por el viaje a Cancún para 2 adultos y una niña de 8 años. Se le cotizó la Suite Familiar en $49,500 MXN. Mostró interés en apartar fecha.',
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    );

-- =============================================================
-- RAG_CHATS
-- =============================================================

INSERT INTO
    rag_chats (
        chat_id,
        intention,
        escalated,
        received_at
    )
VALUES (
        1,
        'INFO',
        FALSE,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    (
        1,
        'QUOTE',
        FALSE,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    );

COMMIT;
