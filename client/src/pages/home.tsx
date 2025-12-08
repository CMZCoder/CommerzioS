import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { GoogleMaps } from "@/components/google-maps";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { StickyCategoryBar } from "@/components/sticky-category-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Sparkles, MapPin, Loader2, X, Sliders } from "lucide-react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type ServiceWithDetails, type CategoryWithTemporary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGeocoding } from "@/hooks/useGeocoding";
import { geocodeLocation, suggestionToGeocodeResult, type GeocodingSuggestion } from "@/lib/geocoding";

const RADIUS_PRESETS = [2, 5, 10, 20, 50, 100];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [showAdvancedRadius, setShowAdvancedRadius] = useState(false);
  const [radiusExpansionMessage, setRadiusExpansionMessage] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [nearbyMode, setNearbyMode] = useState<"slider" | "grid">("slider");
  const [isPaused, setIsPaused] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useLocationPermissions, setUseLocationPermissions] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const nearbyServicesSectionRef = useRef<HTMLElement>(null);
  const autoExpandTriggeredRef = useRef(false);

  const {
    query: locationSearchQuery,
    setQuery: setLocationSearchQuery,
    suggestions: addressSuggestions,
    clearSuggestions,
  } = useGeocoding({ minQueryLength: 2, debounceMs: 300, limit: 10, autoSearch: true });

  const [debouncedRadius, setDebouncedRadius] = useState(radiusKm);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedRadius(radiusKm), 300);
    return () => clearTimeout(timer);
  }, [radiusKm]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!carouselApi || nearbyMode !== "slider" || isPaused) return;
    const interval = setInterval(() => {
      if (carouselApi.canScrollNext()) carouselApi.scrollNext();
      else carouselApi.scrollTo(0);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselApi, nearbyMode, isPaused]);

  useEffect(() => {
    if (user?.locationLat && user?.locationLng && !searchLocation) {
      setSearchLocation({
        lat: parseFloat(user.locationLat as string),
        lng: parseFloat(user.locationLng as string),
        name: user.preferredLocationName || "Your Location",
      });
      fetchPredictedRadius(parseFloat(user.locationLat as string), parseFloat(user.locationLng as string));
    } else if (!searchLocation) {
      try {
        const saved = localStorage.getItem("lastSearchLocation");
        if (saved) {
          const parsed = JSON.parse(saved);
          setSearchLocation(parsed);
          fetchPredictedRadius(parsed.lat, parsed.lng);
        }
      } catch { }
    }
  }, [user]);

  useEffect(() => {
    if (searchLocation) localStorage.setItem("lastSearchLocation", JSON.stringify(searchLocation));
  }, [searchLocation]);

  const fetchPredictedRadius = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await apiRequest("/api/ml/predict-radius", {
          method: "POST",
          body: JSON.stringify({ lat, lng }),
        }).catch(() => null);

        if (res?.optimalRadius && RADIUS_PRESETS.includes(res.optimalRadius)) {
          setRadiusKm(res.optimalRadius);
          toast({ title: "Radius Optimized", description: `Search radius set to ${res.optimalRadius}km based on local activity.` });
        }
      } catch {
        // Silent fallback to default
      }
    },
    [toast]
  );

  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const { data: services = [] } = useQuery<ServiceWithDetails[]>({
    queryKey: ["/api/services", { status: "active" }],
    queryFn: () => apiRequest("/api/services?status=active"),
  });

  const { data: mapsConfig = { apiKey: "", isConfigured: false } } = useQuery<{ apiKey: string; isConfigured: boolean }>({
    queryKey: ["/api/maps/config"],
    queryFn: () => apiRequest("/api/maps/config").catch(() => ({ apiKey: "", isConfigured: false })),
  });

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    services.forEach((s) => (c[s.categoryId] = (c[s.categoryId] || 0) + 1));
    return c;
  }, [services]);

  const { data: allNearbyData = [], isLoading: nearbyLoading } = useQuery<Array<ServiceWithDetails & { distance: number }>>({
    queryKey: ["/api/services/nearby", searchLocation],
    queryFn: () =>
      apiRequest("/api/services/nearby", {
        method: "POST",
        body: JSON.stringify({ lat: searchLocation!.lat, lng: searchLocation!.lng, radiusKm: 100, limit: 100 }),
        headers: { "Content-Type": "application/json" },
      }),
    enabled: !!searchLocation,
  });

  const nearbyServices = useMemo(() => {
    if (!searchLocation || nearbyLoading) return [];
    let filtered = allNearbyData || [];
    if (selectedCategory) filtered = filtered.filter((s) => s.categoryId === selectedCategory);
    return filtered.filter((s) => (s.distance || 0) <= debouncedRadius);
  }, [allNearbyData, searchLocation, nearbyLoading, selectedCategory, debouncedRadius]);

  useEffect(() => {
    if (!searchLocation || nearbyLoading || !allNearbyData.length || autoExpandTriggeredRef.current) return;

    let filtered = allNearbyData;
    if (selectedCategory) filtered = filtered.filter((s) => s.categoryId === selectedCategory);
    const withinRadius = filtered.filter((s) => (s.distance || 0) <= debouncedRadius);

    if (withinRadius.length === 0 && filtered.length > 0) {
      const sorted = [...filtered].sort((a, b) => (a.distance || 0) - (b.distance || 0));
      const nearestDist = sorted[0].distance || 0;
      const nextPreset = RADIUS_PRESETS.find((p) => p > nearestDist) || 100;

      if (nextPreset > radiusKm && nextPreset <= 100) {
        autoExpandTriggeredRef.current = true;
        setRadiusKm(nextPreset);
        setRadiusExpansionMessage(
          `No services found within ${debouncedRadius}km of ${searchLocation.name}. Expanded radius to ${nextPreset}km.`
        );
      }
    } else {
      setRadiusExpansionMessage(null);
    }
  }, [allNearbyData, selectedCategory, debouncedRadius, radiusKm, searchLocation, nearbyLoading]);

  useEffect(() => {
    autoExpandTriggeredRef.current = false;
  }, [searchLocation, selectedCategory]);

  const handleLocationSearch = async (suggestion?: GeocodingSuggestion) => {
    setIsGeocoding(true);
    try {
      const result = suggestion ? suggestionToGeocodeResult(suggestion) : await geocodeLocation(locationSearchQuery);
      setSearchLocation({ lat: result.lat, lng: result.lng, name: result.name || result.displayName });
      clearSuggestions();
      setLocationSearchQuery("");
      setIsMapExpanded(true);
      fetchPredictedRadius(result.lat, result.lng);
      setTimeout(() => nearbyServicesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
      toast({ title: "Location found", description: `Searching near ${result.name || result.displayName}` });
    } catch (error: any) {
      toast({ title: "Location not found", description: error.message, variant: "destructive" });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleBrowserLocation = async () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      const { latitude: lat, longitude: lng } = position.coords;
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
      const data = await res.json();
      const locationName = data.address?.city || data.display_name;
      setSearchLocation({ lat, lng, name: locationName });
      setIsMapExpanded(true);
      fetchPredictedRadius(lat, lng);
      setTimeout(() => nearbyServicesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
      toast({ title: "Location detected", description: `Using: ${locationName}` });
    } catch {
      toast({ title: "Location error", description: "Unable to get location", variant: "destructive" });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <Layout>
      <section className="relative border-b overflow-hidden min-h-[600px]">
        <HeroVideoBackground />
        <div className="container mx-auto px-4 py-20 md:py-32 relative text-center">
          <Badge className="mb-6 bg-gradient-to-r from-primary to-accent text-white px-6 py-2.5">
            <Sparkles className="h-4 w-4 mr-2" />
            Trusted by 50,000+ Swiss Customers
          </Badge>
          <h1 className="text-4xl md:text-7xl font-bold mb-6">
            The complete platform to discover{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">local services</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8">
            <div className="relative flex-1 text-left">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground z-10" />
              <Input
                value={locationSearchQuery}
                onChange={(e) => setLocationSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && locationSearchQuery.trim() && handleLocationSearch()}
                placeholder="Enter postcode, city, or address..."
                className="pl-12 h-14 text-base bg-background shadow-md"
              />
              {addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg z-50">
                  {addressSuggestions.map((s, i) => (
                    <button key={i} onClick={() => handleLocationSearch(s)} className="w-full text-left px-4 py-3 hover:bg-muted">
                      <p className="font-medium">{s.city || s.postcode}</p>
                      <p className="text-xs text-muted-foreground">{s.display_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={() => handleLocationSearch()} disabled={isGeocoding} size="lg" className="h-14 px-8">
              {isGeocoding ? <Loader2 className="animate-spin" /> : "Search"}
            </Button>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {searchLocation && (
              <Badge variant="secondary" className="px-3 py-1.5">
                <MapPin className="w-3 h-3 mr-1" />
                Near {searchLocation.name}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={useLocationPermissions}
                onCheckedChange={(c) => {
                  setUseLocationPermissions(c);
                  if (c) handleBrowserLocation();
                }}
              />
              <Label>Use My Location</Label>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Active Customers", val: "50K+" },
            { label: "Verified Vendors", val: "5,000+" },
            { label: "Satisfaction Rate", val: "98%" },
            { label: "Avg Response Time", val: "24h" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.val}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {searchLocation && (
        <>
          <StickyCategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            serviceCount={services.length}
            categoryCounts={categoryCounts}
            newCounts={{}}
          />

          <section ref={nearbyServicesSectionRef} className="py-12 bg-muted/30 border-y border-border">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MapPin className="text-primary" /> Services Near {searchLocation.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Found {nearbyServices.length} services within {radiusKm}km
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <Select value={radiusKm.toString()} onValueChange={(v) => setRadiusKm(parseInt(v))}>
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Select Radius" />
                      </SelectTrigger>
                      <SelectContent>
                        {RADIUS_PRESETS.map((km) => (
                          <SelectItem key={km} value={km.toString()}>
                            {km} km
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedRadius(!showAdvancedRadius)}
                      className={cn("gap-2", showAdvancedRadius && "bg-muted")}
                    >
                      <Sliders className="w-4 h-4" /> Advanced
                    </Button>
                  </div>
                  <AnimatePresence>
                    {showAdvancedRadius && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full md:w-[300px] bg-background p-4 rounded-lg border shadow-sm overflow-hidden"
                      >
                        <div className="flex justify-between mb-2 text-xs text-muted-foreground">
                          <span>2km</span>
                          <span>100km</span>
                        </div>
                        <Slider value={[radiusKm]} min={2} max={100} step={1} onValueChange={(v) => setRadiusKm(v[0])} className="py-2" />
                        <div className="text-center text-xs font-semibold mt-1">{radiusKm} km</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <AnimatePresence>
                {radiusExpansionMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex justify-between items-center"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      {radiusExpansionMessage}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setRadiusExpansionMessage(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <GoogleMaps
                services={nearbyServices}
                userLocation={searchLocation}
                maxServices={20}
                apiKey={mapsConfig?.apiKey || ""}
                isExpanded={isMapExpanded}
                onExpandedChange={setIsMapExpanded}
              />

              <div className="mt-8">
                {nearbyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : nearbyServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">No services found in this area.</div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" size="sm" onClick={() => setNearbyMode((m) => (m === "slider" ? "grid" : "slider"))}>
                        {nearbyMode === "slider" ? "Expand to Grid" : "Minimize to Slider"}
                      </Button>
                    </div>
                    {nearbyMode === "slider" ? (
                      <Carousel
                        setApi={setCarouselApi}
                        opts={{ align: "start", loop: true, duration: 30 }}
                        className="w-full"
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                      >
                        <CarouselContent>
                          {nearbyServices.map((s) => (
                            <CarouselItem key={s.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-4">
                              <div className="h-full p-2">
                                <ServiceCard service={s} />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                      </Carousel>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {nearbyServices.map((s) => (
                          <ServiceCard key={s.id} service={s} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="py-16 md:py-24 bg-gradient-to-br from-accent/5 via-muted/20 to-success/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">How Commerzio Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: "Discover & Book", desc: "Browse verified providers" },
              { step: 2, title: "Secure Payment", desc: "Funds held in escrow" },
              { step: 3, title: "Leave a Review", desc: "Help build the community" },
            ].map((item, i) => (
              <div key={i} className="bg-card p-8 rounded-2xl shadow-sm border">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
