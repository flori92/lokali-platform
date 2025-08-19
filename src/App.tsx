import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Index from '@/pages/Index';
import './App.css';

// Lazy loading des pages non-critiques
const SearchResults = lazy(() => import('@/pages/SearchResults'));
const PropertyDetail = lazy(() => import('@/pages/PropertyDetail'));
const PublishProperty = lazy(() => import('@/pages/PublishProperty'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Booking = lazy(() => import('@/pages/Booking'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Profile = lazy(() => import('@/pages/Profile'));

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <div className="min-h-screen bg-background">
              <Header />
              <main>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/property/:id" element={<PropertyDetail />} />
                    <Route path="/property/:id/book" element={<Booking />} />
                    <Route path="/publish" element={<PublishProperty />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="*" element={<Index />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
