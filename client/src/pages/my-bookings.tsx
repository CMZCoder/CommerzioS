/**
 * Unified Bookings Page - Comprehensive Booking Management
 * 
 * Features:
 * - Dashboard with quick stats and actionable items
 * - Interactive calendar with weekly and monthly views
 * - As Customer / As Vendor / Completed tabs
 * - Service Requests integration
 * - Clickable booking details with service/vendor links
 */

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, formatDistanceToNow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths, subMonths, isSameDay, isToday, isPast, isFuture, isSameMonth, eachDayOfInterval, getDay } from "date-fns";
import { cn } from "@/lib/utils";
import { fetchApi } from "@/lib/config";
import { 
  Calendar as CalendarIcon,
  Clock, 
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Star,
  Loader2,
  Package,
  User,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  MessageSquare,
  ExternalLink,
  Megaphone,
  LayoutDashboard,
  ArrowLeft,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Filter,
  X,
  Send,
  FileText,
  Inbox,
  Edit,
  Bookmark,
  BookmarkCheck,
  Check,
  Expand,
  Minimize2,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  requestedStartTime: string;
  requestedEndTime: string;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  customerMessage: string | null;
  vendorMessage: string | null;
  totalPrice: string | null;
  currency: string;
  createdAt: string;
  completedAt?: string | null;
  customerId?: string;
  vendorId?: string;
  serviceId?: string;
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
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  bookingType?: "customer" | "vendor";
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  budget: string | null;
  currency: string;
  location: string | null;
  status: string;
  createdAt: string;
  responseCount?: number;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { 
    label: "Pending", 
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: <Clock className="w-4 h-4" />
  },
  accepted: { 
    label: "Accepted", 
    color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  alternative_proposed: { 
    label: "Alternative", 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    icon: <RefreshCw className="w-4 h-4" />
  },
  confirmed: { 
    label: "Confirmed", 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: <Loader2 className="w-4 h-4 animate-spin" />
  },
  completed: { 
    label: "Completed", 
    color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />
  },
  rejected: { 
    label: "Rejected", 
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    icon: <XCircle className="w-4 h-4" />
  },
};

// Calendar view types
type CalendarViewMode = "week" | "month";
type CalendarFilterMode = "all" | "customer" | "vendor" | "completed";

// Quick filter for dashboard clicks
type DashboardQuickFilter = "pending" | "active" | "completed-month" | null;

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(true); // Default open
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  // New: Calendar view mode (week or month)
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>("week");
  // New: Calendar filter (syncs with tab selection)
  const [calendarFilter, setCalendarFilter] = useState<CalendarFilterMode>("all");
  // New: Dashboard quick filter for booking list
  const [dashboardQuickFilter, setDashboardQuickFilter] = useState<DashboardQuickFilter>(null);

  // Scroll to content when tab changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  // Sync calendar filter with tab changes
  useEffect(() => {
    if (activeTab === "as-customer") {
      setCalendarFilter("customer");
    } else if (activeTab === "as-vendor") {
      setCalendarFilter("vendor");
    } else if (activeTab === "completed") {
      setCalendarFilter("completed");
    } else {
      setCalendarFilter("all");
    }
    // Reset dashboard quick filter when changing tabs
    setDashboardQuickFilter(null);
  }, [activeTab]);

  // Check if user is a vendor (has services)
  const { data: userServices = [] } = useQuery<Array<{ id: string; title: string }>>({
    queryKey: ["my-services-list"],
    queryFn: async () => {
      const res = await fetchApi("/api/services?owner=me");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  const isVendor = userServices.length > 0;

  // Fetch customer bookings (services I have booked) - active only
  const { data: customerActiveBookings = [], isLoading: customerActiveLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-customer-active"],
    queryFn: async () => {
      const res = await fetchApi("/api/bookings/my");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["pending", "accepted", "confirmed", "in_progress", "alternative_proposed"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "customer" as const }));
    },
    enabled: !!user,
  });

  // Fetch customer bookings - completed only
  const { data: customerCompletedBookings = [], isLoading: customerCompletedLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-customer-completed"],
    queryFn: async () => {
      const res = await fetchApi("/api/bookings/my");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["completed", "cancelled", "rejected"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "customer" as const }));
    },
    enabled: !!user,
  });

  // Fetch vendor bookings (customers who booked my services) - active only
  const { data: vendorActiveBookings = [], isLoading: vendorActiveLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-vendor-active"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings?limit=500");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["pending", "accepted", "confirmed", "in_progress", "alternative_proposed"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "vendor" as const }));
    },
    enabled: !!user && isVendor,
  });

  // Fetch vendor bookings - completed only
  const { data: vendorCompletedBookings = [], isLoading: vendorCompletedLoading } = useQuery<Booking[]>({
    queryKey: ["my-bookings-vendor-completed"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings?limit=500");
      if (!res.ok) return [];
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((b: Booking) => ["completed", "cancelled", "rejected"].includes(b.status))
        .map((b: Booking) => ({ ...b, bookingType: "vendor" as const }));
    },
    enabled: !!user && isVendor,
  });

  // Fetch service requests - API returns { requests: [], total: number }
  const { data: serviceRequestsData, isLoading: requestsLoading, refetch: refetchMyRequests } = useQuery<{ requests: ServiceRequest[]; total: number }>({
    queryKey: ["service-requests"],
    queryFn: async () => {
      const res = await fetchApi("/api/service-requests");
      if (!res.ok) return { requests: [], total: 0 };
      return res.json();
    },
    enabled: !!user,
  });
  const serviceRequests = serviceRequestsData?.requests || [];

  // Fetch proposals sent by vendor
  const { data: myProposals = [], isLoading: loadingMyProposals } = useQuery<any[]>({
    queryKey: ["my-proposals"],
    queryFn: async () => {
      const res = await fetchApi("/api/proposals/sent");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user && isVendor,
  });

  // Fetch proposals received on my requests
  const { data: receivedProposals = [], isLoading: loadingReceivedProposals, refetch: refetchReceivedProposals } = useQuery<any[]>({
    queryKey: ["received-proposals"],
    queryFn: async () => {
      const res = await fetchApi("/api/proposals/received");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Fetch browse requests (open requests from other users) - for vendors
  const { data: browseRequestsData, isLoading: loadingBrowse, refetch: refetchBrowse } = useQuery<{ requests: any[]; total: number }>({
    queryKey: ["service-requests", "browse"],
    queryFn: async () => {
      const res = await fetchApi("/api/service-requests/browse");
      if (!res.ok) return { requests: [], total: 0 };
      return res.json();
    },
    enabled: !!user && isVendor,
  });
  const browseRequests = browseRequestsData?.requests || [];

  // Fetch saved service requests - available for all users
  const { data: savedRequests = [], refetch: refetchSaved } = useQuery<any[]>({
    queryKey: ["service-requests", "saved"],
    queryFn: async () => {
      const res = await fetchApi("/api/service-requests/saved");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!user,
  });

  // Save request mutation
  const saveRequestMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest(`/api/service-requests/${requestId}/save`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Request saved!", description: "You can find it in your Saved requests." });
      queryClient.invalidateQueries({ queryKey: ["service-requests", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests", "browse"] });
      refetchSaved();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save request", variant: "destructive" });
    },
  });

  // Unsave request mutation
  const unsaveRequestMutation = useMutation({
    mutationFn: (requestId: string) =>
      apiRequest(`/api/service-requests/${requestId}/save`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Request removed", description: "Removed from your saved requests." });
      queryClient.invalidateQueries({ queryKey: ["service-requests", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests", "browse"] });
      refetchSaved();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to unsave request", variant: "destructive" });
    },
  });

  // Check if a request is saved
  const isRequestSaved = (requestId: string) => {
    return savedRequests.some((r: any) => r.id === requestId);
  };

  // Service requests subtab state
  const [serviceRequestsSubTab, setServiceRequestsSubTab] = useState<string>("my-requests");
  // Filter for proposals received by request
  const [proposalsRequestFilter, setProposalsRequestFilter] = useState<string>("all");
  
  // Edit service request modal state
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [editRequestData, setEditRequestData] = useState({
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    locationCity: "",
    locationCanton: "",
  });

  // Edit request mutation
  const editRequestMutation = useMutation({
    mutationFn: (data: { requestId: string; title: string; description: string; budgetMin: string; budgetMax: string; locationCity: string; locationCanton: string }) =>
      apiRequest(`/api/service-requests/${data.requestId}`, {
        method: "PUT",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          budgetMin: data.budgetMin || null,
          budgetMax: data.budgetMax || null,
          locationCity: data.locationCity || null,
          locationCanton: data.locationCanton || null,
        }),
      }),
    onSuccess: () => {
      toast({ title: "Request updated", description: "Your service request has been updated." });
      refetchMyRequests();
      setEditingRequest(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update request", variant: "destructive" });
    },
  });

  // Handle opening edit modal
  const handleEditRequest = (request: ServiceRequest) => {
    setEditRequestData({
      title: request.title,
      description: request.description,
      budgetMin: (request as any).budgetMin?.toString() || "",
      budgetMax: (request as any).budgetMax?.toString() || "",
      locationCity: request.location?.split(",")[0]?.trim() || "",
      locationCanton: (request as any).locationCanton || "",
    });
    setEditingRequest(request);
  };

  // Fetch vendor stats for dashboard
  const { data: vendorStats } = useQuery({
    queryKey: ["vendor-stats"],
    queryFn: async () => {
      const res = await fetchApi("/api/vendor/bookings/pending-count");
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!user && isVendor,
  });

  // Sort bookings by date
  const sortByDate = (bookings: Booking[]) => {
    return [...bookings].sort((a, b) => {
      const dateA = new Date(a.confirmedStartTime || a.requestedStartTime).getTime();
      const dateB = new Date(b.confirmedStartTime || b.requestedStartTime).getTime();
      return dateB - dateA;
    });
  };

  // Handle chat navigation
  const handleChat = (booking: Booking) => {
    if (booking.bookingType === "customer") {
      const vendorId = booking.vendorId || booking.vendor?.id;
      if (vendorId) {
        setLocation(`/chat?vendor=${vendorId}&booking=${booking.id}&service=${booking.serviceId || booking.service?.id}`);
      }
    } else {
      const customerId = booking.customerId || booking.customer?.id;
      if (customerId) {
        setLocation(`/chat?customer=${customerId}&booking=${booking.id}&service=${booking.serviceId || booking.service?.id}`);
      }
    }
    setSelectedBooking(null);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4 text-center">
          <Card>
            <CardContent className="py-16">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your bookings</h2>
              <p className="text-muted-foreground mb-4">Track and manage all your service bookings in one place</p>
              <Button onClick={() => setLocation("/login")}>Sign In</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Booking card component
  const BookingListItem = ({ booking }: { booking: Booking }) => {
    const isCustomerBooking = booking.bookingType === "customer";
    const statusInfo = statusConfig[booking.status] || statusConfig.pending;
    const dateTime = new Date(booking.confirmedStartTime || booking.requestedStartTime);

    return (
      <Card 
        className={cn(
          "hover:shadow-md transition-shadow cursor-pointer",
          isCustomerBooking 
            ? "border-l-4 border-l-blue-500" 
            : "border-l-4 border-l-green-500"
        )}
        onClick={() => setSelectedBooking(booking)}
      >
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {booking.service?.images?.[0] ? (
              <div className="w-full sm:w-20 h-20 flex-shrink-0">
                <img
                  src={booking.service.images[0]}
                  alt={booking.service.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-full sm:w-20 h-20 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <Link 
                    href={booking.service?.id ? `/services/${booking.service.id}` : "#"} 
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    <h3 className="font-semibold truncate text-primary hover:text-primary/80">{booking.service?.title || "Service"}</h3>
                  </Link>
                  <span className="text-xs text-muted-foreground">#{booking.bookingNumber}</span>
                </div>
                <Badge className={cn("flex-shrink-0", statusInfo.color)}>
                  {statusInfo.icon}
                  <span className="ml-1">{statusInfo.label}</span>
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {isCustomerBooking ? (
                  <Link 
                    href={booking.vendor?.id ? `/users/${booking.vendor.id}` : "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={booking.vendor?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {booking.vendor?.firstName?.[0]}{booking.vendor?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hover:underline">with {booking.vendor?.firstName} {booking.vendor?.lastName}</span>
                  </Link>
                ) : (
                  <Link 
                    href={booking.customer?.id ? `/users/${booking.customer.id}` : "#"}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={booking.customer?.profileImageUrl} />
                      <AvatarFallback className="text-xs">
                        {booking.customer?.firstName?.[0]}{booking.customer?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hover:underline">from {booking.customer?.firstName} {booking.customer?.lastName}</span>
                  </Link>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarIcon className="w-4 h-4" />
                  {format(dateTime, "MMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {format(dateTime, "HH:mm")}
                </div>
                {booking.totalPrice && (
                  <div className="flex items-center gap-1 font-medium">
                    {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                  </div>
                )}
                {booking.service?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/services/${booking.service!.id}`);
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    See Listing
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ message, action }: { message: string; action?: React.ReactNode }) => (
    <Card>
      <CardContent className="py-12 text-center">
        <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
        <p className="text-muted-foreground">{message}</p>
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950">
        <div className="container mx-auto py-8 px-4 max-w-6xl" ref={contentRef}>
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <CalendarIcon className="w-8 h-8 text-primary" />
                My Bookings
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage all your bookings in one place
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-card rounded-lg shadow-sm">
              {isVendor && (
                <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
              )}
              
              <TabsTrigger value="as-customer" className="gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
                <ArrowUpRight className="w-4 h-4" />
                As Customer
                {customerActiveBookings.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{customerActiveBookings.length}</Badge>
                )}
              </TabsTrigger>
              
              {isVendor && (
                <TabsTrigger value="as-vendor" className="gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
                  <ArrowDownLeft className="w-4 h-4" />
                  As Vendor
                  {vendorActiveBookings.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{vendorActiveBookings.length}</Badge>
                  )}
                </TabsTrigger>
              )}
              
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Completed
                {(customerCompletedBookings.length + vendorCompletedBookings.length) > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {customerCompletedBookings.length + vendorCompletedBookings.length}
                  </Badge>
                )}
              </TabsTrigger>
              
              <TabsTrigger value="service-requests" className="gap-2">
                <Megaphone className="w-4 h-4" />
                Service Requests
              </TabsTrigger>
            </TabsList>

            {/* Collapsible Calendar Overview */}
            <Collapsible open={calendarOpen} onOpenChange={setCalendarOpen}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Calendar Overview
                        <Badge variant="outline" className="ml-2">
                          {calendarViewMode === "week" 
                            ? `${format(currentWeekStart, 'MMM d')} - ${format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}`
                            : format(currentWeekStart, 'MMMM yyyy')
                          }
                        </Badge>
                        {calendarFilter !== "all" && (
                          <Badge variant="secondary" className="ml-1 capitalize">
                            {calendarFilter}
                          </Badge>
                        )}
                      </CardTitle>
                      {calendarOpen ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4">
                    {/* Calendar Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentWeekStart(prev => addDays(prev, calendarViewMode === "week" ? -7 : -30));
                          }}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
                          }}
                        >
                          Today
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentWeekStart(prev => addDays(prev, calendarViewMode === "week" ? 7 : 30));
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* View mode toggle */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant={calendarViewMode === "week" ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCalendarViewMode("week");
                          }}
                        >
                          Week
                        </Button>
                        <Button
                          variant={calendarViewMode === "month" ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCalendarViewMode("month");
                          }}
                          className="gap-1"
                        >
                          <Expand className="w-3 h-3" />
                          Month
                        </Button>
                      </div>
                    </div>
                    
                    {/* Calendar Filter Pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        variant={calendarFilter === "all" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarFilter("all");
                        }}
                      >
                        All Bookings
                      </Button>
                      <Button
                        variant={calendarFilter === "customer" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarFilter("customer");
                        }}
                      >
                        As Customer
                      </Button>
                      {isVendor && (
                        <Button
                          variant={calendarFilter === "vendor" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCalendarFilter("vendor");
                          }}
                        >
                          As Vendor
                        </Button>
                      )}
                      <Button
                        variant={calendarFilter === "completed" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCalendarFilter("completed");
                        }}
                      >
                        Completed
                      </Button>
                    </div>
                    
                    {/* Calendar Grid */}
                    {calendarViewMode === "week" ? (
                      /* Week View */
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }, (_, i) => {
                          const day = addDays(currentWeekStart, i);
                          // Filter bookings based on calendarFilter
                          let filteredBookings: Booking[] = [];
                          if (calendarFilter === "all") {
                            filteredBookings = [...customerActiveBookings, ...vendorActiveBookings];
                          } else if (calendarFilter === "customer") {
                            filteredBookings = customerActiveBookings;
                          } else if (calendarFilter === "vendor") {
                            filteredBookings = vendorActiveBookings;
                          } else if (calendarFilter === "completed") {
                            filteredBookings = [...customerCompletedBookings, ...vendorCompletedBookings];
                          }
                          
                          const dayBookings = filteredBookings.filter(b => {
                            const bookingDate = parseISO(b.confirmedStartTime || b.requestedStartTime);
                            return isSameDay(bookingDate, day);
                          });
                          
                          return (
                            <div
                              key={i}
                              className={cn(
                                "p-2 rounded-lg border min-h-[100px] text-center cursor-pointer hover:bg-muted/50 transition-colors",
                                isToday(day) && "bg-primary/10 border-primary",
                                isPast(day) && !isToday(day) && "bg-muted/50 opacity-60"
                              )}
                              onClick={() => {
                                // If there are bookings, show the first one
                                if (dayBookings.length > 0) {
                                  setSelectedBooking(dayBookings[0]);
                                }
                              }}
                            >
                              <div className="font-medium text-sm">
                                {format(day, 'EEE')}
                              </div>
                              <div className={cn(
                                "text-lg font-bold",
                                isToday(day) && "text-primary"
                              )}>
                                {format(day, 'd')}
                              </div>
                              {dayBookings.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {dayBookings.slice(0, 2).map(b => (
                                    <div
                                      key={b.id}
                                      className={cn(
                                        "text-xs p-1 rounded truncate cursor-pointer hover:opacity-80",
                                        b.bookingType === "customer" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                      )}
                                      title={b.service?.title}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBooking(b);
                                      }}
                                    >
                                      {b.service?.title?.slice(0, 15)}...
                                    </div>
                                  ))}
                                  {dayBookings.length > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{dayBookings.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Month View */
                      <div>
                        <div className="text-center font-semibold mb-4">
                          {format(currentWeekStart, 'MMMM yyyy')}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {/* Day headers */}
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                              {day}
                            </div>
                          ))}
                          {/* Generate month days */}
                          {(() => {
                            const monthStart = startOfWeek(new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1), { weekStartsOn: 1 });
                            const daysInMonth = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0).getDate();
                            const totalDays = Math.ceil((daysInMonth + (new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1).getDay() || 7) - 1) / 7) * 7;
                            
                            // Filter bookings based on calendarFilter
                            let filteredBookings: Booking[] = [];
                            if (calendarFilter === "all") {
                              filteredBookings = [...customerActiveBookings, ...vendorActiveBookings];
                            } else if (calendarFilter === "customer") {
                              filteredBookings = customerActiveBookings;
                            } else if (calendarFilter === "vendor") {
                              filteredBookings = vendorActiveBookings;
                            } else if (calendarFilter === "completed") {
                              filteredBookings = [...customerCompletedBookings, ...vendorCompletedBookings];
                            }
                            
                            return Array.from({ length: totalDays }, (_, i) => {
                              const day = addDays(monthStart, i);
                              const isCurrentMonth = day.getMonth() === currentWeekStart.getMonth();
                              const dayBookings = filteredBookings.filter(b => {
                                const bookingDate = parseISO(b.confirmedStartTime || b.requestedStartTime);
                                return isSameDay(bookingDate, day);
                              });
                              
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "p-1 rounded border min-h-[60px] text-center cursor-pointer hover:bg-muted/50 transition-colors",
                                    !isCurrentMonth && "opacity-30",
                                    isToday(day) && "bg-primary/10 border-primary",
                                    dayBookings.length > 0 && "border-primary/50"
                                  )}
                                  onClick={() => {
                                    if (dayBookings.length > 0) {
                                      setSelectedBooking(dayBookings[0]);
                                    }
                                  }}
                                >
                                  <div className={cn(
                                    "text-sm",
                                    isToday(day) && "font-bold text-primary"
                                  )}>
                                    {format(day, 'd')}
                                  </div>
                                  {dayBookings.length > 0 && (
                                    <div className="mt-1">
                                      <div className={cn(
                                        "w-2 h-2 rounded-full mx-auto",
                                        dayBookings[0].bookingType === "customer" ? "bg-blue-500" : "bg-green-500"
                                      )} />
                                      {dayBookings.length > 1 && (
                                        <span className="text-[10px] text-muted-foreground">+{dayBookings.length - 1}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Dashboard Tab (Default for vendors) */}
            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Actions - Clickable */}
                <Card 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500",
                    dashboardQuickFilter === "pending" && "ring-2 ring-amber-500"
                  )}
                  onClick={() => {
                    if (dashboardQuickFilter === "pending") {
                      setDashboardQuickFilter(null);
                    } else {
                      setDashboardQuickFilter("pending");
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      Pending Actions
                      {dashboardQuickFilter === "pending" && (
                        <Badge variant="secondary" className="text-xs">Filtered</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {vendorActiveBookings.filter(b => b.status === "pending").length}
                    </div>
                    <p className="text-sm text-muted-foreground">bookings need response</p>
                    <p className="text-xs text-primary mt-1">Click to filter</p>
                  </CardContent>
                </Card>
                
                {/* Active Bookings - Clickable */}
                <Card 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all border-l-4 border-l-green-500",
                    dashboardQuickFilter === "active" && "ring-2 ring-green-500"
                  )}
                  onClick={() => {
                    if (dashboardQuickFilter === "active") {
                      setDashboardQuickFilter(null);
                    } else {
                      setDashboardQuickFilter("active");
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      Active Bookings
                      {dashboardQuickFilter === "active" && (
                        <Badge variant="secondary" className="text-xs">Filtered</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {vendorActiveBookings.length}
                    </div>
                    <p className="text-sm text-muted-foreground">as vendor</p>
                    <p className="text-xs text-primary mt-1">Click to filter</p>
                  </CardContent>
                </Card>
                
                {/* Completed This Month - Clickable */}
                <Card 
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500",
                    dashboardQuickFilter === "completed-month" && "ring-2 ring-blue-500"
                  )}
                  onClick={() => {
                    if (dashboardQuickFilter === "completed-month") {
                      setDashboardQuickFilter(null);
                    } else {
                      setDashboardQuickFilter("completed-month");
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                      Completed This Month
                      {dashboardQuickFilter === "completed-month" && (
                        <Badge variant="secondary" className="text-xs">Filtered</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {vendorCompletedBookings.filter(b => {
                        const date = b.completedAt ? parseISO(b.completedAt) : null;
                        return date && date.getMonth() === new Date().getMonth();
                      }).length}
                    </div>
                    <p className="text-sm text-muted-foreground">services delivered</p>
                    <p className="text-xs text-primary mt-1">Click to filter</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button onClick={() => setActiveTab("as-vendor")} variant="outline" className="gap-2">
                    <ArrowDownLeft className="w-4 h-4" />
                    View Vendor Bookings
                  </Button>
                  <Button onClick={() => setLocation("/vendor/bookings")} variant="outline" className="gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Manage Calendar
                  </Button>
                  <Button onClick={() => setLocation("/profile?tab=services&action=create")} variant="outline" className="gap-2">
                    <Package className="w-4 h-4" />
                    Create New Service
                  </Button>
                </CardContent>
              </Card>
              
              {/* Filtered Booking List (when quick filter active) */}
              {dashboardQuickFilter && (
                <Card className="border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {dashboardQuickFilter === "pending" && (
                        <>
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                          Pending Bookings
                        </>
                      )}
                      {dashboardQuickFilter === "active" && (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Active Vendor Bookings
                        </>
                      )}
                      {dashboardQuickFilter === "completed-month" && (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-blue-500" />
                          Completed This Month
                        </>
                      )}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDashboardQuickFilter(null)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Clear Filter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(() => {
                        let filteredBookings: Booking[] = [];
                        if (dashboardQuickFilter === "pending") {
                          filteredBookings = vendorActiveBookings.filter(b => b.status === "pending");
                        } else if (dashboardQuickFilter === "active") {
                          filteredBookings = vendorActiveBookings;
                        } else if (dashboardQuickFilter === "completed-month") {
                          filteredBookings = vendorCompletedBookings.filter(b => {
                            const date = b.completedAt ? parseISO(b.completedAt) : null;
                            return date && date.getMonth() === new Date().getMonth();
                          });
                        }
                        
                        if (filteredBookings.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              No bookings found for this filter
                            </div>
                          );
                        }
                        
                        return filteredBookings.map(booking => (
                          <BookingListItem key={booking.id} booking={booking} />
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Recent Pending Bookings (show when no filter active) */}
              {!dashboardQuickFilter && vendorActiveBookings.filter(b => b.status === "pending").length > 0 && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      Pending Bookings - Action Required
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {vendorActiveBookings
                        .filter(b => b.status === "pending")
                        .slice(0, 3)
                        .map(booking => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <Link 
                                href={booking.service?.id ? `/services/${booking.service.id}` : "#"}
                                className="font-medium hover:underline text-primary"
                              >
                                {booking.service?.title}
                              </Link>
                              <div className="text-sm text-muted-foreground">
                                From: <Link href={booking.customer?.id ? `/users/${booking.customer.id}` : "#"} className="hover:underline">{booking.customer?.firstName} {booking.customer?.lastName}</Link>
                              </div>
                            </div>
                            <Button size="sm" onClick={() => setSelectedBooking(booking)}>
                              Review
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="as-customer" className="space-y-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowUpRight className="w-5 h-5 text-blue-500" />
                    Active Bookings (As Customer)
                  </CardTitle>
                  <CardDescription>Services you have booked from other vendors</CardDescription>
                </CardHeader>
              </Card>
              
              {customerActiveLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : customerActiveBookings.length === 0 ? (
                <EmptyState 
                  message="No active bookings as a customer"
                  action={<Button onClick={() => setLocation("/")}>Browse Services</Button>}
                />
              ) : (
                <div className="space-y-4">
                  {sortByDate(customerActiveBookings).map(booking => (
                    <BookingListItem key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </TabsContent>

            {isVendor && (
              <TabsContent value="as-vendor" className="space-y-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        Active Bookings (As Vendor)
                      </CardTitle>
                      <CardDescription>Customers who have booked your services</CardDescription>
                    </div>
                    <Link href="/vendor/bookings">
                      <Button variant="outline" size="sm" className="gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Calendar & Management
                      </Button>
                    </Link>
                  </CardHeader>
                </Card>
                
                {vendorActiveLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                  </div>
                ) : vendorActiveBookings.length === 0 ? (
                  <EmptyState message="No active bookings as a vendor" />
                ) : (
                  <div className="space-y-4">
                    {sortByDate(vendorActiveBookings).map(booking => (
                      <BookingListItem key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}

            {/* Combined Completed Tab */}
            <TabsContent value="completed" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                    Completed Bookings
                  </CardTitle>
                  <CardDescription>All your past bookings (as customer and vendor)</CardDescription>
                </CardHeader>
              </Card>
              
              {(customerCompletedLoading || vendorCompletedLoading) ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
              ) : (customerCompletedBookings.length + vendorCompletedBookings.length) === 0 ? (
                <EmptyState message="No completed bookings yet" />
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {/* As Customer Section */}
                  {customerCompletedBookings.length > 0 && (
                    <AccordionItem value="as-customer" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-blue-500" />
                          <span>As Customer ({customerCompletedBookings.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {sortByDate(customerCompletedBookings).map(booking => (
                            <BookingListItem key={booking.id} booking={booking} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {/* As Vendor Section */}
                  {vendorCompletedBookings.length > 0 && (
                    <AccordionItem value="as-vendor" className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-green-500" />
                          <span>As Vendor ({vendorCompletedBookings.length})</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {sortByDate(vendorCompletedBookings).map(booking => (
                            <BookingListItem key={booking.id} booking={booking} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="service-requests" className="space-y-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Megaphone className="w-5 h-5 text-orange-500" />
                      Service Requests
                    </CardTitle>
                    <CardDescription>Manage your requests and proposals</CardDescription>
                  </div>
                  <Link href="/service-requests">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </Link>
                </CardHeader>
              </Card>
              
              {/* Service Requests Subtabs */}
              <Tabs value={serviceRequestsSubTab} onValueChange={setServiceRequestsSubTab} className="space-y-4">
                <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto gap-1 p-1 bg-card rounded-lg shadow-sm">
                  <TabsTrigger value="my-requests" className="gap-2 text-xs md:text-sm">
                    <FileText className="w-4 h-4" />
                    My Requests
                    {serviceRequests.length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{serviceRequests.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="proposals-received" className="gap-2 text-xs md:text-sm">
                    <Inbox className="w-4 h-4" />
                    Proposals
                    {receivedProposals.filter((p: any) => p.status === "pending").length > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-800">
                        {receivedProposals.filter((p: any) => p.status === "pending").length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  {isVendor && (
                    <TabsTrigger value="proposals-sent" className="gap-2 text-xs md:text-sm">
                      <Send className="w-4 h-4" />
                      Sent
                      {myProposals.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">{myProposals.length}</Badge>
                      )}
                    </TabsTrigger>
                  )}
                  {isVendor && (
                    <TabsTrigger value="browse" className="gap-2 text-xs md:text-sm">
                      <Eye className="w-4 h-4" />
                      Browse
                      {browseRequests.length > 0 && (
                        <Badge variant="secondary" className="ml-1 text-xs">{browseRequests.length}</Badge>
                      )}
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* My Requests Subtab */}
                <TabsContent value="my-requests" className="space-y-4">
                  {requestsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                  ) : serviceRequests.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                        <p className="text-muted-foreground mb-4">Create a service request and let vendors come to you with quotes.</p>
                        <Link href="/service-requests">
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Request
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {serviceRequests.map(request => {
                        const proposalCount = (request as any).proposalCount || 0;
                        return (
                          <Card key={request.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                            <CardContent className="py-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold">{request.title}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{request.description}</p>
                                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                                    {request.budget && (
                                      <span className="font-medium text-green-600">
                                        CHF {request.budget}
                                      </span>
                                    )}
                                    {request.location && (
                                      <span className="flex items-center gap-1 text-muted-foreground">
                                        <MapPin className="w-3 h-3" />
                                        {request.location}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <Eye className="w-3 h-3" />
                                      {(request as any).viewCount || 0} views
                                    </span>
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <MessageSquare className="w-3 h-3" />
                                      {proposalCount} proposals
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={request.status === "open" ? "default" : "secondary"}>
                                  {request.status}
                                </Badge>
                              </div>
                            </CardContent>
                            <CardFooter className="pt-0 gap-2">
                              {proposalCount > 0 && request.status === "open" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setProposalsRequestFilter(request.id);
                                    setServiceRequestsSubTab("proposals-received");
                                  }}
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Proposals ({proposalCount})
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => handleEditRequest(request)}
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Proposals Received Subtab */}
                <TabsContent value="proposals-received" className="space-y-4">
                  {/* Request Filter */}
                  <Card>
                    <CardContent className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">Filter by request:</span>
                        <Button
                          variant={proposalsRequestFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setProposalsRequestFilter("all")}
                          className="h-7 text-xs"
                        >
                          All Requests
                        </Button>
                        {serviceRequests.filter(r => r.status === "open").map(request => {
                          // Truncate title to first 2 words with ellipsis if needed
                          const words = request.title.split(' ');
                          const truncatedTitle = words.length > 2 
                            ? words.slice(0, 2).join(' ') + '...' 
                            : request.title;
                          return (
                            <Button
                              key={request.id}
                              variant={proposalsRequestFilter === request.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setProposalsRequestFilter(request.id)}
                              className="h-7 text-xs max-w-[120px]"
                              title={request.title}
                            >
                              <span className="truncate">{truncatedTitle}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {loadingReceivedProposals ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                  ) : receivedProposals.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Inbox className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium mb-2">No proposals received yet</h3>
                        <p className="text-muted-foreground">When vendors submit proposals to your requests, they'll appear here.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {receivedProposals
                        .filter((p: any) => proposalsRequestFilter === "all" || p.serviceRequestId === proposalsRequestFilter)
                        .map((proposal: any) => (
                          <Card key={proposal.id} className="border-l-4 border-l-green-500">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">
                                    Proposal for: {proposal.request?.title || "Service Request"}
                                  </CardTitle>
                                  <CardDescription className="mt-1">
                                    From: {proposal.vendor?.businessName || `${proposal.vendor?.firstName} ${proposal.vendor?.lastName}` || "Vendor"}
                                    {proposal.vendor?.rating && (
                                      <span className="ml-2">⭐ {proposal.vendor.rating.toFixed(1)}</span>
                                    )}
                                  </CardDescription>
                                </div>
                                <Badge variant={
                                  proposal.status === "pending" ? "default" :
                                  proposal.status === "accepted" ? "outline" : "secondary"
                                } className={
                                  proposal.status === "pending" ? "bg-amber-100 text-amber-800" :
                                  proposal.status === "accepted" ? "bg-green-100 text-green-800" : ""
                                }>
                                  {proposal.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">CHF {proposal.price}</span>
                                </div>
                                {proposal.estimatedDuration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>{proposal.estimatedDuration}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm italic line-clamp-3">"{proposal.coverLetter}"</p>
                              </div>
                              {proposal.linkedService && (
                                <Link href={`/services/${proposal.linkedService.id}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                  <Eye className="w-4 h-4" />
                                  View vendor's service: {proposal.linkedService.title}
                                </Link>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                              </div>
                            </CardContent>
                            {proposal.status === "pending" && (
                              <CardFooter className="gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    apiRequest(`/api/proposals/${proposal.id}/accept`, { method: "POST" })
                                      .then(() => {
                                        toast({ title: "Proposal accepted!", description: "A booking has been created." });
                                        refetchReceivedProposals();
                                        refetchMyRequests();
                                      })
                                      .catch(() => toast({ title: "Error", description: "Failed to accept proposal", variant: "destructive" }));
                                  }}
                                  className="gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    apiRequest(`/api/proposals/${proposal.id}/reject`, { method: "POST" })
                                      .then(() => {
                                        toast({ title: "Proposal rejected" });
                                        refetchReceivedProposals();
                                      })
                                      .catch(() => toast({ title: "Error", description: "Failed to reject proposal", variant: "destructive" }));
                                  }}
                                  className="gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Reject
                                </Button>
                                {proposal.vendor?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setLocation(`/chat?vendor=${proposal.vendor.id}${proposal.linkedService?.id ? `&service=${proposal.linkedService.id}` : ''}`)}
                                    className="gap-2"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    Message
                                  </Button>
                                )}
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      {receivedProposals.filter((p: any) => proposalsRequestFilter === "all" || p.serviceRequestId === proposalsRequestFilter).length === 0 && (
                        <Card>
                          <CardContent className="py-8 text-center text-muted-foreground">
                            No proposals found for this request.
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                {/* Proposals Sent Subtab (Vendor only) */}
                {isVendor && (
                  <TabsContent value="proposals-sent" className="space-y-4">
                    {loadingMyProposals ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                      </div>
                    ) : myProposals.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Send className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <h3 className="text-lg font-medium mb-2">No proposals sent yet</h3>
                          <p className="text-muted-foreground mb-4">Browse open requests and submit proposals to win jobs.</p>
                          <Button onClick={() => setServiceRequestsSubTab("browse")} className="gap-2">
                            <Eye className="w-4 h-4" />
                            Browse Requests
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {myProposals.map((proposal: any) => (
                          <Card key={proposal.id} className="border-l-4 border-l-blue-500">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{proposal.request?.title || "Service Request"}</CardTitle>
                                  <CardDescription className="mt-1 line-clamp-2">
                                    {proposal.request?.description}
                                  </CardDescription>
                                </div>
                                <Badge variant={
                                  proposal.status === "pending" ? "default" :
                                  proposal.status === "accepted" ? "outline" : "secondary"
                                } className={
                                  proposal.status === "pending" ? "bg-amber-100 text-amber-800" :
                                  proposal.status === "accepted" ? "bg-green-100 text-green-800" : ""
                                }>
                                  {proposal.status}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-medium text-green-600">Your price: CHF {proposal.price}</span>
                                {proposal.expiresAt && proposal.status === "pending" && (
                                  <span className="text-amber-600 text-xs">
                                    Expires {formatDistanceToNow(new Date(proposal.expiresAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                "{proposal.coverLetter}"
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                                {proposal.editCount > 0 && (
                                  <span className="ml-2 text-amber-600">• Edited {proposal.editCount} time(s)</span>
                                )}
                              </div>
                            </CardContent>
                            {proposal.status === "pending" && (
                              <CardFooter className="gap-2">
                                <Link href={`/service-requests?editProposal=${proposal.id}`}>
                                  <Button variant="outline" size="sm" className="gap-2" disabled={(proposal.editCount || 0) >= 3}>
                                    <Edit className="w-4 h-4" />
                                    {(proposal.editCount || 0) >= 3 ? "Max edits reached" : "Edit"}
                                  </Button>
                                </Link>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Browse Requests Subtab (Vendor only) */}
                {isVendor && (
                  <TabsContent value="browse" className="space-y-4">
                  {/* Saved Requests Section */}
                  {savedRequests.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BookmarkCheck className="w-4 h-4 text-amber-600" />
                          Saved Requests ({savedRequests.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {savedRequests.slice(0, 3).map((request: any) => (
                            <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-card shadow-sm">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{request.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  {request.locationCity && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      {request.locationCity}
                                    </span>
                                  )}
                                  {request.budgetMax && (
                                    <span className="text-green-600 font-medium">CHF {request.budgetMax}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-amber-600"
                                  onClick={() => unsaveRequestMutation.mutate(request.id)}
                                >
                                  <BookmarkCheck className="w-4 h-4" />
                                </Button>
                                <Link href={`/service-requests?submit=${request.id}`}>
                                  <Button size="sm" className="gap-1">
                                    <Send className="w-3 h-3" />
                                    Propose
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                          {savedRequests.length > 3 && (
                            <Link href="/service-requests?tab=saved">
                              <Button variant="ghost" className="w-full text-sm">
                                View all {savedRequests.length} saved requests
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Browse All Requests */}
                  {loadingBrowse ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                    </div>
                  ) : browseRequests.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                        <h3 className="text-lg font-medium mb-2">No requests available</h3>
                        <p className="text-muted-foreground mb-4">Check back later for new service requests from customers.</p>
                        <Link href="/service-requests?tab=browse">
                          <Button variant="outline" className="gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Open Full Browse
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {browseRequests.length} open request{browseRequests.length !== 1 ? "s" : ""} available
                        </p>
                        <Link href="/service-requests?tab=browse">
                          <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-3 h-3" />
                            Filter & Sort
                          </Button>
                        </Link>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {browseRequests.slice(0, 6).map((request: any) => {
                          const saved = isRequestSaved(request.id);
                          const hasProposal = !!request.vendorProposalId;
                          
                          return (
                            <Card 
                              key={request.id} 
                              className={cn(
                                "hover:shadow-md transition-shadow",
                                hasProposal && "ring-2 ring-primary/30"
                              )}
                            >
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start gap-2">
                                  <CardTitle className="text-base line-clamp-2">{request.title}</CardTitle>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {hasProposal && (
                                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                                        {request.vendorProposalStatus === 'accepted' ? '✓ Accepted' : 'Sent'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <CardDescription className="line-clamp-2 text-xs">
                                  {request.description}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-2 pb-2">
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                  {request.locationCity && (
                                    <span className="flex items-center gap-1 text-muted-foreground">
                                      <MapPin className="w-3 h-3" />
                                      {request.locationCity}
                                      {request.locationCanton && `, ${request.locationCanton}`}
                                    </span>
                                  )}
                                  {(request.budgetMin || request.budgetMax) && (
                                    <span className="font-medium text-green-600">
                                      CHF {request.budgetMin || "?"} - {request.budgetMax || "?"}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {request.viewCount || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" />
                                    {request.proposalCount || 0}
                                  </span>
                                  <span>
                                    {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                              </CardContent>
                              <CardFooter className="pt-0 gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn("h-8 w-8", saved && "text-amber-600")}
                                  onClick={() => saved ? unsaveRequestMutation.mutate(request.id) : saveRequestMutation.mutate(request.id)}
                                >
                                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                </Button>
                                {hasProposal ? (
                                  <Link href={`/service-requests?viewProposal=${request.vendorProposalId}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                      <Eye className="w-3 h-3" />
                                      View Proposal
                                    </Button>
                                  </Link>
                                ) : (
                                  <Link href={`/service-requests?submit=${request.id}`} className="flex-1">
                                    <Button size="sm" className="w-full gap-2">
                                      <Send className="w-3 h-3" />
                                      Submit Proposal
                                    </Button>
                                  </Link>
                                )}
                              </CardFooter>
                            </Card>
                          );
                        })}
                      </div>
                      {browseRequests.length > 6 && (
                        <Link href="/service-requests?tab=browse">
                          <Button variant="outline" className="w-full gap-2">
                            View all {browseRequests.length} requests
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                  </TabsContent>
                )}
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Booking #{selectedBooking.bookingNumber}
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      selectedBooking.bookingType === "customer"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-green-50 text-green-700 border-green-200"
                    )}
                  >
                    {selectedBooking.bookingType === "customer" ? "As Customer" : "As Vendor"}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={statusConfig[selectedBooking.status]?.color}>
                    {statusConfig[selectedBooking.status]?.icon}
                    <span className="ml-1">{statusConfig[selectedBooking.status]?.label}</span>
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Service</h4>
                  <Link 
                    href={selectedBooking.service?.id ? `/services/${selectedBooking.service.id}` : "#"}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    {selectedBooking.service?.images?.[0] ? (
                      <img
                        src={selectedBooking.service.images[0]}
                        alt={selectedBooking.service.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-primary group-hover:underline">{selectedBooking.service?.title}</p>
                      {selectedBooking.totalPrice && (
                        <p className="text-sm text-muted-foreground">
                          {selectedBooking.currency} {parseFloat(selectedBooking.totalPrice).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Eye className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </Link>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">
                    {selectedBooking.bookingType === "customer" ? "Vendor" : "Customer"}
                  </h4>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Link 
                      href={selectedBooking.bookingType === "customer" 
                        ? (selectedBooking.vendor?.id ? `/users/${selectedBooking.vendor.id}` : "#")
                        : (selectedBooking.customer?.id ? `/users/${selectedBooking.customer.id}` : "#")
                      }
                      className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                    >
                      <Avatar>
                        <AvatarImage 
                          src={selectedBooking.bookingType === "customer" 
                            ? selectedBooking.vendor?.profileImageUrl 
                            : selectedBooking.customer?.profileImageUrl
                          } 
                        />
                        <AvatarFallback>
                          {selectedBooking.bookingType === "customer"
                            ? `${selectedBooking.vendor?.firstName?.[0]}${selectedBooking.vendor?.lastName?.[0]}`
                            : `${selectedBooking.customer?.firstName?.[0]}${selectedBooking.customer?.lastName?.[0]}`
                          }
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-primary hover:underline">
                        {selectedBooking.bookingType === "customer"
                          ? `${selectedBooking.vendor?.firstName} ${selectedBooking.vendor?.lastName}`
                          : `${selectedBooking.customer?.firstName} ${selectedBooking.customer?.lastName}`
                        }
                      </span>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleChat(selectedBooking)}>
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Schedule</h4>
                  <div className="space-y-1 text-sm p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {format(
                        parseISO(selectedBooking.confirmedStartTime || selectedBooking.requestedStartTime),
                        "EEEE, MMMM d, yyyy"
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(
                        parseISO(selectedBooking.confirmedStartTime || selectedBooking.requestedStartTime),
                        "HH:mm"
                      )}
                      {" - "}
                      {format(
                        parseISO(selectedBooking.confirmedEndTime || selectedBooking.requestedEndTime),
                        "HH:mm"
                      )}
                    </div>
                  </div>
                </div>
                
                {(selectedBooking.customerMessage || selectedBooking.vendorMessage) && (
                  <div>
                    <h4 className="font-medium mb-2">Messages</h4>
                    <div className="space-y-2 text-sm">
                      {selectedBooking.customerMessage && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <span className="font-medium">Customer:</span> {selectedBooking.customerMessage}
                        </div>
                      )}
                      {selectedBooking.vendorMessage && (
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <span className="font-medium">Vendor:</span> {selectedBooking.vendorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                <Button variant="ghost" onClick={() => setSelectedBooking(null)} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Bookings
                </Button>
                <Link href={selectedBooking.bookingType === "customer" ? `/bookings?booking=${selectedBooking.id}` : `/vendor/bookings?booking=${selectedBooking.id}`}>
                  <Button>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Full Details
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Service Request Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => !open && setEditingRequest(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Service Request
            </DialogTitle>
            <DialogDescription>
              Update your service request details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editRequestData.title}
                onChange={(e) => setEditRequestData({ ...editRequestData, title: e.target.value })}
                placeholder="What service do you need?"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editRequestData.description}
                onChange={(e) => setEditRequestData({ ...editRequestData, description: e.target.value })}
                placeholder="Describe what you need in detail..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-budget-min">Min Budget (CHF)</Label>
                <Input
                  id="edit-budget-min"
                  type="number"
                  value={editRequestData.budgetMin}
                  onChange={(e) => setEditRequestData({ ...editRequestData, budgetMin: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget-max">Max Budget (CHF)</Label>
                <Input
                  id="edit-budget-max"
                  type="number"
                  value={editRequestData.budgetMax}
                  onChange={(e) => setEditRequestData({ ...editRequestData, budgetMax: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={editRequestData.locationCity}
                onChange={(e) => setEditRequestData({ ...editRequestData, locationCity: e.target.value })}
                placeholder="City or area"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditingRequest(null)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button 
              onClick={() => {
                if (editingRequest) {
                  editRequestMutation.mutate({
                    requestId: editingRequest.id,
                    ...editRequestData,
                  });
                }
              }}
              disabled={editRequestMutation.isPending || !editRequestData.title.trim()}
            >
              {editRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
