/**
 * Service de notifications push pour Lokali
 */

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string;

  constructor() {
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialiser le service
  async initialize(swRegistration: ServiceWorkerRegistration): Promise<void> {
    this.swRegistration = swRegistration;
    
    // Vérifier si les notifications sont supportées
    if (!('Notification' in window)) {
      throw new Error('Les notifications ne sont pas supportées par ce navigateur');
    }

    // Vérifier si Push API est supporté
    if (!('PushManager' in window)) {
      throw new Error('Push API n\'est pas supporté par ce navigateur');
    }

    // Récupérer la souscription existante
    this.subscription = await swRegistration.pushManager.getSubscription();
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications non supportées');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // S'abonner aux notifications push
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) {
      throw new Error('Service Worker non enregistré');
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission refusée pour les notifications');
      }
    }

    try {
      this.subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Envoyer la souscription au serveur
      await this.sendSubscriptionToServer(this.subscription);
      
      return this.subscription;
    } catch (error) {
      console.error('Erreur lors de la souscription push:', error);
      throw error;
    }
  }

  // Se désabonner des notifications push
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      
      // Supprimer la souscription du serveur
      await this.removeSubscriptionFromServer(this.subscription);
      
      this.subscription = null;
      return true;
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      return false;
    }
  }

  // Afficher une notification locale
  async showNotification(data: PushNotificationData): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker non enregistré');
    }

    if (Notification.permission !== 'granted') {
      throw new Error('Permission non accordée pour les notifications');
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-72x72.png',
      data: data.data,
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };

    // Ajouter les propriétés non-standard si supportées
    const extendedOptions = options as NotificationOptions & {
      actions?: NotificationAction[];
      vibrate?: number[];
      timestamp?: number;
    };
    
    if (data.actions) {
      extendedOptions.actions = data.actions;
    }
    
    extendedOptions.vibrate = [200, 100, 200];
    extendedOptions.timestamp = Date.now();

    await this.swRegistration.showNotification(data.title, extendedOptions);
  }

  // Notifications spécifiques à Lokali
  async notifyNewBooking(booking: {
    id: string;
    guest_name: string;
    property_title: string;
    property_id: string;
  }): Promise<void> {
    const data: PushNotificationData = {
      title: 'Nouvelle réservation !',
      body: `${booking.guest_name} a réservé ${booking.property_title}`,
      icon: '/icons/booking-icon.png',
      tag: 'new-booking',
      data: {
        type: 'booking',
        bookingId: booking.id,
        propertyId: booking.property_id
      },
      actions: [
        {
          action: 'view',
          title: 'Voir la réservation',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'contact',
          title: 'Contacter le client',
          icon: '/icons/contact-icon.png'
        }
      ],
      requireInteraction: true
    };

    await this.showNotification(data);
  }

  async notifyBookingConfirmed(booking: {
    id: string;
    property_title: string;
  }): Promise<void> {
    const data: PushNotificationData = {
      title: 'Réservation confirmée ✅',
      body: `Votre réservation pour ${booking.property_title} est confirmée`,
      icon: '/icons/confirmed-icon.png',
      tag: 'booking-confirmed',
      data: {
        type: 'booking-confirmed',
        bookingId: booking.id
      },
      actions: [
        {
          action: 'view',
          title: 'Voir les détails',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    await this.showNotification(data);
  }

  async notifyNewMessage(message: {
    id: string;
    sender_name: string;
    content: string;
    conversation_id: string;
  }): Promise<void> {
    const data: PushNotificationData = {
      title: 'Nouveau message',
      body: `${message.sender_name}: ${message.content.substring(0, 50)}...`,
      icon: '/icons/message-icon.png',
      tag: 'new-message',
      data: {
        type: 'message',
        messageId: message.id,
        conversationId: message.conversation_id
      },
      actions: [
        {
          action: 'reply',
          title: 'Répondre',
          icon: '/icons/reply-icon.png'
        },
        {
          action: 'view',
          title: 'Voir la conversation',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    await this.showNotification(data);
  }

  async notifyPropertyApproved(property: {
    id: string;
    title: string;
  }): Promise<void> {
    const data: PushNotificationData = {
      title: 'Propriété approuvée ! 🎉',
      body: `${property.title} est maintenant visible sur Lokali`,
      icon: '/icons/approved-icon.png',
      tag: 'property-approved',
      data: {
        type: 'property-approved',
        propertyId: property.id
      },
      actions: [
        {
          action: 'view',
          title: 'Voir ma propriété',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    await this.showNotification(data);
  }

  async notifyPriceAlert(property: {
    id: string;
    title: string;
  }, newPrice: number): Promise<void> {
    const data: PushNotificationData = {
      title: 'Alerte prix !',
      body: `${property.title} - Nouveau prix: ${newPrice.toLocaleString()} CFA`,
      icon: '/icons/price-alert-icon.png',
      tag: 'price-alert',
      data: {
        type: 'price-alert',
        propertyId: property.id,
        newPrice
      },
      actions: [
        {
          action: 'view',
          title: 'Voir la propriété',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'book',
          title: 'Réserver maintenant',
          icon: '/icons/book-icon.png'
        }
      ]
    };

    await this.showNotification(data);
  }

  // Obtenir le statut de la souscription
  getSubscriptionStatus(): {
    isSubscribed: boolean;
    subscription: PushSubscription | null;
    permission: NotificationPermission;
  } {
    return {
      isSubscribed: !!this.subscription,
      subscription: this.subscription,
      permission: Notification.permission
    };
  }

  // Envoyer la souscription au serveur
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi de la souscription');
      }
    } catch (error) {
      console.error('Erreur envoi souscription:', error);
      // En mode développement, on peut ignorer cette erreur
      if (import.meta.env.DEV) {
        console.warn('Mode développement: souscription non envoyée au serveur');
      } else {
        throw error;
      }
    }
  }

  // Supprimer la souscription du serveur
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de la souscription');
      }
    } catch (error) {
      console.error('Erreur suppression souscription:', error);
      // En mode développement, on peut ignorer cette erreur
      if (import.meta.env.DEV) {
        console.warn('Mode développement: souscription non supprimée du serveur');
      }
    }
  }

  // Convertir la clé VAPID
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Instance singleton
export const pushNotificationService = PushNotificationService.getInstance();
