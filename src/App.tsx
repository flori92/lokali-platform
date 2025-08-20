import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AccessibilityProvider } from '@/components/AccessibilityProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

// Import des pages principales avec gestion d'erreur
const Index = lazy(() => import('@/pages/Index').catch(() => ({ default: () => <div>Erreur de chargement de la page d'accueil</div> })));
const PublishProperty = lazy(() => import('@/pages/PublishProperty').catch(() => ({ default: () => <div>Erreur de chargement de la page de publication</div> })));
const Login = lazy(() => import('@/pages/Login').catch(() => ({ default: () => <div>Erreur de chargement de la page de connexion</div> })));
const Register = lazy(() => import('@/pages/Register').catch(() => ({ default: () => <div>Erreur de chargement de la page d'inscription</div> })));

// Version simplifiée de PublishProperty pour éviter les erreurs
const SimplePublishProperty = () => (
  <div className="min-h-screen bg-white">
    <main className="container mx-auto p-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Publier votre propriété
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Ajoutez votre propriété sur Lokali et commencez à recevoir des réservations.
        </p>
      </div>
      
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de la propriété
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Villa moderne avec piscine"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea 
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Décrivez votre propriété..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix par nuit (FCFA)
              </label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de chambres
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>1 chambre</option>
                <option>2 chambres</option>
                <option>3 chambres</option>
                <option>4+ chambres</option>
              </select>
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-2">
              📸 Zone d'upload d'images
            </div>
            <p className="text-sm text-gray-400">
              Glissez vos photos ici ou cliquez pour sélectionner
            </p>
          </div>
          
          <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium">
            Publier la propriété
          </button>
        </div>
      </div>
    </main>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Version simplifiée de la page Index
const SimpleIndex = () => (
  <div className="min-h-screen bg-white">
    <main className="container mx-auto p-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Trouvez votre logement idéal au Bénin
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Découvrez notre sélection de propriétés exceptionnelles à travers le Bénin. 
          Des appartements modernes aux villas traditionnelles, trouvez l'hébergement parfait pour votre séjour.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Image de propriété</span>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Villa Moderne à Cotonou</h3>
            <p className="text-gray-600 mb-4">Belle villa avec 3 chambres, piscine et jardin.</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">25,000 FCFA/nuit</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Réserver
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Image de propriété</span>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Appartement Centre-ville</h3>
            <p className="text-gray-600 mb-4">Appartement moderne au cœur de Porto-Novo.</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">15,000 FCFA/nuit</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Réserver
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-48 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">Image de propriété</span>
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-2">Maison Traditionnelle</h3>
            <p className="text-gray-600 mb-4">Authentique maison béninoise avec charme local.</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-blue-600">12,000 FCFA/nuit</span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Réserver
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Header temporaire sans authentification pour éviter l'erreur Supabase
const SimpleHeader = () => (
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">Lokali</h1>
        </div>
        <nav className="flex space-x-8">
          <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
            Accueil
          </Link>
          <Link to="/publish" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
            Publier
          </Link>
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            Connexion
          </Link>
        </nav>
      </div>
    </div>
  </header>
);

function App() {
  // Gestion du routage GitHub Pages SPA
  useEffect(() => {
    const { redirect } = sessionStorage;
    delete sessionStorage.redirect;
    if (redirect && redirect !== location.href) {
      history.replaceState(null, '', redirect);
    }
  }, []);

  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Router basename={import.meta.env.PROD ? '/stay-local-rent-easy' : ''}>
              <div className="min-h-screen bg-background">
                <SimpleHeader />
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<SimpleIndex />} />
                    <Route path="/publish" element={<PublishProperty />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<SimpleIndex />} />
                  </Routes>
                </Suspense>
              </div>
            </Router>
          </QueryClientProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ErrorBoundary>
  );
}

export default App;
