import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid, List, SlidersHorizontal, MapPin, Star, Heart } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import { PropertyService } from '@/services/propertyService';
import { Property, SearchFilters } from '@/types/property';

type SimpleProperty = {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  type: 'guest-house' | 'long-term-rental';
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  owner: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
};

// Données d'exemple étendues (typées localement pour la démo UI)
const SAMPLE_PROPERTIES: SimpleProperty[] = [
  {
    id: '1',
    title: 'Guest House Moderne Cotonou',
    description: 'Magnifique guest house avec vue sur la lagune',
    location: 'Fidjrossè, Cotonou',
    price: 25000,
    rating: 4.8,
    reviews: 45,
    images: ['/src/assets/property-1.jpg'],
    type: 'guest-house',
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'ac', 'parking'],
    owner: {
      id: '1',
      name: 'Marie Adjovi',
      phone: '+229 97 12 34 56',
      email: 'marie.adjovi@email.com'
    }
  },
  {
    id: '2',
    title: 'Villa Familiale Akpakpa',
    description: 'Villa spacieuse pour familles nombreuses',
    location: 'Akpakpa, Cotonou',
    price: 35000,
    rating: 4.9,
    reviews: 32,
    images: ['/src/assets/property-2.jpg'],
    type: 'guest-house',
    bedrooms: 4,
    bathrooms: 3,
    amenities: ['wifi', 'ac', 'parking', 'generator'],
    owner: {
      id: '2',
      name: 'Jean Kossou',
      phone: '+229 96 87 65 43',
      email: 'jean.kossou@email.com'
    }
  },
  {
    id: '3',
    title: 'Appartement Moderne Calavi',
    description: 'Appartement 3 pièces non meublé, idéal pour location longue durée',
    location: 'Calavi, Abomey-Calavi',
    price: 85000,
    rating: 4.6,
    reviews: 18,
    images: ['/src/assets/property-3.jpg'],
    type: 'long-term-rental',
    bedrooms: 2,
    bathrooms: 2,
    amenities: ['wifi', 'parking'],
    owner: {
      id: '3',
      name: 'Sylvie Dossou',
      phone: '+229 95 11 22 33',
      email: 'sylvie.dossou@email.com'
    }
  },
  {
    id: '4',
    title: 'Studio Meublé Centre-ville',
    description: 'Studio entièrement équipé au cœur de Cotonou',
    location: 'Centre-ville, Cotonou',
    price: 45000,
    rating: 4.4,
    reviews: 27,
    images: ['/src/assets/property-4.jpg'],
    type: 'long-term-rental',
    bedrooms: 1,
    bathrooms: 1,
    amenities: ['wifi', 'ac'],
    owner: {
      id: '4',
      name: 'Paul Agbodjan',
      phone: '+229 94 55 66 77',
      email: 'paul.agbodjan@email.com'
    }
  },
  {
    id: '5',
    title: 'Maison Traditionnelle Porto-Novo',
    description: 'Charmante maison dans la capitale historique',
    location: 'Centre, Porto-Novo',
    price: 18000,
    rating: 4.7,
    reviews: 22,
    images: ['/src/assets/property-1.jpg'],
    type: 'guest-house',
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['wifi', 'parking'],
    owner: {
      id: '5',
      name: 'Fatou Sanni',
      phone: '+229 93 44 55 66',
      email: 'fatou.sanni@email.com'
    }
  },
  {
    id: '6',
    title: 'Villa de Luxe Ganvié',
    description: 'Villa exceptionnelle près de la cité lacustre',
    location: 'Ganvié, So-Ava',
    price: 120000,
    rating: 4.9,
    reviews: 15,
    images: ['/src/assets/property-2.jpg'],
    type: 'long-term-rental',
    bedrooms: 5,
    bathrooms: 4,
    amenities: ['wifi', 'ac', 'parking', 'generator', 'pool'],
    owner: {
      id: '6',
      name: 'Rodrigue Hounkpatin',
      phone: '+229 92 33 44 55',
      email: 'rodrigue.hounkpatin@email.com'
    }
  }
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('price');
  const [showFilters, setShowFilters] = useState(false);

  // Récupération des paramètres de recherche depuis l'URL
  const propertyType = searchParams.get('type') || 'all';
  const city = searchParams.get('city') || '';
  const minParam = searchParams.get('min');
  const maxParam = searchParams.get('max');
  const min = minParam ? Number(minParam) : undefined;
  const max = maxParam ? Number(maxParam) : undefined;

  // Construction des filtres pour l'API
  const searchFilters: SearchFilters = {
    type: propertyType === 'all' ? undefined : propertyType as 'guest-house' | 'long-term-rental',
    city: city || undefined,
    priceRange: (min || max) ? { min, max } : undefined
  };

  // Requête API avec React Query
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties', searchFilters],
    queryFn: () => PropertyService.searchProperties(searchFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transformation des propriétés API vers le format d'affichage
  const transformedProperties = properties.map(property => ({
    id: property.id,
    title: property.title,
    description: property.description,
    location: `${property.location.district}, ${property.location.city}`,
    price: property.price.amount,
    rating: property.rating?.average || 0,
    reviews: property.rating?.count || 0,
    images: property.images,
    type: property.type
  }));

  // Utiliser les données API ou fallback sur les données mockées
  const displayedProperties = properties.length > 0 ? transformedProperties : SAMPLE_PROPERTIES.filter(property => {
    if (propertyType !== 'all' && property.type !== propertyType) return false;
    if (city && !property.location.toLowerCase().includes(city.toLowerCase())) return false;
    if (typeof min === 'number' && !Number.isNaN(min) && property.price < min) return false;
    if (typeof max === 'number' && !Number.isNaN(max) && property.price > max) return false;
    return true;
  });

  const handleSort = (value: string) => {
    setSortBy(value);
    // Le tri sera géré côté API dans une version future
  };
    
    switch (value) {
      case 'price-low':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Tri par ID décroissant (simule les plus récents)
        sorted.sort((a, b) => b.id.localeCompare(a.id));
        break;
      default:
        // Relevance - garde l'ordre original
        break;
    }
    
    setFilteredProperties(sorted);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de recherche en haut */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Header des résultats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {displayedProperties.length} {displayedProperties.length > 1 ? 'biens trouvés' : 'bien trouvé'}
            </h1>
            <p className="text-gray-600 mt-1">
              {propertyType === 'guest-house' && 'Guest houses'}
              {propertyType === 'long-term-rental' && 'Locations longue durée'}
              {propertyType === 'all' && 'Tous les biens'}
              {city && ` à ${city}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tri */}
            <Select value={sortBy} onValueChange={handleSort}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Pertinence</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
              </SelectContent>
            </Select>

            {/* Mode d'affichage */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Filtres */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Filtres avancés</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Prix (CFA)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Chambres</label>
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
                  <label className="block text-sm font-medium mb-2">Note minimum</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.5">4.5+ ⭐</SelectItem>
                      <SelectItem value="4.0">4.0+ ⭐</SelectItem>
                      <SelectItem value="3.5">3.5+ ⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Équipements</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">WiFi</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Climatisation</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Parking</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats */}
        {displayedProperties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <MapPin className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun bien trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button variant="outline">
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {displayedProperties.map((property) => (
              viewMode === 'grid' ? (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  location={property.location}
                  price={property.price}
                  rating={property.rating}
                  reviews={property.reviews}
                  image={property.images[0]}
                  type={property.type}
                />
              ) : (
                <Card key={property.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-64 h-48 flex-shrink-0">
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {property.title}
                          </h3>
                          <Button variant="ghost" size="icon">
                            <Heart className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{property.location}</span>
                        </div>

                        <div className="flex items-center mb-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="font-medium">{property.rating}</span>
                          <span className="text-gray-600 ml-1">({property.reviews} avis)</span>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {property.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {property.bedrooms} ch.
                            </Badge>
                            <Badge variant="secondary">
                              {property.bathrooms} sdb.
                            </Badge>
                            <Badge variant="outline">
                              {property.type === 'guest-house' ? 'Guest House' : 'Location LD'}
                            </Badge>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              {property.price.toLocaleString()} CFA
                            </div>
                            <div className="text-sm text-gray-600">
                              {property.type === 'guest-house' ? 'par nuit' : 'par mois'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}

        {/* Pagination */}
        {displayedProperties.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>
                Précédent
              </Button>
              <Button variant="default">1</Button>
              <Button variant="outline">2</Button>
              <Button variant="outline">3</Button>
              <Button variant="outline">
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
