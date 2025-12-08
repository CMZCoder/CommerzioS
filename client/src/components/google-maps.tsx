import { useEffect, useRef, useCallback } from "react";
import type { ServiceWithDetails } from "@/lib/api";
import { geocodeLocation } from "@/lib/geocoding";

interface GoogleMapsProps {
  services: (ServiceWithDetails & { distance?: number })[];
  userLocation: { lat: number; lng: number; name: string } | null;
  maxServices?: number;
  apiKey?: string;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

interface GoogleMapsWindow extends Window {
  google?: any;
}

interface FuzzyPoint {
  service: ServiceWithDetails & { distance?: number };
  lat: number;
  lng: number;
}

export function GoogleMaps({
  services,
  userLocation,
  apiKey,
  isExpanded,
}: GoogleMapsProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const fuzzyPointsRef = useRef<FuzzyPoint[]>([]);
  const servicesRef = useRef(services);
  const userLocationRef = useRef(userLocation);

  servicesRef.current = services;
  userLocationRef.current = userLocation;

  const getFuzzyLocation = useCallback((lat: number, lng: number, id: string): { lat: number; lng: number } => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash) / 2147483647;
    const offsetLat = (seed - 0.5) * 0.006;
    const offsetLng = ((seed * 1.618) % 1 - 0.5) * 0.006;
    return { lat: lat + offsetLat, lng: lng + offsetLng };
  }, []);

  const getGridSize = useCallback((zoom: number): number => {
    if (zoom >= 16) return 0.001;
    if (zoom >= 14) return 0.003;
    if (zoom >= 12) return 0.008;
    if (zoom >= 10) return 0.02;
    return 0.05;
  }, []);

  const renderClusters = useCallback(() => {
    const google = (window as GoogleMapsWindow).google;
    const map = mapRef.current;
    if (!google || !map) return;

    markersRef.current.forEach(m => {
      try { m.setMap(null); } catch { }
    });
    markersRef.current = [];

    if (infoWindowRef.current) {
      try { infoWindowRef.current.close(); } catch { }
    }

    const location = userLocationRef.current;
    if (location) {
      const userMarker = new google.maps.Marker({
        map,
        position: { lat: location.lat, lng: location.lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 3,
        },
        zIndex: 9999,
        title: "Your Location",
      });
      markersRef.current.push(userMarker);

      const userInfo = new google.maps.InfoWindow({
        content: `<div style="padding:8px;font-weight:600;">${location.name}<br/><small style="color:#666;">Your search location</small></div>`,
      });
      userMarker.addListener("click", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
        userInfo.open(map, userMarker);
        infoWindowRef.current = userInfo;
      });
    }

    const zoom = map.getZoom() || 12;
    const gridSize = getGridSize(zoom);
    const clusters: Record<string, FuzzyPoint[]> = {};

    fuzzyPointsRef.current.forEach((p) => {
      const gridLat = Math.round(p.lat / gridSize) * gridSize;
      const gridLng = Math.round(p.lng / gridSize) * gridSize;
      const key = `${gridLat.toFixed(4)},${gridLng.toFixed(4)}`;
      if (!clusters[key]) clusters[key] = [];
      clusters[key].push(p);
    });

    Object.values(clusters).forEach((items) => {
      const count = items.length;
      const centerLat = items.reduce((acc, i) => acc + i.lat, 0) / count;
      const centerLng = items.reduce((acc, i) => acc + i.lng, 0) / count;

      const isSingle = count === 1;
      const scale = isSingle ? 10 : Math.min(12 + Math.log2(count) * 2, 24);

      const markerOptions: any = {
        map,
        position: { lat: centerLat, lng: centerLng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale,
          fillColor: "#ef4444",
          fillOpacity: 0.9,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
        zIndex: isSingle ? 100 : 500 + count,
      };

      if (!isSingle) {
        markerOptions.label = {
          text: String(count),
          color: "#fff",
          fontSize: scale > 16 ? "12px" : "10px",
          fontWeight: "bold",
        };
      }

      const marker = new google.maps.Marker(markerOptions);

      marker.addListener("click", () => {
        if (isSingle) {
          const s = items[0].service;
          const imgHtml = s.images?.[0]
            ? `<img src="${s.images[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:6px;margin-bottom:8px;"/>`
            : "";
          const priceHtml =
            s.priceType === "fixed"
              ? `<div style="color:#3b82f6;font-weight:600;">CHF ${s.price}</div>`
              : s.priceType === "list"
                ? `<div style="color:#3b82f6;font-weight:600;">From CHF ${(s.priceList as any)?.[0]?.price || "N/A"}</div>`
                : `<div style="color:#666;">Contact for pricing</div>`;

          const content = `
            <div style="width:220px;padding:4px;">
              ${imgHtml}
              <strong style="display:block;margin-bottom:4px;font-size:14px;">${s.title}</strong>
              ${priceHtml}
              <div style="color:#888;font-size:11px;margin:6px 0;">Approximate Location</div>
              <a href="/service/${s.id}" style="display:block;background:#0f172a;color:#fff;text-align:center;padding:8px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:500;">View Details</a>
            </div>
          `;

          if (infoWindowRef.current) infoWindowRef.current.close();
          const infoWindow = new google.maps.InfoWindow({ content });
          infoWindow.open(map, marker);
          infoWindowRef.current = infoWindow;
        } else {
          const newZoom = Math.min(map.getZoom() + 2, 18);
          map.panTo({ lat: centerLat, lng: centerLng });
          map.setZoom(newZoom);
        }
      });

      markersRef.current.push(marker);
    });
  }, [getGridSize]);

  const processServices = useCallback(async () => {
    const currentServices = servicesRef.current;

    const geocodePromises = currentServices.map(async (s): Promise<FuzzyPoint | null> => {
      let lat = s.locationLat ? parseFloat(s.locationLat as string) : null;
      let lng = s.locationLng ? parseFloat(s.locationLng as string) : null;

      if ((!lat || !lng || isNaN(lat) || isNaN(lng)) && s.locations?.length) {
        try {
          const res = await geocodeLocation(s.locations[0]);
          lat = res.lat;
          lng = res.lng;
        } catch {
          return null;
        }
      }

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        lat = s.owner?.locationLat ? parseFloat(s.owner.locationLat as string) : null;
        lng = s.owner?.locationLng ? parseFloat(s.owner.locationLng as string) : null;
      }

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const fuzzy = getFuzzyLocation(lat, lng, s.id);
        return { service: s, lat: fuzzy.lat, lng: fuzzy.lng };
      }
      return null;
    });

    fuzzyPointsRef.current = (await Promise.all(geocodePromises)).filter((p): p is FuzzyPoint => p !== null);

    const google = (window as GoogleMapsWindow).google;
    const map = mapRef.current;
    const location = userLocationRef.current;

    if (google && map && location && fuzzyPointsRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: location.lat, lng: location.lng });
      fuzzyPointsRef.current.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }

    renderClusters();
  }, [getFuzzyLocation, renderClusters]);

  useEffect(() => {
    if (!isExpanded || !apiKey || isInitializedRef.current) return;

    const initMap = async () => {
      const google = (window as GoogleMapsWindow).google;
      if (!google) return;

      const { Map } = (await google.maps.importLibrary("maps")) as any;

      mapRef.current = new Map(mapContainerRef.current, {
        center: { lat: userLocation?.lat || 46.8182, lng: userLocation?.lng || 8.2275 },
        zoom: 10,
        mapId: "COMMERZIO_MAP",
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });

      mapRef.current.addListener("click", () => {
        if (infoWindowRef.current) infoWindowRef.current.close();
      });

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      mapRef.current.addListener("zoom_changed", () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          renderClusters();
        }, 150);
      });

      isInitializedRef.current = true;
      await processServices();
    };

    if (!(window as GoogleMapsWindow).google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, [isExpanded, apiKey, userLocation, processServices, renderClusters]);

  useEffect(() => {
    if (isInitializedRef.current) {
      processServices();
    }
  }, [services, processServices]);

  if (!userLocation || !isExpanded) return null;

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-border relative bg-muted">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
