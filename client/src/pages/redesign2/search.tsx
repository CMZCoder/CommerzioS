import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, Filter, Grid3X3, List, Heart, Shield, Zap, Briefcase, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Redesign2Search() {
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
    navigate(`/redesign2/search?${params.toString()}`);
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
      default: return 0;
    }
  });

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-white mb-3">Categories</h3>
        <div className="space-y-2">
          <Button
            variant={!category ? "secondary" : "ghost"}
            size="sm"
            className={`w-full justify-start ${!category ? "bg-purple-500/20 text-purple-300" : "text-white/60 hover:text-white hover:bg-white/10"}`}
            onClick={() => setCategory("")}
          >
            All Categories
          </Button>
          {categories?.map((cat: any) => (
            <Button
              key={cat.id}
              variant={category === String(cat.id) ? "secondary" : "ghost"}
              size="sm"
              className={`w-full justify-start ${category === String(cat.id) ? "bg-purple-500/20 text-purple-300" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              onClick={() => setCategory(String(cat.id))}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Price Range</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={500}
          step={10}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-white/50">
          <span>CHF {priceRange[0]}</span>
          <span>CHF {priceRange[1]}+</span>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Filters</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="verified"
              checked={filters.verified}
              onCheckedChange={(checked) => setFilters(f => ({ ...f, verified: !!checked }))}
              className="border-white/30"
            />
            <Label htmlFor="verified" className="text-white/70 cursor-pointer flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verified Only
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="topRated"
              checked={filters.topRated}
              onCheckedChange={(checked) => setFilters(f => ({ ...f, topRated: !!checked }))}
              className="border-white/30"
            />
            <Label htmlFor="topRated" className="text-white/70 cursor-pointer flex items-center gap-2">
              <Star className="w-4 h-4" />
              Top Rated (4.5+)
            </Label>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full border-white/20 text-white/70 hover:text-white hover:bg-white/10"
        onClick={() => {
          setFilters({ verified: false, topRated: false });
          setPriceRange([0, 500]);
          setCategory("");
        }}
      >
        <X className="w-4 h-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Search services..."
                className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="relative md:w-48">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                placeholder="Location"
                className="pl-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-12 px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-24">
            <FilterPanel />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {query ? `Results for "${query}"` : "All Services"}
              </h1>
              <p className="text-white/50">{sortedServices.length} services found</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden border-white/20 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 backdrop-blur-xl bg-slate-900/95 border-white/10">
                  <SheetHeader>
                    <SheetTitle className="text-white">Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterPanel />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10">
                  <SelectItem value="relevance" className="text-white">Relevance</SelectItem>
                  <SelectItem value="price-low" className="text-white">Price: Low to High</SelectItem>
                  <SelectItem value="price-high" className="text-white">Price: High to Low</SelectItem>
                  <SelectItem value="rating" className="text-white">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <div className="hidden sm:flex gap-1 p-1 backdrop-blur-xl bg-white/5 rounded-xl border border-white/10">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className={viewMode === "grid" ? "bg-purple-500/20 text-purple-300" : "text-white/50 hover:text-white"}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className={viewMode === "list" ? "bg-purple-500/20 text-purple-300" : "text-white/50 hover:text-white"}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 animate-pulse">
                  <div className="h-48 bg-white/10" />
                  <CardContent className="p-4">
                    <div className="h-4 bg-white/10 rounded mb-2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedServices.length === 0 ? (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Search className="w-12 h-12 mx-auto text-white/30 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No services found</h3>
              <p className="text-white/50 mb-4">Try adjusting your search or filters</p>
              <Button
                variant="outline"
                className="border-white/20 text-white"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setFilters({ verified: false, topRated: false });
                }}
              >
                Clear all filters
              </Button>
            </Card>
          ) : (
            <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"}>
              {sortedServices.map((service: any, i: number) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: viewMode === "grid" ? -5 : 0 }}
                >
                  <Link href={`/redesign2/service/${service.id}`}>
                    <Card className={`overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/30 transition-all cursor-pointer group ${viewMode === "list" ? "flex" : ""}`}>
                      <div className={`relative ${viewMode === "grid" ? "h-48" : "w-48 h-36 shrink-0"} bg-gradient-to-br from-purple-900/50 to-pink-900/50`}>
                        {service.images?.[0] ? (
                          <img
                            src={service.images[0]}
                            alt={service.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-12 h-12 text-white/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                        {viewMode === "grid" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Heart className="w-4 h-4" />
                            </Button>

                            <Badge className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm text-white border-0">
                              {service.category?.name || "Service"}
                            </Badge>

                            <div className="absolute bottom-3 left-3">
                              <span className="text-white font-bold text-xl">
                                CHF {service.price || service.basePrice || "50"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <CardContent className={viewMode === "grid" ? "p-4" : "flex-1 p-4"}>
                        {viewMode === "list" && (
                          <Badge className="mb-2 bg-purple-500/20 text-purple-300 border-0">
                            {service.category?.name || "Service"}
                          </Badge>
                        )}
                        <h3 className={`font-semibold text-white mb-2 ${viewMode === "grid" ? "line-clamp-2" : ""} group-hover:text-purple-300 transition-colors`}>
                          {service.title}
                        </h3>

                        {viewMode === "list" && (
                          <p className="text-white/50 text-sm line-clamp-2 mb-2">{service.description}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 border border-white/20">
                            <AvatarImage src={service.user?.profileImage} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                              {service.user?.name?.charAt(0) || "V"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-white/60">{service.user?.name || "Provider"}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-white/60">{service.avgRating?.toFixed(1) || "5.0"}</span>
                          </div>
                          {viewMode === "list" && (
                            <span className="text-xl font-bold text-purple-400 ml-4">
                              CHF {service.price || service.basePrice || "50"}
                            </span>
                          )}
                        </div>

                        {viewMode === "grid" && service.user?.emailVerified && (
                          <Badge className="mt-3 text-xs bg-green-500/20 text-green-300 border-0">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </CardContent>
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
