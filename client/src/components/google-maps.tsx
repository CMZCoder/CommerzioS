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
        const currentZoom = map.getZoom() || 12;
        const isMaxZoom = currentZoom >= 16;
        const isDark = document.documentElement.classList.contains("dark");

        const bg = isDark ? "#1a2332" : "#ffffff";
        const text = isDark ? "#f8fafc" : "#1a2332";
        const muted = isDark ? "#94a3b8" : "#6b7280";
        const border = isDark ? "#334155" : "#e2e8f0";
        const accent = "#3b82f6";

        // Completely hide Google's InfoWindow styling
        const hideGoogleClose = `.gm-ui-hover-effect{display:none!important;}`;
        const infoWindowStyles = `
          .gm-style-iw{background:transparent!important;padding:0!important;box-shadow:none!important;overflow:visible!important;}
          .gm-style-iw-c{background:transparent!important;padding:0!important;box-shadow:none!important;max-width:none!important;max-height:none!important;overflow:visible!important;}
          .gm-style-iw-d{background:transparent!important;overflow:visible!important;max-width:none!important;max-height:none!important;}
          .gm-style-iw-t::after{display:none!important;}
          .gm-style-iw-tc{display:none!important;}
          ${hideGoogleClose}
        `;

        const closeBtnBg = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
        const closeBtnStyle = `position:absolute;top:12px;right:12px;width:32px;height:32px;border:none;background:${closeBtnBg};border-radius:50%;cursor:pointer;font-size:18px;color:${muted};line-height:32px;text-align:center;z-index:10;`;

        if (isSingle) {
          const s = items[0].service;
          const img = s.images?.[0] ? `<img src="${s.images[0]}" style="width:100%;height:180px;object-fit:cover;border-radius:10px;margin-bottom:16px;"/>` : "";
          const price = s.priceType === "fixed" ? `CHF ${s.price}` : s.priceType === "list" ? `From CHF ${(s.priceList as any)?.[0]?.price || "N/A"}` : "Contact for pricing";

          const content = `
            <style>${infoWindowStyles}</style>
            <div style="position:relative;width:380px;padding:20px;background:${bg};color:${text};font-family:system-ui,sans-serif;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
              <button style="${closeBtnStyle}" onclick="this.closest('.gm-style-iw').style.display='none';">✕</button>
              ${img}
              <h3 style="margin:0 0 10px 0;font-size:20px;font-weight:600;line-height:1.3;padding-right:40px;">${s.title}</h3>
              <p style="margin:0 0 10px 0;font-size:18px;font-weight:700;color:${accent};">${price}</p>
              <p style="margin:0 0 16px 0;font-size:12px;color:${muted};">📍 Approximate location shown</p>
              <a href="/service/${s.id}" style="display:block;background:${accent};color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:600;">View Details</a>
            </div>
          `;

          if (infoWindowRef.current) infoWindowRef.current.close();
          const infoWindow = new google.maps.InfoWindow({ content, maxWidth: 420 });
          infoWindow.open(map, marker);
          infoWindowRef.current = infoWindow;
        } else if (isMaxZoom) {
          const rows = items.slice(0, 15).map((i) => {
            const s = i.service;
            const img = s.images?.[0] || "";
            const price = s.priceType === "fixed" ? `CHF ${s.price}` : s.priceType === "list" ? `From CHF ${(s.priceList as any)?.[0]?.price || "N/A"}` : "Contact";

            return `
              <div style="display:flex;align-items:center;gap:16px;padding:14px 0;border-bottom:1px solid ${border};">
                ${img ? `<img src="${img}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;flex-shrink:0;"/>` : `<div style="width:80px;height:80px;background:${border};border-radius:8px;flex-shrink:0;"></div>`}
                <div style="flex:1;min-width:0;">
                  <div style="font-size:15px;font-weight:600;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</div>
                  <div style="font-size:14px;font-weight:600;color:${accent};margin-bottom:8px;">${price}</div>
                  <a href="/service/${s.id}" style="display:inline-block;background:${accent};color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">View Details</a>
                </div>
              </div>
            `;
          }).join("");

          const moreCount = items.length > 15 ? items.length - 15 : 0;
          const moreHtml = moreCount > 0 ? `<div style="text-align:center;padding:12px 0;font-size:12px;color:${muted};">+${moreCount} more services</div>` : "";

          const content = `
            <style>${infoWindowStyles}</style>
            <div id="cluster-popup" style="position:relative;width:420px;max-width:90vw;padding:20px;background:${bg};color:${text};font-family:system-ui,sans-serif;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,0.35);">
              <button style="${closeBtnStyle}" onclick="this.closest('.gm-style-iw').style.display='none';">✕</button>
              <h2 style="margin:0 0 12px 0;font-size:17px;font-weight:700;padding-bottom:10px;border-bottom:2px solid ${border};padding-right:40px;">${count} Services in this area</h2>
              <div style="max-height:350px;overflow-y:auto;">${rows}${moreHtml}</div>
            </div>
          `;

          if (infoWindowRef.current) infoWindowRef.current.close();
          const infoWindow = new google.maps.InfoWindow({ content, maxWidth: 480 });
          infoWindow.open(map, marker);
          infoWindowRef.current = infoWindow;

          // Scroll popup to top after opening
          setTimeout(() => {
            const popup = document.getElementById("cluster-popup");
            if (popup) popup.scrollTop = 0;
          }, 50);
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

    // Simplified dark map styles to avoid rendering artifacts
    const darkMapStyles = [
      { elementType: "geometry", stylers: [{ color: "#212121" }] },
      { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
      { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
      { featureType: "poi", elementType: "geometry", stylers: [{ color: "#181818" }] },
      { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b3a26" }] },
      { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
      { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
      { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
      { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f2f2f" }] },
      { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] },
    ];

    const applyTheme = () => {
      const map = mapRef.current;
      if (!map) return;
      const isDark = document.documentElement.classList.contains("dark");
      map.setOptions({ styles: isDark ? darkMapStyles : [] });
      // Close any open popup to force re-render with correct colors
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }
    };

    const initMap = async () => {
      const google = (window as GoogleMapsWindow).google;
      if (!google) return;

      const { Map } = (await google.maps.importLibrary("maps")) as any;
      const isDark = document.documentElement.classList.contains("dark");

      mapRef.current = new Map(mapContainerRef.current, {
        center: { lat: userLocation?.lat || 46.8182, lng: userLocation?.lng || 8.2275 },
        zoom: 10,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        styles: isDark ? darkMapStyles : [],
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

      // Watch for theme changes
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.attributeName === "class") {
            applyTheme();
          }
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      isInitializedRef.current = true;
      await processServices();

      // Cleanup on unmount
      return () => observer.disconnect();
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
