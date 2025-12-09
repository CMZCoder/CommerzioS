import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Star,
  MapPin,
  Clock,
  Shield,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Award,
  TrendingUp,
  Users,
} from "lucide-react"
import Link from "next/link"

export default function ServiceDetailPage() {
  const reviews = [
    {
      id: 1,
      author: "Maria Schmidt",
      rating: 5,
      date: "2 weeks ago",
      comment:
        "Absolutely professional service! Arrived on time, very thorough cleaning, and excellent attention to detail.",
      verified: true,
    },
    {
      id: 2,
      author: "Thomas Weber",
      rating: 5,
      date: "1 month ago",
      comment: "Best cleaning service in Zürich. Been using them for 6 months now. Highly recommend!",
      verified: true,
    },
    {
      id: 3,
      author: "Sophie Müller",
      rating: 4,
      date: "1 month ago",
      comment: "Very good service overall. One small area was missed but they came back to fix it immediately.",
      verified: true,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden">
                <img src="/modern-clean-interior.png" alt="Service" className="w-full h-96 object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge>Featured</Badge>
                  <Badge variant="secondary">Top Rated</Badge>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="icon" variant="secondary">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="relative rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img src="/modern-clean-interior.png" alt={`Gallery ${i}`} className="w-full h-24 object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Service Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">Professional Home Cleaning Service</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="font-semibold text-lg">4.9</span>
                      <span className="text-muted-foreground">(234 reviews)</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      Zürich, Switzerland
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      1,200+ bookings
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">Swiss Clean Pro</h3>
                        <Shield className="h-4 w-4 text-accent" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Verified Vendor · Member since 2022</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/vendor/swiss-clean-pro">View Profile</Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  <TabsTrigger value="about">About Vendor</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-6 mt-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-3">Service Description</h3>
                    <div className="prose prose-sm max-w-none text-muted-foreground">
                      <p className="leading-relaxed mb-4">
                        Experience premium home cleaning services from certified professionals. We provide thorough,
                        eco-friendly cleaning solutions tailored to your needs. Our team uses professional-grade
                        equipment and non-toxic cleaning products safe for children and pets.
                      </p>
                      <p className="leading-relaxed">
                        Every cleaning session includes dusting, vacuuming, mopping, bathroom and kitchen deep cleaning,
                        and more. We're committed to delivering exceptional results every time.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">What's Included</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {[
                        "Complete dusting of all surfaces",
                        "Vacuuming and mopping floors",
                        "Bathroom sanitization",
                        "Kitchen deep cleaning",
                        "Window cleaning (interior)",
                        "Trash removal",
                        "Bed making and linen change",
                        "Eco-friendly products",
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Service Area</h3>
                    <p className="text-muted-foreground mb-4">
                      Available in Zürich city center and surrounding areas (up to 15km radius)
                    </p>
                    <div className="rounded-lg overflow-hidden border border-border h-64 bg-muted flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Standard Cleaning</CardTitle>
                      <p className="text-sm text-muted-foreground">Perfect for regular maintenance</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-bold">CHF 45</span>
                        <span className="text-muted-foreground mb-1">/hour</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Minimum 2 hours
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          All basic cleaning tasks
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Eco-friendly products included
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Deep Cleaning</CardTitle>
                      <p className="text-sm text-muted-foreground">Comprehensive cleaning service</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-bold">CHF 65</span>
                        <span className="text-muted-foreground mb-1">/hour</span>
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Minimum 3 hours
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Includes all standard tasks
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Cabinet & appliance cleaning
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                          Behind furniture cleaning
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews" className="space-y-6 mt-6">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Customer Reviews</h3>
                        <p className="text-muted-foreground">Based on 234 verified bookings</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-6 w-6 fill-accent text-accent" />
                          <span className="text-3xl font-bold">4.9</span>
                        </div>
                        <p className="text-sm text-muted-foreground">out of 5</p>
                      </div>
                    </div>

                    {/* Rating Breakdown */}
                    <Card className="mb-6">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          {[
                            { stars: 5, count: 189, percentage: 81 },
                            { stars: 4, count: 35, percentage: 15 },
                            { stars: 3, count: 8, percentage: 3 },
                            { stars: 2, count: 2, percentage: 1 },
                            { stars: 1, count: 0, percentage: 0 },
                          ].map((rating) => (
                            <div key={rating.stars} className="flex items-center gap-4">
                              <div className="flex items-center gap-1 w-16">
                                <span className="text-sm font-medium">{rating.stars}</span>
                                <Star className="h-3 w-3 fill-accent text-accent" />
                              </div>
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-accent" style={{ width: `${rating.percentage}%` }} />
                              </div>
                              <span className="text-sm text-muted-foreground w-12 text-right">{rating.count}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Individual Reviews */}
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <Card key={review.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback>{review.author[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold">{review.author}</p>
                                    {review.verified && (
                                      <Badge variant="secondary" className="text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{review.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-accent text-accent" />
                                <span className="font-semibold">{review.rating}</span>
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="about" className="space-y-6 mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-4">About Swiss Clean Pro</h3>
                      <p className="text-muted-foreground leading-relaxed mb-6">
                        Swiss Clean Pro is a family-owned cleaning service with over 10 years of experience in Zürich.
                        We pride ourselves on delivering exceptional quality, reliability, and customer satisfaction.
                        All our team members are professionally trained, insured, and background-checked.
                      </p>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Award className="h-8 w-8 mx-auto mb-2 text-accent" />
                          <p className="font-semibold mb-1">Certified</p>
                          <p className="text-xs text-muted-foreground">ISO 9001</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-accent" />
                          <p className="font-semibold mb-1">Top Vendor</p>
                          <p className="text-xs text-muted-foreground">2024</p>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <Users className="h-8 w-8 mx-auto mb-2 text-accent" />
                          <p className="font-semibold mb-1">1,200+</p>
                          <p className="text-xs text-muted-foreground">Happy Clients</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold">CHF 45</span>
                    <span className="text-muted-foreground mb-1">/hour</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Minimum 2 hours booking</p>
                </div>

                <Button size="lg" className="w-full mb-3" asChild>
                  <Link href="/booking/new?service=1">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Now
                  </Link>
                </Button>

                <Button size="lg" variant="outline" className="w-full mb-6 bg-transparent">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact Vendor
                </Button>

                <Separator className="mb-6" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-5 w-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium">Escrow Protection</p>
                      <p className="text-muted-foreground text-xs">Payment held until service confirmed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-5 w-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium">Instant Booking</p>
                      <p className="text-muted-foreground text-xs">Confirmation within minutes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                    <div>
                      <p className="font-medium">Satisfaction Guarantee</p>
                      <p className="text-muted-foreground text-xs">98% customer satisfaction rate</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Share this service</h4>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="flex-1 bg-transparent">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="flex-1 bg-transparent">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
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
