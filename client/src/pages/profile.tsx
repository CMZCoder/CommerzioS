import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Settings, CreditCard, BarChart3, RefreshCw, Clock, Trash2, Plus, Edit2, MapPin, CheckCircle2, CheckCircle, User as UserIcon, Camera, Loader2, Edit, Trash, Pencil, Check, Gift, Users, Star, TrendingUp, Copy, Share2, ChevronDown, ChevronRight, DollarSign, MessageCircle, MessageSquare, Bell, AlertTriangle, Key, Mail, Smartphone, Banknote, CalendarDays, Lock, History, ShoppingBag, Receipt, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";
import { fetchApi } from "@/lib/config";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { useEffect, useCallback, useRef } from "react";
import type { Service, SelectAddress, Plan, Order } from "@shared/schema";
import { CreateServiceModal } from "@/components/create-service-modal";
import { EditServiceModal } from "@/components/edit-service-modal";
import { CategorySuggestionModal } from "@/components/category-suggestion-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Cropper from "react-easy-crop";
import { Slider } from "@/components/ui/slider";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { geocodeLocation } from "@/lib/geocoding";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { VendorEscrowDashboard } from "@/components/vendor/VendorEscrowDashboard";

export default function Profile() {
  // Scroll to top on mount and tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Extract tab from URL search params
  const getTabFromUrl = () => {
    const search = window.location.search;
    const searchParams = new URLSearchParams(search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'services', 'bookings', 'reviews', 'referrals', 'notifications'].includes(tabParam)) {
      return tabParam;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromUrl());

  // Listen for tab changes from navigation or popstate
  useEffect(() => {
    // Handle custom event from navigation dropdown
    const handleTabChange = (e: Event) => {
      const event = e as CustomEvent;
      setActiveTab(event.detail.tab);
    };

    // Handle browser back/forward
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };

    window.addEventListener('profileTabChange', handleTabChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('profileTabChange', handleTabChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Scroll to top when changing tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithDetails | null>(null);
  const [showCategorySuggestionModal, setShowCategorySuggestionModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [serviceToPause, setServiceToPause] = useState<string | null>(null);
  const [serviceToActivate, setServiceToActivate] = useState<string | null>(null);

  // Section refs for navigation
  const personalInfoRef = useRef<HTMLDivElement | null>(null);
  const accountInfoRef = useRef<HTMLDivElement | null>(null);
  const addressesRef = useRef<HTMLDivElement | null>(null);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");

  const [mainLocationName, setMainLocationName] = useState(user?.preferredLocationName || "");
  const [mainLocationLat, setMainLocationLat] = useState(user?.locationLat ? parseFloat(user.locationLat as any) : null);
  const [mainLocationLng, setMainLocationLng] = useState(user?.locationLng ? parseFloat(user.locationLng as any) : null);

  const [editingAddress, setEditingAddress] = useState<SelectAddress | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [isAddressValidated, setIsAddressValidated] = useState(false);

  const [addressForm, setAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    postalCode: "",
    canton: "",
    country: "Switzerland",
    isPrimary: false,
  });

  // Profile picture upload states
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password dialog states
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Review back modal states - comprehensive type for both service and customer reviews
  const [showReviewBackModal, setShowReviewBackModal] = useState(false);
  const [reviewBackTarget, setReviewBackTarget] = useState<{
    type: 'service' | 'customer';
    bookingId: string;
    serviceId?: string;
    customerId?: string;
    serviceName?: string;
    userName: string;
  } | null>(null);
  const [reviewBackRating, setReviewBackRating] = useState(5);
  const [reviewBackText, setReviewBackText] = useState("");
  const [reviewBackBookingId, setReviewBackBookingId] = useState<string | null>(null);
  const [reviewsSubTab, setReviewsSubTab] = useState<'received' | 'given' | 'to-review' | 'pending'>('received');
  const [listingsSubTab, setListingsSubTab] = useState<'all' | 'active' | 'drafts' | 'toRenew' | 'expired' | 'archived'>('active');
  const [paymentsSubTab, setPaymentsSubTab] = useState<'overview' | 'escrow' | 'methods'>('overview');
  const [paymentHistoryTab, setPaymentHistoryTab] = useState<'all' | 'purchases' | 'sales' | 'commission' | 'promotional'>('all');

  // Multi-criteria ratings for comprehensive reviews
  const [serviceRating, setServiceRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);
  const [customerCommunicationRating, setCustomerCommunicationRating] = useState(5);
  const [customerPunctualityRating, setCustomerPunctualityRating] = useState(5);
  const [customerRespectRating, setCustomerRespectRating] = useState(5);

  // Sync state with user data when loaded
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhoneNumber(user.phoneNumber || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Edit review modal
  const [showEditReviewModal, setShowEditReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [editReviewText, setEditReviewText] = useState("");
  const [editReviewRating, setEditReviewRating] = useState(5);

  const { data: myServices = [], isLoading: servicesLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: ["/api/services", { ownerId: user?.id }],
    queryFn: () => apiRequest(`/api/services?ownerId=${user?.id}`),
    enabled: !!user?.id,
  });

  const { data: addresses = [] } = useQuery<SelectAddress[]>({
    queryKey: ["/api/users/me/addresses"],
    queryFn: () => apiRequest("/api/users/me/addresses"),
    enabled: isAuthenticated,
  });

  const { data: receivedReviews = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/reviews-received"],
    queryFn: () => apiRequest("/api/users/me/reviews-received"),
    enabled: isAuthenticated,
  });

  // Reviews the user has given on services
  const { data: givenReviews = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/reviews-given"],
    queryFn: () => apiRequest("/api/users/me/reviews-given"),
    enabled: isAuthenticated,
  });

  // Completed bookings where user can leave a service review (as customer)
  const { data: bookingsToReviewService = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/bookings-to-review-service"],
    queryFn: () => apiRequest("/api/users/me/bookings-to-review-service"),
    enabled: isAuthenticated,
  });

  // Completed bookings where vendor can review customer
  const { data: bookingsToReviewCustomer = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/bookings-to-review"],
    queryFn: () => apiRequest("/api/users/me/bookings-to-review"),
    enabled: isAuthenticated,
  });

  // Customer reviews the vendor has given
  const { data: customerReviewsGiven = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/customer-reviews-given"],
    queryFn: () => apiRequest("/api/users/me/customer-reviews-given"),
    enabled: isAuthenticated,
  });

  // Completed bookings on vendor's services awaiting customer review
  const { data: bookingsPendingReview = [] } = useQuery<Array<any>>({
    queryKey: ["/api/users/me/bookings-pending-review"],
    queryFn: () => apiRequest("/api/users/me/bookings-pending-review"),
    enabled: isAuthenticated,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<(Order & { service: Service, customer: any, vendor: any })[]>({
    queryKey: ["/api/users/me/transactions"],
    queryFn: () => apiRequest("/api/users/me/transactions"),
    enabled: isAuthenticated,
  });

  // Calculate stats from transactions
  const financialStats = useMemo(() => {
    if (!transactions.length) return { earned: 0, spent: 0, fees: 0, bookings: 0, services: 0 };

    // As Vendor: Earned = sum of totals where vendorId == user.id
    const earned = transactions
      .filter(t => t.vendorId === user?.id && t.status === 'completed')
      .reduce((acc, t) => acc + parseFloat(t.total), 0);

    // As Customer: Spent = sum of totals where customerId == user.id
    const spent = transactions
      .filter(t => t.customerId === user?.id && t.status === 'completed')
      .reduce((acc, t) => acc + parseFloat(t.total), 0);

    // Platform Fees (estimated based on earned)
    // In real app, this should come from vendorPayoutAmount vs total difference
    // For now, let's use the field if available, or calc
    const fees = transactions
      .filter(t => t.vendorId === user?.id && t.status === 'completed')
      .reduce((acc, t) => acc + (parseFloat(t.platformFee) || 0), 0);

    const completedBookings = transactions.filter(t => t.vendorId === user?.id && t.status === 'completed').length;
    const purchasedServices = transactions.filter(t => t.customerId === user?.id && t.status === 'completed').length;

    return { earned, spent, fees, bookings: completedBookings, services: purchasedServices };
  }, [transactions, user?.id]);

  // Stripe Connect status
  const { data: connectStatus, isLoading: connectStatusLoading, refetch: refetchConnectStatus } = useQuery<{
    hasAccount: boolean;
    isOnboarded: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }>({
    queryKey: ["/api/payments/connect/status"],
    queryFn: () => apiRequest("/api/payments/connect/status"),
    enabled: isAuthenticated,
  });

  // Create Stripe Connect account mutation
  const createConnectAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/payments/connect/create", { method: "POST" });
    },
    onSuccess: (data: any) => {
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else {
        toast({
          title: "Account Ready",
          description: "Your Stripe Connect account is already set up.",
        });
        refetchConnectStatus();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment account",
        variant: "destructive",
      });
    },
  });

  // Mutation to create customer review (vendor reviews customer)
  const createCustomerReviewMutation = useMutation({
    mutationFn: async ({ bookingId, rating, comment, communicationRating, punctualityRating, respectRating }: {
      bookingId: string;
      rating: number;
      comment: string;
      communicationRating?: number;
      punctualityRating?: number;
      respectRating?: number;
    }) => {
      return apiRequest(`/api/bookings/${bookingId}/customer-review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, communicationRating, punctualityRating, respectRating }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Posted!",
        description: "Your review of the customer has been submitted.",
      });
      setShowReviewBackModal(false);
      setReviewBackTarget(null);
      setReviewBackRating(5);
      setReviewBackText("");
      setReviewBackBookingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/customer-reviews-given"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/bookings-to-review"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Mutation to create service review (customer reviews service)  
  const createServiceReviewMutation = useMutation({
    mutationFn: async ({ serviceId, bookingId, rating, comment, qualityRating, communicationRating, punctualityRating, valueRating }: {
      serviceId: string;
      bookingId?: string;
      rating: number;
      comment: string;
      qualityRating?: number;
      communicationRating?: number;
      punctualityRating?: number;
      valueRating?: number;
    }) => {
      return apiRequest(`/api/services/${serviceId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment, bookingId, qualityRating, communicationRating, punctualityRating, valueRating }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Posted!",
        description: "Your review has been submitted successfully.",
      });
      setShowReviewBackModal(false);
      setReviewBackTarget(null);
      setReviewBackRating(5);
      setReviewBackText("");
      setReviewBackBookingId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/reviews-given"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/bookings-to-review-service"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  // Mutation to request a review from customer (vendor action)
  const requestReviewMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiRequest(`/api/bookings/${bookingId}/request-review`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Review Request Sent!",
        description: "The customer has been notified to leave a review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/bookings-pending-review"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to request review",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      apiRequest(`/api/services/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Success",
        description: "Service updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service.",
        variant: "destructive",
      });
    },
  });

  const renewServiceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/services/${id}/renew`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: "Service Renewed",
        description: "Your service has been renewed for 14 days.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to renew service.",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/services/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setServiceToDelete(null);
      toast({
        title: "Service Deleted",
        description: "Your service has been deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      firstName?: string; lastName?: string; phoneNumber?: string; profileImageUrl?: string;
      locationLat?: number | null; locationLng?: number | null; preferredLocationName?: string;
      acceptCardPayments?: boolean; acceptTwintPayments?: boolean; acceptCashPayments?: boolean; requireBookingApproval?: boolean;
    }) => {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const response = await fetch('/api/users/me/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/addresses'] });
      setShowAddressForm(false);
      resetAddressForm();
      toast({
        title: "Address added",
        description: "Your address has been added successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof addressForm> }) => {
      const response = await fetchApi(`/api/users/me/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update address');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/addresses'] });
      setEditingAddress(null);
      setShowAddressForm(false);
      resetAddressForm();
      toast({
        title: "Address updated",
        description: "Your address has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update address. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetchApi(`/api/users/me/addresses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete address');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/me/addresses'] });
      setAddressToDelete(null);
      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      setShowChangePasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: user?.email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and click the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: string, newStatus: Service['status']) => {
    if (newStatus === 'active') {
      setServiceToActivate(id);
    } else {
      updateServiceMutation.mutate({ id, data: { status: newStatus } });
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRenew = (id: string) => {
    renewServiceMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    setServiceToDelete(id);
  };

  const handlePause = (id: string) => {
    setServiceToPause(id);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your new passwords match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const isExpired = (date: string | Date) => {
    return new Date(date).getTime() < new Date().getTime();
  };

  const totalViews = useMemo(() => {
    return myServices.reduce((sum, service) => sum + service.viewCount, 0);
  }, [myServices]);

  // Helper: check if expired more than 10 days ago (should auto-archive)
  const isExpiredOver10Days = (date: string | Date) => {
    const expiryDate = new Date(date).getTime();
    const tenDaysAgo = new Date().getTime() - (10 * 24 * 60 * 60 * 1000);
    return expiryDate < tenDaysAgo;
  };

  // Categorize services into 6 groups
  const { allServices, activeServices, draftServices, toRenewServices, expiredServices, archivedServices } = useMemo(() => {
    const now = new Date().getTime();
    const tenDaysAgo = now - (10 * 24 * 60 * 60 * 1000);

    const drafts = myServices.filter(s => s.status === 'draft');
    const archived = myServices.filter(s => s.status === 'archived');

    // Active = status is 'active' and NOT expired
    const active = myServices.filter(s =>
      s.status === 'active' && new Date(s.expiresAt).getTime() >= now
    );

    // To Renew = expired within last 10 days (not archived)
    const toRenew = myServices.filter(s => {
      if (s.status === 'draft' || s.status === 'archived') return false;
      const expiryTime = new Date(s.expiresAt).getTime();
      return expiryTime < now && expiryTime >= tenDaysAgo;
    });

    // Expired = expired more than 10 days ago but not yet archived (frontend display only)
    const expired = myServices.filter(s => {
      if (s.status === 'draft' || s.status === 'archived') return false;
      const expiryTime = new Date(s.expiresAt).getTime();
      return expiryTime < tenDaysAgo;
    });

    // All = everything except archived
    const all = myServices.filter(s => s.status !== 'archived');

    return {
      allServices: all,
      activeServices: active,
      draftServices: drafts,
      toRenewServices: toRenew,
      expiredServices: expired,
      archivedServices: archived
    };
  }, [myServices]);

  const validateSwissPhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Empty is valid (optional field)
    // Swiss phone number validation: must start with +41 and have 9-13 digits after
    // Formats: +41 44 123 4567, +41441234567, +41 79 123 45 67
    const swissPhoneRegex = /^\+41\s?(\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\d{9,11})$/;
    return swissPhoneRegex.test(phone.replace(/\s/g, ''));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate phone number if provided
    if (phoneNumber && !validateSwissPhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Swiss phone number starting with +41",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({ firstName, lastName, phoneNumber, email });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate street contains a number
    const hasStreetNumber = /\d/.test(addressForm.street);
    if (!hasStreetNumber) {
      toast({
        title: "Invalid Street Address",
        description: "Street address must include a number",
        variant: "destructive",
      });
      return;
    }

    // Enforce validated address for new addresses only (not when editing)
    if (!editingAddress && !isAddressValidated) {
      toast({
        title: "Invalid Address",
        description: "Please select a validated Swiss address from the search suggestions",
        variant: "destructive",
      });
      return;
    }

    // Note: When editing, we allow saving without re-validation since it's already a saved address
    // Users can manually update fields if needed


    // For new addresses, check if it's the first one
    let isPrimary = addressForm.isPrimary;
    if (!editingAddress && addresses.length === 0) {
      isPrimary = true;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data: { ...addressForm, isPrimary } });
    } else {
      createAddressMutation.mutate({ ...addressForm, isPrimary });
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      label: "",
      street: "",
      city: "",
      postalCode: "",
      canton: "",
      country: "Switzerland",
      isPrimary: false,
    });
    setIsAddressValidated(false);
  };

  const startEditAddress = (address: SelectAddress) => {
    setEditingAddress(address);
    setAddressForm({
      label: address.label || "",
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      canton: address.canton || "",
      country: address.country,
      isPrimary: address.isPrimary,
    });
    // No need to set isAddressValidated for editing - validation check is bypassed for edits
    setShowAddressForm(true);
  };

  const cancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    resetAddressForm();
  };

  // Profile picture upload handlers
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createCroppedImage = async (): Promise<Blob> => {
    if (!imageToCrop || !croppedAreaPixels) {
      throw new Error('No image to crop');
    }

    const image = new Image();
    image.src = imageToCrop;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Set canvas size to cropped area
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await createCroppedImage();
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' });

      // Upload to object storage
      const uploadRes = await fetch('/api/objects/upload', {
        method: 'POST',
        credentials: 'include',
      });
      if (!uploadRes.ok) throw new Error('Failed to get upload URL');
      const { uploadURL } = await uploadRes.json();

      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload image');

      const setAclRes = await fetch('/api/service-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageURL: uploadURL }),
      });
      if (!setAclRes.ok) throw new Error('Failed to set image ACL');
      const { objectPath } = await setAclRes.json();

      // Update user profile with new image URL
      await updateProfileMutation.mutateAsync({ profileImageUrl: objectPath });

      setShowCropDialog(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    setLocation("/");
    return null;
  }

  return (
    <Layout>
      <div className="bg-muted min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile</h1>
              <p className="text-muted-foreground">Manage your services and account settings</p>
            </div>
            <Button
              size="lg"
              className="gap-2 shadow-md shadow-primary/20"
              onClick={() => setShowCreateModal(true)}
              data-testid="button-post-new-service"
            >
              <PlusCircle className="w-4 h-4" /> Post New Service
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value); // Set state first
              setLocation(`/profile?tab=${value}`); // Then update URL
            }}
            className="w-full"
          >
            <TabsList className="mb-6 bg-card p-1 border border-border flex-wrap">
              <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
              <TabsTrigger value="services" data-testid="tab-my-services">My Listings</TabsTrigger>
              <TabsTrigger value="bookings" data-testid="tab-my-bookings" className="gap-1">
                <CalendarDays className="w-3 h-3" />
                My Bookings
              </TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({receivedReviews.length})</TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments" className="gap-1">
                <Banknote className="w-3 h-3" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="referrals" data-testid="tab-referrals" className="gap-1">
                <Gift className="w-3 h-3" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications" className="gap-1">
                <Bell className="w-3 h-3" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Sub-toggles for Profile Section Navigation */}
            {activeTab === "profile" && (
              <div className="mb-6 bg-card p-1 border border-border rounded-lg flex gap-1 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(personalInfoRef)}
                  className="text-xs md:text-sm"
                  data-testid="button-nav-personal-info"
                >
                  Personal Information
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(accountInfoRef)}
                  className="text-xs md:text-sm"
                  data-testid="button-nav-account-info"
                >
                  Account Information
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection(addressesRef)}
                  className="text-xs md:text-sm"
                  data-testid="button-nav-addresses"
                >
                  Addresses
                </Button>
              </div>
            )}

            <TabsContent value="profile" data-testid="panel-profile" className="space-y-6">
              {/* Profile Header Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl">Your Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center text-center mb-8 pb-8 border-b">
                    <div className="relative group mb-4">
                      <img
                        src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                        alt={`${user?.firstName} ${user?.lastName}`}
                        className="w-24 h-24 rounded-full ring-4 ring-slate-100"
                        data-testid="img-profile-avatar"
                      />
                      <button
                        onClick={() => scrollToSection(personalInfoRef)}
                        className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 md:opacity-0 flex items-center justify-center transition-opacity cursor-pointer"
                        data-testid="button-edit-profile-picture"
                        aria-label="Edit profile picture"
                      >
                        <Pencil className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-2 group">
                      <h3 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h3>
                      {user?.isVerified && (
                        <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                      )}
                      <button
                        onClick={() => scrollToSection(personalInfoRef)}
                        className="opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 md:opacity-0 transition-opacity cursor-pointer p-1 hover:bg-accent rounded"
                        data-testid="button-edit-name"
                        aria-label="Edit name"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 group">
                      <p className="text-muted-foreground">{user?.email}</p>
                      <button
                        onClick={() => scrollToSection(accountInfoRef)}
                        className="opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 md:opacity-0 transition-opacity cursor-pointer p-1 hover:bg-accent rounded"
                        data-testid="button-edit-email"
                        aria-label="Edit email"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center mt-4">
                      {user?.isVerified && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                      {user?.marketingPackage && (
                        <Badge variant="outline" className="capitalize">
                          {user.marketingPackage} Plan
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Card */}
              <Card ref={personalInfoRef}>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Profile Picture Upload Section */}
                    <div>
                      <Label>Profile Picture</Label>
                      <div className="flex flex-col items-center gap-4 mt-3">
                        <Avatar className="w-20 h-20 ring-4 ring-slate-100">
                          <AvatarImage
                            src={user?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                            alt={`${user?.firstName} ${user?.lastName}`}
                          />
                          <AvatarFallback>
                            <UserIcon className="w-10 h-10 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex gap-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="input-profile-picture"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-change-photo"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Change Photo
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Square image, at least 400x400 pixels
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        data-testid="input-email"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Changing your email may require re-verification.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter your first name"
                        data-testid="input-firstName"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter your last name"
                        data-testid="input-lastName"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phoneNumber">Phone Number</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+41 44 123 4567"
                        className={phoneNumber && !validateSwissPhoneNumber(phoneNumber) ? "border-red-500" : ""}
                        data-testid="input-phoneNumber"
                      />
                      {phoneNumber && !validateSwissPhoneNumber(phoneNumber) && (
                        <p className="text-sm text-red-500 mt-1">
                          Phone number must start with +41 (e.g., +41 44 123 4567)
                        </p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Account Information Card */}
              <Card ref={accountInfoRef}>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Manage your email and password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={user.email || ""}
                        disabled
                        className="bg-muted"
                        data-testid="input-email-readonly"
                      />
                      {user.emailVerified ? (
                        <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                    {!user.emailVerified && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendVerificationMutation.mutate()}
                          disabled={resendVerificationMutation.isPending}
                          className="gap-2"
                          data-testid="button-resend-verification"
                        >
                          <Mail className="w-4 h-4" />
                          {resendVerificationMutation.isPending ? "Sending..." : "Resend verification email"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Password</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="password"
                        value="••••••••"
                        disabled
                        className="bg-muted"
                        data-testid="input-password-readonly"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setShowChangePasswordDialog(true)}
                        className="gap-2"
                        data-testid="button-change-password"
                      >
                        <Key className="w-4 h-4" />
                        Change Password
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Addresses Card */}
              <Card ref={addressesRef}>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                  <CardDescription>Manage your saved addresses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {addresses.length === 0 && !showAddressForm && (
                      <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No addresses saved yet</p>
                      </div>
                    )}

                    {[...addresses].sort((a, b) => {
                      if (a.isPrimary && !b.isPrimary) return -1;
                      if (!a.isPrimary && b.isPrimary) return 1;
                      return 0;
                    }).map((address) => (
                      <div
                        key={address.id}
                        className="border rounded-lg p-4 space-y-2"
                        data-testid={`address-card-${address.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {address.label && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-semibold">{address.label}</span>
                                {address.isPrimary && (
                                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-sm">{address.street}</p>
                            <p className="text-sm">
                              {address.postalCode} {address.city}
                              {address.canton && `, ${address.canton}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!address.isPrimary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAddressMutation.mutate({ id: address.id, data: { isPrimary: true } })}
                                disabled={updateAddressMutation.isPending}
                                className="text-xs"
                              >
                                Set as Primary
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditAddress(address)}
                              data-testid={`button-edit-address-${address.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAddressToDelete(address.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-address-${address.id}`}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {editingAddress ? (
                      <form onSubmit={handleAddressSubmit} className="border rounded-lg p-4 space-y-4 bg-muted">
                        <div>
                          <Label htmlFor="label">Label</Label>
                          <Input
                            id="label"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            placeholder="e.g., Home, Office"
                            data-testid="input-address-label"
                          />
                        </div>
                        <div>
                          <AddressAutocomplete
                            label="Street Address"
                            required
                            initialValue={addressForm.street}
                            onAddressSelect={(address) => {
                              if (address) {
                                setAddressForm({
                                  ...addressForm,
                                  street: address.street,
                                  city: address.city,
                                  postalCode: address.postalCode,
                                  canton: address.canton,
                                });
                                setIsAddressValidated(true);
                              } else {
                                setIsAddressValidated(false);
                              }
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              placeholder="e.g., 8000"
                              data-testid="input-address-postalCode"
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="e.g., Zurich"
                              data-testid="input-address-city"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="canton">Canton</Label>
                          <Input
                            id="canton"
                            value={addressForm.canton}
                            onChange={(e) => setAddressForm({ ...addressForm, canton: e.target.value })}
                            placeholder="e.g., Zurich"
                            data-testid="input-address-canton"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id="isPrimary"
                            type="checkbox"
                            checked={addressForm.isPrimary}
                            onChange={(e) => setAddressForm({ ...addressForm, isPrimary: e.target.checked })}
                            className="w-4 h-4"
                            data-testid="checkbox-address-isPrimary"
                          />
                          <Label htmlFor="isPrimary">Set as primary address</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={!addressForm.street || !addressForm.city || updateAddressMutation.isPending}
                            data-testid="button-save-address"
                          >
                            {updateAddressMutation.isPending ? "Saving..." : "Save Address"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelAddressForm}
                            data-testid="button-cancel-address"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : showAddressForm ? (
                      <form onSubmit={handleAddressSubmit} className="border rounded-lg p-4 space-y-4 bg-muted">
                        <div>
                          <Label htmlFor="label">Label</Label>
                          <Input
                            id="label"
                            value={addressForm.label}
                            onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                            placeholder="e.g., Home, Office"
                            data-testid="input-address-label"
                          />
                        </div>
                        <div>
                          <AddressAutocomplete
                            label="Street Address"
                            required
                            onAddressSelect={(address) => {
                              if (address) {
                                setAddressForm({
                                  ...addressForm,
                                  street: address.street,
                                  city: address.city,
                                  postalCode: address.postalCode,
                                  canton: address.canton,
                                });
                                setIsAddressValidated(true);
                              } else {
                                setIsAddressValidated(false);
                              }
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input
                              id="postalCode"
                              value={addressForm.postalCode}
                              onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                              placeholder="e.g., 8000"
                              data-testid="input-address-postalCode"
                              disabled
                            />
                          </div>
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={addressForm.city}
                              onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                              placeholder="e.g., Zurich"
                              data-testid="input-address-city"
                              disabled
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="canton">Canton</Label>
                          <Input
                            id="canton"
                            value={addressForm.canton}
                            onChange={(e) => setAddressForm({ ...addressForm, canton: e.target.value })}
                            placeholder="e.g., Zurich"
                            data-testid="input-address-canton"
                            disabled
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            id="isPrimary"
                            type="checkbox"
                            checked={addressForm.isPrimary}
                            onChange={(e) => setAddressForm({ ...addressForm, isPrimary: e.target.checked })}
                            className="w-4 h-4"
                            data-testid="checkbox-address-isPrimary"
                          />
                          <Label htmlFor="isPrimary">Set as primary address</Label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={!isAddressValidated || createAddressMutation.isPending}
                            data-testid="button-save-address"
                          >
                            {createAddressMutation.isPending ? "Saving..." : "Save Address"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelAddressForm}
                            data-testid="button-cancel-address"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button
                        onClick={() => setShowAddressForm(true)}
                        className="w-full"
                        variant="outline"
                        data-testid="button-add-address"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Vendor Settings
                  </CardTitle>
                  <CardDescription>
                    Configure your payment and booking preferences for services you offer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Methods */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Accepted Payment Methods
                    </h4>

                    <div className="grid gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <Label htmlFor="accept-card" className="font-medium">Card Payments</Label>
                            <p className="text-sm text-muted-foreground">
                              Accept Visa, Mastercard, AMEX with full escrow protection
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="accept-card"
                          checked={user.acceptCardPayments ?? true}
                          onCheckedChange={(checked) => {
                            updateProfileMutation.mutate({ acceptCardPayments: checked });
                          }}
                          data-testid="switch-accept-card"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <Smartphone className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <Label htmlFor="accept-twint" className="font-medium">TWINT</Label>
                            <p className="text-sm text-muted-foreground">
                              Accept instant TWINT payments (popular in Switzerland)
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="accept-twint"
                          checked={user.acceptTwintPayments ?? true}
                          onCheckedChange={(checked) => {
                            updateProfileMutation.mutate({ acceptTwintPayments: checked });
                          }}
                          data-testid="switch-accept-twint"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Banknote className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <Label htmlFor="accept-cash" className="font-medium">Cash</Label>
                            <p className="text-sm text-muted-foreground">
                              Accept cash payments at service (no platform protection)
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="accept-cash"
                          checked={user.acceptCashPayments ?? true}
                          onCheckedChange={(checked) => {
                            updateProfileMutation.mutate({ acceptCashPayments: checked });
                          }}
                          data-testid="switch-accept-cash"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Booking Approval */}
                  <div className="pt-4 border-t space-y-4">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Booking Mode
                    </h4>

                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <Label htmlFor="require-approval" className="font-medium">Require Booking Approval</Label>
                          <p className="text-sm text-muted-foreground">
                            {user.requireBookingApproval
                              ? "You must manually approve each booking request"
                              : "Bookings are confirmed instantly when slots are available"
                            }
                          </p>
                        </div>
                      </div>
                      <Switch
                        id="require-approval"
                        checked={user.requireBookingApproval ?? false}
                        onCheckedChange={(checked) => {
                          updateProfileMutation.mutate({ requireBookingApproval: checked });
                        }}
                        data-testid="switch-require-approval"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      💡 Tip: If you maintain your calendar availability, instant booking provides a better customer experience.
                      Enable approval only if you need to review each request before accepting.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" data-testid="panel-my-services" className="space-y-6">
              {/* Fallback plan object when user.plan is null */}
              {(() => {
                const currentPlan = user.plan || {
                  name: "Free",
                  priceMonthly: "0.00",
                  maxImages: 2,
                  listingDurationDays: 7,
                  featuredListing: false,
                  prioritySupport: false,
                  analyticsAccess: false,
                  customBranding: false,
                  slug: "free"
                };

                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <BarChart3 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Total Views</p>
                            <h3 className="text-2xl font-bold">{totalViews.toLocaleString()}</h3>
                          </div>
                        </div>
                      </div>
                      <div className="bg-card p-6 rounded-xl border border-border shadow-sm" data-testid="card-current-plan">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full text-green-600">
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground font-medium">Active Plan</p>
                              <h3 className="text-2xl font-bold capitalize" data-testid="text-plan-name">
                                {currentPlan.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1" data-testid="text-plan-price">
                                CHF {currentPlan.priceMonthly}/month
                              </p>
                            </div>
                          </div>
                          {currentPlan.slug === 'enterprise' ? (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-600" data-testid="badge-current-plan">
                              Current Plan
                            </Badge>
                          ) : (
                            <Button asChild variant="default" data-testid="button-upgrade-plan">
                              <Link href="/plans">Upgrade Plan</Link>
                            </Button>
                          )}
                        </div>
                        <div className="pt-4 border-t space-y-2">
                          <div className="flex items-center gap-2 text-sm" data-testid="feature-max-images">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>{currentPlan.maxImages} images per listing</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm" data-testid="feature-listing-duration">
                            <Check className="w-4 h-4 text-green-600" />
                            <span>{currentPlan.listingDurationDays} day listing duration</span>
                          </div>
                          {currentPlan.featuredListing && (
                            <div className="flex items-center gap-2 text-sm" data-testid="feature-featured-listing">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Featured listings</span>
                            </div>
                          )}
                          {currentPlan.prioritySupport && (
                            <div className="flex items-center gap-2 text-sm" data-testid="feature-priority-support">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Priority support</span>
                            </div>
                          )}
                          {currentPlan.analyticsAccess && (
                            <div className="flex items-center gap-2 text-sm" data-testid="feature-analytics">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Analytics access</span>
                            </div>
                          )}
                          {currentPlan.customBranding && (
                            <div className="flex items-center gap-2 text-sm" data-testid="feature-custom-branding">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>Custom branding</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
                            <Settings className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Account Status</p>
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                              {user.isVerified ? "Verified" : "Not Verified"}
                              {user.isVerified && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">✓</Badge>
                              )}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <Tabs value={listingsSubTab} onValueChange={(v) => setListingsSubTab(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-6 mb-6">
                    <TabsTrigger value="all" className="relative text-xs sm:text-sm">
                      All
                      {allServices.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">{allServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="active" className="relative text-xs sm:text-sm">
                      Active
                      {activeServices.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">{activeServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="drafts" className="relative text-xs sm:text-sm">
                      Drafts
                      {draftServices.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">{draftServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="toRenew" className="relative text-xs sm:text-sm">
                      To Renew
                      {toRenewServices.length > 0 && (
                        <Badge variant="outline" className="ml-1 h-5 min-w-[20px] text-xs text-amber-600 border-amber-400">{toRenewServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="expired" className="relative text-xs sm:text-sm">
                      Expired
                      {expiredServices.length > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] text-xs">{expiredServices.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="archived" className="relative text-xs sm:text-sm">
                      Archived
                      {archivedServices.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs opacity-60">{archivedServices.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Active Listings Tab */}
                  <TabsContent value="active">
                    {servicesLoading ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading your services...</p>
                      </div>
                    ) : activeServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-6">
                        {activeServices.map(service => {
                          const expired = isExpired(service.expiresAt);
                          return (
                            <div key={service.id} className="flex flex-col md:flex-row gap-6 p-4 border rounded-lg hover:bg-accent transition-colors">
                              <div className="w-full md:w-48 aspect-video bg-muted rounded-md overflow-hidden shrink-0 relative">
                                <img src={service.images[0]} alt="" className={`w-full h-full object-cover ${expired ? 'grayscale opacity-70' : ''}`} />
                                {expired && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <Badge variant="destructive">Expired</Badge>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 py-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="font-bold text-lg">{service.title}</h3>
                                  <Badge variant={service.status === 'active' && !expired ? 'default' : 'secondary'}>
                                    {expired ? 'Expired' : service.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{service.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>Price: <strong>CHF {service.price}</strong>/{service.priceUnit}</span>
                                  <span className={`flex items-center gap-1 ${expired ? 'text-destructive font-medium' : ''}`}>
                                    <Clock className="w-3 h-3" />
                                    Expires: {new Date(service.expiresAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex md:flex-col gap-2 justify-center shrink-0">
                                {expired ? (
                                  <Button
                                    className="w-full"
                                    size="sm"
                                    onClick={() => handleRenew(service.id)}
                                    disabled={renewServiceMutation.isPending}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-2" />
                                    {renewServiceMutation.isPending ? "Renewing..." : "Renew"}
                                  </Button>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingService(service)}
                                      data-testid={`button-edit-service-${service.id}`}
                                    >
                                      Edit
                                    </Button>
                                    {service.status === 'active' ? (
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handlePause(service.id)}
                                        disabled={updateServiceMutation.isPending}
                                        data-testid={`button-pause-service-${service.id}`}
                                      >
                                        Pause
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleStatusChange(service.id, 'active')}
                                        disabled={updateServiceMutation.isPending}
                                      >
                                        Activate
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(service.id)}
                                  disabled={deleteServiceMutation.isPending}
                                  data-testid={`button-delete-service-${service.id}`}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">You haven't posted any services yet.</p>
                        <Button variant="link" className="mt-2" onClick={() => setShowCreateModal(true)}>Create your first post</Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* Drafts Tab */}
                  <TabsContent value="drafts">
                    {draftServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {draftServices.map(service => (
                          <div key={service.id} className="flex flex-col md:flex-row gap-4 p-4 border border-dashed rounded-lg hover:bg-accent/50 transition-colors">
                            <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0">
                              {service.images && service.images[0] ? (
                                <img src={service.images[0]} alt="" className="w-full h-full object-cover opacity-70" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Camera className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-medium">
                                  {service.title || <span className="text-muted-foreground italic">Untitled Draft</span>}
                                </h3>
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Draft
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                {service.description || 'No description yet'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last modified: {new Date(service.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-center shrink-0">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setEditingService(service)}
                                data-testid={`button-edit-draft-${service.id}`}
                              >
                                <Edit2 className="w-3 h-3 mr-2" />
                                Continue Editing
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(service.id)}
                                disabled={deleteServiceMutation.isPending}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No drafts saved.</p>
                        <p className="text-sm text-muted-foreground mt-1">Drafts will appear here when you save a service listing without publishing.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* All Listings Tab */}
                  <TabsContent value="all">
                    {servicesLoading ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading your services...</p>
                      </div>
                    ) : allServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {allServices.map(service => {
                          const expired = isExpired(service.expiresAt);
                          const isDraft = service.status === 'draft';
                          return (
                            <div key={service.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:bg-accent transition-colors">
                              <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0 relative">
                                {service.images && service.images[0] ? (
                                  <img src={service.images[0]} alt="" className={`w-full h-full object-cover ${expired || isDraft ? 'opacity-70' : ''}`} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <Camera className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 py-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h3 className="font-medium">{service.title || <span className="text-muted-foreground italic">Untitled</span>}</h3>
                                  <div className="flex gap-1">
                                    {isDraft && <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Draft</Badge>}
                                    {!isDraft && expired && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                                    {!isDraft && !expired && <Badge variant="default" className="text-xs">Active</Badge>}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">{service.description || 'No description'}</p>
                              </div>
                              <div className="flex md:flex-col gap-2 justify-center shrink-0">
                                <Button variant="outline" size="sm" onClick={() => setEditingService(service)}>Edit</Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No listings yet.</p>
                        <Button variant="link" className="mt-2" onClick={() => setShowCreateModal(true)}>Create your first listing</Button>
                      </div>
                    )}
                  </TabsContent>

                  {/* To Renew Tab */}
                  <TabsContent value="toRenew">
                    {toRenewServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {toRenewServices.map(service => (
                          <div key={service.id} className="flex flex-col md:flex-row gap-4 p-4 border border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 rounded-lg">
                            <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0 relative">
                              <img src={service.images?.[0]} alt="" className="w-full h-full object-cover grayscale opacity-70" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Clock className="w-6 h-6 text-amber-500" />
                              </div>
                            </div>
                            <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium">{service.title}</h3>
                                <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">Needs Renewal</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{service.description}</p>
                              <p className="text-xs text-amber-600">Expired: {new Date(service.expiresAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-center shrink-0">
                              <Button size="sm" onClick={() => handleRenew(service.id)} disabled={renewServiceMutation.isPending}>
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Renew
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingService(service)}>Edit</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">No listings to renew.</p>
                        <p className="text-sm text-muted-foreground mt-1">Listings that expire will appear here for up to 10 days.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Expired Tab */}
                  <TabsContent value="expired">
                    {expiredServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {expiredServices.map(service => (
                          <div key={service.id} className="flex flex-col md:flex-row gap-4 p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
                            <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0 relative">
                              <img src={service.images?.[0]} alt="" className="w-full h-full object-cover grayscale opacity-50" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Badge variant="destructive">Expired</Badge>
                              </div>
                            </div>
                            <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-muted-foreground">{service.title}</h3>
                                <Badge variant="destructive" className="text-xs">Expired 10+ days</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{service.description}</p>
                              <p className="text-xs text-destructive">Expired: {new Date(service.expiresAt).toLocaleDateString()}</p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-center shrink-0">
                              <Button size="sm" onClick={() => handleRenew(service.id)} disabled={renewServiceMutation.isPending}>
                                <RefreshCw className="w-3 h-3 mr-2" />
                                Reactivate
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(service.id, 'archived' as any)}>
                                Archive
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No expired listings.</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Archived Tab */}
                  <TabsContent value="archived">
                    {archivedServices.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {archivedServices.map(service => (
                          <div key={service.id} className="flex flex-col md:flex-row gap-4 p-4 border border-dashed rounded-lg opacity-60 hover:opacity-100 transition-opacity">
                            <div className="w-full md:w-32 aspect-video bg-muted rounded-md overflow-hidden shrink-0">
                              {service.images && service.images[0] ? (
                                <img src={service.images[0]} alt="" className="w-full h-full object-cover grayscale" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <Camera className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 py-1">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-muted-foreground">{service.title}</h3>
                                <Badge variant="secondary" className="text-xs opacity-60">Archived</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-1">{service.description}</p>
                            </div>
                            <div className="flex md:flex-col gap-2 justify-center shrink-0">
                              <Button variant="outline" size="sm" onClick={() => handleStatusChange(service.id, 'active')}>
                                Restore
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)} disabled={deleteServiceMutation.isPending}>
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No archived listings.</p>
                        <p className="text-sm text-muted-foreground mt-1">Expired listings are automatically archived after 10 days.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>

            <TabsContent value="reviews" data-testid="panel-reviews" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Reviews</h2>
                  <p className="text-muted-foreground">Manage service reviews and customer feedback</p>
                </div>
              </div>

              <Tabs value={reviewsSubTab} onValueChange={(v) => setReviewsSubTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="received" className="relative">
                    Reviews Received
                    {receivedReviews.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">{receivedReviews.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="given" className="relative">
                    Reviews Given
                    {givenReviews.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">{givenReviews.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="to-review" className="relative">
                    To Review
                    {(bookingsToReviewService.length + bookingsToReviewCustomer.length) > 0 && (
                      <Badge variant="default" className="ml-1 h-5 px-1.5 bg-amber-500">{bookingsToReviewService.length + bookingsToReviewCustomer.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="relative">
                    Pending Review
                    {bookingsPendingReview.length > 0 && (
                      <Badge variant="outline" className="ml-1 h-5 px-1.5">{bookingsPendingReview.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Reviews Received - Reviews on vendor's services from customers */}
                <TabsContent value="received" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reviews on Your Services</CardTitle>
                      <CardDescription>Customer reviews on services you provide (with detailed ratings)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {receivedReviews.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <p className="text-muted-foreground">No reviews yet. Keep providing excellent service!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {receivedReviews.map((review: any) => (
                            <div key={review.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={review.reviewer.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer.id}`}
                                    alt={review.reviewer.firstName}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium">{review.reviewer.firstName} {review.reviewer.lastName}</p>
                                    <p className="text-xs text-muted-foreground">On: {review.service.title}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <div className="flex items-center gap-1">
                                    {Array(review.rating).fill(0).map((_, i) => (
                                      <span key={i} className="text-yellow-400">★</span>
                                    ))}
                                    {Array(5 - review.rating).fill(0).map((_, i) => (
                                      <span key={`empty-${i}`} className="text-gray-300">★</span>
                                    ))}
                                    <span className="ml-1 font-bold">{review.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Multi-criteria breakdown */}
                              {(review.qualityRating || review.communicationRating || review.punctualityRating || review.valueRating) && (
                                <div className="mb-3 p-2 bg-muted rounded-lg text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    {review.qualityRating && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" />
                                        <span className="text-muted-foreground">Quality:</span>
                                        <span className="font-medium">{review.qualityRating}/5</span>
                                      </div>
                                    )}
                                    {review.communicationRating && (
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3 text-blue-500" />
                                        <span className="text-muted-foreground">Communication:</span>
                                        <span className="font-medium">{review.communicationRating}/5</span>
                                      </div>
                                    )}
                                    {review.punctualityRating && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-purple-500" />
                                        <span className="text-muted-foreground">Punctuality:</span>
                                        <span className="font-medium">{review.punctualityRating}/5</span>
                                      </div>
                                    )}
                                    {review.valueRating && (
                                      <div className="flex items-center gap-1">
                                        <DollarSign className="w-3 h-3 text-green-600" />
                                        <span className="text-muted-foreground">Value:</span>
                                        <span className="font-medium">{review.valueRating}/5</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              <p className="text-sm mb-3">{review.comment}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                {review.editCount > 0 && <span>Edited {review.editCount}x</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Reviews Given - Reviews the user has posted */}
                <TabsContent value="given" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reviews You've Posted</CardTitle>
                      <CardDescription>Reviews you've left on services (editable once)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {givenReviews.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <p className="text-muted-foreground">You haven't written any reviews yet.</p>
                          <p className="text-sm text-muted-foreground mt-1">Complete a booking and share your experience!</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {givenReviews.map((review: any) => (
                            <div key={review.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={review.vendor?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.vendor?.id}`}
                                    alt={review.vendor?.firstName}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium">{review.service.title}</p>
                                    <p className="text-xs text-muted-foreground">By: {review.vendor?.firstName} {review.vendor?.lastName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array(review.rating).fill(0).map((_, i) => (
                                    <span key={i} className="text-yellow-400">★</span>
                                  ))}
                                  {Array(5 - review.rating).fill(0).map((_, i) => (
                                    <span key={`empty-${i}`} className="text-gray-300">★</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm mb-3">{review.comment}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                  {review.editCount > 0 ? (
                                    <span className="text-amber-600">Edited (no more edits allowed)</span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        setEditingReview(review);
                                        setEditReviewText(review.comment);
                                        setEditReviewRating(review.rating);
                                        setShowEditReviewModal(true);
                                      }}
                                    >
                                      <Pencil className="w-3 h-3 mr-1" />
                                      Edit
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Customer reviews given by vendor */}
                  {customerReviewsGiven.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-lg">Customer Reviews You've Given</CardTitle>
                        <CardDescription>Your feedback on customers who booked your services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {customerReviewsGiven.map((review: any) => (
                            <div key={review.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={review.customer.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.customer.id}`}
                                    alt={review.customer.firstName}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium">{review.customer.firstName} {review.customer.lastName}</p>
                                    <p className="text-xs text-muted-foreground">For: {review.service?.title} • #{review.booking.bookingNumber}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array(review.rating).fill(0).map((_, i) => (
                                    <span key={i} className="text-yellow-400">★</span>
                                  ))}
                                  {Array(5 - review.rating).fill(0).map((_, i) => (
                                    <span key={`empty-${i}`} className="text-gray-300">★</span>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm mb-3">{review.comment}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                {review.editCount > 0 ? (
                                  <span className="text-amber-600">Edited (no more edits allowed)</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setEditingReview({ ...review, type: 'customer' });
                                      setEditReviewText(review.comment);
                                      setEditReviewRating(review.rating);
                                      setShowEditReviewModal(true);
                                    }}
                                  >
                                    <Pencil className="w-3 h-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* To Review - Completed bookings awaiting review */}
                <TabsContent value="to-review" className="mt-6 space-y-4">
                  {/* Services to review (as customer) */}
                  {bookingsToReviewService.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Services to Review</CardTitle>
                        <CardDescription>Leave a review for services you've used</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {bookingsToReviewService.map((booking: any) => (
                            <div key={booking.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={booking.vendor.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.vendor.id}`}
                                    alt={booking.vendor.firstName}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium">{booking.service?.title}</p>
                                    <p className="text-xs text-muted-foreground">By: {booking.vendor.firstName} {booking.vendor.lastName}</p>
                                    <p className="text-xs text-muted-foreground">Completed: {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setReviewBackTarget({
                                      type: 'service',
                                      bookingId: booking.id,
                                      serviceId: booking.service?.id,
                                      serviceName: booking.service?.title,
                                      userName: `${booking.vendor.firstName} ${booking.vendor.lastName}`,
                                    });
                                    setShowReviewBackModal(true);
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Customers to review (as vendor) */}
                  {bookingsToReviewCustomer.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Customers to Review</CardTitle>
                        <CardDescription>Rate customers who booked your services</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {bookingsToReviewCustomer.map((booking: any) => (
                            <div key={booking.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={booking.customer.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.customer.id}`}
                                    alt={booking.customer.firstName}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
                                    <p className="text-xs text-muted-foreground">Service: {booking.service?.title}</p>
                                    <p className="text-xs text-muted-foreground">Completed: {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setReviewBackTarget({
                                      type: 'customer',
                                      bookingId: booking.id,
                                      customerId: booking.customer.id,
                                      userName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                                      serviceName: booking.service?.title,
                                    });
                                    setShowReviewBackModal(true);
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {bookingsToReviewService.length === 0 && bookingsToReviewCustomer.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p className="text-muted-foreground">All caught up! No pending reviews.</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Pending Review - Bookings awaiting customer review */}
                <TabsContent value="pending" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Awaiting Customer Reviews</CardTitle>
                      <CardDescription>
                        Completed bookings where the customer hasn't left a review yet.
                        You can request a review up to 2 times with a 3-day cooldown.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {bookingsPendingReview.length === 0 ? (
                        <div className="text-center py-12">
                          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                          <p className="text-muted-foreground">No bookings pending customer review.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {bookingsPendingReview.map((booking: any) => {
                            const canRequest = (booking.vendorReviewRequestCount || 0) < 2 &&
                              (!booking.vendorLastReviewRequestAt ||
                                new Date().getTime() - new Date(booking.vendorLastReviewRequestAt).getTime() > 3 * 24 * 60 * 60 * 1000);
                            const requestCount = booking.vendorReviewRequestCount || 0;

                            return (
                              <div key={booking.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={booking.customer.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.customer.id}`}
                                      alt={booking.customer.firstName}
                                      className="w-10 h-10 rounded-full"
                                    />
                                    <div>
                                      <p className="font-medium">{booking.customer.firstName} {booking.customer.lastName}</p>
                                      <p className="text-xs text-muted-foreground">Service: {booking.service?.title}</p>
                                      <p className="text-xs text-muted-foreground">Completed: {booking.completedAt ? new Date(booking.completedAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                                      <Clock className="w-3 h-3 mr-1" />
                                      Awaiting review
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">
                                        Requests: {requestCount}/2
                                      </span>
                                      <Button
                                        size="sm"
                                        variant={canRequest ? "default" : "outline"}
                                        disabled={!canRequest || requestReviewMutation?.isPending}
                                        onClick={() => requestReviewMutation?.mutate(booking.id)}
                                        className="gap-1"
                                      >
                                        <Mail className="w-3 h-3" />
                                        {canRequest ? "Request Review" :
                                          requestCount >= 2 ? "Max requests sent" : "Cooldown active"}
                                      </Button>
                                    </div>
                                    {booking.vendorLastReviewRequestAt && (
                                      <span className="text-xs text-muted-foreground">
                                        Last requested: {new Date(booking.vendorLastReviewRequestAt).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Bookings Tab - Shows unified booking management */}
            <TabsContent value="bookings" data-testid="panel-bookings" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">My Bookings</h2>
                  <p className="text-muted-foreground">Comprehensive booking management for customers and vendors</p>
                </div>
              </div>

              {/* Main unified bookings card */}
              <Card className="border-primary/30 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20">
                <CardContent className="py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Unified Booking Calendar</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    View all your bookings in one place - both services you've booked as a customer and bookings from your customers. Filter by role, service, status, and more.
                  </p>
                  <Link href="/my-bookings">
                    <Button size="lg" className="gap-2">
                      <CalendarDays className="w-5 h-5" />
                      Open My Bookings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Quick access cards */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Customer Bookings Card */}
                <Card className="border-dashed border-blue-300 dark:border-blue-700">
                  <CardContent className="py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-3">
                      <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-semibold mb-1">Customer View</h3>
                    <p className="text-muted-foreground mb-3 text-sm">
                      Services you've booked
                    </p>
                    <Link href="/bookings">
                      <Button variant="outline" size="sm" className="gap-2">
                        View As Customer
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Vendor Bookings Card - Only shown if user has services */}
                {myServices.length > 0 ? (
                  <Card className="border-dashed border-green-300 dark:border-green-700">
                    <CardContent className="py-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
                        <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold mb-1">Vendor Dashboard</h3>
                      <p className="text-muted-foreground mb-3 text-sm">
                        Manage customer bookings & calendar
                      </p>
                      <Link href="/vendor/bookings">
                        <Button variant="outline" size="sm" className="gap-2">
                          Vendor Dashboard
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                        <Settings className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-1 text-muted-foreground">Vendor Dashboard</h3>
                      <p className="text-muted-foreground mb-3 text-sm">
                        Create services to unlock vendor features
                      </p>
                      <Button variant="outline" size="sm" disabled className="gap-2">
                        No Services Yet
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" data-testid="panel-payments" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Banknote className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Payments & Finances</h2>
                  <p className="text-muted-foreground">Track your earnings, spending, and payment settings</p>
                </div>
              </div>

              <Tabs value={paymentsSubTab} onValueChange={(v) => setPaymentsSubTab(v as any)} className="w-full">
                <TabsList className="mb-6 bg-card p-1 border border-border w-auto inline-flex flex-wrap">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="escrow">Escrow Transactions</TabsTrigger>
                  <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                </TabsList>

                {/* Overview Subtab */}
                <TabsContent value="overview" className="space-y-6 mt-0">
                  {/* Financial Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-l-4 border-l-green-500">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Earned</p>
                            <p className="text-2xl font-bold text-green-600">
                              CHF {financialStats.earned.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">From {financialStats.bookings} completed bookings</p>
                          </div>
                          <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Spent</p>
                            <p className="text-2xl font-bold text-blue-600">
                              CHF {financialStats.spent.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">On {financialStats.services} services</p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-blue-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Platform Fees</p>
                            <p className="text-2xl font-bold text-amber-600">
                              CHF {financialStats.fees.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">8% commission + processing</p>
                          </div>
                          <DollarSign className="w-8 h-8 text-amber-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Income by Payment Method */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Income by Payment Method
                      </CardTitle>
                      <CardDescription>
                        Breakdown of your earnings by payment type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            <span>Card Payments</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">CHF {(financialStats.earned * 0.60).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">~60% of income</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-purple-600" />
                            <span>TWINT</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">CHF {(financialStats.earned * 0.25).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">~25% of income</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Banknote className="w-5 h-5 text-green-600" />
                            <span>Cash</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">CHF {(financialStats.earned * 0.15).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">~15% of income</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 text-center italic">
                        Note: These are estimated values based on completed reviews. Full transaction history coming soon.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Payment History Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Payment History
                      </CardTitle>
                      <CardDescription>
                        Complete history of all your transactions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={paymentHistoryTab} onValueChange={(v) => setPaymentHistoryTab(v as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                          <TabsTrigger value="purchases" className="text-xs sm:text-sm">Purchases</TabsTrigger>
                          <TabsTrigger value="sales" className="text-xs sm:text-sm">Sales</TabsTrigger>
                          <TabsTrigger value="commission" className="text-xs sm:text-sm">Commission</TabsTrigger>
                          <TabsTrigger value="promotional" className="text-xs sm:text-sm">Promotional</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="mt-0">
                          {transactions.length > 0 ? (
                            <TransactionList transactions={transactions} userId={user?.id} />
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No transactions yet</p>
                              <p className="text-sm mt-1">Your complete payment history will appear here</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="purchases" className="mt-0">
                          {transactions.filter(t => t.customerId === user?.id).length > 0 ? (
                            <TransactionList transactions={transactions.filter(t => t.customerId === user?.id)} userId={user?.id} />
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No purchases yet</p>
                              <p className="text-sm mt-1">Services you've paid for will appear here</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="sales" className="mt-0">
                          {transactions.filter(t => t.vendorId === user?.id).length > 0 ? (
                            <TransactionList transactions={transactions.filter(t => t.vendorId === user?.id)} userId={user?.id} />
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No sales yet</p>
                              <p className="text-sm mt-1">Payments received from customers will appear here</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="commission" className="mt-0">
                          <div className="text-center py-8 text-muted-foreground">
                            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No commission charges yet</p>
                            <p className="text-sm mt-1">Platform commission fees will appear here</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="promotional" className="mt-0">
                          <div className="text-center py-8 text-muted-foreground">
                            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No promotional packages</p>
                            <p className="text-sm mt-1">Featured listings and promotional package purchases will appear here</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Escrow Subtab */}
                <TabsContent value="escrow" className="mt-0">
                  <VendorEscrowDashboard />
                </TabsContent>

                {/* Methods Subtab */}
                <TabsContent value="methods" className="space-y-6 mt-0">
                  {/* Stripe Connect Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        Stripe Connect
                      </CardTitle>
                      <CardDescription>
                        Connect your Stripe account to receive card payments directly
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {connectStatusLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-muted-foreground">Loading account status...</span>
                        </div>
                      ) : connectStatus?.isOnboarded ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Account Connected</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={connectStatus.chargesEnabled ? "text-green-600" : "text-amber-600"}>
                                {connectStatus.chargesEnabled ? "✓" : "○"}
                              </span>
                              <span>Charges Enabled</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={connectStatus.payoutsEnabled ? "text-green-600" : "text-amber-600"}>
                                {connectStatus.payoutsEnabled ? "✓" : "○"}
                              </span>
                              <span>Payouts Enabled</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createConnectAccountMutation.mutate()}
                            disabled={createConnectAccountMutation.isPending}
                          >
                            {createConnectAccountMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "Manage Account in Stripe"
                            )}
                          </Button>
                        </div>
                      ) : connectStatus?.hasAccount ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-amber-600">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">Onboarding Incomplete</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Complete your Stripe Connect onboarding to start receiving payments.
                          </p>
                          <Button
                            onClick={() => createConnectAccountMutation.mutate()}
                            disabled={createConnectAccountMutation.isPending}
                          >
                            {createConnectAccountMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "Complete Onboarding"
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Set up Stripe Connect to receive card payments directly into your bank account.
                            This is required if you want to accept card payments for your services.
                          </p>
                          <Button
                            onClick={() => createConnectAccountMutation.mutate()}
                            disabled={createConnectAccountMutation.isPending}
                          >
                            {createConnectAccountMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Account...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Set Up Stripe Connect
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment Methods Accepted */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Accepted Payment Methods</CardTitle>
                      <CardDescription>
                        Choose which payment methods you accept for your services
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Card Payments</p>
                              <p className="text-xs text-muted-foreground">Visa, Mastercard, AMEX (via Stripe)</p>
                            </div>
                          </div>
                          <Switch
                            checked={user?.acceptCardPayments ?? true}
                            onCheckedChange={(checked) => {
                              updateProfileMutation.mutate({ acceptCardPayments: checked });
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <Smartphone className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">TWINT</p>
                              <p className="text-xs text-muted-foreground">Swiss mobile payment</p>
                            </div>
                          </div>
                          <Switch
                            checked={user?.acceptTwintPayments ?? true}
                            onCheckedChange={(checked) => {
                              updateProfileMutation.mutate({ acceptTwintPayments: checked });
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Banknote className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Cash</p>
                              <p className="text-xs text-muted-foreground">Pay on service completion</p>
                            </div>
                          </div>
                          <Switch
                            checked={user?.acceptCashPayments ?? true}
                            onCheckedChange={(checked) => {
                              updateProfileMutation.mutate({ acceptCashPayments: checked });
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TWINT Eligibility Info */}
                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                        <Smartphone className="w-5 h-5" />
                        About TWINT Payments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p className="text-muted-foreground">
                        TWINT is a trust-based payment option available to established vendors. To accept TWINT payments from customers, you need:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>At least 5 completed bookings</li>
                        <li>Account age of 30+ days</li>
                        <li>Average rating of 4.0+ stars</li>
                        <li>Low dispute rate (&lt;10%)</li>
                      </ul>
                      <p className="text-muted-foreground">
                        Customers must also complete at least one card payment with you before using TWINT for trust verification.
                      </p>
                      <p className="text-xs text-muted-foreground italic mt-2">
                        Note: TWINT payments are limited to bookings under CHF 200 for platform protection.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Account Billing (for vendors) */}
                  {user?.paymentMethodLast4 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Billing Card on File</CardTitle>
                        <CardDescription>
                          Used for platform fees on cash/TWINT transactions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3 p-3 border rounded-lg">
                          <CreditCard className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{user.paymentMethodBrand || "Card"} •••• {user.paymentMethodLast4}</p>
                            <p className="text-xs text-muted-foreground">Default payment method for fees</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" data-testid="panel-referrals" className="space-y-6">
              <ReferralDashboard />
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" data-testid="panel-notifications" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Notification Settings</h2>
                  <p className="text-muted-foreground">Manage how and when you receive notifications</p>
                </div>
              </div>
              <NotificationPreferences />
            </TabsContent>

          </Tabs>
        </div>
      </div>

      <CreateServiceModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            // Reset selected category when modal closes
            setSelectedCategoryId(null);
          }
        }}
        onSuggestCategory={() => setShowCategorySuggestionModal(true)}
        onCategoryCreated={setSelectedCategoryId}
        preselectedCategoryId={selectedCategoryId}
      />
      <EditServiceModal
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
      />
      <CategorySuggestionModal
        open={showCategorySuggestionModal}
        onOpenChange={setShowCategorySuggestionModal}
        onCategoryCreated={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setShowCategorySuggestionModal(false);
        }}
      />

      <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone and will permanently remove the service from your listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-service">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => serviceToDelete && deleteServiceMutation.mutate(serviceToDelete)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-service"
            >
              Delete Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!addressToDelete} onOpenChange={() => setAddressToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-address">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => addressToDelete && deleteAddressMutation.mutate(addressToDelete)}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-address"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!serviceToPause} onOpenChange={() => setServiceToPause(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Your service will be temporarily hidden from search results. You can reactivate it anytime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-pause-service">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => serviceToPause && handleStatusChange(serviceToPause, 'paused')}
              data-testid="button-confirm-pause-service"
            >
              Pause Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!serviceToActivate} onOpenChange={() => setServiceToActivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Service?</AlertDialogTitle>
            <AlertDialogDescription>
              Your service will be visible in search results and available for customers to book. Make sure all details are correct before activating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-activate-service">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => serviceToActivate && updateServiceMutation.mutate({ id: serviceToActivate, data: { status: 'active' } })}
              data-testid="button-confirm-activate-service"
            >
              Activate Service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Profile Picture Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          {imageToCrop && (
            <div className="space-y-6">
              <div className="relative h-96 bg-slate-900 rounded-lg overflow-hidden">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Zoom</Label>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => setZoom(value)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCropDialog(false);
                setImageToCrop(null);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
              }}
              data-testid="button-cancel-crop"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCropSave}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-crop"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Profile Picture"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                data-testid="input-current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                minLength={8}
                required
                data-testid="input-new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                minLength={8}
                required
                data-testid="input-confirm-password"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowChangePasswordDialog(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                data-testid="button-cancel-change-password"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                data-testid="button-submit-change-password"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Modal - handles both service reviews and customer reviews */}
      <Dialog open={showReviewBackModal} onOpenChange={(open) => {
        setShowReviewBackModal(open);
        if (!open) {
          setReviewBackTarget(null);
          setReviewBackRating(5);
          setReviewBackText("");
          setReviewBackBookingId(null);
        }
      }}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {reviewBackTarget?.type === 'customer'
                ? `Review Customer: ${reviewBackTarget?.userName}`
                : `Review Service: ${reviewBackTarget?.serviceName}`
              }
            </DialogTitle>
            <DialogDescription className="text-base">
              {reviewBackTarget?.type === 'customer'
                ? "Share your experience with this customer"
                : "Share your experience with this service"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Verification Check */}
            {user && !user.isVerified && (
              <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">
                <Lock className="w-4 h-4" />
                <span>Identity verification required to post reviews. <Link href="/profile?tab=profile" className="underline">Verify now</Link></span>
              </div>
            )}

            {/* Multi-criteria ratings for SERVICE reviews */}
            {reviewBackTarget?.type !== 'customer' && (
              <>
                {/* Quality Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Quality of Service
                  </Label>
                  <p className="text-xs text-muted-foreground">How well was the service performed?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setServiceRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= serviceRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{serviceRating}/5</span>
                  </div>
                </div>

                {/* Communication Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Communication
                  </Label>
                  <p className="text-xs text-muted-foreground">How responsive and clear was the vendor?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCommunicationRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= communicationRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{communicationRating}/5</span>
                  </div>
                </div>

                {/* Punctuality Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    Punctuality
                  </Label>
                  <p className="text-xs text-muted-foreground">Was the vendor on time?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setPunctualityRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= punctualityRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{punctualityRating}/5</span>
                  </div>
                </div>

                {/* Value Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Value for Price
                  </Label>
                  <p className="text-xs text-muted-foreground">Was it worth the price?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setValueRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= valueRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{valueRating}/5</span>
                  </div>
                </div>

                {/* Overall Score Display */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Rating</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avg = (serviceRating + communicationRating + punctualityRating + valueRating) / 4;
                          return (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                            />
                          );
                        })}
                      </div>
                      <span className="font-bold text-lg">
                        {((serviceRating + communicationRating + punctualityRating + valueRating) / 4).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Multi-criteria ratings for CUSTOMER reviews */}
            {reviewBackTarget?.type === 'customer' && (
              <>
                {/* Communication Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Communication
                  </Label>
                  <p className="text-xs text-muted-foreground">How well did the customer communicate?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCustomerCommunicationRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= customerCommunicationRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{customerCommunicationRating}/5</span>
                  </div>
                </div>

                {/* Punctuality Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    Punctuality
                  </Label>
                  <p className="text-xs text-muted-foreground">Was the customer available/on time?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCustomerPunctualityRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= customerPunctualityRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{customerPunctualityRating}/5</span>
                  </div>
                </div>

                {/* Respect Rating */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-green-500" />
                    Respect & Professionalism
                  </Label>
                  <p className="text-xs text-muted-foreground">Was the customer respectful and professional?</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setCustomerRespectRating(star)}
                        disabled={!user?.isVerified}
                        className="disabled:opacity-50"
                      >
                        <Star
                          className={`w-6 h-6 cursor-pointer transition-colors ${star <= customerRespectRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">{customerRespectRating}/5</span>
                  </div>
                </div>

                {/* Overall Score Display */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Rating</span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const avg = (customerCommunicationRating + customerPunctualityRating + customerRespectRating) / 3;
                          return (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${star <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                            />
                          );
                        })}
                      </div>
                      <span className="font-bold text-lg">
                        {((customerCommunicationRating + customerPunctualityRating + customerRespectRating) / 3).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Review Text with Templates */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Written Review</Label>

              {/* Review Templates - Adaptive based on overall rating */}
              {(() => {
                // Calculate overall rating for both types
                const overallRating = reviewBackTarget?.type === 'customer'
                  ? (customerCommunicationRating + customerPunctualityRating + customerRespectRating) / 3
                  : (serviceRating + communicationRating + punctualityRating + valueRating) / 4;

                // Define templates for service reviews
                const serviceTemplates = {
                  positive: [
                    "Excellent service! The quality exceeded my expectations and the work was completed perfectly.",
                    "Very professional and reliable. Communication was great and they delivered exactly what was promised.",
                    "Outstanding experience from start to finish. Punctual, skilled, and very fair pricing.",
                    "Highly recommend! The attention to detail and customer care were exceptional.",
                  ],
                  neutral: [
                    "Service was acceptable but there's room for improvement in some areas.",
                    "The work was completed as expected. Good communication but timing could be better.",
                    "Decent service overall. Quality was okay, though I had hoped for a bit more.",
                    "Average experience. Nothing particularly wrong but nothing exceptional either.",
                  ],
                  negative: [
                    "Unfortunately, the service did not meet my expectations. Quality issues need to be addressed.",
                    "Communication was lacking and the work wasn't completed on time as agreed.",
                    "Disappointed with the overall experience. The final result wasn't what was promised.",
                    "Service was below standard. Would suggest improvements in quality and reliability.",
                  ],
                };

                // Define templates for customer reviews
                const customerTemplates = {
                  positive: [
                    "Wonderful customer! Very polite, clear about their needs, and a pleasure to work with.",
                    "Great communication throughout. Punctual for all appointments and very respectful.",
                    "Highly professional customer. Everything went smoothly and payment was prompt.",
                    "Excellent to work with. Would happily provide service again in the future.",
                  ],
                  neutral: [
                    "Customer was okay to work with. Some communication delays but overall acceptable.",
                    "Average experience. The customer could be more responsive but the job got done.",
                    "Decent interaction. A few minor scheduling issues but nothing major.",
                    "Customer was satisfactory. Room for improvement in communication responsiveness.",
                  ],
                  negative: [
                    "Challenging customer interaction. Communication was difficult throughout the process.",
                    "Customer was often late or unresponsive, making it hard to complete the work efficiently.",
                    "Unfortunately, the experience was frustrating. Expectations were unclear and often changed.",
                    "Difficult to work with. Would recommend clearer communication and more punctuality.",
                  ],
                };

                const templates = reviewBackTarget?.type === 'customer' ? customerTemplates : serviceTemplates;
                const currentTemplates = overallRating >= 4
                  ? templates.positive
                  : overallRating >= 2.5
                    ? templates.neutral
                    : templates.negative;
                const templateType = overallRating >= 4 ? 'Positive' : overallRating >= 2.5 ? 'Neutral' : 'Critical';

                return (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${overallRating >= 4
                        ? 'bg-green-100 text-green-700'
                        : overallRating >= 2.5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {templateType} Templates
                      </span>
                      <span>Click to use or edit:</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReviewBackText(template)}
                          className="text-left text-sm p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <span className="line-clamp-2">{template}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <Textarea
                placeholder={reviewBackTarget?.type === 'customer'
                  ? "Share additional details about your experience with this customer..."
                  : "Share additional details about your experience with this service..."
                }
                value={reviewBackText}
                onChange={(e) => setReviewBackText(e.target.value)}
                disabled={!user?.isVerified}
                rows={5}
                className="min-h-[120px] text-base"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewBackModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reviewBackTarget && reviewBackText) {
                  if (reviewBackTarget.type === 'customer') {
                    const overallRating = Math.round((customerCommunicationRating + customerPunctualityRating + customerRespectRating) / 3);
                    createCustomerReviewMutation.mutate({
                      bookingId: reviewBackTarget.bookingId,
                      rating: overallRating,
                      comment: reviewBackText,
                      communicationRating: customerCommunicationRating,
                      punctualityRating: customerPunctualityRating,
                      respectRating: customerRespectRating,
                    });
                  } else {
                    const overallRating = Math.round((serviceRating + communicationRating + punctualityRating + valueRating) / 4);
                    createServiceReviewMutation.mutate({
                      serviceId: reviewBackTarget.serviceId!,
                      bookingId: reviewBackTarget.bookingId,
                      rating: overallRating,
                      comment: reviewBackText,
                      qualityRating: serviceRating,
                      communicationRating: communicationRating,
                      punctualityRating: punctualityRating,
                      valueRating: valueRating,
                    });
                  }
                }
              }}
              disabled={
                !user?.isVerified ||
                !reviewBackText ||
                createCustomerReviewMutation.isPending ||
                createServiceReviewMutation.isPending
              }
            >
              {(createCustomerReviewMutation.isPending || createServiceReviewMutation.isPending)
                ? "Posting..."
                : "Submit Review"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Modal */}
      <Dialog open={showEditReviewModal} onOpenChange={(open) => {
        setShowEditReviewModal(open);
        if (!open) {
          setEditingReview(null);
          setEditReviewText("");
          setEditReviewRating(5);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Your Review</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 text-amber-600 mt-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">You can only edit a review once. Make sure you're satisfied with your changes.</span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditReviewRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 cursor-pointer transition-colors ${star <= editReviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-2">
              <Label>Your Review</Label>
              <Textarea
                placeholder="Update your review..."
                value={editReviewText}
                onChange={(e) => setEditReviewText(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditReviewModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (editingReview && editReviewText) {
                  try {
                    const endpoint = editingReview.type === 'customer'
                      ? `/api/customer-reviews/${editingReview.id}`
                      : `/api/reviews/${editingReview.id}`;

                    const res = await fetchApi(endpoint, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        rating: editReviewRating,
                        comment: editReviewText,
                      }),
                    });

                    if (!res.ok) {
                      const error = await res.json();
                      throw new Error(error.message || 'Failed to update review');
                    }

                    toast({
                      title: "Review updated",
                      description: "Your review has been updated successfully.",
                    });

                    // Refresh reviews
                    queryClient.invalidateQueries({ queryKey: ["/api/users/me/reviews-given"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/users/me/customer-reviews-given"] });
                    setShowEditReviewModal(false);
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message || "Failed to update review",
                      variant: "destructive",
                    });
                  }
                }
              }}
              disabled={!editReviewText}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// ===========================================
// REFERRAL DASHBOARD COMPONENT (Embedded in Profile)
// ===========================================

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalDirectReferrals: number;
  activeDirectReferrals: number;
  totalNetworkSize: number;
  totalPointsEarned: number;
  currentPoints: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  referralRank: number | null;
}

interface MyReferrer {
  hasReferrer: boolean;
  referrer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    referralCode: string | null;
  } | null;
}

interface NetworkLevel {
  count: number;
  referrals: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
    status: string;
    referredByName?: string;
  }>;
}

interface MyNetwork {
  maxLevels: number;
  level1: NetworkLevel;
  level2: NetworkLevel;
  level3: NetworkLevel;
}

interface CommissionEvent {
  id: string;
  fromUserName: string;
  level: number;
  pointsEarned: number;
  commissionEarned: string;
  triggerType: string;
  status: string;
  createdAt: string;
}

function ReferralDashboard() {
  const { toast } = useToast();
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true });

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referral/my-stats"],
  });

  // Fetch who referred me
  const { data: myReferrer } = useQuery<MyReferrer>({
    queryKey: ["/api/referral/my-referrer"],
  });

  // Fetch network
  const { data: myNetwork } = useQuery<MyNetwork>({
    queryKey: ["/api/referral/my-network"],
  });

  // Fetch commissions
  const { data: commissions } = useQuery<CommissionEvent[]>({
    queryKey: ["/api/referral/my-commissions"],
  });

  const copyReferralLink = async () => {
    if (stats?.referralLink) {
      await navigator.clipboard.writeText(stats.referralLink);
      toast({ title: "Copied!", description: "Referral link copied" });
    }
  };

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on Commerzio! ${stats?.referralLink}`)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats?.referralLink || '')}`, '_blank');
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent("Join me on Commerzio!")}&url=${encodeURIComponent(stats?.referralLink || '')}`, '_blank');
  };

  if (statsLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading referral data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-4">
            <p className="text-blue-100 text-sm">Points</p>
            <p className="text-2xl font-bold">{stats?.currentPoints || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-4">
            <p className="text-green-100 text-sm">Referrals</p>
            <p className="text-2xl font-bold">{stats?.totalDirectReferrals || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-4">
            <p className="text-purple-100 text-sm">Earned</p>
            <p className="text-2xl font-bold">CHF {(stats?.totalCommissionEarned || 0).toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-4">
            <p className="text-orange-100 text-sm">Network</p>
            <p className="text-2xl font-bold">{stats?.totalNetworkSize || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Who Referred Me */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Who Referred You
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myReferrer?.hasReferrer && myReferrer.referrer ? (
            <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                {myReferrer.referrer.firstName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {myReferrer.referrer.firstName} {myReferrer.referrer.lastName}
                </p>
                <p className="text-sm text-green-600">Code: {myReferrer.referrer.referralCode}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">You joined independently</p>
          )}
        </CardContent>
      </Card>

      {/* Share Link */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={stats?.referralLink || ""} readOnly className="font-mono text-sm" />
            <Button variant="outline" onClick={copyReferralLink}><Copy className="h-4 w-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground">Code: <strong className="font-mono">{stats?.referralCode}</strong></p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={shareToWhatsApp} className="text-green-600">
              <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={shareToFacebook} className="text-blue-600">
              Facebook
            </Button>
            <Button variant="outline" size="sm" onClick={shareToTwitter} className="text-sky-500">
              X
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Network Tree */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Referral Network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {myNetwork ? (
            <>
              {/* Level 1 */}
              <Collapsible open={expandedLevels[1]} onOpenChange={(o) => setExpandedLevels(p => ({ ...p, 1: o }))}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100">
                  <div className="flex items-center gap-2">
                    {expandedLevels[1] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">Level 1 (Direct)</span>
                    <Badge variant="secondary">{myNetwork.level1.count}</Badge>
                  </div>
                  <span className="text-sm text-green-600">10%</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-1 pl-6">
                  {myNetwork.level1.referrals.length > 0 ? myNetwork.level1.referrals.map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2 bg-card rounded border text-sm">
                      <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-xs">{r.firstName?.charAt(0)}</div>
                      <span>{r.firstName} {r.lastName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">{r.status}</Badge>
                    </div>
                  )) : <p className="text-sm text-muted-foreground py-2">No direct referrals yet</p>}
                </CollapsibleContent>
              </Collapsible>

              {/* Level 2 */}
              {myNetwork.maxLevels >= 2 && (
                <Collapsible open={expandedLevels[2]} onOpenChange={(o) => setExpandedLevels(p => ({ ...p, 2: o }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100">
                    <div className="flex items-center gap-2">
                      {expandedLevels[2] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">Level 2 (Indirect)</span>
                      <Badge variant="secondary">{myNetwork.level2.count}</Badge>
                    </div>
                    <span className="text-sm text-blue-600">4%</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1 pl-6">
                    {myNetwork.level2.referrals.length > 0 ? myNetwork.level2.referrals.slice(0, 10).map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 bg-card rounded border text-sm">
                        <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center text-xs">{r.firstName?.charAt(0)}</div>
                        <span>{r.firstName} {r.lastName}</span>
                        <span className="text-xs text-muted-foreground ml-auto">via {r.referredByName}</span>
                      </div>
                    )) : <p className="text-sm text-muted-foreground py-2">No level 2 referrals yet</p>}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Level 3 */}
              {myNetwork.maxLevels >= 3 && myNetwork.level3.count > 0 && (
                <Collapsible open={expandedLevels[3]} onOpenChange={(o) => setExpandedLevels(p => ({ ...p, 3: o }))}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100">
                    <div className="flex items-center gap-2">
                      {expandedLevels[3] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">Level 3 (Extended)</span>
                      <Badge variant="secondary">{myNetwork.level3.count}</Badge>
                    </div>
                    <span className="text-sm text-purple-600">1%</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-1 pl-6">
                    {myNetwork.level3.referrals.slice(0, 5).map(r => (
                      <div key={r.id} className="flex items-center gap-2 p-2 bg-card rounded border text-sm">
                        <div className="h-6 w-6 rounded-full bg-purple-200 flex items-center justify-center text-xs">{r.firstName?.charAt(0)}</div>
                        <span>{r.firstName} {r.lastName}</span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-4">No network data</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Commissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {commissions && commissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.slice(0, 10).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{c.fromUserName}</TableCell>
                    <TableCell><Badge variant="outline">L{c.level}</Badge></TableCell>
                    <TableCell className="text-right font-medium text-green-600">CHF {parseFloat(c.commissionEarned).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No commissions yet</p>
          )}
        </CardContent>
      </Card>

      {/* Link to full referrals page */}
      <div className="text-center">
        <Link href="/referrals">
          <Button variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            View Full Referral Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TransactionList({ transactions, userId }: { transactions: any[], userId?: string }) {
  return (
    <div className="space-y-4">
      {transactions.map((t) => {
        const isPurchase = t.customerId === userId;
        const otherParty = isPurchase ? t.vendor : t.customer;
        const otherPartyName = otherParty ? (otherParty.businessName || `${otherParty.firstName} ${otherParty.lastName}`) : 'Unknown';

        return (
          <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-full ${isPurchase ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                {isPurchase ? <ShoppingBag className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium">{t.service?.title || 'Unknown Service'}</p>
                <p className="text-sm text-muted-foreground">
                  {isPurchase ? 'Purchased from ' : 'Sold to '} <span className="font-medium text-foreground">{otherPartyName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="bg-secondary px-1.5 py-0.5 rounded capitalize">{t.status}</span>
                  <span>•</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>#{t.orderNumber}</span>
                </div>
              </div>
            </div>
            <div className={`text-right ${isPurchase ? 'text-blue-600' : 'text-green-600'}`}>
              <p className="font-bold text-lg">
                {isPurchase ? '-' : '+'} CHF {parseFloat(t.total).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{t.paymentStatus}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
