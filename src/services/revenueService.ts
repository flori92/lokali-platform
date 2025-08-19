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
    owner_id: string;
  };
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  averageBookingValue: number;
  totalBookings: number;
  monthlyBookings: number;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByProperty: Array<{
    propertyId: string;
    propertyTitle: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface ExportData {
  bookings: Booking[];
  stats: RevenueStats;
  period: {
    start: Date;
    end: Date;
  };
}

export class RevenueService {
  // Calculer les statistiques de revenus pour un propriétaire
  static async getRevenueStats(ownerId: string, startDate?: Date, endDate?: Date): Promise<RevenueStats> {
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

      // Récupérer toutes les réservations confirmées/complétées
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner (
            id,
            title,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .in('status', ['confirmed', 'completed'])
        .gte('created_at', startDate?.toISOString() || startOfYear.toISOString())
        .lte('created_at', endDate?.toISOString() || currentDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération données revenus:', error);
        throw new Error(error.message);
      }

      const allBookings = bookings || [];
      
      // Calculs de base
      const totalRevenue = allBookings.reduce((sum, booking) => sum + booking.total_price, 0);
      const totalBookings = allBookings.length;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Revenus mensuels
      const monthlyBookings = allBookings.filter(booking => 
        new Date(booking.created_at) >= startOfMonth
      );
      const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.total_price, 0);

      // Revenus annuels
      const yearlyBookings = allBookings.filter(booking => 
        new Date(booking.created_at) >= startOfYear
      );
      const yearlyRevenue = yearlyBookings.reduce((sum, booking) => sum + booking.total_price, 0);

      // Revenus par mois (12 derniers mois)
      const revenueByMonth = this.calculateMonthlyRevenue(allBookings);

      // Revenus par propriété
      const revenueByProperty = this.calculatePropertyRevenue(allBookings);

      return {
        totalRevenue,
        monthlyRevenue,
        yearlyRevenue,
        averageBookingValue,
        totalBookings,
        monthlyBookings: monthlyBookings.length,
        revenueByMonth,
        revenueByProperty
      };
    } catch (error) {
      console.error('Erreur service revenus:', error);
      throw error;
    }
  }

  // Calculer les revenus par mois
  private static calculateMonthlyRevenue(bookings: DbBooking[]): Array<{month: string; revenue: number; bookings: number}> {
    const monthlyData = new Map<string, {revenue: number; bookings: number}>();
    const currentDate = new Date();
    
    // Initialiser les 12 derniers mois
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      monthlyData.set(monthKey, { revenue: 0, bookings: 0 });
    }

    // Calculer les revenus par mois
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.created_at);
      const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const current = monthlyData.get(monthKey)!;
        monthlyData.set(monthKey, {
          revenue: current.revenue + booking.total_price,
          bookings: current.bookings + 1
        });
      }
    });

    return Array.from(monthlyData.entries()).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        month: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        revenue: data.revenue,
        bookings: data.bookings
      };
    });
  }

  // Calculer les revenus par propriété
  private static calculatePropertyRevenue(bookings: DbBooking[]): Array<{propertyId: string; propertyTitle: string; revenue: number; bookings: number}> {
    const propertyData = new Map<string, {title: string; revenue: number; bookings: number}>();

    bookings.forEach(booking => {
      const propertyId = booking.property_id;
      const propertyTitle = booking.properties?.title || `Propriété ${propertyId.slice(0, 8)}`;
      
      if (propertyData.has(propertyId)) {
        const current = propertyData.get(propertyId)!;
        propertyData.set(propertyId, {
          title: propertyTitle,
          revenue: current.revenue + booking.total_price,
          bookings: current.bookings + 1
        });
      } else {
        propertyData.set(propertyId, {
          title: propertyTitle,
          revenue: booking.total_price,
          bookings: 1
        });
      }
    });

    return Array.from(propertyData.entries())
      .map(([propertyId, data]) => ({
        propertyId,
        propertyTitle: data.title,
        revenue: data.revenue,
        bookings: data.bookings
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  // Préparer les données pour export
  static async prepareExportData(ownerId: string, startDate: Date, endDate: Date): Promise<ExportData> {
    try {
      // Récupérer les réservations pour la période
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties!inner (
            id,
            title,
            city,
            district,
            owner_id
          )
        `)
        .eq('properties.owner_id', ownerId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Transformer les données en format Booking
      const transformedBookings: Booking[] = (bookings || []).map(booking => ({
        id: booking.id,
        propertyId: booking.property_id,
        guestId: booking.guest_id,
        checkIn: new Date(booking.check_in),
        checkOut: new Date(booking.check_out),
        totalPrice: booking.total_price,
        status: booking.status,
        paymentStatus: booking.payment_status,
        guestInfo: {
          name: booking.guest_name,
          phone: booking.guest_phone,
          email: booking.guest_email,
          numberOfGuests: booking.number_of_guests
        },
        createdAt: new Date(booking.created_at)
      }));

      // Calculer les statistiques pour la période
      const stats = await this.getRevenueStats(ownerId, startDate, endDate);

      return {
        bookings: transformedBookings,
        stats,
        period: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      console.error('Erreur préparation export:', error);
      throw error;
    }
  }

  // Générer un rapport CSV
  static generateCSVReport(exportData: ExportData): string {
    const { bookings, stats, period } = exportData;
    
    let csv = 'Rapport Financier Lokali\n';
    csv += `Période: ${period.start.toLocaleDateString('fr-FR')} - ${period.end.toLocaleDateString('fr-FR')}\n\n`;
    
    // Statistiques générales
    csv += 'STATISTIQUES GÉNÉRALES\n';
    csv += `Revenus totaux,${stats.totalRevenue} FCFA\n`;
    csv += `Nombre de réservations,${stats.totalBookings}\n`;
    csv += `Valeur moyenne par réservation,${stats.averageBookingValue.toFixed(0)} FCFA\n\n`;
    
    // Détail des réservations
    csv += 'DÉTAIL DES RÉSERVATIONS\n';
    csv += 'Date,Propriété,Client,Email,Check-in,Check-out,Invités,Prix,Statut\n';
    
    bookings.forEach(booking => {
      csv += `${booking.createdAt.toLocaleDateString('fr-FR')},`;
      csv += `Propriété ${booking.propertyId.slice(0, 8)},`;
      csv += `${booking.guestInfo.name},`;
      csv += `${booking.guestInfo.email},`;
      csv += `${booking.checkIn.toLocaleDateString('fr-FR')},`;
      csv += `${booking.checkOut.toLocaleDateString('fr-FR')},`;
      csv += `${booking.guestInfo.numberOfGuests || 1},`;
      csv += `${booking.totalPrice} FCFA,`;
      csv += `${booking.status}\n`;
    });
    
    return csv;
  }

  // Télécharger le rapport CSV
  static downloadCSVReport(exportData: ExportData, filename?: string): void {
    const csv = this.generateCSVReport(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename || `rapport-lokali-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
