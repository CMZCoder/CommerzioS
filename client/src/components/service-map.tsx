import { MapPin, Navigation, ExternalLink, Map, Route } from 'lucide-react';
import type { ServiceWithDetails } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { geocodeLocation } from '@/lib/geocoding';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const directionsRendererRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const [geocodedLocation, setGeocodedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsResult, setDirectionsResult] = useState<any>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  // Fetch Google Maps API key
  const { data: mapsConfig } = useQuery({
    queryKey: ['/api/maps/config'],
    queryFn: () => apiRequest<{ apiKey: string }>('/api/maps/config'),
  });

  const apiKey = mapsConfig?.apiKey;

  // Geocode location if coordinates are missing but location name exists
  useEffect(() => {
    if (!service.locationLat || !service.locationLng) {
      if (service.locations && service.locations.length > 0 && !geocodedLocation && !isGeocoding) {
        setIsGeocoding(true);
        geocodeLocation(service.locations[0])
          .then((result) => {
            setGeocodedLocation({ lat: result.lat, lng: result.lng });
          })
          .catch((error) => {
            console.error('Failed to geocode service location:', error);
          })
          .finally(() => {
            setIsGeocoding(false);
          });
      }
    }
  }, [service.locationLat, service.locationLng, service.locations, geocodedLocation, isGeocoding]);

  // Determine service coordinates (from service or geocoded) - must be declared before useEffects
  const serviceLat = service.locationLat ? parseFloat(service.locationLat) : (geocodedLocation?.lat ?? null);
  const serviceLng = service.locationLng ? parseFloat(service.locationLng) : (geocodedLocation?.lng ?? null);

  useEffect(() => {
    const updateHeight = () => {
      setMapHeight(window.innerWidth < 768 ? 300 : 400);
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !apiKey) return;
    
    if (!serviceLat || !serviceLng) return;
    
    // Reset initialization flag if coordinates changed (e.g., after geocoding)
    if (isInitializedRef.current && geocodedLocation) {
      isInitializedRef.current = false;
    }
    
    if (isInitializedRef.current) return;

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

      // Initialize DirectionsService and DirectionsRenderer
      directionsServiceRef.current = new google.maps.DirectionsService();
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
      });

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

      // User location marker (green) - only show if not in directions mode
      if (userLocation && !showDirections) {
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

        // Distance line (polyline) - only show if not in directions mode
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

    // Load Google Maps script if not already loaded (with Directions library)
    if (!win.google) {
      const script = document.createElement('script');
      // Don't include libraries in URL - load them dynamically using importLibrary
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      script.async = true;
      script.defer = true;
      
      // Set timeout to detect if script fails to load (e.g., blocked by ad blocker)
      const timeoutId = setTimeout(() => {
        if (!win.google) {
          setMapLoadError('Map failed to load. This may be due to an ad blocker or privacy extension. Please disable it for this site or use the "Get Directions" button to open Google Maps directly.');
        }
      }, 10000); // 10 second timeout
      
      script.onload = async () => {
        clearTimeout(timeoutId);
        // Load routes library dynamically using the newer importLibrary method
        // Note: The "directions" library has been replaced with "routes" in newer API versions
        try {
          await win.google.maps.importLibrary("routes");
          initializeMap();
        } catch (error) {
          console.error('Failed to load routes library:', error);
          setMapLoadError('Failed to load routes library. The map will still work, but directions may not be available.');
          // Initialize map anyway - directions will fail gracefully
          initializeMap();
        }
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        setMapLoadError('Failed to load Google Maps. This may be due to an ad blocker or network issue. Please disable your ad blocker for this site or use the "Get Directions" button to open Google Maps directly.');
      };
      
      document.head.appendChild(script);
    } else {
      // Google Maps is already loaded
      // Check if routes library is available (DirectionsService should be available from routes library)
      if (win.google.maps.DirectionsService && win.google.maps.DirectionsRenderer) {
        initializeMap();
      } else {
        // Load routes library dynamically
        // Note: The "directions" library has been replaced with "routes" in newer API versions
        win.google.maps.importLibrary("routes")
          .then(() => {
            initializeMap();
          })
          .catch((error: any) => {
            console.error('Failed to load routes library:', error);
            setMapLoadError('Failed to load routes library. The map will still work, but directions may not be available.');
            // Initialize map anyway - directions will fail gracefully
            initializeMap();
          });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [apiKey, service, userLocation, geocodedLocation, showDirections]);

  // Calculate and display directions when showDirections is true
  useEffect(() => {
    if (!showDirections || !directionsServiceRef.current || !directionsRendererRef.current) return;
    if (!userLocation || !serviceLat || !serviceLng) return;

    const google = (window as GoogleMapsWindow).google;
    if (!google) return;

    setIsCalculatingRoute(true);

    const request = {
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { lat: serviceLat, lng: serviceLng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      setIsCalculatingRoute(false);
      
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result);
        setDirectionsResult(result);
        
        // Fit map to show entire route
        const bounds = new google.maps.LatLngBounds();
        result.routes[0].legs[0].steps.forEach((step: any) => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
        mapRef.current?.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      } else {
        console.error('Directions request failed:', status);
        setDirectionsResult(null);
      }
    });
  }, [showDirections, userLocation, serviceLat, serviceLng]);

  // Clear directions when toggling off
  useEffect(() => {
    if (!showDirections && directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({ routes: [] });
      setDirectionsResult(null);
      // Re-initialize map to show markers again
      if (mapRef.current && serviceLat && serviceLng) {
        mapRef.current.setCenter({ lat: serviceLat, lng: serviceLng });
        mapRef.current.setZoom(13);
      }
    }
  }, [showDirections, serviceLat, serviceLng]);

  // Show loading state while geocoding
  if ((!service.locationLat || !service.locationLng) && isGeocoding) {
    return (
      <div className="text-center py-8 bg-muted rounded-lg border border-dashed border-border">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
        <p className="text-muted-foreground">Loading map...</p>
        {service.locations && service.locations.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Geocoding: {service.locations[0]}
          </p>
        )}
      </div>
    );
  }

  // Show error state if no coordinates available after geocoding attempt
  if (!serviceLat || !serviceLng) {
    return (
      <div className="text-center py-8 bg-muted rounded-lg border border-dashed border-border">
        <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Location not specified</p>
        {service.locations && service.locations.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            Serving: {service.locations.join(', ')}
          </p>
        )}
      </div>
    );
  }

  // Show error state if map failed to load (e.g., blocked by ad blocker)
  if (mapLoadError) {
    return (
      <div className="text-center py-8 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
        <MapPin className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">Map unavailable</p>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 px-4">
          {mapLoadError}
        </p>
        {service.locations && service.locations.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">Service Location:</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{service.locations.join(', ')}</p>
          </div>
        )}
        <Button
          onClick={() => {
            let directionsUrl = `https://www.google.com/maps/dir/?api=1`;
            if (userLocation) {
              directionsUrl += `&origin=${userLocation.lat},${userLocation.lng}`;
            }
            // Prioritize exact coordinates over text addresses
            if (serviceLat && serviceLng) {
              directionsUrl += `&destination=${serviceLat},${serviceLng}`;
            } else if (service.locations && service.locations.length > 0) {
              const destinationQuery = encodeURIComponent(service.locations[0]);
              directionsUrl += `&destination=${destinationQuery}`;
            }
            window.open(directionsUrl, '_blank', 'noopener,noreferrer');
          }}
          variant="default"
          className="gap-2"
        >
          <Navigation className="w-4 h-4" />
          Open in Google Maps
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-lg overflow-hidden border border-border mb-4 relative" 
        style={{ height: `${mapHeight}px` }}
      >
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          data-testid="service-map"
        />
        
        {/* Loading overlay for route calculation */}
        {isCalculatingRoute && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10">
            <div className="bg-card rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm font-medium">Calculating route...</span>
            </div>
          </div>
        )}
      </div>

      {/* Directions Panel */}
      {showDirections && directionsResult && (
        <div className="mb-4 bg-card rounded-lg border border-border p-4 max-h-64 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Route className="w-4 h-4" />
              Turn-by-turn Directions
            </h4>
            {directionsResult.routes[0]?.legs[0] && (
              <span className="text-xs text-muted-foreground">
                {directionsResult.routes[0].legs[0].distance?.text} • {directionsResult.routes[0].legs[0].duration?.text}
              </span>
            )}
          </div>
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {directionsResult.routes[0]?.legs[0]?.steps.map((step: any, index: number) => (
                <div key={index} className="flex gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.distance?.text} • {step.duration?.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
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
        
        {userLocation && !showDirections && (
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

        {/* Action Buttons */}
        <div className="flex gap-2">
          {userLocation ? (
            <>
              <Button
                onClick={() => setShowDirections(!showDirections)}
                className="flex-1 gap-2"
                variant={showDirections ? "default" : "outline"}
                disabled={isCalculatingRoute}
              >
                {showDirections ? (
                  <>
                    <Map className="w-4 h-4" />
                    Show Map
                  </>
                ) : (
                  <>
                    <Route className="w-4 h-4" />
                    Get Directions
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  let directionsUrl = `https://www.google.com/maps/dir/?api=1`;
                  directionsUrl += `&origin=${userLocation.lat},${userLocation.lng}`;
                  
                  // Prioritize exact coordinates over text addresses
                  if (serviceLat && serviceLng) {
                    directionsUrl += `&destination=${serviceLat},${serviceLng}`;
                  } else if (service.locations && service.locations.length > 0) {
                    const destinationQuery = encodeURIComponent(service.locations[0]);
                    directionsUrl += `&destination=${destinationQuery}`;
                  } else {
                    const destinationQuery = encodeURIComponent(service.title);
                    directionsUrl += `&destination=${destinationQuery}`;
                  }
                  
                  window.open(directionsUrl, '_blank', 'noopener,noreferrer');
                }}
                variant="outline"
                className="gap-2"
                title="Open in Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                let directionsUrl = `https://www.google.com/maps/dir/?api=1`;
                
                // Prioritize exact coordinates over text addresses
                if (serviceLat && serviceLng) {
                  directionsUrl += `&destination=${serviceLat},${serviceLng}`;
                } else if (service.locations && service.locations.length > 0) {
                  const destinationQuery = encodeURIComponent(service.locations[0]);
                  directionsUrl += `&destination=${destinationQuery}`;
                } else {
                  const destinationQuery = encodeURIComponent(service.title);
                  directionsUrl += `&destination=${destinationQuery}`;
                }
                
                window.open(directionsUrl, '_blank', 'noopener,noreferrer');
              }}
              className="w-full gap-2"
              variant="default"
            >
              <Navigation className="w-4 h-4" />
              Get Directions
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
