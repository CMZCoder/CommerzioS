import type { ServiceWithDetails } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: ServiceWithDetails;
  compact?: boolean;
}

export function ServiceCard({ service, compact = false }: ServiceCardProps) {
  const daysRemaining = Math.ceil((new Date(service.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  return (
    <Card className={cn(
      "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50",
      isExpired && "opacity-60 grayscale-[0.5]"
    )}>
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={service.images[0]} 
          alt={service.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground font-medium shadow-sm">
            {service.category.name}
          </Badge>
          {isExpired && (
            <Badge variant="destructive" className="shadow-sm">Expired</Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5" />
            {service.location}
          </div>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4 mb-3">
          <Link href={`/service/${service.id}`}>
            <h3 className="font-bold text-lg leading-tight text-foreground hover:text-primary cursor-pointer line-clamp-2">
              {service.title}
            </h3>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center text-amber-400">
            <Star className="w-4 h-4 fill-current" />
            <span className="ml-1 text-sm font-bold text-foreground">{service.rating}</span>
          </div>
          <span className="text-muted-foreground text-sm">({service.reviewCount} reviews)</span>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-border/50">
          <img 
            src={service.owner.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${service.owner.id}`} 
            alt={`${service.owner.firstName} ${service.owner.lastName}`} 
            className="w-8 h-8 rounded-full ring-2 ring-background"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium truncate">{service.owner.firstName} {service.owner.lastName}</p>
              {service.owner.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-primary fill-primary/10" />
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-primary">CHF {service.price}</span>
            <span className="text-xs text-muted-foreground">/{service.priceUnit}</span>
          </div>
        </div>
      </CardContent>
      
      {!compact && (
        <CardFooter className="p-5 pt-0">
          <Link href={`/service/${service.id}`} className="w-full">
            <Button variant="outline" className="w-full group-hover:border-primary/50 group-hover:text-primary transition-colors">
              View Details
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
