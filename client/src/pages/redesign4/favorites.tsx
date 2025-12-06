import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, Trash2, Search, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Redesign4Favorites() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: favorites, isLoading } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
  });

  const removeMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      const res = await apiRequest("DELETE", `/api/favorites/${serviceId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Removed from favorites" });
    },
  });

  const filteredFavorites = favorites?.filter((fav) =>
    fav.service?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ServiceCard = ({ favorite, index }: { favorite: any; index: number }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card className={`group bg-white border-0 shadow-none hover:shadow-md transition-all overflow-hidden relative ${viewMode === "list" ? "flex flex-row" : ""}`}>
        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            removeMutation.mutate(favorite.service?.id);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-100"
        >
          <Trash2 className="w-4 h-4 text-stone-500 stroke-[1.5]" />
        </button>

        <Link href={`/redesign4/service/${favorite.service?.id}`} className={viewMode === "list" ? "flex flex-1" : "block"}>
          <div className={`overflow-hidden bg-stone-100 ${viewMode === "list" ? "w-40 h-32 shrink-0" : "aspect-[4/3]"}`}>
            {favorite.service?.images?.[0] ? (
              <img src={favorite.service.images[0]} alt={favorite.service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">No image</div>
            )}
          </div>
          <div className={`p-5 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 fill-stone-900 stroke-stone-900" />
              <span className="text-sm text-stone-900">{favorite.service?.rating || "5.0"}</span>
              <span className="text-sm text-stone-400">({favorite.service?.reviewCount || 0})</span>
            </div>
            <h3 className="text-stone-900 group-hover:text-stone-600 transition-colors mb-2 line-clamp-1">{favorite.service?.title}</h3>
            <p className="text-sm text-stone-500 line-clamp-2 mb-3">{favorite.service?.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-light text-stone-900">CHF {favorite.service?.price?.toFixed(0)}</span>
              <span className="text-sm text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 stroke-[1.5]" />
                {favorite.service?.location || "Switzerland"}
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-light text-stone-900 mb-2">Favorites</h1>
        <p className="text-stone-500">Services you've saved for later</p>
      </motion.div>

      {/* Search & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search favorites..."
            className="pl-11 h-12 bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
          />
        </div>
        <div className="flex border border-stone-200 self-start">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none h-12 w-12 ${viewMode === "grid" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
            <Grid3X3 className="w-4 h-4 stroke-[1.5]" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none h-12 w-12 border-l border-stone-200 ${viewMode === "list" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
            <List className="w-4 h-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-stone-400">{filteredFavorites?.length || 0} saved services</p>
      </div>

      {/* Favorites Grid/List */}
      {isLoading ? (
        <div className={`grid gap-8 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-stone-100 border-0" />
          ))}
        </div>
      ) : filteredFavorites?.length ? (
        <div className={`grid gap-8 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredFavorites.map((fav, i) => (
            <ServiceCard key={fav.id} favorite={fav} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Heart className="w-12 h-12 mx-auto text-stone-300 mb-4 stroke-[1]" />
          <h3 className="text-xl text-stone-900 mb-2">No favorites yet</h3>
          <p className="text-stone-500 mb-6">Save services to view them here</p>
          <Link href="/redesign4/search">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-none">
              Browse Services
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
