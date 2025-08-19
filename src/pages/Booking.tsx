import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar as CalendarIcon, Users, CreditCard, MapPin, Star, ArrowLeft, Check } from 'lucide-react';
import { format, addDays, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PropertyService } from '@/services/propertyService';
import { BookingService } from '@/services/bookingService';
import { PaymentService, PaymentData } from '@/services/paymentService';
import { NotificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  // Récupérer les détails de la propriété
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery({
    queryKey: ['property', id],
    queryFn: () => PropertyService.getPropertyById(id!),
    enabled: !!id
  });

  // Calculer le prix total
  const calculateTotalPrice = () => {
    if (!property || !checkIn || !checkOut) return 0;
    
    return BookingService.calculateTotalPrice(
      property.price.amount,
      checkIn,
      checkOut,
      property.price.period
    );
  };

  const totalPrice = calculateTotalPrice();
  const fees = PaymentService.calculateFees(totalPrice);

  // Validation des dates
  const validateDates = () => {
    if (!checkIn || !checkOut) {
      setError('Veuillez sélectionner les dates d\'arrivée et de départ');
      return false;
    }

    if (checkOut <= checkIn) {
      setError('La date de départ doit être après la date d\'arrivée');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
      setError('La date d\'arrivée ne peut pas être dans le passé');
      return false;
    }

    // Vérifier la durée minimum si définie
    if (property?.availability.minimumStay) {
      const duration = property.type === 'guest-house' 
        ? differenceInDays(checkOut, checkIn)
        : differenceInMonths(checkOut, checkIn);
      
      if (duration < property.availability.minimumStay) {
        const unit = property.type === 'guest-house' ? 'jour(s)' : 'mois';
        setError(`Durée minimum de séjour : ${property.availability.minimumStay} ${unit}`);
        return false;
      }
    }

    return true;
  };

  // Validation des informations client
  const validateGuestInfo = () => {
    if (!guestName.trim()) {
      setError('Le nom est requis');
      return false;
    }
    if (!guestEmail.trim()) {
      setError('L\'email est requis');
      return false;
    }
    if (!guestPhone.trim()) {
      setError('Le téléphone est requis');
      return false;
    }
    if (numberOfGuests < 1) {
      setError('Le nombre d\'invités doit être d\'au moins 1');
      return false;
    }
    return true;
  };

  // Vérifier la disponibilité
  const checkAvailability = async () => {
    if (!property || !checkIn || !checkOut) return false;
    
    try {
      const isAvailable = await BookingService.checkAvailability(
        property.id,
        checkIn,
        checkOut
      );
      
      if (!isAvailable) {
        setError('Ces dates ne sont pas disponibles');
        return false;
      }
      
      return true;
    } catch (err) {
      setError('Erreur lors de la vérification de disponibilité');
      return false;
    }
  };

  // Passer à l'étape suivante
  const handleNext = async () => {
    setError('');
    
    if (step === 'details') {
      if (!validateDates() || !validateGuestInfo()) return;
      
      const isAvailable = await checkAvailability();
      if (!isAvailable) return;
      
      setStep('payment');
    }
  };

  // Traiter le paiement
  const handlePayment = async () => {
    if (!property || !user || !checkIn || !checkOut) return;
    
    setLoading(true);
    setError('');

    try {
      // Créer la réservation d'abord
      const booking = await BookingService.createBooking({
        propertyId: property.id,
        guestId: user.id,
        checkIn,
        checkOut,
        totalPrice: fees.total,
        guestName,
        guestPhone,
        guestEmail,
        numberOfGuests
      });

      // Préparer les données de paiement
      const paymentData: PaymentData = {
        amount: fees.total,
        currency: 'FCFA',
        description: `Réservation ${property.title}`,
        customerName: guestName,
        customerEmail: guestEmail,
        customerPhone: guestPhone,
        bookingId: booking.id,
        propertyId: property.id
      };

      // Valider les données de paiement
      const validationErrors = PaymentService.validatePaymentData(paymentData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Initier le paiement KKiaPay
      const paymentResponse = await PaymentService.initiatePayment(paymentData);
      
      if (paymentResponse.status === 'SUCCESS') {
        // Mettre à jour le statut de la réservation
        await BookingService.updateBookingStatus(
          booking.id,
          'confirmed',
          'paid'
        );

        // Envoyer les notifications de confirmation
        await NotificationService.sendBookingConfirmation({
          guestName,
          guestEmail,
          guestPhone,
          propertyTitle: property.title,
          propertyLocation: `${property.location.district}, ${property.location.city}`,
          checkIn: NotificationService.formatDate(checkIn!),
          checkOut: NotificationService.formatDate(checkOut!),
          totalPrice: fees.total,
          bookingId: booking.id,
          ownerName: property.owner.name,
          ownerEmail: property.owner.email,
          ownerPhone: property.owner.phone
        });
        
        setStep('confirmation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  // Redirection si pas connecté
  if (!user) {
    navigate('/login', { state: { from: { pathname: `/property/${id}/book` } } });
    return null;
  }

  if (propertyLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement de la propriété...</p>
          </div>
        </div>
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-red-600">Propriété non trouvée</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => step === 'details' ? navigate(`/property/${id}`) : setStep('details')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant={step === 'details' ? 'default' : 'outline'}>
              1. Détails
            </Badge>
            <Badge variant={step === 'payment' ? 'default' : 'outline'}>
              2. Paiement
            </Badge>
            <Badge variant={step === 'confirmation' ? 'default' : 'outline'}>
              3. Confirmation
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de réservation */}
          <div className="lg:col-span-2">
            {step === 'details' && (
              <Card>
                <CardHeader>
                  <CardTitle>Détails de la réservation</CardTitle>
                  <CardDescription>
                    Complétez les informations pour votre séjour
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Calendrier de disponibilités */}
                  <div className="space-y-4">
                    <AvailabilityCalendar
                      propertyId={property.id}
                      selectedCheckIn={checkIn}
                      selectedCheckOut={checkOut}
                      onDateSelect={(checkInDate, checkOutDate) => {
                        setCheckIn(checkInDate);
                        setCheckOut(checkOutDate);
                      }}
                      minimumStay={property.availability?.minimumStay || 1}
                      propertyType={property.type}
                    />
                  </div>

                  {/* Nombre d'invités */}
                  <div className="space-y-2">
                    <Label htmlFor="guests">Nombre d'invités</Label>
                    <Select value={numberOfGuests.toString()} onValueChange={(value) => setNumberOfGuests(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'invité' : 'invités'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Informations du client */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations de contact</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input
                          id="name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Votre nom complet"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="+229 XX XX XX XX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="votre@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requests">Demandes spéciales (optionnel)</Label>
                      <Textarea
                        id="requests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Arrivée tardive, préférences alimentaires, etc."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button onClick={handleNext} className="w-full" size="lg">
                    Continuer vers le paiement
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Paiement sécurisé
                  </CardTitle>
                  <CardDescription>
                    Paiement via KKiaPay - Mobile Money et Carte bancaire
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Méthodes de paiement acceptées</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">MTN Mobile Money</Badge>
                      <Badge variant="outline">Moov Money</Badge>
                      <Badge variant="outline">Orange Money</Badge>
                      <Badge variant="outline">Carte Visa/Mastercard</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{PaymentService.formatAmount(totalPrice)}</span>
                    </div>
                    <div className="mt-6 text-center text-sm text-gray-600">
                      <span>Accessible depuis tous les pays</span>
                      <br />
                      Pas encore de compte ?{' '}
                      <Link to="/register" className="text-primary hover:underline">
                        Créer un compte
                      </Link>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{PaymentService.formatAmount(fees.total)}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={handlePayment} 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Payer {PaymentService.formatAmount(fees.total)}
                  </Button>
                </CardContent>
              </Card>
            )}

            {step === 'confirmation' && (
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-green-900">Réservation confirmée !</CardTitle>
                  <CardDescription>
                    Votre paiement a été traité avec succès
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 text-center">
                  <p className="text-gray-600">
                    Un email de confirmation a été envoyé à <strong>{guestEmail}</strong>
                  </p>
                  
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => navigate('/bookings')}>
                      Voir mes réservations
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      Retour à l'accueil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Résumé de la propriété */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">{property.title}</h3>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {property.location.district}, {property.location.city}
                      </span>
                    </div>
                    
                    {property.rating && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{property.rating.average}</span>
                        <span className="text-gray-600 text-sm">
                          ({property.rating.count} avis)
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Prix par {property.price.period === 'night' ? 'nuit' : property.price.period === 'month' ? 'mois' : 'année'}</span>
                      <span>{PaymentService.formatAmount(property.price.amount)}</span>
                    </div>
                    
                    {checkIn && checkOut && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            {property.type === 'guest-house' 
                              ? `${differenceInDays(checkOut, checkIn)} nuit(s)`
                              : `${differenceInMonths(checkOut, checkOut)} mois`
                            }
                          </span>
                          <span>{PaymentService.formatAmount(totalPrice)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Frais de service</span>
                          <span>{PaymentService.formatAmount(fees.fees)}</span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span>{PaymentService.formatAmount(fees.total)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>• Annulation gratuite jusqu'à 24h avant l'arrivée</p>
                    <p>• Paiement sécurisé via KKiaPay</p>
                    <p>• Support client 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
