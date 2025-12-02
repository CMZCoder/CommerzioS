/**
 * Admin Escrow Management Page
 * 
 * Admin view of all escrow transactions:
 * - Overview metrics
 * - All transactions with filters
 * - Open disputes queue
 * - Dispute resolution interface
 * - Manual release/refund controls
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock,
  DollarSign,
  Loader2,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Link } from "wouter";

interface EscrowMetrics {
  byStatus: Record<string, { count: number; total: number }>;
  totalHeld: number;
  openDisputes: number;
}

interface Dispute {
  dispute: {
    id: string;
    bookingId: string;
    raisedBy: string;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
  };
  booking: {
    id: string;
    bookingNumber: string;
    customerId: string;
    vendorId: string;
  };
  escrowTx: {
    id: string;
    amount: string;
    status: string;
  };
  raisedByUser: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export function EscrowManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState(false);
  const [resolution, setResolution] = useState<"customer" | "vendor" | "split">("vendor");
  const [refundPercentage, setRefundPercentage] = useState(50);
  const [notes, setNotes] = useState("");

  // Fetch escrow metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery<EscrowMetrics>({
    queryKey: ["/api/admin/escrow/metrics"],
    queryFn: () => apiRequest("/api/admin/escrow/metrics"),
  });

  // Fetch disputes
  const { data: disputesData, isLoading: disputesLoading } = useQuery<{ disputes: Dispute[] }>({
    queryKey: ["/api/admin/disputes"],
    queryFn: () => apiRequest("/api/admin/disputes?status=open"),
  });

  // Resolve dispute mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, resolution, refundPercentage, notes }: {
      disputeId: string;
      resolution: string;
      refundPercentage?: number;
      notes?: string;
    }) => {
      return apiRequest(`/api/admin/disputes/${disputeId}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution, refundPercentage, notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/escrow/metrics"] });
      setResolutionDialog(false);
      setSelectedDispute(null);
      setNotes("");
      toast({
        title: "Dispute Resolved",
        description: "The dispute has been resolved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resolve dispute",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Pending</Badge>;
      case "held":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Held</Badge>;
      case "released":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Released</Badge>;
      case "disputed":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Disputed</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Refunded</Badge>;
      case "open":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Open</Badge>;
      case "under_review":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Under Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      service_not_provided: "Service Not Provided",
      poor_quality: "Poor Quality",
      wrong_service: "Wrong Service",
      overcharged: "Overcharged",
      no_show: "No Show",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const handleResolveDispute = () => {
    if (!selectedDispute) return;
    
    resolveMutation.mutate({
      disputeId: selectedDispute.dispute.id,
      resolution,
      refundPercentage: resolution === "split" ? refundPercentage : undefined,
      notes,
    });
  };

  const disputes = disputesData?.disputes || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Escrow Management
            </h1>
            <p className="text-muted-foreground">
              Manage escrow transactions and disputes
            </p>
          </div>
          <Link href="/admin">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" />
                Total Held
              </CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                CHF {(metrics?.totalHeld || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics?.byStatus?.held?.count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Released
              </CardDescription>
              <CardTitle className="text-2xl text-green-600">
                CHF {(metrics?.byStatus?.released?.total || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics?.byStatus?.released?.count || 0} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Open Disputes
              </CardDescription>
              <CardTitle className={cn(
                "text-2xl",
                (metrics?.openDisputes || 0) > 0 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {metrics?.openDisputes || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Refunded
              </CardDescription>
              <CardTitle className="text-2xl text-red-600">
                CHF {(metrics?.byStatus?.refunded?.total || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {metrics?.byStatus?.refunded?.count || 0} transactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Disputes Queue</CardTitle>
            <CardDescription>
              Review and resolve open disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {disputesLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : disputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-4 text-green-500" />
                <p className="text-lg font-medium">No Open Disputes</p>
                <p className="text-sm">All disputes have been resolved</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Raised By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disputes.map((dispute) => (
                      <TableRow key={dispute.dispute.id}>
                        <TableCell>
                          <span className="font-medium">#{dispute.booking.bookingNumber}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="capitalize font-medium">{dispute.dispute.raisedBy}</span>
                            <p className="text-xs text-muted-foreground">
                              {dispute.raisedByUser.firstName} {dispute.raisedByUser.lastName}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getReasonLabel(dispute.dispute.reason)}
                        </TableCell>
                        <TableCell>
                          CHF {parseFloat(dispute.escrowTx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(dispute.dispute.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(dispute.dispute.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedDispute(dispute)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setResolutionDialog(true);
                              }}
                            >
                              Resolve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Dispute Detail Dialog */}
        <Dialog open={!!selectedDispute && !resolutionDialog} onOpenChange={(open) => !open && setSelectedDispute(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
              <DialogDescription>
                Review dispute information before resolution
              </DialogDescription>
            </DialogHeader>
            {selectedDispute && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Booking</Label>
                    <p className="font-medium">#{selectedDispute.booking.bookingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="font-medium">CHF {parseFloat(selectedDispute.escrowTx.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Raised By</Label>
                    <p className="font-medium capitalize">{selectedDispute.dispute.raisedBy}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDispute.raisedByUser.firstName} {selectedDispute.raisedByUser.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reason</Label>
                    <p className="font-medium">{getReasonLabel(selectedDispute.dispute.reason)}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1 p-3 bg-slate-100 rounded-lg">
                    {selectedDispute.dispute.description}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedDispute(null)}>
                    Close
                  </Button>
                  <Button onClick={() => setResolutionDialog(true)}>
                    Resolve Dispute
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resolution Dialog */}
        <Dialog open={resolutionDialog} onOpenChange={(open) => {
          setResolutionDialog(open);
          if (!open) {
            setNotes("");
            setRefundPercentage(50);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Dispute</DialogTitle>
              <DialogDescription>
                Choose how to resolve this dispute
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Refund to Customer</SelectItem>
                    <SelectItem value="vendor">Release to Vendor</SelectItem>
                    <SelectItem value="split">Split Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolution === "split" && (
                <div>
                  <Label>Refund Percentage to Customer</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[refundPercentage]}
                      onValueChange={(v) => setRefundPercentage(v[0])}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="font-medium w-12 text-right">{refundPercentage}%</span>
                  </div>
                  {selectedDispute && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Customer receives: CHF {(parseFloat(selectedDispute.escrowTx.amount) * refundPercentage / 100).toFixed(2)}
                      <br />
                      Vendor receives: CHF {(parseFloat(selectedDispute.escrowTx.amount) * (100 - refundPercentage) / 100).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div>
                <Label>Resolution Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain the resolution decision..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolutionDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleResolveDispute}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Resolution
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default EscrowManagementPage;
