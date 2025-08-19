import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  locale?: string;
  siteName?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  price?: {
    amount: number;
    currency: string;
  };
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
}

const DEFAULT_SEO: SEOData = {
  title: 'Lokali - Location Immobilière Directe au Bénin',
  description: 'Trouvez et louez des guest houses et appartements au Bénin sans intermédiaire. Réservation directe, prix transparents, paiement mobile money.',
  keywords: ['location', 'appartement', 'bénin', 'guest house', 'immobilier', 'cotonou', 'porto-novo'],
  image: '/assets/hero-image.jpg',
  type: 'website',
  locale: 'fr_BJ',
  siteName: 'Lokali',
  author: 'Lokali Team'
};

export const useSEO = (seoData?: SEOData) => {
  const location = useLocation();

  useEffect(() => {
    const data = { ...DEFAULT_SEO, ...seoData };
    const currentUrl = `${window.location.origin}${location.pathname}`;

    // Titre de la page
    document.title = data.title || DEFAULT_SEO.title!;

    // Meta description
    updateMetaTag('description', data.description || DEFAULT_SEO.description!);

    // Meta keywords
    if (data.keywords && data.keywords.length > 0) {
      updateMetaTag('keywords', data.keywords.join(', '));
    }

    // Meta robots
    updateMetaTag('robots', 'index, follow, max-image-preview:large');

    // Canonical URL
    updateLinkTag('canonical', data.url || currentUrl);

    // Open Graph
    updateMetaProperty('og:title', data.title || DEFAULT_SEO.title!);
    updateMetaProperty('og:description', data.description || DEFAULT_SEO.description!);
    updateMetaProperty('og:image', data.image || DEFAULT_SEO.image!);
    updateMetaProperty('og:url', data.url || currentUrl);
    updateMetaProperty('og:type', data.type || 'website');
    updateMetaProperty('og:locale', data.locale || 'fr_BJ');
    updateMetaProperty('og:site_name', data.siteName || 'Lokali');

    // Twitter Card
    updateMetaName('twitter:card', 'summary_large_image');
    updateMetaName('twitter:title', data.title || DEFAULT_SEO.title!);
    updateMetaName('twitter:description', data.description || DEFAULT_SEO.description!);
    updateMetaName('twitter:image', data.image || DEFAULT_SEO.image!);

    // Article meta (pour les propriétés)
    if (data.type === 'article' || data.type === 'product') {
      if (data.author) updateMetaProperty('article:author', data.author);
      if (data.publishedTime) updateMetaProperty('article:published_time', data.publishedTime);
      if (data.modifiedTime) updateMetaProperty('article:modified_time', data.modifiedTime);
      if (data.section) updateMetaProperty('article:section', data.section);
      if (data.tags) {
        data.tags.forEach(tag => {
          addMetaProperty('article:tag', tag);
        });
      }
    }

    // Product meta (pour les propriétés)
    if (data.type === 'product') {
      if (data.price) {
        updateMetaProperty('product:price:amount', data.price.amount.toString());
        updateMetaProperty('product:price:currency', data.price.currency);
      }
      if (data.availability) {
        updateMetaProperty('product:availability', data.availability);
      }
    }

    // Structured Data JSON-LD
    updateStructuredData(data, currentUrl);

  }, [seoData, location.pathname]);

  return {
    updateSEO: (newData: SEOData) => {
      // Cette fonction peut être utilisée pour mettre à jour le SEO dynamiquement
    }
  };
};

// Fonctions utilitaires pour manipuler les meta tags
function updateMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function updateMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function updateMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function addMetaProperty(property: string, content: string) {
  const meta = document.createElement('meta');
  meta.setAttribute('property', property);
  meta.content = content;
  document.head.appendChild(meta);
}

function updateLinkTag(rel: string, href: string) {
  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

function updateStructuredData(data: SEOData, currentUrl: string) {
  // Supprimer l'ancien script JSON-LD
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  let structuredData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.siteName || 'Lokali',
    description: data.description,
    url: currentUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${window.location.origin}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // Si c'est une propriété, utiliser le schema Product/Accommodation
  if (data.type === 'product') {
    structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Accommodation',
      name: data.title,
      description: data.description,
      image: data.image,
      url: currentUrl,
      ...(data.price && {
        offers: {
          '@type': 'Offer',
          price: data.price.amount,
          priceCurrency: data.price.currency,
          availability: `https://schema.org/${data.availability || 'InStock'}`
        }
      }),
      ...(data.rating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating.value,
          reviewCount: data.rating.count
        }
      })
    };
  }

  // Ajouter le nouveau script JSON-LD
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

/**
 * Hook pour générer des meta tags spécifiques aux propriétés
 */
interface PropertyData {
  title?: string;
  type?: string;
  location?: { city?: string };
  description?: string;
  amenities?: string[];
  images?: string[];
  price?: { amount: number; currency: string };
  rating?: { average: number; count: number };
  available?: boolean;
}

export const usePropertySEO = (property: PropertyData) => {
  const seoData: SEOData = {
    title: `${property?.title} - Location ${property?.type === 'guest-house' ? 'Guest House' : 'Appartement'} à ${property?.location?.city}`,
    description: `${property?.description?.substring(0, 150)}... Réservez maintenant cette ${property?.type === 'guest-house' ? 'guest house' : 'location'} à ${property?.location?.city}, Bénin.`,
    keywords: [
      'location',
      property?.location?.city,
      property?.type,
      'bénin',
      ...(property?.amenities || [])
    ],
    image: property?.images?.[0] || '/assets/property-placeholder.jpg',
    type: 'product',
    price: property?.price ? {
      amount: property.price.amount,
      currency: property.price.currency
    } : undefined,
    rating: property?.rating ? {
      value: property.rating.average,
      count: property.rating.count
    } : undefined,
    availability: property?.available ? 'InStock' : 'OutOfStock',
    tags: property?.amenities || [],
    section: 'Immobilier'
  };

  return useSEO(seoData);
};

/**
 * Hook pour les pages de recherche
 */
interface SearchFilters {
  city?: string;
  type?: string;
}

export const useSearchSEO = (filters: SearchFilters, resultCount?: number) => {
  const city = filters?.city || 'Bénin';
  const type = filters?.type === 'guest-house' ? 'Guest Houses' : 
               filters?.type === 'long-term-rental' ? 'Locations Longue Durée' : 'Propriétés';
  
  const seoData: SEOData = {
    title: `${type} à ${city} - Lokali`,
    description: `Découvrez ${resultCount || 'de nombreuses'} ${type.toLowerCase()} disponibles à ${city}. Réservation directe, sans commission, paiement mobile money.`,
    keywords: [
      'location',
      city.toLowerCase(),
      type.toLowerCase(),
      'bénin',
      'réservation',
      'sans commission'
    ],
    type: 'website'
  };

  return useSEO(seoData);
};
