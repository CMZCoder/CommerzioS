/**
 * VendorEscrowDashboard Component
 * 
 * Shows vendor's escrow transactions:
 * - Pending (awaiting customer payment)
 * - Held (customer paid, awaiting service completion)
 * - Released (funds transferred to vendor)
 * - Disputed (under review)
 * 
 * Includes:
 * - Summary cards (total held, total released this month, pending disputes)
 * - Transaction list with filters
 * - Action buttons (for disputes)
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EscrowTransaction {
  escrowTx: {
    id: string;
    bookingId: string;
    amount: string;
    currency: string;
    vendorAmount: string;
    platformFee: string;
    status: string;
    paymentMethod: string;
    autoReleaseAt: string | null;
    createdAt: string;
    releasedAt: string | null;
  };
  booking: {
    id: string;
    bookingNumber: string;
    customerId: string;
    status: string;
    requestedStartTime: string;
  };
}

interface VendorEscrowResponse {
  transactions: EscrowTransaction[];
  summary: {
    heldCount: number;
    heldTotal: number;
    releasedCount: number;
    releasedTotal: number;
    disputedCount: number;
  };
}

export function VendorEscrowDashboard() {
  const [activeTab, setActiveTab] = useState("all");

  const { data, isLoading, error } = useQuery<VendorEscrowResponse>({
    queryKey: ["/api/vendor/escrow"],
    queryFn: async () => {
      const res = await fetch("/api/vendor/escrow");
      if (!res.ok) throw new Error("Failed to fetch escrow transactions");
      return res.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Pending</Badge>;
      case "held":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Held in Escrow</Badge>;
      case "released":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Released</Badge>;
      case "disputed":
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">Disputed</Badge>;
      case "refunded":
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Refunded</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTransactions = data?.transactions.filter((tx) => {
    if (activeTab === "all") return true;
    return tx.escrowTx.status === activeTab;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-500">Failed to load escrow data. Please try again.</p>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary || {
    heldCount: 0,
    heldTotal: 0,
    releasedCount: 0,
    releasedTotal: 0,
    disputedCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Held in Escrow
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              CHF {summary.heldTotal.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {summary.heldCount} transaction{summary.heldCount !== 1 ? "s" : ""} awaiting release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Released
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">
              CHF {summary.releasedTotal.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {summary.releasedCount} payment{summary.releasedCount !== 1 ? "s" : ""} received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Disputes
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl",
              summary.disputedCount > 0 ? "text-amber-600" : "text-muted-foreground"
            )}>
              {summary.disputedCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {summary.disputedCount > 0 ? "Active disputes" : "No disputes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Transactions
            </CardDescription>
            <CardTitle className="text-2xl">
              {data?.transactions.length || 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All time escrow transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Escrow Transactions</CardTitle>
          <CardDescription>
            Track your payment status and escrow releases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="held">Held</TabsTrigger>
              <TabsTrigger value="released">Released</TabsTrigger>
              <TabsTrigger value="disputed">Disputed</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Your Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Auto-Release</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <TableRow key={tx.escrowTx.id}>
                          <TableCell>
                            <div>
                              <span className="font-medium">#{tx.booking.bookingNumber}</span>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.booking.requestedStartTime), "MMM d, yyyy")}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            CHF {parseFloat(tx.escrowTx.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            CHF {parseFloat(tx.escrowTx.vendorAmount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(tx.escrowTx.status)}
                          </TableCell>
                          <TableCell>
                            {tx.escrowTx.status === "held" && tx.escrowTx.autoReleaseAt ? (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {format(new Date(tx.escrowTx.autoReleaseAt), "MMM d, HH:mm")}
                              </div>
                            ) : tx.escrowTx.releasedAt ? (
                              <div className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle2 className="w-3 h-3" />
                                Released
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(tx.escrowTx.createdAt), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                How Escrow Works
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Customer payments are held securely until service completion</li>
                <li>• Funds are released automatically 48 hours after service</li>
                <li>• Customers can release funds early by confirming completion</li>
                <li>• Platform fee ({(0.10 * 100).toFixed(0)}%) is deducted from each payment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VendorEscrowDashboard;
