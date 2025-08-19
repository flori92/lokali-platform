import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'guest' | 'owner' | 'admin';
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  requireRole,
  redirectTo = '/login' 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Afficher un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Vérifier le rôle requis si spécifié
  if (requireRole && user.role !== requireRole) {
    // Rediriger selon le rôle de l'utilisateur
    const roleRedirects = {
      guest: '/',
      owner: '/dashboard',
      admin: '/admin'
    };
    
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
