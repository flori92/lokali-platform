import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService, AuthUser } from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: {
    name: string;
    phone: string;
    role?: 'guest' | 'owner';
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier l'utilisateur au chargement
    const initializeAuth = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = AuthService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await AuthService.signIn(email, password);
      // L'utilisateur sera mis à jour via onAuthStateChange
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData: {
    name: string;
    phone: string;
    role?: 'guest' | 'owner';
  }) => {
    setLoading(true);
    try {
      await AuthService.signUp(email, password, userData);
      // L'utilisateur sera mis à jour via onAuthStateChange
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { name?: string; phone?: string }) => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    await AuthService.updateProfile(user.id, updates);
    // Mettre à jour l'état local
    setUser({ ...user, ...updates });
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
