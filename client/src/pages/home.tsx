import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { GoogleMaps } from "@/components/google-maps";
import { StickyCategoryBar } from "@/components/sticky-category-bar";
import { CategoryFilterBar } from "@/components/category-filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { Sparkles, ArrowRight, Heart, MapPin, Loader2, Navigation, Search, X, ChevronDown, ChevronUp, Gift, Users, PlusCircle, Shield, Clock, Star, Award, Lock, CheckCircle2 } from "lucide-react";
import heroImg from "@assets/generated_images/abstract_community_connection_hero_background.png";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type ServiceWithDetails, type CategoryWithTemporary, type FavoriteWithService } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useGeocoding } from "@/hooks/useGeocoding";
import { geocodeLocation, suggestionToGeocodeResult, type GeocodingSuggestion } from "@/lib/geocoding";

type SortOption = "newest" | "oldest" | "most-viewed" | "price-low" | "price-high";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);

  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isNearbyExpanded, setIsNearbyExpanded] = useState(false);
  const [isAllListingsExpanded, setIsAllListingsExpanded] = useState(false);
  const [isSavedListingsExpanded, setIsSavedListingsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [useLocationPermissions, setUseLocationPermissions] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const locationPermissionProcessingRef = useRef(false);
  const [nearbyMode, setNearbyMode] = useState<'slider' | 'grid'>('slider');
  const [isPaused, setIsPaused] = useState(false);
  const [nearbyPage, setNearbyPage] = useState(1);
  const nearbyServicesSectionRef = useRef<HTMLElement>(null);

  const NEARBY_ITEMS_PER_PAGE = 12;

  // Independent state for All Listings tab
  const [allListingsCategory, setAllListingsCategory] = useState<string | null>(null);
  const [allListingsSort, setAllListingsSort] = useState<SortOption>("newest");

  // State for Saved Listings tab
  const [savedListingsSort, setSavedListingsSort] = useState<SortOption>("newest");

  // Carousel API state
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Pagination state for All Listings and Saved Listings
  const [allListingsPage, setAllListingsPage] = useState(1);
  const [savedListingsPage, setSavedListingsPage] = useState(1);
  const ALL_LISTINGS_PER_PAGE = 12; // Divisible by 1,2,3,4 columns for complete rows
  const SAVED_LISTINGS_PER_PAGE = 12; // Divisible by 1,2,3,4 columns for complete rows

  // Use shared geocoding hook for location search
  const {
    query: locationSearchQuery,
    setQuery: setLocationSearchQuery,
    suggestions: addressSuggestions,
    isLoading: isLoadingSuggestions,
    clearSuggestions
  } = useGeocoding({
    minQueryLength: 2,
    debounceMs: 300,
    limit: 10,
    autoSearch: true,
  });

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Handle tab switch when authentication changes - switch to "all" if on "saved" and user logs out
  useEffect(() => {
    if (!isAuthenticated && activeTab === "saved") {
      setActiveTab("all");
    }
  }, [isAuthenticated, activeTab]);

  // Sync hero category filter to All Listings tab
  useEffect(() => {
    setAllListingsCategory(selectedCategory);
  }, [selectedCategory]);

  // Reset page when category filter changes
  useEffect(() => {
    setAllListingsPage(1);
  }, [allListingsCategory]);

  // Reset nearby page when category or radius changes
  useEffect(() => {
    setNearbyPage(1);
  }, [selectedCategory, radiusKm]);

  // Autoplay effect for Carousel
  useEffect(() => {
    if (!carouselApi || nearbyMode !== 'slider' || isPaused) return;

    const autoPlayInterval = setInterval(() => {
      if (carouselApi.canScrollNext()) {
        carouselApi.scrollNext();
      } else {
        carouselApi.scrollTo(0);
      }
    }, 5000);

    return () => clearInterval(autoPlayInterval);
  }, [carouselApi, nearbyMode, isPaused]);

  // Auto-load user's saved location on mount (works for all users with stored location)
  useEffect(() => {
    if (user && user.locationLat && user.locationLng && !searchLocation) {
      // Authenticated user profile location takes priority
      setSearchLocation({
        lat: parseFloat(user.locationLat as any),
        lng: parseFloat(user.locationLng as any),
        name: user.preferredLocationName || "Your Location"
      });
    } else if (!searchLocation) {
      // Try to load from localStorage for unauthenticated users or those without profile location
      try {
        const saved = localStorage.getItem('lastSearchLocation');
        if (saved) {
          setSearchLocation(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load saved location from localStorage:', error);
      }
    }
  }, [user]);

  // Save search location to localStorage whenever it changes (for unauthenticated users)
  useEffect(() => {
    if (searchLocation) {
      try {
        localStorage.setItem('lastSearchLocation', JSON.stringify(searchLocation));
      } catch (error) {
        console.error('Failed to save location to localStorage:', error);
      }
    }
  }, [searchLocation]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: ["/api/services", { status: "active" }],
    queryFn: () => apiRequest("/api/services?status=active"),
  });

  const { data: favorites = [] } = useQuery<FavoriteWithService[]>({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("/api/favorites"),
    enabled: isAuthenticated,
  });

  const { data: newServiceCounts = [] } = useQuery<Array<{ categoryId: string; newCount: number }>>({
    queryKey: ["/api/categories/new-service-counts"],
    queryFn: () => apiRequest("/api/categories/new-service-counts"),
    enabled: isAuthenticated,
  });

  const { data: userAddresses = [] } = useQuery<Array<{ id: string; street: string; city: string; postalCode: string; lat?: number; lng?: number; isPrimary: boolean }>>({
    queryKey: ["/api/users/me/addresses"],
    queryFn: () => apiRequest("/api/users/me/addresses"),
    enabled: isAuthenticated,
  });

  const { data: mapsConfig = { apiKey: "", isConfigured: false } } = useQuery<{ apiKey: string; isConfigured: boolean }>({
    queryKey: ["/api/maps/config"],
    queryFn: () => apiRequest("/api/maps/config").catch(() => ({ apiKey: "", isConfigured: false })),
  });

  const newCountsMap = useMemo(() => {
    const map: Record<string, number> = {};
    newServiceCounts.forEach(item => {
      map[item.categoryId] = item.newCount;
    });
    return map;
  }, [newServiceCounts]);


  const handleLocationSearch = async (suggestion?: GeocodingSuggestion) => {
    const selectedLocation = suggestion || (addressSuggestions.length > 0 ? addressSuggestions[0] : null);

    if (!locationSearchQuery.trim() && !selectedLocation) {
      toast({
        title: "Location required",
        description: "Please enter a postcode, city, or address",
        variant: "destructive",
      });
      return;
    }

    setIsGeocoding(true);
    try {
      let result: { lat: number; lng: number; displayName: string; name: string };

      if (selectedLocation) {
        // Use shared helper to normalize suggestion
        result = suggestionToGeocodeResult(selectedLocation);
      } else {
        // Use shared geocodeLocation service
        result = await geocodeLocation(locationSearchQuery);
      }

      setSearchLocation({
        lat: result.lat,
        lng: result.lng,
        name: result.name || result.displayName
      });

      clearSuggestions();
      setLocationSearchQuery("");

      // Auto-expand the map when a location is found
      setIsMapExpanded(true);

      // Force map expansion explicitly just in case
      setTimeout(() => setIsMapExpanded(true), 100);

      // Scroll to nearby services section after location is set
      setTimeout(() => {
        setIsGettingLocation(false); // Stop loading effect
        nearbyServicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

      toast({
        title: "Location found",
        description: `Searching near ${result.name || result.displayName}`,
      });
    } catch (error: any) {
      console.error("Geocoding error:", error);
      toast({
        title: "Location not found",
        description: error.message || "Please try a valid Swiss postcode or city name",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleClearLocation = () => {
    setSearchLocation(null);
    setLocationSearchQuery("");
    clearSuggestions();
  };

  const handleBrowserLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Reverse geocode coordinates to get address name
      const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const response = await fetch(reverseGeocodeUrl, {
        headers: {
          'User-Agent': 'ServiceMarketplace/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reverse geocode location');
      }

      const data = await response.json();
      const locationName = data.address?.city || data.address?.town || data.address?.village || data.display_name;

      // Save location to user profile if authenticated
      if (isAuthenticated) {
        await apiRequest("/api/users/me", {
          method: "PATCH",
          body: JSON.stringify({
            locationLat: lat,
            locationLng: lng,
            preferredLocationName: locationName,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Invalidate user query cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }

      setSearchLocation({
        lat,
        lng,
        name: locationName,
      });

      // Auto-expand the map
      setIsMapExpanded(true);

      // Scroll to nearby services section after location is set
      setTimeout(() => {
        nearbyServicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);

      toast({
        title: "Location detected",
        description: `Using your current location: ${locationName}`,
      });
    } catch (error: any) {
      console.error("Geolocation error:", error);
      let errorMessage = "Unable to get your location";

      if (error.code === 1) {
        errorMessage = "Location permission denied. Please enable location access in your browser settings.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please try again.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }

      toast({
        title: "Location error",
        description: errorMessage,
        variant: "destructive",
      });
      setUseLocationPermissions(false);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleLocationPermissionsToggle = async (checked: boolean) => {
    // Debounce: prevent rapid toggling while location is being processed
    if (locationPermissionProcessingRef.current) {
      return;
    }

    setUseLocationPermissions(checked);

    if (checked) {
      locationPermissionProcessingRef.current = true;
      try {
        await handleBrowserLocation();
      } finally {
        locationPermissionProcessingRef.current = false;
      }
    }
  };

  const handleAddressSwitch = async (addressId: string) => {
    if (!userAddresses || userAddresses.length === 0) {
      toast({
        title: "No addresses available",
        description: "Please add an address first",
        variant: "destructive",
      });
      return;
    }

    const selectedAddress = userAddresses.find(addr => addr.id === addressId);
    if (!selectedAddress) {
      toast({
        title: "Address not found",
        description: "The selected address could not be found",
        variant: "destructive",
      });
      return;
    }

    let lat = selectedAddress.lat;
    let lng = selectedAddress.lng;

    // If coordinates are missing, geocode the address with fallback strategies
    if (!lat || !lng) {
      try {
        toast({
          title: "Geocoding address...",
          description: "Getting coordinates for this address",
        });

        let geocodeResult: { lat: number; lng: number } | null = null;
        const attempts = [
          // Try 1: Just postal code and city (most reliable for Swiss addresses)
          `${selectedAddress.postalCode} ${selectedAddress.city}`,
          // Try 2: Full address with postal code and city
          `${selectedAddress.street}, ${selectedAddress.postalCode} ${selectedAddress.city}`,
          // Try 3: Just city name
          selectedAddress.city,
        ];

        for (const addressString of attempts) {
          try {
            geocodeResult = await geocodeLocation(addressString);
            if (geocodeResult) {
              lat = geocodeResult.lat;
              lng = geocodeResult.lng;
              break; // Success, exit loop
            }
          } catch (err) {
            // Try next format
            console.log(`Geocoding attempt failed for: ${addressString}`, err);
            continue;
          }
        }

        if (!geocodeResult || !lat || !lng) {
          throw new Error("Could not geocode this address. Please try using the location search instead.");
        }

        // Note: Addresses table doesn't store lat/lng, so we just use the geocoded coordinates
        // for the current search session. They will be geocoded again next time if needed.
      } catch (error: any) {
        toast({
          title: "Failed to geocode address",
          description: error.message || "Could not get coordinates for this address. Please try using the location search to find this address, or use a different address.",
          variant: "destructive",
        });
        return;
      }
    }

    const locationName = `${selectedAddress.street}, ${selectedAddress.postalCode} ${selectedAddress.city}`;

    setSearchLocation({
      lat: lat,
      lng: lng,
      name: locationName,
    });

    // Save location to user profile if authenticated
    if (isAuthenticated) {
      try {
        await apiRequest("/api/users/me", {
          method: "PATCH",
          body: JSON.stringify({
            locationLat: lat,
            locationLng: lng,
            preferredLocationName: locationName,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Invalidate user query cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      } catch (error) {
        console.error("Failed to save location to profile:", error);
      }
    }

    toast({
      title: "Address switched",
      description: `Now searching near ${selectedAddress.city}`,
    });
  };

  const { data: nearbyData = [], isLoading: nearbyLoading } = useQuery<Array<ServiceWithDetails & { distance: number }>>({
    queryKey: ["/api/services/nearby", searchLocation, radiusKm],
    queryFn: () => apiRequest("/api/services/nearby", {
      method: "POST",
      body: JSON.stringify({
        lat: searchLocation!.lat,
        lng: searchLocation!.lng,
        radiusKm,
        limit: 10
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }),
    enabled: !!searchLocation,
  });

  const nearbyServices = useMemo(() => {
    if (!searchLocation || nearbyLoading) return [];

    let filtered = nearbyData || [];

    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter(service => service.categoryId === selectedCategory);
    }

    return filtered;
  }, [nearbyData, searchLocation, nearbyLoading, selectedCategory]);

  const paginatedNearbyServices = useMemo(() => {
    if (nearbyMode === 'slider') return nearbyServices;
    const startIndex = (nearbyPage - 1) * NEARBY_ITEMS_PER_PAGE;
    return nearbyServices.slice(startIndex, startIndex + NEARBY_ITEMS_PER_PAGE);
  }, [nearbyServices, nearbyMode, nearbyPage, NEARBY_ITEMS_PER_PAGE]);

  const nearbyTotalPages = Math.ceil(nearbyServices.length / NEARBY_ITEMS_PER_PAGE);

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return services;
    return services.filter(service => service.categoryId === selectedCategory);
  }, [services, selectedCategory]);

  const categoryServiceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      counts[service.categoryId] = (counts[service.categoryId] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Sorting function
  const sortServices = (servicesList: ServiceWithDetails[], sortBy: SortOption) => {
    return [...servicesList].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "most-viewed":
          return b.viewCount - a.viewCount;
        case "price-low": {
          const priceA = a.priceType === "fixed" && a.price !== null
            ? (typeof a.price === 'string' ? parseFloat(a.price) : a.price)
            : 0;
          const priceB = b.priceType === "fixed" && b.price !== null
            ? (typeof b.price === 'string' ? parseFloat(b.price) : b.price)
            : 0;
          const safePriceA = isNaN(priceA) ? 0 : priceA;
          const safePriceB = isNaN(priceB) ? 0 : priceB;
          return safePriceA - safePriceB;
        }
        case "price-high": {
          const priceA2 = a.priceType === "fixed" && a.price !== null
            ? (typeof a.price === 'string' ? parseFloat(a.price) : a.price)
            : 0;
          const priceB2 = b.priceType === "fixed" && b.price !== null
            ? (typeof b.price === 'string' ? parseFloat(b.price) : b.price)
            : 0;
          const safePriceA2 = isNaN(priceA2) ? 0 : priceA2;
          const safePriceB2 = isNaN(priceB2) ? 0 : priceB2;
          return safePriceB2 - safePriceA2;
        }
        default:
          return 0;
      }
    });
  };

  // Filtered and sorted All Listings
  const filteredAllListings = useMemo(() => {
    let filtered = services;
    if (allListingsCategory) {
      filtered = filtered.filter(service => service.categoryId === allListingsCategory);
    }
    return sortServices(filtered, allListingsSort);
  }, [services, allListingsCategory, allListingsSort]);

  // Category counts for All Listings
  const allListingsCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    services.forEach(service => {
      counts[service.categoryId] = (counts[service.categoryId] || 0) + 1;
    });
    return counts;
  }, [services]);

  // Filtered and sorted Saved Listings
  const filteredSavedListings = useMemo(() => {
    const savedServices = favorites?.map(fav => fav.service) || [];
    let filtered = savedServices;
    if (selectedCategory) {
      filtered = filtered.filter(service => service.categoryId === selectedCategory);
    }
    return sortServices(filtered, savedListingsSort);
  }, [favorites, selectedCategory, savedListingsSort]);


  // Pagination logic for All Listings
  const paginatedAllListings = useMemo(() => {
    const startIndex = (allListingsPage - 1) * ALL_LISTINGS_PER_PAGE;
    return filteredAllListings.slice(startIndex, startIndex + ALL_LISTINGS_PER_PAGE);
  }, [filteredAllListings, allListingsPage, ALL_LISTINGS_PER_PAGE]);

  const allListingsTotalPages = Math.ceil(filteredAllListings.length / ALL_LISTINGS_PER_PAGE);

  // Pagination logic for Saved Listings
  const paginatedSavedListings = useMemo(() => {
    const startIndex = (savedListingsPage - 1) * SAVED_LISTINGS_PER_PAGE;
    return filteredSavedListings.slice(startIndex, startIndex + SAVED_LISTINGS_PER_PAGE);
  }, [filteredSavedListings, savedListingsPage, SAVED_LISTINGS_PER_PAGE]);

  const savedListingsTotalPages = Math.ceil(filteredSavedListings.length / SAVED_LISTINGS_PER_PAGE);

  // Reset All Listings page if current page exceeds available pages
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredAllListings.length / ALL_LISTINGS_PER_PAGE));
    if (allListingsPage > maxPage) {
      setAllListingsPage(maxPage);
    }
  }, [filteredAllListings.length, allListingsPage]);

  // Reset Saved Listings page if current page exceeds available pages
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSavedListings.length / SAVED_LISTINGS_PER_PAGE));
    if (savedListingsPage > maxPage) {
      setSavedListingsPage(maxPage);
    }
  }, [filteredSavedListings.length, savedListingsPage]);

  // Reset nearby page if current page exceeds available pages
  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(nearbyServices.length / NEARBY_ITEMS_PER_PAGE));
    if (nearbyPage > maxPage) {
      setNearbyPage(maxPage);
    }
  }, [nearbyServices.length, nearbyPage]);

  return (
    <Layout>
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 bg-gradient-to-r from-primary to-accent text-white border-0 shadow-lg px-6 py-2.5"
              variant="secondary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Trusted by 50,000+ Swiss Customers
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-700">
              The complete platform to discover{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                local services
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Connect with verified service providers across Switzerland. Book with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="relative flex-1 text-left">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10" />
                <Input
                  id="hero-location-search"
                  type="text"
                  placeholder="Enter postcode, city, or address..."
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && locationSearchQuery.trim()) {
                      handleLocationSearch();
                    }
                  }}
                  disabled={isGeocoding || isGettingLocation}
                  className="pl-12 h-14 text-base shadow-md focus:shadow-lg transition-shadow bg-background"
                  data-testid="input-hero-location-search"
                  autoComplete="off"
                />
                {/* Suggestions Dropdown */}
                {addressSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {addressSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLocationSearch(suggestion)}
                        className="w-full text-left px-4 py-3 hover:bg-muted border-b border-border/50 last:border-b-0 transition-colors flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-foreground truncate">{suggestion.city || suggestion.postcode || suggestion.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{suggestion.display_name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={() => handleLocationSearch()}
              disabled={isGeocoding || !locationSearchQuery.trim() || isGettingLocation}
              size="lg"
              className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isGeocoding ? <Loader2 className="animate-spin" /> : "Search"}
            </Button>
          </div>

          {/* Active Location Display */}
          <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
            {searchLocation && (
              <Badge variant="secondary" className="px-3 py-1.5 bg-primary/10 text-primary border-primary/20">
                <MapPin className="w-3 h-3 mr-1" />
                Searching near {searchLocation.name}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="hero-location-permissions"
                checked={useLocationPermissions}
                onCheckedChange={handleLocationPermissionsToggle}
                disabled={isGettingLocation || isGeocoding}
              />
              <Label htmlFor="hero-location-permissions" className="text-muted-foreground cursor-pointer">
                Use My Location
              </Label>
            </div>
          </div>
          {/* Quick Links */}
          <div className="flex flex-wrap gap-2 justify-center text-sm mt-8">
            <span className="text-muted-foreground">Popular:</span>
            <Link href="/search?q=plumber"><span className="text-primary hover:underline cursor-pointer">Plumber</span></Link>
            <span className="text-border">•</span>
            <Link href="/search?q=electrician"><span className="text-accent hover:underline cursor-pointer">Electrician</span></Link>
            <span className="text-border">•</span>
            <Link href="/search?q=cleaning"><span className="text-primary hover:underline cursor-pointer">Cleaning</span></Link>
          </div>
        </div>

      </section>

      {/* Stats Section */}
      <section className="py-12 border-b bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                50K+
              </div>
              <div className="text-sm text-muted-foreground">Active Customers</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                5,000+
              </div>
              <div className="text-sm text-muted-foreground">Verified Vendors</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                98%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                24h
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>



      {/* Services Near You Section - Only shown if location is set */}
      {
        searchLocation && (
          <>
            <StickyCategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              serviceCount={services.length}
              categoryCounts={categoryServiceCounts}
              newCounts={newCountsMap}
            />
            <section ref={nearbyServicesSectionRef} className="py-12 bg-muted/30 border-y border-border">
              <div className="container mx-auto px-4">
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary" />
                        Services Near {searchLocation.name}
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Showing services within {radiusKm} km of your selected location
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNearbyMode(nearbyMode === 'slider' ? 'grid' : 'slider');
                          setNearbyPage(1);
                        }}
                      >
                        {nearbyMode === 'slider' ? 'View Grid' : 'View Slider'}
                      </Button>
                    </div>
                  </div>

                  <GoogleMaps
                    services={nearbyServices}
                    userLocation={searchLocation}
                    maxServices={10}
                    apiKey={mapsConfig?.apiKey || ""}
                    isExpanded={isMapExpanded}
                    onExpandedChange={setIsMapExpanded}
                  />

                  {nearbyLoading ? (
                    <div className="text-center py-20">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Loading nearby services...</h3>
                    </div>
                  ) : nearbyServices.length === 0 ? (
                    <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed border-border">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                        <MapPin className="w-10 h-10 text-primary/60" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">No Services Found Nearby</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        We couldn't find any services within {radiusKm} km of your location.
                        Try expanding your search radius or browse all services below.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button variant="outline" onClick={() => setRadiusKm(Math.min(radiusKm * 2, 100))}>
                          Expand to {Math.min(radiusKm * 2, 100)} km
                        </Button>
                      </div>
                    </div>
                  ) : nearbyMode === 'slider' ? (
                    <div className="w-full relative px-4 md:px-12">
                      <Carousel
                        setApi={setCarouselApi}
                        opts={{
                          align: "start",
                          loop: true,
                          duration: 30, // Smooth transition
                        }}
                        className="w-full"
                      >
                        <CarouselContent className="-ml-4">
                          {nearbyServices.map((service) => (
                            <CarouselItem key={service.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                              <div className="h-full">
                                <ServiceCard service={service} />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="hidden md:flex" />
                        <CarouselNext className="hidden md:flex" />
                      </Carousel>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedNearbyServices.map((service) => (
                          <ServiceCard key={service.id} service={service} />
                        ))}
                      </div>
                      {nearbyTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNearbyPage(p => Math.max(1, p - 1))}
                            disabled={nearbyPage === 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {nearbyPage} of {nearbyTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNearbyPage(p => Math.min(nearbyTotalPages, p + 1))}
                            disabled={nearbyPage === nearbyTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )
      }

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-accent/5 via-muted/20 to-success/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-accent to-success text-white border-0 px-4 py-2">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              How Commerzio Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Book trusted services in three simple steps with complete security and transparency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Discover & Book</h3>
                <p className="text-muted-foreground">
                  Browse verified service providers, compare reviews, and book your preferred time slot instantly.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-primary to-accent"></div>
            </div>

            <div className="relative group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-success text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Payment</h3>
                <p className="text-muted-foreground">
                  Pay securely with escrow protection. Funds are held until you confirm the service is completed.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-accent to-success"></div>
            </div>

            <div className="group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success to-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Leave a Review</h3>
                <p className="text-muted-foreground">
                  Share your experience and help others make informed decisions. Build trust in our community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Commerzio */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              Why Choose Commerzio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for the Swiss market with security and trust at its core
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Escrow Protection</h3>
                <p className="text-muted-foreground">
                  Your payment is held securely until service completion. Full refund guarantee for disputes.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-success text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Vendors</h3>
                <p className="text-muted-foreground">
                  All service providers are verified with background checks and review systems.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-primary text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guarantee</h3>
                <p className="text-muted-foreground">
                  98% satisfaction rate backed by our dispute resolution system and customer support.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Clock className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Booking</h3>
                <p className="text-muted-foreground">
                  Instant availability checks and booking confirmations. No more endless phone calls.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-success text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Award className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Rewards Program</h3>
                <p className="text-muted-foreground">
                  Earn points with every booking and referral. Redeem for discounts on future services.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-primary text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Star className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted Reviews</h3>
                <p className="text-muted-foreground">
                  Only verified customers can leave reviews, ensuring authentic feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers and verified vendors on Switzerland's most trusted service platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-xl" asChild>
              <Link href="/search">Find Services</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary bg-transparent"
              asChild
            >
              <Link href="/register">Become a Vendor</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout >
  );
}
