import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Users, Search, Filter, Plus, Minus } from 'lucide-react';
import { BENIN_CITIES } from '@/constants/benin';
import { PropertyType } from '@/types/property';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [propertyType, setPropertyType] = useState<PropertyType | 'all'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date>();
  const [checkOutDate, setCheckOutDate] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [duration, setDuration] = useState(1);
  const [minBudget, setMinBudget] = useState<number>();
  const [maxBudget, setMaxBudget] = useState<number>();

  // Pré-remplir depuis l'URL (utile sur /search)
  useEffect(() => {
    const type = searchParams.get('type');
    const city = searchParams.get('city');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const qGuests = searchParams.get('guests');
    const qDuration = searchParams.get('duration');

    if (type === 'guest-house' || type === 'long-term-rental' || type === 'all') {
      setPropertyType((type as PropertyType | 'all') ?? 'all');
    }
    if (city) setSelectedCity(city);
    if (min !== null && min !== undefined) {
      const n = Number(min);
      if (!Number.isNaN(n)) setMinBudget(n);
    }
    if (max !== null && max !== undefined) {
      const n = Number(max);
      if (!Number.isNaN(n)) setMaxBudget(n);
    }
    if (from) {
      const d = new Date(from);
      if (!isNaN(d.getTime())) setCheckInDate(d);
    }
    if (to) {
      const d = new Date(to);
      if (!isNaN(d.getTime())) setCheckOutDate(d);
    }
    if (qGuests) {
      const n = parseInt(qGuests, 10);
      if (!Number.isNaN(n)) setGuests(n);
    }
    if (qDuration) {
      const n = parseInt(qDuration, 10);
      if (!Number.isNaN(n)) setDuration(n);
    }
  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (propertyType) params.set('type', propertyType);
    if (selectedCity) params.set('city', selectedCity);
    if (minBudget !== undefined) params.set('min', String(minBudget));
    if (maxBudget !== undefined) params.set('max', String(maxBudget));
    if (checkInDate) params.set('from', format(checkInDate, 'yyyy-MM-dd'));
    if (checkOutDate) params.set('to', format(checkOutDate, 'yyyy-MM-dd'));
    if (propertyType === 'long-term-rental') {
      params.set('duration', String(duration));
    } else {
      params.set('guests', String(guests));
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Type Selection */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-full p-1 shadow-lg border border-gray-200">
          <div className="flex space-x-1">
            <Button 
              variant={propertyType === 'all' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full px-6 font-medium transition-all ${
                propertyType === 'all' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }`}
              onClick={() => setPropertyType('all')}
            >
              Tous les biens
            </Button>
            <Button 
              variant={propertyType === 'guest-house' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full px-6 font-medium transition-all ${
                propertyType === 'guest-house' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }`}
              onClick={() => setPropertyType('guest-house')}
            >
              Guest Houses
            </Button>
            <Button 
              variant={propertyType === 'long-term-rental' ? 'default' : 'ghost'}
              size="sm"
              className={`rounded-full px-6 font-medium transition-all ${
                propertyType === 'long-term-rental' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-700 hover:text-primary hover:bg-gray-50'
              }`}
              onClick={() => setPropertyType('long-term-rental')}
            >
              Locations Longue Durée
            </Button>
          </div>
        </div>
      </div>

      {/* Main Search Bar */}
      <div className="bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Location */}
          <div className="p-4 border-r border-gray-200 last:border-r-0 rounded-l-full hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">Localisation</p>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="border-0 p-0 h-auto text-sm text-gray-600 hover:text-gray-900">
                    <SelectValue placeholder="Choisir une ville" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {BENIN_CITIES.map((city) => (
                      <SelectItem key={city} value={city} className="text-gray-900 hover:bg-gray-50">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="p-4 border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {propertyType === 'long-term-rental' ? 'Disponibilité' : 'Arrivée'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {checkInDate 
                        ? format(checkInDate, 'dd MMM yyyy', { locale: fr })
                        : (propertyType === 'long-term-rental' ? 'À partir de quand ?' : 'Ajouter des dates')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <CalendarComponent
                mode="single"
                selected={checkInDate}
                onSelect={setCheckInDate}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          {/* Duration/Guests */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="p-4 border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  {propertyType === 'long-term-rental' ? (
                    <Calendar className="h-5 w-5 text-primary" />
                  ) : (
                    <Users className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {propertyType === 'long-term-rental' ? 'Durée' : 'Voyageurs'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {propertyType === 'long-term-rental' 
                        ? `${duration} mois` 
                        : `${guests} ${guests > 1 ? 'invités' : 'invité'}`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white" align="start">
              <div className="p-4 space-y-4">
                {propertyType === 'long-term-rental' ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Durée de location (mois)</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setDuration(Math.max(1, duration - 1))}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-lg w-12 text-center">{duration}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setDuration(duration + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-gray-900">Nombre d'invités</Label>
                    <div className="flex items-center space-x-3 mt-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="font-medium text-lg w-12 text-center">{guests}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setGuests(guests + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Budget */}
          <Popover>
            <PopoverTrigger asChild>
              <div className="p-4 border-r border-gray-200 last:border-r-0 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <span className="text-primary font-bold text-sm bg-primary/10 px-2 py-1 rounded">CFA</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">Budget</p>
                    <p className="text-gray-600 text-sm">
                      {minBudget || maxBudget 
                        ? `${minBudget?.toLocaleString() || 0} - ${maxBudget?.toLocaleString() || '∞'} CFA`
                        : (propertyType === 'long-term-rental' ? 'Par mois' : 'Par nuit')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-white" align="start">
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Budget {propertyType === 'long-term-rental' ? 'mensuel' : 'par nuit'} (CFA)
                  </Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label className="text-xs text-gray-600">Minimum</Label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={minBudget || ''}
                        onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Maximum</Label>
                      <Input 
                        type="number" 
                        placeholder="∞"
                        value={maxBudget || ''}
                        onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : undefined)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Search & Filters */}
          <div className="p-4 rounded-r-full hover:bg-gray-50 transition-colors flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 text-gray-700 hover:text-primary hover:bg-gray-100 border border-gray-300 ${
                showFilters ? 'bg-primary/10 text-primary border-primary' : ''
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filtres</span>
            </Button>
            
            <Button className="bg-primary hover:bg-primary/90 text-white rounded-full ml-4 shadow-md" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 bg-white rounded-lg p-6 shadow-lg border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-900">Filtres avancés</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Nombre de chambres</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="1" className="text-gray-900 hover:bg-gray-50">1 chambre</SelectItem>
                  <SelectItem value="2" className="text-gray-900 hover:bg-gray-50">2 chambres</SelectItem>
                  <SelectItem value="3" className="text-gray-900 hover:bg-gray-50">3 chambres</SelectItem>
                  <SelectItem value="4+" className="text-gray-900 hover:bg-gray-50">4+ chambres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Équipements</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="ac" className="text-gray-900 hover:bg-gray-50">Climatisation</SelectItem>
                  <SelectItem value="wifi" className="text-gray-900 hover:bg-gray-50">Internet/WiFi</SelectItem>
                  <SelectItem value="parking" className="text-gray-900 hover:bg-gray-50">Parking</SelectItem>
                  <SelectItem value="generator" className="text-gray-900 hover:bg-gray-50">Groupe électrogène</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Type de bien</label>
              <Select>
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="furnished" className="text-gray-900 hover:bg-gray-50">Meublé</SelectItem>
                  <SelectItem value="unfurnished" className="text-gray-900 hover:bg-gray-50">Non meublé</SelectItem>
                  <SelectItem value="semi-furnished" className="text-gray-900 hover:bg-gray-50">Semi-meublé</SelectItem>
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