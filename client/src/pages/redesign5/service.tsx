import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Heart, Share2, ChevronLeft, ChevronRight, Check, Calendar, Shield, MessageCircle, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Redesign5Service() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const { data: service, isLoading } = useQuery<any>({
    queryKey: [`/api/services/${id}`],
    enabled: !!id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: [`/api/services/${id}/reviews`],
    enabled: !!id,
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/services/${id}/favorite`);
      return res.json();
    },
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      queryClient.invalidateQueries({ queryKey: [`/api/services/${id}`] });
      toast({ title: isFavorited ? "Removed from favorites" : "Added to favorites" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-96 bg-amber-100 rounded-3xl mb-8" />
          <div className="h-8 bg-amber-100 w-1/3 rounded-full mb-4" />
          <div className="h-4 bg-amber-100 w-2/3 rounded-full" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-4">Service not found</h1>
        <Link href="/redesign5/search">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6">
            Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  const images = service.images?.length ? service.images : ["/placeholder.jpg"];
  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-amber-600/60 mb-6">
        <Link href="/redesign5" className="hover:text-amber-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/redesign5/search" className="hover:text-amber-700 transition-colors">Search</Link>
        <span>/</span>
        <span className="text-amber-900">{service.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group">
            <div className="aspect-[16/10] bg-amber-100 rounded-3xl overflow-hidden">
              <img src={images[currentImageIndex]} alt={service.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronLeft className="w-6 h-6 text-amber-900" />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronRight className="w-6 h-6 text-amber-900" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: any, i: number) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentImageIndex ? "bg-white" : "bg-white/50 hover:bg-white/70"}`} />
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Title & Meta */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="rounded-full bg-amber-100 text-amber-700 px-3">{service.category?.name || "Service"}</Badge>
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full">
                <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                <span className="font-medium text-amber-700">{service.rating || "5.0"}</span>
                <span className="text-amber-600/60">({reviews?.length || 0})</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-amber-900 mb-4">{service.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-amber-700/70">
              <span className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {service.location || "Switzerland"}</span>
              <span className="flex items-center gap-2"><Clock className="w-5 h-5" /> {service.duration || 60} min</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full h-auto bg-amber-50 rounded-2xl p-1.5 gap-1">
              {["description", "reviews", "provider"].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="flex-1 capitalize text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm rounded-xl py-2.5 font-medium transition-all">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <div className="prose prose-amber max-w-none">
                <p className="text-amber-800/80 leading-relaxed">{service.description}</p>
              </div>
              {service.features?.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold text-amber-900 mb-4">What's Included</h3>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {service.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-amber-800/80">
                        <div className="w-6 h-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-amber-600" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="pt-6">
              {reviews?.length ? (
                <div className="space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="pb-6 border-b border-amber-100 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 ring-2 ring-amber-100">
                          <AvatarImage src={review.user?.avatarUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{review.user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-amber-900">{review.user?.name || "Anonymous"}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-500 stroke-amber-500" : "stroke-amber-200"}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-amber-600/60">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-amber-800/80">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-amber-600/60 text-center py-8">No reviews yet. Be the first to review!</p>
              )}
            </TabsContent>

            <TabsContent value="provider" className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="w-20 h-20 ring-4 ring-amber-100">
                  <AvatarImage src={service.provider?.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700 text-2xl">{service.provider?.name?.[0] || "P"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-1">{service.provider?.name || "Service Provider"}</h3>
                  <p className="text-amber-700/70 mb-4">{service.provider?.bio || "Professional service provider"}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-amber-700/70">
                    <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-500 stroke-amber-500" /> {service.provider?.rating || "5.0"} rating</span>
                    <span>{service.provider?.totalServices || 1} services</span>
                    <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Verified</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="bg-white border-amber-100 rounded-3xl p-6 shadow-xl shadow-amber-100/50">
              <div className="mb-6">
                <span className="text-3xl font-bold text-amber-900">CHF {service.price?.toFixed(0)}</span>
                {service.priceType === "hourly" && <span className="text-amber-600/60"> / hour</span>}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-amber-900 mb-3 block">Select Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Today", "Tomorrow", "Wed"].map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`py-3 px-2 text-sm rounded-2xl border-2 transition-all ${selectedDate === day ? "border-amber-500 bg-amber-50 text-amber-900" : "border-amber-100 hover:border-amber-200 text-amber-700"}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-semibold shadow-lg shadow-orange-200/50">
                  <Calendar className="w-5 h-5 mr-2" /> Book Now
                </Button>
                <Button variant="outline" className="w-full h-14 border-amber-200 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-2xl font-semibold">
                  <MessageCircle className="w-5 h-5 mr-2" /> Contact Provider
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-amber-100">
                <button onClick={() => favoriteMutation.mutate()} className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors">
                  <Heart className={`w-5 h-5 ${isFavorited || service.isFavorited ? "fill-rose-500 stroke-rose-500" : ""}`} />
                  <span className="text-sm font-medium">Save</span>
                </button>
                <button className="flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors">
                  <Share2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
