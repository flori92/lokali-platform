# 🚀 Guide de Déploiement GitHub Pages - Lokali

## Configuration Complète

### 1. Prérequis
- Repository GitHub configuré
- Variables d'environnement définies dans GitHub Secrets
- Supabase backend opérationnel

### 2. Variables d'Environnement GitHub Secrets

Ajoutez ces secrets dans votre repository GitHub (`Settings > Secrets and variables > Actions`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RESEND_API_KEY=your_resend_key
VITE_KKIAPAY_PUBLIC_KEY=your_kkiapay_key
```

### 3. Configuration GitHub Pages

1. Allez dans `Settings > Pages`
2. Source: `Deploy from a branch`
3. Branch: `gh-pages`
4. Folder: `/ (root)`

### 4. Déploiement Automatique

Le workflow GitHub Actions se déclenche automatiquement sur:
- Push vers la branche `main`
- Pull Request vers `main`

### 5. Déploiement Manuel

```bash
# Installer les dépendances
npm install

# Build pour GitHub Pages
npm run build:gh-pages

# Déployer manuellement
npm run deploy
```

### 6. URL de Production

Une fois déployé, votre application sera accessible à:
```
https://[votre-username].github.io/stay-local-rent-easy/
```

### 7. Configuration Domaine Personnalisé (Optionnel)

Pour utiliser un domaine personnalisé:
1. Ajoutez un fichier `CNAME` dans `/public/`
2. Configurez les DNS de votre domaine
3. Activez HTTPS dans GitHub Pages

### 8. Optimisations Incluses

- ✅ Bundle optimisé (<300kB avec code splitting)
- ✅ Compression Gzip/Brotli
- ✅ PWA ready avec Service Worker
- ✅ SEO optimisé avec meta tags dynamiques
- ✅ Support SPA routing avec 404.html
- ✅ Accessibilité WCAG 2.1 compliant

### 9. Monitoring

- Analyseur de performances intégré
- Bundle analyzer disponible dans `/dist/stats.html`
- Métriques Core Web Vitals

### 10. Support

En cas de problème:
1. Vérifiez les logs GitHub Actions
2. Validez les variables d'environnement
3. Testez le build local avec `npm run build:gh-pages`
