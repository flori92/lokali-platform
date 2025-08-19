import { useEffect, useRef, useState } from 'react';

/**
 * Hook pour la gestion de l'accessibilité WCAG 2.1
 */
export const useAccessibility = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Annoncer un message aux lecteurs d'écran
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message]);
    
    // Nettoyer après 1 seconde
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  };

  // Gérer le focus trap pour les modales
  const trapFocus = (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  };

  // Vérifier le contraste des couleurs
  const checkContrast = (foreground: string, background: string): boolean => {
    // Implémentation simplifiée - en production, utiliser une librairie dédiée
    return true; // Placeholder
  };

  // Générer des IDs uniques pour aria-describedby
  const generateId = (prefix: string = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    announce,
    trapFocus,
    checkContrast,
    generateId,
    announcements,
    announcementRef
  };
};

/**
 * Hook pour la navigation clavier
 */
export const useKeyboardNavigation = () => {
  const handleKeyDown = (
    e: React.KeyboardEvent,
    onEnter?: () => void,
    onEscape?: () => void,
    onArrowUp?: () => void,
    onArrowDown?: () => void,
    onArrowLeft?: () => void,
    onArrowRight?: () => void
  ) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        onEnter?.();
        e.preventDefault();
        break;
      case 'Escape':
        onEscape?.();
        e.preventDefault();
        break;
      case 'ArrowUp':
        onArrowUp?.();
        e.preventDefault();
        break;
      case 'ArrowDown':
        onArrowDown?.();
        e.preventDefault();
        break;
      case 'ArrowLeft':
        onArrowLeft?.();
        e.preventDefault();
        break;
      case 'ArrowRight':
        onArrowRight?.();
        e.preventDefault();
        break;
    }
  };

  return { handleKeyDown };
};

/**
 * Hook pour la gestion du focus
 */
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const saveFocus = () => {
    setFocusedElement(document.activeElement as HTMLElement);
  };

  const restoreFocus = () => {
    if (focusedElement) {
      focusedElement.focus();
      setFocusedElement(null);
    }
  };

  const focusFirst = (container: HTMLElement) => {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement;
    firstFocusable?.focus();
  };

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    focusedElement
  };
};
