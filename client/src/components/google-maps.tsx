import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Map, ZoomIn, ZoomOut, X, Navigation, ExternalLink, AlertTriangle } from "lucide-react";
import type { ServiceWithDetails } from "@/lib/api";
import { geocodeLocation } from '@/lib/geocoding';
import { useToast } from "@/hooks/use-toast";

interface GoogleMapsProps {
  services: (ServiceWithDetails & { distance?: number })[];
  userLocation: { lat: number; lng: number; name: string } | null;
  maxServices?: number;
  defaultExpanded?: boolean;
  apiKey?: string;
  /** Controlled expanded state - if provided, component becomes controlled */
  isExpanded?: boolean;
  /** Callback when expanded state changes - only called in controlled mode */
  onExpandedChange?: (expanded: boolean) => void;
}

interface GoogleMapsWindow extends Window {
  google?: any;
}

export function GoogleMaps({
  services,
  userLocation,
  maxServices = 5,
  defaultExpanded = false,
  apiKey,
  isExpanded: controlledExpanded,
  onExpandedChange,
}: GoogleMapsProps) {
  // All hooks must be called at the top, before any conditional returns
  const { toast } = useToast();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledExpanded !== undefined;
  const isMapVisible = isControlled ? controlledExpanded : internalExpanded;
  const setIsMapVisible = isControlled
    ? (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(isMapVisible) : value;
      onExpandedChange?.(newValue);
    }
    : setInternalExpanded;
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  const currentInfoWindowRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const activeDirectionsServiceIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  const hasFitBoundsRef = useRef(false);
  const isCalculatingDirectionsRef = useRef(false);
  // Store the coordinates used for each service marker to ensure directions use the same coordinates
  const serviceCoordinatesRef = useRef<Record<string, { lat: number; lng: number }>>({});

  // Memoize filtered services to prevent unnecessary recalculations
  const closestServices = useMemo(() =>
    services
      .filter(s => {
        // Service has its own location OR owner has location
        return (s.locationLat && s.locationLng) || (s.owner?.locationLat && s.owner?.locationLng);
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, maxServices),
    [services, maxServices]
  );

  // Initialize directions service and renderer
  const initializeDirections = useCallback(() => {
    const google = (window as GoogleMapsWindow).google;
    if (!google || !mapRef.current) return;

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: mapRef.current,
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: '#3b82f6',
          strokeOpacity: 0.7,
          strokeWeight: 4,
        },
      });
    }
  }, []);

  // Clear directions
  const clearDirections = useCallback(() => {
    if (directionsRendererRef.current) {
      // Remove the renderer from the map to fully clear it
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
      activeDirectionsServiceIdRef.current = null;
    }
  }, []);

  // Close all info windows
  const closeAllInfoWindows = useCallback(() => {
    infoWindowsRef.current.forEach((infoWindow: any) => {
      if (infoWindow) {
        infoWindow.close();
      }
    });
    currentInfoWindowRef.current = null;
  }, []);

  // Show directions for a specific service
  const showDirections = useCallback(async (service: ServiceWithDetails & { distance?: number }) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google || !mapRef.current || !userLocation) return;

    // Prevent race conditions - only one direction calculation at a time
    if (isCalculatingDirectionsRef.current) {
      console.log('Direction calculation already in progress, skipping...');
      return;
    }
    isCalculatingDirectionsRef.current = true;

    // FIRST: Check if we have stored coordinates from the marker (this ensures we use the SAME coordinates as the marker)
    let serviceLat: number | null = null;
    let serviceLng: number | null = null;

    const storedCoords = serviceCoordinatesRef.current[service.id];
    if (storedCoords) {
      serviceLat = storedCoords.lat;
      serviceLng = storedCoords.lng;
      console.log('=== USING STORED COORDINATES FROM MARKER ===', {
        serviceId: service.id,
        serviceTitle: service.title,
        storedCoords: { lat: serviceLat, lng: serviceLng },
      });
    } else {
      // Fallback: Parse coordinates - use service.locationLat/lng if they exist and are valid
      if (service.locationLat) {
        const parsed = parseFloat(service.locationLat as any);
        if (!isNaN(parsed)) {
          serviceLat = parsed;
        }
      }

      if (service.locationLng) {
        const parsed = parseFloat(service.locationLng as any);
        if (!isNaN(parsed)) {
          serviceLng = parsed;
        }
      }

      // If service doesn't have coordinates, try to geocode from locations array
      if ((!serviceLat || !serviceLng) && service.locations && service.locations.length > 0) {
        console.log('=== GEOCODING SERVICE LOCATION (FALLBACK) ===', {
          serviceId: service.id,
          serviceTitle: service.title,
          locationAddress: service.locations[0],
          allLocations: service.locations,
        });
        try {
          const geocoded = await geocodeLocation(service.locations[0]);
          serviceLat = geocoded.lat;
          serviceLng = geocoded.lng;
          console.log('=== GEOCODING RESULT ===', {
            serviceId: service.id,
            originalAddress: service.locations[0],
            geocodedCoords: { lat: serviceLat, lng: serviceLng },
            displayName: geocoded.displayName,
          });
        } catch (error) {
          console.error('Failed to geocode service location:', error);
        }
      }

      // Fallback to owner's location if service doesn't have its own and geocoding failed
      if (!serviceLat || !serviceLng) {
        if (service.owner?.locationLat) {
          const parsed = parseFloat(service.owner.locationLat as any);
          if (!isNaN(parsed)) {
            serviceLat = parsed;
          }
        }
        if (service.owner?.locationLng) {
          const parsed = parseFloat(service.owner.locationLng as any);
          if (!isNaN(parsed)) {
            serviceLng = parsed;
          }
        }
      }
    }

    if (!serviceLat || !serviceLng || isNaN(serviceLat) || isNaN(serviceLng)) {
      console.error('Service missing location:', service.id, service.title, {
        storedCoords: storedCoords,
        serviceLocation: { lat: service.locationLat, lng: service.locationLng },
        ownerLocation: { lat: service.owner?.locationLat, lng: service.owner?.locationLng },
        locationsArray: service.locations,
      });
      isCalculatingDirectionsRef.current = false;
      return;
    }

    console.log('=== SHOW DIRECTIONS CALLED ===', {
      serviceId: service.id,
      serviceTitle: service.title,
      serviceLat,
      serviceLng,
      previousActiveService: activeDirectionsServiceIdRef.current,
    });

    // Aggressively clear previous directions
    if (directionsRendererRef.current) {
      console.log('Clearing previous directions renderer');
      try {
        // Clear directions first
        directionsRendererRef.current.setDirections({ routes: [] });
        // Remove from map
        directionsRendererRef.current.setMap(null);
      } catch (e) {
        console.warn('Error clearing renderer:', e);
      }
      directionsRendererRef.current = null;
    }
    activeDirectionsServiceIdRef.current = null;

    // Initialize directions service if needed
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    // Create LatLng objects for precise point-to-point routing
    const originLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    const destinationLatLng = new google.maps.LatLng(serviceLat, serviceLng);

    console.log('Requesting directions:', {
      serviceId: service.id,
      serviceTitle: service.title,
      origin: { lat: userLocation.lat, lng: userLocation.lng },
      destination: { lat: serviceLat, lng: serviceLng },
      originLatLng: originLatLng.toString(),
      destinationLatLng: destinationLatLng.toString(),
    });

    const request = {
      origin: originLatLng,
      destination: destinationLatLng,
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: false,
    };

    // Request the route first, then create renderer after we get the result
    directionsServiceRef.current.route(request, (result: any, status: any) => {
      // Reset calculation flag regardless of result
      isCalculatingDirectionsRef.current = false;

      if (status === google.maps.DirectionsStatus.OK) {
        const endLocation = result.routes[0].legs[0].end_location;
        const endLat = typeof endLocation.lat === 'function' ? endLocation.lat() : endLocation.lat;
        const endLng = typeof endLocation.lng === 'function' ? endLocation.lng() : endLocation.lng;

        console.log('=== DIRECTIONS RECEIVED ===', {
          serviceId: service.id,
          serviceTitle: service.title,
          routeDistance: result.routes[0].legs[0].distance?.text,
          routeDuration: result.routes[0].legs[0].duration?.text,
          startAddress: result.routes[0].legs[0].start_address,
          endAddress: result.routes[0].legs[0].end_address,
          requestedDestination: { lat: serviceLat, lng: serviceLng },
          actualDestination: { lat: endLat, lng: endLng },
          destinationMatch: Math.abs(endLat - serviceLat) < 0.001 && Math.abs(endLng - serviceLng) < 0.001,
          serviceLocationAddress: service.locations?.[0],
          routeOverviewPolyline: result.routes[0].overview_polyline?.points?.substring(0, 50) + '...',
        });

        // Double-check: clear any existing renderer
        if (directionsRendererRef.current) {
          console.log('Removing existing renderer before creating new one');
          try {
            directionsRendererRef.current.setDirections({ routes: [] });
            directionsRendererRef.current.setMap(null);
          } catch (e) {
            console.warn('Error clearing renderer:', e);
          }
          directionsRendererRef.current = null;
        }

        // Generate a unique color based on service ID for debugging
        const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
        const colorIndex = parseInt(service.id.slice(-1)) % colors.length || 0;
        const routeColor = colors[colorIndex];

        // Create a completely fresh directions renderer for this route
        console.log('Creating new directions renderer for service:', service.id, 'with color:', routeColor);
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: true, // We'll use our custom markers
          polylineOptions: {
            strokeColor: routeColor, // Use unique color per service for debugging
            strokeOpacity: 0.8,
            strokeWeight: 5,
          },
        });

        // Set the directions on the new renderer
        directionsRendererRef.current.setDirections(result);
        activeDirectionsServiceIdRef.current = service.id;

        console.log('=== DIRECTIONS RENDERER SET ===', {
          serviceId: service.id,
          rendererAttached: directionsRendererRef.current.getMap() ? 'yes' : 'no',
          routeSteps: result.routes[0].legs[0].steps.length,
          routeColor: routeColor,
          firstStep: result.routes[0].legs[0].steps[0]?.instructions?.substring(0, 50),
          lastStep: result.routes[0].legs[0].steps[result.routes[0].legs[0].steps.length - 1]?.instructions?.substring(0, 50),
          overviewPolyline: result.routes[0].overview_polyline?.points?.substring(0, 100) + '...',
        });

        // Fit map to show entire route
        const bounds = new google.maps.LatLngBounds();
        result.routes[0].legs[0].steps.forEach((step: any) => {
          bounds.extend(step.start_location);
          bounds.extend(step.end_location);
        });
        mapRef.current?.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      } else {
        console.error('Directions request failed:', status, 'for service:', service.id, service.title);
        activeDirectionsServiceIdRef.current = null;
      }
    });
  }, [userLocation]);

  // Deterministic fuzzing based on ID
  const getFuzzyLocation = (lat: number, lng: number, id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) / 2147483647;
    // +/- ~200-300m jitter
    const jitterLat = (seed - 0.5) * 0.005;
    const jitterLng = ((seed * 1.618) % 1 - 0.5) * 0.005;
    return { lat: lat + jitterLat, lng: lng + jitterLng };
  };

  // Update markers when services change
  const updateMarkers = useCallback(async (shouldFitBounds = false) => {
    const google = (window as GoogleMapsWindow).google;
    if (!google || !mapRef.current || !userLocation) return;

    // Clear existing markers and info windows
    markersRef.current.forEach((marker: any) => marker.setMap(null));
    markersRef.current = [];
    infoWindowsRef.current = [];
    currentInfoWindowRef.current = null;

    // Initialize directions if not already done
    initializeDirections();

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
      zIndex: 1000,
    });

    const userInfoWindow = new google.maps.InfoWindow({
      content: `<div style="padding: 8px; font-weight: bold;">${userLocation.name}<br/><small>Your location</small></div>`,
    });

    userMarker.addListener("click", () => {
      closeAllInfoWindows();
      userInfoWindow.open(mapRef.current, userMarker);
      currentInfoWindowRef.current = userInfoWindow;
    });

    markersRef.current.push(userMarker);

    // Geocode service locations in parallel
    const geocodePromises = closestServices.map(async (service) => {
      let serviceLat = service.locationLat ? parseFloat(service.locationLat as any) : null;
      let serviceLng = service.locationLng ? parseFloat(service.locationLng as any) : null;

      if ((!serviceLat || !serviceLng || isNaN(serviceLat) || isNaN(serviceLng)) && service.locations && service.locations.length > 0) {
        try {
          const geocoded = await geocodeLocation(service.locations[0]);
          serviceLat = geocoded.lat;
          serviceLng = geocoded.lng;
        } catch (error) {
          console.warn(`Failed to geocode service ${service.id}:`, error);
        }
      }

      if (!serviceLat || !serviceLng || isNaN(serviceLat) || isNaN(serviceLng)) {
        serviceLat = service.owner?.locationLat ? parseFloat(service.owner.locationLat as any) : null;
        serviceLng = service.owner?.locationLng ? parseFloat(service.owner.locationLng as any) : null;
      }

      if (serviceLat && serviceLng && !isNaN(serviceLat) && !isNaN(serviceLng)) {
        const fuzzy = getFuzzyLocation(serviceLat, serviceLng, service.id);
        serviceCoordinatesRef.current[service.id] = { lat: fuzzy.lat, lng: fuzzy.lng };
        return { service, lat: fuzzy.lat, lng: fuzzy.lng };
      }
      return null;
    });

    const processedServices = (await Promise.all(geocodePromises)).filter((s): s is NonNullable<typeof s> => s !== null);

    // Cluster services by proximity (rounding to ~500m-1km)
    const clusters: Record<string, typeof processedServices> = {};
    const clusterBounds = new google.maps.LatLngBounds();

    processedServices.forEach(item => {
      // Round to ~500-800m precision
      // 0.01 degrees is approx 1.1km
      // Rounding to 0.008 gives somewhat tighter clusters
      const precision = 0.008;
      const keyLat = Math.round(item.lat / precision) * precision;
      const keyLng = Math.round(item.lng / precision) * precision;
      const key = `${keyLat.toFixed(3)},${keyLng.toFixed(3)}`;

      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(item);
      clusterBounds.extend({ lat: item.lat, lng: item.lng });
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });

    // Render Clusters
    Object.entries(clusters).forEach(([key, items]) => {
      const count = items.length;
      // Calculate center of cluster
      const centerLat = items.reduce((sum, item) => sum + item.lat, 0) / count;
      const centerLng = items.reduce((sum, item) => sum + item.lng, 0) / count;

      // Sort services by date (oldest first as per requirements, or newest?) 
      // Requirement: "list items sorted by createdAt (oldest first)"
      const sortedItems = items.sort((a, b) =>
        new Date(a.service.createdAt).getTime() - new Date(b.service.createdAt).getTime()
      );

      const clusterMarker = new google.maps.Marker({
        map: mapRef.current,
        position: { lat: centerLat, lng: centerLng },
        title: count > 1 ? `${count} Services` : items[0].service.title,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: count > 1 ? 12 : 8,
          fillColor: count > 1 ? "#ef4444" : "#f97316", // Red for cluster, Orange for single
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
          label: count > 1 ? {
            text: count.toString(),
            color: "#fff",
            fontSize: "10px",
            fontWeight: "bold",
          } : undefined,
        },
      });

      // Generate Content
      let contentHtml = '';

      if (count === 1) {
        // SINGLE SERVICE CARD
        const s = sortedItems[0].service;
        const serviceImage = s.images && s.images.length > 0 ? s.images[0] : null;
        const imageHtml = serviceImage
          ? `<img src="${serviceImage}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />`
          : '';

        let priceDisplay = '';
        if (s.priceType === 'fixed') priceDisplay = `CHF ${s.price}`;
        else if (s.priceType === 'list') priceDisplay = `From CHF ${(s.priceList as any)?.[0]?.price || 'N/A'}`;
        else priceDisplay = 'Price on Request';

        contentHtml = `
          <div style="min-width: 200px; max-width: 250px;">
            ${imageHtml}
            <div style="padding: 4px;">
              <strong style="display: block; font-size: 1rem; margin-bottom: 4px;">${s.title}</strong>
              <div style="color: #3b82f6; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px;">${priceDisplay}</div>
              <a href="/service/${s.id}" style="
                display: block; width: 100%; text-align: center;
                background-color: #0f172a; color: white; padding: 6px; 
                border-radius: 4px; text-decoration: none; font-size: 0.85rem;"
              >
                View Details
              </a>
            </div>
          </div>
        `;
      } else {
        // MULTI SERVICE LIST
        const listItems = sortedItems.map(({ service: s }) => {
          let price = s.priceType === 'fixed' ? `CHF ${s.price}` : (s.priceType === 'list' ? 'From CHF ' + (s.priceList as any)?.[0]?.price : 'On Request');
          return `
            <div style="display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
              <div style="width: 40px; height: 40px; border-radius: 4px; background-color: #f1f5f9; flex-shrink: 0; overflow: hidden;">
                ${s.images?.[0] ? `<img src="${s.images[0]}" style="width: 100%; height: 100%; object-fit: cover;" />` : ''}
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.title}</div>
                <div style="color: #64748b; font-size: 0.75rem;">${price}</div>
              </div>
              <a href="/service/${s.id}" style="align-self: center; color: #3b82f6; text-decoration: none; font-size: 0.8rem; font-weight: 600;">View</a>
            </div>
          `;
        }).join('');

        contentHtml = `
          <div style="min-width: 250px; max-width: 280px;">
            <div style="font-weight: bold; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid #f1f5f9;">
              ${count} Services in this area
            </div>
            <div style="max-height: 250px; overflow-y: auto;">
              ${listItems}
            </div>
          </div>
        `;
      }

      const infoWindow = new google.maps.InfoWindow({
        content: contentHtml,
      });

      clusterMarker.addListener("click", () => {
        closeAllInfoWindows();
        infoWindow.open(mapRef.current, clusterMarker);
        currentInfoWindowRef.current = infoWindow;
      });

      infoWindowsRef.current.push(infoWindow);
      markersRef.current.push(clusterMarker);
      bounds.extend({ lat: centerLat, lng: centerLng });
    });

    // Only fit bounds on initial load or when explicitly requested
    if (shouldFitBounds && processedServices.length > 0) {
      mapRef.current?.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      hasFitBoundsRef.current = true;
    }
  }, [userLocation, closestServices, initializeDirections, clearDirections, closeAllInfoWindows]);

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

      // Add click listener to map to close info windows when clicking outside
      map.addListener("click", () => {
        closeAllInfoWindows();
      });

      mapRef.current = map;
      isInitializedRef.current = true;
      hasFitBoundsRef.current = false;
      // Fit bounds on initial load
      updateMarkers(true);
    }

    // Load Google Maps script if not already loaded (without libraries parameter - we'll load directions dynamically)
    if (!win.google) {
      const script = document.createElement("script");
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
        setMapLoadError(null); // Clear any previous errors
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
      setMapLoadError(null); // Clear any previous errors

      // Check if routes library is loaded (DirectionsService should be available from routes library)
      if (win.google.maps && win.google.maps.DirectionsService) {
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
  }, [isMapVisible, apiKey, closeAllInfoWindows, updateMarkers, userLocation]);

  // Update markers when services change (without refitting bounds)
  useEffect(() => {
    if (isMapVisible && isInitializedRef.current && hasFitBoundsRef.current) {
      updateMarkers(false);
    }
  }, [closestServices, isMapVisible, updateMarkers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((marker: any) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  // Early return after all hooks have been called
  if (!userLocation) return null;

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 12) - 1);
    }
  };

  if (closestServices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4" data-testid="text-no-services-map">
        No services with locations available to display on the map.
      </div>
    );
  }

  const handleToggleMap = () => {
    if (!apiKey) {
      toast({
        title: "Google Maps Not Configured",
        description: "Google Maps API key is not configured. Please contact the administrator.",
        variant: "destructive"
      });
      return;
    }
    setIsMapVisible(!isMapVisible);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleMap}
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
        {isMapVisible && apiKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 400, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-lg border border-border"
          >
            {mapLoadError ? (
              <div className="relative w-full h-full bg-muted flex items-center justify-center p-8" style={{ minHeight: "400px" }}>
                <div className="text-center max-w-md">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Map Could Not Be Loaded</h3>
                  <p className="text-sm text-muted-foreground mb-4">{mapLoadError}</p>
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Quick Fix:</strong> Disable your ad blocker or privacy extension for this site, then refresh the page.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You can still use the "Get Directions" buttons on service cards to open Google Maps directly.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <div
                  ref={mapContainerRef}
                  className="w-full h-full"
                  data-testid="service-map"
                  style={{ minHeight: "400px" }}
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
