import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PropertyService } from '@/services/propertyService';
import { BookingService } from '@/services/bookingService';
import { Property, Booking } from '@/types/property';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  Calendar, 
  DollarSign, 
  Star, 
  Eye, 
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalViews: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Récupération des propriétés du propriétaire
  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: () => PropertyService.getOwnerProperties(user?.id || ''),
    enabled: !!user?.id
  });

  // Récupération des réservations
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['owner-bookings', user?.id],
    queryFn: () => BookingService.getOwnerBookings(user?.id || ''),
    enabled: !!user?.id
  });

  // Calcul des statistiques
  const stats: DashboardStats = {
    totalProperties: properties.length,
    activeProperties: properties.filter(p => p.availability.available).length,
    totalBookings: bookings.length,
    pendingBookings: bookings.filter(b => b.status === 'pending').length,
    totalRevenue: bookings
      .filter(booking => booking.status === 'confirmed' || booking.status === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0),
    monthlyRevenue: bookings
      .filter(b => {
        const bookingDate = new Date(b.createdAt);
        const currentMonth = new Date().getMonth();
        return bookingDate.getMonth() === currentMonth && b.status === 'completed';
      })
      .reduce((sum, b) => sum + b.totalPrice, 0),
    averageRating: properties.length > 0 
      ? properties.reduce((sum, property) => sum + (property.rating?.average || 0), 0) / properties.length 
      : 0,
    totalViews: 0, // Views non implémentées
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      await BookingService.updateBookingStatus(bookingId, action === 'accept' ? 'confirmed' : 'cancelled');
      window.location.reload();
    } catch (error) {
      console.error('Erreur mise à jour réservation:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Accès non autorisé</h1>
            <p className="mt-2 text-gray-600">Vous devez être propriétaire pour accéder à cette page.</p>
            <Link to="/" className="mt-4 inline-block">
              <Button>Retour à l'accueil</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Propriétaire</h1>
          <p className="mt-2 text-gray-600">
            Gérez vos biens et suivez vos réservations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="properties">Mes biens</TabsTrigger>
            <TabsTrigger value="bookings">Réservations</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Biens publiés</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeProperties} actifs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Réservations</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingBookings} en attente
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)} FCFA</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.monthlyRevenue)} FCFA ce mois
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalViews} vues totales
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Activité récente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Réservations récentes</CardTitle>
                  <CardDescription>
                    Vos dernières demandes de réservation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <p className="text-gray-500">Chargement...</p>
                  ) : bookings.slice(0, 5).length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{booking.guestInfo.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={
                            booking.status === 'confirmed' ? 'default' :
                            booking.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {booking.status === 'confirmed' ? 'Confirmée' :
                             booking.status === 'pending' ? 'En attente' : 'Annulée'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune réservation récente</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Biens les mieux notés</CardTitle>
                  <CardDescription>
                    Vos propriétés les mieux notées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertiesLoading ? (
                    <p className="text-gray-500">Chargement...</p>
                  ) : properties.length > 0 ? (
                    <div className="space-y-4">
                      {properties
                        .sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0))
                        .slice(0, 3)
                        .map((property) => (
                          <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{property.title}</p>
                              <p className="text-sm text-gray-600">{property.location.city}, {property.location.district}</p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{property.rating?.average?.toFixed(1) || 'N/A'}</span>
                              </div>
                              <p className="text-sm text-gray-600">0 vues</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun bien publié</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mes biens */}
          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des biens</CardTitle>
                <CardDescription>
                  Gérez vos propriétés publiées sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <p className="text-gray-500">Chargement...</p>
                ) : properties.length > 0 ? (
                  <div className="space-y-4">
                    {properties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{property.title}</h3>
                            <p className="text-gray-600 mb-2">{property.location.city}, {property.location.district}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span>{property.specifications.bedrooms} ch, {property.specifications.bathrooms} sdb</span>
                              <span>{formatCurrency(property.price.amount)} FCFA/
                                {property.type === 'guest-house' ? 'nuit' : 'mois'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={property.availability.available ? 'default' : 'secondary'}>
                                {property.availability.available ? 'Disponible' : 'Indisponible'}
                              </Badge>
                              {property.rating?.average && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm">{property.rating.average.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun bien publié
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Commencez par publier votre premier bien
                    </p>
                    <Link to="/publish">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Publier un bien
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Réservations */}
          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des réservations</CardTitle>
                <CardDescription>
                  Validez ou refusez les demandes de réservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <p className="text-gray-500">Chargement...</p>
                ) : bookings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Propriété
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Période
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invités
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Prix
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Statut
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Propriété #{booking.propertyId.slice(0, 8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.guestInfo.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.guestInfo.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Du {new Date(booking.checkIn).toLocaleDateString()} au {new Date(booking.checkOut).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.guestInfo.numberOfGuests || 1} invités
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.totalPrice.toLocaleString()} FCFA
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <Badge variant={
                                booking.status === 'confirmed' ? 'default' :
                                booking.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {booking.status === 'confirmed' ? 'Confirmée' :
                                 booking.status === 'pending' ? 'En attente' : 'Annulée'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleBookingAction(booking.id, 'accept')}
                                  >
                                    Accepter
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleBookingAction(booking.id, 'reject')}
                                  >
                                    Refuser
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucune réservation
                    </h3>
                    <p className="text-gray-600">
                      Les demandes de réservation apparaîtront ici
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
