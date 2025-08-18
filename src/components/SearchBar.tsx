import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Users } from "lucide-react";

const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-full shadow-card hover:shadow-card-hover transition-all duration-300 border border-border">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
        {/* Destination */}
        <div className="p-4 border-r border-border last:border-r-0 rounded-l-full hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Destination</p>
              <p className="text-muted-foreground text-sm">Où allez-vous ?</p>
            </div>
          </div>
        </div>

        {/* Check-in */}
        <div className="p-4 border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Arrivée</p>
              <p className="text-muted-foreground text-sm">Ajouter des dates</p>
            </div>
          </div>
        </div>

        {/* Check-out */}
        <div className="p-4 border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Départ</p>
              <p className="text-muted-foreground text-sm">Ajouter des dates</p>
            </div>
          </div>
        </div>

        {/* Guests */}
        <div className="p-4 rounded-r-full hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Voyageurs</p>
              <p className="text-muted-foreground text-sm">Ajouter des invités</p>
            </div>
          </div>
          
          <Button variant="hero" size="icon" className="rounded-full ml-4">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;