import { supabase } from '@/lib/supabase';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  type: 'email' | 'sms';
}

export interface BookingNotificationData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyTitle: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  bookingId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

export class NotificationService {
  private static readonly RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
  private static readonly RESEND_API_URL = 'https://api.resend.com/emails';
  
  // Templates d'email
  private static emailTemplates: Record<string, EmailTemplate> = {
    bookingConfirmation: {
      subject: 'Confirmation de réservation - Lokali',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Lokali</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Plateforme de location béninoise</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Réservation confirmée !</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Bonjour <strong>{{guestName}}</strong>,
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Votre réservation a été confirmée avec succès. Voici les détails :
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">{{propertyTitle}}</h3>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Localisation :</strong> {{propertyLocation}}</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Arrivée :</strong> {{checkIn}}</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Départ :</strong> {{checkOut}}</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Montant total :</strong> {{totalPrice}} FCFA</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Référence :</strong> #{{bookingId}}</p>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #065f46; margin-top: 0;">Contact du propriétaire</h4>
              <p style="color: #047857; margin: 5px 0;"><strong>{{ownerName}}</strong></p>
              <p style="color: #047857; margin: 5px 0;">📧 {{ownerEmail}}</p>
              <p style="color: #047857; margin: 5px 0;">📞 {{ownerPhone}}</p>
            </div>
            
            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              Pour toute question, n'hésitez pas à contacter directement le propriétaire ou notre équipe support.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://lokali.bj/bookings/{{bookingId}}" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Voir ma réservation
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2025 Lokali - Plateforme de location béninoise<br>
              Cotonou, Bénin | support@lokali.bj
            </p>
          </div>
        </div>
      `,
      text: `
Bonjour {{guestName}},

Votre réservation a été confirmée avec succès !

Détails de la réservation :
- Propriété : {{propertyTitle}}
- Localisation : {{propertyLocation}}
- Arrivée : {{checkIn}}
- Départ : {{checkOut}}
- Montant total : {{totalPrice}} FCFA
- Référence : #{{bookingId}}

Contact du propriétaire :
{{ownerName}}
Email : {{ownerEmail}}
Téléphone : {{ownerPhone}}

Pour toute question, contactez directement le propriétaire ou notre équipe support.

Cordialement,
L'équipe Lokali
      `
    },
    
    newBookingOwner: {
      subject: 'Nouvelle réservation reçue - Lokali',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Lokali</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Nouvelle réservation</p>
          </div>
          
          <div style="padding: 30px; background: white;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Nouvelle réservation reçue !</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Bonjour <strong>{{ownerName}}</strong>,
            </p>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Vous avez reçu une nouvelle réservation pour votre propriété :
            </p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">{{propertyTitle}}</h3>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Période :</strong> {{checkIn}} - {{checkOut}}</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Montant :</strong> {{totalPrice}} FCFA</p>
              <p style="color: #6b7280; margin: 5px 0;"><strong>Référence :</strong> #{{bookingId}}</p>
            </div>
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">Informations du client</h4>
              <p style="color: #1d4ed8; margin: 5px 0;"><strong>{{guestName}}</strong></p>
              <p style="color: #1d4ed8; margin: 5px 0;">📧 {{guestEmail}}</p>
              <p style="color: #1d4ed8; margin: 5px 0;">📞 {{guestPhone}}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://lokali.bj/dashboard/bookings/{{bookingId}}" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Gérer la réservation
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              © 2025 Lokali - Plateforme de location béninoise
            </p>
          </div>
        </div>
      `,
      text: `
Bonjour {{ownerName}},

Vous avez reçu une nouvelle réservation !

Propriété : {{propertyTitle}}
Période : {{checkIn}} - {{checkOut}}
Montant : {{totalPrice}} FCFA
Référence : #{{bookingId}}

Informations du client :
{{guestName}}
Email : {{guestEmail}}
Téléphone : {{guestPhone}}

Connectez-vous à votre tableau de bord pour gérer cette réservation.

L'équipe Lokali
      `
    }
  };

  // Envoyer un email via Resend
  static async sendEmail(data: NotificationData): Promise<boolean> {
    if (!this.RESEND_API_KEY) {
      console.error('Clé API Resend manquante');
      return false;
    }

    try {
      const template = this.emailTemplates[data.template];
      if (!template) {
        throw new Error(`Template email non trouvé: ${data.template}`);
      }

      // Remplacer les variables dans le template
      let html = template.html;
      let text = template.text;
      let subject = template.subject;

      Object.entries(data.data).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        html = html.replace(new RegExp(placeholder, 'g'), String(value));
        text = text.replace(new RegExp(placeholder, 'g'), String(value));
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
      });

      const response = await fetch(this.RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Lokali <noreply@lokali.bj>',
          to: [data.to],
          subject: subject,
          html: html,
          text: text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erreur Resend: ${error}`);
      }

      console.log('Email envoyé avec succès à:', data.to);
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      return false;
    }
  }

  // Envoyer SMS (placeholder pour service local béninois)
  static async sendSMS(phone: string, message: string): Promise<boolean> {
    // TODO: Intégrer un service SMS local (ex: Orange SMS API Bénin)
    console.log('SMS à envoyer:', { phone, message });
    
    // Simulation pour le développement
    if (import.meta.env.DEV) {
      console.log(`[SMS SIMULATION] À: ${phone}, Message: ${message}`);
      return true;
    }

    return false;
  }

  // Envoyer notifications de confirmation de réservation
  static async sendBookingConfirmation(bookingData: BookingNotificationData): Promise<void> {
    const promises = [];

    // Email au client
    promises.push(
      this.sendEmail({
        to: bookingData.guestEmail,
        subject: 'Confirmation de réservation - Lokali',
        template: 'bookingConfirmation',
        data: bookingData as unknown as Record<string, unknown>,
        type: 'email'
      })
    );

    // Email au propriétaire
    promises.push(
      this.sendEmail({
        to: bookingData.ownerEmail,
        subject: 'Nouvelle réservation reçue - Lokali',
        template: 'newBookingOwner',
        data: bookingData as unknown as Record<string, unknown>,
        type: 'email'
      })
    );

    // SMS au client (optionnel)
    if (bookingData.guestPhone) {
      const smsMessage = `Lokali: Réservation confirmée pour ${bookingData.propertyTitle} du ${bookingData.checkIn} au ${bookingData.checkOut}. Montant: ${bookingData.totalPrice} FCFA. Ref: #${bookingData.bookingId}`;
      promises.push(this.sendSMS(bookingData.guestPhone, smsMessage));
    }

    // Envoyer toutes les notifications
    try {
      await Promise.allSettled(promises);
      console.log('Notifications de réservation envoyées');
    } catch (error) {
      console.error('Erreur envoi notifications:', error);
    }
  }

  // Enregistrer la notification dans la base de données
  static async logNotification(data: {
    userId: string;
    type: 'email' | 'sms';
    template: string;
    recipient: string;
    status: 'sent' | 'failed';
    error?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          template: data.template,
          recipient: data.recipient,
          status: data.status,
          error_message: data.error,
          sent_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erreur log notification:', error);
      }
    } catch (err) {
      console.error('Erreur sauvegarde notification:', err);
    }
  }

  // Formater le montant en FCFA
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  }

  // Formater les dates
  static formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  }
}
