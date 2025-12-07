import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  Clock,
  Star,
  Gift,
  Heart,
  MessageSquare,
  TrendingUp,
  Award,
  CreditCard,
  MapPin,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const upcomingBookings = [
    {
      id: 1,
      service: "Professional Home Cleaning",
      vendor: "Swiss Clean Pro",
      date: "Dec 15, 2025",
      time: "10:00 AM",
      status: "confirmed",
      price: "CHF 90",
    },
    {
      id: 2,
      service: "Plumbing Repair",
      vendor: "AquaFix Switzerland",
      date: "Dec 18, 2025",
      time: "2:00 PM",
      status: "pending",
      price: "CHF 120",
    },
  ]

  const recentBookings = [
    {
      id: 3,
      service: "Personal Training Session",
      vendor: "FitLife Coaching",
      date: "Nov 28, 2025",
      status: "completed",
      rating: 5,
      needsReview: false,
    },
    {
      id: 4,
      service: "Math Tutoring",
      vendor: "EduSwiss Tutoring",
      date: "Nov 25, 2025",
      status: "completed",
      rating: null,
      needsReview: true,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Welcome back, Maria</h1>
          <p className="text-muted-foreground">Manage your bookings and explore new services</p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Calendar className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reward Points</p>
                  <p className="text-2xl font-bold">1,250</p>
                </div>
                <Gift className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Saved Services</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
                <Heart className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Messages</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Upcoming Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Bookings</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/bookings">
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{booking.service}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{booking.vendor}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.date}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{booking.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end">
                          <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>
                            {booking.status}
                          </Badge>
                          <span className="font-bold">{booking.price}</span>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/bookings/${booking.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentBookings.map((booking) => (
                  <Card key={booking.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{booking.service}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{booking.vendor}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{booking.date}</span>
                            {booking.rating && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-accent text-accent" />
                                  <span className="text-sm font-medium">{booking.rating}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {booking.needsReview ? (
                          <Button size="sm" variant="default">
                            Leave Review
                          </Button>
                        ) : (
                          <Badge variant="outline">Reviewed</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Saved Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <img
                            src="/modern-clean-interior.png"
                            alt="Service"
                            className="w-20 h-20 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 line-clamp-2">Professional Home Cleaning</h3>
                            <p className="text-sm text-muted-foreground mb-2">Swiss Clean Pro</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-accent text-accent" />
                                <span className="text-sm font-medium">4.9</span>
                              </div>
                              <Button size="sm" variant="outline">
                                Book
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reward Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-3xl font-bold mb-1">1,250 Points</p>
                    <p className="text-sm text-muted-foreground">Worth CHF 12.50 in discounts</p>
                  </div>
                  <Button asChild>
                    <Link href="/rewards/redeem">Redeem</Link>
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Ways to Earn More</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium">Complete a booking</p>
                          <p className="text-xs text-muted-foreground">Earn 50 points</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href="/services">Browse</Link>
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-sm font-medium">Refer a friend</p>
                          <p className="text-xs text-muted-foreground">Earn 200 points</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <Link href="/referrals">Share</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">Share your unique code and earn rewards</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-muted rounded-lg p-3 font-mono font-semibold text-center">MARIA2025</div>
                  <Button variant="outline">Copy</Button>
                </div>
                <div className="mt-6 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Referrals</span>
                    <span className="font-semibold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Points Earned</span>
                    <span className="font-semibold">1,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-xl">MS</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      Change Photo
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="mt-1">Maria Schmidt</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">maria.schmidt@email.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="mt-1">+41 XX XXX XX XX</p>
                  </div>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Visa •••• 1234</p>
                        <p className="text-xs text-muted-foreground">Expires 12/26</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Add Payment Method
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Addresses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">Home</p>
                        <p className="text-xs text-muted-foreground">Bahnhofstrasse 1, 8001 Zürich</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Default</Badge>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Add Address
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Booking updates and offers</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Real-time updates</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Marketing Emails</p>
                      <p className="text-xs text-muted-foreground">New services and promotions</p>
                    </div>
                    <input type="checkbox" className="rounded" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
