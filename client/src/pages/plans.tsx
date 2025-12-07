import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/config";
import { toast } from "sonner";
import type { Plan } from "@shared/schema";

export default function PlansPage() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['/api/plans'],
  });

  const subscribeMutation = useMutation({
    mutationFn: async ({ planId, billingCycle }: { planId: string; billingCycle: 'monthly' | 'yearly' }) => {
      const res = await fetchApi(`/api/plans/${planId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingCycle }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to subscribe');
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else if (data.redirectUrl) {
        // Direct subscription (free plan or dev mode)
        toast.success(data.message || 'Successfully subscribed!');
        setLocation(data.redirectUrl);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubscribe = (planId: string, billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    if (!isAuthenticated) {
      toast.error('Please log in to subscribe to a plan');
      setLocation('/auth');
      return;
    }
    subscribeMutation.mutate({ planId, billingCycle });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading plans...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const sortedPlans = plans?.sort((a, b) => a.sortOrder - b.sortOrder) || [];

  const calculateYearlySavings = (monthly: string, yearly: string) => {
    const monthlyCost = parseFloat(monthly) * 12;
    const yearlyCost = parseFloat(yearly);
    const savings = monthlyCost - yearlyCost;
    const savingsPercentage = Math.round((savings / monthlyCost) * 100);
    return { savings, savingsPercentage };
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="heading-plans">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include renewable listings and flexible pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedPlans.map((plan) => {
            const { savings, savingsPercentage } = calculateYearlySavings(
              plan.priceMonthly,
              plan.priceYearly
            );
            const isPremium = plan.slug === 'premium';
            const isFree = plan.slug === 'free';

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isPremium ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
                }`}
                data-testid={`card-plan-${plan.slug}`}
              >
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1" data-testid="badge-most-popular">
                      <Sparkles className="w-3 h-3 mr-1 inline" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={isPremium ? 'pt-8' : ''}>
                  <CardTitle className="text-2xl" data-testid={`text-plan-name-${plan.slug}`}>
                    {plan.name}
                  </CardTitle>
                  {plan.description && (
                    <CardDescription data-testid={`text-plan-description-${plan.slug}`}>
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing */}
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold" data-testid={`text-monthly-price-${plan.slug}`}>
                        CHF {plan.priceMonthly}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {!isFree && parseFloat(plan.priceYearly) > 0 && (
                      <div className="text-sm text-muted-foreground">
                        <div data-testid={`text-yearly-price-${plan.slug}`}>
                          CHF {plan.priceYearly}/year
                        </div>
                        {savings > 0 && (
                          <div className="text-green-600 font-medium" data-testid={`text-savings-${plan.slug}`}>
                            Save {savingsPercentage}% annually
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2" data-testid={`feature-max-images-${plan.slug}`}>
                      <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{plan.maxImages} images per listing</span>
                    </div>

                    <div className="flex items-start gap-2" data-testid={`feature-duration-${plan.slug}`}>
                      <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{plan.listingDurationDays} day listing duration</span>
                    </div>

                    <div className="flex items-start gap-2" data-testid={`feature-renew-${plan.slug}`}>
                      <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">Renewable listings</span>
                    </div>

                    {plan.featuredListing && (
                      <div className="flex items-start gap-2" data-testid={`feature-featured-${plan.slug}`}>
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">Featured listings</span>
                      </div>
                    )}

                    {plan.prioritySupport && (
                      <div className="flex items-start gap-2" data-testid={`feature-support-${plan.slug}`}>
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">Priority support</span>
                      </div>
                    )}

                    {plan.analyticsAccess && (
                      <div className="flex items-start gap-2" data-testid={`feature-analytics-${plan.slug}`}>
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">Analytics access</span>
                      </div>
                    )}

                    {plan.customBranding && (
                      <div className="flex items-start gap-2" data-testid={`feature-branding-${plan.slug}`}>
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-sm">Custom branding</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter>
                  {user?.plan?.id === plan.id ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                      data-testid={`button-current-plan-${plan.slug}`}
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isPremium ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribeMutation.isPending}
                      data-testid={`button-choose-plan-${plan.slug}`}
                    >
                      {subscribeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        isFree ? 'Get Started' : 'Choose Plan'
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Flexible Billing</h2>
          <p className="text-muted-foreground mb-6">
            All paid plans are available with monthly or yearly billing. Save money with annual subscriptions 
            and enjoy the flexibility to upgrade or downgrade your plan at any time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">14-Day Listings</h3>
              <p className="text-muted-foreground">
                All plans include renewable listings with flexible duration options.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">No Hidden Fees</h3>
              <p className="text-muted-foreground">
                Transparent pricing with no surprise charges or commission fees.
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Cancel Anytime</h3>
              <p className="text-muted-foreground">
                Flexible plans that you can upgrade, downgrade, or cancel at any time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
