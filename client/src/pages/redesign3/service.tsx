import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Shield, ChevronLeft, ChevronRight, Heart, Share2, Calendar, MessageCircle, User, CheckCircle, Zap, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function Redesign3Service() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });

  const { data: service, isLoading } = useQuery<any>({
    queryKey: [`/api/services/${id}`],
    enabled: !!id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: [`/api/services/${id}/reviews`],
    enabled: !!id,
  });

  const { data: isFavorite } = useQuery<boolean>({
    queryKey: [`/api/favorites/${id}`],
    enabled: !!user && !!id,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest(`/api/favorites/${id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/favorites", { method: "POST", body: JSON.stringify({ serviceId: id }) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-900 mb-8" />
          <div className="h-8 w-64 bg-gray-900 mb-4" />
          <div className="h-4 w-full bg-gray-900" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Zap className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">SERVICE NOT FOUND</h1>
        <p className="text-gray-500 font-mono mb-4">// The requested service does not exist</p>
        <Link href="/redesign3/search">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">BROWSE SERVICES</Button>
        </Link>
      </div>
    );
  }

  const images = service.images?.length ? service.images : [null];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6 font-mono text-gray-500">
        <Link href="/redesign3"><span className="hover:text-cyan-400 cursor-pointer">HOME</span></Link>
        <span>/</span>
        <Link href="/redesign3/search"><span className="hover:text-cyan-400 cursor-pointer">SEARCH</span></Link>
        <span>/</span>
        <span className="text-cyan-400">{service.title?.toUpperCase()}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-black border border-gray-800 overflow-hidden">
              {images[selectedImage] ? (
                <img src={images[selectedImage]} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                  <Zap className="w-20 h-20 text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {images.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 border border-cyan-500/30">
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/80 border border-cyan-500/30">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-20 h-20 shrink-0 border-2 transition-all ${selectedImage === i ? "border-cyan-400" : "border-gray-800 hover:border-gray-600"}`}>
                    {img ? <img src={img} alt="" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" /> : <div className="w-full h-full bg-gray-900" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Actions */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-black text-white mb-2">{service.title}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-bold ml-1">{service.rating || "5.0"}</span>
                    <span className="text-gray-500 ml-1">({service.reviewCount || 0} reviews)</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    {service.location || "Switzerland"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => toggleFavoriteMutation.mutate()} className={`border-gray-800 ${isFavorite ? "text-pink-400 border-pink-500/50" : "text-gray-500 hover:text-pink-400 hover:border-pink-500/50"}`}>
                  <Heart className={`w-5 h-5 ${isFavorite ? "fill-pink-400" : ""}`} />
                </Button>
                <Button variant="outline" size="icon" className="border-gray-800 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {service.isVerified && (
              <Badge className="bg-cyan-400/20 text-cyan-400 border-0 font-bold text-xs tracking-wider">
                <Shield className="w-3 h-3 mr-1" /> VERIFIED PROVIDER
              </Badge>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview">
            <TabsList className="bg-black border border-gray-800 p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">OVERVIEW</TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">REVIEWS</TabsTrigger>
              <TabsTrigger value="provider" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">PROVIDER</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="bg-black border border-gray-800">
                <CardHeader>
                  <CardTitle className="text-cyan-400 text-sm tracking-wider">// DESCRIPTION</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 whitespace-pre-wrap font-mono text-sm">{service.description}</p>
                </CardContent>
              </Card>
              
              {service.features?.length > 0 && (
                <Card className="bg-black border border-gray-800 mt-6">
                  <CardHeader>
                    <CardTitle className="text-cyan-400 text-sm tracking-wider">// FEATURES</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-3">
                      {service.features.map((feature: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6 space-y-4">
              {reviews?.length ? (
                reviews.map((review, i) => (
                  <Card key={i} className="bg-black border border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center shrink-0">
                          <span className="text-cyan-400 font-bold">{review.user?.name?.[0] || "U"}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-bold text-white">{review.user?.name || "Anonymous"}</p>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-600 font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-gray-400 text-sm font-mono">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-black border border-gray-800 p-8 text-center">
                  <Star className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                  <p className="text-gray-500 font-mono">// No reviews yet</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="provider" className="mt-6">
              <Card className="bg-black border border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 border-2 border-cyan-400 flex items-center justify-center">
                      {service.provider?.profileImage ? (
                        <Avatar className="w-14 h-14">
                          <AvatarImage src={service.provider.profileImage} />
                        </Avatar>
                      ) : (
                        <User className="w-8 h-8 text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{service.provider?.name || "Provider"}</h3>
                      <p className="text-gray-500 text-sm font-mono">Member since {new Date(service.provider?.createdAt || Date.now()).getFullYear()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 border border-gray-800">
                      <p className="text-2xl font-black text-cyan-400">{service.provider?.completedBookings || 0}</p>
                      <p className="text-xs text-gray-500">BOOKINGS</p>
                    </div>
                    <div className="text-center p-3 border border-gray-800">
                      <p className="text-2xl font-black text-pink-400">{service.provider?.rating || "5.0"}</p>
                      <p className="text-xs text-gray-500">RATING</p>
                    </div>
                    <div className="text-center p-3 border border-gray-800">
                      <p className="text-2xl font-black text-yellow-400">{service.provider?.responseTime || "<1h"}</p>
                      <p className="text-xs text-gray-500">RESPONSE</p>
                    </div>
                  </div>
                  <Link href={`/redesign3/chat?provider=${service.providerId}`}>
                    <Button variant="outline" className="w-full border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 font-bold tracking-wider">
                      <MessageCircle className="w-4 h-4 mr-2" /> CONTACT PROVIDER
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="bg-black border border-cyan-500/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
              <CardHeader className="relative">
                <CardTitle className="text-white">
                  <span className="text-3xl font-black text-cyan-400">CHF {service.price?.toFixed(2) || "0.00"}</span>
                  <span className="text-sm text-gray-500 font-normal ml-2">/ {service.priceUnit || "session"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Duration: {service.duration || "60"} min
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Available: Mon - Sat
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400 font-mono">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  Secure Payment
                </div>
                
                <Link href={user ? `/redesign3/book/${service.id}` : "/login"}>
                  <Button className="w-full h-14 bg-cyan-400 hover:bg-cyan-300 text-black font-black tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                    BOOK NOW
                  </Button>
                </Link>
                
                <Link href={`/redesign3/chat?service=${service.id}`}>
                  <Button variant="outline" className="w-full border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 font-bold tracking-wider">
                    <MessageCircle className="w-4 h-4 mr-2" /> ASK QUESTION
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
