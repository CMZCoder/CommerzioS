import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Star, Trash2, Search, Grid3X3, List, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function Redesign2Favorites() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredFavorites = favorites?.filter(fav =>
    fav.service?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Heart className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Please Sign In</h1>
        <p className="text-white/50 mb-4">You need to be logged in to view your favorites.</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Favorites</h1>
        <p className="text-white/50">Services you've saved for later</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Search favorites..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 backdrop-blur-xl bg-white/5 rounded-xl border border-white/10">
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

      <p className="text-sm text-white/50 mb-6">{filteredFavorites?.length || 0} saved services</p>

      {isLoading ? (
        <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 animate-pulse">
              <div className="h-48 bg-white/10" />
              <CardContent className="p-4">
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFavorites?.length ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
          {filteredFavorites.map((fav: any, i: number) => (
            <motion.div
              key={fav.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: viewMode === "grid" ? -5 : 0 }}
            >
              <Card className={`overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/30 transition-all group ${viewMode === "list" ? "flex" : ""}`}>
                <div className={`relative ${viewMode === "grid" ? "h-48" : "w-48 h-36 shrink-0"} bg-gradient-to-br from-purple-900/50 to-pink-900/50`}>
                  {fav.service?.images?.[0] ? (
                    <img src={fav.service.images[0]} alt={fav.service.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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
                        className="absolute top-3 right-3 w-9 h-9 bg-white/10 hover:bg-red-500/30 backdrop-blur-sm rounded-full text-red-400"
                        onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                      <Badge className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm text-white border-0">
                        {fav.service?.category?.name || "Service"}
                      </Badge>
                      <div className="absolute bottom-3 left-3">
                        <span className="text-white font-bold text-xl">CHF {fav.service?.price || fav.service?.basePrice || "50"}</span>
                      </div>
                    </>
                  )}
                </div>

                <CardContent className={viewMode === "grid" ? "p-4" : "flex-1 p-4"}>
                  {viewMode === "list" && (
                    <Badge className="mb-2 bg-purple-500/20 text-purple-300 border-0">{fav.service?.category?.name || "Service"}</Badge>
                  )}
                  <Link href={`/redesign2/service/${fav.service?.id}`}>
                    <h3 className={`font-semibold text-white mb-2 ${viewMode === "grid" ? "line-clamp-2" : ""} hover:text-purple-300 transition-colors cursor-pointer`}>
                      {fav.service?.title}
                    </h3>
                  </Link>

                  {viewMode === "list" && (
                    <p className="text-white/50 text-sm line-clamp-2 mb-2">{fav.service?.description}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6 border border-white/20">
                      <AvatarImage src={fav.service?.user?.profileImage} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">{fav.service?.user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/60">{fav.service?.user?.name}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-white/60">{fav.service?.avgRating?.toFixed(1) || "5.0"}</span>
                    </div>
                    {viewMode === "list" && (
                      <>
                        <span className="text-xl font-bold text-purple-400 ml-4">CHF {fav.service?.price || fav.service?.basePrice || "50"}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-2"
                          onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
          <Heart className="w-16 h-16 mx-auto text-white/30 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No favorites yet</h3>
          <p className="text-white/50 mb-4">{searchQuery ? "No favorites match your search" : "Start saving services you like!"}</p>
          <Link href="/redesign2/search">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Browse Services</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
