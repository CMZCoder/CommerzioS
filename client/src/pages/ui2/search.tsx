import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, Filter, Grid3X3, List, Map, ChevronDown,
  Heart, Shield, Zap, Clock, SlidersHorizontal, X, Check, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function UI2Search() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("relevance");
  const [filters, setFilters] = useState({
    verified: false,
    topRated: false,
    availableToday: false,
    instantBooking: false,
  });

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services, isLoading } = useQuery<any[]>({
    queryKey: ["/api/services", { search: query, categoryId: category }],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (category) params.set("category", category);
    navigate(`/ui2/search?${params.toString()}`);
  };

  const filteredServices = services?.filter((service: any) => {
    if (filters.verified && !service.user?.emailVerified) return false;
    if (filters.topRated && (service.avgRating || 0) < 4.5) return false;
    const price = service.price || service.basePrice || 0;
    if (price < priceRange[0] || price > priceRange[1]) return false;
    return true;
  }) || [];

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "price-low": return (a.price || a.basePrice || 0) - (b.price || b.basePrice || 0);
      case "price-high": return (b.price || b.basePrice || 0) - (a.price || a.basePrice || 0);
      case "rating": return (b.avgRating || 0) - (a.avgRating || 0);
      case "reviews": return (b.reviewCount || 0) - (a.reviewCount || 0);
      default: return 0;
    }
  });

  const FilterSidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`space-y-6 ${mobile ? "" : "sticky top-24"}`}>
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          <Button
            variant={!category ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => setCategory("")}
          >
            All Categories
          </Button>
          {categories?.map((cat: any) => (
            <Button
              key={cat.id}
              variant={category === String(cat.id) ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              onClick={() => setCategory(String(cat.id))}
            >
              {cat.name}
              <Badge variant="outline" className="ml-auto">{cat._count?.services || 0}</Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={500}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>CHF {priceRange[0]}</span>
            <span>CHF {priceRange[1]}+</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div>
        <h3 className="font-semibold mb-3">Quick Filters</h3>
        <div className="space-y-3">
          {[
            { key: "verified", label: "Verified Providers", icon: Shield },
            { key: "topRated", label: "Top Rated (4.5+)", icon: Star },
            { key: "availableToday", label: "Available Today", icon: Clock },
            { key: "instantBooking", label: "Instant Booking", icon: Zap },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={filters[key as keyof typeof filters]}
                onCheckedChange={(checked) => setFilters(f => ({ ...f, [key]: !!checked }))}
              />
              <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setFilters({ verified: false, topRated: false, availableToday: false, instantBooking: false });
          setPriceRange([0, 500]);
          setCategory("");
        }}
      >
        <X className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <Card className="p-4 shadow-lg">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                className="pl-12 h-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Location"
                className="pl-12 h-12"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-gradient-to-r from-violet-600 to-indigo-600">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </form>
        </Card>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <FilterSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {query ? `Results for "${query}"` : "All Services"}
              </h1>
              <p className="text-muted-foreground">
                {sortedServices.length} services found
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar mobile />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")} className="hidden sm:block">
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid3X3 className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Active Filters */}
          {(Object.values(filters).some(v => v) || category || priceRange[0] > 0 || priceRange[1] < 500) && (
            <div className="flex flex-wrap gap-2 mb-6">
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {categories?.find(c => String(c.id) === category)?.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setCategory("")} />
                </Badge>
              )}
              {filters.verified && (
                <Badge variant="secondary" className="gap-1">
                  Verified
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, verified: false }))} />
                </Badge>
              )}
              {filters.topRated && (
                <Badge variant="secondary" className="gap-1">
                  Top Rated
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, topRated: false }))} />
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 500) && (
                <Badge variant="secondary" className="gap-1">
                  CHF {priceRange[0]} - {priceRange[1]}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setPriceRange([0, 500])} />
                </Badge>
              )}
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-slate-200" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-slate-200 rounded mb-2" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedServices.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => {
                setQuery("");
                setCategory("");
                setFilters({ verified: false, topRated: false, availableToday: false, instantBooking: false });
              }}>
                Clear all filters
              </Button>
            </Card>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedServices.map((service: any, i: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Link href={`/ui2/service/${service.id}`}>
                    <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                      <div className="relative h-48 bg-slate-200">
                        {service.images?.[0] ? (
                          <img
                            src={service.images[0]}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-16 h-16 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full"
                          onClick={(e) => e.preventDefault()}
                        >
                          <Heart className="w-4 h-4" />
                        </Button>

                        <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800">
                          {service.category?.name || "Service"}
                        </Badge>

                        <div className="absolute bottom-3 left-3">
                          <span className="text-white font-bold text-lg">
                            CHF {service.price || service.basePrice || "50"}
                            {service.priceType === "hourly" ? "/hr" : ""}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                          {service.title}
                        </h3>

                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={service.user?.profileImage} />
                            <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                              {service.user?.name?.charAt(0) || "V"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{service.user?.name || "Provider"}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{service.avgRating?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {service.user?.emailVerified && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedServices.map((service: any, i: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/ui2/service/${service.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                      <div className="flex">
                        <div className="relative w-48 h-36 shrink-0 bg-slate-200">
                          {service.images?.[0] ? (
                            <img
                              src={service.images[0]}
                              alt={service.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Briefcase className="w-12 h-12 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <CardContent className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="secondary" className="mb-2">{service.category?.name}</Badge>
                              <h3 className="font-semibold text-lg group-hover:text-violet-600 transition-colors">
                                {service.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {service.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-violet-600">
                                CHF {service.price || service.basePrice || "50"}
                              </div>
                              <div className="flex items-center gap-1 justify-end mt-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{service.avgRating?.toFixed(1) || "5.0"}</span>
                                <span className="text-muted-foreground">({service.reviewCount || 0})</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={service.user?.profileImage} />
                              <AvatarFallback className="text-xs">{service.user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{service.user?.name}</span>
                            {service.user?.emailVerified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
