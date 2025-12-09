import { Link } from "wouter";
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
import { Sparkles, MapPin, Loader2, X, Sliders, Search } from "lucide-react";
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  // Map is hidden by default, only shown when user explicitly opens it or searches
  const [isMapVisible, setIsMapVisible] = useState(false);
  // Track if this is a fresh user-initiated search (not localStorage restore)
  const isUserSearchRef = useRef(false);

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

  // Responsive scroll helper - calculates header offset based on screen size
  const scrollToServicesSection = useCallback(() => {
    if (!nearbyServicesSectionRef.current) return;
    // Desktop has larger header (~120px), mobile has smaller (~80px)
    const headerOffset = window.innerWidth >= 768 ? 120 : 80;
    const elementPosition = nearbyServicesSectionRef.current.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  }, []);

  // Scroll to services section when map is expanded
  useEffect(() => {
    if (isMapExpanded) {
      scrollToServicesSection();
    }
  }, [isMapExpanded, scrollToServicesSection]);

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
      } catch { /* ignore */ }
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
      setIsMapVisible(true); // Open map when user searches
      setIsMapExpanded(true);
      fetchPredictedRadius(result.lat, result.lng);
      setTimeout(() => scrollToServicesSection(), 500);
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
      setIsMapVisible(true); // Open map when user uses their location
      setIsMapExpanded(true);
      fetchPredictedRadius(lat, lng);
      setTimeout(() => scrollToServicesSection(), 500);
      toast({ title: "Location detected", description: `Using: ${locationName}` });
    } catch {
      toast({ title: "Location error", description: "Unable to get location", variant: "destructive" });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        clearSuggestions();
        setLocationSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [clearSuggestions, setLocationSearchQuery]);

  // Popular search terms
  const popularSearches = ["Plumber", "Electrician", "Cleaning", "Tutoring"];

  // Handle popular tag click
  const handlePopularClick = (term: string) => {
    setServiceSearchQuery(term);
    // Navigate to search page with term
    window.location.href = `/search?q=${encodeURIComponent(term)}`;
  };

  // Handle combined search
  const handleCombinedSearch = () => {
    const params = new URLSearchParams();
    if (serviceSearchQuery.trim()) params.set("q", serviceSearchQuery.trim());
    if (locationSearchQuery.trim()) {
      handleLocationSearch();
    } else if (searchLocation) {
      params.set("lat", searchLocation.lat.toString());
      params.set("lng", searchLocation.lng.toString());
      params.set("location", searchLocation.name);
    }
    if (serviceSearchQuery.trim() || searchLocation) {
      window.location.href = `/search?${params.toString()}`;
    }
  };

  return (
    <Layout>
      <section className="relative border-b overflow-hidden min-h-[600px]">
        <HeroVideoBackground />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-primary to-accent text-white px-6 py-2.5 shadow-lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Trusted by 50,000+ Swiss Customers
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white [text-shadow:_0_4px_24px_rgb(0_0_0_/_50%),_0_2px_8px_rgb(0_0_0_/_40%)]">
              The complete platform to discover{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent [text-shadow:none]">local services</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
              Connect with verified service providers across Switzerland.
              Book with confidence using our secure escrow payment system.
            </p>

            {/* Search Box - Two fields */}
            <div ref={searchContainerRef} className="bg-background rounded-2xl p-2 md:p-3 max-w-3xl mx-auto mb-6 shadow-2xl">
              <div className="flex flex-col md:flex-row gap-2">
                {/* Service Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    value={serviceSearchQuery}
                    onChange={(e) => setServiceSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCombinedSearch()}
                    placeholder="What service are you looking for?"
                    className="pl-12 h-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px bg-border self-stretch my-2" />

                {/* Location Search */}
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                  <Input
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCombinedSearch()}
                    placeholder="Location"
                    className="pl-12 h-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-2xl z-[100] max-h-80 overflow-y-auto">
                      {addressSuggestions.map((s, i) => (
                        <button key={i} onClick={() => handleLocationSearch(s)} className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border/50 last:border-0 text-foreground">
                          <p className="font-medium text-sm">{s.city || s.postcode}</p>
                          <p className="text-xs text-muted-foreground truncate">{s.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleCombinedSearch}
                  disabled={isGeocoding}
                  size="lg"
                  className="h-14 px-8 rounded-xl"
                >
                  {isGeocoding ? <Loader2 className="animate-spin" /> : "Search"}
                </Button>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="flex justify-center items-center gap-4 flex-wrap text-white/70">
              <span className="text-sm">Popular:</span>
              {popularSearches.map((term, i) => (
                <React.Fragment key={term}>
                  {i > 0 && <span className="text-white/30">•</span>}
                  <button
                    onClick={() => handlePopularClick(term)}
                    className="text-primary hover:text-white transition-all duration-200 text-sm font-medium hover:scale-105 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-primary hover:after:w-full after:transition-all after:duration-300"
                  >
                    {term}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Use My Location toggle */}
            <div className="flex justify-center items-center gap-3 mt-6 flex-wrap">
              {searchLocation && (
                <div className="h-11 px-4 flex items-center gap-2 bg-background/90 rounded-lg shadow-md border border-border/50 max-w-xs">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="truncate text-sm font-medium">Near {searchLocation.name?.split(',')[2]?.trim() || searchLocation.name?.split(',')[1]?.trim() || searchLocation.name}</span>
                </div>
              )}
              <Button
                variant={useLocationPermissions ? "default" : "secondary"}
                className={`h-11 gap-2 shadow-lg ${useLocationPermissions ? 'bg-primary text-primary-foreground' : 'bg-white dark:bg-slate-800 text-foreground hover:bg-white/90 dark:hover:bg-slate-700'}`}
                onClick={() => {
                  const newValue = !useLocationPermissions;
                  setUseLocationPermissions(newValue);
                  if (newValue) handleBrowserLocation();
                }}
              >
                <MapPin className="w-4 h-4" />
                {useLocationPermissions ? "Location Active" : "Use My Location"}
              </Button>
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

      {/* Sticky Category Bar - Show if we have search location OR map is visible */}
      {(searchLocation || isMapVisible) && (
        <>
          <StickyCategoryBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            serviceCount={services.length}
            categoryCounts={categoryCounts}
            newCounts={{}}
          />

          <section ref={nearbyServicesSectionRef} className="py-8 md:py-12 bg-muted/30 border-y border-border">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-center w-full mb-2">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <MapPin className="text-primary flex-shrink-0" />
                      <span className="truncate">
                        {searchLocation
                          ? `Services Near ${searchLocation.name?.split(',')[2]?.trim() || searchLocation.name?.split(',')[1]?.trim() || searchLocation.name?.split(',')[0]}`
                          : "Explore Services Map"
                        }
                      </span>
                    </h2>

                    {/* Open Map Button - Only shown when map is hidden */}
                    {!isMapVisible && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-primary/20 hover:bg-primary/5 hover:text-primary"
                          onClick={() => setIsMapVisible(true)}
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Open Map
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-4">
                    <p className="text-sm text-muted-foreground">
                      {searchLocation
                        ? `Found ${nearbyServices.length} services within ${radiusKm}km`
                        : "Browse services across Switzerland"
                      }
                    </p>
                    <div className="flex items-center gap-2">

                      {/* Show expand button inline when map is NOT expanded */}
                      {!isMapExpanded && nearbyServices.length > 0 && !nearbyLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 -mr-2"
                          onClick={() => setNearbyMode((m) => (m === "slider" ? "grid" : "slider"))}
                        >
                          {nearbyMode === "slider" ? "Expand to Grid" : "Minimize to Slider"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Radius controls - only show when map is expanded */}
                {isMapExpanded && (
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Slider */}
                    <div className="flex-1 md:w-[200px] flex items-center gap-3">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">2km</span>
                      <Slider
                        value={[radiusKm]}
                        min={2}
                        max={100}
                        step={1}
                        onValueChange={(v) => setRadiusKm(v[0])}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">100km</span>
                    </div>
                    {/* Dropdown shows current value + presets */}
                    <Select value={radiusKm.toString()} onValueChange={(v) => setRadiusKm(parseInt(v))}>
                      <SelectTrigger className="w-[100px] bg-background">
                        <SelectValue placeholder="Radius" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Show current slider value at top if not a preset */}
                        {!RADIUS_PRESETS.includes(radiusKm) && (
                          <SelectItem key={radiusKm} value={radiusKm.toString()} className="font-semibold text-primary">
                            {radiusKm} km
                          </SelectItem>
                        )}
                        {RADIUS_PRESETS.map((km) => (
                          <SelectItem key={km} value={km.toString()}>
                            {km} km
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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

              {/* Map Container with Close Button */}
              {isMapVisible && (
                <div className="relative">
                  {/* Close Map Button - Positioned at top-right of map */}
                  <div className="flex justify-end mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setIsMapVisible(false)}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Close Map
                    </Button>
                  </div>
                  <GoogleMaps
                    services={nearbyServices}
                    userLocation={
                      searchLocation || {
                        lat: 46.8182, // Switzerland Center
                        lng: 8.2275,
                        name: "Switzerland"
                      }
                    }
                    maxServices={100}
                    apiKey={mapsConfig?.apiKey || ""}
                    isExpanded={isMapExpanded}
                    onExpandedChange={setIsMapExpanded}
                  />
                </div>
              )}

              <div className="mt-8">
                {nearbyLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : nearbyServices.length === 0 && searchLocation ? (
                  <div className="text-center py-12 text-muted-foreground">No services found in this area.</div>
                ) : (
                  <>
                    {/* Show expand button here only when map IS expanded */}
                    {isMapExpanded && (
                      <div className="flex justify-end mb-4">
                        <Button variant="outline" size="sm" onClick={() => setNearbyMode((m) => (m === "slider" ? "grid" : "slider"))}>
                          {nearbyMode === "slider" ? "Expand to Grid" : "Minimize to Slider"}
                        </Button>
                      </div>
                    )}
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

      {/* How Commerzio Works Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background via-background to-muted/30">
        <div className="container mx-auto px-4">
          {/* Section Badge */}
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              Simple Process
            </span>
          </div>

          {/* Section Heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-primary via-cyan-400 to-primary bg-clip-text text-transparent italic">
            How Commerzio Works
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-16">
            Book trusted services in three simple steps with complete security and transparency
          </p>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Discover & Book",
                desc: "Browse verified service providers, compare reviews, and book your preferred time slot instantly."
              },
              {
                step: 2,
                title: "Secure Payment",
                desc: "Pay securely with escrow protection. Funds are held until you confirm the service is completed."
              },
              {
                step: 3,
                title: "Leave a Review",
                desc: "Share your experience and help others make informed decisions. Build trust in our community."
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-card/50 dark:bg-card/30 backdrop-blur-sm p-8 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-primary/5"
              >
                {/* Step Number */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-primary text-white flex items-center justify-center font-bold text-lg mb-6 shadow-lg shadow-primary/20">
                  {item.step}
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Commerzio Section */}
      <section className="py-16 md:py-24 bg-muted/30 dark:bg-muted/10">
        <div className="container mx-auto px-4">
          {/* Section Heading */}
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            Why Choose Commerzio
          </h2>
          <p className="text-center text-muted-foreground max-w-xl mx-auto mb-16">
            Built for the Swiss market with security and trust at its core
          </p>

          {/* Features Grid - 2 rows of 3 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                iconBg: "from-cyan-500/20 to-cyan-500/10",
                iconColor: "text-cyan-400",
                title: "Escrow Protection",
                desc: "Your payment is held securely until service completion. Full refund guarantee for disputes."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                iconBg: "from-primary/20 to-primary/10",
                iconColor: "text-primary",
                title: "Verified Vendors",
                desc: "All service providers are verified with background checks and review systems."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                iconBg: "from-emerald-500/20 to-emerald-500/10",
                iconColor: "text-emerald-400",
                title: "Quality Guarantee",
                desc: "98% satisfaction rate backed by our dispute resolution system and customer support."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                iconBg: "from-cyan-500/20 to-cyan-500/10",
                iconColor: "text-cyan-400",
                title: "Real-Time Booking",
                desc: "Instant availability checks and booking confirmations. No more endless phone calls."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                iconBg: "from-amber-500/20 to-amber-500/10",
                iconColor: "text-amber-400",
                title: "Rewards Program",
                desc: "Earn points with every booking and referral. Redeem for discounts on future services."
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ),
                iconBg: "from-primary/20 to-primary/10",
                iconColor: "text-primary",
                title: "Trusted Reviews",
                desc: "Only verified customers can leave reviews, ensuring authentic feedback."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-card dark:bg-card/50 p-6 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Get Started CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-foreground">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Join thousands of satisfied customers and verified vendors on Switzerland's most trusted service platform
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search">
                <Button
                  variant="outline"
                  size="lg"
                  className="min-w-[160px] h-12 text-base font-medium border-2 border-border hover:border-primary hover:bg-primary/5 transition-all duration-300"
                >
                  Find Services
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="lg"
                  className="min-w-[160px] h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300"
                >
                  Become a Vendor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
