import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Menu, User, LogIn, UserPlus, Settings, LogOut, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <span className="text-xl font-bold text-foreground">Lokali</span>
        </Link>

        {/* Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/search?type=guest-house" className="text-foreground hover:text-primary transition-colors">
            Guest Houses
          </Link>
          <Link to="/search?type=long-term-rental" className="text-foreground hover:text-primary transition-colors">
            Locations Longue Durée
          </Link>
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Aide
          </Link>
        </nav>

        {/* User actions */}
        <div className="flex items-center space-x-4">
          {/* Publier un bien - Visible seulement pour les propriétaires connectés */}
          {user?.role === 'owner' && (
            <Link to="/publish" className="hidden md:flex">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Publier mon bien
              </Button>
            </Link>
          )}
          
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 border border-border rounded-full p-2 hover:shadow-card transition-all duration-300 cursor-pointer">
                <Menu className="h-4 w-4" />
                {user ? (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  {/* Utilisateur connecté */}
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {user.role === 'owner' ? 'Propriétaire' : 'Locataire'}
                      </Badge>
                      {user.verified && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          Vérifié
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  
                  {user.role === 'owner' && (
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Mes biens
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link to="/bookings" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Mes réservations
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {/* Utilisateur non connecté */}
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Se connecter
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem asChild>
                    <Link to="/register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Créer un compte
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild>
                    <Link to="/register" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Devenir propriétaire
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;