import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Filter, Grid3X3, List, Star, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function Redesign4Search() {
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
    window.history.pushState({}, "", `/redesign4/search?${params.toString()}`);
  };

  const FilterPanel = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Category</h3>
        <div className="space-y-2">
          {categories?.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox 
                checked={selectedCategory === cat.slug} 
                onCheckedChange={() => setSelectedCategory(selectedCategory === cat.slug ? "" : cat.slug)} 
                className="border-stone-300 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900 rounded-none"
              />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Price Range</h3>
        <div className="px-1">
          <Slider value={priceRange} onValueChange={setPriceRange} max={500} step={10} className="mb-4" />
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>CHF {priceRange[0]}</span>
            <span>CHF {priceRange[1]}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Rating</h3>
        <div className="space-y-2">
          {[4, 4.5, 5].map((rating) => (
            <label key={rating} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox className="border-stone-300 data-[state=checked]:bg-stone-900 data-[state=checked]:border-stone-900 rounded-none" />
              <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors flex items-center gap-1">
                {rating}+ <Star className="w-3 h-3 fill-stone-900 stroke-stone-900" />
              </span>
            </label>
          ))}
        </div>
      </div>

      <Button onClick={() => setFiltersOpen(false)} className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-none">
        Apply Filters
      </Button>
    </div>
  );

  const ServiceCard = ({ service, index }: { service: any; index: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Link href={`/redesign4/service/${service.id}`}>
        <Card className={`group bg-white border-0 shadow-none hover:shadow-md transition-all cursor-pointer overflow-hidden ${viewMode === "list" ? "flex flex-row" : ""}`}>
          <div className={`overflow-hidden bg-stone-100 ${viewMode === "list" ? "w-48 h-36" : "aspect-[4/3]"}`}>
            {service.images?.[0] ? (
              <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">No image</div>
            )}
          </div>
          <div className={`p-5 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-stone-900 stroke-stone-900" />
              <span className="text-sm text-stone-900">{service.rating || "5.0"}</span>
              <span className="text-sm text-stone-400">({service.reviewCount || 0})</span>
            </div>
            <h3 className="text-stone-900 group-hover:text-stone-600 transition-colors mb-2 line-clamp-1">{service.title}</h3>
            <p className="text-sm text-stone-500 line-clamp-2 mb-3">{service.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium text-stone-900">CHF {service.price?.toFixed(0)}</span>
              <span className="text-sm text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 stroke-[1.5]" />
                {service.location || "Switzerland"}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Search Header */}
      <div className="mb-12">
        <div className="bg-white border border-stone-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services..."
                className="pl-11 h-12 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="pl-11 h-12 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-12 px-8 bg-stone-900 hover:bg-stone-800 text-white rounded-none">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-stone-900">
            {searchQuery ? `Results for "${searchQuery}"` : "All Services"}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{services?.length || 0} services found</p>
        </div>
        <div className="flex items-center gap-4">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-none">
                <SlidersHorizontal className="w-4 h-4 mr-2 stroke-[1.5]" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-white border-stone-200">
              <SheetHeader>
                <SheetTitle className="text-stone-900 font-normal">Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-8"><FilterPanel /></div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-white border-stone-200 text-stone-600 focus:ring-stone-900 rounded-none">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white border-stone-200">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price_asc">Price: Low</SelectItem>
              <SelectItem value="price_desc">Price: High</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border border-stone-200">
            <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none ${viewMode === "grid" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
              <Grid3X3 className="w-4 h-4 stroke-[1.5]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none border-l border-stone-200 ${viewMode === "list" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
              <List className="w-4 h-4 stroke-[1.5]" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory || searchQuery || location) && (
        <div className="flex flex-wrap gap-2 mb-8">
          {selectedCategory && (
            <Badge variant="outline" className="rounded-none border-stone-200 text-stone-600">
              {selectedCategory} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSelectedCategory("")} />
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="outline" className="rounded-none border-stone-200 text-stone-600">
              "{searchQuery}" <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSearchQuery("")} />
            </Badge>
          )}
          {location && (
            <Badge variant="outline" className="rounded-none border-stone-200 text-stone-600">
              {location} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setLocation("")} />
            </Badge>
          )}
        </div>
      )}

      <div className="flex gap-12">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-28">
            <h2 className="text-xs uppercase tracking-wider text-stone-400 mb-6">Filters</h2>
            <FilterPanel />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className={`grid gap-8 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64 animate-pulse bg-stone-100 border-0" />
              ))}
            </div>
          ) : services?.length ? (
            <div className={`grid gap-8 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {services.map((service, i) => <ServiceCard key={service.id} service={service} index={i} />)}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Search className="w-12 h-12 mx-auto text-stone-300 mb-4 stroke-[1]" />
              <h3 className="text-xl text-stone-900 mb-2">No results found</h3>
              <p className="text-stone-500">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
