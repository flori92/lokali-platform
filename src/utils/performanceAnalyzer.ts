/**
 * Analyseur de performances pour Lokali
 */

export interface PerformanceMetrics {
  bundleSize: {
    total: number;
    chunks: { name: string; size: number }[];
    gzipped: number;
  };
  loadTime: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
  };
  resources: {
    images: { count: number; totalSize: number };
    scripts: { count: number; totalSize: number };
    styles: { count: number; totalSize: number };
    fonts: { count: number; totalSize: number };
  };
  cacheHitRate: number;
  networkRequests: number;
}

export class PerformanceAnalyzer {
  private observer: PerformanceObserver | null = null;
  private metrics: Partial<PerformanceMetrics> = {};

  constructor() {
    this.initializeObserver();
  }

  // Initialiser l'observateur de performances
  private initializeObserver() {
    if ('PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processPerformanceEntry(entry);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      } catch (error) {
        console.warn('Certaines métriques de performance ne sont pas supportées:', error);
      }
    }
  }

  // Traiter une entrée de performance
  private processPerformanceEntry(entry: PerformanceEntry) {
    switch (entry.entryType) {
      case 'navigation':
        this.processNavigationEntry(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.processPaintEntry(entry as PerformancePaintTiming);
        break;
      case 'largest-contentful-paint':
        this.processLCPEntry(entry as PerformanceEntry & { startTime: number });
        break;
      case 'first-input':
        this.processFIDEntry(entry as PerformanceEntry & { processingStart: number; startTime: number });
        break;
      case 'layout-shift':
        this.processCLSEntry(entry as PerformanceEntry & { hadRecentInput: boolean; value: number });
        break;
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming) {
    if (!this.metrics.loadTime) {
      this.metrics.loadTime = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    }
    this.metrics.loadTime.ttfb = entry.responseStart - entry.requestStart;
  }

  private processPaintEntry(entry: PerformancePaintTiming) {
    if (!this.metrics.loadTime) {
      this.metrics.loadTime = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    }
    if (entry.name === 'first-contentful-paint') {
      this.metrics.loadTime.fcp = entry.startTime;
    }
  }

  private processLCPEntry(entry: PerformanceEntry & { startTime: number }) {
    if (!this.metrics.loadTime) {
      this.metrics.loadTime = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    }
    this.metrics.loadTime.lcp = entry.startTime;
  }

  private processFIDEntry(entry: PerformanceEntry & { processingStart: number; startTime: number }) {
    if (!this.metrics.loadTime) {
      this.metrics.loadTime = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    }
    this.metrics.loadTime.fid = entry.processingStart - entry.startTime;
  }

  private processCLSEntry(entry: PerformanceEntry & { hadRecentInput: boolean; value: number }) {
    if (!this.metrics.loadTime) {
      this.metrics.loadTime = { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 };
    }
    if (!entry.hadRecentInput) {
      this.metrics.loadTime.cls = (this.metrics.loadTime.cls || 0) + entry.value;
    }
  }

  // Analyser les ressources chargées
  analyzeResources(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
      images: { count: 0, totalSize: 0 },
      scripts: { count: 0, totalSize: 0 },
      styles: { count: 0, totalSize: 0 },
      fonts: { count: 0, totalSize: 0 }
    };

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      const url = resource.name;

      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        analysis.images.count++;
        analysis.images.totalSize += size;
      } else if (url.match(/\.(js|mjs)$/i)) {
        analysis.scripts.count++;
        analysis.scripts.totalSize += size;
      } else if (url.match(/\.(css)$/i)) {
        analysis.styles.count++;
        analysis.styles.totalSize += size;
      } else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
        analysis.fonts.count++;
        analysis.fonts.totalSize += size;
      }
    });

    this.metrics.resources = analysis;
    this.metrics.networkRequests = resources.length;
  }

  // Analyser le taux de cache
  analyzeCacheHitRate(): void {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    let cacheHits = 0;
    const baseStructuredData: Record<string, unknown> = {};

    resources.forEach(resource => {
      // Si transferSize est 0 ou très petit, c'est probablement du cache
      if (resource.transferSize === 0 || (resource.transferSize < resource.decodedBodySize * 0.1)) {
        cacheHits++;
      }
    });

    this.metrics.cacheHitRate = resources.length > 0 ? (cacheHits / resources.length) * 100 : 0;
  }

  // Obtenir toutes les métriques
  getMetrics(): PerformanceMetrics {
    this.analyzeResources();
    this.analyzeCacheHitRate();

    return {
      bundleSize: this.metrics.bundleSize || { total: 0, chunks: [], gzipped: 0 },
      loadTime: this.metrics.loadTime || { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: 0 },
      resources: this.metrics.resources || { images: { count: 0, totalSize: 0 }, scripts: { count: 0, totalSize: 0 }, styles: { count: 0, totalSize: 0 }, fonts: { count: 0, totalSize: 0 } },
      cacheHitRate: this.metrics.cacheHitRate || 0,
      networkRequests: this.metrics.networkRequests || 0
    };
  }

  // Générer un rapport de performance
  generateReport(): string {
    const metrics = this.getMetrics();
    
    return `
# Rapport de Performance Lokali

## Métriques Core Web Vitals
- **First Contentful Paint (FCP)**: ${metrics.loadTime.fcp.toFixed(0)}ms ${this.getScoreEmoji(metrics.loadTime.fcp, 1800, 3000)}
- **Largest Contentful Paint (LCP)**: ${metrics.loadTime.lcp.toFixed(0)}ms ${this.getScoreEmoji(metrics.loadTime.lcp, 2500, 4000)}
- **First Input Delay (FID)**: ${metrics.loadTime.fid.toFixed(0)}ms ${this.getScoreEmoji(metrics.loadTime.fid, 100, 300)}
- **Cumulative Layout Shift (CLS)**: ${metrics.loadTime.cls.toFixed(3)} ${this.getScoreEmoji(metrics.loadTime.cls * 1000, 100, 250)}
- **Time to First Byte (TTFB)**: ${metrics.loadTime.ttfb.toFixed(0)}ms ${this.getScoreEmoji(metrics.loadTime.ttfb, 800, 1800)}

## Ressources
- **Images**: ${metrics.resources.images.count} fichiers (${this.formatBytes(metrics.resources.images.totalSize)})
- **Scripts**: ${metrics.resources.scripts.count} fichiers (${this.formatBytes(metrics.resources.scripts.totalSize)})
- **Styles**: ${metrics.resources.styles.count} fichiers (${this.formatBytes(metrics.resources.styles.totalSize)})
- **Polices**: ${metrics.resources.fonts.count} fichiers (${this.formatBytes(metrics.resources.fonts.totalSize)})

## Cache et Réseau
- **Taux de cache**: ${metrics.cacheHitRate.toFixed(1)}% ${this.getScoreEmoji(metrics.cacheHitRate, 70, 50)}
- **Requêtes réseau**: ${metrics.networkRequests}

## Recommandations
${this.generateRecommendations(metrics)}
    `.trim();
  }

  private getScoreEmoji(value: number, good: number, poor: number): string {
    if (value <= good) return '🟢';
    if (value <= poor) return '🟡';
    return '🔴';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private generateRecommendations(metrics: PerformanceMetrics): string {
    const recommendations: string[] = [];

    // Recommandations FCP
    if (metrics.loadTime.fcp > 3000) {
      recommendations.push('- Optimiser le FCP : réduire la taille du CSS critique, utiliser le preloading');
    }

    // Recommandations LCP
    if (metrics.loadTime.lcp > 4000) {
      recommendations.push('- Optimiser le LCP : compresser les images, utiliser un CDN, optimiser le serveur');
    }

    // Recommandations FID
    if (metrics.loadTime.fid > 300) {
      recommendations.push('- Optimiser le FID : réduire le JavaScript, utiliser le code splitting');
    }

    // Recommandations CLS
    if (metrics.loadTime.cls > 0.25) {
      recommendations.push('- Optimiser le CLS : définir les dimensions des images, éviter les insertions dynamiques');
    }

    // Recommandations images
    if (metrics.resources.images.totalSize > 1024 * 1024) {
      recommendations.push('- Optimiser les images : utiliser WebP, redimensionner, lazy loading');
    }

    // Recommandations scripts
    if (metrics.resources.scripts.totalSize > 500 * 1024) {
      recommendations.push('- Optimiser le JavaScript : code splitting, tree shaking, minification');
    }

    // Recommandations cache
    if (metrics.cacheHitRate < 70) {
      recommendations.push('- Améliorer le cache : configurer les headers de cache, utiliser un Service Worker');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Excellentes performances ! 🎉';
  }

  // Déconnecter l'observateur
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

import React from 'react';

// Hook React pour utiliser l'analyseur de performances
export const usePerformanceAnalyzer = () => {
  const [analyzer] = React.useState(() => new PerformanceAnalyzer());
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    // Analyser les performances après le chargement initial
    const timer = setTimeout(() => {
      setMetrics(analyzer.getMetrics());
    }, 2000);

    return () => {
      clearTimeout(timer);
      analyzer.disconnect();
    };
  }, [analyzer]);

  const refreshMetrics = () => {
    setMetrics(analyzer.getMetrics());
  };

  const generateReport = () => {
    return analyzer.generateReport();
  };

  return {
    metrics,
    refreshMetrics,
    generateReport
  };
};

// Instance globale
export const performanceAnalyzer = new PerformanceAnalyzer();
