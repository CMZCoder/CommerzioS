import { Layout } from "@/components/layout";
import { SearchAutocomplete } from "@/components/search-autocomplete";
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
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails, type ReviewWithUser } from "@/lib/api";
import type { ListingQuestion, ListingAnswer } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { ServiceMap } from "@/components/service-map";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useEmblaCarousel from "embla-carousel-react";
import { getFuzzyLocation } from "@/lib/utils";

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

  // Controlled tab state - auto-switch to questions tab when ?question= param is present
  const urlParams = new URLSearchParams(searchString);
  const questionIdFromUrl = urlParams.get('question');
  const [activeTab, setActiveTab] = useState(() => {
    // Initial value: if URL has question param, start on questions tab
    return questionIdFromUrl ? 'questions' : 'description';
  });
  
  // Track which question to expand and scroll to
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(questionIdFromUrl);

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

  // Handle deep linking: switch to questions tab and set question to expand when URL changes
  useEffect(() => {
    if (questionIdFromUrl) {
      setActiveTab('questions');
      setExpandedQuestionId(questionIdFromUrl);
    }
  }, [questionIdFromUrl]);

  // Scroll to top on page load (but not for question deep links)
  useEffect(() => {
    if (!questionIdFromUrl) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [serviceId, questionIdFromUrl]);

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

  // Query for question counts (for vendors)
  const { data: questionCounts } = useQuery<{ total: number; unanswered: number }>({
    queryKey: [`/api/services/${serviceId}/questions/unanswered-count`],
    queryFn: () => apiRequest(`/api/services/${serviceId}/questions/unanswered-count`),
    enabled: !!service && user?.id === service.ownerId, // Only for vendors
    refetchInterval: 10000, // Poll every 10 seconds for real-time badge updates
  });

  // Query for user's new replies count (for question askers, not vendors)
  const { data: userReplyCounts } = useQuery<{ total: number; newReplies: number }>({
    queryKey: [`/api/services/${serviceId}/questions/my-replies-count`],
    queryFn: () => apiRequest(`/api/services/${serviceId}/questions/my-replies-count`),
    enabled: !!service && isAuthenticated && user?.id !== service.ownerId, // Only for non-vendors
    refetchInterval: 10000,
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

  // Owner detection
  const isOwner = user?.id === service?.ownerId;

  // Fetch stats for owner (favorites count)
  const { data: serviceStats } = useQuery<{ viewCount: number; shareCount: number; favoritesCount: number; unreadMessageCount: number }>({
    queryKey: [`/api/services/${serviceId}/stats`],
    queryFn: () => apiRequest(`/api/services/${serviceId}/stats`),
    enabled: isOwner && !!service,
  });

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
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-8">Service not found</h1>

          {/* Search Bar */}
          <div className="w-full max-w-md mb-8">
            <SearchAutocomplete />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={() => setLocation("/")} variant="outline">Go Home</Button>
            <Button onClick={() => setLocation("/search")}>Explore Services</Button>
          </div>
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
                      {getFuzzyLocation(service.locations?.[0]) || getFuzzyLocation(service.preferredLocationName) || 'Location not set'}
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="questions" className="flex items-center gap-2">
                    Questions
                    {/* Vendor sees unanswered questions count (red) */}
                    {questionCounts && questionCounts.unanswered > 0 && user?.id === service.ownerId && (
                      <Badge variant="destructive" className="text-[10px] h-4 min-w-4 px-1 rounded-full">
                        {questionCounts.unanswered}
                      </Badge>
                    )}
                    {/* Users see new replies count (primary color) */}
                    {userReplyCounts && userReplyCounts.newReplies > 0 && user?.id !== service.ownerId && (
                      <Badge className="text-[10px] h-4 min-w-4 px-1 rounded-full bg-primary">
                        {userReplyCounts.newReplies}
                      </Badge>
                    )}
                  </TabsTrigger>
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
                      Available in {getFuzzyLocation(service.locations?.[0]) || getFuzzyLocation(service.preferredLocationName) || 'your area'} and surrounding areas
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

                <TabsContent value="questions" className="space-y-6 mt-6">
                  <ListingQASection serviceId={service.id} ownerId={service.ownerId} expandedQuestionId={expandedQuestionId} />
                </TabsContent>

                <TabsContent value="about" className="space-y-6 mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About {service.owner.firstName} {service.owner.lastName}</h3>

                      {/* Custom vendor bio if available */}
                      {vendorBio && (
                        <p className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                          {vendorBio}
                        </p>
                      )}

                      {/* Always show member since info */}
                      <p className="text-sm text-muted-foreground mb-6">
                        <span className="font-medium text-foreground">{service.owner.firstName}</span> has been a verified member since {new Date(service.owner.createdAt).getFullYear()}.
                        {!vendorBio && " They are committed to delivering exceptional quality and customer satisfaction."}
                      </p>

                      {/* Badges grid - always show */}
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
                {/* Price display - always show */}
                <div className="mb-4">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-3xl font-bold">CHF {service.price}</span>
                    <span className="text-muted-foreground mb-1">/{service.priceUnit}</span>
                  </div>
                  {minHours > 1 && (
                    <p className="text-sm text-muted-foreground">Minimum {minHours} hours booking</p>
                  )}
                </div>

                {/* Owner View - Stats Panel */}
                {isOwner ? (
                  <>
                    <div className="space-y-4 mb-4">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Listing Statistics</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <Eye className="h-5 w-5 mx-auto mb-1 text-accent" />
                          <p className="text-xl font-bold">{serviceStats?.viewCount || service.viewCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <Heart className="h-5 w-5 mx-auto mb-1 text-red-500" />
                          <p className="text-xl font-bold">{serviceStats?.favoritesCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Favorites</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <Share2 className="h-5 w-5 mx-auto mb-1 text-accent" />
                          <p className="text-xl font-bold">{serviceStats?.shareCount || service.shareCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Shares</p>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-lg text-center cursor-pointer hover:bg-muted transition-colors" onClick={() => setLocation(`/chat?service=${serviceId}`)}>
                          <MessageSquare className="h-5 w-5 mx-auto mb-1 text-accent" />
                          <p className="text-xl font-bold">{serviceStats?.unreadMessageCount || 0}</p>
                          <p className="text-xs text-muted-foreground">Messages</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <Button size="lg" className="w-full" onClick={() => setLocation(`/services/${serviceId}/edit`)}>
                        <Edit2 className="mr-2 h-5 w-5" />
                        Edit Listing
                      </Button>
                      <Button size="lg" variant="outline" className="w-full bg-transparent" onClick={() => setLocation(`/chat?service=${serviceId}`)}>
                        <MessageSquare className="mr-2 h-5 w-5" />
                        View Chats {serviceStats?.unreadMessageCount ? `(${serviceStats.unreadMessageCount} new)` : ''}
                      </Button>
                    </div>

                    <Separator className="my-4" />

                    {/* Share link for owner */}
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={copyServiceLink} title="Copy link">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground">Share your listing</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Visitor View - Booking UI */}
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

                    {/* Payment Methods */}
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

                    {/* Share & Report row */}
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={async () => {
                          copyServiceLink();
                          try { await fetch(`/api/services/${serviceId}/share`, { method: 'POST' }); } catch { }
                        }} title="Copy link">
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ListingQASection({ serviceId, ownerId, expandedQuestionId: propExpandedQuestionId }: { 
  serviceId: string, 
  ownerId: string,
  expandedQuestionId?: string | null 
}) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questionContent, setQuestionContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery<Array<ListingQuestion & { user: any; answers: Array<ListingAnswer & { user: any }> }>>({
    queryKey: [`/api/services/${serviceId}/questions`],
    refetchInterval: 10000, // Poll every 10 seconds for real-time updates
  });

  // Scroll to the expanded question when it loads (from notification deep link)
  useEffect(() => {
    if (propExpandedQuestionId && !isLoading && questions.length > 0) {
      // Small delay to ensure the question element is rendered
      setTimeout(() => {
        const questionElement = document.getElementById(`question-${propExpandedQuestionId}`);
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add visual highlight
          questionElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            questionElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 3000);
        }
      }, 200);
    }
  }, [propExpandedQuestionId, isLoading, questions.length]);

  const askMutation = useMutation({
    mutationFn: async (data: { content: string; isPrivate: boolean }) => {
      return apiRequest(`/api/services/${serviceId}/questions`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions/unanswered-count`] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/unanswered-count'] });
      setQuestionContent("");
      setIsPrivate(false);
      toast({ title: "Question submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to submit question", description: error.message, variant: "destructive" });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ questionId, content, isPrivate }: { questionId: string; content: string; isPrivate: boolean }) => {
      return apiRequest(`/api/services/${serviceId}/questions/${questionId}/answers`, {
        method: "POST",
        body: JSON.stringify({ content, isPrivate }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions/unanswered-count`] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions/unanswered-count'] });
      toast({ title: "Reply submitted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to reply", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmitQuestion = () => {
    if (!questionContent.trim()) return;
    askMutation.mutate({ content: questionContent, isPrivate });
  };

  const isOwner = user?.id === ownerId;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-3">Questions & Answers</h3>
        <p className="text-muted-foreground mb-4">
          Ask the vendor about this service.
        </p>

        {/* Ask Form */}
        {isAuthenticated ? (
          !isOwner && (
            <Card className="mb-6">
              <CardContent className="p-4 space-y-4">
                <Textarea
                  placeholder="Ask a question..."
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                />
                <Button onClick={handleSubmitQuestion} disabled={askMutation.isPending || !questionContent.trim()}>
                  {askMutation.isPending ? "Submitting..." : "Ask Question"}
                </Button>

              </CardContent>
            </Card>
          )
        ) : (
          <div className="bg-muted p-4 rounded-lg text-center mb-6">
            <p className="text-sm mb-2">Login to ask a question</p>
            <Button variant="outline" size="sm" asChild><Link href="/auth">Login</Link></Button>
          </div>
        )}

        {/* Questions List */}
        {isLoading ? (
          <div>Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No questions yet.</div>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                isOwner={isOwner}
                ownerId={ownerId}
                defaultExpanded={propExpandedQuestionId === q.id}
                onReply={(content: string, isPrivate: boolean) => replyMutation.mutate({ questionId: q.id, content, isPrivate })}
                onDeleteQuestion={() => {
                  // Optimistic update or simple invalidation
                  apiRequest(`/api/questions/${q.id}`, { method: 'DELETE' }).then(() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
                    queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions/unanswered-count`] });
                    queryClient.invalidateQueries({ queryKey: ['/api/questions/unanswered-count'] });
                    toast({ title: "Question deleted" });
                  });
                }}
                onDeleteAnswer={(answerId: string) => {
                  apiRequest(`/api/answers/${answerId}`, { method: 'DELETE' }).then(() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
                    queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions/unanswered-count`] });
                    queryClient.invalidateQueries({ queryKey: ['/api/questions/unanswered-count'] });
                    toast({ title: "Reply deleted" });
                  });
                }}
                onEditAnswer={(answerId: string, content: string) => {
                  apiRequest(`/api/answers/${answerId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ content })
                  }).then(() => {
                    queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
                    toast({ title: "Reply updated" });
                  });
                }}
                currentUserId={user?.id}
                serviceId={serviceId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionItem({ question, isOwner, ownerId, defaultExpanded = false, onReply, onDeleteQuestion, onDeleteAnswer, onEditAnswer, currentUserId, serviceId }: any) {
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isPrivateReply, setIsPrivateReply] = useState(false);
  const [showReplies, setShowReplies] = useState(defaultExpanded);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isQuestionAuthor = currentUserId && currentUserId === question.userId;

  // Get the last answer to check who replied last
  const lastAnswer = question.answers?.length > 0
    ? question.answers[question.answers.length - 1]
    : null;

  // Check if the current user was the last to reply
  const currentUserRepliedLast = lastAnswer && lastAnswer.userId === currentUserId;

  // Strict alternating pattern:
  // - Vendor can reply if: no answers yet OR last answer was not from vendor
  // - Question author can reply if: vendor has replied AND last answer was from vendor
  const vendorHasReplied = question.answers?.some((a: any) => a.userId === ownerId);

  // Neither party can post twice in a row
  const canReply = currentUserId && !currentUserRepliedLast && (
    isOwner || // Vendor can reply if they haven't replied last
    (isQuestionAuthor && vendorHasReplied) // Author can reply if vendor has replied and author hasn't replied last
  );
  const canDeleteQuestion = isOwner; // Only vendor can delete questions

  const handleReply = () => {
    if (!replyContent.trim()) return;
    onReply(replyContent, isPrivateReply);
    setReplyContent("");
    setIsReplying(false);
    setShowReplies(true); // Auto-expand to show new reply
  };

  const startEdit = (answer: any) => {
    setEditingAnswerId(answer.id);
    setEditContent(answer.content);
  };

  const handleEditSubmit = (answerId: string) => {
    onEditAnswer(answerId, editContent);
    setEditingAnswerId(null);
  };

  // Simplified privacy: use question.isPrivate directly
  const isQAPrivate = question.isPrivate;

  // Get display name - show "Me" for current user
  const getDisplayName = (userId: string | undefined, user: any) => {
    if (currentUserId && userId === currentUserId) return 'Me';
    return user?.displayName || user?.firstName || 'User';
  };

  // Toggle privacy handler for vendors
  const handleTogglePrivacy = async () => {
    console.log('[Q&A Toggle] Starting toggle, current isPrivate:', question.isPrivate, 'questionId:', question.id);
    try {
      const response = await fetch(`/api/questions/${question.id}/privacy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPrivate: !question.isPrivate }),
      });
      
      const data = await response.json();
      console.log('[Q&A Toggle] Response:', response.status, data);
      
      if (response.ok) {
        // Properly invalidate cache to refresh UI
        queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/questions`] });
        toast({ 
          title: question.isPrivate ? "Q&A is now public" : "Q&A is now private",
          description: question.isPrivate ? "Other users can see this thread" : "Only you and the asker can see this thread"
        });
      } else {
        toast({ title: "Failed to update privacy", description: data.message || "Unknown error", variant: "destructive" });
      }
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
      toast({ title: "Failed to update privacy", variant: "destructive" });
    }
  };

  return (
    <Card id={`question-${question.id}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{(question.user?.displayName || question.user?.firstName)?.substring(0, 1) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-sm">{getDisplayName(question.userId, question.user)}</span>
            <span className="text-xs text-muted-foreground">{new Date(question.createdAt).toLocaleDateString()}</span>
            {isQAPrivate && <Badge variant="outline" className="text-xs"><Lock className="w-3 h-3 mr-1" /> Private</Badge>}
          </div>
          <div className="flex gap-1">
            {/* Vendor toggle button */}
            {isOwner && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs gap-1"
                onClick={handleTogglePrivacy}
              >
                {isQAPrivate ? <Eye className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isQAPrivate ? "Make Public" : "Make Private"}
              </Button>
            )}
            {canDeleteQuestion && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onDeleteQuestion}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm">{question.content}</p>

        {/* Answers Toggle */}
        {question.answers && question.answers.length > 0 && (
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 p-0 hover:bg-transparent text-primary flex items-center gap-1"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showReplies ? "Hide replies" : `View ${question.answers.length} repl${question.answers.length === 1 ? 'y' : 'ies'}`}
            </Button>

            {showReplies && (
              <div className="mt-2 ml-4 pl-4 border-l-2 space-y-4">
                {question.answers.map((a: any) => {
                  const isAnswerAuthor = currentUserId && currentUserId === a.userId;
                  const canDeleteAnswer = isOwner || isAnswerAuthor;
                  const canEditAnswer = isAnswerAuthor;
                  const isVendorAnswer = a.userId === ownerId;

                  return (
                    <div key={a.id} className="relative group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${isVendorAnswer ? 'text-primary' : ''}`}>
                            {getDisplayName(a.userId, a.user)}
                            {isVendorAnswer && <Badge variant="secondary" className="ml-2 text-[10px] h-4">Vendor</Badge>}
                          </span>
                          <span className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEditAnswer && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(a)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          )}
                          {canDeleteAnswer && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive" onClick={() => onDeleteAnswer(a.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {editingAnswerId === a.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="min-h-[60px] text-sm" />
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setEditingAnswerId(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => handleEditSubmit(a.id)}>Save</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/90">{a.content}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reply Action */}
        {canReply && (
          <div className="mt-2">
            {!isReplying ? (
              <Button variant="ghost" size="sm" onClick={() => setIsReplying(true)}>
                <Reply className="w-4 h-4 mr-1" /> Reply
              </Button>
            ) : (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="h-20"
                />
                <div className="flex justify-between items-center">
                  {isOwner && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`private-reply-${question.id}`}
                        checked={isPrivateReply}
                        onChange={(e) => setIsPrivateReply(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor={`private-reply-${question.id}`} className="text-sm text-muted-foreground select-none">Make private</label>
                    </div>
                  )}
                  {!isOwner && <div />} {/* Spacer */}

                  <div className="flex gap-2 ml-auto">
                    <Button variant="ghost" size="sm" onClick={() => setIsReplying(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleReply}>Post Reply</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}