import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Plus, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Eye, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send,
  User,
  Star,
  AlertCircle,
  Filter,
  X
} from "lucide-react";

// Swiss cantons list
const SWISS_CANTONS = [
  { value: "ZH", label: "Zürich" },
  { value: "BE", label: "Bern" },
  { value: "LU", label: "Luzern" },
  { value: "UR", label: "Uri" },
  { value: "SZ", label: "Schwyz" },
  { value: "OW", label: "Obwalden" },
  { value: "NW", label: "Nidwalden" },
  { value: "GL", label: "Glarus" },
  { value: "ZG", label: "Zug" },
  { value: "FR", label: "Fribourg" },
  { value: "SO", label: "Solothurn" },
  { value: "BS", label: "Basel-Stadt" },
  { value: "BL", label: "Basel-Landschaft" },
  { value: "SH", label: "Schaffhausen" },
  { value: "AR", label: "Appenzell Ausserrhoden" },
  { value: "AI", label: "Appenzell Innerrhoden" },
  { value: "SG", label: "St. Gallen" },
  { value: "GR", label: "Graubünden" },
  { value: "AG", label: "Aargau" },
  { value: "TG", label: "Thurgau" },
  { value: "TI", label: "Ticino" },
  { value: "VD", label: "Vaud" },
  { value: "VS", label: "Valais" },
  { value: "NE", label: "Neuchâtel" },
  { value: "GE", label: "Genève" },
  { value: "JU", label: "Jura" },
];

// Category type
interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

// Types
interface ServiceRequest {
  id: string;
  customerId: string;
  title: string;
  description: string;
  categoryId: string | null;
  subcategoryId: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  budgetFlexible: boolean;
  preferredDateStart: Date | null;
  preferredDateEnd: Date | null;
  flexibleDates: boolean;
  urgency: "normal" | "urgent" | "flexible" | null;
  locationCity: string | null;
  locationCanton: string | null;
  locationPostalCode: string | null;
  locationRadiusKm: number | null;
  serviceAtCustomerLocation: boolean;
  attachmentUrls: string[];
  status: "draft" | "open" | "in_progress" | "completed" | "cancelled" | "expired";
  moderationStatus: string | null;
  publishedAt: Date | null;
  expiresAt: Date | null;
  viewCount: number;
  proposalCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Proposal {
  id: string;
  serviceRequestId: string;
  vendorId: string;
  serviceId: string | null;
  price: string;
  priceBreakdown: any;
  paymentMethod: "card" | "twint" | "cash";
  paymentTiming: "upfront" | "on_completion";
  coverLetter: string;
  estimatedDuration: string | null;
  proposedDate: Date | null;
  proposedDateEnd: Date | null;
  attachmentUrls: string[];
  status: "pending" | "viewed" | "accepted" | "rejected" | "withdrawn" | "expired";
  expiresAt: Date;
  viewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  vendor?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    averageRating: string | null;
  };
  request?: ServiceRequest;
}

