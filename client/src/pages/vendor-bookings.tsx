/**
 * Vendor Bookings Page
 * 
 * Enhanced dashboard for vendors to manage:
 * - Booking requests
 * - Availability calendar
 * - Schedule management
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingCard } from '@/components/booking/BookingCard';
import { VendorAvailabilityCalendar } from '@/components/booking/VendorAvailabilityCalendar';
import { VendorWeeklyCalendar } from '@/components/booking/VendorWeeklyCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  LayoutDashboard,
  ListTodo,
  Settings,
  TrendingUp,
  DollarSign,
  CalendarDays,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

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
  queuePosition?: number | null;
  createdAt: string;
  customerId?: string;
  serviceId?: string;
  customer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  service?: {
    id: string;
    title: string;
    images: string[];
  };
}

export default function VendorBookingsPage() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [mainTab, setMainTab] = useState<'bookings' | 'calendar' | 'weekly'>('bookings');
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionType, setActionType] = useState<'reject' | 'alternative' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [alternativeDate, setAlternativeDate] = useState<Date>();
  const [alternativeTime, setAlternativeTime] = useState({ start: '09:00', end: '10:00' });
  const [alternativeMessage, setAlternativeMessage] = useState('');
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  // Handle URL query params for direct navigation from notifications
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking');
    const tab = params.get('tab');
    
    if (tab && ['pending', 'accepted', 'confirmed', 'in_progress', 'completed', 'all'].includes(tab)) {
      setActiveTab(tab);
    }
    
    if (bookingId) {
      setHighlightedBookingId(bookingId);
      // Fetch the specific booking to show in detail
      fetchApi(`/api/bookings/${bookingId}`)
        .then(res => res.ok ? res.json() : null)
        .then(booking => {
          if (booking) {
            // Set the correct tab based on booking status
            if (booking.status && booking.status !== activeTab && activeTab !== 'all') {
              setActiveTab(booking.status);
            }
            setSelectedBooking(booking);
          }
        })
        .catch(console.error);
    }
  }, []);

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery<Booking[]>({
    queryKey: ['vendor-bookings', activeTab],
    queryFn: async () => {
      const statusFilter = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const res = await fetchApi(`/api/vendor/bookings${statusFilter}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  // Fetch pending count
  const { data: pendingData } = useQuery({
    queryKey: ['vendor-bookings-pending-count'],
    queryFn: async () => {
      const res = await fetchApi('/api/vendor/bookings/pending-count');
      if (!res.ok) throw new Error('Failed to fetch count');
      return res.json();
    },
  });

  // Accept booking
  const acceptMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetchApi(`/api/bookings/${bookingId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to accept booking');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings-pending-count'] });
      toast.success('Booking accepted!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reject booking
  const rejectMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const res = await fetchApi(`/api/bookings/${bookingId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject booking');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings-pending-count'] });
      toast.success('Booking rejected');
      setActionType(null);
      setSelectedBooking(null);
      setRejectReason('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Propose alternative
  const alternativeMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      startTime, 
      endTime, 
      message 
    }: { 
      bookingId: string; 
      startTime: string; 
      endTime: string; 
      message: string;
    }) => {
      const res = await fetchApi(`/api/bookings/${bookingId}/propose-alternative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alternativeStartTime: startTime,
          alternativeEndTime: endTime,
          message,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to propose alternative');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      toast.success('Alternative time proposed');
      setActionType(null);
      setSelectedBooking(null);
      setAlternativeDate(undefined);
      setAlternativeTime({ start: '09:00', end: '10:00' });
      setAlternativeMessage('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Complete booking
  const completeMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await fetchApi(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to complete booking');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      toast.success('Booking marked as completed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleProposeAlternative = () => {
    if (!selectedBooking || !alternativeDate) return;

    const [startHour, startMin] = alternativeTime.start.split(':').map(Number);
    const [endHour, endMin] = alternativeTime.end.split(':').map(Number);

    const startDate = new Date(alternativeDate);
    startDate.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(alternativeDate);
    endDate.setHours(endHour, endMin, 0, 0);

    alternativeMutation.mutate({
      bookingId: selectedBooking.id,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      message: alternativeMessage,
    });
  };

  const getTabCount = (status: string) => {
    if (status === 'pending') return pendingData?.count || 0;
    return bookings.filter(b => b.status === status).length;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="container max-w-6xl py-6 md:py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Booking Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage your booking requests, schedule, and availability
              </p>
            </div>
            
            {/* Main Tab Switcher */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={mainTab === 'bookings' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMainTab('bookings')}
                className={cn(
                  "gap-2 transition-all",
                  mainTab === 'bookings' && "shadow-sm"
                )}
              >
                <ListTodo className="w-4 h-4" />
                <span className="hidden sm:inline">Bookings</span>
                {pendingData?.count > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                    {pendingData.count}
                  </Badge>
                )}
              </Button>
              <Button
                variant={mainTab === 'weekly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMainTab('weekly')}
                className={cn(
                  "gap-2 transition-all",
                  mainTab === 'weekly' && "shadow-sm"
                )}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>
              <Button
                variant={mainTab === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMainTab('calendar')}
                className={cn(
                  "gap-2 transition-all",
                  mainTab === 'calendar' && "shadow-sm"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Availability</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4 mb-6">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingData?.count || 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'accepted').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'in_progress').length}
                  </p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 bg-muted rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {bookings.filter(b => b.status === 'completed').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule View - Comprehensive Calendar */}
          {mainTab === 'weekly' && (
            <VendorWeeklyCalendar />
          )}

          {/* Calendar View - Monthly Availability Management */}
          {mainTab === 'calendar' && (
            <VendorAvailabilityCalendar />
          )}

          {/* Bookings View */}
          {mainTab === 'bookings' && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingData?.count > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {pendingData.count}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="accepted">Accepted</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-medium">No bookings found</p>
                  <p className="text-sm">
                    {activeTab === 'pending' 
                      ? "You don't have any pending booking requests"
                      : `No ${activeTab} bookings`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    role="vendor"
                    otherPartyName={(booking as any).customer ? `${(booking as any).customer.firstName || ''} ${(booking as any).customer.lastName || ''}`.trim() || 'Customer' : 'Customer'}
                    otherPartyImage={(booking as any).customer?.profileImageUrl}
                    serviceName={(booking as any).service?.title}
                    onAccept={() => acceptMutation.mutate(booking.id)}
                    onReject={() => {
                      setSelectedBooking(booking);
                      setActionType('reject');
                    }}
                    onProposeAlternative={() => {
                      setSelectedBooking(booking);
                      setActionType('alternative');
                    }}
                    onChat={() => {
                      // Navigate to chat with customer - vendor is the current user
                      const customerId = (booking as any).customerId || (booking as any).customer?.id;
                      const serviceId = (booking as any).serviceId || (booking as any).service?.id;
                      if (customerId) {
                        // For vendor chatting with customer, we pass vendor=currentUserId to trigger getOrCreate
                        // but the API expects vendorId, so we need to use a different approach
                        // The chat page creates conversation with: POST /api/chat/conversations { vendorId, bookingId, serviceId }
                        // But we are the vendor, so we need to pass customerId differently
                        // Let's use a query param that chat page can handle
                        setLocation(`/chat?customer=${customerId}&booking=${booking.id}&service=${serviceId}`);
                      } else {
                        setLocation(`/chat?booking=${booking.id}`);
                      }
                    }}
                    isLoading={
                      acceptMutation.isPending || 
                      rejectMutation.isPending || 
                      alternativeMutation.isPending
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
          )}

        {/* Reject Dialog */}
        <Dialog open={actionType === 'reject'} onOpenChange={() => setActionType(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for rejection</Label>
                <Textarea
                  id="reason"
                  placeholder="Let the customer know why you can't accept this booking..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedBooking && rejectMutation.mutate({
                  bookingId: selectedBooking.id,
                  reason: rejectReason,
                })}
                disabled={rejectMutation.isPending}
              >
                Reject Booking
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alternative Time Dialog */}
        <Dialog open={actionType === 'alternative'} onOpenChange={() => setActionType(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Propose Alternative Time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Calendar
                  mode="single"
                  selected={alternativeDate}
                  onSelect={setAlternativeDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={alternativeTime.start}
                    onChange={(e) => setAlternativeTime({ ...alternativeTime, start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={alternativeTime.end}
                    onChange={(e) => setAlternativeTime({ ...alternativeTime, end: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-message">Message to Customer</Label>
                <Textarea
                  id="alt-message"
                  placeholder="Explain why you're proposing a different time..."
                  value={alternativeMessage}
                  onChange={(e) => setAlternativeMessage(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleProposeAlternative}
                disabled={!alternativeDate || alternativeMutation.isPending}
              >
                Send Proposal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}

