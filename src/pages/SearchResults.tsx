import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PropertyService } from '@/services/propertyService';
import { Property, SearchFilters, PropertyType, SortOption } from '@/types/property';
import Header from '@/components/Header';
import PropertyCard from '@/components/PropertyCard';
import SearchBar from '@/components/SearchBar';
import MapComponent from '@/components/MapComponent';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Filter, 
  MapPin, 
  Grid3X3, 
  List,
  SlidersHorizontal,
  Heart,
  Star 
} from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Récupération des paramètres de recherche depuis l'URL
  const typeParam = searchParams.get('type');
  const propertyType = (typeParam === 'guest-house' || typeParam === 'long-term-rental') ? typeParam : 'guest-house';
  const city = searchParams.get('city') || '';
  const minParam = searchParams.get('min');
  const maxParam = searchParams.get('max');
  const min = minParam ? Number(minParam) : undefined;
  const max = maxParam ? Number(maxParam) : undefined;

  // Construction des filtres de recherche
  const searchFilters: SearchFilters = {
    type: typeParam !== 'all' ? propertyType : undefined,
    city: city || undefined,
    priceRange: min || max ? { min: min || 0, max: max || 999999999 } : undefined,
    sortBy
  };

  // Requête pour récupérer les propriétés
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['properties', 'search', searchFilters],
    queryFn: () => PropertyService.searchProperties(searchFilters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transformation des propriétés pour l'affichage
  const transformedProperties = properties.map(property => ({
    ...property,
    bedrooms: property.specifications?.bedrooms || 1,
    bathrooms: property.specifications?.bathrooms || 1,
    amenities: property.amenities || [],
    owner: property.owner || {
      id: 'unknown',
      name: 'Propriétaire',
      phone: '',
      email: '',
      verified: false
    }
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Barre de recherche */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* En-tête des résultats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {properties.length} {properties.length > 1 ? 'biens trouvés' : 'bien trouvé'}
            </h1>
            {city && (
              <p className="text-gray-600 mt-1">
                à {city}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Tri */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Pertinence</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
                <SelectItem value="rating">Mieux notés</SelectItem>
                <SelectItem value="newest">Plus récents</SelectItem>
                <SelectItem value="oldest">Plus anciens</SelectItem>
              </SelectContent>
            </Select>

            {/* Mode d'affichage */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2 rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
                Grille
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-x-0"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex items-center gap-2 rounded-l-none"
              >
                <MapPin className="h-4 w-4" />
                Carte
              </Button>
            </div>

            {/* Filtres */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
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
            </CardContent>
          </Card>
        )}

        {/* Résultats */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun bien trouvé
              </h3>
              <p className="text-gray-600 mb-6">
                Essayez de modifier vos critères de recherche
              </p>
              <Button onClick={() => window.location.reload()}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <>
              {viewMode === 'map' ? (
                <div className="space-y-4">
                  <MapComponent 
                    properties={transformedProperties}
                    height="600px"
                    onPropertyClick={setSelectedProperty}
                    selectedProperty={selectedProperty}
                  />
                  {selectedProperty && (
                    <Card className="p-4">
                      <div className="flex gap-4">
                        <img 
                          src={selectedProperty.images[0] || '/placeholder.svg'}
                          alt={selectedProperty.title}
                          className="w-32 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{selectedProperty.title}</h3>
                          <p className="text-gray-600">
                            {selectedProperty.location.city}, {selectedProperty.location.district}
                          </p>
                          <p className="font-bold text-primary mt-2">
                            {selectedProperty.price.amount.toLocaleString()} CFA
                            <span className="text-sm font-normal text-gray-600 ml-1">
                              /{selectedProperty.type === 'guest-house' ? 'nuit' : 'mois'}
                            </span>
                          </p>
                        </div>
                        <Link to={`/property/${selectedProperty.id}`}>
                          <Button>Voir détails</Button>
                        </Link>
                      </div>
                    </Card>
                  )}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {transformedProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      title={property.title}
                      location={`${property.location.city}, ${property.location.district}`}
                      price={property.price.amount}
                      rating={property.rating?.average || 0}
                      reviews={property.rating?.count || 0}
                      image={property.images[0] || '/placeholder.svg'}
                      type={property.type}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {transformedProperties.map((property) => (
                    <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="flex">
                        <div className="w-64 h-48 flex-shrink-0">
                          <img 
                            src={property.images[0] || '/placeholder.svg'} 
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <Link to={`/property/${property.id}`}>
                                <h3 className="text-xl font-semibold hover:text-primary transition-colors">
                                  {property.title}
                                </h3>
                              </Link>
                              <p className="text-gray-600 mt-1">
                                {property.location.city}, {property.location.district}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Heart className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <p className="text-gray-700 mb-4 line-clamp-2">
                            {property.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{property.rating?.average || 0}</span>
                                <span className="text-gray-600">({property.rating?.count || 0})</span>
                              </div>
                              <Badge variant="secondary">
                                {property.specifications.bedrooms} ch • {property.specifications.bathrooms} sdb
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary">
                                {property.price.amount.toLocaleString()} CFA
                              </p>
                              <p className="text-gray-600 text-sm">
                                {property.type === 'guest-house' ? 'par nuit' : 'par mois'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {properties.length > 0 && (
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
