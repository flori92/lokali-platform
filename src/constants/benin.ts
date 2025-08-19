// Données spécifiques au Bénin pour la plateforme

export const BENIN_CITIES = [
  'Cotonou',
  'Porto-Novo',
  'Parakou',
  'Djougou',
  'Bohicon',
  'Kandi',
  'Lokossa',
  'Ouidah',
  'Abomey',
  'Natitingou',
  'Savalou',
  'Pobè',
  'Kétou',
  'Malanville',
  'Tanguiéta'
];

export const COTONOU_DISTRICTS = [
  'Akpakpa',
  'Cadjehoun',
  'Dantokpa',
  'Fidjrossè',
  'Godomey',
  'Jéricho',
  'Menontin',
  'Missebo',
  'Pk3',
  'Pk10',
  'Sainte-Rita',
  'Tokpa-Domè',
  'Vedoko',
  'Zongo'
];

export const PORTO_NOVO_DISTRICTS = [
  'Adjarra',
  'Aguégués',
  'Akron',
  'Avrankou',
  'Dangbo',
  'Porto-Novo Centre',
  'Sèmè-Kpodji'
];

export const COMMON_AMENITIES = [
  'Climatisation',
  'Ventilateur',
  'Eau courante',
  'Électricité',
  'Internet/WiFi',
  'Télévision',
  'Réfrigérateur',
  'Cuisine équipée',
  'Balcon/Terrasse',
  'Jardin',
  'Sécurité 24h/24',
  'Groupe électrogène',
  'Eau de forage',
  'Carrelage',
  'Carreaux'
];

// Utilitaire minimal pour générer un id stable à partir d'un libellé
const toId = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Export attendu par PublishProperty.tsx: liste d'objets { id, name }
export const AMENITIES = COMMON_AMENITIES.map((name) => ({ id: toId(name), name }));

// Prix de référence basés sur le marché béninois (en FCFA) - Source: GESCIA BENIN
export const PRICE_RANGES = {
  guestHouse: {
    budget: { min: 8000, max: 20000 }, // par nuit
    standard: { min: 20000, max: 40000 },
    premium: { min: 40000, max: 80000 },
    luxury: { min: 80000, max: 150000 }
  },
  longTermRental: {
    // Basé sur les données réelles du marché béninois
    studio: { min: 25000, max: 75000 }, // par mois (Calavi: 25k, Cotonou: jusqu'à 75k)
    oneBedroom: { min: 35000, max: 120000 }, // 1 pièce
    twoBedroom: { min: 100000, max: 300000 }, // 2 pièces Cotonou
    threeBedroom: { min: 75000, max: 200000 }, // 3 pièces (Calavi: 75-100k)
    fourPlusBedroom: { min: 200000, max: 500000 }, // Maisons spacieuses
    villa: { min: 500000, max: 1500000 } // Villas F4+
  }
};

export const CURRENCY = {
  code: 'FCFA',
  symbol: 'CFA',
  name: 'Franc CFA',
  // Taux de change approximatif (1 EUR = 655 FCFA)
  eurRate: 655
};

export const MINIMUM_STAYS = {
  guestHouse: 1, // 1 nuit minimum
  longTermRental: 3 // 3 mois minimum
};

// Quartiers populaires par ville
export const POPULAR_DISTRICTS = {
  Cotonou: [
    'Fidjrossè', 'Akpakpa', 'Cadjehoun', 'Jéricho', 'Dantokpa',
    'Godomey', 'Menontin', 'Pk3', 'Pk10', 'Sainte-Rita'
  ],
  'Abomey-Calavi': [
    'Calavi Centre', 'Godomey', 'Akassato', 'Togba', 'Hêvié'
  ],
  'Porto-Novo': [
    'Porto-Novo Centre', 'Adjarra', 'Akron', 'Avrankou'
  ]
};

// Types de biens populaires
export const PROPERTY_FEATURES = {
  essential: ['Eau courante', 'Électricité'],
  comfort: ['Climatisation', 'Ventilateur', 'Internet/WiFi'],
  security: ['Sécurité 24h/24', 'Portail sécurisé'],
  convenience: ['Parking', 'Groupe électrogène', 'Eau de forage']
};
