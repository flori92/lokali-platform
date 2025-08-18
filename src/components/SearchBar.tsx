import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Users, Filter } from "lucide-react";
import { BENIN_CITIES, COTONOU_DISTRICTS } from "@/constants/benin";
import { PropertyType } from "@/types/property";

const SearchBar = () => {
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Type Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-card rounded-full p-1 shadow-sm border">
          <div className="flex space-x-1">
            <Button 
              variant={propertyType === 'all' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full px-6"
              onClick={() => setPropertyType('all')}
            >
              Tous les biens
            </Button>
            <Button 
              variant={propertyType === 'guest-house' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full px-6"
              onClick={() => setPropertyType('guest-house')}
            >
              Guest Houses
            </Button>
            <Button 
              variant={propertyType === 'long-term-rental' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-full px-6"
              onClick={() => setPropertyType('long-term-rental')}
            >
              Locations Longue Durée
            </Button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="bg-card rounded-full shadow-card hover:shadow-card-hover transition-all duration-300 border border-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Location */}
          <div className="p-4 border-r border-border last:border-r-0 rounded-l-full hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Localisation</p>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-0 p-0 h-auto text-sm text-muted-foreground">
                    <SelectValue placeholder="Choisir une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENIN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="p-4 border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">
                  {propertyType === 'long-term-rental' ? 'Disponibilité' : 'Arrivée'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {propertyType === 'long-term-rental' ? 'À partir de quand ?' : 'Ajouter des dates'}
                </p>
              </div>
            </div>
          </div>

          {/* Duration/Guests */}
          <div className="p-4 border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              {propertyType === 'long-term-rental' ? (
                <Calendar className="h-5 w-5 text-primary" />
              ) : (
                <Users className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {propertyType === 'long-term-rental' ? 'Durée' : 'Voyageurs'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {propertyType === 'long-term-rental' ? 'Combien de mois ?' : 'Ajouter des invités'}
                </p>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="p-4 border-r border-border last:border-r-0 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3">
              <span className="text-primary font-bold text-sm">CFA</span>
              <div>
                <p className="font-semibold text-sm">Budget</p>
                <p className="text-muted-foreground text-sm">
                  {propertyType === 'long-term-rental' ? 'Par mois' : 'Par nuit'}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-r-full hover:bg-muted/50 transition-colors flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filtres</span>
            </Button>
            
            <Button variant="hero" size="icon" className="rounded-full ml-4">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 bg-card rounded-lg p-6 shadow-sm border">
          <h3 className="font-semibold mb-4">Filtres avancés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre de chambres</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 chambre</SelectItem>
                  <SelectItem value="2">2 chambres</SelectItem>
                  <SelectItem value="3">3 chambres</SelectItem>
                  <SelectItem value="4+">4+ chambres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Équipements</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ac">Climatisation</SelectItem>
                  <SelectItem value="wifi">Internet/WiFi</SelectItem>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="generator">Groupe électrogène</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Type de bien</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="furnished">Meublé</SelectItem>
                  <SelectItem value="unfurnished">Non meublé</SelectItem>
                  <SelectItem value="semi-furnished">Semi-meublé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;