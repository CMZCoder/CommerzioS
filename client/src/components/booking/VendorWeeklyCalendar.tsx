/**
 * VendorWeeklyCalendar Component
 * 
 * Comprehensive weekly view calendar for vendors showing:
 * - All bookings across all services in a weekly grid
 * - Hourly time slots (Excel-like view)
 * - Color-coded by service
 * - Block time functionality
 * - History view for past bookings
 * - Quick actions for booking management
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
import { toast } from 'sonner';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  subWeeks, 
  addDays,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  differenceInMinutes,
  isToday,
  isPast,
  isFuture,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Ban,
  Plus,
  Trash2,
  Settings,
  Loader2,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useLocation } from 'wouter';

// Types
interface CalendarBlock {
  id: string;
  startTime: string;
  endTime: string;
  blockType: string;
  title: string | null;
  notes: string | null;
  serviceId: string | null;
  isActive: boolean;
}

interface Service {
  id: string;
  title: string;
  images: string[];
}

interface Customer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface Booking {
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
  service: Service | null;
  customer: Customer | null;
}

interface VendorWeeklyCalendarProps {
  className?: string;
}

// Constants
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
const WORKING_HOURS_START = 6; // 6 AM
const WORKING_HOURS_END = 22; // 10 PM
const HOUR_HEIGHT = 60; // pixels per hour
const TIME_COLUMN_WIDTH = 60; // pixels for time column
const DAY_MIN_WIDTH = 150; // minimum width per day column

// Service colors for visual distinction
const SERVICE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200' },
  { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-800 dark:text-green-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-800 dark:text-purple-200' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-800 dark:text-orange-200' },
  { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-500', text: 'text-pink-800 dark:text-pink-200' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', border: 'border-cyan-500', text: 'text-cyan-800 dark:text-cyan-200' },
  { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-500', text: 'text-indigo-800 dark:text-indigo-200' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 border-amber-400 text-amber-800',
  accepted: 'bg-blue-100 border-blue-400 text-blue-800',
  confirmed: 'bg-green-100 border-green-400 text-green-800',
  in_progress: 'bg-indigo-100 border-indigo-400 text-indigo-800',
  completed: 'bg-slate-100 border-slate-400 text-slate-800',
  cancelled: 'bg-red-100 border-red-400 text-red-800',
  rejected: 'bg-red-100 border-red-400 text-red-800',
  no_show: 'bg-gray-100 border-gray-400 text-gray-800',
};

export function VendorWeeklyCalendar({ className }: VendorWeeklyCalendarProps) {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // State
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday start
  );
  const [viewMode, setViewMode] = useState<'week' | 'history'>('week');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockFormData, setBlockFormData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '17:00',
    blockType: 'manual',
    title: '',
    notes: '',
    serviceId: '',
  });
  const [historyMonth, setHistoryMonth] = useState(() => new Date());

  // Calculate week dates
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 1 }), [currentWeekStart]);

  // Fetch vendor's services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['vendor-services'],
    queryFn: async () => {
      const res = await fetchApi('/api/services?owner=me');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Create service color map
  const serviceColorMap = useMemo(() => {
    const map = new Map<string, typeof SERVICE_COLORS[0]>();
    services.forEach((service, index) => {
      map.set(service.id, SERVICE_COLORS[index % SERVICE_COLORS.length]);
    });
    return map;
  }, [services]);

  // Fetch bookings for current week
  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<Booking[]>({
    queryKey: ['vendor-calendar-bookings', currentWeekStart.toISOString(), selectedService],
    queryFn: async () => {
      const start = startOfDay(currentWeekStart);
      const end = endOfDay(weekEnd);
      const url = `/api/vendor/bookings?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=200`;
      const res = await fetchApi(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Fetch calendar blocks
  const { data: blocks = [], isLoading: blocksLoading } = useQuery<CalendarBlock[]>({
    queryKey: ['vendor-calendar-blocks', currentWeekStart.toISOString()],
    queryFn: async () => {
      const start = startOfDay(currentWeekStart);
      const end = endOfDay(weekEnd);
      const res = await fetchApi(
        `/api/vendor/calendar/blocks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch history bookings (for history view)
  const { data: historyBookings = [], isLoading: historyLoading } = useQuery<Booking[]>({
    queryKey: ['vendor-booking-history', historyMonth.toISOString()],
    queryFn: async () => {
      const start = startOfMonth(historyMonth);
      const end = endOfMonth(historyMonth);
      const res = await fetchApi(
        `/api/vendor/bookings?startDate=${start.toISOString()}&endDate=${end.toISOString()}&limit=200`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: viewMode === 'history',
  });

  // Create block mutation
  const createBlockMutation = useMutation({
    mutationFn: async (data: typeof blockFormData) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
      
      const res = await fetchApi('/api/vendor/calendar/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          blockType: data.blockType,
          title: data.title || null,
          notes: data.notes || null,
          serviceId: data.serviceId || null,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create block');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-calendar-blocks'] });
      toast.success('Time blocked successfully');
      setIsBlockDialogOpen(false);
      resetBlockForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete block mutation
  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const res = await fetchApi(`/api/vendor/calendar/blocks/${blockId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete block');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-calendar-blocks'] });
      toast.success('Block removed');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Reset block form
  const resetBlockForm = () => {
    setBlockFormData({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      startTime: '09:00',
      endDate: format(new Date(), 'yyyy-MM-dd'),
      endTime: '17:00',
      blockType: 'manual',
      title: '',
      notes: '',
      serviceId: '',
    });
  };

  // Navigate weeks
  const goToPreviousWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Filter bookings by service
  const filteredBookings = useMemo(() => {
    if (selectedService === 'all') return bookings;
    return bookings.filter(b => b.service?.id === selectedService);
  }, [bookings, selectedService]);

  // Get bookings for a specific day
  const getBookingsForDay = useCallback((date: Date) => {
    return filteredBookings.filter(booking => {
      const startTime = parseISO(booking.confirmedStartTime || booking.requestedStartTime);
      return isSameDay(startTime, date);
    });
  }, [filteredBookings]);

  // Get blocks for a specific day
  const getBlocksForDay = useCallback((date: Date) => {
    return blocks.filter(block => {
      const startTime = parseISO(block.startTime);
      const endTime = parseISO(block.endTime);
      return isSameDay(startTime, date) || 
             isSameDay(endTime, date) ||
             isWithinInterval(date, { start: startTime, end: endTime });
    });
  }, [blocks]);

  // Calculate position and height for an event
  const getEventStyle = useCallback((startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const duration = differenceInMinutes(endTime, startTime) / 60;
    const top = (startHour - WORKING_HOURS_START) * HOUR_HEIGHT;
    const height = Math.max(duration * HOUR_HEIGHT, 30); // minimum 30px height
    return { top, height };
  }, []);

  // Handle quick block from calendar click
  const handleQuickBlock = (date: Date, hour: number) => {
    setBlockFormData({
      startDate: format(date, 'yyyy-MM-dd'),
      startTime: `${hour.toString().padStart(2, '0')}:00`,
      endDate: format(date, 'yyyy-MM-dd'),
      endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      blockType: 'manual',
      title: '',
      notes: '',
      serviceId: '',
    });
    setIsBlockDialogOpen(true);
  };

  // Render time column
  const renderTimeColumn = () => (
    <div className="sticky left-0 z-20 bg-background border-r" style={{ width: TIME_COLUMN_WIDTH }}>
      <div className="h-12 border-b bg-muted/50" /> {/* Header spacer */}
      {HOURS.slice(WORKING_HOURS_START, WORKING_HOURS_END).map(hour => (
        <div
          key={hour}
          className="border-b text-xs text-muted-foreground flex items-start justify-end pr-2 pt-1"
          style={{ height: HOUR_HEIGHT }}
        >
          {format(setHours(new Date(), hour), 'HH:00')}
        </div>
      ))}
    </div>
  );

  // Render day column
  const renderDayColumn = (date: Date, dayIndex: number) => {
    const dayBookings = getBookingsForDay(date);
    const dayBlocks = getBlocksForDay(date);
    const isCurrentDay = isToday(date);
    const isPastDay = isPast(endOfDay(date));

    return (
      <div
        key={dayIndex}
        className={cn(
          "relative border-r flex-1",
          isCurrentDay && "bg-blue-50/50 dark:bg-blue-900/10"
        )}
        style={{ minWidth: DAY_MIN_WIDTH }}
      >
        {/* Day header */}
        <div 
          className={cn(
            "sticky top-0 z-10 h-12 border-b p-2 text-center bg-background",
            isCurrentDay && "bg-blue-100 dark:bg-blue-900/30"
          )}
        >
          <div className="text-xs text-muted-foreground">
            {format(date, 'EEE')}
          </div>
          <div className={cn(
            "text-sm font-semibold",
            isCurrentDay && "text-blue-600 dark:text-blue-400"
          )}>
            {format(date, 'd MMM')}
          </div>
        </div>

        {/* Hour slots */}
        <div className="relative" style={{ height: (WORKING_HOURS_END - WORKING_HOURS_START) * HOUR_HEIGHT }}>
          {HOURS.slice(WORKING_HOURS_START, WORKING_HOURS_END).map(hour => (
            <div
              key={hour}
              className={cn(
                "border-b hover:bg-muted/30 cursor-pointer transition-colors",
                isPastDay && "bg-slate-50/50 dark:bg-slate-900/20"
              )}
              style={{ height: HOUR_HEIGHT }}
              onClick={() => !isPastDay && handleQuickBlock(date, hour)}
            />
          ))}

          {/* Render blocks */}
          {dayBlocks.map(block => {
            const startTime = parseISO(block.startTime);
            const endTime = parseISO(block.endTime);
            
            // Adjust times for this day if block spans multiple days
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);
            const effectiveStart = startTime < dayStart ? setHours(setMinutes(dayStart, 0), WORKING_HOURS_START) : startTime;
            const effectiveEnd = endTime > dayEnd ? setHours(setMinutes(dayEnd, 0), WORKING_HOURS_END) : endTime;
            
            const style = getEventStyle(effectiveStart, effectiveEnd);
            
            return (
              <Popover key={block.id}>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-1 right-1 rounded-md border-2 border-dashed cursor-pointer",
                      "bg-red-100/80 border-red-300 dark:bg-red-900/40 dark:border-red-700",
                      "hover:bg-red-200/80 dark:hover:bg-red-900/60 transition-colors",
                      "overflow-hidden"
                    )}
                    style={{
                      top: Math.max(style.top, 0),
                      height: style.height,
                    }}
                  >
                    <div className="p-1 text-xs">
                      <div className="font-medium text-red-800 dark:text-red-200 truncate flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        {block.title || block.blockType}
                      </div>
                      <div className="text-red-600 dark:text-red-300 text-[10px]">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                      </div>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{block.title || 'Blocked Time'}</h4>
                      <Badge variant="secondary" className="text-xs">{block.blockType}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {format(startTime, 'MMM d, HH:mm')} - {format(endTime, 'MMM d, HH:mm')}
                    </div>
                    {block.notes && (
                      <p className="text-xs text-muted-foreground">{block.notes}</p>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => deleteBlockMutation.mutate(block.id)}
                      disabled={deleteBlockMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove Block
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}

          {/* Render bookings */}
          {dayBookings.map(booking => {
            const startTime = parseISO(booking.confirmedStartTime || booking.requestedStartTime);
            const endTime = parseISO(booking.confirmedEndTime || booking.requestedEndTime);
            const style = getEventStyle(startTime, endTime);
            const serviceColor = booking.service?.id 
              ? serviceColorMap.get(booking.service.id) || SERVICE_COLORS[0]
              : SERVICE_COLORS[0];

            return (
              <Popover key={booking.id}>
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-1 right-1 rounded-md border-l-4 cursor-pointer",
                      "hover:shadow-md transition-shadow overflow-hidden",
                      serviceColor.bg,
                      serviceColor.border
                    )}
                    style={{
                      top: Math.max(style.top, 0),
                      height: style.height,
                    }}
                  >
                    <div className="p-1 h-full">
                      <div className={cn("font-medium text-xs truncate", serviceColor.text)}>
                        {booking.service?.title || 'Service'}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {booking.customer?.firstName} {booking.customer?.lastName}
                      </div>
                      {style.height > 50 && (
                        <div className="text-[10px] text-muted-foreground">
                          {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </div>
                      )}
                      <Badge 
                        variant="secondary" 
                        className={cn("mt-1 text-[10px] px-1 py-0", STATUS_COLORS[booking.status])}
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <BookingPopoverContent 
                    booking={booking} 
                    onViewDetails={() => {
                      setSelectedBooking(booking);
                    }}
                    onChat={() => setLocation(`/chat?booking=${booking.id}`)}
                  />
                </PopoverContent>
              </Popover>
            );
          })}

          {/* Current time indicator */}
          {isCurrentDay && (
            <CurrentTimeIndicator />
          )}
        </div>
      </div>
    );
  };

  const isLoading = bookingsLoading || blocksLoading;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'week' | 'history')}>
            <TabsList>
              <TabsTrigger value="week" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                Week View
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-2">
          {/* Service filter */}
          {services.length > 1 && (
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" size="icon" onClick={() => refetchBookings()}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          <Button onClick={() => setIsBlockDialogOpen(true)} className="gap-2">
            <Ban className="w-4 h-4" />
            Block Time
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'week' ? (
        <>
          {/* Week Navigation */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextWeek}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">
                  {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {filteredBookings.length} booking(s) this week
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Calendar Grid */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8">
                  <Skeleton className="h-[600px] w-full" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-300px)] min-h-[500px]">
                  <div className="flex">
                    {renderTimeColumn()}
                    {weekDates.map((date, index) => renderDayColumn(date, index))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Service Legend */}
          {services.length > 1 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-muted-foreground">Services:</span>
                  {services.map((service, index) => {
                    const color = SERVICE_COLORS[index % SERVICE_COLORS.length];
                    return (
                      <div key={service.id} className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded", color.bg, `border-l-4 ${color.border}`)} />
                        <span className="text-sm">{service.title}</span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-2 ml-4 border-l pl-4">
                    <div className="w-3 h-3 rounded bg-red-100 border-2 border-dashed border-red-300" />
                    <span className="text-sm">Blocked</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* History View */
        <HistoryView 
          month={historyMonth}
          onMonthChange={setHistoryMonth}
          bookings={historyBookings}
          isLoading={historyLoading}
          services={services}
          serviceColorMap={serviceColorMap}
        />
      )}

      {/* Block Time Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Time</DialogTitle>
            <DialogDescription>
              Mark a time period as unavailable for bookings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={blockFormData.startDate}
                  onChange={(e) => setBlockFormData(prev => ({
                    ...prev,
                    startDate: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={blockFormData.startTime}
                  onChange={(e) => setBlockFormData(prev => ({
                    ...prev,
                    startTime: e.target.value
                  }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={blockFormData.endDate}
                  onChange={(e) => setBlockFormData(prev => ({
                    ...prev,
                    endDate: e.target.value
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={blockFormData.endTime}
                  onChange={(e) => setBlockFormData(prev => ({
                    ...prev,
                    endTime: e.target.value
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Block Type</Label>
              <Select
                value={blockFormData.blockType}
                onValueChange={(value) => setBlockFormData(prev => ({
                  ...prev,
                  blockType: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Unavailable</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {services.length > 1 && (
              <div className="space-y-2">
                <Label>Apply to Service (optional)</Label>
                <Select
                  value={blockFormData.serviceId || '__all__'}
                  onValueChange={(value) => setBlockFormData(prev => ({
                    ...prev,
                    serviceId: value === '__all__' ? '' : value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All services</SelectItem>
                    {services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                placeholder="e.g., Vacation, Equipment maintenance"
                value={blockFormData.title}
                onChange={(e) => setBlockFormData(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Add any notes..."
                rows={2}
                value={blockFormData.notes}
                onChange={(e) => setBlockFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlockDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createBlockMutation.mutate(blockFormData)}
              disabled={createBlockMutation.isPending}
            >
              {createBlockMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 mr-2" />
              )}
              Block Time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          {selectedBooking && (
            <BookingDetailContent 
              booking={selectedBooking}
              onClose={() => setSelectedBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Current time indicator component
function CurrentTimeIndicator() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  
  if (currentHour < WORKING_HOURS_START || currentHour > WORKING_HOURS_END) {
    return null;
  }

  const top = (currentHour - WORKING_HOURS_START) * HOUR_HEIGHT;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}

// Booking popover content
function BookingPopoverContent({ 
  booking, 
  onViewDetails, 
  onChat 
}: { 
  booking: Booking; 
  onViewDetails: () => void;
  onChat: () => void;
}) {
  const startTime = parseISO(booking.confirmedStartTime || booking.requestedStartTime);
  const endTime = parseISO(booking.confirmedEndTime || booking.requestedEndTime);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{booking.service?.title || 'Service'}</h4>
          <p className="text-sm text-muted-foreground">#{booking.bookingNumber}</p>
        </div>
        <Badge className={STATUS_COLORS[booking.status]}>
          {booking.status}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            {format(startTime, 'MMM d, HH:mm')} - {format(endTime, 'HH:mm')}
          </span>
        </div>
        {booking.customer && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{booking.customer.firstName} {booking.customer.lastName}</span>
          </div>
        )}
        {booking.customerPhone && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{booking.customerPhone}</span>
          </div>
        )}
        {booking.customerAddress && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{booking.customerAddress}</span>
          </div>
        )}
        {booking.totalPrice && (
          <div className="font-medium text-primary">
            {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="outline" className="flex-1" onClick={onViewDetails}>
          <Eye className="w-3 h-3 mr-1" />
          Details
        </Button>
        <Button size="sm" variant="outline" className="flex-1" onClick={onChat}>
          <MessageSquare className="w-3 h-3 mr-1" />
          Chat
        </Button>
      </div>
    </div>
  );
}

// Booking detail content for modal
function BookingDetailContent({ 
  booking, 
  onClose 
}: { 
  booking: Booking;
  onClose: () => void;
}) {
  const startTime = parseISO(booking.confirmedStartTime || booking.requestedStartTime);
  const endTime = parseISO(booking.confirmedEndTime || booking.requestedEndTime);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {booking.service?.title || 'Booking'}
          <Badge className={STATUS_COLORS[booking.status]}>
            {booking.status}
          </Badge>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          {booking.service?.images?.[0] ? (
            <img 
              src={booking.service.images[0]} 
              alt="" 
              className="w-16 h-16 rounded object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-muted-foreground/20 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium">#{booking.bookingNumber}</p>
            <p className="text-sm text-muted-foreground">
              {format(startTime, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </p>
          </div>
        </div>

        {booking.customer && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Customer</Label>
            <div className="flex items-center gap-3">
              {booking.customer.profileImageUrl ? (
                <img 
                  src={booking.customer.profileImageUrl} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {booking.customer.firstName} {booking.customer.lastName}
                </p>
                {booking.customerPhone && (
                  <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {booking.customerAddress && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Location</Label>
            <p className="text-sm">{booking.customerAddress}</p>
          </div>
        )}

        {booking.customerMessage && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Customer Message</Label>
            <p className="text-sm p-3 bg-muted rounded-lg">{booking.customerMessage}</p>
          </div>
        )}

        {booking.totalPrice && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="font-medium">Total Amount</span>
            <span className="text-lg font-bold text-primary">
              {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
}

// History View Component
function HistoryView({
  month,
  onMonthChange,
  bookings,
  isLoading,
  services,
  serviceColorMap,
}: {
  month: Date;
  onMonthChange: (date: Date) => void;
  bookings: Booking[];
  isLoading: boolean;
  services: Service[];
  serviceColorMap: Map<string, typeof SERVICE_COLORS[0]>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Group bookings by date
  const groupedBookings = useMemo(() => {
    const filtered = selectedStatus === 'all' 
      ? bookings 
      : bookings.filter(b => b.status === selectedStatus);
    
    const groups = new Map<string, Booking[]>();
    filtered.forEach(booking => {
      const date = format(parseISO(booking.confirmedStartTime || booking.requestedStartTime), 'yyyy-MM-dd');
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(booking);
    });
    
    // Sort by date descending
    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]));
  }, [bookings, selectedStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => ['cancelled', 'rejected', 'no_show'].includes(b.status)).length;
    const totalRevenue = bookings
      .filter(b => b.status === 'completed' && b.totalPrice)
      .reduce((sum, b) => sum + parseFloat(b.totalPrice || '0'), 0);
    
    return { completed, cancelled, total: bookings.length, totalRevenue };
  }, [bookings]);

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => onMonthChange(subWeeks(month, 4))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold min-w-[150px] text-center">
                {format(month, 'MMMM yyyy')}
              </h3>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => onMonthChange(addWeeks(month, 4))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Bookings</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cancelled/No-show</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Revenue</div>
            <div className="text-2xl font-bold text-primary">
              CHF {stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-48 w-full" />
            </div>
          ) : groupedBookings.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No bookings found for this period</p>
            </div>
          ) : (
            <div className="divide-y">
              {groupedBookings.map(([date, dayBookings]) => (
                <div key={date} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </span>
                    <Badge variant="secondary">{dayBookings.length}</Badge>
                  </div>
                  <div className="space-y-2 ml-6">
                    {dayBookings.map(booking => {
                      const startTime = parseISO(booking.confirmedStartTime || booking.requestedStartTime);
                      const endTime = parseISO(booking.confirmedEndTime || booking.requestedEndTime);
                      const serviceColor = booking.service?.id 
                        ? serviceColorMap.get(booking.service.id) 
                        : undefined;

                      return (
                        <div 
                          key={booking.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            serviceColor?.bg
                          )}
                        >
                          <div className={cn(
                            "w-1 h-12 rounded",
                            serviceColor?.border || 'bg-muted'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {booking.service?.title || 'Service'}
                              </span>
                              <Badge className={cn("text-xs", STATUS_COLORS[booking.status])}>
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                              {booking.customer && (
                                <span className="mx-2">•</span>
                              )}
                              {booking.customer && (
                                <span>
                                  {booking.customer.firstName} {booking.customer.lastName}
                                </span>
                              )}
                            </div>
                          </div>
                          {booking.totalPrice && (
                            <div className="text-right">
                              <span className="font-semibold">
                                CHF {parseFloat(booking.totalPrice).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorWeeklyCalendar;
