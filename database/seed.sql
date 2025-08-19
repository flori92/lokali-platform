-- Données de test pour Lokali
-- Insertion d'utilisateurs et propriétés de démonstration

-- Insertion d'utilisateurs de test
INSERT INTO users (id, email, name, phone, role, verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'marie.adjovi@email.com', 'Marie Adjovi', '+229 97 12 34 56', 'owner', true),
('550e8400-e29b-41d4-a716-446655440002', 'jean.koudou@email.com', 'Jean Koudou', '+229 96 78 90 12', 'owner', true),
('550e8400-e29b-41d4-a716-446655440003', 'fatou.dossou@email.com', 'Fatou Dossou', '+229 95 34 56 78', 'owner', true),
('550e8400-e29b-41d4-a716-446655440004', 'pierre.agbo@email.com', 'Pierre Agbo', '+229 94 12 34 56', 'guest', true);

-- Insertion de propriétés de test
INSERT INTO properties (
    id, title, description, type, city, district, address, 
    latitude, longitude, price_amount, price_period, 
    bedrooms, bathrooms, area, furnished, parking, 
    amenities, images, owner_id, rating_average, rating_count
) VALUES
-- Guest Houses
(
    '550e8400-e29b-41d4-a716-446655440101',
    'Guest House Moderne Cotonou',
    'Magnifique guest house située dans le quartier calme de Fidjrossè. Parfait pour les visiteurs d''affaires et touristes. Climatisation, WiFi gratuit, petit-déjeuner inclus.',
    'guest-house',
    'Cotonou',
    'Fidjrossè',
    'Rue des Palmiers, près du marché Fidjrossè',
    6.3654, 2.4183,
    25000, 'night',
    2, 1, 45, true, true,
    ARRAY['Climatisation', 'WiFi', 'Télévision', 'Réfrigérateur', 'Petit-déjeuner', 'Parking'],
    ARRAY['/src/assets/property-1.jpg'],
    '550e8400-e29b-41d4-a716-446655440001',
    4.8, 45
),
(
    '550e8400-e29b-41d4-a716-446655440102',
    'Villa Familiale Akpakpa',
    'Villa spacieuse idéale pour les familles. 3 chambres, jardin privé, cuisine équipée. Quartier sécurisé avec gardien 24h/24.',
    'guest-house',
    'Cotonou',
    'Akpakpa',
    'Boulevard Lagunaire, Akpakpa Centre',
    6.3498, 2.4419,
    35000, 'night',
    3, 2, 80, true, true,
    ARRAY['Climatisation', 'WiFi', 'Jardin', 'Cuisine équipée', 'Sécurité 24h/24', 'Parking'],
    ARRAY['/src/assets/property-2.jpg'],
    '550e8400-e29b-41d4-a716-446655440002',
    4.9, 32
),
(
    '550e8400-e29b-41d4-a716-446655440103',
    'Maison Traditionnelle Porto-Novo',
    'Charmante maison traditionnelle au cœur de Porto-Novo. Architecture locale authentique, proche des sites historiques.',
    'guest-house',
    'Porto-Novo',
    'Centre',
    'Rue Royale, près du Palais Royal',
    6.4969, 2.6036,
    18000, 'night',
    2, 1, 55, false, false,
    ARRAY['Ventilateur', 'Eau courante', 'Électricité', 'Proximité sites historiques'],
    ARRAY['/src/assets/property-3.jpg'],
    '550e8400-e29b-41d4-a716-446655440003',
    4.7, 22
),

-- Locations Longue Durée
(
    '550e8400-e29b-41d4-a716-446655440201',
    'Appartement F3 Cadjehoun',
    'Bel appartement F3 dans une résidence sécurisée. Idéal pour famille ou colocation. Proche université et centres commerciaux.',
    'long-term-rental',
    'Cotonou',
    'Cadjehoun',
    'Résidence Les Palmiers, Cadjehoun',
    6.3833, 2.3833,
    120000, 'month',
    3, 2, 75, false, true,
    ARRAY['Eau courante', 'Électricité', 'Sécurité', 'Parking', 'Proche université'],
    ARRAY['/src/assets/property-4.jpg'],
    '550e8400-e29b-41d4-a716-446655440001',
    4.6, 18
),
(
    '550e8400-e29b-41d4-a716-446655440202',
    'Studio Meublé Jéricho',
    'Studio moderne entièrement meublé dans le quartier résidentiel de Jéricho. Parfait pour jeune professionnel.',
    'long-term-rental',
    'Cotonou',
    'Jéricho',
    'Avenue Clozel, Jéricho',
    6.3667, 2.4167,
    65000, 'month',
    1, 1, 35, true, false,
    ARRAY['Climatisation', 'WiFi', 'Meublé', 'Cuisine équipée', 'Eau courante', 'Électricité'],
    ARRAY['/src/assets/property-5.jpg'],
    '550e8400-e29b-41d4-a716-446655440002',
    4.5, 12
),
(
    '550e8400-e29b-41d4-a716-446655440203',
    'Maison F4 Calavi',
    'Grande maison familiale à Calavi. 4 chambres, grand salon, cuisine, cour spacieuse. Quartier calme et sécurisé.',
    'long-term-rental',
    'Abomey-Calavi',
    'Calavi Centre',
    'Carrefour Université, Calavi',
    6.4500, 2.3500,
    85000, 'month',
    4, 2, 120, false, true,
    ARRAY['Eau courante', 'Électricité', 'Cour spacieuse', 'Parking', 'Quartier calme'],
    ARRAY['/src/assets/hero-image.jpg'],
    '550e8400-e29b-41d4-a716-446655440003',
    4.4, 8
);

-- Insertion de quelques réservations de test
INSERT INTO bookings (
    id, property_id, guest_id, check_in, check_out, total_price,
    status, payment_status, guest_name, guest_phone, guest_email, number_of_guests
) VALUES
(
    '550e8400-e29b-41d4-a716-446655440301',
    '550e8400-e29b-41d4-a716-446655440101',
    '550e8400-e29b-41d4-a716-446655440004',
    '2024-02-15', '2024-02-18',
    75000, 'confirmed', 'paid',
    'Pierre Agbo', '+229 94 12 34 56', 'pierre.agbo@email.com', 2
),
(
    '550e8400-e29b-41d4-a716-446655440302',
    '550e8400-e29b-41d4-a716-446655440102',
    '550e8400-e29b-41d4-a716-446655440004',
    '2024-03-01', '2024-03-05',
    140000, 'pending', 'pending',
    'Pierre Agbo', '+229 94 12 34 56', 'pierre.agbo@email.com', 4
);
