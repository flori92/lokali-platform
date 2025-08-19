import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, X, Smartphone, Monitor, Wifi, WifiOff } from 'lucide-react';
import { usePWA, usePushNotifications } from '@/hooks/usePWA';
import { useA11y } from '@/components/AccessibilityProvider';

export const PWAInstallPrompt: React.FC = () => {
  const { canInstall, installApp, isOnline, updateAvailable, updateApp } = usePWA();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const { announce } = useA11y();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!canInstall || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    announce('Installation de Lokali en cours...', 'assertive');
    
    try {
      const success = await installApp();
      if (success) {
        announce('Lokali a été installé avec succès !', 'assertive');
        setIsVisible(false);
      } else {
        announce('Installation annulée', 'polite');
      }
    } catch (error) {
      announce('Erreur lors de l\'installation', 'assertive');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    announce('Invitation d\'installation fermée', 'polite');
  };

  const handleNotificationPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      announce('Notifications activées pour Lokali', 'polite');
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-primary/20 z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
              <Download className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-lg">Installer Lokali</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6"
            aria-label="Fermer l'invitation d'installation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Installez l'application pour une meilleure expérience
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Avantages de l'installation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="h-4 w-4 text-primary" />
            <span>Accès rapide depuis votre écran d'accueil</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Monitor className="h-4 w-4 text-primary" />
            <span>Expérience plein écran sans navigateur</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-orange-500" />
            )}
            <span>Fonctionnalités disponibles hors ligne</span>
          </div>
        </div>

        {/* État de la connexion */}
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"}>
            {isOnline ? "En ligne" : "Hors ligne"}
          </Badge>
          {updateAvailable && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Mise à jour disponible
            </Badge>
          )}
        </div>

        {/* Notifications */}
        {isSupported && permission === 'default' && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm mb-2">Recevoir les notifications ?</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNotificationPermission}
              className="w-full"
            >
              Activer les notifications
            </Button>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1"
            aria-describedby="install-description"
          >
            {isInstalling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Installation...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Installer
              </>
            )}
          </Button>
          
          {updateAvailable && (
            <Button
              variant="outline"
              onClick={updateApp}
              className="flex-1"
              aria-label="Mettre à jour l'application"
            >
              Mettre à jour
            </Button>
          )}
        </div>

        <p id="install-description" className="text-xs text-muted-foreground">
          L'installation est gratuite et ne prend que quelques secondes
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * Composant pour les notifications de mise à jour
 */
export const PWAUpdateNotification: React.FC = () => {
  const { updateAvailable, updateApp } = usePWA();
  const { announce } = useA11y();
  const [isVisible, setIsVisible] = useState(true);

  if (!updateAvailable || !isVisible) {
    return null;
  }

  const handleUpdate = async () => {
    announce('Mise à jour de Lokali en cours...', 'assertive');
    try {
      await updateApp();
      announce('Lokali a été mis à jour avec succès !', 'assertive');
    } catch (error) {
      announce('Erreur lors de la mise à jour', 'assertive');
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    announce('Notification de mise à jour fermée', 'polite');
  };

  return (
    <Card className="fixed top-4 right-4 w-80 shadow-lg border-orange-200 bg-orange-50 z-50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-1">
              Mise à jour disponible
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              Une nouvelle version de Lokali est prête à être installée
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Mettre à jour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismiss}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Plus tard
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 text-orange-600 hover:bg-orange-100"
            aria-label="Fermer la notification de mise à jour"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Indicateur de statut de connexion
 */
export const ConnectionStatus: React.FC = () => {
  const { isOnline } = usePWA();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
      const timer = setTimeout(() => setShowOfflineMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineMessage || isOnline) {
    return null;
  }

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      role="alert"
      aria-live="assertive"
    >
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 text-orange-700">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">
              Mode hors ligne - Certaines fonctionnalités sont limitées
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
