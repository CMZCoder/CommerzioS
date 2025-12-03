/**
 * PaymentMethodSelector Component
 * 
 * Three-option payment selector for bookings:
 * - CARD (Recommended) - Full escrow protection
 * - TWINT (Popular in Switzerland) - Instant payment, limited protection
 * - CASH - Pay at service, no protection
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Smartphone, 
  Banknote,
  Shield,
  Zap,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Info,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'card' | 'twint' | 'cash';

interface TwintEligibilityResult {
  allowed: boolean;
  reason?: string;
  eligibilityDetails?: {
    vendorTrustScore: number;
    vendorCompletedBookings: number;
    vendorAccountAgeDays: number;
    vendorDisputeRate: number;
    customerHasPreviousCardBooking: boolean;
    amountWithinLimit: boolean;
  };
}

export interface VendorPaymentSettings {
  acceptCardPayments?: boolean;
  acceptTwintPayments?: boolean;
  acceptCashPayments?: boolean;
}

interface PaymentMethodSelectorProps {
  amount: number; // in cents
  vendorId: string;
  onSelect: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod;
  vendorSettings?: VendorPaymentSettings;
  className?: string;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  amount,
  vendorId,
  onSelect,
  selectedMethod,
  vendorSettings,
  className,
  disabled,
}: PaymentMethodSelectorProps) {
  // Check vendor's accepted payment methods (default to true if not specified)
  const vendorAcceptsCard = vendorSettings?.acceptCardPayments !== false;
  const vendorAcceptsTwint = vendorSettings?.acceptTwintPayments !== false;
  const vendorAcceptsCash = vendorSettings?.acceptCashPayments !== false;

  // Check TWINT eligibility
  const { data: twintEligibility, isLoading: twintLoading } = useQuery<TwintEligibilityResult>({
    queryKey: ['twint-eligibility', vendorId, amount],
    queryFn: async () => {
      const res = await fetch(`/api/payments/twint-eligibility?vendorId=${vendorId}&amount=${amount}`);
      if (!res.ok) {
        // If not authenticated or error, return not allowed
        return { allowed: false, reason: 'Sign in to check TWINT eligibility' };
      }
      return res.json();
    },
    enabled: !!vendorId && amount > 0,
    staleTime: 30000, // Cache for 30 seconds
  });

  const formatAmount = (cents: number) => {
    return `CHF ${(cents / 100).toFixed(2)}`;
  };

  if (twintLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const isTwintAllowed = vendorAcceptsTwint && (twintEligibility?.allowed ?? false);
  const isTwintLockedReason = !vendorAcceptsTwint 
    ? 'This vendor does not accept TWINT payments'
    : twintEligibility?.reason;

  return (
    <div className={cn("space-y-3", className)}>
      {/* CARD Option - Recommended */}
      {vendorAcceptsCard && (
        <PaymentOptionCard
          method="card"
          selected={selectedMethod === 'card'}
          onSelect={() => onSelect('card')}
          disabled={disabled}
          icon={<CreditCard className="w-6 h-6" />}
          title="Protected Payment"
          subtitle="Visa, Mastercard, American Express"
          badge={{ text: "RECOMMENDED", variant: "default" }}
          features={[
            { icon: <Shield className="w-4 h-4" />, text: "Full payment protection until service complete" },
            { icon: <CheckCircle2 className="w-4 h-4" />, text: "Dispute resolution included" },
            { icon: <Banknote className="w-4 h-4" />, text: "Money-back guarantee" },
          ]}
          amount={formatAmount(amount)}
        />
      )}

      {/* TWINT Option */}
      {vendorAcceptsTwint && (
        <PaymentOptionCard
          method="twint"
          selected={selectedMethod === 'twint'}
          onSelect={() => isTwintAllowed && onSelect('twint')}
          disabled={disabled || !isTwintAllowed}
          locked={!isTwintAllowed}
          lockedReason={isTwintLockedReason}
          icon={<Smartphone className="w-6 h-6" />}
          title="TWINT"
          subtitle="Pay instantly with your TWINT app"
          badge={{ text: "POPULAR", variant: "secondary", icon: <span className="text-xs">🇨🇭</span> }}
          features={
            isTwintAllowed
              ? [
                  { icon: <Zap className="w-4 h-4" />, text: "Instant payment to vendor" },
                  { icon: <AlertTriangle className="w-4 h-4" />, text: "Limited protection (refunds at vendor discretion)", warning: true },
                  { icon: <Star className="w-4 h-4" />, text: "Best for vendors you've booked before" },
                ]
              : []
          }
          amount={formatAmount(amount)}
        />
      )}

      {/* CASH Option */}
      {vendorAcceptsCash && (
        <PaymentOptionCard
          method="cash"
          selected={selectedMethod === 'cash'}
          onSelect={() => onSelect('cash')}
          disabled={disabled}
          icon={<Banknote className="w-6 h-6" />}
          title="Cash"
          subtitle="Pay the vendor directly at the service"
          features={[
            { icon: <AlertTriangle className="w-4 h-4" />, text: "No platform protection", warning: true },
            { icon: <Info className="w-4 h-4" />, text: "Resolve issues directly with vendor" },
          ]}
          amount={`${formatAmount(amount)} (at service)`}
        />
      )}
      
      {/* No payment methods available */}
      {!vendorAcceptsCard && !vendorAcceptsTwint && !vendorAcceptsCash && (
        <div className="text-center py-8 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>This vendor has not configured any payment methods.</p>
        </div>
      )}
    </div>
  );
}

interface PaymentOptionCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  locked?: boolean;
  lockedReason?: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: { text: string; variant: 'default' | 'secondary'; icon?: React.ReactNode };
  features: Array<{ icon: React.ReactNode; text: string; warning?: boolean }>;
  amount: string;
}

function PaymentOptionCard({
  method,
  selected,
  onSelect,
  disabled,
  locked,
  lockedReason,
  icon,
  title,
  subtitle,
  badge,
  features,
  amount,
}: PaymentOptionCardProps) {
  const isClickable = !disabled && !locked;

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200",
        selected && "ring-2 ring-primary border-primary",
        isClickable && "hover:shadow-md hover:border-primary/50",
        (disabled || locked) && "opacity-60 cursor-not-allowed bg-muted/30",
      )}
      onClick={() => isClickable && onSelect()}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{title}</h3>
                {badge && (
                  <Badge 
                    variant={badge.variant} 
                    className={cn(
                      "text-xs",
                      badge.variant === 'default' && "bg-primary/90"
                    )}
                  >
                    {badge.icon && <span className="mr-1">{badge.icon}</span>}
                    {badge.text}
                  </Badge>
                )}
                {locked && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    LOCKED
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          
          {/* Selection indicator */}
          <div className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1",
            selected 
              ? "border-primary bg-primary" 
              : "border-muted-foreground/30"
          )}>
            {selected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
          </div>
        </div>

        {/* Locked state message */}
        {locked && lockedReason && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <p className="text-sm text-muted-foreground">
              {lockedReason}
            </p>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && !locked && (
          <div className="space-y-1.5 mb-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center gap-2 text-sm",
                  feature.warning ? "text-amber-600 dark:text-amber-500" : "text-muted-foreground"
                )}
              >
                {feature.icon}
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Amount */}
        {!locked && (
          <div className="text-right">
            <span className={cn(
              "font-semibold",
              selected ? "text-primary" : "text-foreground"
            )}>
              {amount}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PaymentMethodSelector;
