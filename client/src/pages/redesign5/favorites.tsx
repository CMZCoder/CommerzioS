import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, Trash2, Search, Grid3X3, List, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Redesign5Favorites() {
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
      <Card className={`group bg-white border-amber-100 rounded-3xl overflow-hidden relative transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1 ${viewMode === "list" ? "flex flex-row" : ""}`}>
        {/* Remove Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            removeMutation.mutate(favorite.service?.id);
          }}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>

        <Link href={`/redesign5/service/${favorite.service?.id}`} className={viewMode === "list" ? "flex flex-1" : "block"}>
          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-44 h-32" : "aspect-[4/3]"}`}>
            {favorite.service?.images?.[0] ? (
              <img src={favorite.service.images[0]} alt={favorite.service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <Leaf className="w-12 h-12 text-amber-300" />
              </div>
            )}
          </div>
          <div className={`p-5 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                <span className="text-sm font-medium text-amber-700">{favorite.service?.rating || "5.0"}</span>
              </div>
              <span className="text-sm text-amber-600/60">({favorite.service?.reviewCount || 0})</span>
            </div>
            <h3 className="font-semibold text-amber-900 mb-2 line-clamp-1 group-hover:text-amber-700 transition-colors">{favorite.service?.title}</h3>
            <p className="text-sm text-amber-700/60 line-clamp-2 mb-3">{favorite.service?.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold text-amber-900">CHF {favorite.service?.price?.toFixed(0)}</span>
              <span className="text-sm text-amber-600/60 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {favorite.service?.location || "Switzerland"}
              </span>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Favorites</h1>
        <p className="text-amber-700/60">Services you've saved for later</p>
      </motion.div>

      {/* Search & View Toggle */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search favorites..."
            className="pl-12 h-12 bg-white border-amber-200 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
          />
        </div>
        <div className="flex bg-white border border-amber-200 rounded-2xl overflow-hidden self-start">
          <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none h-12 w-12 ${viewMode === "grid" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
            <Grid3X3 className="w-5 h-5 text-amber-700" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none h-12 w-12 border-l border-amber-200 ${viewMode === "list" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
            <List className="w-5 h-5 text-amber-700" />
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-amber-700/60">{filteredFavorites?.length || 0} saved services</p>
      </div>

      {/* Favorites Grid/List */}
      {isLoading ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-72 animate-pulse bg-amber-50 border-amber-100 rounded-3xl" />
          ))}
        </div>
      ) : filteredFavorites?.length ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {filteredFavorites.map((fav, i) => (
            <ServiceCard key={fav.id} favorite={fav} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-rose-400" />
          </div>
          <h3 className="text-xl font-bold text-amber-900 mb-2">No favorites yet</h3>
          <p className="text-amber-700/60 mb-6">Save services to view them here</p>
          <Link href="/redesign5/search">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6">
              Browse Services
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
