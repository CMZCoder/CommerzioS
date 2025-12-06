import { useState } from "react";
import { Link, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, Grid3X3, List, Star, SlidersHorizontal, X, ChevronDown, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";

export default function Redesign3Search() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });

  const { data: services, isLoading } = useQuery<any[]>({
    queryKey: ["/api/services", { q: searchQuery, category: selectedCategory, location }],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);
    if (selectedCategory) params.set("category", selectedCategory);
    window.history.pushState({}, "", `/redesign3/search?${params.toString()}`);
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-xs font-bold text-cyan-400 mb-3 tracking-wider">// CATEGORIES</h3>
        <div className="space-y-2">
          {categories?.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 p-2 border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition-all group">
              <Checkbox checked={selectedCategory === cat.slug} onCheckedChange={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)} className="border-gray-600 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400" />
              <span className="text-gray-400 text-sm group-hover:text-white transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-bold text-cyan-400 mb-3 tracking-wider">// PRICE RANGE</h3>
        <div className="p-4 border border-gray-800 bg-black">
          <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="mb-4" />
          <div className="flex items-center justify-between text-sm font-mono">
            <span className="text-cyan-400">CHF {priceRange[0]}</span>
            <span className="text-pink-400">CHF {priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <h3 className="text-xs font-bold text-cyan-400 mb-3 tracking-wider">// MINIMUM RATING</h3>
        <div className="flex gap-2">
          {[4, 4.5, 5].map((rating) => (
            <Button key={rating} variant="outline" className="flex-1 border-gray-800 hover:border-cyan-500/50 text-gray-400 hover:text-cyan-400 text-xs font-mono">
              {rating}+ <Star className="w-3 h-3 ml-1 text-yellow-400" />
            </Button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-xs font-bold text-cyan-400 mb-3 tracking-wider">// AVAILABILITY</h3>
        <div className="space-y-2">
          {["Available Now", "This Week", "This Month"].map((option) => (
            <label key={option} className="flex items-center gap-3 p-2 border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition-all">
              <Checkbox className="border-gray-600 data-[state=checked]:bg-cyan-400 data-[state=checked]:border-cyan-400" />
              <span className="text-gray-400 text-sm">{option}</span>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={() => setFiltersOpen(false)} className="w-full bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">
        APPLY FILTERS
      </Button>
    </div>
  );

  const ServiceCard = ({ service, index }: { service: any; index: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/redesign3/service/${service.id}`}>
        <Card className={`group bg-black border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden hover:shadow-[0_0_20px_rgba(0,255,255,0.1)] ${viewMode === "list" ? "flex flex-row" : ""}`}>
          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 h-36" : "h-48"}`}>
            {service.images?.[0] ? (
              <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 grayscale group-hover:grayscale-0" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <Grid3X3 className="w-10 h-10 text-gray-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            {service.isVerified && <Badge className="absolute top-2 left-2 bg-cyan-400 text-black text-[10px] font-bold">VERIFIED</Badge>}
          </div>
          <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold">{service.rating || "5.0"}</span>
              <span className="text-gray-600 text-sm">({service.reviewCount || 0})</span>
            </div>
            <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 line-clamp-1">{service.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-2 font-mono mb-3">{service.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-black text-lg">CHF {service.price?.toFixed(2) || "0.00"}</span>
              <div className="flex items-center text-gray-500 text-xs font-mono">
                <MapPin className="w-3 h-3 mr-1" />
                {service.location || "CH"}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="bg-black border border-cyan-500/30 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="// SEARCH..."
                className="pl-12 h-12 bg-black border-gray-800 text-white placeholder:text-gray-600 focus:border-cyan-400 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="// LOCATION..."
                className="pl-12 h-12 bg-black border-gray-800 text-white placeholder:text-gray-600 focus:border-pink-400 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8 bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">
              SEARCH
            </Button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">
            {searchQuery ? `RESULTS: "${searchQuery.toUpperCase()}"` : "ALL SERVICES"}
          </h1>
          <p className="text-gray-500 font-mono text-sm">// {services?.length || 0} services found</p>
        </div>
        <div className="flex items-center gap-3">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-xs tracking-wider">
                <Filter className="w-4 h-4 mr-2" /> FILTERS
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-black border-r border-cyan-500/50">
              <SheetHeader>
                <SheetTitle className="text-cyan-400 font-bold tracking-wider">FILTERS</SheetTitle>
              </SheetHeader>
              <div className="mt-6"><FilterPanel /></div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-black border-gray-800 text-gray-400 focus:border-cyan-400">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-black border-gray-800">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low</SelectItem>
              <SelectItem value="price_desc">Price: High</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-gray-800">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`${viewMode === "grid" ? "bg-cyan-400/20 text-cyan-400" : "text-gray-600 hover:text-white"}`}>
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`${viewMode === "list" ? "bg-cyan-400/20 text-cyan-400" : "text-gray-600 hover:text-white"}`}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory || searchQuery || location) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory && (
            <Badge className="bg-cyan-400/20 text-cyan-400 border-0 font-mono text-xs">
              {selectedCategory} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory("")} />
            </Badge>
          )}
          {searchQuery && (
            <Badge className="bg-pink-400/20 text-pink-400 border-0 font-mono text-xs">
              "{searchQuery}" <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
          {location && (
            <Badge className="bg-yellow-400/20 text-yellow-400 border-0 font-mono text-xs">
              {location} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocation("")} />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-black border border-gray-800 p-4">
            <h2 className="text-sm font-bold text-cyan-400 mb-4 tracking-wider">// FILTERS</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Results Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64 animate-pulse bg-gray-900 border-gray-800" />
              ))}
            </div>
          ) : services?.length ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {services.map((service, i) => <ServiceCard key={service.id} service={service} index={i} />)}
            </div>
          ) : (
            <Card className="p-12 text-center bg-black border-gray-800">
              <Search className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO RESULTS FOUND</h3>
              <p className="text-gray-500 font-mono">// Try adjusting your search criteria</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
