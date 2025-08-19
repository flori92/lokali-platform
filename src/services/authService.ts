import { supabase } from '@/lib/supabase';
import { User } from '@/types/property';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'guest' | 'owner' | 'admin';
  verified: boolean;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser | null;
  message?: string;
  error?: string;
}

export class AuthService {
  // Connexion avec Google OAuth
  static async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Connexion Google initiée'
      };
    } catch (error) {
      console.error('Erreur connexion Google:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la connexion Google'
      };
    }
  }

  // Inscription avec email et mot de passe
  static async signUp(email: string, password: string, userData: {
    name: string;
    phone?: string;
    role?: 'guest' | 'owner';
  }): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          phone: userData.phone,
          role: userData.role || 'guest'
        }
      }
    });

    if (error) {
      console.error('Erreur inscription:', error);
      throw new Error(error.message);
    }

    // Créer le profil utilisateur dans la table users
    if (data.user) {
      await this.createUserProfile(data.user.id, {
        email: data.user.email!,
        name: userData.name,
        phone: userData.phone,
        role: userData.role || 'guest'
      });
    }

    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email!,
        name: userData.name,
        phone: userData.phone,
        role: userData.role || 'guest',
        verified: data.user.email_confirmed_at !== null
      } : null,
      message: 'Inscription réussie'
    };
  }

  // Connexion avec email et mot de passe
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Erreur connexion:', error);
      throw new Error(error.message);
    }

    return data;
  }

  // Déconnexion
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Erreur déconnexion:', error);
      throw new Error(error.message);
    }
  }

  // Obtenir l'utilisateur actuel
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Récupérer les données complètes depuis la table users
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erreur récupération profil:', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      verified: profile.verified
    };
  }

  // Créer le profil utilisateur dans la table users
  private static async createUserProfile(userId: string, userData: {
    email: string;
    name: string;
    phone: string;
    role: 'guest' | 'owner' | 'admin';
  }) {
    const { error } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        role: userData.role,
        verified: false
      });

    if (error) {
      console.error('Erreur création profil:', error);
      throw new Error('Erreur lors de la création du profil utilisateur');
    }
  }

  // Mettre à jour le profil utilisateur
  static async updateProfile(userId: string, updates: {
    name?: string;
    phone?: string;
  }) {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Erreur mise à jour profil:', error);
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  }

  // Réinitialisation mot de passe
  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Erreur réinitialisation:', error);
      throw new Error(error.message);
    }
  }

  // Écouter les changements d'état d'authentification
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = await this.getCurrentUser();
        callback(authUser);
      } else {
        callback(null);
      }
    });
  }
}
