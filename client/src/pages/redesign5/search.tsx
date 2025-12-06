import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, Grid3X3, List, Star, X, SlidersHorizontal, Leaf, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function Redesign5Search() {
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
    window.history.pushState({}, "", `/redesign5/search?${params.toString()}`);
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-4">Category</h3>
        <div className="space-y-3">
          {categories?.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={selectedCategory === cat.slug} 
                onCheckedChange={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)} 
                className="border-amber-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500 data-[state=checked]:border-amber-500 rounded-lg"
              />
              <span className="text-sm text-amber-800 group-hover:text-amber-600 transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-4">Price Range</h3>
        <div className="px-1">
          <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="mb-4" />
          <div className="flex items-center justify-between text-sm text-amber-700">
            <span>CHF {priceRange[0]}</span>
            <span>CHF {priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-amber-900 mb-4">Rating</h3>
        <div className="space-y-3">
          {[4, 4.5, 5].map((rating) => (
            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox className="border-amber-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-amber-500 data-[state=checked]:to-orange-500 data-[state=checked]:border-amber-500 rounded-lg" />
              <span className="text-sm text-amber-800 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                {rating}+ <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={() => setFiltersOpen(false)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl h-12">
        Apply Filters
      </Button>
    </div>
  );

  const ServiceCard = ({ service, index }: { service: any; index: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/redesign5/service/${service.id}`}>
        <Card className={`group bg-white border-amber-100 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1 ${viewMode === "list" ? "flex flex-row" : ""}`}>
          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 h-36" : "aspect-[4/3]"}`}>
            {service.images?.[0] ? (
              <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Leaf className="w-12 h-12 text-amber-300" />
              </div>
            )}
            <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
              <Heart className="w-4 h-4 text-amber-600" />
            </button>
          </div>
          <div className={`p-5 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                <span className="text-sm font-medium text-amber-700">{service.rating || "5.0"}</span>
              </div>
              <span className="text-sm text-amber-600/60">({service.reviewCount || 0})</span>
            </div>
            <h3 className="font-semibold text-amber-900 mb-2 line-clamp-1 group-hover:text-amber-700 transition-colors">{service.title}</h3>
            <p className="text-sm text-amber-700/60 line-clamp-2 mb-3">{service.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-amber-900">CHF {service.price?.toFixed(0)}</span>
              <span className="text-sm text-amber-600/60 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {service.location || "Switzerland"}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Search Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="bg-white rounded-3xl shadow-lg shadow-amber-100/50 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="pl-12 h-12 bg-amber-50/50 border-0 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="pl-12 h-12 bg-amber-50/50 border-0 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-200/50 font-semibold">
              Search
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Results Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">
            {searchQuery ? `Results for "${searchQuery}"` : "All Services"}
          </h1>
          <p className="text-amber-700/60 mt-1">{services?.length || 0} services found</p>
        </div>
        <div className="flex items-center gap-3">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden border-amber-200 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-2xl">
                <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-gradient-to-b from-amber-50 to-white border-amber-100">
              <SheetHeader>
                <SheetTitle className="text-amber-900 font-bold">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8"><FilterPanel /></div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-white border-amber-200 text-amber-700 focus:ring-amber-300 rounded-2xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white border-amber-200 rounded-2xl">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low</SelectItem>
              <SelectItem value="price_desc">Price: High</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex bg-white border border-amber-200 rounded-2xl overflow-hidden">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none ${viewMode === "grid" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
              <Grid3X3 className="w-4 h-4 text-amber-700" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none border-l border-amber-200 ${viewMode === "list" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
              <List className="w-4 h-4 text-amber-700" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory || searchQuery || location) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {selectedCategory && (
            <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1">
              {selectedCategory} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory("")} />
            </Badge>
          )}
          {searchQuery && (
            <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1">
              "{searchQuery}" <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
          {location && (
            <Badge className="rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1">
              {location} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocation("")} />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-white rounded-3xl border border-amber-100 p-6">
            <h2 className="text-sm font-semibold text-amber-900 mb-6">Filters</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-72 animate-pulse bg-amber-50 border-amber-100 rounded-3xl" />
              ))}
            </div>
          ) : services?.length ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {services.map((service, i) => <ServiceCard key={service.id} service={service} index={i} />)}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">No results found</h3>
              <p className="text-amber-700/60">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
