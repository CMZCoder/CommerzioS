/**
 * StripeConnectOnboarding Component
 * 
 * Guides vendors through Stripe Connect onboarding to receive payments
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2,
  Shield,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ConnectStatus {
  hasAccount: boolean;
  isOnboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

interface StripeConnectOnboardingProps {
  className?: string;
}

export function StripeConnectOnboarding({ className }: StripeConnectOnboardingProps) {
  // Check Stripe configuration
  const { data: config } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: async () => {
      const res = await fetch('/api/payments/config');
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
  });

  // Get Connect account status
  const { data: status, isLoading: statusLoading, refetch } = useQuery<ConnectStatus>({
    queryKey: ['stripe-connect-status'],
    queryFn: async () => {
      const res = await fetch('/api/payments/connect/status');
      if (!res.ok) throw new Error('Failed to fetch status');
      return res.json();
    },
  });

  // Create/continue onboarding
  const onboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/payments/connect/create', {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to start onboarding');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
        toast.success('Opening Stripe onboarding...');
      } else {
        toast.success('Account already set up!');
        refetch();
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!config?.isConfigured) {
    return (
      <Card className={cn("border-amber-200 bg-amber-50", className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle className="w-6 h-6" />
            <div>
              <p className="font-medium">Payment System Not Configured</p>
              <p className="text-sm">
                Stripe is not yet configured. Please contact the administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (statusLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isFullySetUp = status?.isOnboarded && status?.chargesEnabled && status?.payoutsEnabled;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Payment Setup</CardTitle>
              <CardDescription>
                Connect your bank account to receive payments
              </CardDescription>
            </div>
          </div>
          {isFullySetUp && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Checklist */}
        <div className="space-y-3">
          <StatusItem
            label="Stripe Account"
            description="Create a Stripe account to process payments"
            isComplete={status?.hasAccount}
          />
          <StatusItem
            label="Identity Verification"
            description="Complete Stripe's identity verification process"
            isComplete={status?.isOnboarded}
          />
          <StatusItem
            label="Accept Payments"
            description="Your account can accept customer payments"
            isComplete={status?.chargesEnabled}
          />
          <StatusItem
            label="Receive Payouts"
            description="Funds can be transferred to your bank account"
            isComplete={status?.payoutsEnabled}
          />
        </div>

        {/* Action Button */}
        {!isFullySetUp ? (
          <div className="space-y-3">
            <Button
              onClick={() => onboardingMutation.mutate()}
              disabled={onboardingMutation.isPending}
              className="w-full"
              size="lg"
            >
              {onboardingMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Opening Stripe...
                </>
              ) : status?.hasAccount ? (
                <>
                  Continue Setup
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Start Setup
                  <ExternalLink className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You'll be redirected to Stripe's secure onboarding
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  You're all set!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You can now receive payments from customers. Payouts are processed automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <Shield className="w-4 h-4 text-primary" />
              Secure Payments
            </div>
            <p className="text-xs text-muted-foreground">
              All payments are processed securely by Stripe
            </p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              Platform Fee: {config?.platformFeePercentage ? `${config.platformFeePercentage * 100}%` : '10%'}
            </div>
            <p className="text-xs text-muted-foreground">
              A small fee is deducted from each transaction
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusItem({ 
  label, 
  description, 
  isComplete 
}: { 
  label: string; 
  description: string; 
  isComplete?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn(
        "mt-0.5 rounded-full p-1",
        isComplete 
          ? "bg-green-100 text-green-600" 
          : "bg-muted text-muted-foreground"
      )}>
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
      </div>
      <div>
        <p className={cn(
          "text-sm font-medium",
          isComplete && "text-green-700 dark:text-green-400"
        )}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default StripeConnectOnboarding;

