"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Clock, CreditCard, Shield, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function BookingPage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState("card")

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Date & Time" },
              { num: 2, label: "Details" },
              { num: 3, label: "Payment" },
              { num: 4, label: "Confirm" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                      step >= s.num ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className="text-sm font-medium text-center">{s.label}</span>
                </div>
                {i < 3 && <div className={`h-px flex-1 ${step > s.num ? "bg-primary" : "bg-muted"}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date & Time</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Choose a date</Label>
                      <div className="flex justify-center">
                        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
                      </div>
                    </div>

                    <div>
                      <Label className="mb-3 block">Select time slot</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map(
                          (time) => (
                            <Button key={time} variant="outline" className="justify-center bg-transparent">
                              <Clock className="h-4 w-4 mr-2" />
                              {time}
                            </Button>
                          ),
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Select defaultValue="2">
                        <SelectTrigger id="duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 hours (minimum)</SelectItem>
                          <SelectItem value="3">3 hours</SelectItem>
                          <SelectItem value="4">4 hours</SelectItem>
                          <SelectItem value="5">5 hours</SelectItem>
                          <SelectItem value="6">6 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Service Address</Label>
                    <Input id="address" placeholder="Enter your address" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" placeholder="Zürich" />
                    </div>
                    <div>
                      <Label htmlFor="postal">Postal Code</Label>
                      <Input id="postal" placeholder="8001" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input id="phone" type="tel" placeholder="+41 XX XXX XX XX" />
                  </div>

                  <div>
                    <Label htmlFor="notes">Special Instructions (Optional)</Label>
                    <Textarea id="notes" placeholder="Any special requirements or notes for the vendor..." rows={4} />
                  </div>

                  <div>
                    <Label>Service Options</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Bring cleaning supplies (+CHF 15)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Window cleaning (+CHF 25)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">Laundry service (+CHF 20)</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold mb-1">Credit / Debit Card</p>
                                <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                              </div>
                              <Badge variant="secondary">Recommended</Badge>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="twint" id="twint" />
                          <Label htmlFor="twint" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold mb-1">TWINT</p>
                                <p className="text-sm text-muted-foreground">Swiss mobile payment</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold mb-1">Cash</p>
                                <p className="text-sm text-muted-foreground">Pay directly to vendor</p>
                              </div>
                            </div>
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t border-border">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input id="cvv" placeholder="123" />
                        </div>
                      </div>
                    </div>
                  )}

                  <Card className="bg-muted/50 border-none">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Secure Escrow Payment</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Your payment is held securely and only released to the vendor after you confirm service
                            completion. Full refund available through our dispute resolution process.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            )}

            {step === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review & Confirm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span className="font-medium">Professional Home Cleaning</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">Monday, December 15, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="font-medium">10:00 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">2 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="font-medium text-right">Bahnhofstrasse 1, 8001 Zürich</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Payment Method</h3>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Visa ending in 1234</span>
                    </div>
                  </div>

                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">Cancellation Policy</p>
                          <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed">
                            Free cancellation up to 24 hours before the scheduled time. Cancellations within 24 hours
                            may incur a 50% fee.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" className="mt-1 rounded" />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} className="flex-1">
                  Continue
                </Button>
              ) : (
                <Button className="flex-1">
                  <Shield className="mr-2 h-5 w-5" />
                  Confirm & Pay
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src="/modern-clean-interior.png"
                    alt="Service"
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">Professional Home Cleaning Service</h3>
                    <p className="text-xs text-muted-foreground">Swiss Clean Pro</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service (2 hours)</span>
                    <span className="font-medium">CHF 90.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span className="font-medium">CHF 4.50</span>
                  </div>
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>First booking discount</span>
                    <span className="font-medium">-CHF 10.00</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>CHF 84.50</span>
                </div>

                <Card className="bg-muted/50 border-none">
                  <CardContent className="p-3">
                    <div className="flex gap-2 text-xs">
                      <Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground leading-relaxed">
                        Payment held in escrow until service completion
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                    Instant booking confirmation
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                    24/7 customer support
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-accent" />
                    Satisfaction guaranteed
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
