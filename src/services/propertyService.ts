import { supabase } from '@/lib/supabase';
import { Property, SearchFilters, PropertyType, SortOption } from '@/types/property';

interface DbProperty {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price_amount: number;
  price_currency: string;
  price_period: 'night' | 'month' | 'year';
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnished: boolean;
  parking: boolean;
  available: boolean;
  available_from?: string;
  minimum_stay?: number;
  owner_id: string;
  rating_average?: number;
  rating_count?: number;
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    phone: string;
    email: string;
    verified: boolean;
  };
}

interface PropertyCreateData {
  title: string;
  description: string;
  type: PropertyType;
  city: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  price_amount: number;
  price_period: 'night' | 'month' | 'year';
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnished: boolean;
  parking: boolean;
  available: boolean;
  available_from?: string;
  minimum_stay?: number;
}

interface PropertyUpdateData {
  title?: string;
  description?: string;
  type?: PropertyType;
  city?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price_amount?: number;
  price_period?: 'night' | 'month' | 'year';
  images?: string[];
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  furnished?: boolean;
  parking?: boolean;
  available?: boolean;
  available_from?: string;
  minimum_stay?: number;
}

export class PropertyService {
  // Méthode pour obtenir les propriétés d'un propriétaire
  static async getOwnerProperties(ownerId: string): Promise<Property[]> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          users!properties_owner_id_fkey (
            id,
            name,
            phone,
            email,
            verified
          )
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération propriétés propriétaire:', error);
        throw new Error(error.message);
      }

      return data?.map(this.transformProperty) || [];
    } catch (error) {
      console.error('Erreur service propriétés propriétaire:', error);
      throw error;
    }
  }

  // Rechercher des propriétés avec filtres
  static async searchProperties(filters: SearchFilters = {}): Promise<Property[]> {
    let query = supabase
      .from('properties')
      .select(`
        *,
        users!properties_owner_id_fkey (
          id, name, phone, email, verified
        )
      `)
      .eq('available', true);

    // Filtres par type
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    // Filtres par ville
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    // Filtres par quartier
    if (filters.district) {
      query = query.ilike('district', `%${filters.district}%`);
    }

    // Filtres par prix
    if (filters.priceRange?.min) {
      query = query.gte('price_amount', filters.priceRange.min);
    }
    if (filters.priceRange?.max) {
      query = query.lte('price_amount', filters.priceRange.max);
    }

    // Filtres par nombre de chambres
    if (filters.bedrooms) {
      query = query.gte('bedrooms', filters.bedrooms);
    }

    // Filtres par nombre de salles de bain
    if (filters.bathrooms) {
      query = query.gte('bathrooms', filters.bathrooms);
    }

    // Filtres par équipements
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.overlaps('amenities', filters.amenities);
    }

    // Filtres par mobilier
    if (filters.furnished !== undefined) {
      query = query.eq('furnished', filters.furnished);
    }

    // Filtres par parking
    if (filters.parking !== undefined) {
      query = query.eq('parking', filters.parking);
    }

    // Application du tri selon les critères
    query = this.applySorting(query, filters.sortBy || 'relevance');

    const { data, error } = await query;

    if (error) {
      console.error('Erreur recherche propriétés:', error);
      throw new Error('Erreur lors de la recherche des propriétés');
    }

    return this.transformProperties(data || []);
  }

  // Obtenir une propriété par ID
  static async getPropertyById(id: string) {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        users!properties_owner_id_fkey (
          id, name, phone, email, verified
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération propriété:', error);
      throw new Error('Propriété non trouvée');
    }

    return this.transformProperty(data);
  }

  // Créer une nouvelle propriété
  static async createProperty(propertyData: PropertyCreateData, ownerId: string) {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...propertyData,
        owner_id: ownerId,
        price_currency: 'FCFA'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création propriété:', error);
      throw new Error('Erreur lors de la création de la propriété');
    }

    return this.transformProperty(data);
  }

  // Mettre à jour une propriété
  static async updateProperty(id: string, propertyData: PropertyUpdateData) {
    const { data, error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour propriété:', error);
      throw new Error('Erreur lors de la mise à jour de la propriété');
    }

    return this.transformProperty(data);
  }

  // Supprimer une propriété
  static async deleteProperty(id: string) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression propriété:', error);
      throw new Error('Erreur lors de la suppression de la propriété');
    }
  }

  // Transformer les données de la base vers le format Property
  private static transformProperty(dbProperty: DbProperty): Property {
    return {
      id: dbProperty.id,
      title: dbProperty.title,
      description: dbProperty.description,
      type: dbProperty.type,
      location: {
        city: dbProperty.city,
        district: dbProperty.district,
        address: dbProperty.address,
        coordinates: dbProperty.latitude && dbProperty.longitude ? {
          lat: dbProperty.latitude,
          lng: dbProperty.longitude
        } : undefined
      },
      price: {
        amount: dbProperty.price_amount,
        currency: 'FCFA' as const,
        period: dbProperty.price_period
      },
      images: dbProperty.images || [],
      amenities: dbProperty.amenities || [],
      specifications: {
        bedrooms: dbProperty.bedrooms,
        bathrooms: dbProperty.bathrooms,
        area: dbProperty.area,
        furnished: dbProperty.furnished,
        parking: dbProperty.parking
      },
      availability: {
        available: dbProperty.available,
        availableFrom: dbProperty.available_from ? new Date(dbProperty.available_from) : undefined,
        minimumStay: dbProperty.minimum_stay
      },
      owner: {
        id: dbProperty.users?.id || dbProperty.owner_id,
        name: dbProperty.users?.name || 'Propriétaire',
        phone: dbProperty.users?.phone || '',
        email: dbProperty.users?.email || '',
        verified: dbProperty.users?.verified || false
      },
      rating: dbProperty.rating_average && dbProperty.rating_count ? {
        average: dbProperty.rating_average,
        count: dbProperty.rating_count
      } : undefined,
      createdAt: new Date(dbProperty.created_at),
      updatedAt: new Date(dbProperty.updated_at)
    };
  }

  private static transformProperties(dbProperties: DbProperty[]): Property[] {
    return dbProperties.map(property => this.transformProperty(property));
  }

  // Appliquer le tri selon les critères sélectionnés
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static applySorting(query: any, sortBy: SortOption) {
    switch (sortBy) {
      case 'price-low':
        return query.order('price_amount', { ascending: true });
      
      case 'price-high':
        return query.order('price_amount', { ascending: false });
      
      case 'rating':
        return query
          .order('rating_average', { ascending: false, nullsFirst: false })
          .order('rating_count', { ascending: false, nullsFirst: false });
      
      case 'newest':
        return query.order('created_at', { ascending: false });
      
      case 'oldest':
        return query.order('created_at', { ascending: true });
      
      case 'relevance':
      default:
        // Tri par pertinence : note puis prix puis date
        return query
          .order('rating_average', { ascending: false, nullsFirst: false })
          .order('price_amount', { ascending: true })
          .order('created_at', { ascending: false });
    }
  }
}
