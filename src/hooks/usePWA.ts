import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

export const usePWA = () => {
  const [installState, setInstallState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    installPrompt: null
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as { standalone?: boolean }).standalone ||
                        document.referrer.includes('android-app://');

    setInstallState(prev => ({
      ...prev,
      isStandalone,
      isInstalled: isStandalone
    }));

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      
      setInstallState(prev => ({
        ...prev,
        isInstallable: true,
        canInstall: !prev.isInstalled,
        installPrompt: installEvent
      }));
    };

    // Écouter l'installation réussie
    const handleAppInstalled = () => {
      setInstallState(prev => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
        installPrompt: null
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Enregistrer le Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker enregistré:', registration);
          setSwRegistration(registration);

          // Vérifier les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Erreur enregistrement Service Worker:', error);
        });

      // Écouter les messages du Service Worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data;
        
        if (type === 'UPDATE_AVAILABLE') {
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  // Installer l'application
  const installApp = async (): Promise<boolean> => {
    if (!installState.installPrompt) {
      return false;
    }

    try {
      await installState.installPrompt.prompt();
      const choiceResult = await installState.installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        setInstallState(prev => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
          installPrompt: null
        }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('[PWA] Erreur lors de l\'installation:', error);
      return false;
    }
  };

  // Mettre à jour l'application
  const updateApp = async (): Promise<void> => {
    if (!swRegistration) {
      return;
    }

    try {
      await swRegistration.update();
      
      if (swRegistration.waiting) {
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('[PWA] Erreur lors de la mise à jour:', error);
    }
  };

  // Vérifier la connexion
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mettre en cache une propriété
  const cacheProperty = async (propertyId: string, data: Record<string, unknown>): Promise<void> => {
    if (swRegistration && swRegistration.active) {
      swRegistration.active.postMessage({
        type: 'CACHE_PROPERTY',
        payload: {
          url: `/api/properties/${propertyId}`,
          data
        }
      });
    }
  };

  // Vider le cache
  const clearCache = async (): Promise<void> => {
    if (swRegistration && swRegistration.active) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            resolve();
          }
        };

        swRegistration.active!.postMessage(
          { type: 'CLEAR_CACHE' },
          [messageChannel.port2]
        );
      });
    }
  };

  return {
    // État d'installation
    ...installState,
    
    // État de connexion
    isOnline,
    
    // État de mise à jour
    updateAvailable,
    
    // Actions
    installApp,
    updateApp,
    cacheProperty,
    clearCache,
    
    // Service Worker
    swRegistration
  };
};

/**
 * Hook pour les notifications push
 */
export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('[PWA] Notifications non supportées');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('[PWA] Erreur demande permission notifications:', error);
      return false;
    }
  };

  const subscribeToPush = async (swRegistration: ServiceWorkerRegistration): Promise<PushSubscription | null> => {
    if (!swRegistration || permission !== 'granted') {
      return null;
    }

    try {
      const sub = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.VITE_VAPID_PUBLIC_KEY
      });

      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('[PWA] Erreur souscription push:', error);
      return null;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    if (!subscription) {
      return false;
    }

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      return true;
    } catch (error) {
      console.error('[PWA] Erreur désinscription push:', error);
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions): void => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });
    }
  };

  return {
    permission,
    subscription,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showNotification,
    isSupported: 'Notification' in window
  };
};
