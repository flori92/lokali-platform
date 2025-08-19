import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin, Users, Bed, Bath, Wifi, Car, Coffee, Tv, Phone, Mail, MessageCircle } from 'lucide-react';
import Header from '@/components/Header';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import MessageSystem from '@/components/MessageSystem';
import { useAuth } from '@/contexts/AuthContext';

const PropertyDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showMessageSystem, setShowMessageSystem] = useState(false);

  // Mock data - remplacer par un appel API réel
  const property = {
    id: id || '1',
    title: 'Villa moderne avec piscine',
    description: 'Magnifique villa située dans un quartier calme de Cotonou. Parfait pour les familles ou groupes d\'amis.',
    type: 'guest-house' as const,
    location: 'Fidjrossè, Cotonou',
    price: 35000,
    currency: 'FCFA',
    period: 'nuit',
    images: ['/src/assets/property-1.jpg'],
    bedrooms: 3,
    bathrooms: 2,
    amenities: ['Climatisation', 'WiFi', 'Piscine', 'Parking'],
    rating: 4.8,
    reviews: 12,
    owner: {
      name: 'Marie Adjovi',
      phone: '+229 97 12 34 56',
      email: 'marie.adjovi@email.com'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images et infos principales */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={property.images[0]}
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                  {property.title}
                </h1>
                <Badge variant="secondary">
                  {property.type === 'guest-house' ? 'Guest House' : 'Location Longue Durée'}
                </Badge>
              </div>

              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                {property.location}
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-1 text-gray-500" />
                  <span>{property.bedrooms} chambres</span>
                </div>
                <div className="flex items-center">
                  <Bath className="h-5 w-5 mr-1 text-gray-500" />
                  <span>{property.bathrooms} salles de bain</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-1 text-yellow-500" />
                  <span>{property.rating} ({property.reviews} avis)</span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">
                  {property.description}
                </p>
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-3">Équipements</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar réservation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary">
                    {property.price.toLocaleString()} {property.currency}
                  </div>
                  <div className="text-gray-600">par {property.period}</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'arrivée
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de départ
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre de personnes
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>1 personne</option>
                      <option>2 personnes</option>
                      <option>3 personnes</option>
                      <option>4 personnes</option>
                      <option>5+ personnes</option>
                    </select>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={() => navigate(`/property/${id}/book`)}
                >
                  Réserver maintenant
                </Button>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Contacter le propriétaire</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{property.owner.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{property.owner.email}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => setShowMessageSystem(true)}
                    disabled={!user}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {user ? 'Envoyer un message' : 'Connectez-vous pour contacter'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal du système de messagerie */}
        {showMessageSystem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] relative">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMessageSystem(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="p-6 h-full">
                <h2 className="text-xl font-semibold mb-4">
                  Contacter le propriétaire - {property.title}
                </h2>
                <MessageSystem
                  propertyId={property.id}
                  recipientId="owner-mock-id" // À remplacer par l'ID réel du propriétaire
                  className="h-[calc(100%-60px)]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;
