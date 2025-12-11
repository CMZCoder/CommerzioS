/**
 * Customer Bookings Page
 * 
 * View and manage bookings made by the customer
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  ChevronRight,
  Loader2,
  CalendarDays,
  Package,
  User,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BookingDetailDialog } from '@/components/booking-detail-dialog';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  requestedStartTime: string;
  requestedEndTime: string;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  alternativeStartTime: string | null;
  alternativeEndTime: string | null;
  alternativeMessage: string | null;
  alternativeExpiresAt: string | null;
  customerMessage: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  vendorMessage: string | null;
  rejectionReason: string | null;
  totalPrice: string | null;
  currency: string;
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <Clock className="w-4 h-4" />,
    description: "Waiting for vendor response"
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Vendor accepted your request"
  },
  alternative_proposed: {
    label: "Alternative Proposed",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <RefreshCw className="w-4 h-4" />,
    description: "Vendor proposed a different time"
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Booking is confirmed"
  },
  in_progress: {
    label: "In Progress",
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    description: "Service is being performed"
  },
  completed: {
    label: "Completed",
    color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: <CheckCircle2 className="w-4 h-4" />,
    description: "Service completed"
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />,
    description: "Booking was cancelled"
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />,
    description: "Vendor declined the request"
  },
};

export default function BookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  // Get booking ID from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking');
    if (bookingId) {
      // Fetch and select this specific booking
      fetchApi(`/api/bookings/${bookingId}`)
        .then(res => res.ok ? res.json() : null)
        .then(booking => {
          if (booking) {
            setSelectedBooking(booking);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['customer-bookings', activeTab],
    queryFn: async () => {
      const statusFilter = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const res = await fetchApi(`/api/bookings/my${statusFilter}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-6xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <User className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your bookings</h2>
              <p className="text-muted-foreground mb-4">Track and manage all your service bookings in one place</p>
              <Button onClick={() => navigate('/login')}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const getStatusInfo = (status: string) => statusConfig[status] || statusConfig.pending;

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: format(date, 'EEE, MMM d, yyyy'),
      time: format(date, 'h:mm a'),
      relative: formatDistanceToNow(date, { addSuffix: true }),
    };
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="container max-w-6xl mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <CalendarDays className="h-8 w-8 text-indigo-600" />
                  My Bookings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your service bookings
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-card">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="w-3 h-3" />
                Pending
              </TabsTrigger>
              <TabsTrigger value="accepted" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Accepted
              </TabsTrigger>
              <TabsTrigger value="alternative_proposed" className="gap-1">
                <RefreshCw className="w-3 h-3" />
                Alternatives
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1">
                <Star className="w-3 h-3" />
                Completed
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3].map(i => (
                    <Card key={i} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex gap-4">
                          <Skeleton className="w-20 h-20 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                      <Package className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                      {activeTab === 'all'
                        ? "You haven't made any bookings yet. Browse services and book your first appointment!"
                        : `No ${activeTab.replace('_', ' ')} bookings found.`}
                    </p>
                    <Button onClick={() => navigate('/')}>
                      Browse Services
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {bookings.map((booking) => {
                    const statusInfo = getStatusInfo(booking.status);
                    const dateTime = formatDateTime(booking.requestedStartTime);

                    return (
                      <Card
                        key={booking.id}
                        className={cn(
                          "overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]",
                          booking.status === 'alternative_proposed' && "ring-2 ring-blue-500"
                        )}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Service Image */}
                            <div className="w-28 h-full relative flex-shrink-0">
                              {booking.service?.images?.[0] ? (
                                <img
                                  src={booking.service.images[0]}
                                  alt={booking.service.title}
                                  className="w-full h-full object-cover min-h-[120px]"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center min-h-[120px]">
                                  <Package className="w-8 h-8 text-indigo-400" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-4">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h3 className="font-semibold line-clamp-1">
                                    {booking.service?.title || 'Service'}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    #{booking.bookingNumber}
                                  </p>
                                </div>
                                <Badge className={cn("flex-shrink-0", statusInfo.color)}>
                                  {statusInfo.icon}
                                  <span className="ml-1">{statusInfo.label}</span>
                                </Badge>
                              </div>

                              {/* Vendor */}
                              {booking.vendor && (
                                <div className="flex items-center gap-2 mb-2">
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

                              {/* Date/Time */}
                              <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {dateTime.date}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5" />
                                  {dateTime.time}
                                </span>
                              </div>

                              {/* Price */}
                              {booking.totalPrice && (
                                <p className="mt-2 font-semibold text-indigo-600 dark:text-indigo-400">
                                  {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                                </p>
                              )}

                              {/* Alternative notice */}
                              {booking.status === 'alternative_proposed' && (
                                <div className="mt-2 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                                  New time proposed - click to view
                                </div>
                              )}
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center px-2">
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BookingDetailDialog
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
        onBookingUpdate={() => setSelectedBooking(null)}
      />
    </Layout>
  );
}
