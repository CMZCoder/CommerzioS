import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, addDays } from "date-fns";
import {
  Calendar, Clock, MapPin, CreditCard, CheckCircle, ArrowLeft,
  ChevronRight, Shield, Star, MessageCircle, Info, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

export default function UI2BookService() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [address, setAddress] = useState("");

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: service, isLoading } = useQuery<any>({
    queryKey: ["/api/services", id],
    queryFn: () => apiRequest(`/api/services/${id}`),
    enabled: !!id,
  });

  const createBooking = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/bookings", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (booking) => {
      toast({
        title: "Booking Confirmed!",
        description: "Your booking has been submitted successfully.",
      });
      navigate(`/ui2/my-bookings`);
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select a date and time for your booking.",
        variant: "destructive",
      });
      return;
    }

    createBooking.mutate({
      serviceId: parseInt(id!),
      scheduledDate: format(selectedDate, "yyyy-MM-dd"),
      scheduledTime: selectedTime,
      notes,
      address,
      paymentMethod,
    });
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to book a service.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-96 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Service Not Found</h1>
        <p className="text-muted-foreground mb-4">This service doesn't exist or has been removed.</p>
        <Link href="/ui2/search">
          <Button>Browse Services</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/ui2/service/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Book Service</h1>
          <p className="text-muted-foreground">Complete your booking</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[
          { num: 1, label: "Schedule" },
          { num: 2, label: "Details" },
          { num: 3, label: "Payment" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                step >= s.num
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
                {s.num}
              </span>
              <span className="font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < 2 && <ChevronRight className="w-5 h-5 text-slate-300 mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Step 1: Schedule */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-violet-600" />
                    Select Date & Time
                  </CardTitle>
                  <CardDescription>Choose your preferred appointment slot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="mb-3 block">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <Calendar className="w-4 h-4 mr-2" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="mb-3 block">Time Slot</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          className={selectedTime === time ? "bg-violet-600" : ""}
                          onClick={() => setSelectedTime(time)}
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(2)}
                  >
                    Continue
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-violet-600" />
                    Service Details
                  </CardTitle>
                  <CardDescription>Provide additional information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="address">Service Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter the address where the service will be performed"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Special Instructions (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Any specific requirements or instructions for the service provider..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                      onClick={() => setStep(3)}
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-violet-600" />
                    Payment Method
                  </CardTitle>
                  <CardDescription>Choose how you'd like to pay</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="space-y-3">
                      {[
                        { value: "card", label: "Credit/Debit Card", desc: "Pay securely with your card" },
                        { value: "twint", label: "TWINT", desc: "Pay with Swiss mobile payment" },
                        { value: "cash", label: "Cash", desc: "Pay in person after service" },
                      ].map((method) => (
                        <Label
                          key={method.value}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                            paymentMethod === method.value
                              ? "border-violet-600 bg-violet-50"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <RadioGroupItem value={method.value} />
                          <div>
                            <p className="font-medium">{method.label}</p>
                            <p className="text-sm text-muted-foreground">{method.desc}</p>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Secure Payment</p>
                        <p className="text-xs text-muted-foreground">
                          Your payment is protected by our escrow system. Funds are only released to the provider after service completion.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600"
                      onClick={handleSubmit}
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? "Processing..." : "Confirm Booking"}
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar - Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Service Info */}
              <div className="flex gap-3">
                <div className="w-20 h-20 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                  {service.images?.[0] ? (
                    <img
                      src={service.images[0]}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No image
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-2">{service.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{service.avgRating?.toFixed(1) || "5.0"}</span>
                    <span>({service.reviewCount || 0})</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Provider */}
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={service.user?.profileImage} />
                  <AvatarFallback>{service.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{service.user?.name}</p>
                  <p className="text-xs text-muted-foreground">Service Provider</p>
                </div>
              </div>

              <Separator />

              {/* Booking Details */}
              {selectedDate && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{format(selectedDate, "PPP")}</span>
                  </div>
                  {selectedTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service Price</span>
                  <span>CHF {service.price || service.basePrice || "50"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>CHF 5.00</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span className="text-violet-600">
                    CHF {((parseFloat(service.price || service.basePrice || "50") + 5)).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Need Help */}
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-violet-600" />
                  <span>Questions? <Link href={`/ui2/chat`}><a className="text-violet-600 hover:underline">Message the provider</a></Link></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
