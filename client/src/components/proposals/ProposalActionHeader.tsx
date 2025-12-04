/**
 * ProposalActionHeader Component
 * 
 * A floating/sticky action bar for proposal interactions.
 * Shows different states based on proposal status and user role.
 * 
 * Usage contexts:
 * 1. Customer viewing a proposal - Accept/Reject/Counter buttons
 * 2. Vendor viewing their proposal - Status indicator, Withdraw option
 * 3. Both parties - Timer countdown for 48h expiry
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  AlertTriangle,
  ChevronDown,
  CreditCard,
  Banknote,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDistanceToNow, differenceInHours } from "date-fns";

// ============================================
// TYPES
// ============================================

type ProposalStatus = 
  | "pending" 
  | "viewed" 
  | "accepted" 
  | "rejected" 
  | "withdrawn" 
  | "expired";

type PaymentMethod = "card" | "twint" | "cash";
type PaymentTiming = "upfront" | "on_completion";

interface Proposal {
  id: string;
  status: ProposalStatus;
  price: number;
  paymentMethod: PaymentMethod;
  paymentTiming: PaymentTiming;
  coverLetter: string;
  expiresAt: Date;
  createdAt: Date;
  vendor: {
    id: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    rating?: number;
    reviewCount?: number;
  };
}

interface ProposalActionHeaderProps {
  proposal: Proposal;
  userRole: "customer" | "vendor";
  onAccept?: () => Promise<void>;
  onReject?: (reason?: string) => Promise<void>;
  onCounter?: () => void;  // Opens counter-proposal modal
  onWithdraw?: () => Promise<void>;
  onStartChat?: () => void;
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimeRemaining(expiresAt: Date): {
  text: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  const now = new Date();
  const hoursRemaining = differenceInHours(expiresAt, now);
  
  if (hoursRemaining <= 0) {
    return { text: "Expired", isUrgent: false, isExpired: true };
  }
  
  if (hoursRemaining <= 4) {
    return { 
      text: `${hoursRemaining}h remaining`, 
      isUrgent: true, 
      isExpired: false 
    };
  }
  
  return { 
    text: formatDistanceToNow(expiresAt, { addSuffix: true }), 
    isUrgent: false, 
    isExpired: false 
  };
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "card": return "Card";
    case "twint": return "TWINT";
    case "cash": return "Cash";
  }
}

function getPaymentTimingLabel(timing: PaymentTiming): string {
  switch (timing) {
    case "upfront": return "Pay upfront";
    case "on_completion": return "Pay after service";
  }
}

function getStatusBadge(status: ProposalStatus): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  switch (status) {
    case "pending":
      return { label: "Awaiting Response", variant: "default" };
    case "viewed":
      return { label: "Viewed", variant: "secondary" };
    case "accepted":
      return { label: "Accepted", variant: "default" };
    case "rejected":
      return { label: "Rejected", variant: "destructive" };
    case "withdrawn":
      return { label: "Withdrawn", variant: "outline" };
    case "expired":
      return { label: "Expired", variant: "outline" };
  }
}

// ============================================
// COMPONENT
// ============================================

export function ProposalActionHeader({
  proposal,
  userRole,
  onAccept,
  onReject,
  onCounter,
  onWithdraw,
  onStartChat,
  className = "",
}: ProposalActionHeaderProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [timeInfo, setTimeInfo] = useState(getTimeRemaining(proposal.expiresAt));

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(getTimeRemaining(proposal.expiresAt));
    }, 60000);
    
    return () => clearInterval(timer);
  }, [proposal.expiresAt]);

  const statusBadge = getStatusBadge(proposal.status);
  const isActionable = proposal.status === "pending" || proposal.status === "viewed";
  const showOffPlatformWarning = 
    proposal.paymentMethod !== "card" && 
    proposal.paymentTiming === "on_completion";

  // ----------------------------------------
  // HANDLERS
  // ----------------------------------------

  const handleAccept = async () => {
    if (!onAccept) return;
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!onReject) return;
    setIsRejecting(true);
    try {
      await onReject();
    } finally {
      setIsRejecting(false);
      setShowRejectDialog(false);
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    setIsWithdrawing(true);
    try {
      await onWithdraw();
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawDialog(false);
    }
  };

  // ----------------------------------------
  // RENDER: Customer View
  // ----------------------------------------

  if (userRole === "customer" && isActionable) {
    return (
      <div className={`bg-white border-b sticky top-0 z-10 ${className}`}>
        <div className="container mx-auto px-4 py-4">
          {/* Price and Payment Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-3xl font-bold text-primary">
                CHF {proposal.price.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                {proposal.paymentMethod === "card" ? (
                  <CreditCard className="h-4 w-4" />
                ) : (
                  <Banknote className="h-4 w-4" />
                )}
                <span>{getPaymentMethodLabel(proposal.paymentMethod)}</span>
                <span>•</span>
                <span>{getPaymentTimingLabel(proposal.paymentTiming)}</span>
              </div>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 ${
              timeInfo.isUrgent ? "text-destructive" : "text-muted-foreground"
            }`}>
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {timeInfo.isExpired ? "Expired" : `Expires ${timeInfo.text}`}
              </span>
            </div>
          </div>

          {/* Off-Platform Warning */}
          {showOffPlatformWarning && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <strong>Payment Outside Platform:</strong> This proposal uses{" "}
                {proposal.paymentMethod === "cash" ? "cash" : "TWINT"} payment after 
                service completion. Payment and escrow protection are not provided 
                by the platform.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleAccept}
              disabled={isAccepting || timeInfo.isExpired}
              className="flex-1 sm:flex-none"
            >
              {isAccepting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accept Proposal
            </Button>

            {onCounter && (
              <Button 
                variant="outline" 
                onClick={onCounter}
                disabled={timeInfo.isExpired}
                className="flex-1 sm:flex-none"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Counter Offer
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" disabled={timeInfo.isExpired}>
                  More <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowRejectDialog(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Proposal
                </DropdownMenuItem>
                {onStartChat && (
                  <DropdownMenuItem onClick={onStartChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Vendor
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject this proposal?</AlertDialogTitle>
              <AlertDialogDescription>
                The vendor will be notified that you've declined their proposal. 
                They won't be able to resubmit for this request.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleReject}
                className="bg-destructive text-destructive-foreground"
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ----------------------------------------
  // RENDER: Vendor View
  // ----------------------------------------

  if (userRole === "vendor") {
    return (
      <div className={`bg-white border-b sticky top-0 z-10 ${className}`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <Badge variant={statusBadge.variant}>
                {statusBadge.label}
              </Badge>
              <span className="text-2xl font-bold">
                CHF {proposal.price.toFixed(2)}
              </span>
            </div>

            {/* Timer + Actions */}
            <div className="flex items-center gap-4">
              {isActionable && !timeInfo.isExpired && (
                <div className={`flex items-center gap-2 ${
                  timeInfo.isUrgent ? "text-destructive" : "text-muted-foreground"
                }`}>
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {timeInfo.text}
                  </span>
                </div>
              )}

              {isActionable && (
                <Button 
                  variant="outline" 
                  onClick={() => setShowWithdrawDialog(true)}
                >
                  Withdraw
                </Button>
              )}

              {onStartChat && (
                <Button variant="outline" onClick={onStartChat}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Withdraw Confirmation Dialog */}
        <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Withdraw your proposal?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. You can submit a new proposal 
                if the request is still open.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleWithdraw}>
                {isWithdrawing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Withdraw
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ----------------------------------------
  // RENDER: Non-actionable states (accepted, rejected, etc.)
  // ----------------------------------------

  return (
    <div className={`bg-muted/50 border-b ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
            <span className="text-xl font-semibold text-muted-foreground">
              CHF {proposal.price.toFixed(2)}
            </span>
          </div>

          {proposal.status === "accepted" && onStartChat && (
            <Button onClick={onStartChat}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message {userRole === "customer" ? "Vendor" : "Customer"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProposalActionHeader;