export default function ServiceRequestsPage() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("browse");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  
  // Filter state for browse tab
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterCanton, setFilterCanton] = useState<string>("all");
  
  // Fetch categories for filter
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });
  
  // Form state for creating request
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    budgetMin: "",
    budgetMax: "",
    budgetFlexible: false,
    locationCity: "",
    locationCanton: "",
    categoryId: "",
    urgency: "normal" as "normal" | "urgent" | "flexible",
    preferredDateStart: "",
    preferredDateEnd: "",
    flexibleDates: true,
  });
  
  // Form state for submitting proposal
  const [newProposal, setNewProposal] = useState({
    price: "",
    coverLetter: "",
    paymentMethod: "card" as "card" | "twint" | "cash",
    paymentTiming: "upfront" as "upfront" | "on_completion",
    estimatedDuration: "",
  });

  // Build query params for fetching requests
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (filterCategory && filterCategory !== "all") params.append("categoryId", filterCategory);
    if (filterCanton && filterCanton !== "all") params.append("canton", filterCanton);
    return params.toString();
  };

  // Fetch open requests (for vendors to browse) with filters
  const { data: openRequests, isLoading: loadingOpen } = useQuery<{ requests: ServiceRequest[]; total: number }>({
    queryKey: ["service-requests", "open", filterCategory, filterCanton],
    queryFn: () => {
      const queryString = buildQueryParams();
      return apiRequest(`/api/service-requests${queryString ? `?${queryString}` : ""}`);
    },
    enabled: isAuthenticated,
  });

  // Fetch user's own requests (as customer)
  const { data: myRequests, isLoading: loadingMine } = useQuery<ServiceRequest[]>({
    queryKey: ["service-requests", "mine"],
    queryFn: () => apiRequest("/api/service-requests/mine"),
    enabled: isAuthenticated,
  });

  // Handle URL parameters for deep linking to specific request (e.g., from proposal notifications)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('requestId');
    const showProposals = params.get('proposals') === 'true';
    
    if (requestId && myRequests) {
      // Auto-switch to my requests tab
      setActiveTab("my-requests");
      
      // Clean up URL
      window.history.replaceState({}, '', '/service-requests');
      
      // Find and select the request
      const request = myRequests.find(r => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
        if (showProposals) {
          setShowProposalsModal(true);
        }
      }
    }
  }, [myRequests]);

  // Fetch user's proposals (as vendor)
  const { data: myProposals, isLoading: loadingProposals } = useQuery<Proposal[]>({
    queryKey: ["proposals", "mine"],
    queryFn: () => apiRequest("/api/proposals/mine"),
    enabled: isAuthenticated,
  });

  // Fetch proposals for a specific request
  const { data: requestProposals, refetch: refetchProposals } = useQuery<Proposal[]>({
    queryKey: ["proposals", selectedRequest?.id],
    queryFn: () => apiRequest(`/api/service-requests/${selectedRequest?.id}/proposals`),
    enabled: !!selectedRequest && showProposalsModal,
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: (data: typeof newRequest) => 
      apiRequest("/api/service-requests", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: async (request: ServiceRequest) => {
      // Publish immediately
      try {
        await apiRequest(`/api/service-requests/${request.id}/publish`, { method: "POST" });
        toast({ title: "Request posted!", description: "Vendors can now see your request." });
      } catch (e) {
        toast({ title: "Request created as draft", description: "You can publish it later." });
      }
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setShowCreateModal(false);
      setNewRequest({
        title: "",
        description: "",
        budgetMin: "",
        budgetMax: "",
        budgetFlexible: false,
        locationCity: "",
        locationCanton: "",
        categoryId: "",
        urgency: "normal",
        preferredDateStart: "",
        preferredDateEnd: "",
        flexibleDates: true,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create request", variant: "destructive" });
    },
  });

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: (data: { requestId: string } & typeof newProposal) =>
      apiRequest(`/api/service-requests/${data.requestId}/proposals`, {
        method: "POST",
        body: JSON.stringify({
          price: parseFloat(data.price),
          coverLetter: data.coverLetter,
          paymentMethod: data.paymentMethod,
          paymentTiming: data.paymentTiming,
          estimatedDuration: data.estimatedDuration || undefined,
        }),
      }),
    onSuccess: () => {
      toast({ title: "Proposal submitted!", description: "The customer will review your proposal." });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      setShowProposalModal(false);
      setSelectedRequest(null);
      setNewProposal({
        price: "",
        coverLetter: "",
        paymentMethod: "card",
        paymentTiming: "upfront",
        estimatedDuration: "",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to submit proposal", variant: "destructive" });
    },
  });

  // Accept proposal mutation
  const acceptProposalMutation = useMutation({
    mutationFn: (proposalId: string) =>
      apiRequest(`/api/proposals/${proposalId}/accept`, { method: "POST" }),
    onSuccess: () => {
      toast({ title: "Proposal accepted!", description: "A booking has been created." });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setShowProposalsModal(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to accept proposal", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      draft: "secondary",
      in_progress: "default",
      completed: "default",
      expired: "destructive",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      open: "Open",
      draft: "Draft",
      in_progress: "In Progress",
      completed: "Completed",
      expired: "Expired",
      cancelled: "Cancelled",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getProposalStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      viewed: "default",
      accepted: "default",
      rejected: "destructive",
      withdrawn: "outline",
      expired: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      viewed: "Viewed",
      accepted: "Accepted",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
      expired: "Expired",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Request a Service</h1>
          <p className="text-muted-foreground mb-6">Please log in to browse or create service requests.</p>
          <Button onClick={() => window.location.href = "/login"}>Log In</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Service Requests</h1>
            <p className="text-muted-foreground">Post what you need or browse open requests</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Request a Service
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">
              Browse Requests
              {openRequests?.total ? <Badge variant="secondary" className="ml-2">{openRequests.total}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="my-requests">
              My Requests
              {myRequests?.length ? <Badge variant="secondary" className="ml-2">{myRequests.length}</Badge> : null}
            </TabsTrigger>
            <TabsTrigger value="my-proposals">
              My Proposals
              {myProposals?.length ? <Badge variant="secondary" className="ml-2">{myProposals.length}</Badge> : null}
            </TabsTrigger>
          </TabsList>

          {/* Browse Requests Tab (For Vendors) */}
          <TabsContent value="browse" className="space-y-4">
            {/* Filters Section */}
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filters:</span>
                  </div>
                  
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterCanton} onValueChange={setFilterCanton}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Cantons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cantons</SelectItem>
                      {SWISS_CANTONS.map((canton) => (
                        <SelectItem key={canton.value} value={canton.value}>{canton.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {(filterCategory !== "all" || filterCanton !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterCategory("all");
                        setFilterCanton("all");
                      }}
                      className="gap-1"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </Button>
                  )}
                  
                  {openRequests && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {openRequests.total} request{openRequests.total !== 1 ? 's' : ''} found
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {loadingOpen ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : !openRequests?.requests?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No open requests</h3>
                  <p className="text-muted-foreground">
                    {filterCategory || filterCanton 
                      ? "No requests match your filters. Try broadening your search."
                      : "Check back later for new service requests from customers."}
                  </p>
                  {(filterCategory || filterCanton) && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => {
                        setFilterCategory("");
                        setFilterCanton("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {openRequests.requests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{request.title}</CardTitle>
                        {getStatusBadge(request.status)}
                      </div>
                      <CardDescription className="line-clamp-3">{request.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Show category badge if available */}
                      {request.categoryId && categories && (
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.id === request.categoryId)?.name || 'Unknown Category'}
                        </Badge>
                      )}
                      {(request.budgetMin || request.budgetMax) && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>
                            Budget: CHF {request.budgetMin || "?"} - {request.budgetMax || "?"}
                            {request.budgetFlexible && " (flexible)"}
                          </span>
                        </div>
                      )}
                      {request.locationCity && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{request.locationCity}, {request.locationCanton}</span>
                        </div>
                      )}
                      {request.preferredDateStart && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(request.preferredDateStart), "MMM d")}
                            {request.preferredDateEnd && ` - ${format(new Date(request.preferredDateEnd), "MMM d")}`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {request.viewCount} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {request.proposalCount} proposals
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Posted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full gap-2" 
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowProposalModal(true);
                        }}
                        disabled={request.customerId === user?.id}
                      >
                        <Send className="w-4 h-4" />
                        {request.customerId === user?.id ? "Your Request" : "Submit Proposal"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Requests Tab (For Customers) */}
          <TabsContent value="my-requests" className="space-y-4">
            {loadingMine ? (
              <div className="text-center py-8">Loading your requests...</div>
            ) : !myRequests?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No requests yet</h3>
                  <p className="text-muted-foreground mb-4">Post a service request and let vendors come to you.</p>
                  <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Request a Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{request.title}</CardTitle>
                          <CardDescription className="mt-1">{request.description}</CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm">
                        {(request.budgetMin || request.budgetMax) && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            CHF {request.budgetMin} - {request.budgetMax}
                          </div>
                        )}
                        {request.locationCity && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            {request.locationCity}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          {request.viewCount} views
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          {request.proposalCount} proposals
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="gap-2">
                      {request.proposalCount > 0 && request.status === "open" && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowProposalsModal(true);
                            refetchProposals();
                          }}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Proposals ({request.proposalCount})
                        </Button>
                      )}
                      {request.status === "draft" && (
                        <Button
                          onClick={() => 
                            apiRequest(`/api/service-requests/${request.id}/publish`, { method: "POST" })
                              .then(() => {
                                toast({ title: "Request published!" });
                                queryClient.invalidateQueries({ queryKey: ["service-requests"] });
                              })
                          }
                        >
                          Publish Request
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Proposals Tab (For Vendors) */}
          <TabsContent value="my-proposals" className="space-y-4">
            {loadingProposals ? (
              <div className="text-center py-8">Loading your proposals...</div>
            ) : !myProposals?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
                  <p className="text-muted-foreground">Browse open requests and submit proposals to win jobs.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myProposals.map((proposal) => (
                  <Card key={proposal.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{proposal.request?.title || "Service Request"}</CardTitle>
                          <CardDescription className="mt-1 line-clamp-2">
                            {proposal.request?.description}
                          </CardDescription>
                        </div>
                        {getProposalStatusBadge(proposal.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Your price: CHF {proposal.price}</span>
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        "{proposal.coverLetter}"
                      </div>
                      {proposal.expiresAt && proposal.status === "pending" && (
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <Clock className="w-4 h-4" />
                          Expires {formatDistanceToNow(new Date(proposal.expiresAt), { addSuffix: true })}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Request Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request a Service</DialogTitle>
            <DialogDescription>
              Describe what you need and let vendors come to you with quotes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">What do you need? *</Label>
              <Input
                id="title"
                placeholder="e.g., Deep cleaning for 3-bedroom apartment"
                value={newRequest.title}
                onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Describe your requirements *</Label>
              <Textarea
                id="description"
                placeholder="Provide details about the work needed, any specific requirements, access instructions, etc."
                rows={4}
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">Budget Min (CHF)</Label>
                <Input
                  id="budgetMin"
                  type="number"
                  placeholder="50"
                  value={newRequest.budgetMin}
                  onChange={(e) => setNewRequest({ ...newRequest, budgetMin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">Budget Max (CHF)</Label>
                <Input
                  id="budgetMax"
                  type="number"
                  placeholder="200"
                  value={newRequest.budgetMax}
                  onChange={(e) => setNewRequest({ ...newRequest, budgetMax: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Zürich"
                  value={newRequest.locationCity}
                  onChange={(e) => setNewRequest({ ...newRequest, locationCity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canton">Canton</Label>
                <Select
                  value={newRequest.locationCanton}
                  onValueChange={(value) => setNewRequest({ ...newRequest, locationCanton: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select canton" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ZH">Zürich</SelectItem>
                    <SelectItem value="BE">Bern</SelectItem>
                    <SelectItem value="GE">Geneva</SelectItem>
                    <SelectItem value="VD">Vaud</SelectItem>
                    <SelectItem value="BS">Basel-Stadt</SelectItem>
                    <SelectItem value="AG">Aargau</SelectItem>
                    <SelectItem value="SG">St. Gallen</SelectItem>
                    <SelectItem value="LU">Lucerne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select
                value={newRequest.urgency}
                onValueChange={(value: "normal" | "urgent" | "flexible") => 
                  setNewRequest({ ...newRequest, urgency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flexible">Flexible timing</SelectItem>
                  <SelectItem value="normal">Within 1-2 weeks</SelectItem>
                  <SelectItem value="urgent">Urgent (within days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createRequestMutation.mutate(newRequest)}
              disabled={!newRequest.title || !newRequest.description || createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "Posting..." : "Post Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submit Proposal Modal */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit a Proposal</DialogTitle>
            <DialogDescription>
              {selectedRequest?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Request Details</h4>
                <p className="text-sm">{selectedRequest.description}</p>
                {(selectedRequest.budgetMin || selectedRequest.budgetMax) && (
                  <p className="text-sm text-muted-foreground">
                    Budget: CHF {selectedRequest.budgetMin || "?"} - {selectedRequest.budgetMax || "?"}
                  </p>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="price">Your Price (CHF) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="150"
                value={newProposal.price}
                onChange={(e) => setNewProposal({ ...newProposal, price: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Your Message *</Label>
              <Textarea
                id="coverLetter"
                placeholder="Introduce yourself, explain your approach, and why you're the right person for this job..."
                rows={4}
                value={newProposal.coverLetter}
                onChange={(e) => setNewProposal({ ...newProposal, coverLetter: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={newProposal.paymentMethod}
                  onValueChange={(value: "card" | "twint" | "cash") => 
                    setNewProposal({ ...newProposal, paymentMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="twint">TWINT</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Timing</Label>
                <Select
                  value={newProposal.paymentTiming}
                  onValueChange={(value: "upfront" | "on_completion") => 
                    setNewProposal({ ...newProposal, paymentTiming: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upfront">Pay Upfront</SelectItem>
                    <SelectItem value="on_completion">Pay on Completion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                placeholder="e.g., 2-3 hours"
                value={newProposal.estimatedDuration}
                onChange={(e) => setNewProposal({ ...newProposal, estimatedDuration: e.target.value })}
              />
            </div>
            
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Your proposal will expire in 48 hours if the customer doesn't respond.</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProposalModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedRequest && submitProposalMutation.mutate({
                requestId: selectedRequest.id,
                ...newProposal,
              })}
              disabled={!newProposal.price || !newProposal.coverLetter || submitProposalMutation.isPending}
            >
              {submitProposalMutation.isPending ? "Submitting..." : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Proposals Modal (For Customer) */}
      <Dialog open={showProposalsModal} onOpenChange={setShowProposalsModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposals for "{selectedRequest?.title}"</DialogTitle>
            <DialogDescription>
              Review proposals from vendors and accept the best one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!requestProposals?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                No proposals yet. Check back soon!
              </div>
            ) : (
              requestProposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <img
                          src={proposal.vendor?.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${proposal.vendorId}`}
                          alt="Vendor"
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">
                            {proposal.vendor?.firstName} {proposal.vendor?.lastName}
                          </div>
                          {proposal.vendor?.averageRating && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {parseFloat(proposal.vendor.averageRating).toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                      {getProposalStatusBadge(proposal.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-xl font-bold">CHF {proposal.price}</span>
                      <Badge variant="outline">{proposal.paymentMethod}</Badge>
                      <Badge variant="outline">{proposal.paymentTiming === "upfront" ? "Pay upfront" : "Pay on completion"}</Badge>
                    </div>
                    <p className="text-sm">{proposal.coverLetter}</p>
                    {proposal.estimatedDuration && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {proposal.estimatedDuration}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2">
                    {proposal.status === "pending" || proposal.status === "viewed" ? (
                      <>
                        <Button 
                          className="gap-2"
                          onClick={() => acceptProposalMutation.mutate(proposal.id)}
                          disabled={acceptProposalMutation.isPending}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Accept Proposal
                        </Button>
                      </>
                    ) : proposal.status === "accepted" ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Accepted
                      </Badge>
                    ) : null}
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
