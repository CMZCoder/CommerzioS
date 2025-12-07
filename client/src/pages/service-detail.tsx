import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute, useLocation, Link, useSearch } from "wouter";
import { Star, MapPin, CheckCircle2, Calendar, ShieldCheck, Flag, Share2, Heart, Lock, Hash, Navigation, MessageSquare, CalendarPlus, Copy, MessageCircle, Reply, Send, AlertCircle } from "lucide-react";
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

// Route guard wrapper - only mounts content when service ID is available
export default function ServiceDetail() {
  const [match, params] = useRoute("/service/:id");
  
  // Don't render anything if route doesn't match
  if (!match) {
    return null;
  }
  
  // Show error if ID is missing (edge case)
  if (!params?.id) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-xl font-semibold text-destructive mb-2">Invalid Service</p>
            <p className="text-muted-foreground">No service ID provided</p>
            <Button onClick={() => window.location.href = "/"} className="mt-4">
              Return to Home
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  return <ServiceDetailContent serviceId={params.id} />;
}

// Content component - hooks only initialize with valid serviceId
function ServiceDetailContent({ serviceId }: { serviceId: string }) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const reviewFormRef = useRef<HTMLDivElement>(null);

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

  // Update saved state when status is fetched
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
      toast({
        title: "Review Submitted",
        description: "Your review has been posted successfully.",
      });
      setReviewText("");
      setRating(5);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review.",
        variant: "destructive",
      });
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
      // Snapshot the previous value
      const previousState = isSaved;
      
      // Optimistically update the UI
      const newState = action === 'add';
      setIsSaved(newState);
      
      // Return context with previous state for rollback
      return { previousState };
    },
    onSuccess: (_data, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: [`/api/favorites/${serviceId}/status`] });
      
      // Show feedback toast
      const wasAdded = variables.action === 'add';
      toast({
        title: wasAdded ? "Service saved" : "Removed from saved",
        description: wasAdded 
          ? "Service added to your saved services" 
          : "Service removed from your saved services",
      });
    },
    onError: (error: any, _variables, context) => {
      // Revert to previous state on error
      if (context?.previousState !== undefined) {
        setIsSaved(context.previousState);
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update saved services",
        variant: "destructive",
      });
    },
  });

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation permission denied or unavailable:", error);
        }
      );
    }
  }, []);

  // Handle ?review=true query param - scroll to review form
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get('review') === 'true' && reviewFormRef.current && service) {
      // Wait for reviews section to render, then scroll
      setTimeout(() => {
        reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the textarea if user is authenticated
        if (isAuthenticated && user?.isVerified) {
          const textarea = reviewFormRef.current?.querySelector('textarea');
          if (textarea) {
            setTimeout(() => textarea.focus(), 500);
          }
        }
      }, 300);
    }
  }, [searchString, service, isAuthenticated, user]);

  const handleContact = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to contact service providers.",
        variant: "destructive"
      });
      setLocation("/auth");
      return;
    }
    setIsContactRevealed(true);
  };

  const handleSubmitReview = () => {
    if (!user?.isVerified) {
      toast({
        title: "Verification Required",
        description: "You must complete identity verification to leave reviews.",
        variant: "destructive"
      });
      return;
    }
    
    if (!reviewText.trim()) {
      toast({
        title: "Error",
        description: "Please write a review comment.",
        variant: "destructive"
      });
      return;
    }

    createReviewMutation.mutate({ rating, comment: reviewText });
  };

  // Share functionality
  const serviceUrl = typeof window !== 'undefined' ? `${window.location.origin}/service/${serviceId}` : '';
  const shareTitle = service?.title || 'Check out this service';
  const shareText = service 
    ? `Check out "${service.title}" on Commerzio Services${service.locations?.[0] ? ` in ${service.locations[0]}` : ''}`
    : 'Check out this service on Commerzio Services';

  const copyServiceLink = async () => {
    try {
      await navigator.clipboard.writeText(serviceUrl);
      toast({
        title: "Link copied!",
        description: "Service link copied to clipboard",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const shareService = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: serviceUrl,
        });
      } catch (error: any) {
        // User cancelled or error - fallback to copy
        if (error.name !== 'AbortError') {
          copyServiceLink();
        }
      }
    } else {
      // Fallback to copy if Web Share API not available
      copyServiceLink();
    }
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`${shareText}\n\n${serviceUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(serviceUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(shareText);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(serviceUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Check out: ${shareTitle}`);
    const body = encodeURIComponent(`${shareText}\n\n${serviceUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
      <div className="bg-muted min-h-screen pb-20">
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
                    This is an archived preview. The vendor is no longer accepting new bookings for this service.
                    {service.owner && (
                      <> You can <Link href={`/users/${service.owner.id}`} className="underline font-medium">view the vendor's profile</Link> to see their other services.</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Images & Details */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-2xl overflow-hidden bg-card shadow-sm border border-border">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  {service.images && service.images.length > 0 ? (
                    <img 
                      src={service.images[0]} 
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <MapPin className="w-16 h-16 mx-auto mb-2 opacity-20" />
                      <p>No image available</p>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="text-sm">{service.category.name}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" /> {service.locations?.[0] || 'N/A'}
                    </div>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{service.title}</h1>
                  
                  <div className="flex items-center gap-6 pb-6 border-b border-border">
                    <div className="flex items-center gap-1">
                      <Star className={`w-5 h-5 ${service.reviewCount > 0 ? 'fill-amber-400 text-amber-400' : 'fill-gray-300 text-gray-300'}`} />
                      <span className="font-bold text-lg">{service.rating ? service.rating.toFixed(1) : "0"}</span>
                      <span className="text-muted-foreground">({service.reviewCount} {service.reviewCount === 1 ? 'review' : 'reviews'})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-5 h-5" />
                      <span>Posted {new Date(service.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="py-6">
                    <h3 className="text-xl font-semibold mb-4">About this Service</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {service.description}
                    </p>
                  </div>

                  {/* Hashtags Section */}
                  {service.hashtags && service.hashtags.length > 0 && (
                    <div className="pb-4 border-b border-border">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Hashtags</h4>
                      <div className="flex flex-wrap gap-2">
                        {service.hashtags.map(tag => (
                          <Link
                            key={tag}
                            href={`/hashtags/${tag}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                            data-testid={`hashtag-${tag}`}
                          >
                            <Hash className="w-3.5 h-3.5 mr-1" />
                            {tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Map Section */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Where to find this service
                </h3>
                
                <ServiceMap service={service} userLocation={userLocation} />
              </div>

              {/* Reviews Section */}
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    Reviews <Badge variant="secondary" className="rounded-full">{reviews.length}</Badge>
                  </h3>
                </div>
                
                <div ref={reviewFormRef} className="mb-8 p-6 bg-muted rounded-xl border border-dashed border-border">
                  <h4 className="font-semibold mb-2">Write a Review</h4>
                  {isAuthenticated && user ? (
                    <div className="space-y-4">
                      {!user.isVerified && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                          <Lock className="w-4 h-4" />
                          <span>Identity verification required to post reviews.</span>
                          <Button variant="link" className="h-auto p-0 text-amber-700 underline">Verify now</Button>
                        </div>
                      )}
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            disabled={!user.isVerified}
                          >
                            <Star
                              className={`w-6 h-6 cursor-pointer transition-colors ${
                                star <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea 
                        placeholder="Share your experience with this provider..." 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        disabled={!user.isVerified}
                        className="bg-card"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSubmitReview} 
                          disabled={!user.isVerified || !reviewText || createReviewMutation.isPending}
                        >
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

                <div className="space-y-6">
                  {reviewsLoading ? (
                    <p className="text-muted-foreground italic">Loading reviews...</p>
                  ) : reviews.length > 0 ? (
                    reviews.map(review => (
                      <ReviewItem
                        key={review.id}
                        review={review}
                        isVendor={isAuthenticated && user?.id === service?.ownerId}
                        serviceId={serviceId}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">No reviews yet. Be the first to review!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                
                {/* Price Card */}
                <div className="bg-card rounded-2xl shadow-lg border border-border p-6">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-primary">CHF {service.price}</span>
                    <span className="text-muted-foreground font-medium">/{service.priceUnit}</span>
                  </div>

                  <div className="space-y-3">
                    {/* Book Now Button */}
                    {service.status === "active" ? (
                      <Button 
                        size="lg" 
                        className="w-full text-lg font-semibold h-12 shadow-lg shadow-primary/20 gap-2" 
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast({
                              title: "Sign in required",
                              description: "Please sign in to book this service",
                              variant: "destructive"
                            });
                            setLocation("/login");
                            return;
                          }
                          // Navigate to booking page or open booking modal
                          setLocation(`/service/${serviceId}/book`);
                        }}
                      >
                        <CalendarPlus className="w-5 h-5" />
                        Book Now
                      </Button>
                    ) : (
                      <div className="p-4 rounded-lg bg-muted text-center">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">
                          Booking unavailable - this listing is {service.status}
                        </p>
                      </div>
                    )}
                    
                    {/* Message Button */}
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full text-lg font-semibold h-12 gap-2" 
                      onClick={() => {
                        if (!isAuthenticated) {
                          toast({
                            title: "Sign in required",
                            description: "Please sign in to message this provider",
                            variant: "destructive"
                          });
                          setLocation("/login");
                          return;
                        }
                        // Navigate to chat with this vendor
                        setLocation(`/chat?vendor=${service.ownerId}&service=${serviceId}`);
                      }}
                    >
                      <MessageSquare className="w-5 h-5" />
                      Message
                    </Button>

                    {!isContactRevealed ? (
                      <Button size="lg" variant="ghost" className="w-full text-muted-foreground" onClick={handleContact}>
                        Show Contact Info
                      </Button>
                    ) : (
                      <div className="bg-muted p-4 rounded-lg border border-primary/20 space-y-2 animate-in fade-in zoom-in-95">
                        <p className="font-medium text-primary">Contact Information:</p>
                        {service.contactPhone && <p className="flex items-center gap-2"><span className="font-bold">Phone:</span> {service.contactPhone}</p>}
                        {service.contactEmail && <p className="flex items-center gap-2"><span className="font-bold">Email:</span> {service.contactEmail}</p>}
                        <p className="text-xs text-muted-foreground mt-2">Mention Commerzio Services when you contact them!</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 gap-2"
                        onClick={() => {
                          if (!isAuthenticated) {
                            setLocation("/auth");
                            return;
                          }
                          toggleSaved.mutate({ action: isSaved ? 'remove' : 'add' });
                        }}
                        disabled={toggleSaved.isPending}
                        data-testid="button-save-service"
                      >
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} /> 
                        {isSaved ? 'Saved' : 'Save'}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex-1 gap-2">
                            <Share2 className="w-4 h-4" /> Share
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          {'share' in navigator && (
                            <>
                              <DropdownMenuItem onClick={shareService}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share via...
                              </DropdownMenuItem>
                              <div className="h-px bg-border my-1" />
                            </>
                          )}
                          <DropdownMenuItem onClick={copyServiceLink}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={shareToWhatsApp}>
                            <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                            Share to WhatsApp
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={shareToFacebook}>
                            <Share2 className="w-4 h-4 mr-2 text-blue-600" />
                            Share to Facebook
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={shareToTwitter}>
                            <Share2 className="w-4 h-4 mr-2 text-sky-500" />
                            Share to Twitter/X
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={shareByEmail}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share via Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Provider Card */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Service Provider</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={service.owner.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.owner.id}`} 
                      alt={`${service.owner.firstName} ${service.owner.lastName}`} 
                      className="w-16 h-16 rounded-full ring-4 ring-slate-50"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/users/${service.owner.id}`}
                          className="font-bold text-lg hover:text-primary transition-colors"
                          data-testid={`link-user-${service.owner.id}`}
                        >
                          {service.owner.firstName} {service.owner.lastName}
                        </Link>
                        {service.owner.isVerified && <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />}
                      </div>
                      <p className="text-sm text-muted-foreground">Member since {new Date(service.owner.createdAt).getFullYear()}</p>
                    </div>
                  </div>
                  
                  {service.owner.isVerified ? (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                      <ShieldCheck className="w-5 h-5" />
                      Identity Verified
                    </div>
                  ) : (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      <ShieldCheck className="w-5 h-5" />
                      Identity Not Verified
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <Button variant="link" className="text-muted-foreground text-xs gap-1">
                    <Flag className="w-3 h-3" /> Report this service
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

// ReviewItem component for individual reviews with vendor response functionality
function ReviewItem({ 
  review, 
  isVendor, 
  serviceId 
}: { 
  review: ReviewWithUser & { vendorResponse?: string | null; vendorRespondedAt?: Date | string | null }; 
  isVendor: boolean; 
  serviceId: string;
}) {
  const [isResponding, setIsResponding] = useState(false);
  const [responseText, setResponseText] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const respondMutation = useMutation({
    mutationFn: async (response: string) => {
      return apiRequest(`/api/reviews/${review.id}/respond`, {
        method: "POST",
        body: JSON.stringify({ response }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/services/${serviceId}/reviews`] });
      toast({
        title: "Response Posted",
        description: "Your response has been added to the review.",
      });
      setIsResponding(false);
      setResponseText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post response.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitResponse = () => {
    if (responseText.trim()) {
      respondMutation.mutate(responseText.trim());
    }
  };

  return (
    <div className="border-b border-border last:border-0 pb-6 last:pb-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <img 
            src={review.user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.user.id}`}
            alt={`${review.user.firstName} ${review.user.lastName}`}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <Link
              href={`/users/${review.user.id}`}
              className="font-semibold hover:text-primary transition-colors"
              data-testid={`link-user-${review.user.id}`}
            >
              {review.user.firstName} {review.user.lastName}
            </Link>
            <div className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
          ))}
        </div>
      </div>
      <p className="text-muted-foreground pl-13 mb-3">{review.comment}</p>
      
      {/* Vendor Response */}
      {review.vendorResponse && (
        <div className="ml-8 mt-3 p-4 bg-muted rounded-lg border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Reply className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-primary">Provider Response</span>
            {review.vendorRespondedAt && (
              <span className="text-xs text-muted-foreground">
                • {new Date(review.vendorRespondedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{review.vendorResponse}</p>
        </div>
      )}
      
      {/* Vendor Respond Button */}
      {isVendor && !review.vendorResponse && !isResponding && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-8 mt-2 text-primary"
          onClick={() => setIsResponding(true)}
        >
          <Reply className="w-4 h-4 mr-1" />
          Respond to review
        </Button>
      )}
      
      {/* Response Form */}
      {isResponding && (
        <div className="ml-8 mt-3 space-y-2">
          <Textarea
            placeholder="Write your response to this review..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            className="min-h-[80px]"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{responseText.length}/1000</span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsResponding(false);
                  setResponseText("");
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSubmitResponse}
                disabled={!responseText.trim() || respondMutation.isPending}
              >
                {respondMutation.isPending ? "Posting..." : "Post Response"}
                <Send className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}