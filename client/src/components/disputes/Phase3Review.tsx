/**
 * Phase3Review Component
 * 
 * UI for Phase 3 AI binding decision review.
 * Shows the AI's final decision with 24-hour review period.
 * User can accept or choose External Resolution (which has game theory penalties).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Gavel, 
  Clock, 
  Check,
  ExternalLink,
  AlertTriangle,
  Scale,
  Banknote
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiDecision {
  id: string;
  customerRefundPercent: number;
  vendorPaymentPercent: number;
  customerRefundAmount: string;
  vendorPaymentAmount: string;
  decisionSummary: string;
  fullReasoning: string;
  keyFactors: string[];
  status: 'pending' | 'executed' | 'overridden_external';
}

interface Phase3ReviewProps {
  disputeId: string;
  escrowAmount: number;
  currency?: string;
  currentUserId: string;
  customerId: string;
  vendorId: string;
  decision: AiDecision;
  reviewDeadline: string | null;
  onAcceptDecision: () => Promise<void>;
  onChooseExternalResolution: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const EXTERNAL_RESOLUTION_FEE = 25; // CHF

export function Phase3Review({
  disputeId,
  escrowAmount,
  currency = 'CHF',
  currentUserId,
  customerId,
  vendorId,
  decision,
  reviewDeadline,
  onAcceptDecision,
  onChooseExternalResolution,
  isLoading,
  className,
}: Phase3ReviewProps) {
  const [showExternalDialog, setShowExternalDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [choosingExternal, setChoosingExternal] = useState(false);

  const role = currentUserId === customerId ? 'customer' : 'vendor';
  const myAmount = role === 'customer' ? decision.customerRefundAmount : decision.vendorPaymentAmount;
  const myPercent = role === 'customer' ? decision.customerRefundPercent : decision.vendorPaymentPercent;

  const getTimeRemaining = () => {
    if (!reviewDeadline) return null;
    const deadlineDate = new Date(reviewDeadline);
    const diff = deadlineDate.getTime() - Date.now();
    if (diff <= 0) return 'Review period ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  const timeRemaining = getTimeRemaining();
  const isReviewActive = decision.status === 'pending' && 
    reviewDeadline && new Date(reviewDeadline) > new Date();

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await onAcceptDecision();
    } finally {
      setAccepting(false);
    }
  };

  const handleChooseExternal = async () => {
    setChoosingExternal(true);
    try {
      await onChooseExternalResolution();
      setShowExternalDialog(false);
    } finally {
      setChoosingExternal(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              Phase 3: AI Final Decision
            </CardTitle>
            {isReviewActive && timeRemaining && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {timeRemaining}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            The AI has made a final binding decision based on all evidence and negotiation history.
            {isReviewActive && ' You have 24 hours to review before it is automatically executed.'}
          </p>
        </CardContent>
      </Card>

      {/* Decision Card */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            AI Decision
          </CardTitle>
          <CardDescription>{decision.decisionSummary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Amount Split */}
          <div className="grid grid-cols-2 gap-4">
            <div className={cn(
              'p-4 rounded-lg text-center',
              role === 'customer' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-green-50'
            )}>
              <p className="text-xs text-muted-foreground">Customer Receives</p>
              <p className="text-2xl font-bold text-green-700">
                {currency} {decision.customerRefundAmount}
              </p>
              <p className="text-sm text-green-600">{decision.customerRefundPercent}%</p>
              {role === 'customer' && (
                <Badge className="mt-2" variant="outline">You</Badge>
              )}
            </div>
            <div className={cn(
              'p-4 rounded-lg text-center',
              role === 'vendor' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-blue-50'
            )}>
              <p className="text-xs text-muted-foreground">Vendor Receives</p>
              <p className="text-2xl font-bold text-blue-700">
                {currency} {decision.vendorPaymentAmount}
              </p>
              <p className="text-sm text-blue-600">{decision.vendorPaymentPercent}%</p>
              {role === 'vendor' && (
                <Badge className="mt-2" variant="outline">You</Badge>
              )}
            </div>
          </div>

          {/* Key Factors */}
          {decision.keyFactors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Factors in Decision:</p>
              <ul className="space-y-1">
                {decision.keyFactors.map((factor, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Reasoning (Expandable) */}
          {decision.fullReasoning && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-primary hover:underline">
                View full reasoning
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                {decision.fullReasoning}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Actions (only during review period) */}
      {isReviewActive && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Button 
              size="lg"
              className="w-full"
              onClick={handleAccept}
              disabled={accepting || isLoading}
            >
              {accepting ? (
                'Processing...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Accept Decision
                </>
              )}
            </Button>

            <AlertDialog open={showExternalDialog} onOpenChange={setShowExternalDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
                  disabled={isLoading}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  External Resolution
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-5 h-5" />
                    External Resolution Warning
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-4 text-left">
                      <p>
                        By choosing External Resolution, you are rejecting the AI's binding decision.
                        This action has significant consequences:
                      </p>
                      
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
                        <h4 className="font-semibold text-red-800 flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Penalty for Choosing External Resolution
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>• You will receive <strong>0%</strong> of the escrow ({currency} 0)</li>
                          <li>• The other party receives <strong>100%</strong> ({currency} {escrowAmount.toFixed(2)})</li>
                          <li>• You will be charged a <strong>{currency} {EXTERNAL_RESOLUTION_FEE}</strong> admin fee</li>
                        </ul>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        This mechanism exists to discourage gaming the system. Only choose external 
                        resolution if you believe you have grounds for legal action.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleChooseExternal}
                    disabled={choosingExternal}
                  >
                    {choosingExternal ? 'Processing...' : 'I Understand, Choose External'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If no action is taken, the AI decision will be automatically executed after the review period.
          </p>
        </>
      )}

      {/* Decision Executed Status */}
      {decision.status === 'executed' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Decision Executed</p>
            <p className="text-sm text-green-700">
              Funds have been transferred according to the AI decision.
            </p>
          </div>
        </div>
      )}

      {/* External Resolution Status */}
      {decision.status === 'overridden_external' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <ExternalLink className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">External Resolution Chosen</p>
            <p className="text-sm text-amber-700">
              The AI decision was overridden. The party who chose external resolution 
              received 0% and was charged the {currency} {EXTERNAL_RESOLUTION_FEE} admin fee.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
