import { supabase } from '@/lib/supabase';
import { User } from '@/types/property';

export class UserService {
  // Créer un nouvel utilisateur
  static async createUser(userData: {
    email: string;
    name: string;
    phone: string;
    role?: 'guest' | 'owner' | 'admin';
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert({
        ...userData,
        role: userData.role || 'guest'
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur création utilisateur:', error);
      throw new Error('Erreur lors de la création de l\'utilisateur');
    }

    return this.transformUser(data);
  }

  // Obtenir un utilisateur par ID
  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération utilisateur:', error);
      throw new Error('Utilisateur non trouvé');
    }

    return this.transformUser(data);
  }

  // Obtenir un utilisateur par email
  static async getUserByEmail(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Erreur récupération utilisateur par email:', error);
      return null;
    }

    return this.transformUser(data);
  }

  // Mettre à jour un utilisateur
  static async updateUser(id: string, userData: Partial<{
    name: string;
    phone: string;
    verified: boolean;
  }>) {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
    }

    return this.transformUser(data);
  }

  // Obtenir les propriétés d'un propriétaire
  static async getOwnerProperties(ownerId: string) {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération propriétés propriétaire:', error);
      throw new Error('Erreur lors de la récupération des propriétés');
    }

    return data || [];
  }

  // Transformer les données de la base vers le format User
  private static transformUser(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone,
      role: dbUser.role,
      verified: dbUser.verified,
      createdAt: new Date(dbUser.created_at)
    };
  }
}
