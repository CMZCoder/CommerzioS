import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin, Clock, Heart, Share2, ChevronLeft, ChevronRight, Check, Calendar, User, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Redesign4Service() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: service, isLoading } = useQuery<any>({
    queryKey: [`/api/services/${id}`],
    enabled: !!id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: [`/api/services/${id}/reviews`],
    enabled: !!id,
  });

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/services/${id}/favorite`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${id}`] });
      toast({ title: "Added to favorites" });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-96 bg-stone-100 mb-8" />
          <div className="h-8 bg-stone-100 w-1/3 mb-4" />
          <div className="h-4 bg-stone-100 w-2/3" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-light text-stone-900 mb-4">Service not found</h1>
        <Link href="/redesign4/search">
          <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-none">Back to Search</Button>
        </Link>
      </div>
    );
  }

  const images = service.images?.length ? service.images : ["/placeholder.jpg"];

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-stone-500 mb-8">
        <Link href="/redesign4" className="hover:text-stone-900 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/redesign4/search" className="hover:text-stone-900 transition-colors">Search</Link>
        <span>/</span>
        <span className="text-stone-900">{service.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-10">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative group">
            <div className="aspect-[4/3] bg-stone-100 overflow-hidden">
              <img src={images[currentImageIndex]} alt={service.title} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-50">
                  <ChevronLeft className="w-5 h-5 stroke-[1.5]" />
                </button>
                <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-50">
                  <ChevronRight className="w-5 h-5 stroke-[1.5]" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_: any, i: number) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 transition-colors ${i === currentImageIndex ? "bg-stone-900" : "bg-white/70 hover:bg-white"}`} />
                  ))}
                </div>
              </>
            )}
          </motion.div>

          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="rounded-none border-stone-200 text-stone-600 text-xs uppercase tracking-wider">
                {service.category?.name || "Service"}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-stone-900 stroke-stone-900" />
                <span className="text-sm text-stone-900">{service.rating || "5.0"}</span>
                <span className="text-sm text-stone-400">({reviews?.length || 0} reviews)</span>
              </div>
            </div>
            <h1 className="text-3xl font-light text-stone-900 mb-4">{service.title}</h1>
            <div className="flex items-center gap-6 text-sm text-stone-500">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 stroke-[1.5]" /> {service.location || "Switzerland"}</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 stroke-[1.5]" /> {service.duration || 60} min</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full h-auto bg-transparent border-b border-stone-200 rounded-none p-0 gap-8">
              {["description", "reviews", "provider"].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="text-sm uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-900 data-[state=active]:border-b-2 data-[state=active]:border-stone-900 text-stone-400 rounded-none pb-3 px-0">
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="description" className="pt-8">
              <div className="prose prose-stone max-w-none">
                <p className="text-stone-600 leading-relaxed">{service.description}</p>
              </div>
              {service.features?.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Includes</h3>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {service.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-stone-600">
                        <Check className="w-4 h-4 text-stone-900 stroke-[1.5]" /> {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="pt-8">
              {reviews?.length ? (
                <div className="space-y-6">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="pb-6 border-b border-stone-100 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={review.user?.avatarUrl} />
                          <AvatarFallback className="bg-stone-100 text-stone-600">{review.user?.name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-stone-900">{review.user?.name || "Anonymous"}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-stone-900 stroke-stone-900" : "stroke-stone-300"}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-stone-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-500">No reviews yet</p>
              )}
            </TabsContent>

            <TabsContent value="provider" className="pt-8">
              <div className="flex items-start gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={service.provider?.avatarUrl} />
                  <AvatarFallback className="bg-stone-100 text-stone-600 text-xl">{service.provider?.name?.[0] || "P"}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg text-stone-900 mb-1">{service.provider?.name || "Service Provider"}</h3>
                  <p className="text-sm text-stone-500 mb-4">{service.provider?.bio || "Professional service provider"}</p>
                  <div className="flex gap-6 text-sm text-stone-500">
                    <span><strong className="text-stone-900">{service.provider?.totalServices || 1}</strong> services</span>
                    <span><strong className="text-stone-900">{service.provider?.totalReviews || 0}</strong> reviews</span>
                    <span className="flex items-center gap-1"><Shield className="w-4 h-4 stroke-[1.5]" /> Verified</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Booking */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <Card className="bg-white border border-stone-200 rounded-none p-6">
              <div className="mb-6">
                <span className="text-3xl font-light text-stone-900">CHF {service.price?.toFixed(0)}</span>
                {service.priceType === "hourly" && <span className="text-stone-500 text-sm"> / hour</span>}
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs uppercase tracking-wider text-stone-400 mb-2 block">Select Date</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Today", "Tomorrow", "Wed"].map((day, i) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`py-3 px-2 text-sm border transition-colors ${selectedDate === day ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 hover:border-stone-300"}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button className="w-full h-12 bg-stone-900 hover:bg-stone-800 text-white rounded-none">
                  <Calendar className="w-4 h-4 mr-2 stroke-[1.5]" /> Book Now
                </Button>
                <Button variant="outline" className="w-full h-12 border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-none">
                  <MessageCircle className="w-4 h-4 mr-2 stroke-[1.5]" /> Contact Provider
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-stone-100">
                <button onClick={() => favoriteMutation.mutate()} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                  <Heart className={`w-4 h-4 stroke-[1.5] ${service.isFavorited ? "fill-stone-900" : ""}`} /> Save
                </button>
                <button className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
                  <Share2 className="w-4 h-4 stroke-[1.5]" /> Share
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
