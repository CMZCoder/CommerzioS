import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, Heart, Share2, MapPin, Clock, Calendar, Shield, CheckCircle,
  MessageCircle, ChevronLeft, ChevronRight, Award, Briefcase, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function Redesign2Service() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    queryKey: [`/api/favorites/check/${id}`],
    enabled: !!user && !!id,
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        await apiRequest(`/api/favorites/${id}`, { method: "DELETE" });
      } else {
        await apiRequest("/api/favorites", { method: "POST", body: JSON.stringify({ serviceId: Number(id) }) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/check/${id}`] });
      toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-white/5 rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-white/5 rounded w-3/4" />
              <div className="h-32 bg-white/5 rounded" />
            </div>
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Briefcase className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Service Not Found</h1>
        <p className="text-white/50 mb-4">This service may have been removed.</p>
        <Link href="/redesign2/search">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Browse Services</Button>
        </Link>
      </div>
    );
  }

  const images = service.images?.length > 0 ? service.images : [null];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Image Gallery */}
      <div className="relative mb-8">
        <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden backdrop-blur-xl bg-white/5 border border-white/10">
          {images[currentImageIndex] ? (
            <img src={images[currentImageIndex]} alt={service.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Briefcase className="w-24 h-24 text-white/20" />
            </div>
          )}
          
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white"
                onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white"
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}

          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full ${isFavorite ? "text-red-400" : "text-white"}`}
              onClick={() => favoriteMutation.mutate()}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge className="mb-2 bg-purple-500/20 text-purple-300 border-0">{service.category?.name}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold text-white">{service.title}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  CHF {service.price || service.basePrice || "50"}
                </div>
                {service.priceType === "hourly" && <span className="text-white/50">per hour</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <span className="font-semibold">{service.avgRating?.toFixed(1) || "5.0"}</span>
                <span className="text-white/50">({service.reviewCount || 0} reviews)</span>
              </div>
              {service.user?.emailVerified && (
                <Badge className="bg-green-500/20 text-green-300 border-0">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-white/5 border border-white/10 rounded-xl p-1">
              <TabsTrigger value="description" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">Reviews ({reviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="provider" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">Provider</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <p className="text-white/70 whitespace-pre-wrap">{service.description || "No description provided."}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {reviews?.length ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <Card key={review.id} className="backdrop-blur-xl bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="border border-white/20">
                            <AvatarImage src={review.reviewer?.profileImage} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">{review.reviewer?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-white">{review.reviewer?.name}</p>
                              <span className="text-sm text-white/50">{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 my-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`} />
                              ))}
                            </div>
                            <p className="text-white/60">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center backdrop-blur-xl bg-white/5 border-white/10">
                  <Star className="w-12 h-12 mx-auto text-white/30 mb-4" />
                  <h3 className="font-semibold text-white mb-2">No reviews yet</h3>
                  <p className="text-white/50">Be the first to review this service!</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="provider" className="mt-6">
              <Card className="backdrop-blur-xl bg-white/5 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 border-2 border-purple-400/50">
                      <AvatarImage src={service.user?.profileImage} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {service.user?.name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-white">{service.user?.name || "Provider"}</h3>
                        {service.user?.emailVerified && <CheckCircle className="w-5 h-5 text-blue-400" />}
                      </div>
                      <p className="text-white/50">@{service.user?.username}</p>
                    </div>
                  </div>
                  <Separator className="my-4 bg-white/10" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-2xl font-bold text-white">5.0</div><div className="text-sm text-white/50">Rating</div></div>
                    <div><div className="text-2xl font-bold text-white">{service.reviewCount || 0}</div><div className="text-sm text-white/50">Reviews</div></div>
                    <div><div className="text-2xl font-bold text-white">98%</div><div className="text-sm text-white/50">Response</div></div>
                  </div>
                  <Link href={`/redesign2/user/${service.user?.id}`}>
                    <Button variant="outline" className="w-full mt-4 border-white/20 text-white hover:bg-white/10">
                      <User className="w-4 h-4 mr-2" />
                      View Full Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24 backdrop-blur-xl bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Book This Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/60">Starting from</span>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                  CHF {service.price || service.basePrice || "50"}
                </div>
              </div>

              <Link href={`/ui2/book/${id}`}>
                <Button className="w-full h-12 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>

              <Link href={`/redesign2/chat?vendor=${service.user?.id}&service=${id}`}>
                <Button variant="outline" className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-xl">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Provider
                </Button>
              </Link>

              <Separator className="bg-white/10" />

              <div className="space-y-3 text-sm">
                {[
                  { icon: Clock, label: "Quick Response", desc: "Usually responds within 1 hour", color: "text-green-400 bg-green-500/20" },
                  { icon: Shield, label: "Secure Booking", desc: "Protected payments", color: "text-blue-400 bg-blue-500/20" },
                  { icon: Award, label: "Satisfaction Guaranteed", desc: "Money back if not satisfied", color: "text-purple-400 bg-purple-500/20" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-white/50 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
