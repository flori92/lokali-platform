import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Star, 
  Bed, 
  Bath, 
  Square, 
  Car, 
  Wifi, 
  Wind, 
  Phone, 
  Mail,
  Calendar,
  Users,
  Shield
} from "lucide-react";
import Header from "@/components/Header";
import { Property } from "@/types/property";

// Données d'exemple - à remplacer par des appels API
const mockProperty: Property = {
  id: "1",
  title: "Guest House Moderne Cotonou",
  description: "Magnifique guest house située dans le quartier résidentiel de Fidjrossè. Idéale pour les voyageurs d'affaires et les touristes. Proche des commodités et bien desservie par les transports.",
  type: "guest-house",
  location: {
    city: "Cotonou",
    district: "Fidjrossè",
    address: "Rue de la Paix, Fidjrossè",
    coordinates: { lat: 6.3654, lng: 2.4183 }
  },
  price: {
    amount: 25000,
    currency: "FCFA",
    period: "night"
  },
  images: [
    "/src/assets/property-1.jpg",
    "/src/assets/property-2.jpg",
    "/src/assets/property-3.jpg"
  ],
  amenities: [
    "Climatisation",
    "Internet/WiFi",
    "Télévision",
    "Réfrigérateur",
    "Sécurité 24h/24",
    "Parking",
    "Eau courante",
    "Électricité"
  ],
  specifications: {
    bedrooms: 2,
    bathrooms: 1,
    area: 45,
    furnished: true,
    parking: true
  },
  availability: {
    available: true,
    availableFrom: new Date(),
    minimumStay: 1
  },
  owner: {
    id: "owner1",
    name: "Adjovi Mensah",
    phone: "+229 97 12 34 56",
    email: "adjovi.mensah@email.com",
    verified: true
  },
  rating: {
    average: 4.8,
    count: 45
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

const PropertyDetails = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const property = mockProperty; // À remplacer par un appel API basé sur l'ID

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* En-tête de la propriété */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{property.location.district}, {property.location.city}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>{property.rating?.average}</span>
                  <span>({property.rating?.count} avis)</span>
                </div>
              </div>
            </div>
            <Badge variant={property.type === 'guest-house' ? 'default' : 'secondary'}>
              {property.type === 'guest-house' ? 'Guest House' : 'Location Longue Durée'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galerie d'images */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="aspect-video rounded-lg overflow-hidden mb-4">
                <img 
                  src={property.images[selectedImage]} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${property.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* Caractéristiques */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <Bed className="h-5 w-5 text-primary" />
                    <span>{property.specifications.bedrooms} chambres</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath className="h-5 w-5 text-primary" />
                    <span>{property.specifications.bathrooms} salle de bain</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Square className="h-5 w-5 text-primary" />
                    <span>{property.specifications.area} m²</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-primary" />
                    <span>{property.specifications.parking ? 'Parking' : 'Pas de parking'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Équipements */}
            <Card>
              <CardHeader>
                <CardTitle>Équipements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-sm">{amenity}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de réservation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-bold">
                      {property.price.amount.toLocaleString()} CFA
                    </span>
                    <span className="text-muted-foreground ml-1">
                      / {property.price.period === 'night' ? 'nuit' : 'mois'}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Disponible
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showBookingForm ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowBookingForm(true)}
                  >
                    {property.type === 'guest-house' ? 'Réserver maintenant' : 'Demander une visite'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 border rounded-lg">
                        <label className="text-xs text-muted-foreground">Arrivée</label>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">Sélectionner</span>
                        </div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <label className="text-xs text-muted-foreground">
                          {property.type === 'guest-house' ? 'Départ' : 'Durée'}
                        </label>
                        <div className="flex items-center space-x-1">
                          {property.type === 'guest-house' ? (
                            <Calendar className="h-4 w-4" />
                          ) : (
                            <Users className="h-4 w-4" />
                          )}
                          <span className="text-sm">Sélectionner</span>
                        </div>
                      </div>
                    </div>
                    
                    {property.type === 'guest-house' && (
                      <div className="p-3 border rounded-lg">
                        <label className="text-xs text-muted-foreground">Voyageurs</label>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">1 voyageur</span>
                        </div>
                      </div>
                    )}

                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Prix de base</span>
                        <span>{property.price.amount.toLocaleString()} CFA</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{property.price.amount.toLocaleString()} CFA</span>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Confirmer la réservation
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Informations du propriétaire */}
                <div>
                  <h3 className="font-semibold mb-3">Contact direct</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {property.owner.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{property.owner.name}</p>
                          {property.owner.verified && (
                            <div className="flex items-center space-x-1">
                              <Shield className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">Vérifié</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Phone className="h-4 w-4 mr-2" />
                        {property.owner.phone}
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Mail className="h-4 w-4 mr-2" />
                        Envoyer un message
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground text-center">
                  <p>🚫 Aucun frais d'intermédiation</p>
                  <p>💬 Contact direct avec le propriétaire</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
