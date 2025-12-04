/**
 * Phase1Negotiation Component
 * 
 * UI for Phase 1 direct negotiation between customer and vendor.
 * Shows counter-offer history and allows making new offers.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  ArrowRight, 
  Check, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { CounterOfferForm } from './CounterOfferForm';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface CounterOffer {
  id: string;
  userId: string;
  percent: number;
  message?: string | null;
  createdAt: string;
}

interface Phase1NegotiationProps {
  disputeId: string;
  escrowAmount: number;
  currency?: string;
  currentUserId: string;
  customerId: string;
  vendorId: string;
  counterOffers: CounterOffer[];
  deadline: string | null;
  onSubmitCounterOffer: (percent: number, message?: string) => Promise<void>;
  onAcceptOffer: (offerId: string) => Promise<void>;
  onRequestEscalation: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function Phase1Negotiation({
  disputeId,
  escrowAmount,
  currency = 'CHF',
  currentUserId,
  customerId,
  vendorId,
  counterOffers,
  deadline,
  onSubmitCounterOffer,
  onAcceptOffer,
  onRequestEscalation,
  isLoading,
  className,
}: Phase1NegotiationProps) {
  const [showForm, setShowForm] = useState(counterOffers.length === 0);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const role = currentUserId === customerId ? 'customer' : 'vendor';
  const lastOffer = counterOffers.length > 0 ? counterOffers[0] : null;
  const canAcceptLastOffer = lastOffer && lastOffer.userId !== currentUserId;

  const handleAccept = async (offerId: string) => {
    setAcceptingId(offerId);
    try {
      await onAcceptOffer(offerId);
    } finally {
      setAcceptingId(null);
    }
  };

  const getTimeRemaining = () => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days ${hours % 24} hours`;
    return `${hours} hours`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Phase 1: Direct Negotiation
            </CardTitle>
            {timeRemaining && (
              <Badge variant={timeRemaining === 'Expired' ? 'destructive' : 'secondary'}>
                <Clock className="w-3 h-3 mr-1" />
                {timeRemaining}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Work directly with the other party to find a mutually acceptable resolution. 
            If you can't reach an agreement, the dispute will escalate to AI mediation.
          </p>
        </CardContent>
      </Card>

      {/* Counter-Offer History */}
      {counterOffers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Negotiation History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {counterOffers.map((offer, index) => {
              const isFromCustomer = offer.userId === customerId;
              const isFromCurrentUser = offer.userId === currentUserId;
              const isLatest = index === 0;
              
              return (
                <div 
                  key={offer.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    isLatest && !isFromCurrentUser && 'border-primary bg-primary/5',
                    isFromCurrentUser && 'bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={isFromCustomer ? 'default' : 'secondary'}>
                          {isFromCustomer ? 'Customer' : 'Vendor'}
                        </Badge>
                        {isFromCurrentUser && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-medium">
                        {offer.percent}% to customer 
                        <span className="text-muted-foreground font-normal ml-1">
                          ({currency} {(escrowAmount * offer.percent / 100).toFixed(2)})
                        </span>
                      </p>
                      {offer.message && (
                        <p className="text-sm text-muted-foreground">{offer.message}</p>
                      )}
                    </div>

                    {/* Accept Button (only for latest offer from other party) */}
                    {isLatest && canAcceptLastOffer && (
                      <Button 
                        size="sm"
                        onClick={() => handleAccept(offer.id)}
                        disabled={acceptingId === offer.id || isLoading}
                      >
                        {acceptingId === offer.id ? (
                          'Accepting...'
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Counter-Offer Form */}
      {showForm ? (
        <CounterOfferForm
          escrowAmount={escrowAmount}
          currency={currency}
          role={role}
          lastOffer={lastOffer ? {
            percent: lastOffer.percent,
            byRole: lastOffer.userId === customerId ? 'customer' : 'vendor',
          } : null}
          onSubmit={async (percent, message) => {
            await onSubmitCounterOffer(percent, message);
            setShowForm(false);
          }}
          isLoading={isLoading}
        />
      ) : (
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          Make a Counter-Offer
        </Button>
      )}

      <Separator />

      {/* Escalation Option */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-800">Can't reach an agreement?</h4>
            <p className="text-sm text-amber-700 mt-1">
              Request escalation to Phase 2 where AI will analyze the dispute and propose 3 resolution options.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3"
              onClick={onRequestEscalation}
              disabled={isLoading}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Request AI Mediation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
