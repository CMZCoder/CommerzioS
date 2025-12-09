import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Star, MapPin, Grid3X3, List, Trash2, ExternalLink, Zap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Redesign3Favorites() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: favorites, isLoading } = useQuery<any[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (serviceId: number) => {
      await apiRequest(`/api/favorites/${serviceId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: "Removed from favorites" });
    },
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Heart className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Login required to view saved services</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  const ServiceCard = ({ favorite, index }: { favorite: any; index: number }) => {
    const service = favorite.service;
    
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className={`group bg-black border border-gray-800 hover:border-cyan-500/50 transition-all overflow-hidden ${viewMode === "list" ? "flex flex-row" : ""}`}>
          <div className={`relative overflow-hidden ${viewMode === "list" ? "w-40 h-full" : "h-48"}`}>
            {service?.images?.[0] ? (
              <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                <Zap className="w-10 h-10 text-gray-700" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.preventDefault(); removeFavoriteMutation.mutate(service.id); }}
              className="absolute top-2 right-2 text-pink-400 hover:text-pink-300 hover:bg-pink-500/20"
            >
              <Heart className="w-5 h-5 fill-pink-400" />
            </Button>
          </div>

          <CardContent className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-bold">{service?.rating || "5.0"}</span>
              <span className="text-gray-600 text-sm">({service?.reviewCount || 0})</span>
            </div>
            
            <Link href={`/redesign3/service/${service?.id}`}>
              <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 cursor-pointer">{service?.title || "Service"}</h3>
            </Link>
            
            <p className="text-gray-500 text-sm line-clamp-2 font-mono mb-3">{service?.description || "No description"}</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-cyan-400 font-black text-lg">CHF {service?.price?.toFixed(2) || "0.00"}</span>
              <div className="flex items-center text-gray-500 text-xs font-mono">
                <MapPin className="w-3 h-3 mr-1" />
                {service?.location || "CH"}
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/redesign3/service/${service?.id}`} className="flex-1">
                <Button variant="outline" className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-xs tracking-wider">
                  VIEW <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeFavoriteMutation.mutate(service?.id)}
                className="border-gray-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">SAVED SERVICES</h1>
          <p className="text-gray-500 font-mono text-sm">// {favorites?.length || 0} services saved</p>
        </div>
        <div className="flex items-center gap-3">
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

      {isLoading ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-900 border-gray-800" />
          ))}
        </div>
      ) : favorites?.length ? (
        <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {favorites.map((favorite, i) => <ServiceCard key={favorite.id} favorite={favorite} index={i} />)}
        </div>
      ) : (
        <Card className="bg-black border border-gray-800 p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">NO SAVED SERVICES</h3>
          <p className="text-gray-500 font-mono mb-4">// Save services to access them quickly</p>
          <Link href="/redesign3/search">
            <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">
              <Search className="w-4 h-4 mr-2" /> BROWSE SERVICES
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
