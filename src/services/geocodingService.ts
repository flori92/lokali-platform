// Service de géocodage pour convertir adresses en coordonnées GPS
// Utilise l'API Nominatim d'OpenStreetMap (gratuite)

export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  city?: string;
  district?: string;
  country?: string;
}

export interface ReverseGeocodingResult {
  address: string;
  city?: string;
  district?: string;
  country?: string;
}

export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org';
  private static readonly DELAY_MS = 1000; // Respecter la limite de 1 req/sec

  // Délai entre les requêtes pour respecter les limites de l'API
  private static lastRequestTime = 0;

  private static async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.DELAY_MS) {
      const waitTime = this.DELAY_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Géocoder une adresse (adresse → coordonnées)
  static async geocodeAddress(address: string, countryCode = 'BJ'): Promise<GeocodingResult[]> {
    try {
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: countryCode,
        'accept-language': 'fr'
      });

      const response = await fetch(`${this.BASE_URL}/search?${params}`, {
        headers: {
          'User-Agent': 'Lokali-Platform/1.0 (contact@lokali.bj)'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur géocodage: ${response.status}`);
      }

      const data = await response.json();

      return data.map((item: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; suburb?: string; neighbourhood?: string; country?: string } }) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village,
        district: item.address?.suburb || item.address?.neighbourhood,
        country: item.address?.country
      }));
    } catch (error) {
      console.error('Erreur géocodage:', error);
      throw new Error('Impossible de géocoder l\'adresse');
    }
  }

  // Géocodage inverse (coordonnées → adresse)
  static async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult> {
    try {
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'fr'
      });

      const response = await fetch(`${this.BASE_URL}/reverse?${params}`, {
        headers: {
          'User-Agent': 'Lokali-Platform/1.0 (contact@lokali.bj)'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur géocodage inverse: ${response.status}`);
      }

      const data = await response.json();

      return {
        address: data.display_name,
        city: data.address?.city || data.address?.town || data.address?.village,
        district: data.address?.suburb || data.address?.neighbourhood,
        country: data.address?.country
      };
    } catch (error) {
      console.error('Erreur géocodage inverse:', error);
      throw new Error('Impossible de récupérer l\'adresse');
    }
  }

  // Rechercher des suggestions d'adresses pour l'autocomplétion
  static async searchAddressSuggestions(query: string, countryCode = 'BJ'): Promise<GeocodingResult[]> {
    if (query.length < 3) return [];

    try {
      await this.waitForRateLimit();

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        countrycodes: countryCode,
        'accept-language': 'fr'
      });

      const response = await fetch(`${this.BASE_URL}/search?${params}`, {
        headers: {
          'User-Agent': 'Lokali-Platform/1.0 (contact@lokali.bj)'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur recherche suggestions: ${response.status}`);
      }

      const data = await response.json();

      return data.map((item: { lat: string; lon: string; display_name: string; address?: { city?: string; town?: string; village?: string; suburb?: string; neighbourhood?: string; country?: string } }) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: item.address?.city || item.address?.town || item.address?.village,
        district: item.address?.suburb || item.address?.neighbourhood,
        country: item.address?.country
      }));
    } catch (error) {
      console.error('Erreur recherche suggestions:', error);
      return [];
    }
  }

  // Calculer la distance entre deux points (formule haversine)
  static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Rechercher des propriétés dans un rayon donné
  static filterPropertiesByDistance(
    properties: Array<{ location: { coordinates?: { lat: number; lng: number } } }>,
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ) {
    return properties.filter(property => {
      const coords = property.location.coordinates;
      if (!coords) return false;
      
      const distance = this.calculateDistance(
        centerLat, 
        centerLng, 
        coords.lat, 
        coords.lng
      );
      
      return distance <= radiusKm;
    });
  }

  // Obtenir les coordonnées d'une ville du Bénin
  static async getCityCoordinates(cityName: string): Promise<GeocodingResult | null> {
    try {
      const results = await this.geocodeAddress(`${cityName}, Bénin`);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error(`Erreur coordonnées ville ${cityName}:`, error);
      return null;
    }
  }

  // Valider des coordonnées GPS
  static validateCoordinates(lat: number, lng: number): boolean {
    return (
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  // Formater une adresse pour l'affichage
  static formatAddress(
    address: string,
    city?: string,
    district?: string,
    country?: string
  ): string {
    const parts = [address];
    if (city && !address.includes(city)) parts.push(city);
    if (district && !address.includes(district)) parts.push(district);
    if (country && country !== 'Bénin' && !address.includes(country)) parts.push(country);
    
    return parts.join(', ');
  }
}
