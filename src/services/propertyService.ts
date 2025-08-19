import { supabase } from '@/lib/supabase';
import { Property, SearchFilters } from '@/types/property';

export class PropertyService {
  // Rechercher des propriétés avec filtres
  static async searchProperties(filters: SearchFilters = {}) {
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
    if (filters.type && filters.type !== 'all') {
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

    // Tri par défaut par note puis par prix
    query = query.order('rating_average', { ascending: false, nullsLast: true })
                 .order('price_amount', { ascending: true });

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
  static async createProperty(propertyData: any, ownerId: string) {
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
  static async updateProperty(id: string, propertyData: any) {
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
  private static transformProperty(dbProperty: any): Property {
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
        currency: dbProperty.price_currency || 'FCFA',
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

  private static transformProperties(dbProperties: any[]): Property[] {
    return dbProperties.map(property => this.transformProperty(property));
  }
}
