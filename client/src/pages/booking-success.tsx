/**
 * Booking Success Page
 * 
 * Shows confirmation after a successful booking with:
 * - Full booking details summary
 * - Vendor information with ratings
 * - Service details with images
 * - Quick actions (chat, view bookings, add to calendar)
 */

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Home,
  CalendarDays,
  CalendarPlus,
  Sparkles,
  Bell,
  User,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  PartyPopper,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Award
} from 'lucide-react';
import { toast } from 'sonner';

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
    description?: string;
    price: string;
    images: string[];
    category?: string;
  };
  vendor?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
    email?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
    memberSince?: string;
  };
}

export default function BookingSuccessPage() {
  const [, setLocation] = useLocation();
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      const res = await fetchApi(`/api/bookings/${bookingId}`);
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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          title: "Booking Request Sent!",
          description: "The vendor will review your request and respond shortly.",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
          badgeVariant: "warning" as const
        };
      case 'accepted':
      case 'confirmed':
        return {
          title: "Booking Confirmed!",
          description: "Your booking has been confirmed. See you there!",
          color: "text-green-600",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          badgeVariant: "success" as const
        };
      default:
        return {
          title: "Booking Submitted!",
          description: "We'll keep you updated on your booking status.",
          color: "text-indigo-600",
          bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
          badgeVariant: "default" as const
        };
    }
  };

  const copyBookingNumber = () => {
    if (booking?.bookingNumber) {
      navigator.clipboard.writeText(booking.bookingNumber);
      setCopied(true);
      toast.success('Booking number copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const addToCalendar = () => {
    if (!booking) return;
    
    const startTime = booking.confirmedStartTime || booking.requestedStartTime;
    const endTime = booking.confirmedEndTime || booking.requestedEndTime;
    const title = encodeURIComponent(`${booking.service?.title || 'Service Appointment'}`);
    const details = encodeURIComponent(
      `Booking #${booking.bookingNumber}\n` +
      `Service: ${booking.service?.title || 'Service'}\n` +
      `Vendor: ${booking.vendor?.firstName} ${booking.vendor?.lastName}\n` +
      `${booking.customerAddress ? `Location: ${booking.customerAddress}` : ''}`
    );
    const location = encodeURIComponent(booking.customerAddress || '');
    const startDate = new Date(startTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endDate = new Date(endTime).toISOString().replace(/-|:|\.\d\d\d/g, '');
    
    // Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    
    window.open(googleCalendarUrl, '_blank');
    toast.success('Opening calendar...');
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4",
              star <= rating 
                ? "fill-amber-400 text-amber-400" 
                : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
            )}
          />
        ))}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="container max-w-6xl mx-auto px-4 py-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="h-[500px] rounded-2xl" />
              <Skeleton className="h-[500px] rounded-2xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error or no booking
  if (error || !booking) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
          <Card className="border-0 shadow-xl max-w-md mx-4">
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
      </Layout>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const startTime = booking.confirmedStartTime || booking.requestedStartTime;
  const endTime = booking.confirmedEndTime || booking.requestedEndTime;
  const vendorRating = booking.vendor?.rating || 4.8;
  const reviewCount = booking.vendor?.reviewCount || 0;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-amber-50/50 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
        {/* Success Banner */}
        <div className={cn("py-8 text-center", statusInfo.bgColor)}>
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-col items-center">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center">
                  <CheckCircle2 className={cn("w-10 h-10", statusInfo.color)} />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md animate-bounce">
                  <PartyPopper className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <h1 className={cn("text-3xl md:text-4xl font-bold mb-2", statusInfo.color)}>
                {statusInfo.title}
              </h1>
              <p className="text-muted-foreground text-lg max-w-md">
                {statusInfo.description}
              </p>
              
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={copyBookingNumber}>
                <span className="text-sm text-muted-foreground">Booking #</span>
                <span className="font-mono font-semibold">{booking.bookingNumber}</span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Service & Booking Details */}
            <div className="space-y-6">
              {/* Service Card */}
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="relative">
                  {booking.service?.images?.[0] ? (
                    <img 
                      src={booking.service.images[0]} 
                      alt={booking.service.title}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
                      <Sparkles className="w-16 h-16 text-indigo-400" />
                    </div>
                  )}
                  {booking.service?.category && (
                    <Badge className="absolute top-4 left-4 bg-white/90 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200">
                      {booking.service.category}
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">
                        {booking.service?.title || 'Service'}
                      </h2>
                      {booking.service?.description && (
                        <p className="text-muted-foreground line-clamp-2">
                          {booking.service.description}
                        </p>
                      )}
                    </div>
                    {booking.totalPrice && (
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/service/${booking.service?.id}`}>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      View Service Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Appointment Details Card */}
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    Appointment Details
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold text-lg">{format(new Date(startTime), 'EEEE, MMMM d, yyyy')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-semibold text-lg">
                          {format(new Date(startTime), 'h:mm a')} - {format(new Date(endTime), 'h:mm a')}
                        </p>
                      </div>
                    </div>

                    {booking.customerAddress && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-semibold">{booking.customerAddress}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        {getPaymentMethodIcon(booking.paymentMethod)}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-semibold">{getPaymentMethodLabel(booking.paymentMethod)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Vendor & Actions */}
            <div className="space-y-6">
              {/* Vendor Card */}
              {booking.vendor && (
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-primary" />
                      Your Service Provider
                    </h3>
                    
                    <div className="flex items-start gap-4 mb-6">
                      <Link href={`/users/${booking.vendor.id}`}>
                        <Avatar className="w-20 h-20 border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform">
                          <AvatarImage src={booking.vendor.profileImageUrl} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {booking.vendor.firstName?.[0]}{booking.vendor.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1">
                        <Link href={`/users/${booking.vendor.id}`}>
                          <h4 className="text-xl font-bold hover:text-primary transition-colors cursor-pointer flex items-center gap-2">
                            {booking.vendor.firstName} {booking.vendor.lastName}
                            {booking.vendor.verified && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />
                                </TooltipTrigger>
                                <TooltipContent>Verified Provider</TooltipContent>
                              </Tooltip>
                            )}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(vendorRating)}
                          <span className="font-semibold">{vendorRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({reviewCount} reviews)</span>
                        </div>
                        {booking.vendor.memberSince && (
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            Member since {format(new Date(booking.vendor.memberSince), 'MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator className="my-4" />
                    
                    {/* Vendor Contact Info */}
                    <div className="space-y-3 mb-6">
                      {booking.vendor.phone && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <Phone className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{booking.vendor.phone}</span>
                        </div>
                      )}
                      {booking.vendor.email && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <Mail className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">{booking.vendor.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Vendor Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link href={`/users/${booking.vendor.id}`} className="contents">
                        <Button variant="outline" className="w-full gap-2">
                          <User className="w-4 h-4" />
                          View Profile
                        </Button>
                      </Link>
                      <Button 
                        className="w-full gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        onClick={() => setLocation(`/chat?vendor=${booking.vendor?.id}&booking=${booking.id}`)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* What's Next Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    What's Next?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                        <Bell className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Stay Updated</p>
                        <p className="text-sm text-muted-foreground">
                          You'll receive notifications about your booking status and reminders.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Ask Questions</p>
                        <p className="text-sm text-muted-foreground">
                          Have questions? Message your vendor directly anytime.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                        <CalendarPlus className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Don't Forget</p>
                        <p className="text-sm text-muted-foreground">
                          Add this appointment to your calendar so you don't miss it.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  size="lg"
                  className="w-full h-14 text-lg gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  onClick={addToCalendar}
                >
                  <CalendarPlus className="w-5 h-5" />
                  Add to Calendar
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-12 gap-2" 
                    onClick={() => setLocation('/bookings')}
                  >
                    <CalendarDays className="w-5 h-5" />
                    My Bookings
                  </Button>
                  
                  <Button 
                    variant="outline"
                    size="lg"
                    className="h-12 gap-2"
                    onClick={() => setLocation('/')}
                  >
                    <Home className="w-5 h-5" />
                    Explore More
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
