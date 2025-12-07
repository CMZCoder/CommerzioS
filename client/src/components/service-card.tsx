import type { ServiceWithDetails } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, MapPin, CheckCircle2, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useCroppedImage } from "@/hooks/useCroppedImage";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface ServiceCardProps {
  service: ServiceWithDetails & { distance?: number };
  compact?: boolean;
  isSaved?: boolean;
}

// Helper component to render image with crop
function ImageWithCrop({ imageUrl, metadata, alt }: { imageUrl: string; metadata: any; alt: string }) {
  const croppedImage = useCroppedImage(imageUrl, metadata);
  
  return croppedImage ? (
    <img 
      src={croppedImage} 
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  ) : (
    <div className="w-full h-full bg-muted animate-pulse" />
  );
}

export function ServiceCard({ service, compact = false, isSaved: initialIsSaved }: ServiceCardProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(initialIsSaved ?? false);
  const [showUnfavoriteDialog, setShowUnfavoriteDialog] = useState(false);
  const daysRemaining = Math.ceil((new Date(service.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  // Image carousel state
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Update carousel button states
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentImageIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Get the main image based on mainImageIndex (for initial display)
  const mainImageIndex = service.mainImageIndex || 0;
  const imageMetadata = service.imageMetadata as any[] || [];

  // Generate cropped images for all service images (handle missing images array)
  const allImages = (service.images ?? []).map((img, idx) => ({
    url: img,
    metadata: imageMetadata[idx],
  }));

  // Query favorite status only if not provided
  const { data: favoriteStatus } = useQuery({
    queryKey: ["/api/favorites", service.id, "status"],
    queryFn: () => apiRequest<{ isFavorite: boolean }>(`/api/favorites/${service.id}/status`),
    enabled: isAuthenticated && initialIsSaved === undefined,
  });

  // Update local state when saved status is fetched or prop changes
  useEffect(() => {
    let newValue: boolean | undefined;
    
    if (initialIsSaved !== undefined) {
      newValue = initialIsSaved;
    } else if (favoriteStatus?.isFavorite !== undefined) {
      newValue = favoriteStatus.isFavorite;
    }
    
    // Only update if value actually changed
    if (newValue !== undefined && newValue !== isSaved) {
      setIsSaved(newValue);
    }
  }, [favoriteStatus, initialIsSaved]);

  // Toggle saved mutation with optimistic updates
  const toggleSaved = useMutation({
    mutationFn: async ({ action }: { action: 'add' | 'remove' }) => {
      if (action === 'remove') {
        await apiRequest(`/api/favorites/${service.id}`, { method: "DELETE" });
      } else {
        await apiRequest(`/api/favorites/${service.id}`, { method: "POST" });
      }
    },
    onMutate: async ({ action }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/favorites", service.id, "status"] });
      
      // Snapshot the previous value
      const previousState = isSaved;
      
      // Optimistically update the UI immediately
      const newState = action === 'add';
      setIsSaved(newState);
      
      // Return context with previous state for rollback
      return { previousState };
    },
    onSuccess: (_data, variables) => {
      // Invalidate queries for fresh data (don't wait for refetch)
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", service.id, "status"] });
      
      // Trigger event for ConversationList to refetch saved tab
      window.dispatchEvent(new Event('favorites-changed'));
      
      setShowUnfavoriteDialog(false);
      
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
      setShowUnfavoriteDialog(false);
      
      toast({
        title: "Error",
        description: error.message || "Failed to update saved services",
        variant: "destructive",
      });
    },
  });

  const handleSaveClick = () => {
    if (isSaved) {
      // Show confirmation dialog when removing saved
      setShowUnfavoriteDialog(true);
    } else {
      // Immediately add to saved without confirmation
      toggleSaved.mutate({ action: 'add' });
    }
  };

  // Compact/Mini card version for favorites rail
  if (compact) {
    return (
      <Card className={cn(
        "h-full flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-border/50",
        isExpired && "opacity-60 grayscale-[0.5]"
      )}>
        <Link href={`/service/${service.id}`} className="flex-1">
          <div className="relative aspect-[3/2] overflow-hidden bg-muted flex-shrink-0">
            {/* Image Carousel */}
            {allImages.length > 0 ? (
              <div className="overflow-hidden w-full h-full" ref={emblaRef}>
                <div className="flex h-full">
                  {allImages.map((img, index) => (
                    <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                      <ImageWithCrop imageUrl={img.url} metadata={img.metadata} alt={`${service.title} - Image ${index + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-full bg-muted animate-pulse" />
            )}
            
            {/* Carousel Navigation - Only show if multiple images */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  disabled={!canScrollPrev}
                  className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-card/90 dark:bg-card/80 shadow-md transition-all duration-200",
                    canScrollPrev ? "opacity-100 hover:bg-card hover:scale-110" : "opacity-0 pointer-events-none"
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={scrollNext}
                  disabled={!canScrollNext}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-card/90 dark:bg-card/80 shadow-md transition-all duration-200",
                    canScrollNext ? "opacity-100 hover:bg-card hover:scale-110" : "opacity-0 pointer-events-none"
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4 text-foreground" />
                </button>
                
                {/* Image indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                  {allImages.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all duration-200",
                        index === currentImageIndex ? "bg-white w-4" : "bg-white/60"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Favorite button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "absolute top-2 right-2 z-10 p-1.5 rounded-full bg-card/90 dark:bg-card/80 shadow-md transition-all duration-200",
                      isAuthenticated ? "hover:bg-card hover:scale-110" : "cursor-pointer opacity-80"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isAuthenticated) {
                        handleSaveClick();
                      }
                    }}
                    disabled={isAuthenticated && toggleSaved.isPending}
                    data-testid={`button-favorite-${service.id}`}
                  >
                    <Heart 
                      className={cn(
                        "w-3.5 h-3.5 transition-all duration-100",
                        isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </TooltipTrigger>
                {!isAuthenticated && (
                  <TooltipContent>
                    <p>Login to save services</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>

          <CardContent className="p-3 flex flex-col gap-2">
            <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
              {service.title}
            </h3>
            
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`flex items-center ${service.reviewCount > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                <Star className="w-3 h-3 fill-current" />
                <span className="ml-0.5 font-bold text-foreground">{service.rating ? service.rating.toFixed(1) : "0"}</span>
              </div>
              <span className="text-muted-foreground">({service.reviewCount} {service.reviewCount === 1 ? 'review' : 'reviews'})</span>
            </div>

            <div className="min-w-0">
              {service.priceType === 'fixed' && (
                <div className="flex flex-col gap-0">
                  <span className="text-base font-bold text-primary">CHF {service.price}</span>
                  <span className="text-[10px] text-muted-foreground">per {service.priceUnit}</span>
                </div>
              )}
              {service.priceType === 'text' && (
                <span className="text-xs font-semibold text-primary underline underline-offset-2">
                  Visit Listing
                </span>
              )}
              {service.priceType === 'list' && (
                <span className="text-xs font-medium text-foreground whitespace-nowrap">From CHF {(service.priceList as any)?.[0]?.price || 'N/A'}</span>
              )}
            </div>
          </CardContent>
        </Link>

        <AlertDialog open={showUnfavoriteDialog} onOpenChange={setShowUnfavoriteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from Saved?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this service from your saved services? You can always add it back later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-unsave">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleSaved.mutate({ action: 'remove' })}
                className="bg-destructive hover:bg-destructive/90"
                data-testid="button-confirm-unsave"
              >
                Remove from Saved
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  }

  // Full card version - Vercel-style clean design
  return (
    <Card className={cn(
      "h-full flex flex-col group overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary border-border/50",
      isExpired && "opacity-60 grayscale-[0.5]"
    )}
    role="article"
    aria-label={`Service: ${service.title}`}
    >
      <Link href={`/service/${service.id}`} className="flex-1 flex flex-col">
        <div className="relative h-48 overflow-hidden bg-muted flex-shrink-0">
          {/* Image Carousel */}
          {allImages.length > 0 ? (
            <div className="overflow-hidden w-full h-full" ref={emblaRef}>
              <div className="flex h-full">
                {allImages.map((img, index) => (
                  <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
                    <ImageWithCrop imageUrl={img.url} metadata={img.metadata} alt={`${service.title} - Image ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          
          {/* Carousel Navigation - Only show if multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/90 dark:bg-card/80 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100",
                  canScrollPrev ? "hover:bg-card hover:scale-110" : "pointer-events-none"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-card/90 dark:bg-card/80 shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100",
                  canScrollNext ? "hover:bg-card hover:scale-110" : "pointer-events-none"
                )}
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4 text-foreground" />
              </button>
              
              {/* Image indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex gap-1">
                {allImages.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-200",
                      index === currentImageIndex ? "bg-white w-4" : "bg-white/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* Featured badge */}
          {service.featured && (
            <Badge className="absolute top-3 left-3 shadow-md">
              Featured
            </Badge>
          )}
          
          {/* Distance badge */}
          {service.distance !== undefined && (
            <Badge variant="secondary" className="absolute top-3 left-3 bg-primary text-primary-foreground shadow-md">
              {service.distance.toFixed(1)} km away
            </Badge>
          )}
          
          {/* Expired badge */}
          {isExpired && (
            <Badge variant="destructive" className="absolute top-3 left-3 shadow-md">Expired</Badge>
          )}
          
          {/* Favorite button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-card/90 dark:bg-card/80 shadow-md hover:bg-card hover:scale-110 transition-all duration-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isAuthenticated) {
                      handleSaveClick();
                    }
                  }}
                  disabled={isAuthenticated && toggleSaved.isPending}
                  data-testid={`button-favorite-${service.id}`}
                >
                  <Heart 
                    className={cn(
                      "h-4 w-4 transition-all duration-100",
                      isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Login to save services</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          {/* Title */}
          <h3 className="font-semibold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {service.title}
          </h3>

          {/* Vendor name with verified badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">
              {service.owner.firstName} {service.owner.lastName}
            </span>
            {service.owner.isVerified && (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            )}
          </div>

          {/* Rating and Location */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Star className={cn("h-4 w-4 fill-current", service.reviewCount > 0 ? "text-amber-400" : "text-muted-foreground")} />
              <span className="font-semibold text-sm">{service.rating ? service.rating.toFixed(1) : "0"}</span>
              <span className="text-xs text-muted-foreground">({service.reviewCount})</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{service.locations?.[0] || (service as any).location || "N/A"}</span>
            </div>
          </div>

          {/* Price and View Details - pushed to bottom */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="font-bold text-lg">
              {service.priceType === 'fixed' && (
                <span>CHF {service.price}/{service.priceUnit}</span>
              )}
              {service.priceType === 'text' && (
                <span className="text-primary">See Listing</span>
              )}
              {service.priceType === 'list' && (
                <span>From CHF {(service.priceList as any)?.[0]?.price || 'N/A'}</span>
              )}
            </div>
            <Button size="sm" variant="outline" className="group-hover:border-primary group-hover:text-primary transition-colors">
              View Details
            </Button>
          </div>
        </CardContent>
      </Link>

      <AlertDialog open={showUnfavoriteDialog} onOpenChange={setShowUnfavoriteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Saved?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this service from your saved services? You can always add it back later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-unsave">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleSaved.mutate({ action: 'remove' })}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-unsave"
            >
              Remove from Saved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
