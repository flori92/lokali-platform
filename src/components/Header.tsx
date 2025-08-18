import { Button } from "@/components/ui/button";
import { Heart, Menu, User } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-hero-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-foreground">StayNest</span>
        </div>

        {/* Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Séjours
          </a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Expériences
          </a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">
            Aide
          </a>
        </nav>

        {/* User actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="hidden md:flex">
            Mettre votre logement sur StayNest
          </Button>
          
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>

          <div className="flex items-center space-x-2 border border-border rounded-full p-2 hover:shadow-card transition-all duration-300 cursor-pointer">
            <Menu className="h-4 w-4" />
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;