import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useRoute, useLocation, Link, useSearch } from "wouter";
import {
  Star,
  MapPin,
  Clock,
  Shield,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Award,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Flag,
  Lock,
  Send,
  Reply,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails, type ReviewWithUser } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ServiceMap } from "@/components/service-map";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useEmblaCarousel from "embla-carousel-react";

// Route guard wrapper
export default function ServiceDetail() {
  const [match, params] = useRoute("/service/:id");

  if (!match) return null;

  if (!params?.id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl font-semibold text-destructive mb-2">Invalid Service</p>
            <p className="text-muted-foreground">No service ID provided</p>
            <Button onClick={() => window.location.href = "/"} className="mt-4">Return to Home</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return <ServiceDetailContent serviceId={params.id} />;
}

function ServiceDetailContent({ serviceId }: { serviceId: string }) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const reviewFormRef = useRef<HTMLDivElement>(null);

  // Carousel State
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrentImageIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [serviceId]);

  const { data: service, isLoading: serviceLoading, error: serviceError } = useQuery<ServiceWithDetails>({
    queryKey: [`/api/services/${serviceId}`],
    queryFn: () => apiRequest(`/api/services/${serviceId}`),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: [`/api/services/${serviceId}/reviews`],
    queryFn: () => apiRequest(`/api/services/${serviceId}/reviews`),
    enabled: !!service,
  });

  const { data: savedStatus } = useQuery({
    queryKey: [`/api/favorites/${serviceId}/status`],
    queryFn: () => apiRequest<{ isFavorite: boolean }>(`/api/favorites/${serviceId}/status`),
    enabled: isAuthenticated && !!service,
  });

  useEffect(() => {
    if (savedStatus?.isFavorite !== undefined) {
      setIsSaved(savedStatus.isFavorite);
    }
  }, [savedStatus]);

  const createReviewMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      apiRequest(`/api/services/${serviceId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}`] });
      toast({ title: "Review Submitted", description: "Your review has been posted successfully." });
      setReviewText("");
      setRating(5);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to submit review.", variant: "destructive" });
    },
  });

  const toggleSaved = useMutation({
    mutationFn: async ({ action }: { action: 'add' | 'remove' }) => {
      if (action === 'remove') {
        await apiRequest(`/api/favorites/${serviceId}`, { method: "DELETE" });
      } else {
        await apiRequest(`/api/favorites/${serviceId}`, { method: "POST" });
      }
    },
    onMutate: async ({ action }) => {
      const previousState = isSaved;
      setIsSaved(action === 'add');
      return { previousState };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${serviceId}/status`] });
      toast({
        title: variables.action === 'add' ? "Service saved" : "Removed from saved",
        description: variables.action === 'add' ? "Service added to your saved services" : "Service removed from your saved services",
      });
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousState !== undefined) setIsSaved(context.previousState);
      toast({ title: "Error", description: error.message || "Failed to update saved services", variant: "destructive" });
    },
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.log("Geolocation permission denied:", error)
      );
    }
  }, []);

  // Handle ?review=true query param
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('review') === 'true' && reviewFormRef.current && service) {
      setTimeout(() => {
        reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (isAuthenticated && user?.isVerified) {
          const textarea = reviewFormRef.current?.querySelector('textarea');
          if (textarea) setTimeout(() => textarea.focus(), 500);
        }
      }, 300);
    }
  }, [searchString, service, isAuthenticated, user]);

  const handleSubmitReview = () => {
    if (!user?.isVerified) {
      toast({ title: "Verification Required", description: "You must complete identity verification to leave reviews.", variant: "destructive" });
      return;
    }
    if (!reviewText.trim()) {
      toast({ title: "Error", description: "Please write a review comment.", variant: "destructive" });
      return;
    }
    createReviewMutation.mutate({ rating, comment: reviewText });
  };

  // Share functionality
  const serviceUrl = typeof window !== 'undefined' ? `${window.location.origin}/service/${serviceId}` : '';
  const shareTitle = service?.title || 'Check out this service';

  const copyServiceLink = async () => {
    try {
      await navigator.clipboard.writeText(serviceUrl);
      toast({ title: "Link copied!", description: "Service link copied to clipboard" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy link", variant: "destructive" });
    }
  };

  // Computed values
  const totalBookings = service?.owner?.totalCompletedBookings || 0;
  const satisfactionRate = service?.owner?.satisfactionRate ? parseFloat(service.owner.satisfactionRate) : 0;
  const isTopVendor = service?.owner?.topVendor || false;
  const minHours = service?.minBookingHours || 1;
  const whatsIncluded = (service?.whatsIncluded || []) as string[];
  const isFeatured = service?.featured || false;
  const certifications = (service?.owner?.certifications || []) as Array<{ name: string; year?: number }>;
  const vendorBio = service?.owner?.vendorBio || '';

  // Rating breakdown
  const ratingBreakdown = reviews.reduce((acc, review) => {
    const r = review.rating;
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (serviceLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Loading service...</h1>
        </div>
      </Layout>
    );
  }

  if (serviceError || !service) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Service not found</h1>
          <Button onClick={() => setLocation("/")} className="mt-4">Go Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Archived/Inactive Service Banner */}
      {(service.status === "expired" || service.status === "paused") && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 text-amber-800">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {service.status === "expired" ? "This service listing has expired" : "This service is currently paused"}
                </p>
                <p className="text-sm text-amber-700">
                  This is an archived preview. The vendor is no longer accepting new bookings.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden group">
                {service.images && service.images.length > 0 ? (
                  <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex">
                      {service.images.map((img, idx) => (
                        <div key={idx} className="flex-[0_0_100%] min-w-0">
                          <img src={img} alt={`${service.title} - ${idx + 1}`} className="w-full h-96 object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-96 bg-muted flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-muted-foreground opacity-20" />
                  </div>
                )}
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {isFeatured && <Badge>Featured</Badge>}
                  {isTopVendor && <Badge variant="secondary">Top Rated</Badge>}
                </div>
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      if (!isAuthenticated) { setLocation("/auth"); return; }
                      toggleSaved.mutate({ action: isSaved ? 'remove' : 'add' });
                    }}
                  >
                    <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={copyServiceLink}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* Carousel Controls */}
                {service.images && service.images.length > 1 && (
                  <>
                    <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={scrollPrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={scrollNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {service.images && service.images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {service.images.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${i === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                      onClick={() => emblaApi?.scrollTo(i)}
                    >
                      <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-24 object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">{service.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className={`h-5 w-5 ${service.reviewCount > 0 ? 'fill-accent text-accent' : 'fill-muted text-muted'}`} />
                      <span className="font-semibold text-lg">{service.rating?.toFixed(1) || '0.0'}</span>
                      <span className="text-muted-foreground">({service.reviewCount} reviews)</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {service.locations?.[0] || 'Switzerland'}
                    </div>
                    {totalBookings > 0 && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {totalBookings.toLocaleString()}+ bookings
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Info Card */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={service.owner.profileImageUrl || undefined} />
                      <AvatarFallback>{service.owner.firstName?.[0]}{service.owner.lastName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={`/users/${service.owner.id}`} className="font-semibold text-lg hover:text-primary transition-colors">
                          {service.owner.firstName} {service.owner.lastName}
                        </Link>
                        {service.owner.isVerified && <Shield className="h-4 w-4 text-accent" />}
                        {isTopVendor && <Badge variant="secondary" className="text-xs">Top Vendor</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Verified Vendor · Member since {new Date(service.owner.createdAt).getFullYear()}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/users/${service.owner.id}`}>View Profile</Link>
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setLocation(`/chat?vendor=${service.owner.id}&service=${serviceId}`)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="about">About Vendor</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Service Description</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="leading-relaxed whitespace-pre-wrap">{service.description}</p>
                    </div>
                  </div>

                  {whatsIncluded.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3">What's Included</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {whatsIncluded.map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Service Area</h3>
                    <p className="text-muted-foreground mb-4">
                      Available in {service.locations?.[0] || 'Switzerland'} and surrounding areas
                    </p>
                    <ServiceMap service={service} userLocation={userLocation} />
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{service.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Standard service pricing</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-bold">CHF {service.price}</span>
                        <span className="text-muted-foreground mb-1">/{service.priceUnit}</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        {minHours > 1 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                            Minimum {minHours} hours
                          </li>
                        )}
                        {service.acceptedPaymentMethods?.includes('card') && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                            Card payments accepted
                          </li>
                        )}
                        {service.acceptedPaymentMethods?.includes('twint') && (
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent" />
                            TWINT payments accepted
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6 mt-6">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Customer Reviews</h3>
                        <p className="text-muted-foreground">Based on {reviews.length} verified bookings</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-6 w-6 fill-accent text-accent" />
                          <span className="text-3xl font-bold">{service.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">out of 5</p>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    {reviews.length > 0 && (
                      <Card className="mb-6">
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                              const count = ratingBreakdown[stars] || 0;
                              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                              return (
                                <div key={stars} className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 w-16">
                                    <span className="text-sm font-medium">{stars}</span>
                                    <Star className="h-3 w-3 fill-accent text-accent" />
                                  </div>
                                  <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
                                  </div>
                                  <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Review Form */}
                    <div ref={reviewFormRef} className="mb-6 p-6 bg-muted rounded-xl border border-dashed">
                      <h4 className="font-semibold mb-2">Write a Review</h4>
                      {isAuthenticated && user ? (
                        <div className="space-y-4">
                          {!user.isVerified && (
                            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">
                              <Lock className="w-4 h-4" />
                              <span>Identity verification required to post reviews.</span>
                            </div>
                          )}
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} type="button" onClick={() => setRating(star)} disabled={!user.isVerified}>
                                <Star className={`w-6 h-6 cursor-pointer transition-colors ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            placeholder="Share your experience..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            disabled={!user.isVerified}
                            className="bg-card"
                          />
                          <div className="flex justify-end">
                            <Button onClick={handleSubmitReview} disabled={!user.isVerified || !reviewText || createReviewMutation.isPending}>
                              {createReviewMutation.isPending ? "Posting..." : "Post Review"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-2">Please log in to leave a review.</p>
                          <Button variant="outline" onClick={() => setLocation("/auth")}>Log In</Button>
                        </div>
                      )}
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-4">
                      {reviewsLoading ? (
                        <p className="text-muted-foreground italic">Loading reviews...</p>
                      ) : reviews.length > 0 ? (
                        reviews.map((review) => (
                          <Card key={review.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <Avatar>
                                    <AvatarImage src={review.user.profileImageUrl || undefined} />
                                    <AvatarFallback>{review.user.firstName?.[0]}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold">{review.user.firstName} {review.user.lastName}</p>
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Verified
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-accent text-accent" />
                                  <span className="font-semibold">{review.rating}</span>
                                </div>
                              </div>
                              <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="about" className="space-y-6 mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About {service.owner.firstName} {service.owner.lastName}</h3>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        {vendorBio || `${service.owner.firstName} is a verified service provider on Commerzio. They have been a member since ${new Date(service.owner.createdAt).getFullYear()} and are committed to delivering exceptional quality and customer satisfaction.`}
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        {certifications.length > 0 ? (
                          certifications.map((cert, i) => (
                            <div key={i} className="text-center p-4 bg-muted rounded-lg">
                              <Award className="h-8 w-8 mx-auto mb-2 text-accent" />
                              <p className="font-semibold mb-1">{cert.name}</p>
                              {cert.year && <p className="text-xs text-muted-foreground">{cert.year}</p>}
                            </div>
                          ))
                        ) : (
                          <>
                            {service.owner.isVerified && (
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <Shield className="h-8 w-8 mx-auto mb-2 text-accent" />
                                <p className="font-semibold mb-1">Verified</p>
                                <p className="text-xs text-muted-foreground">Identity Confirmed</p>
                              </div>
                            )}
                            {isTopVendor && (
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-accent" />
                                <p className="font-semibold mb-1">Top Vendor</p>
                                <p className="text-xs text-muted-foreground">{service.owner.topVendorYear || new Date().getFullYear()}</p>
                              </div>
                            )}
                            {totalBookings > 0 && (
                              <div className="text-center p-4 bg-muted rounded-lg">
                                <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
                                <p className="font-semibold mb-1">{totalBookings.toLocaleString()}+</p>
                                <p className="text-xs text-muted-foreground">Happy Clients</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <div className="mb-4">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold">CHF {service.price}</span>
                    <span className="text-muted-foreground mb-1">/{service.priceUnit}</span>
                  </div>
                  {minHours > 1 && (
                    <p className="text-sm text-muted-foreground">Minimum {minHours} hours booking</p>
                  )}
                </div>

                {service.status === "active" ? (
                  <Button size="lg" className="w-full mb-2" onClick={() => {
                    if (!isAuthenticated) { toast({ title: "Sign in required", variant: "destructive" }); setLocation("/auth"); return; }
                    setLocation(`/service/${serviceId}/book`);
                  }}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                  </Button>
                ) : (
                  <div className="p-3 rounded-lg bg-muted text-center mb-2">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Booking unavailable - listing is {service.status}</p>
                  </div>
                )}

                <Button size="lg" variant="outline" className="w-full mb-4 bg-transparent" onClick={() => {
                  if (!isAuthenticated) { setLocation("/auth"); return; }
                  setLocation(`/chat?vendor=${service.owner.id}&service=${serviceId}`);
                }}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact Vendor
                </Button>

                <Separator className="mb-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Escrow Protection</p>
                      <p className="text-muted-foreground text-xs">Payment held until confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Instant Booking</p>
                      <p className="text-muted-foreground text-xs">Confirmation in minutes</p>
                    </div>
                  </div>
                  {satisfactionRate > 0 && (
                    <div className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Satisfaction Guarantee</p>
                        <p className="text-muted-foreground text-xs">{satisfactionRate.toFixed(0)}% satisfaction rate</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accepted Payment Methods - Compact with hover effects */}
                {(() => {
                  const PAYMENT_METHODS = [
                    { key: 'card', label: 'Card', icon: '💳' },
                    { key: 'twint', label: 'TWINT', icon: '📱' },
                    { key: 'cash', label: 'Cash', icon: '💵' },
                    { key: 'bank_transfer', label: 'Bank', icon: '🏦' },
                    { key: 'crypto', label: 'Crypto', icon: '₿' },
                  ];

                  const acceptedMethods = service.acceptedPaymentMethods || [];
                  const activeMethods = PAYMENT_METHODS.filter(m => acceptedMethods.includes(m.key));

                  if (activeMethods.length === 0) return null;

                  return (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-2">
                        <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Payment Methods</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeMethods.map(method => (
                            <Badge
                              key={method.key}
                              variant="outline"
                              className="text-xs py-1 px-2 gap-1 cursor-default hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
                            >
                              <span>{method.icon}</span>
                              {method.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Compact Share & Report row */}
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={copyServiceLink} title="Copy link">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      title={isSaved ? "Remove from saved" : "Save service"}
                      onClick={() => {
                        if (!isAuthenticated) { setLocation("/auth"); return; }
                        toggleSaved.mutate({ action: isSaved ? 'remove' : 'add' });
                      }}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground text-xs gap-1 hover:text-destructive">
                    <Flag className="w-3 h-3" />
                    Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}