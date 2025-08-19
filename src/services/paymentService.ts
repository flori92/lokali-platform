// Types pour KKiaPay
declare global {
  interface Window {
    openKkiapayWidget: (config: KKiaPayConfig) => void;
    addSuccessListener: (callback: (response: KKiaPayResponse) => void) => void;
    addFailedListener: (callback: (error: KKiaPayError) => void) => void;
  }
}

export interface KKiaPayConfig {
  amount: string;
  key: string;
  sandbox?: boolean;
  callback?: string;
  data?: string;
  phone?: string;
  name?: string;
  email?: string;
  theme?: string;
  position?: 'left' | 'right' | 'center';
  paymentmethod?: 'momo' | 'card';
}

export interface KKiaPayResponse {
  transactionId: string;
  status: 'SUCCESS';
  amount: number;
  phone?: string;
  name?: string;
  email?: string;
}

export interface KKiaPayError {
  status: 'FAILED';
  message: string;
}

export interface PaymentData {
  amount: number;
  currency: 'FCFA';
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingId: string;
  propertyId: string;
}

export class PaymentService {
  private static publicKey = import.meta.env.VITE_KKIAPAY_PUBLIC_KEY;
  private static sandbox = import.meta.env.VITE_KKIAPAY_SANDBOX === 'true';

  // Charger le SDK KKiaPay
  static loadKKiaPaySDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Vérifier si le SDK est déjà chargé
      if (window.openKkiapayWidget) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.kkiapay.me/k.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Erreur de chargement du SDK KKiaPay'));
      
      document.head.appendChild(script);
    });
  }

  // Initier un paiement
  static async initiatePayment(paymentData: PaymentData): Promise<KKiaPayResponse> {
    if (!this.publicKey) {
      throw new Error('Clé publique KKiaPay non configurée');
    }

    // Charger le SDK si nécessaire
    await this.loadKKiaPaySDK();

    return new Promise((resolve, reject) => {
      const config: KKiaPayConfig = {
        amount: paymentData.amount.toString(),
        key: this.publicKey,
        sandbox: this.sandbox,
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        phone: paymentData.customerPhone,
        data: JSON.stringify({
          bookingId: paymentData.bookingId,
          propertyId: paymentData.propertyId,
          description: paymentData.description
        }),
        theme: '#0095ff',
        position: 'center',
        paymentmethod: 'momo' // Privilégier mobile money pour le Bénin
      };

      // Écouter les événements de paiement
      window.addSuccessListener((response: KKiaPayResponse) => {
        resolve(response);
      });

      window.addFailedListener((error: KKiaPayError) => {
        reject(new Error(error.message || 'Échec du paiement'));
      });

      // Ouvrir le widget de paiement
      window.openKkiapayWidget(config);
    });
  }

  // Vérifier le statut d'un paiement (côté serveur)
  static async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      // Cette vérification devrait être faite côté serveur pour la sécurité
      // Pour l'instant, on simule une vérification basique
      const response = await fetch(`https://api.kkiapay.me/api/v1/transaction/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': import.meta.env.VITE_KKIAPAY_PRIVATE_KEY
        },
        body: JSON.stringify({
          transactionId,
          sandbox: this.sandbox
        })
      });

      if (!response.ok) {
        throw new Error('Erreur de vérification du paiement');
      }

      const data = await response.json();
      return data.status === 'SUCCESS';
    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      return false;
    }
  }

  // Calculer les frais de transaction (KKiaPay prend ~3% + frais fixes)
  static calculateFees(amount: number): {
    amount: number;
    fees: number;
    total: number;
  } {
    const feeRate = 0.03; // 3%
    const fixedFee = 100; // 100 FCFA de frais fixes
    const fees = Math.ceil(amount * feeRate + fixedFee);
    
    return {
      amount,
      fees,
      total: amount + fees
    };
  }

  // Formater un montant en FCFA
  static formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-BJ', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount).replace('XOF', 'FCFA');
  }

  // Valider les données de paiement
  static validatePaymentData(data: PaymentData): string[] {
    const errors: string[] = [];

    if (!data.amount || data.amount <= 0) {
      errors.push('Le montant doit être supérieur à 0');
    }

    if (data.amount < 100) {
      errors.push('Le montant minimum est de 100 FCFA');
    }

    if (data.amount > 1000000) {
      errors.push('Le montant maximum est de 1,000,000 FCFA');
    }

    if (!data.customerName?.trim()) {
      errors.push('Le nom du client est requis');
    }

    if (!data.customerEmail?.trim()) {
      errors.push('L\'email du client est requis');
    }

    if (!data.customerPhone?.trim()) {
      errors.push('Le téléphone du client est requis');
    }

    // Validation du format téléphone béninois
    const phoneRegex = /^(\+229|229)?[0-9]{8}$/;
    if (data.customerPhone && !phoneRegex.test(data.customerPhone.replace(/\s/g, ''))) {
      errors.push('Format de téléphone invalide (ex: +229 XX XX XX XX)');
    }

    if (!data.bookingId?.trim()) {
      errors.push('ID de réservation requis');
    }

    if (!data.propertyId?.trim()) {
      errors.push('ID de propriété requis');
    }

    return errors;
  }
}
