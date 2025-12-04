import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { DisputeCenter, DisputeCard } from "@/components/disputes";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { fetchApi } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Scale,
  ArrowLeft,
  Filter,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// API response type matching the updated getUserDisputes function
interface DisputeFromAPI {
  id: string;
  bookingId: string;
  bookingNumber: string;
  reason: string;
  description: string;
  status: "open" | "under_review" | "resolved_customer" | "resolved_vendor" | "resolved_split" | "closed";
  currentPhase: "phase_1" | "phase_2" | "phase_3_pending" | "phase_3_ai" | "phase_3_external" | "resolved";
  escrowAmount: string;
  createdAt: string;
  deadline: string | null;
  serviceName: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  isCustomer: boolean;
}

export default function DisputesPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch user's disputes
  const { data: disputes, isLoading, error } = useQuery<DisputeFromAPI[]>({
    queryKey: ["/api/disputes"],
    queryFn: async () => {
      const response = await fetchApi("/api/disputes");
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json();
    },
  });

  // Filter disputes by status
  const filteredDisputes = disputes?.filter(dispute => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return dispute.status === "open" || dispute.status === "under_review";
    if (statusFilter === "resolved") return dispute.status?.startsWith("resolved_") || dispute.status === "closed";
    return dispute.status === statusFilter;
  }) || [];

  // Separate active and resolved disputes
  const activeDisputes = filteredDisputes.filter(d => 
    d.status === "open" || d.status === "under_review"
  );
  const resolvedDisputes = filteredDisputes.filter(d => 
    d.status?.startsWith("resolved_") || d.status === "closed"
  );

  // If a dispute is selected, show the detail view
  if (selectedDisputeId && user) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setSelectedDisputeId(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Disputes
          </Button>
          
          <DisputeCenter 
            disputeId={selectedDisputeId}
            currentUserId={user.id}
            onBack={() => setSelectedDisputeId(null)}
            apiRequest={apiRequest}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dispute Center</h1>
            <p className="text-muted-foreground">
              Manage and resolve disputes for your bookings
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === "all" ? "All Disputes" : 
                 statusFilter === "active" ? "Active" : 
                 statusFilter === "resolved" ? "Resolved" : statusFilter}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Disputes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("resolved")}>
                Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Disputes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{disputes?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <span className="text-2xl font-bold">{activeDisputes.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{resolvedDisputes.length}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Escalated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">
                  {disputes?.filter(d => d.currentPhase === "phase_3_external").length ?? 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Failed to Load Disputes</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading your disputes. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && disputes?.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Scale className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-xl mb-2">No Disputes</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                You don't have any disputes yet. If you have an issue with a booking,
                you can open a dispute from the booking details page.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setLocation("/bookings")}
              >
                View Bookings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Disputes List */}
        {!isLoading && !error && disputes && disputes.length > 0 && (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active" className="gap-2">
                Active
                {activeDisputes.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeDisputes.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="resolved" className="gap-2">
                Resolved
                {resolvedDisputes.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {resolvedDisputes.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {activeDisputes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">All Clear!</h3>
                    <p className="text-muted-foreground">
                      You don't have any active disputes.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeDisputes.map(dispute => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={{
                      id: dispute.id,
                      bookingId: dispute.bookingId,
                      bookingNumber: dispute.bookingNumber,
                      reason: dispute.reason,
                      description: dispute.description,
                      status: dispute.status,
                      currentPhase: dispute.currentPhase,
                      escrowAmount: dispute.escrowAmount,
                      createdAt: dispute.createdAt,
                      deadline: dispute.deadline,
                    }}
                    otherParty={{
                      name: dispute.otherPartyName || "Unknown",
                      avatar: dispute.otherPartyAvatar,
                      role: dispute.isCustomer ? "vendor" : "customer",
                    }}
                    serviceName={dispute.serviceName}
                    onViewDetails={() => setSelectedDisputeId(dispute.id)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="resolved" className="space-y-4">
              {resolvedDisputes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold text-lg">No Resolved Disputes</h3>
                    <p className="text-muted-foreground">
                      Resolved disputes will appear here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                resolvedDisputes.map(dispute => (
                  <DisputeCard
                    key={dispute.id}
                    dispute={{
                      id: dispute.id,
                      bookingId: dispute.bookingId,
                      bookingNumber: dispute.bookingNumber,
                      reason: dispute.reason,
                      description: dispute.description,
                      status: dispute.status,
                      currentPhase: dispute.currentPhase,
                      escrowAmount: dispute.escrowAmount,
                      createdAt: dispute.createdAt,
                      deadline: dispute.deadline,
                    }}
                    otherParty={{
                      name: dispute.otherPartyName || "Unknown",
                      avatar: dispute.otherPartyAvatar,
                      role: dispute.isCustomer ? "vendor" : "customer",
                    }}
                    serviceName={dispute.serviceName}
                    onViewDetails={() => setSelectedDisputeId(dispute.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* How Disputes Work Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">How the Dispute Process Works</CardTitle>
            <CardDescription>
              Our 3-phase system ensures fair resolution for all parties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-semibold">Direct Negotiation</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  48 hours to negotiate directly with the other party. 
                  Make and accept counter-offers to reach an agreement.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-semibold">AI Mediation</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  48 hours where our AI analyzes the case and proposes 
                  3 fair resolution options (A, B, C) for both parties to consider.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-semibold">AI Decision</h4>
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  24 hours to review the AI's binding decision. Accept it, 
                  or escalate to external resolution (with additional fees).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
