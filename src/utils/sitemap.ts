/**
 * Générateur de sitemap XML pour Lokali
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapUrl[] = [];

  constructor(baseUrl: string = window.location.origin) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // Ajouter une URL au sitemap
  addUrl(url: SitemapUrl) {
    this.urls.push({
      ...url,
      loc: url.loc.startsWith('http') ? url.loc : `${this.baseUrl}${url.loc}`
    });
  }

  // Ajouter les pages statiques
  addStaticPages() {
    const staticPages: SitemapUrl[] = [
      {
        loc: '/',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString()
      },
      {
        loc: '/search',
        changefreq: 'hourly',
        priority: 0.9,
        lastmod: new Date().toISOString()
      },
      {
        loc: '/search?type=guest-house',
        changefreq: 'hourly',
        priority: 0.8,
        lastmod: new Date().toISOString()
      },
      {
        loc: '/search?type=long-term-rental',
        changefreq: 'hourly',
        priority: 0.8,
        lastmod: new Date().toISOString()
      },
      {
        loc: '/publish',
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: new Date().toISOString()
      }
    ];

    staticPages.forEach(page => this.addUrl(page));
  }

  // Ajouter les pages de propriétés
  addPropertyPages(properties: Array<{ id: string; updated_at?: string; created_at?: string }>) {
    properties.forEach(property => {
      this.addUrl({
        loc: `/property/${property.id}`,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: property.updated_at || property.created_at
      });
    });
  }

  // Ajouter les pages de villes
  addCityPages(cities: string[]) {
    cities.forEach(city => {
      // Page ville pour guest houses
      this.addUrl({
        loc: `/search?type=guest-house&city=${encodeURIComponent(city)}`,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date().toISOString()
      });

      // Page ville pour locations longue durée
      this.addUrl({
        loc: `/search?type=long-term-rental&city=${encodeURIComponent(city)}`,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date().toISOString()
      });
    });
  }

  // Générer le XML du sitemap
  generateXML(): string {
    const urlsXML = this.urls.map(url => `
  <url>
    <loc>${this.escapeXML(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXML}
</urlset>`;
  }

  // Générer le sitemap et le télécharger
  downloadSitemap() {
    const xml = this.generateXML();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Échapper les caractères XML
  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Vider le sitemap
  clear() {
    this.urls = [];
  }

  // Obtenir toutes les URLs
  getUrls(): SitemapUrl[] {
    return [...this.urls];
  }
}

/**
 * Générateur de robots.txt
 */
export class RobotsGenerator {
  private rules: string[] = [];
  private sitemapUrl: string;

  constructor(sitemapUrl: string = '/sitemap.xml') {
    this.sitemapUrl = sitemapUrl;
  }

  // Ajouter une règle
  addRule(userAgent: string, directive: 'Allow' | 'Disallow', path: string) {
    this.rules.push(`User-agent: ${userAgent}`);
    this.rules.push(`${directive}: ${path}`);
    this.rules.push('');
  }

  // Générer le contenu robots.txt
  generate(): string {
    const defaultRules = [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      'Disallow: /dashboard/',
      'Disallow: /admin/',
      'Disallow: /*.json$',
      '',
      'User-agent: Googlebot',
      'Allow: /',
      'Crawl-delay: 1',
      '',
      'User-agent: Bingbot',
      'Allow: /',
      'Crawl-delay: 2',
      '',
      `Sitemap: ${window.location.origin}${this.sitemapUrl}`,
      '',
      '# Lokali - Location Immobilière Bénin',
      `# Generated on ${new Date().toISOString()}`
    ];

    return [...defaultRules, ...this.rules].join('\n');
  }

  // Télécharger robots.txt
  download() {
    const content = this.generate();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robots.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Hook pour générer automatiquement le sitemap
 */
export const useSitemapGeneration = () => {
  const generateSitemap = async (properties?: Array<{ id: string; updated_at?: string; created_at?: string }>, cities?: string[]) => {
    const sitemap = new SitemapGenerator();
    
    // Ajouter les pages statiques
    sitemap.addStaticPages();
    
    // Ajouter les propriétés si fournies
    if (properties && properties.length > 0) {
      sitemap.addPropertyPages(properties);
    }
    
    // Ajouter les villes si fournies
    if (cities && cities.length > 0) {
      sitemap.addCityPages(cities);
    }
    
    return sitemap;
  };

  const generateRobots = () => {
    const robots = new RobotsGenerator();
    return robots;
  };

  return {
    generateSitemap,
    generateRobots
  };
};
