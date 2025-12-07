import { Button } from "@/components/ui/button";
import { Map, ZoomIn, ZoomOut, X } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceWithDetails } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface ServiceMapToggleProps {
  services: (ServiceWithDetails & { distance?: number })[];
  userLocation: { lat: number; lng: number; name: string } | null;
  maxServices?: number;
  defaultExpanded?: boolean;
}

interface GoogleMapsWindow extends Window {
  google?: any;
}

export function ServiceMapToggle({
  services,
  userLocation,
  maxServices = 5,
  defaultExpanded = false,
}: ServiceMapToggleProps) {
  // All hooks must be called unconditionally at the top
  const [isMapVisible, setIsMapVisible] = useState(defaultExpanded);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const isInitializedRef = useRef(false);
  const hasFitBoundsRef = useRef(false);

  // Fetch Google Maps API key
  const { data: mapsConfig } = useQuery({
    queryKey: ['/api/maps/config'],
    queryFn: () => apiRequest<{ apiKey: string }>('/api/maps/config'),
  });

  const apiKey = mapsConfig?.apiKey;

  // Memoize closest services to prevent unnecessary re-renders
  const closestServices = useMemo(() => {
    return services
      .filter(s => {
        // Service has its own location OR owner has location
        return (s.locationLat && s.locationLng) || (s.owner?.locationLat && s.owner?.locationLng);
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, maxServices);
  }, [services, maxServices]);

  // Update markers when services change
  const updateMarkers = useCallback((shouldFitBounds = false) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google || !mapRef.current || !userLocation) return;

    // Clear existing markers
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];

    // Add user location marker
    const userMarker = new google.maps.Marker({
      map: mapRef.current,
      position: { lat: userLocation.lat, lng: userLocation.lng },
      title: userLocation.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#fff",
        strokeWeight: 2,
      },
    });

    const userInfoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-weight: bold;">${userLocation.name}<br/><small>Your location</small></div>`,
    });

    userMarker.addListener("click", () => {
      userInfoWindow.open(mapRef.current, userMarker);
    });

    markersRef.current.push(userMarker);

    // Add service markers with spreading for overlaps
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });

    const positionCounts: Record<string, number> = {};

    closestServices.forEach((service, index) => {
      // Priority: service.locationLat/Lng first, then fall back to owner's location
      let serviceLat: number | null = null;
      let serviceLng: number | null = null;
      
      if (service.locationLat && service.locationLng) {
        serviceLat = parseFloat(service.locationLat as any);
        serviceLng = parseFloat(service.locationLng as any);
      } else if (service.owner?.locationLat && service.owner?.locationLng) {
        serviceLat = parseFloat(service.owner.locationLat as any);
        serviceLng = parseFloat(service.owner.locationLng as any);
      }
      
      if (!serviceLat || !serviceLng || isNaN(serviceLat) || isNaN(serviceLng)) return;

      // Check for overlapping coordinates and spread markers
      const posKey = `${serviceLat},${serviceLng}`;
      const count = positionCounts[posKey] || 0;
      positionCounts[posKey] = count + 1;

      if (count > 0) {
        const angle = (count * 60) * (Math.PI / 180);
        const offsetDistance = 0.002;
        serviceLat += offsetDistance * Math.cos(angle);
        serviceLng += offsetDistance * Math.sin(angle);
      }

      const serviceMarker = new google.maps.Marker({
        map: mapRef.current,
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
        label: {
          text: String(index + 1),
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
        },
      });

      // Generate pricing display based on priceType
      let priceDisplay = '';
      if (service.priceType === 'fixed') {
        priceDisplay = `<span style="color: #3b82f6; font-weight: 600;">CHF ${service.price}</span>`;
      } else if (service.priceType === 'text') {
        priceDisplay = `<a href="/service/${service.id}" style="color: #3b82f6; font-weight: 600; text-decoration: underline;">Visit Listing</a>`;
      } else if (service.priceType === 'list') {
        const firstPrice = (service.priceList as any)?.[0]?.price;
        priceDisplay = `<span style="color: #3b82f6; font-weight: 600;">From CHF ${firstPrice || 'N/A'}</span>`;
      }

      const serviceInfoWindow = new google.maps.InfoWindow({
        content: `<div style="min-width: 200px; padding: 8px;">
          <strong>${service.title}</strong><br/>
          ${priceDisplay}
          ${service.distance ? `<br/><small style="color: #64748b;">${service.distance.toFixed(1)} km away</small>` : ''}
        </div>`,
      });

      serviceMarker.addListener("click", () => {
        serviceInfoWindow.open(mapRef.current, serviceMarker);
      });

      markersRef.current.push(serviceMarker);
      bounds.extend({ lat: serviceLat, lng: serviceLng });
    });

    // Only fit bounds on initial load or when explicitly requested
    if (shouldFitBounds && closestServices.length > 0) {
      mapRef.current?.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      hasFitBoundsRef.current = true;
    }
  }, [userLocation, closestServices]);

  // Initialize map only once when it becomes visible
  useEffect(() => {
    if (!isMapVisible || !mapContainerRef.current || isInitializedRef.current || !apiKey) return;

    const win = window as GoogleMapsWindow;

    function initializeMap() {
      const google = (window as GoogleMapsWindow).google;
      if (!google || !mapContainerRef.current || !userLocation) return;

      const map = new google.maps.Map(mapContainerRef.current as any, {
        zoom: 12,
        center: { lat: userLocation.lat, lng: userLocation.lng },
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });

      mapRef.current = map;
      isInitializedRef.current = true;
      hasFitBoundsRef.current = false;
      // Fit bounds on initial load
      updateMarkers(true);
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
  }, [isMapVisible, userLocation, apiKey, updateMarkers]);

  // Update markers when services change (but not bounds)
  useEffect(() => {
    if (isMapVisible && isInitializedRef.current) {
      updateMarkers(false);
    }
  }, [isMapVisible, updateMarkers]);

  // Cleanup when map is hidden
  useEffect(() => {
    if (!isMapVisible) {
      markersRef.current.forEach((marker: any) => marker?.setMap?.(null));
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current = null;
      }
      isInitializedRef.current = false;
      hasFitBoundsRef.current = false;
    }
  }, [isMapVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker: any) => marker?.setMap?.(null));
      markersRef.current = [];
      mapRef.current = null;
    };
  }, []);

  // Early return if no userLocation - after all hooks
  if (!userLocation) return null;

  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom();
      mapRef.current.setZoom(currentZoom - 1);
    }
  };

  // Show helpful message if no services with locations
  if (closestServices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4" data-testid="text-no-services-map">
        No services with locations available to display on the map.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="gap-2"
          data-testid="button-toggle-map"
        >
          {isMapVisible ? (
            <>
              <X className="w-4 h-4" />
              Collapse Map
            </>
          ) : (
            <>
              <Map className="w-4 h-4" />
              Show Map ({closestServices.length} locations)
            </>
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isMapVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg border border-border"
          >
            <div className="relative w-full h-full">
              <div
                ref={mapContainerRef}
                className="w-full h-full"
                data-testid="service-map"
              />
              
              {/* Custom zoom controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomIn}
                  className="bg-card hover:bg-accent shadow-lg"
                  data-testid="button-zoom-in"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleZoomOut}
                  className="bg-card hover:bg-accent shadow-lg"
                  data-testid="button-zoom-out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
