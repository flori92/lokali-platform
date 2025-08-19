export type PropertyType = 'guest-house' | 'long-term-rental';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  location: {
    city: string;
    district: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  price: {
    amount: number;
    currency: 'FCFA';
    period: 'night' | 'month' | 'year';
  };
  images: string[];
  amenities: string[];
  specifications: {
    bedrooms: number;
    bathrooms: number;
    area: number; // en m²
    furnished: boolean;
    parking: boolean;
  };
  availability: {
    available: boolean;
    availableFrom?: Date;
    minimumStay?: number; // en jours pour guest house, en mois pour long-term
  };
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
    verified: boolean;
  };
  rating?: {
    average: number;
    count: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type SortOption = 
  | 'relevance'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'newest'
  | 'oldest';

export interface SearchFilters {
  type?: PropertyType;
  city?: string;
  district?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  furnished?: boolean;
  parking?: boolean;
  availableFrom?: Date;
  minimumStay?: number;
  sortBy?: SortOption;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  guestInfo: {
    name: string;
    phone: string;
    email: string;
    numberOfGuests?: number;
  };
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'guest' | 'owner' | 'admin';
  verified: boolean;
  properties?: Property[];
  bookings?: Booking[];
  createdAt: Date;
}
