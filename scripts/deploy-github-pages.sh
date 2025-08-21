#!/bin/bash

# Script de déploiement automatisé pour GitHub Pages
# Auteur: Développeur Full-Stack Lokali Platform
# Date: $(date +%Y-%m-%d)

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Lokali Platform vers GitHub Pages"
echo "================================================"

# Vérification des prérequis
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo "❌ git n'est pas installé"
    exit 1
fi

# Vérification que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Fichier package.json non trouvé. Exécutez ce script depuis la racine du projet."
    exit 1
fi

# Vérification de la branche
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📍 Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  Vous n'êtes pas sur la branche main. Voulez-vous continuer? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi

# Vérification des modifications non commitées
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Il y a des modifications non commitées:"
    git status --short
    echo "Voulez-vous les committer automatiquement? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "📝 Commit automatique des modifications..."
        git add .
        git commit -m "🚀 DEPLOY: Préparation déploiement GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"
    else
        echo "❌ Veuillez committer vos modifications avant le déploiement"
        exit 1
    fi
fi

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm ci

# Construction de l'application
echo "🔨 Construction de l'application pour la production..."
npm run build:gh-pages

# Vérification que le build a réussi
if [ ! -d "dist" ]; then
    echo "❌ Le dossier dist n'a pas été créé. Build échoué."
    exit 1
fi

# Vérification des fichiers critiques
if [ ! -f "dist/index.html" ]; then
    echo "❌ index.html manquant dans le build"
    exit 1
fi

echo "✅ Build réussi!"
echo "📊 Taille du build:"
du -sh dist/

# Push vers GitHub (déclenche automatiquement le déploiement via GitHub Actions)
echo "📤 Push vers GitHub..."
git push origin $CURRENT_BRANCH

echo ""
echo "🎉 Déploiement initié avec succès!"
echo "📍 GitHub Actions va maintenant déployer l'application"
echo "🌐 URL de production: https://flori92.github.io/lokali-platform/"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifiez le statut du déploiement sur GitHub Actions"
echo "   2. Testez l'application en production"
echo "   3. Vérifiez que Supabase fonctionne correctement"
echo ""
echo "🔗 Liens utiles:"
echo "   - Actions: https://github.com/flori92/lokali-platform/actions"
echo "   - Site: https://flori92.github.io/lokali-platform/"
echo "   - Supabase: https://ubxbnrsflatmbnipqmah.supabase.co"
