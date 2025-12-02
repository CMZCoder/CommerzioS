/**
 * BookingPaymentStatus Component
 * 
 * Shows different payment status UI based on payment method:
 * - CARD: Escrow protection UI with confirm/report options
 * - TWINT: Instant payment UI with refund request option
 * - CASH: Cash payment reminder
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Smartphone, 
  Banknote,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';
import type { PaymentMethod } from './PaymentMethodSelector';

interface EscrowStatus {
  hasEscrow: boolean;
  status?: string;
  paymentMethod?: PaymentMethod;
  amount?: string;
  currency?: string;
  vendorAmount?: string;
  platformFee?: string;
  autoReleaseAt?: string;
  refundRequestedAt?: string;
  refundReason?: string;
  paidAt?: string;
  releasedAt?: string;
  refundedAt?: string;
}

interface BookingPaymentStatusProps {
  bookingId: string;
  paymentMethod: PaymentMethod;
  amount: number; // in cents
  isVendor?: boolean;
  onConfirmComplete?: () => void;
  onReportIssue?: () => void;
  className?: string;
}

export function BookingPaymentStatus({
  bookingId,
  paymentMethod,
  amount,
  isVendor = false,
  onConfirmComplete,
  onReportIssue,
  className,
}: BookingPaymentStatusProps) {
  const queryClient = useQueryClient();
  const [refundReason, setRefundReason] = useState('');
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  // Get escrow status
  const { data: escrowStatus, isLoading } = useQuery<EscrowStatus>({
    queryKey: ['escrow-status', bookingId],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/escrow-status`);
      if (!res.ok) throw new Error('Failed to fetch escrow status');
      return res.json();
    },
    enabled: !!bookingId,
  });

  // Request TWINT refund mutation (customer)
  const requestRefundMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/request-twint-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to request refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Refund request submitted. The vendor will review your request.');
      setRefundDialogOpen(false);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['escrow-status', bookingId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Process TWINT refund mutation (vendor)
  const processRefundMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/bookings/${bookingId}/process-twint-refund`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to process refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['escrow-status', bookingId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Decline TWINT refund mutation (vendor)
  const declineRefundMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const res = await fetch(`/api/bookings/${bookingId}/decline-twint-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to decline refund');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Refund request declined');
      queryClient.invalidateQueries({ queryKey: ['escrow-status', bookingId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const formatAmount = (cents: number) => {
    return `CHF ${(cents / 100).toFixed(2)}`;
  };

  const formatTimeRemaining = (autoReleaseAt: string) => {
    const releaseTime = new Date(autoReleaseAt).getTime();
    const now = Date.now();
    const remaining = releaseTime - now;
    
    if (remaining <= 0) return 'Releasing soon...';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // CARD Payment (Escrow)
  if (paymentMethod === 'card') {
    const isHeld = escrowStatus?.status === 'held';
    const isReleased = escrowStatus?.status === 'released';

    return (
      <Card className={cn("border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">
                {isReleased ? 'Payment Released' : 'Payment Protected'}
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                {isReleased 
                  ? `Payment of ${formatAmount(amount)} has been released to the vendor.`
                  : `Your payment of ${formatAmount(amount)} is held securely. It will be released when you confirm the service.`
                }
              </p>

              {isHeld && escrowStatus?.autoReleaseAt && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Auto-releases in: {formatTimeRemaining(escrowStatus.autoReleaseAt)}</span>
                </div>
              )}

              {isHeld && !isVendor && (
                <div className="flex gap-2">
                  <Button 
                    onClick={onConfirmComplete}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm Complete
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={onReportIssue}
                    className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // TWINT Payment (Instant)
  if (paymentMethod === 'twint') {
    const isRefundRequested = escrowStatus?.status === 'refund_requested';
    const isRefunded = escrowStatus?.status === 'refunded';

    return (
      <Card className={cn("border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                  {isRefunded ? 'Payment Refunded' : 'Paid with TWINT'}
                </h3>
                {isRefundRequested && (
                  <Badge variant="outline" className="text-amber-600 border-amber-600">
                    Refund Requested
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                {isRefunded 
                  ? `Your payment of ${formatAmount(amount)} has been refunded.`
                  : `Payment of ${formatAmount(amount)} was transferred to the vendor.`
                }
              </p>

              {/* Refund request info */}
              {isRefundRequested && escrowStatus?.refundReason && (
                <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Refund reason:</strong> {escrowStatus.refundReason}
                  </p>
                </div>
              )}

              {/* Customer actions */}
              {!isVendor && !isRefundRequested && !isRefunded && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Had an issue? Request a refund from the vendor.
                    <br />
                    <span className="text-xs">Note: Refunds are at the vendor's discretion.</span>
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={onConfirmComplete} variant="outline">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                    <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Request Refund
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Request Refund</DialogTitle>
                          <DialogDescription>
                            Please explain why you're requesting a refund. The vendor will review your request.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="refundReason">Reason for refund</Label>
                            <Textarea
                              id="refundReason"
                              value={refundReason}
                              onChange={(e) => setRefundReason(e.target.value)}
                              placeholder="Please describe the issue..."
                              className="mt-2"
                              rows={4}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => requestRefundMutation.mutate(refundReason)}
                            disabled={!refundReason.trim() || requestRefundMutation.isPending}
                          >
                            {requestRefundMutation.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Submit Request
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}

              {/* Vendor actions for refund request */}
              {isVendor && isRefundRequested && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => processRefundMutation.mutate()}
                    disabled={processRefundMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processRefundMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Accept Refund
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => declineRefundMutation.mutate(undefined)}
                    disabled={declineRefundMutation.isPending}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // CASH Payment
  return (
    <Card className={cn("border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800", className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
            <Banknote className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Cash Payment
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
              Pay {formatAmount(amount)} directly to the vendor at the service.
            </p>
            
            {!isVendor && onConfirmComplete && (
              <Button onClick={onConfirmComplete} variant="outline">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default BookingPaymentStatus;
