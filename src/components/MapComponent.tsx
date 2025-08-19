import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@/types/property';

// Fix pour les icônes Leaflet avec Vite
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onPropertyClick?: (property: Property) => void;
  selectedProperty?: Property;
}

// Composant pour ajuster la vue de la carte
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({
  properties,
  center = [6.3703, 2.3912], // Coordonnées du Bénin
  zoom = 8,
  height = '400px',
  onPropertyClick,
  selectedProperty
}) => {
  const mapRef = useRef<L.Map>(null);

  // Créer des icônes personnalisées
  const defaultIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const selectedIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Filtrer les propriétés avec coordonnées
  const propertiesWithCoords = properties.filter(
    property => property.location.coordinates?.lat && property.location.coordinates?.lng
  );

  // Calculer le centre automatiquement si plusieurs propriétés
  const calculateCenter = (): [number, number] => {
    if (propertiesWithCoords.length === 0) return center;
    
    const avgLat = propertiesWithCoords.reduce((sum, prop) => 
      sum + (prop.location.coordinates?.lat || 0), 0) / propertiesWithCoords.length;
    const avgLng = propertiesWithCoords.reduce((sum, prop) => 
      sum + (prop.location.coordinates?.lng || 0), 0) / propertiesWithCoords.length;
    
    return [avgLat, avgLng];
  };

  const mapCenter = propertiesWithCoords.length > 0 ? calculateCenter() : center;

  const formatPrice = (amount: number, currency: string, period: string) => {
    return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}/${period === 'night' ? 'nuit' : period}`;
  };

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={mapCenter} zoom={zoom} />
        
        {propertiesWithCoords.map((property) => {
          const isSelected = selectedProperty?.id === property.id;
          const coords = property.location.coordinates!;
          
          return (
            <Marker
              key={property.id}
              position={[coords.lat, coords.lng]}
              icon={isSelected ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: () => onPropertyClick?.(property)
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  {property.images.length > 0 && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <h3 className="font-semibold text-sm mb-1">{property.title}</h3>
                  <p className="text-xs text-gray-600 mb-1">
                    {property.location.city}, {property.location.district}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {property.specifications.bedrooms} ch • {property.specifications.bathrooms} sdb • {property.specifications.area}m²
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-blue-600">
                      {formatPrice(property.price.amount, property.price.currency, property.price.period)}
                    </span>
                    {property.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-xs">{property.rating.average.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  {onPropertyClick && (
                    <button
                      onClick={() => onPropertyClick(property)}
                      className="w-full mt-2 bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition-colors"
                    >
                      Voir les détails
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
