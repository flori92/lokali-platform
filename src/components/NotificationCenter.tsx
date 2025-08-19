import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, AlertCircle, Info, CheckCircle, XCircle, Calendar, MessageSquare, Home, BellOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useAccessibility } from '@/hooks/useAccessibility';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useA11y } from '@/components/AccessibilityProvider';

interface NotificationSettings {
  bookings: boolean;
  messages: boolean;
  propertyUpdates: boolean;
  priceAlerts: boolean;
  marketing: boolean;
}

interface Notification {
  id: string;
  type: 'booking' | 'message' | 'property' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, unknown>;
}

export const NotificationCenter: React.FC = () => {
  const { announce } = useA11y();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [settings, setSettings] = useState<NotificationSettings>({
    bookings: true,
    messages: true,
    propertyUpdates: true,
    priceAlerts: false,
    marketing: false
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier le statut initial
    const status = pushNotificationService.getSubscriptionStatus();
    setIsSubscribed(status.isSubscribed);
    setPermission(status.permission);

    // Charger les notifications depuis le localStorage
    loadNotifications();
  }, []);

  const updateUnreadCount = useCallback(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    // Calculer le nombre de non lues quand les notifications changent
    updateUnreadCount();
  }, [notifications, updateUnreadCount]);

  const loadNotifications = () => {
    try {
      const saved = localStorage.getItem('lokali-notifications');
      if (saved) {
        const parsed = JSON.parse(saved).map((n: { id: string; type: string; title: string; message: string; timestamp: string; read: boolean; data?: Record<string, unknown> }) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  };

  const saveNotifications = (newNotifications: Notification[]) => {
    try {
      localStorage.setItem('lokali-notifications', JSON.stringify(newNotifications));
      setNotifications(newNotifications);
      updateUnreadCount();
    } catch (error) {
      console.error('Erreur sauvegarde notifications:', error);
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    announce('Activation des notifications en cours...', 'assertive');

    try {
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      setPermission('granted');
      announce('Notifications activées avec succès !', 'assertive');
      
      // Ajouter une notification de bienvenue
      addNotification({
        type: 'system',
        title: 'Notifications activées ! 🔔',
        message: 'Vous recevrez maintenant les notifications importantes de Lokali',
        data: { welcome: true }
      });
    } catch (error) {
      console.error('Erreur souscription:', error);
      announce('Erreur lors de l\'activation des notifications', 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    announce('Désactivation des notifications en cours...', 'assertive');

    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      announce('Notifications désactivées', 'polite');
    } catch (error) {
      console.error('Erreur désinscription:', error);
      announce('Erreur lors de la désactivation', 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    const updated = [newNotification, ...notifications].slice(0, 50); // Garder max 50 notifications
    saveNotifications(updated);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    announce('Toutes les notifications marquées comme lues', 'polite');
  };

  const deleteNotification = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    announce('Notification supprimée', 'polite');
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
    announce('Toutes les notifications supprimées', 'polite');
  };

  const updateSettings = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('lokali-notification-settings', JSON.stringify(newSettings));
    announce(`Paramètre ${key} ${value ? 'activé' : 'désactivé'}`, 'polite');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'message': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'property': return <Home className="h-4 w-4 text-purple-500" />;
      case 'alert': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return timestamp.toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </div>
              <div>
                <CardTitle>Centre de Notifications</CardTitle>
                <CardDescription>
                  Gérez vos notifications et préférences
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isSubscribed ? "default" : "secondary"}>
                {isSubscribed ? "Activées" : "Désactivées"}
              </Badge>
              <Badge variant="outline">
                {permission === 'granted' ? 'Autorisées' : 
                 permission === 'denied' ? 'Refusées' : 'En attente'}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Bouton principal d'activation */}
          {!isSubscribed ? (
            <Button 
              onClick={handleSubscribe}
              disabled={isLoading || permission === 'denied'}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Activation...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Activer les notifications
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleUnsubscribe}
                disabled={isLoading}
                className="flex-1"
              >
                <BellOff className="h-4 w-4 mr-2" />
                Désactiver
              </Button>
              {unreadCount > 0 && (
                <Button 
                  variant="outline" 
                  onClick={markAllAsRead}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Tout marquer lu
                </Button>
              )}
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paramètres de notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Préférences de notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Réservations</p>
                <p className="text-sm text-muted-foreground">Nouvelles réservations et confirmations</p>
              </div>
              <Switch 
                checked={settings.bookings}
                onCheckedChange={(checked) => updateSettings('bookings', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Messages</p>
                <p className="text-sm text-muted-foreground">Nouveaux messages de clients</p>
              </div>
              <Switch 
                checked={settings.messages}
                onCheckedChange={(checked) => updateSettings('messages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mises à jour propriétés</p>
                <p className="text-sm text-muted-foreground">Approbations et modifications</p>
              </div>
              <Switch 
                checked={settings.propertyUpdates}
                onCheckedChange={(checked) => updateSettings('propertyUpdates', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Alertes prix</p>
                <p className="text-sm text-muted-foreground">Baisses de prix sur vos favoris</p>
              </div>
              <Switch 
                checked={settings.priceAlerts}
                onCheckedChange={(checked) => updateSettings('priceAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing</p>
                <p className="text-sm text-muted-foreground">Promotions et nouveautés</p>
              </div>
              <Switch 
                checked={settings.marketing}
                onCheckedChange={(checked) => updateSettings('marketing', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notifications récentes</CardTitle>
            {notifications.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllNotifications}
              >
                Tout supprimer
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune notification pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 10).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    notification.read ? 'bg-muted/50' : 'bg-background border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8"
                          aria-label="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer la notification"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
