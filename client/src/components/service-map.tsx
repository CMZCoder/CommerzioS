import { MapPin, Navigation } from 'lucide-react';
import type { ServiceWithDetails } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

// Calculate distance using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface ServiceMapProps {
  service: ServiceWithDetails;
  userLocation: { lat: number; lng: number } | null;
}

interface GoogleMapsWindow extends Window {
  google?: any;
}

export function ServiceMap({ service, userLocation }: ServiceMapProps) {
  const [mapHeight, setMapHeight] = useState(400);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // Fetch Google Maps API key
  const { data: mapsConfig } = useQuery({
    queryKey: ['/api/maps/config'],
    queryFn: () => apiRequest<{ apiKey: string }>('/api/maps/config'),
  });

  const apiKey = mapsConfig?.apiKey;

  useEffect(() => {
    const updateHeight = () => {
      setMapHeight(window.innerWidth < 768 ? 300 : 400);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || isInitializedRef.current || !apiKey) return;
    if (!service.owner.locationLat || !service.owner.locationLng) return;

    const serviceLat = parseFloat(service.owner.locationLat);
    const serviceLng = parseFloat(service.owner.locationLng);

    const win = window as GoogleMapsWindow;

    function initializeMap() {
      const google = (window as GoogleMapsWindow).google;
      if (!google || !mapContainerRef.current) return;

      const map = new google.maps.Map(mapContainerRef.current as any, {
        zoom: 13,
        center: { lat: serviceLat, lng: serviceLng },
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      mapRef.current = map;
      isInitializedRef.current = true;

      // Service location marker (red)
      const serviceMarker = new google.maps.Marker({
        map: map,
        position: { lat: serviceLat, lng: serviceLng },
        title: service.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#ef4444",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });

      const serviceInfoWindow = new google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${service.title}</p>
          <p style="color: #64748b; font-size: 14px;">${service.locations[0] || 'Service location'}</p>
        </div>`,
      });

      serviceMarker.addListener("click", () => {
        serviceInfoWindow.open(map, serviceMarker);
      });

      // User location marker (green)
      if (userLocation) {
        const userMarker = new google.maps.Marker({
          map: map,
          position: { lat: userLocation.lat, lng: userLocation.lng },
          title: "Your location",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#22c55e",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        });

        const userInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-weight: 600;">
            Your location
          </div>`,
        });

        userMarker.addListener("click", () => {
          userInfoWindow.open(map, userMarker);
        });

        // Distance line (polyline)
        new google.maps.Polyline({
          path: [
            { lat: userLocation.lat, lng: userLocation.lng },
            { lat: serviceLat, lng: serviceLng }
          ],
          geodesic: true,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map: map,
        });

        // Fit bounds to show both markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend({ lat: serviceLat, lng: serviceLng });
        bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
        map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }

    // Load Google Maps script if not already loaded
    if (!win.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [apiKey, service, userLocation]);

  if (!service.owner.locationLat || !service.owner.locationLng) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500">Location not specified</p>
        {service.locations && service.locations.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Serving: {service.locations.join(', ')}
          </p>
        )}
      </div>
    );
  }

  const serviceLat = parseFloat(service.owner.locationLat);
  const serviceLng = parseFloat(service.owner.locationLng);

  return (
    <>
      <div 
        className="rounded-lg overflow-hidden border border-border mb-4" 
        style={{ height: `${mapHeight}px` }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          data-testid="service-map"
        />
      </div>
      
      {/* Location info */}
      <div className="space-y-2">
        {service.locations && service.locations.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Service Location{service.locations.length > 1 ? 's' : ''}</p>
              <p className="text-muted-foreground">{service.locations.join(', ')}</p>
            </div>
          </div>
        )}
        
        {userLocation && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
            <Navigation className="w-4 h-4" />
            <span className="font-medium">
              {calculateDistance(
                userLocation.lat,
                userLocation.lng,
                serviceLat,
                serviceLng
              ).toFixed(1)} km from your location
            </span>
          </div>
        )}
      </div>
    </>
  );
}
