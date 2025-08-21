// Service Worker pour Lokali PWA
// Version et configuration du cache
const CACHE_VERSION = 'lokali-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Ressources à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/assets/hero-image.jpg',
  '/offline.html'
];

// Stratégies de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Configuration des routes et leurs stratégies
const ROUTE_STRATEGIES = {
  // Assets statiques - Cache First
  '/assets/': CACHE_STRATEGIES.CACHE_FIRST,
  '/icons/': CACHE_STRATEGIES.CACHE_FIRST,
  '/favicon.svg': CACHE_STRATEGIES.CACHE_FIRST,
  
  // Pages principales - Stale While Revalidate
  '/': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/search': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  '/property/': CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
  
  // API - Network First
  '/api/': CACHE_STRATEGIES.NETWORK_FIRST,
  'supabase.co': CACHE_STRATEGIES.NETWORK_FIRST,
  
  // Pages sensibles - Network Only
  '/login': CACHE_STRATEGIES.NETWORK_ONLY,
  '/register': CACHE_STRATEGIES.NETWORK_ONLY,
  '/dashboard': CACHE_STRATEGIES.NETWORK_ONLY,
  '/publish': CACHE_STRATEGIES.NETWORK_ONLY
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installation en cours...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Cache statique ouvert');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Ressources statiques mises en cache');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation en cours...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('lokali-') && cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
              console.log('[SW] Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activé');
        return self.clients.claim();
      })
  );
});

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Déterminer la stratégie de cache
  const strategy = getStrategyForUrl(url.pathname);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Erreur lors du traitement de la requête:', error);
        return handleOffline(request);
      })
  );
});

// Déterminer la stratégie de cache pour une URL
function getStrategyForUrl(pathname) {
  for (const [route, strategy] of Object.entries(ROUTE_STRATEGIES)) {
    if (pathname.startsWith(route) || pathname.includes(route)) {
      return strategy;
    }
  }
  
  // Stratégie par défaut
  if (pathname.includes('/api/') || pathname.includes('supabase')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Gestionnaire principal des requêtes
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return handleCacheOnly(request);
    default:
      return handleStaleWhileRevalidate(request);
  }
}

// Stratégie Cache First
async function handleCacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  await updateCache(request, networkResponse.clone(), STATIC_CACHE);
  return networkResponse;
}

// Stratégie Network First
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await updateCache(request, networkResponse.clone(), API_CACHE);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stratégie Stale While Revalidate
async function handleStaleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        updateCache(request, networkResponse.clone(), DYNAMIC_CACHE);
      }
      return networkResponse;
    })
    .catch(() => null);
  
  return cachedResponse || networkResponsePromise;
}

// Stratégie Cache Only
async function handleCacheOnly(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  throw new Error('Ressource non disponible en cache');
}

// Mettre à jour le cache
async function updateCache(request, response, cacheName) {
  if (response.status === 200) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response);
  }
}

// Gestion du mode offline
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // Page offline pour les navigations
  if (request.mode === 'navigate') {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }
  
  // Image placeholder pour les images
  if (request.destination === 'image') {
    const placeholderImage = await caches.match('/placeholder.svg');
    if (placeholderImage) {
      return placeholderImage;
    }
  }
  
  // Réponse JSON vide pour les APIs
  if (url.pathname.includes('/api/')) {
    return new Response(
      JSON.stringify({ 
        error: 'Mode hors ligne', 
        message: 'Cette fonctionnalité nécessite une connexion internet' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response('Contenu non disponible hors ligne', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Gestion des messages du client
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_PROPERTY':
      if (payload && payload.url) {
        cacheProperty(payload.url, payload.data);
      }
      break;
  }
});

// Vider tous les caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Mettre en cache une propriété spécifique
async function cacheProperty(url, data) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(url, response);
  } catch (error) {
    console.error('[SW] Erreur lors de la mise en cache de la propriété:', error);
  }
}

// Notification de mise à jour disponible
self.addEventListener('updatefound', () => {
  const newWorker = self.registration.installing;
  
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && self.registration.active) {
      // Notifier le client qu'une mise à jour est disponible
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            payload: { version: CACHE_VERSION }
          });
        });
      });
    }
  });
});

console.log('[SW] Service Worker Lokali chargé - Version:', CACHE_VERSION);
