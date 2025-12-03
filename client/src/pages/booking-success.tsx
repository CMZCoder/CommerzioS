/**
 * Booking Success Page
 * 
 * Shows confirmation after a successful booking with:
 * - Booking details summary
 * - Next steps for the customer
 * - Quick actions (view bookings, chat with vendor, return home)
 */

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Home,
  CalendarDays,
  ArrowRight,
  Sparkles,
  Bell,
  User,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  PartyPopper,
  Share2
} from 'lucide-react';

interface BookingDetails {
  id: string;
  bookingNumber: string;
  status: string;
  requestedStartTime: string;
  requestedEndTime: string;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  customerMessage: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  totalPrice: string | null;
  currency: string;
  paymentMethod: string;
  createdAt: string;
  service?: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
  vendor?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function BookingSuccessPage() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Get booking ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('booking');
    setBookingId(id);
  }, []);

  // Fetch booking details
  const { data: booking, isLoading, error } = useQuery<BookingDetails>({
    queryKey: ['booking-success', bookingId],
    queryFn: async () => {
      if (!bookingId) throw new Error('No booking ID');
      const res = await fetch(`/api/bookings/${bookingId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch booking');
      return res.json();
    },
    enabled: !!bookingId,
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="w-4 h-4" />;
      case 'twint': return <Wallet className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'card': return 'Credit/Debit Card';
      case 'twint': return 'TWINT';
      case 'cash': return 'Cash at Service';
      default: return method;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: "Booking Request Sent!",
          description: "The vendor will review your request and respond shortly.",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30"
        };
      case 'accepted':
      case 'confirmed':
        return {
          title: "Booking Confirmed!",
          description: "Your booking has been confirmed. See you there!",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30"
        };
      default:
        return {
          title: "Booking Submitted!",
          description: "We'll keep you updated on your booking status.",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/30"
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12">
          <div className="container max-w-2xl mx-auto px-4">
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-20 h-20 rounded-full mb-4" />
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48 mb-8" />
                  <div className="w-full space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  // Error or no booking
  if (error || !booking) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 py-12">
          <div className="container max-w-2xl mx-auto px-4">
            <Card className="border-0 shadow-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                  <CalendarDays className="w-10 h-10 text-slate-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
                <p className="text-muted-foreground mb-6">
                  We couldn't find the booking details. It may have been removed or the link is invalid.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setLocation('/bookings')}>
                    <CalendarDays className="w-4 h-4 mr-2" />
                    View My Bookings
                  </Button>
                  <Button onClick={() => setLocation('/')}>
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  const statusInfo = getStatusMessage(booking.status);
  const startTime = booking.confirmedStartTime || booking.requestedStartTime;
  const endTime = booking.confirmedEndTime || booking.requestedEndTime;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 py-8 md:py-12">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Success Header Card */}
          <Card className="border-0 shadow-xl overflow-hidden mb-6">
            <div className={cn("p-8 text-center", statusInfo.bgColor)}>
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                  <CheckCircle2 className={cn("w-10 h-10", statusInfo.color)} />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                  <PartyPopper className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h1 className={cn("text-2xl md:text-3xl font-bold mb-2", statusInfo.color)}>
                {statusInfo.title}
              </h1>
              <p className="text-muted-foreground">
                {statusInfo.description}
              </p>
              
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm">
                <span className="text-sm text-muted-foreground">Booking #</span>
                <span className="font-mono font-semibold">{booking.bookingNumber}</span>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Service Info */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                {booking.service?.images?.[0] ? (
                  <img 
                    src={booking.service.images[0]} 
                    alt={booking.service.title}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {booking.service?.title || 'Service'}
                  </h3>
                  {booking.vendor && (
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={booking.vendor.profileImageUrl} />
                        <AvatarFallback className="text-[10px]">
                          {booking.vendor.firstName?.[0]}{booking.vendor.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {booking.vendor.firstName} {booking.vendor.lastName}
                      </span>
                    </div>
                  )}
                  {booking.totalPrice && (
                    <p className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Booking Details */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Appointment Details
                </h4>
                
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(startTime), 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">
                        {format(new Date(startTime), 'h:mm a')} - {format(new Date(endTime), 'h:mm a')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      {getPaymentMethodIcon(booking.paymentMethod)}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment</p>
                      <p className="font-medium">{getPaymentMethodLabel(booking.paymentMethod)}</p>
                    </div>
                  </div>

                  {booking.customerAddress && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{booking.customerAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* What's Next */}
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  What's Next?
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        We'll notify you
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        You'll receive updates about your booking status and reminders before your appointment.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-100">
                        Chat with the vendor
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Have questions? You can message the vendor directly to discuss details.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-14" 
              onClick={() => setLocation('/bookings')}
            >
              <CalendarDays className="w-5 h-5 mr-2" />
              My Bookings
            </Button>
            
            {booking.vendor && (
              <Button 
                variant="outline" 
                className="h-14"
                onClick={() => setLocation(`/chat?vendor=${booking.vendor?.id}&booking=${booking.id}`)}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Chat with Vendor
              </Button>
            )}
            
            <Button 
              className="h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              onClick={() => setLocation('/')}
            >
              <Home className="w-5 h-5 mr-2" />
              Explore More
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
