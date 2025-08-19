import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, X, Plus, MapPin, Home, Euro, Camera, Check } from 'lucide-react';
import { BENIN_CITIES, AMENITIES } from '@/constants/benin';
import { PropertyType } from '@/types/property';
import ImageUpload, { UploadedImage } from '@/components/ui/ImageUpload';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import Header from '@/components/Header';

const PublishProperty = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyType, setPropertyType] = useState<PropertyType>('guest-house');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    city: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    price: '',
    bedrooms: '',
    bathrooms: '',
    surface: '',
    amenities: [] as string[],
    images: [] as UploadedImage[],
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    furnished: 'unfurnished'
  });

  const steps = [
    { id: 1, title: 'Type de bien', icon: Home },
    { id: 2, title: 'Informations', icon: MapPin },
    { id: 3, title: 'Tarification', icon: Euro },
    { id: 4, title: 'Photos', icon: Camera },
    { id: 5, title: 'Contact', icon: Check }
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setFormData(prev => ({
      ...prev,
      location: address,
      coordinates: coordinates
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImagesChange = (images: UploadedImage[]) => {
    setFormData(prev => ({
      ...prev,
      images: images
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Ici on enverrait les données au backend
    console.log('Données du bien:', { propertyType, ...formData });
    alert('Votre bien a été publié avec succès ! Il sera visible après validation.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Publier votre bien
          </h1>
          <p className="text-gray-600">
            Mettez votre propriété en location sans intermédiaires
          </p>
        </div>

        {/* Stepper */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-primary border-primary text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-primary' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-8">
            {/* Étape 1: Type de bien */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Quel type de bien proposez-vous ?</h2>
                  <RadioGroup value={propertyType} onValueChange={(value) => setPropertyType(value as PropertyType)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className={`cursor-pointer transition-all ${propertyType === 'guest-house' ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="guest-house" id="guest-house" />
                            <Label htmlFor="guest-house" className="cursor-pointer">
                              <div>
                                <h3 className="font-semibold">Guest House</h3>
                                <p className="text-sm text-gray-600">
                                  Hébergement de courte durée pour visiteurs et touristes
                                </p>
                                <Badge variant="secondary" className="mt-2">
                                  Tarif par nuit
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={`cursor-pointer transition-all ${propertyType === 'long-term-rental' ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="long-term-rental" id="long-term-rental" />
                            <Label htmlFor="long-term-rental" className="cursor-pointer">
                              <div>
                                <h3 className="font-semibold">Location Longue Durée</h3>
                                <p className="text-sm text-gray-600">
                                  Appartement ou maison pour location mensuelle
                                </p>
                                <Badge variant="secondary" className="mt-2">
                                  Tarif mensuel
                                </Badge>
                              </div>
                            </Label>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {/* Étape 2: Informations */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Informations sur votre bien</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Titre de l'annonce *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Villa moderne avec piscine"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {BENIN_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="location">Adresse/Quartier *</Label>
                    <AddressAutocomplete
                      value={formData.location}
                      onChange={handleAddressChange}
                      placeholder="Ex: Fidjrossè, près du marché, Cotonou"
                      className="w-full"
                    />
                    {formData.coordinates && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Coordonnées GPS détectées ({formData.coordinates.lat.toFixed(4)}, {formData.coordinates.lng.toFixed(4)})
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bedrooms">Nombre de chambres *</Label>
                    <Select value={formData.bedrooms} onValueChange={(value) => handleInputChange('bedrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num} chambre{num > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Nombre de salles de bain *</Label>
                    <Select value={formData.bathrooms} onValueChange={(value) => handleInputChange('bathrooms', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num} salle{num > 1 ? 's' : ''} de bain</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="surface">Surface (m²)</Label>
                    <Input
                      id="surface"
                      type="number"
                      placeholder="Ex: 80"
                      value={formData.surface}
                      onChange={(e) => handleInputChange('surface', e.target.value)}
                    />
                  </div>

                  {propertyType === 'long-term-rental' && (
                    <div>
                      <Label>État du mobilier</Label>
                      <RadioGroup value={formData.furnished} onValueChange={(value) => handleInputChange('furnished', value)}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="furnished" id="furnished" />
                          <Label htmlFor="furnished">Meublé</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="semi-furnished" id="semi-furnished" />
                          <Label htmlFor="semi-furnished">Semi-meublé</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="unfurnished" id="unfurnished" />
                          <Label htmlFor="unfurnished">Non meublé</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez votre bien, ses avantages, l'environnement..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Équipements et services</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {AMENITIES.map((amenity) => (
                      <div key={amenity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.id}
                          checked={formData.amenities.includes(amenity.id)}
                          onCheckedChange={() => handleAmenityToggle(amenity.id)}
                        />
                        <Label htmlFor={amenity.id} className="text-sm">{amenity.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Étape 3: Tarification */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Tarification</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="price">
                      Prix {propertyType === 'guest-house' ? 'par nuit' : 'par mois'} (CFA) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder={propertyType === 'guest-house' ? 'Ex: 25000' : 'Ex: 85000'}
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      {propertyType === 'guest-house' 
                        ? 'Prix moyen dans votre zone: 15 000 - 45 000 CFA/nuit'
                        : 'Prix moyen dans votre zone: 50 000 - 200 000 CFA/mois'
                      }
                    </p>
                  </div>
                </div>

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Conseils tarifaires</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Consultez les prix similaires dans votre quartier</li>
                      <li>• Ajustez selon les équipements proposés</li>
                      <li>• Commencez par un prix attractif pour les premiers avis</li>
                      {propertyType === 'guest-house' && (
                        <li>• Proposez des réductions pour les séjours longs</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 4: Photos */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Photos de votre bien</h2>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={handleImagesChange}
                  maxImages={10}
                  propertyId={propertyType}
                  enableRealUpload={false}
                  className="w-full"
                />

                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">📸 Conseils photos</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Prenez des photos avec une bonne luminosité naturelle</li>
                      <li>• Montrez toutes les pièces principales</li>
                      <li>• Mettez en valeur les équipements et espaces</li>
                      <li>• La première photo sera votre photo de couverture</li>
                      <li>• Évitez les photos floues ou mal cadrées</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Étape 5: Contact */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Informations de contact</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="ownerName">Nom complet *</Label>
                    <Input
                      id="ownerName"
                      placeholder="Ex: Marie Adjovi"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ownerPhone">Téléphone *</Label>
                    <Input
                      id="ownerPhone"
                      placeholder="Ex: +229 97 12 34 56"
                      value={formData.ownerPhone}
                      onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="ownerEmail">Email</Label>
                    <Input
                      id="ownerEmail"
                      type="email"
                      placeholder="Ex: marie.adjovi@email.com"
                      value={formData.ownerEmail}
                      onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                    />
                  </div>
                </div>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">🔒 Confidentialité</h3>
                    <p className="text-sm text-yellow-800">
                      Vos informations de contact ne seront visibles que par les personnes intéressées 
                      par votre bien. Lokali ne partage jamais vos données personnelles.
                    </p>
                  </CardContent>
                </Card>

                {/* Résumé */}
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé de votre annonce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Type:</strong> {propertyType === 'guest-house' ? 'Guest House' : 'Location Longue Durée'}</p>
                      <p><strong>Titre:</strong> {formData.title || 'Non renseigné'}</p>
                      <p><strong>Localisation:</strong> {formData.location}, {formData.city}</p>
                      <p><strong>Prix:</strong> {formData.price ? `${parseInt(formData.price).toLocaleString()} CFA` : 'Non renseigné'} {propertyType === 'guest-house' ? 'par nuit' : 'par mois'}</p>
                      <p><strong>Chambres:</strong> {formData.bedrooms || 'Non renseigné'}</p>
                      <p><strong>Photos:</strong> {formData.images.length} ajoutée{formData.images.length > 1 ? 's' : ''}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Précédent
              </Button>

              {currentStep < steps.length ? (
                <Button onClick={nextStep}>
                  Suivant
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                  Publier mon bien
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default PublishProperty;
