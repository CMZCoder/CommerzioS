/**
 * DisputeCenter Component
 * 
 * Main container component for viewing and managing a dispute.
 * Shows the appropriate phase UI based on the dispute's current state.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  AlertCircle,
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

import { DisputePhaseIndicator } from './DisputePhaseIndicator';
import { Phase1Negotiation } from './Phase1Negotiation';
import { Phase2AiMediation } from './Phase2AiMediation';
import { Phase3Review } from './Phase3Review';
import { EvidenceUpload } from './EvidenceUpload';
import { DisputeTimeline } from './DisputeTimeline';

interface DisputeCenterProps {
  disputeId: string;
  currentUserId: string;
  onBack?: () => void;
  apiRequest: (url: string, options?: RequestInit) => Promise<any>;
  className?: string;
}

interface DisputeDetails {
  dispute: {
    id: string;
    bookingId: string;
    reason: string;
    description: string;
    status: string;
    evidenceUrls: string[];
    createdAt: string;
  };
  phases: {
    currentPhase: string;
    phase1Deadline: string | null;
    phase2Deadline: string | null;
    phase3ReviewDeadline: string | null;
  } | null;
  parties: {
    customerId: string;
    vendorId: string;
  } | null;
  booking: {
    id: string;
    bookingNumber: string;
    serviceName?: string;
  };
  escrow: {
    amount: string;
    currency: string;
  };
  counterOffers: Array<{
    id: string;
    userId: string;
    percent: number;
    message?: string | null;
    createdAt: string;
  }>;
  aiOptions: Array<{
    id: string;
    optionLabel: string;
    optionTitle: string;
    customerRefundPercent: number;
    vendorPaymentPercent: number;
    customerRefundAmount: string;
    vendorPaymentAmount: string;
    reasoning: string;
    keyFactors: string[];
    isRecommended: boolean;
  }>;
  aiAnalysis: any | null;
  aiDecision: {
    id: string;
    customerRefundPercent: number;
    vendorPaymentPercent: number;
    customerRefundAmount: string;
    vendorPaymentAmount: string;
    decisionSummary: string;
    fullReasoning: string;
    keyFactors: string[];
    status: 'pending' | 'executed' | 'overridden_external';
  } | null;
  partySelections: {
    customer: { optionId: string | null; optionLabel: string | null };
    vendor: { optionId: string | null; optionLabel: string | null };
  };
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description?: string;
    userId?: string;
    userRole?: string;
    metadata?: Record<string, any>;
    createdAt: string;
  }>;
}

export function DisputeCenter({
  disputeId,
  currentUserId,
  onBack,
  apiRequest,
  className,
}: DisputeCenterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('resolution');

  // Fetch dispute details
  const { data, isLoading, error, refetch } = useQuery<DisputeDetails>({
    queryKey: ['dispute', disputeId],
    queryFn: () => apiRequest(`/api/disputes/${disputeId}`),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mutations
  const submitCounterOffer = useMutation({
    mutationFn: async ({ percent, message }: { percent: number; message?: string }) => {
      return apiRequest(`/api/disputes/${disputeId}/counter-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ percent, message }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Counter-offer submitted' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const acceptOffer = useMutation({
    mutationFn: async (offerId: string) => {
      return apiRequest(`/api/disputes/${disputeId}/accept-offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Offer accepted', description: 'Dispute is being resolved' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const requestEscalation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/disputes/${disputeId}/escalate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ title: 'Escalation requested', description: 'Moving to next phase' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const selectOption = useMutation({
    mutationFn: async (optionId: string) => {
      return apiRequest(`/api/disputes/${disputeId}/select-option`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Option selected' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const acceptDecision = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/disputes/${disputeId}/accept-decision`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ title: 'Decision accepted', description: 'Funds are being transferred' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const chooseExternalResolution = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/disputes/${disputeId}/external-resolution`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({ 
        title: 'External resolution chosen', 
        description: 'You will receive 0% and be charged the admin fee',
        variant: 'destructive'
      });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const uploadEvidence = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiRequest(`/api/disputes/${disputeId}/evidence`, {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      toast({ title: 'Evidence uploaded' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const removeEvidence = useMutation({
    mutationFn: async (evidenceId: string) => {
      return apiRequest(`/api/disputes/${disputeId}/evidence/${evidenceId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      toast({ title: 'Evidence removed' });
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Loading State
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <p className="text-lg font-medium">Failed to load dispute</p>
          <p className="text-sm text-muted-foreground mb-4">
            {(error as Error)?.message || 'Unknown error'}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  const { dispute, phases, parties, booking, escrow, counterOffers, aiOptions, aiAnalysis, aiDecision, partySelections, timeline } = data;
  const currentPhase = phases?.currentPhase || 'phase_1';
  const escrowAmount = parseFloat(escrow?.amount || '0');
  const role = currentUserId === parties?.customerId ? 'customer' : 'vendor';

  const isAnyMutationLoading = 
    submitCounterOffer.isPending || 
    acceptOffer.isPending || 
    requestEscalation.isPending ||
    selectOption.isPending ||
    acceptDecision.isPending ||
    chooseExternalResolution.isPending;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">Dispute #{booking.bookingNumber}</h1>
            <p className="text-muted-foreground">{booking.serviceName || 'Service'}</p>
          </div>
        </div>
        <Badge variant={dispute.status === 'open' ? 'default' : 'secondary'}>
          {dispute.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Phase Indicator */}
      <DisputePhaseIndicator
        currentPhase={currentPhase as any}
        phase1Deadline={phases?.phase1Deadline}
        phase2Deadline={phases?.phase2Deadline}
        phase3ReviewDeadline={phases?.phase3ReviewDeadline}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resolution" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Resolution
          </TabsTrigger>
          <TabsTrigger value="evidence" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Evidence
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Resolution Tab */}
        <TabsContent value="resolution" className="mt-4">
          {/* Phase 1: Direct Negotiation */}
          {currentPhase === 'phase_1' && parties && (
            <Phase1Negotiation
              disputeId={disputeId}
              escrowAmount={escrowAmount}
              currency={escrow?.currency || 'CHF'}
              currentUserId={currentUserId}
              customerId={parties.customerId}
              vendorId={parties.vendorId}
              counterOffers={counterOffers}
              deadline={phases?.phase1Deadline || null}
              onSubmitCounterOffer={async (percent, message) => {
                await submitCounterOffer.mutateAsync({ percent, message });
              }}
              onAcceptOffer={async (offerId) => {
                await acceptOffer.mutateAsync(offerId);
              }}
              onRequestEscalation={async () => {
                await requestEscalation.mutateAsync();
              }}
              isLoading={isAnyMutationLoading}
            />
          )}

          {/* Phase 2: AI Mediation */}
          {currentPhase === 'phase_2' && parties && (
            <Phase2AiMediation
              disputeId={disputeId}
              escrowAmount={escrowAmount}
              currency={escrow?.currency || 'CHF'}
              currentUserId={currentUserId}
              customerId={parties.customerId}
              vendorId={parties.vendorId}
              options={aiOptions}
              analysis={aiAnalysis}
              deadline={phases?.phase2Deadline || null}
              customerSelection={partySelections.customer}
              vendorSelection={partySelections.vendor}
              onSelectOption={async (optionId) => {
                await selectOption.mutateAsync(optionId);
              }}
              onRequestEscalation={async () => {
                await requestEscalation.mutateAsync();
              }}
              isLoading={isAnyMutationLoading}
            />
          )}

          {/* Phase 3: AI Decision Review */}
          {(currentPhase === 'phase_3_pending' || currentPhase === 'phase_3_ai' || currentPhase === 'phase_3_external') && 
           parties && aiDecision && (
            <Phase3Review
              disputeId={disputeId}
              escrowAmount={escrowAmount}
              currency={escrow?.currency || 'CHF'}
              currentUserId={currentUserId}
              customerId={parties.customerId}
              vendorId={parties.vendorId}
              decision={aiDecision}
              reviewDeadline={phases?.phase3ReviewDeadline || null}
              onAcceptDecision={async () => {
                await acceptDecision.mutateAsync();
              }}
              onChooseExternalResolution={async () => {
                await chooseExternalResolution.mutateAsync();
              }}
              isLoading={isAnyMutationLoading}
            />
          )}

          {/* Resolved State */}
          {currentPhase === 'resolved' && (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Dispute Resolved</h2>
                <p className="text-muted-foreground">
                  This dispute has been resolved. Check the timeline for details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Evidence Tab */}
        <TabsContent value="evidence" className="mt-4">
          <EvidenceUpload
            disputeId={disputeId}
            existingEvidence={(dispute.evidenceUrls || []).map((url, i) => ({
              id: `evidence-${i}`,
              url,
              filename: `Evidence ${i + 1}`,
              type: url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? 'image' : 
                    url.match(/\.(mp4|webm)$/i) ? 'video' : 'document',
              uploadedAt: dispute.createdAt,
            }))}
            onUpload={async (file) => {
              const result = await uploadEvidence.mutateAsync(file);
              return result;
            }}
            onRemove={async (evidenceId) => {
              await removeEvidence.mutateAsync(evidenceId);
            }}
            isLoading={uploadEvidence.isPending || removeEvidence.isPending}
          />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-4">
          {parties && (
            <DisputeTimeline
              events={timeline as any}
              currentUserId={currentUserId}
              customerId={parties.customerId}
              vendorId={parties.vendorId}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
