import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
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
  price?: {
    amount: number;
    currency: string;
  };
  rating?: {
    value: number;
    count: number;
  };
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  structuredData?: object;
}

const DEFAULT_SEO = {
  title: 'Lokali - Location Immobilière Directe au Bénin',
  description: 'Trouvez et louez des guest houses et appartements au Bénin sans intermédiaire. Réservation directe, prix transparents, paiement mobile money.',
  keywords: ['location', 'appartement', 'bénin', 'guest house', 'immobilier', 'cotonou', 'porto-novo'],
  image: '/assets/hero-image.jpg',
  type: 'website' as const,
  locale: 'fr_BJ',
  siteName: 'Lokali',
  author: 'Lokali Team'
};

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  locale = 'fr_BJ',
  siteName = 'Lokali',
  author,
  publishedTime,
  modifiedTime,
  price,
  rating,
  availability,
  structuredData
}) => {
  const seoTitle = title || DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords || DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const currentUrl = url || window.location.href;

  // Générer les données structurées
  const generateStructuredData = () => {
    if (structuredData) {
      return structuredData;
    }

    let baseStructuredData: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteName,
      description: seoDescription,
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

    // Schema pour les propriétés
    if (type === 'product') {
      baseStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Accommodation',
        name: seoTitle,
        description: seoDescription,
        image: seoImage,
        url: currentUrl,
        ...(price && {
          offers: {
            '@type': 'Offer',
            price: price.amount,
            priceCurrency: price.currency,
            availability: `https://schema.org/${availability || 'InStock'}`
          }
        }),
        ...(rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating.value,
            reviewCount: rating.count,
            bestRating: 5,
            worstRating: 1
          }
        }),
        provider: {
          '@type': 'Organization',
          name: siteName,
          url: window.location.origin
        }
      };
    }

    return baseStructuredData;
  };

  return (
    <Helmet>
      {/* Titre de la page */}
      <title>{seoTitle}</title>

      {/* Meta tags de base */}
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords.join(', ')} />
      <meta name="author" content={author || DEFAULT_SEO.author} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="language" content={locale} />
      <meta name="revisit-after" content="7 days" />

      {/* Canonical URL */}
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={locale} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Meta tags pour les articles/produits */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}

      {/* Meta tags pour les produits */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.amount.toString()} />
          <meta property="product:price:currency" content={price.currency} />
        </>
      )}
      {type === 'product' && availability && (
        <meta property="product:availability" content={availability} />
      )}

      {/* Données structurées JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(generateStructuredData())}
      </script>

      {/* Meta tags pour PWA */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteName} />

      {/* Liens vers les icônes */}
      <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon.svg" />
      <link rel="manifest" href="/manifest.json" />

      {/* DNS Prefetch pour les performances */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//api.supabase.co" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

/**
 * Composant SEO spécialisé pour les propriétés
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
  created_at?: string;
  updated_at?: string;
}

export const PropertySEOHead: React.FC<{
  property: PropertyData;
}> = ({ property }) => {
  const seoData = {
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
    type: 'product' as const,
    price: property?.price ? {
      amount: property.price.amount,
      currency: property.price.currency
    } : undefined,
    rating: property?.rating ? {
      value: property.rating.average,
      count: property.rating.count
    } : undefined,
    availability: property?.available ? 'InStock' as const : 'OutOfStock' as const,
    publishedTime: property?.created_at,
    modifiedTime: property?.updated_at
  };

  return <SEOHead {...seoData} />;
};

/**
 * Composant SEO pour les pages de recherche
 */
interface SearchFilters {
  city?: string;
  type?: string;
}

export const SearchSEOHead: React.FC<{
  filters: SearchFilters;
  resultCount?: number;
}> = ({ filters, resultCount }) => {
  const city = filters?.city || 'Bénin';
  const type = filters?.type === 'guest-house' ? 'Guest Houses' : 
               filters?.type === 'long-term-rental' ? 'Locations Longue Durée' : 'Propriétés';
  
  const seoData = {
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
    type: 'website' as const
  };

  return <SEOHead {...seoData} />;
};
