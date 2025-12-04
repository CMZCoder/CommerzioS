/**
 * CounterOfferForm Component
 * 
 * Form for proposing a refund percentage during Phase 1 negotiation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, Send, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterOfferFormProps {
  escrowAmount: number;
  currency?: string;
  role: 'customer' | 'vendor';
  lastOffer?: {
    percent: number;
    byRole: 'customer' | 'vendor';
  } | null;
  onSubmit: (percent: number, message?: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function CounterOfferForm({
  escrowAmount,
  currency = 'CHF',
  role,
  lastOffer,
  onSubmit,
  isLoading,
  className,
}: CounterOfferFormProps) {
  const [percent, setPercent] = useState(lastOffer ? lastOffer.percent : 50);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const customerAmount = (escrowAmount * percent / 100).toFixed(2);
  const vendorAmount = (escrowAmount * (100 - percent) / 100).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit(percent, message || undefined);
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit counter-offer');
    }
  };

  // Quick select presets
  const presets = role === 'customer' 
    ? [
        { label: 'Full Refund', percent: 100 },
        { label: '75%', percent: 75 },
        { label: '50%', percent: 50 },
        { label: '25%', percent: 25 },
      ]
    : [
        { label: 'Full Payment', percent: 0 },
        { label: '25% Refund', percent: 25 },
        { label: '50% Refund', percent: 50 },
        { label: '75% Refund', percent: 75 },
      ];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Make a Counter-Offer
        </CardTitle>
        <CardDescription>
          {role === 'customer' 
            ? 'Propose how much of the escrow should be refunded to you'
            : 'Propose how much of the escrow the customer should receive'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Last Offer Info */}
          {lastOffer && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <span className="text-muted-foreground">Last offer by {lastOffer.byRole}:</span>
              <span className="font-medium ml-2">
                {lastOffer.percent}% to customer ({currency} {(escrowAmount * lastOffer.percent / 100).toFixed(2)})
              </span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.percent}
                  type="button"
                  variant={percent === preset.percent ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPercent(preset.percent)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <Label>Refund Percentage: {percent}%</Label>
            <Slider
              value={[percent]}
              onValueChange={(values) => setPercent(values[0])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            
            {/* Split Visualization */}
            <div className="flex gap-2 h-8">
              <div 
                className="bg-green-500 rounded-l-lg flex items-center justify-center text-white text-xs font-medium transition-all"
                style={{ width: `${percent}%` }}
              >
                {percent >= 20 && `Customer: ${percent}%`}
              </div>
              <div 
                className="bg-blue-500 rounded-r-lg flex items-center justify-center text-white text-xs font-medium transition-all"
                style={{ width: `${100 - percent}%` }}
              >
                {(100 - percent) >= 20 && `Vendor: ${100 - percent}%`}
              </div>
            </div>

            {/* Amount Display */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Customer Receives</p>
                <p className="text-lg font-bold text-green-700">{currency} {customerAmount}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Vendor Receives</p>
                <p className="text-lg font-bold text-blue-700">{currency} {vendorAmount}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Explain your reasoning for this offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              'Sending...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Counter-Offer
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
