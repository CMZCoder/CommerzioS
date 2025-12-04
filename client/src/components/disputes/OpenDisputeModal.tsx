/**
 * OpenDisputeModal Component
 * 
 * Modal for opening a new dispute on a booking
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  AlertTriangle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenDisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingNumber?: string;
  serviceName?: string;
  escrowAmount?: number;
  onSubmit: (data: {
    reason: string;
    description: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const DISPUTE_REASONS = [
  { 
    value: 'service_not_provided', 
    label: 'Service Not Provided',
    description: 'The vendor did not show up or provide the service'
  },
  { 
    value: 'poor_quality', 
    label: 'Poor Quality',
    description: 'The service quality was significantly below expectations'
  },
  { 
    value: 'wrong_service', 
    label: 'Wrong Service',
    description: 'A different service was provided than what was booked'
  },
  { 
    value: 'overcharged', 
    label: 'Overcharged',
    description: 'I was charged more than the agreed price'
  },
  { 
    value: 'no_show', 
    label: 'Customer No Show',
    description: 'The customer did not show up for the appointment'
  },
  { 
    value: 'other', 
    label: 'Other',
    description: 'Other issue not listed above'
  },
];

export function OpenDisputeModal({
  open,
  onOpenChange,
  bookingId,
  bookingNumber,
  serviceName,
  escrowAmount,
  onSubmit,
  isLoading,
}: OpenDisputeModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (!description.trim() || description.trim().length < 20) {
      setError('Please provide a detailed description (at least 20 characters)');
      return;
    }

    try {
      await onSubmit({ reason, description: description.trim() });
      // Reset form
      setReason('');
      setDescription('');
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to open dispute');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setDescription('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Open a Dispute
          </DialogTitle>
          <DialogDescription>
            {bookingNumber && (
              <span className="block">Booking #{bookingNumber}</span>
            )}
            {serviceName && (
              <span className="block">{serviceName}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Before opening a dispute:</p>
                <ul className="mt-1 space-y-1 text-amber-700">
                  <li>• Try to resolve the issue directly with the other party first</li>
                  <li>• Disputes go through a 3-phase resolution process</li>
                  <li>• You'll have 7 days to negotiate before AI mediation</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Escrow Amount */}
          {escrowAmount !== undefined && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Amount in Escrow</p>
              <p className="text-lg font-bold">CHF {escrowAmount.toFixed(2)}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>What is the issue?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              <div className="space-y-2">
                {DISPUTE_REASONS.map((r) => (
                  <div 
                    key={r.value}
                    className={cn(
                      'flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      reason === r.value 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted'
                    )}
                    onClick={() => setReason(r.value)}
                  >
                    <RadioGroupItem value={r.value} id={r.value} className="mt-0.5" />
                    <Label 
                      htmlFor={r.value} 
                      className="cursor-pointer flex-1"
                    >
                      <span className="font-medium">{r.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {r.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Describe the issue in detail <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide specific details about what happened, including dates, times, and any attempts to resolve the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? 'Opening Dispute...' : 'Open Dispute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
