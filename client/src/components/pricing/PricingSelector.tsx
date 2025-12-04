/**
 * PricingSelector Component
 * 
 * Customer-facing component to select a pricing option for a service
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';

interface PricingOption {
  id: string;
  serviceId: string;
  label: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: 'one_time' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  durationMinutes: number | null;
  sortOrder: number;
  isActive: boolean;
}

interface PricingSelectorProps {
  serviceId: string;
  selectedOptionId: string | null;
  onSelect: (option: PricingOption) => void;
  className?: string;
}

const BILLING_LABELS: Record<string, string> = {
  one_time: 'one-time',
  hourly: '/hour',
  daily: '/day',
  weekly: '/week',
  monthly: '/month',
  yearly: '/year',
};

export function PricingSelector({ 
  serviceId, 
  selectedOptionId, 
  onSelect,
  className 
}: PricingSelectorProps) {
  const { data: pricingOptions = [], isLoading } = useQuery<PricingOption[]>({
    queryKey: ['pricing-options', serviceId],
    queryFn: async () => {
      const res = await fetchApi(`/api/services/${serviceId}/pricing-options`);
      if (!res.ok) throw new Error('Failed to fetch pricing options');
      return res.json();
    },
  });

  const formatPrice = (price: string, currency: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(price));
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (pricingOptions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-base font-semibold">Select Package</Label>
      <RadioGroup 
        value={selectedOptionId || ''} 
        onValueChange={(value) => {
          const option = pricingOptions.find(o => o.id === value);
          if (option) onSelect(option);
        }}
      >
        {pricingOptions.map((option, index) => {
          const isSelected = selectedOptionId === option.id;
          const isPopular = index === 1 && pricingOptions.length >= 3; // Middle option is "popular"
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "relative cursor-pointer transition-all",
                isSelected 
                  ? "border-primary ring-2 ring-primary/20" 
                  : "hover:border-primary/50",
                isPopular && "border-amber-500/50"
              )}
              onClick={() => onSelect(option)}
            >
              {isPopular && (
                <Badge 
                  className="absolute -top-2 right-4 bg-amber-500 hover:bg-amber-500"
                >
                  Popular
                </Badge>
              )}
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem 
                    value={option.id} 
                    id={option.id}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Label 
                        htmlFor={option.id} 
                        className="text-base font-medium cursor-pointer"
                      >
                        {option.label}
                      </Label>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {formatPrice(option.price, option.currency)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {BILLING_LABELS[option.billingInterval]}
                        </span>
                      </div>
                    </div>
                    
                    {option.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2">
                      {option.durationMinutes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(option.durationMinutes)}
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </RadioGroup>
    </div>
  );
}

export default PricingSelector;

