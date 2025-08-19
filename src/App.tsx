import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Index from './pages/Index';
import PropertyDetail from './pages/PropertyDetail';
import SearchResults from './pages/SearchResults';
import PublishProperty from './pages/PublishProperty';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Router>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/property/:id" element={<PropertyDetail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/publish" element={<PublishProperty />} />
              <Route path="*" element={<Index />} />
            </Routes>
          </ErrorBoundary>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
