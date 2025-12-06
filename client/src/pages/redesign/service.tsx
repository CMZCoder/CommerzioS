import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Star, Heart, Share2, MapPin, Clock, Calendar, Shield, CheckCircle,
  MessageCircle, Phone, Mail, ChevronLeft, ChevronRight, Zap, Award,
  ThumbsUp, Flag, ExternalLink, Briefcase, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function UI2Service() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

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
        await apiRequest("/api/favorites", { 
          method: "POST",
          body: JSON.stringify({ serviceId: Number(id) })
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/check/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-slate-200 rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-32 bg-slate-200 rounded" />
            </div>
            <div className="h-64 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Service Not Found</h1>
        <p className="text-muted-foreground mb-4">This service may have been removed or doesn't exist.</p>
        <Link href="/ui2/search">
          <Button>Browse Services</Button>
        </Link>
      </div>
    );
  }

  const images = service.images?.length > 0 ? service.images : [null];
  const displayedReviews = showAllReviews ? reviews : reviews?.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/ui2">
          <a className="hover:text-foreground">Home</a>
        </Link>
        <span>/</span>
        <Link href="/ui2/search">
          <a className="hover:text-foreground">Services</a>
        </Link>
        <span>/</span>
        <Link href={`/ui2/search?category=${service.category?.id}`}>
          <a className="hover:text-foreground">{service.category?.name}</a>
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">{service.title}</span>
      </div>

      {/* Image Gallery */}
      <div className="relative mb-8">
        <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-slate-200">
          {images[currentImageIndex] ? (
            <img
              src={images[currentImageIndex]}
              alt={service.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Briefcase className="w-24 h-24 text-slate-400" />
            </div>
          )}
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg"
                onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg"
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              
              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_: any, i: number) => (
                  <button
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`bg-white/90 hover:bg-white rounded-full shadow-lg ${
                isFavorite ? "text-red-500" : ""
              }`}
              onClick={() => favoriteMutation.mutate()}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-white/90 hover:bg-white rounded-full shadow-lg"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {images.map((img: string, i: number) => (
              <button
                key={i}
                className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 ${
                  i === currentImageIndex ? "ring-2 ring-violet-500" : ""
                }`}
                onClick={() => setCurrentImageIndex(i)}
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                    <Briefcase className="w-6 h-6 text-slate-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Title Section */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <Badge className="mb-2">{service.category?.name}</Badge>
                <h1 className="text-2xl md:text-3xl font-bold">{service.title}</h1>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-violet-600">
                  CHF {service.price || service.basePrice || "50"}
                </div>
                {service.priceType === "hourly" && (
                  <span className="text-muted-foreground">per hour</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.avgRating?.toFixed(1) || "5.0"}</span>
                <span className="text-muted-foreground">({service.reviewCount || 0} reviews)</span>
              </div>
              {service.location && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {service.location}
                </div>
              )}
              {service.user?.emailVerified && (
                <Badge variant="secondary">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified Provider
                </Badge>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews?.length || 0})</TabsTrigger>
              <TabsTrigger value="provider">Provider</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {service.description || "No description provided."}
                </p>
              </div>

              {/* Features/Tags */}
              {service.tags?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              {displayedReviews?.length ? (
                <div className="space-y-6">
                  {displayedReviews.map((review: any) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={review.reviewer?.profileImage} />
                            <AvatarFallback>{review.reviewer?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{review.reviewer?.name}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {reviews && reviews.length > 3 && !showAllReviews && (
                    <Button variant="outline" className="w-full" onClick={() => setShowAllReviews(true)}>
                      Show All {reviews.length} Reviews
                    </Button>
                  )}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">Be the first to review this service!</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="provider" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={service.user?.profileImage} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        {service.user?.name?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{service.user?.name || "Provider"}</h3>
                        {service.user?.emailVerified && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-muted-foreground">@{service.user?.username}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Member since {new Date(service.user?.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">5.0</div>
                      <div className="text-sm text-muted-foreground">Rating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{service.reviewCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Reviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-sm text-muted-foreground">Response</div>
                    </div>
                  </div>

                  <Link href={`/ui2/user/${service.user?.id}`}>
                    <Button variant="outline" className="w-full mt-4">
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
          <Card className="sticky top-24 shadow-lg">
            <CardHeader>
              <CardTitle>Book This Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <span className="text-muted-foreground">Starting from</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-violet-600">
                    CHF {service.price || service.basePrice || "50"}
                  </div>
                  {service.priceType === "hourly" && (
                    <span className="text-sm text-muted-foreground">per hour</span>
                  )}
                </div>
              </div>

              <Link href={`/ui2/book/${id}`}>
                <Button className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>

              <Link href={`/ui2/chat?vendor=${service.user?.id}&service=${id}`}>
                <Button variant="outline" className="w-full h-12">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Contact Provider
                </Button>
              </Link>

              <Separator />

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Quick Response</p>
                    <p className="text-muted-foreground">Usually responds within 1 hour</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Secure Booking</p>
                    <p className="text-muted-foreground">Protected payments & escrow</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                    <Award className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">Satisfaction Guaranteed</p>
                    <p className="text-muted-foreground">Money back if not satisfied</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
