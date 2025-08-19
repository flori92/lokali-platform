import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Index from './pages/Index';
import PropertyDetail from './pages/PropertyDetail';
import SearchResults from './pages/SearchResults';
import PublishProperty from './pages/PublishProperty';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Router>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/publish" 
                  element={
                    <ProtectedRoute requireRole="owner">
                      <PublishProperty />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Index />} />
              </Routes>
            </ErrorBoundary>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
