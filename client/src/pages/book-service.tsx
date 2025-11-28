/**
 * Book Service Page
 * 
 * Allows customers to book a service with date/time selection
 */

import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { BookingRequestForm } from '@/components/booking/BookingRequestForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, type ServiceWithDetails } from '@/lib/api';

export default function BookServicePage() {
  const [match, params] = useRoute("/service/:id/book");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const serviceId = params?.id;

  // Fetch service details
  const { data: service, isLoading: serviceLoading, error } = useQuery<ServiceWithDetails>({
    queryKey: [`/api/services/${serviceId}`],
    queryFn: () => apiRequest(`/api/services/${serviceId}`),
    enabled: !!serviceId,
  });

  // Handle authentication check
  if (!authLoading && !isAuthenticated) {
    return (
      <Layout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Sign In Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to be signed in to book a service
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setLocation(`/service/${serviceId}`)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Service
                </Button>
                <Button onClick={() => setLocation('/login')}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Loading state
  if (serviceLoading || authLoading) {
    return (
      <Layout>
        <div className="container max-w-2xl py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <Layout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Service Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The service you're trying to book doesn't exist or has been removed
              </p>
              <Button onClick={() => setLocation('/')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Can't book your own service
  if (user && service.ownerId === user.id) {
    return (
      <Layout>
        <div className="container max-w-2xl py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Can't Book Your Own Service</h1>
              <p className="text-muted-foreground mb-6">
                You cannot book a service that you own
              </p>
              <Button onClick={() => setLocation(`/service/${serviceId}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Service
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
        <div className="container max-w-2xl">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => setLocation(`/service/${serviceId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {service.title}
          </Button>

          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Calendar className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Book Service</h1>
            <p className="text-muted-foreground">
              Select your preferred date and time
            </p>
          </div>

          {/* Booking Form */}
          <BookingRequestForm
            serviceId={serviceId!}
            serviceName={service.title}
            vendorId={service.ownerId}
            onSuccess={(booking) => {
              // Redirect to booking confirmation or chat
              setLocation(`/chat?booking=${booking.id}&vendor=${service.ownerId}`);
            }}
            onCancel={() => setLocation(`/service/${serviceId}`)}
          />

          {/* Service Summary Card */}
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {service.images && service.images.length > 0 ? (
                  <img 
                    src={service.images[0]} 
                    alt={service.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    by {service.owner.firstName} {service.owner.lastName}
                  </p>
                  <p className="text-primary font-bold">
                    CHF {service.price}/{service.priceUnit}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

