/**
 * BookingRequestForm Component
 * 
 * Form for customers to submit booking requests
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookingCalendar } from './BookingCalendar';
import { PricingSelector } from '../pricing/PricingSelector';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Phone, MapPin, MessageSquare, Calendar, Check } from 'lucide-react';

interface PricingOption {
  id: string;
  serviceId: string;
  label: string;
  description: string | null;
  price: string;
  currency: string;
  billingInterval: string;
  durationMinutes: number | null;
  sortOrder: number;
  isActive: boolean;
}

interface BookingRequestFormProps {
  serviceId: string;
  serviceName: string;
  vendorId: string;
  onSuccess?: (booking: unknown) => void;
  onCancel?: () => void;
}

export function BookingRequestForm({
  serviceId,
  serviceName,
  vendorId: _vendorId,
  onSuccess,
  onCancel,
}: BookingRequestFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<PricingOption | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [formData, setFormData] = useState({
    customerMessage: '',
    customerPhone: '',
    customerAddress: '',
  });

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSlot) throw new Error('Please select a time slot');

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          pricingOptionId: selectedOption?.id,
          requestedStartTime: selectedSlot.start.toISOString(),
          requestedEndTime: selectedSlot.end.toISOString(),
          customerMessage: formData.customerMessage,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create booking');
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking request sent!');
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleNext = () => {
    if (step === 1 && !selectedSlot) {
      toast.error('Please select a date and time');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    createBookingMutation.mutate();
  };

  const formatPrice = (price: string, currency: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
    }).format(parseFloat(price));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Book {serviceName}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={step >= 1 ? 'text-primary font-medium' : ''}>1. Time</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-primary font-medium' : ''}>2. Package</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-primary font-medium' : ''}>3. Details</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Date & Time Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <BookingCalendar
              serviceId={serviceId}
              durationMinutes={selectedOption?.durationMinutes || 60}
              selectedSlot={selectedSlot}
              onSelectSlot={setSelectedSlot}
            />
          </div>
        )}

        {/* Step 2: Pricing Option Selection */}
        {step === 2 && (
          <div className="space-y-4">
            <PricingSelector
              serviceId={serviceId}
              selectedOptionId={selectedOption?.id || null}
              onSelect={setSelectedOption}
            />
            
            {!selectedOption && (
              <p className="text-sm text-muted-foreground text-center">
                Select a package to continue, or skip if not applicable
              </p>
            )}
          </div>
        )}

        {/* Step 3: Contact Details & Message */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Booking Summary
              </h4>
              {selectedSlot && (
                <p className="text-sm">
                  {format(selectedSlot.start, 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(selectedSlot.start, 'HH:mm')} - {format(selectedSlot.end, 'HH:mm')}
                </p>
              )}
              {selectedOption && (
                <p className="text-sm">
                  Package: {selectedOption.label} ({formatPrice(selectedOption.price, selectedOption.currency)})
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+41 XX XXX XX XX"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Service Address (if applicable)
                </Label>
                <Input
                  id="address"
                  placeholder="Where should the service be provided?"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Message to Vendor
                </Label>
                <Textarea
                  id="message"
                  placeholder="Any special requests or details the vendor should know?"
                  rows={4}
                  value={formData.customerMessage}
                  onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}

        {step < 3 ? (
          <Button onClick={handleNext}>
            {step === 2 && !selectedOption ? 'Skip & Continue' : 'Continue'}
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={createBookingMutation.isPending}
          >
            {createBookingMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Request Booking
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default BookingRequestForm;

