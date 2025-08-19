import { supabase } from '@/lib/supabase';
import { Booking } from '@/types/property';

interface DbBooking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  number_of_guests?: number;
  created_at: string;
  properties?: {
    id: string;
    title: string;
    city: string;
    district: string;
    images: string[];
    owner_id?: string;
  };
  users?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export class BookingService {

  // Créer une nouvelle réservation
  static async createBooking(bookingData: {
    propertyId: string;
    guestId: string;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    numberOfGuests?: number;
  }) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        property_id: bookingData.propertyId,
        guest_id: bookingData.guestId,
        check_in: bookingData.checkIn.toISOString().split('T')[0],
        check_out: bookingData.checkOut.toISOString().split('T')[0],
        total_price: bookingData.totalPrice,
        guest_name: bookingData.guestName,
        guest_phone: bookingData.guestPhone,
        guest_email: bookingData.guestEmail,
        number_of_guests: bookingData.numberOfGuests
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création réservation:', error);
      throw new Error('Erreur lors de la création de la réservation');
    }

    return this.transformBooking(data);
  }

  // Obtenir les réservations d'un utilisateur
  static async getUserBookings(userId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (
          id, title, city, district, images
        )
      `)
      .eq('guest_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération réservations utilisateur:', error);
      throw new Error('Erreur lors de la récupération des réservations');
    }

    return (data || []).map(booking => this.transformBooking(booking));
  }

  // Obtenir les réservations d'une propriété
  static async getPropertyBookings(propertyId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        property:properties(*),
        guest:users(*)
      `)
      .eq('property_id', propertyId)
      .order('check_in', { ascending: true });

    if (error) {
      throw new Error(`Erreur lors de la récupération des réservations: ${error.message}`);
    }

    return data?.map(this.transformBooking) || [];
  }

  // Obtenir les réservations pour les propriétés d'un propriétaire
  static async getOwnerBookings(ownerId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties!inner (
          id, title, city, district, owner_id
        )
      `)
      .eq('properties.owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération réservations propriétaire:', error);
      throw new Error('Erreur lors de la récupération des réservations');
    }

    return (data || []).map(booking => this.transformBooking(booking));
  }

  // Obtenir une réservation par ID
  static async getBookingById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        properties (
          id, title, city, district, images, owner_id
        ),
        users (
          id, name, email, phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération réservation:', error);
      throw new Error('Réservation non trouvée');
    }

    return this.transformBooking(data);
  }

  // Mettre à jour le statut d'une réservation
  static async updateBookingStatus(
    id: string, 
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed',
    paymentStatus?: 'pending' | 'paid' | 'refunded'
  ) {
    const updateData: { status: string; payment_status?: string } = { status };
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour réservation:', error);
      throw new Error('Erreur lors de la mise à jour de la réservation');
    }

    return this.transformBooking(data);
  }

  // Vérifier la disponibilité d'une propriété
  static async checkAvailability(
    propertyId: string, 
    checkIn: Date, 
    checkOut: Date
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'pending'])
      .or(`check_in.lte.${checkOut.toISOString().split('T')[0]},check_out.gte.${checkIn.toISOString().split('T')[0]}`);

    if (error) {
      console.error('Erreur vérification disponibilité:', error);
      return false;
    }

    return (data || []).length === 0;
  }

  // Calculer le prix total d'une réservation
  static calculateTotalPrice(
    pricePerPeriod: number, 
    checkIn: Date, 
    checkOut: Date, 
    period: 'night' | 'month' | 'year'
  ): number {
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    
    switch (period) {
      case 'night': {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays * pricePerPeriod;
      }
      case 'month': {
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        return diffMonths * pricePerPeriod;
      }
      case 'year': {
        const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
        return diffYears * pricePerPeriod;
      }
      default:
        return pricePerPeriod;
    }
  }

  // Transformer les données de la base vers le format Booking
  private static transformBooking(dbBooking: DbBooking): Booking {
    return {
      id: dbBooking.id,
      propertyId: dbBooking.property_id,
      guestId: dbBooking.guest_id,
      checkIn: new Date(dbBooking.check_in),
      checkOut: new Date(dbBooking.check_out),
      totalPrice: dbBooking.total_price,
      status: dbBooking.status,
      paymentStatus: dbBooking.payment_status,
      guestInfo: {
        name: dbBooking.guest_name,
        phone: dbBooking.guest_phone,
        email: dbBooking.guest_email,
        numberOfGuests: dbBooking.number_of_guests
      },
      createdAt: new Date(dbBooking.created_at)
    };
  }
}
