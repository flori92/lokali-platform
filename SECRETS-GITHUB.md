# Configuration des Secrets GitHub pour Lokali

## Variables d'environnement requises

Pour que le déploiement GitHub Pages fonctionne correctement, vous devez configurer les secrets suivants dans votre repository GitHub :

### 1. Accéder aux Secrets GitHub
1. Allez sur https://github.com/flori92/lokali-platform/settings/secrets/actions
2. Cliquez sur "New repository secret" pour chaque variable

### 2. Secrets à configurer

#### VITE_SUPABASE_URL
- **Nom** : `VITE_SUPABASE_URL`
- **Valeur** : `https://ubxbnrsflatmbnipqmah.supabase.co`
- **Description** : URL de base de votre instance Supabase

#### VITE_SUPABASE_ANON_KEY
- **Nom** : `VITE_SUPABASE_ANON_KEY`
- **Valeur** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVieGJucnNmbGF0bWJuaXBxbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NDgwODQsImV4cCI6MjA3MTEyNDA4NH0._NAvgKso5MMBHg3ZsWLooxA_kR5VpVfwUJHNi6KTDVA`
- **Description** : Clé d'API publique pour l'authentification côté client

#### VITE_RESEND_API_KEY
- **Nom** : `VITE_RESEND_API_KEY`
- **Valeur** : `re_J4Mxa2S2_6AQaQKaQhNEqwo9TUDVZoXj2`
- **Description** : Service d'envoi d'emails pour les notifications

#### VITE_KKIAPAY_PUBLIC_KEY
- **Nom** : `VITE_KKIAPAY_PUBLIC_KEY`
- **Valeur** : `4990916032a111f0a275d9450958fcf0`
- **Description** : Intégration paiement mobile money (MTN, Moov, Orange)

## Instructions détaillées

### Obtenir les clés Supabase
1. Connectez-vous à https://supabase.com/dashboard
2. Sélectionnez votre projet Lokali
3. Allez dans Settings > API
4. Copiez l'URL du projet et la clé `anon/public`

### Obtenir la clé Resend
1. Connectez-vous à https://resend.com/dashboard
2. Allez dans API Keys
3. Créez une nouvelle clé API
4. Copiez la clé générée

### Obtenir la clé KKiaPay
1. Connectez-vous à votre compte KKiaPay
2. Allez dans les paramètres API
3. Copiez votre clé publique

## Vérification
Une fois tous les secrets configurés, le workflow GitHub Actions pourra :
- Construire l'application avec les vraies variables d'environnement
- Déployer sur GitHub Pages avec la configuration complète
- Permettre l'authentification, les paiements et les notifications

## Fallback
Si certains secrets ne sont pas configurés, le workflow utilisera des valeurs placeholder pour éviter les échecs de build, mais les fonctionnalités correspondantes ne fonctionneront pas en production.
