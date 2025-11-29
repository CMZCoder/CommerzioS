/**
 * Customer Bookings Page
 * 
 * View and manage bookings made by the customer
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, formatDistanceToNow, isPast, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Calendar,
  Clock, 
  MapPin,
  MessageSquare,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Star,
  ExternalLink,
  ChevronRight,
  Loader2,
  CalendarDays,
  Package,
  User,
  DollarSign,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

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
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Get booking ID from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking');
    if (bookingId) {
      // Fetch and select this specific booking
      fetch(`/api/bookings/${bookingId}`, { credentials: 'include' })
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
      const res = await fetch(`/api/bookings/my${statusFilter}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
    enabled: !!user,
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      toast.success('Booking cancelled successfully');
      setShowCancelDialog(false);
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });

  // Accept alternative time mutation
  const acceptAlternativeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/accept-alternative`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to accept alternative');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      toast.success('Alternative time accepted!');
      setSelectedBooking(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to accept alternative');
    },
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
            <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-white dark:bg-slate-900">
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
                    const isUpcoming = isFuture(new Date(booking.requestedStartTime));

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

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Booking Details
                </DialogTitle>
                <DialogDescription>
                  #{selectedBooking.bookingNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={getStatusInfo(selectedBooking.status).color}>
                    {getStatusInfo(selectedBooking.status).icon}
                    <span className="ml-1">{getStatusInfo(selectedBooking.status).label}</span>
                  </Badge>
                </div>

                {/* Service Info */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Package className="w-4 h-4" /> Service
                  </h4>
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 flex items-center gap-3">
                      {selectedBooking.service?.images?.[0] ? (
                        <img 
                          src={selectedBooking.service.images[0]} 
                          alt={selectedBooking.service.title}
                          className="w-20 h-20 object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="font-medium">{selectedBooking.service?.title || 'Service'}</p>
                        {selectedBooking.totalPrice && (
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {selectedBooking.currency} {parseFloat(selectedBooking.totalPrice).toFixed(2)}
                          </p>
                        )}
                        <Link href={`/service/${selectedBooking.service?.id}`}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View Service <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vendor Info */}
                {selectedBooking.vendor && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> Service Provider
                    </h4>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedBooking.vendor.profileImageUrl} />
                        <AvatarFallback>
                          {selectedBooking.vendor.firstName?.[0]}{selectedBooking.vendor.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {selectedBooking.vendor.firstName} {selectedBooking.vendor.lastName}
                        </p>
                        <Link href={`/users/${selectedBooking.vendor.id}`}>
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            View Profile <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                      <Link href={`/chat?vendor=${selectedBooking.vendor.id}`}>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Date/Time */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">Start</p>
                      <p className="font-medium text-sm">
                        {format(new Date(selectedBooking.requestedStartTime), 'PPp')}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-1">End</p>
                      <p className="font-medium text-sm">
                        {format(new Date(selectedBooking.requestedEndTime), 'PPp')}
                      </p>
                    </div>
                  </div>

                  {/* Alternative Proposal */}
                  {selectedBooking.status === 'alternative_proposed' && selectedBooking.alternativeStartTime && (
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <RefreshCw className="w-4 h-4 inline mr-1" />
                        Alternative Time Proposed
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400">New Start</p>
                          <p className="font-medium text-sm">
                            {format(new Date(selectedBooking.alternativeStartTime), 'PPp')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400">New End</p>
                          <p className="font-medium text-sm">
                            {selectedBooking.alternativeEndTime && format(new Date(selectedBooking.alternativeEndTime), 'PPp')}
                          </p>
                        </div>
                      </div>
                      {selectedBooking.alternativeMessage && (
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                          "{selectedBooking.alternativeMessage}"
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => acceptAlternativeMutation.mutate(selectedBooking.id)}
                          disabled={acceptAlternativeMutation.isPending}
                          className="flex-1"
                        >
                          {acceptAlternativeMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                          )}
                          Accept
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowCancelDialog(true)}
                          className="flex-1"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                {selectedBooking.customerAddress && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Location
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg border">
                      {selectedBooking.customerAddress}
                    </p>
                  </div>
                )}

                {/* Messages */}
                {(selectedBooking.customerMessage || selectedBooking.vendorMessage || selectedBooking.rejectionReason) && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Messages
                    </h4>
                    {selectedBooking.customerMessage && (
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <p className="text-xs text-muted-foreground mb-1">Your message</p>
                        <p className="text-sm">{selectedBooking.customerMessage}</p>
                      </div>
                    )}
                    {selectedBooking.vendorMessage && (
                      <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Vendor response</p>
                        <p className="text-sm">{selectedBooking.vendorMessage}</p>
                      </div>
                    )}
                    {selectedBooking.rejectionReason && (
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Reason for decline</p>
                        <p className="text-sm">{selectedBooking.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed - Leave Review */}
                {selectedBooking.status === 'completed' && selectedBooking.service && (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                    <Star className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                      How was your experience?
                    </p>
                    <Link href={`/service/${selectedBooking.service.id}?review=true`}>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <Star className="w-4 h-4 mr-1" />
                        Leave a Review
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                {/* Cancel button for pending/accepted bookings */}
                {['pending', 'accepted', 'confirmed'].includes(selectedBooking.status) && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel Booking
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && cancelMutation.mutate(selectedBooking.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

