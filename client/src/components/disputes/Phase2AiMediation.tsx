/**
 * Phase2AiMediation Component
 * 
 * UI for Phase 2 AI-mediated resolution.
 * Shows AI analysis summary and 3 resolution options (A, B, C).
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Check, 
  Star,
  Clock,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiOption {
  id: string;
  optionLabel: string; // "A", "B", "C"
  optionTitle: string;
  customerRefundPercent: number;
  vendorPaymentPercent: number;
  customerRefundAmount: string;
  vendorPaymentAmount: string;
  reasoning: string;
  keyFactors: string[];
  isRecommended: boolean;
}

interface AiAnalysis {
  overallAssessment?: {
    primaryIssue?: string;
    faultAssessment?: string;
  };
  evidenceAnalysis?: {
    customer?: { evidenceStrength?: string };
    vendor?: { evidenceStrength?: string };
  };
}

interface PartySelection {
  optionId: string | null;
  optionLabel: string | null;
}

interface Phase2AiMediationProps {
  disputeId: string;
  escrowAmount: number;
  currency?: string;
  currentUserId: string;
  customerId: string;
  vendorId: string;
  options: AiOption[];
  analysis: AiAnalysis | null;
  deadline: string | null;
  customerSelection: PartySelection;
  vendorSelection: PartySelection;
  onSelectOption: (optionId: string) => Promise<void>;
  onRequestEscalation: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const OPTION_COLORS = {
  A: 'bg-blue-500',
  B: 'bg-purple-500',
  C: 'bg-orange-500',
};

export function Phase2AiMediation({
  disputeId,
  escrowAmount,
  currency = 'CHF',
  currentUserId,
  customerId,
  vendorId,
  options,
  analysis,
  deadline,
  customerSelection,
  vendorSelection,
  onSelectOption,
  onRequestEscalation,
  isLoading,
  className,
}: Phase2AiMediationProps) {
  const [selectingId, setSelectingId] = useState<string | null>(null);
  
  const role = currentUserId === customerId ? 'customer' : 'vendor';
  const mySelection = role === 'customer' ? customerSelection : vendorSelection;
  const otherSelection = role === 'customer' ? vendorSelection : customerSelection;

  const handleSelect = async (optionId: string) => {
    setSelectingId(optionId);
    try {
      await onSelectOption(optionId);
    } finally {
      setSelectingId(null);
    }
  };

  const getTimeRemaining = () => {
    if (!deadline) return null;
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Phase 2: AI Mediation
            </CardTitle>
            {deadline && (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" />
                {getTimeRemaining()}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Our AI has analyzed the dispute and generated 3 resolution options. 
            If both parties select the same option, the dispute is resolved. 
            Otherwise, it proceeds to final AI decision.
          </p>
        </CardContent>
      </Card>

      {/* AI Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              AI Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {analysis.overallAssessment?.primaryIssue && (
              <div>
                <span className="font-medium">Primary Issue: </span>
                <span className="text-muted-foreground">
                  {analysis.overallAssessment.primaryIssue}
                </span>
              </div>
            )}
            {analysis.overallAssessment?.faultAssessment && (
              <div>
                <span className="font-medium">Assessment: </span>
                <span className="text-muted-foreground">
                  {analysis.overallAssessment.faultAssessment}
                </span>
              </div>
            )}
            <div className="flex gap-4">
              <div>
                <span className="font-medium">Customer Evidence: </span>
                <Badge variant="outline" className="capitalize">
                  {analysis.evidenceAnalysis?.customer?.evidenceStrength || 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Vendor Evidence: </span>
                <Badge variant="outline" className="capitalize">
                  {analysis.evidenceAnalysis?.vendor?.evidenceStrength || 'N/A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Status */}
      <div className="flex gap-4">
        <div className={cn(
          'flex-1 p-3 rounded-lg border text-center',
          mySelection.optionId ? 'border-green-500 bg-green-50' : 'bg-muted'
        )}>
          <p className="text-xs text-muted-foreground">Your Selection</p>
          <p className="font-medium">
            {mySelection.optionLabel ? `Option ${mySelection.optionLabel}` : 'Not selected'}
          </p>
        </div>
        <div className={cn(
          'flex-1 p-3 rounded-lg border text-center',
          otherSelection.optionId ? 'border-blue-500 bg-blue-50' : 'bg-muted'
        )}>
          <p className="text-xs text-muted-foreground">
            {role === 'customer' ? 'Vendor' : 'Customer'}'s Selection
          </p>
          <p className="font-medium">
            {otherSelection.optionLabel 
              ? `Option ${otherSelection.optionLabel}` 
              : 'Waiting...'}
          </p>
        </div>
      </div>

      {/* Resolution Options */}
      <div className="grid gap-4">
        {options.map((option) => {
          const isSelected = mySelection.optionId === option.id;
          const isOtherSelected = otherSelection.optionId === option.id;
          const bothSelected = isSelected && isOtherSelected;

          return (
            <Card 
              key={option.id}
              className={cn(
                'relative overflow-hidden transition-all',
                isSelected && 'ring-2 ring-primary',
                bothSelected && 'ring-2 ring-green-500',
                option.isRecommended && 'border-amber-300'
              )}
            >
              {/* Option Label Header */}
              <div className={cn(
                'absolute top-0 left-0 w-12 h-12 flex items-center justify-center text-white font-bold text-lg',
                OPTION_COLORS[option.optionLabel as keyof typeof OPTION_COLORS] || 'bg-gray-500'
              )}
              style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
              >
                <span className="absolute top-1 left-2">{option.optionLabel}</span>
              </div>

              <CardHeader className="pl-14">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {option.optionTitle}
                      {option.isRecommended && (
                        <Badge className="bg-amber-500">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {option.reasoning}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Amount Split */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Customer Gets</p>
                    <p className="font-bold text-green-700">
                      {currency} {option.customerRefundAmount}
                    </p>
                    <p className="text-xs text-green-600">{option.customerRefundPercent}%</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Vendor Gets</p>
                    <p className="font-bold text-blue-700">
                      {currency} {option.vendorPaymentAmount}
                    </p>
                    <p className="text-xs text-blue-600">{option.vendorPaymentPercent}%</p>
                  </div>
                </div>

                {/* Key Factors */}
                {option.keyFactors?.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Key Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {option.keyFactors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selection Status & Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-2">
                    {isSelected && (
                      <Badge variant="default">
                        <Check className="w-3 h-3 mr-1" />
                        Your Choice
                      </Badge>
                    )}
                    {isOtherSelected && (
                      <Badge variant="secondary">
                        {role === 'customer' ? 'Vendor' : 'Customer'} Selected
                      </Badge>
                    )}
                  </div>
                  
                  {!isSelected && (
                    <Button
                      size="sm"
                      onClick={() => handleSelect(option.id)}
                      disabled={selectingId === option.id || isLoading}
                    >
                      {selectingId === option.id ? 'Selecting...' : 'Select This Option'}
                    </Button>
                  )}
                </div>

                {/* Both Selected - Success */}
                {bothSelected && (
                  <div className="p-3 bg-green-100 rounded-lg flex items-center gap-2 text-green-800">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-medium">
                      Both parties agreed! Dispute will be resolved with this option.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Escalation Option */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-800">Can't agree on an option?</h4>
            <p className="text-sm text-amber-700 mt-1">
              Request escalation to Phase 3 where AI will make a binding decision. 
              You'll have 24 hours to accept or choose external resolution.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3"
              onClick={onRequestEscalation}
              disabled={isLoading}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Request Final AI Decision
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
