import React, { createContext, useContext, useRef } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  trapFocus: (element: HTMLElement) => () => void;
  generateId: (prefix?: string) => string;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useA11y = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useA11y must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const { announce, trapFocus, generateId, announcements, announcementRef } = useAccessibility();

  return (
    <AccessibilityContext.Provider value={{ announce, trapFocus, generateId }}>
      {children}
      
      {/* Live region pour les annonces aux lecteurs d'écran */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
      
      {/* Live region assertive pour les erreurs critiques */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
        id="error-announcements"
      />
    </AccessibilityContext.Provider>
  );
};

/**
 * Composant Skip Links pour navigation rapide
 */
export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <a
        href="#main-content"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Aller au contenu principal
      </a>
      <a
        href="#main-navigation"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2"
      >
        Aller à la navigation
      </a>
      <a
        href="#search-form"
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ml-2"
      >
        Aller à la recherche
      </a>
    </div>
  );
};
