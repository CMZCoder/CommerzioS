import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Filter, Sparkles, ArrowRight, Loader2, Heart } from "lucide-react";
import heroImg from "@assets/generated_images/abstract_community_connection_hero_background.png";
import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type ServiceWithDetails, type CategoryWithTemporary, type FavoriteWithService } from "@/lib/api";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [heroSearchResults, setHeroSearchResults] = useState<ServiceWithDetails[]>([]);
  const [heroSearchOpen, setHeroSearchOpen] = useState(false);
  const [heroSearchLoading, setHeroSearchLoading] = useState(false);
  const heroSearchRef = useRef<HTMLDivElement>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: ["/api/services", { status: "active" }],
    queryFn: () => apiRequest("/api/services?status=active"),
  });

  // Query favorites for authenticated users
  const { data: favorites = [] } = useQuery<FavoriteWithService[]>({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("/api/favorites"),
    enabled: isAuthenticated,
  });

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || service.category.slug === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchTerm, selectedCategory]);

  // Hero search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(event.target as Node)) {
        setHeroSearchOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setHeroSearchResults([]);
      setHeroSearchOpen(false);
      return;
    }

    setHeroSearchLoading(true);
    const abortController = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/services/search?q=${encodeURIComponent(searchTerm)}&limit=5`,
          { signal: abortController.signal }
        );
        
        if (!response.ok) throw new Error("Search failed");
        
        const data = await response.json();
        setHeroSearchResults(data);
        setHeroSearchOpen(data.length > 0);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setHeroSearchResults([]);
          setHeroSearchOpen(false);
        }
      } finally {
        setHeroSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
      setHeroSearchLoading(false);
    };
  }, [searchTerm]);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImg} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-50" />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-4 border border-primary/30 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                AI-Powered Marketplace
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 leading-tight">
                Find the perfect service for your next project
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                Connect with trusted professionals who have been verified by our community. 
                From home repairs to digital design, we've got you covered.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl mx-auto"
              ref={heroSearchRef}
            >
              <div className="bg-white p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2 relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-muted-foreground w-5 h-5" />
                  <Input 
                    placeholder="What service are you looking for?" 
                    className="pl-10 border-0 shadow-none text-slate-900 placeholder:text-slate-400 h-12 text-lg focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => {
                      if (heroSearchResults.length > 0) setHeroSearchOpen(true);
                    }}
                    data-testid="input-home-search"
                  />
                  {heroSearchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Button 
                  size="lg" 
                  className="h-12 px-8 text-lg font-semibold"
                  onClick={() => {
                    const servicesSection = document.querySelector('[data-testid="services-section"]');
                    servicesSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  data-testid="button-home-search"
                >
                  Search
                </Button>
              </div>

              {heroSearchOpen && heroSearchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto">
                  {heroSearchResults.map((result: any) => (
                    <a
                      key={result.id}
                      href={`/service/${result.id}`}
                      className="block w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 transition-colors"
                      data-testid={`hero-search-result-${result.id}`}
                    >
                      <div className="font-medium text-sm">{result.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{result.category}</span>
                        <span>•</span>
                        <span className="font-semibold text-primary">CHF {result.price}/{result.priceUnit}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Popular Categories</h2>
          <Button 
            variant="link" 
            className="text-primary"
            onClick={() => setSelectedCategory("all")}
            data-testid="button-view-all-categories"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`p-6 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 hover:shadow-md ${selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-white border-border hover:border-primary/50'}`}
          >
            <div className="p-3 rounded-full bg-background/10 backdrop-blur-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-medium">All Services</span>
          </button>
          
          {categoriesLoading ? (
            <div className="col-span-4 text-center text-muted-foreground">Loading categories...</div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`p-6 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 hover:shadow-md ${selectedCategory === cat.slug ? 'bg-primary text-white border-primary' : 'bg-white border-border hover:border-primary/50'}`}
              >
                <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                  <span className="text-xl">{cat.icon || '🛠️'}</span> 
                </div>
                <span className="font-medium">{cat.name}</span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Favorites Slider - Only visible for authenticated users with favorites */}
      {isAuthenticated && favorites && favorites.length > 0 && (
        <section className="py-12 container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Your Favorites
              <Badge variant="secondary" className="ml-2">{favorites.length}</Badge>
            </h2>
            <Link href="/favorites">
              <Button variant="ghost" className="gap-1" data-testid="button-view-all-favorites">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4">
              {favorites.map((fav) => (
                <motion.div
                  key={fav.id}
                  className="w-80 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  data-testid={`favorite-card-${fav.id}`}
                >
                  <ServiceCard service={fav.service} />
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </section>
      )}

      {/* Services Grid */}
      <section className="py-12 bg-slate-50" data-testid="services-section">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Top Rated Services</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" /> Filter
              </Button>
            </div>
          </div>

          {servicesLoading ? (
            <div className="text-center py-20">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-slate-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Loading services...</h3>
            </div>
          ) : filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <ServiceCard service={service} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No services found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
