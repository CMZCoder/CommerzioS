import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Heart, Star, MapPin, Trash2, ExternalLink, Search, Grid3X3, List, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function UI2Favorites() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

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
        <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your favorites.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Favorites</h1>
        <p className="text-muted-foreground">Services you've saved for later</p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search favorites..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Favorites Count */}
      <p className="text-sm text-muted-foreground mb-6">
        {filteredFavorites?.length || 0} saved services
      </p>

      {/* Favorites Grid/List */}
      {isLoading ? (
        <div className={`grid ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"} gap-6`}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200" />
              <CardContent className="p-4">
                <div className="h-4 bg-slate-200 rounded mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFavorites?.length ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFavorites.map((fav: any, i: number) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all">
                  <div className="relative h-48 bg-slate-200">
                    {fav.service?.images?.[0] ? (
                      <img
                        src={fav.service.images[0]}
                        alt={fav.service.title}
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
                      className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full text-red-500"
                      onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </Button>

                    <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800">
                      {fav.service?.category?.name || "Service"}
                    </Badge>

                    <div className="absolute bottom-3 left-3">
                      <span className="text-white font-bold text-lg">
                        CHF {fav.service?.price || fav.service?.basePrice || "50"}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/ui2/service/${fav.service?.id}`}>
                      <h3 className="font-semibold mb-2 line-clamp-2 hover:text-violet-600 transition-colors cursor-pointer">
                        {fav.service?.title}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={fav.service?.user?.profileImage} />
                        <AvatarFallback className="text-xs">{fav.service?.user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{fav.service?.user?.name}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{fav.service?.avgRating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/ui2/service/${fav.service?.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFavorites.map((fav: any, i: number) => (
              <motion.div
                key={fav.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="flex">
                    <div className="w-48 h-36 shrink-0 bg-slate-200">
                      {fav.service?.images?.[0] ? (
                        <img
                          src={fav.service.images[0]}
                          alt={fav.service.title}
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
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">
                            {fav.service?.category?.name}
                          </Badge>
                          <Link href={`/ui2/service/${fav.service?.id}`}>
                            <h3 className="font-semibold text-lg hover:text-violet-600 transition-colors cursor-pointer">
                              {fav.service?.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {fav.service?.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-violet-600">
                            CHF {fav.service?.price || fav.service?.basePrice || "50"}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{fav.service?.avgRating?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={fav.service?.user?.profileImage} />
                            <AvatarFallback className="text-xs">{fav.service?.user?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{fav.service?.user?.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/ui2/service/${fav.service?.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => removeFavoriteMutation.mutate(fav.service.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <Card className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No favorites match your search" : "Start saving services you like!"}
          </p>
          <Link href="/ui2/search">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
              Browse Services
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
