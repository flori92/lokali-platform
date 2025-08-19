import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  Calendar,
  DollarSign 
} from 'lucide-react';
import { RevenueStats } from '@/services/revenueService';

interface RevenueChartProps {
  stats: RevenueStats;
  onExport: () => void;
  loading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ stats, onExport, loading = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };

  const getMonthlyGrowth = () => {
    if (stats.revenueByMonth.length < 2) return 0;
    const currentMonth = stats.revenueByMonth[stats.revenueByMonth.length - 1];
    const previousMonth = stats.revenueByMonth[stats.revenueByMonth.length - 2];
    
    if (previousMonth.revenue === 0) return 100;
    return ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100;
  };

  const monthlyGrowth = getMonthlyGrowth();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analyse Financière</h2>
          <p className="text-gray-600">Suivi de vos revenus et performances</p>
        </div>
        <Button onClick={onExport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)} FCFA</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBookings} réservations au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)} FCFA</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className={`h-3 w-3 ${monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className={monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mois précédent</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Moyenne</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageBookingValue)} FCFA</div>
            <p className="text-xs text-muted-foreground">
              par réservation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des revenus mensuels */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution Mensuelle</CardTitle>
          <CardDescription>
            Revenus des 12 derniers mois
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.revenueByMonth.map((month, index) => {
              const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.revenue));
              const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {month.month}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {month.bookings} réservations
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatCurrency(month.revenue)} FCFA
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance par propriété */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Propriété</CardTitle>
          <CardDescription>
            Classement de vos biens par revenus générés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.revenueByProperty.length > 0 ? (
            <div className="space-y-4">
              {stats.revenueByProperty.slice(0, 5).map((property, index) => {
                const maxRevenue = Math.max(...stats.revenueByProperty.map(p => p.revenue));
                const percentage = maxRevenue > 0 ? (property.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={property.propertyId} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {property.propertyTitle}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {property.bookings} réservations
                          </Badge>
                          <span className="text-sm font-medium">
                            {formatCurrency(property.revenue)} FCFA
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune donnée disponible
              </h3>
              <p className="text-gray-600">
                Les statistiques apparaîtront après vos premières réservations
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueChart;
