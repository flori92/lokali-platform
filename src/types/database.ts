export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string
          title: string
          description: string
          type: 'guest-house' | 'long-term-rental'
          city: string
          district: string
          address: string
          latitude: number | null
          longitude: number | null
          price_amount: number
          price_currency: string
          price_period: 'night' | 'month' | 'year'
          bedrooms: number
          bathrooms: number
          area: number
          furnished: boolean
          parking: boolean
          amenities: string[]
          images: string[]
          available: boolean
          available_from: string | null
          minimum_stay: number | null
          owner_id: string
          rating_average: number | null
          rating_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: 'guest-house' | 'long-term-rental'
          city: string
          district: string
          address: string
          latitude?: number | null
          longitude?: number | null
          price_amount: number
          price_currency?: string
          price_period: 'night' | 'month' | 'year'
          bedrooms: number
          bathrooms: number
          area: number
          furnished?: boolean
          parking?: boolean
          amenities?: string[]
          images?: string[]
          available?: boolean
          available_from?: string | null
          minimum_stay?: number | null
          owner_id: string
          rating_average?: number | null
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: 'guest-house' | 'long-term-rental'
          city?: string
          district?: string
          address?: string
          latitude?: number | null
          longitude?: number | null
          price_amount?: number
          price_currency?: string
          price_period?: 'night' | 'month' | 'year'
          bedrooms?: number
          bathrooms?: number
          area?: number
          furnished?: boolean
          parking?: boolean
          amenities?: string[]
          images?: string[]
          available?: boolean
          available_from?: string | null
          minimum_stay?: number | null
          owner_id?: string
          rating_average?: number | null
          rating_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          phone: string
          role: 'guest' | 'owner' | 'admin'
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone: string
          role?: 'guest' | 'owner' | 'admin'
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string
          role?: 'guest' | 'owner' | 'admin'
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          property_id: string
          guest_id: string
          check_in: string
          check_out: string
          total_price: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status: 'pending' | 'paid' | 'refunded'
          guest_name: string
          guest_phone: string
          guest_email: string
          number_of_guests: number | null
          created_at: string
        }
        Insert: {
          id?: string
          property_id: string
          guest_id: string
          check_in: string
          check_out: string
          total_price: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          guest_name: string
          guest_phone: string
          guest_email: string
          number_of_guests?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          guest_id?: string
          check_in?: string
          check_out?: string
          total_price?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          payment_status?: 'pending' | 'paid' | 'refunded'
          guest_name?: string
          guest_phone?: string
          guest_email?: string
          number_of_guests?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
