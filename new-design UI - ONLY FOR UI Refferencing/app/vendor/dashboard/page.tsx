import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  MessageSquare,
  Plus,
  ChevronRight,
  Eye,
  Heart,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import Link from "next/link"

export default function VendorDashboardPage() {
  const pendingBookings = [
    {
      id: 1,
      customer: "Maria Schmidt",
      service: "Professional Home Cleaning",
      date: "Dec 20, 2025",
      time: "10:00 AM",
      price: "CHF 90",
      duration: "2 hours",
    },
    {
      id: 2,
      customer: "Thomas Weber",
      service: "Deep Cleaning Service",
      date: "Dec 22, 2025",
      time: "2:00 PM",
      price: "CHF 195",
      duration: "3 hours",
    },
  ]

  const upcomingBookings = [
    {
      id: 3,
      customer: "Sophie Müller",
      service: "Professional Home Cleaning",
      date: "Dec 15, 2025",
      time: "9:00 AM",
      status: "confirmed",
    },
    {
      id: 4,
      customer: "Peter Fischer",
      service: "Deep Cleaning Service",
      date: "Dec 16, 2025",
      time: "1:00 PM",
      status: "confirmed",
    },
  ]

  const services = [
    {
      id: 1,
      title: "Professional Home Cleaning",
      status: "active",
      views: 1234,
      favorites: 45,
      bookings: 89,
      rating: 4.9,
    },
    {
      id: 2,
      title: "Deep Cleaning Service",
      status: "active",
      views: 892,
      favorites: 32,
      bookings: 56,
      rating: 4.8,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Swiss Clean Pro</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/vendor/calendar">
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </Link>
            </Button>
            <Button asChild>
              <Link href="/vendor/services/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Service
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">CHF 12,450</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">145</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+8% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <Star className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">4.9</p>
              <p className="text-xs text-muted-foreground">From 234 reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Response Rate</p>
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">98%</p>
              <p className="text-xs text-muted-foreground">Avg. 2 hours</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            {/* Pending Requests */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pending Requests</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Respond within 24 hours</p>
                </div>
                <Badge variant="default">{pendingBookings.length} New</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingBookings.map((booking) => (
                  <Card key={booking.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{booking.customer}</h3>
                            <Badge variant="outline" className="text-xs">
                              New Customer
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{booking.service}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span>{booking.date}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {booking.time} ({booking.duration})
                              </span>
                            </div>
                            <div className="font-semibold text-accent">{booking.price}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <XCircle className="h-4 w-4" />
                            Decline
                          </Button>
                          <Button size="sm" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Accept
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Upcoming Bookings</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/vendor/bookings">
                    View All
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <Card key={booking.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{booking.customer}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{booking.service}</p>
                          <div className="flex items-center gap-4 text-sm">
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
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{booking.status}</Badge>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/vendor/bookings/${booking.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Services</CardTitle>
                <Button asChild>
                  <Link href="/vendor/services/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {services.map((service) => (
                  <Card key={service.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src="/modern-clean-interior.png"
                            alt={service.title}
                            className="w-20 h-20 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{service.title}</h3>
                              <Badge variant={service.status === "active" ? "default" : "secondary"}>
                                {service.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                                <span>{service.views} views</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-muted-foreground" />
                                <span>{service.favorites} saved</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{service.bookings} bookings</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-accent text-accent" />
                                <span className="font-medium">{service.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/services/${service.id}`}>View</Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/vendor/services/${service.id}/edit`}>Edit</Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                  <p className="text-3xl font-bold mb-4">CHF 2,450</p>
                  <Button size="sm" className="w-full">
                    Request Payout
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Pending (In Escrow)</p>
                  <p className="text-3xl font-bold mb-4">CHF 890</p>
                  <p className="text-xs text-muted-foreground">From 12 active bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Earned</p>
                  <p className="text-3xl font-bold mb-4">CHF 45,230</p>
                  <p className="text-xs text-muted-foreground">Since January 2022</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Dec 10, 2025", customer: "Maria Schmidt", amount: "CHF 90", status: "released" },
                    { date: "Dec 8, 2025", customer: "Thomas Weber", amount: "CHF 120", status: "released" },
                    { date: "Dec 5, 2025", customer: "Sophie Müller", amount: "CHF 195", status: "in_escrow" },
                    { date: "Dec 3, 2025", customer: "Peter Fischer", amount: "CHF 90", status: "released" },
                  ].map((transaction, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{transaction.customer}</p>
                        <p className="text-xs text-muted-foreground">{transaction.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{transaction.amount}</p>
                        <Badge
                          variant={transaction.status === "released" ? "default" : "secondary"}
                          className="text-xs mt-1"
                        >
                          {transaction.status === "released" ? "Released" : "In Escrow"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Customer Reviews</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">234 total reviews</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-6 w-6 fill-accent text-accent" />
                      <span className="text-3xl font-bold">4.9</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Average rating</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    customer: "Maria Schmidt",
                    rating: 5,
                    date: "2 weeks ago",
                    comment: "Absolutely professional service! Highly recommend.",
                  },
                  {
                    customer: "Thomas Weber",
                    rating: 5,
                    date: "1 month ago",
                    comment: "Best cleaning service in Zürich.",
                  },
                  {
                    customer: "Sophie Müller",
                    rating: 4,
                    date: "1 month ago",
                    comment: "Very good service overall. One small issue but quickly resolved.",
                  },
                ].map((review, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{review.customer}</p>
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-accent text-accent" />
                          <span className="font-semibold text-sm">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Business Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                    <p className="mt-1">Swiss Clean Pro</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">contact@swisscleanpro.ch</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="mt-1">+41 XX XXX XX XX</p>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { day: "Monday", hours: "8:00 AM - 6:00 PM" },
                    { day: "Tuesday", hours: "8:00 AM - 6:00 PM" },
                    { day: "Wednesday", hours: "8:00 AM - 6:00 PM" },
                    { day: "Thursday", hours: "8:00 AM - 6:00 PM" },
                    { day: "Friday", hours: "8:00 AM - 6:00 PM" },
                    { day: "Saturday", hours: "9:00 AM - 2:00 PM" },
                    { day: "Sunday", hours: "Closed" },
                  ].map((schedule) => (
                    <div key={schedule.day} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{schedule.day}</span>
                      <span className="font-medium">{schedule.hours}</span>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    Edit Hours
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stripe Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">Account Connected</p>
                      <p className="text-xs text-green-800 dark:text-green-200">Payouts enabled</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Manage Stripe Account
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New Booking Requests</p>
                      <p className="text-xs text-muted-foreground">Email & Push</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Booking Confirmations</p>
                      <p className="text-xs text-muted-foreground">Email & Push</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Payment Notifications</p>
                      <p className="text-xs text-muted-foreground">Email only</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">New Reviews</p>
                      <p className="text-xs text-muted-foreground">Email</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
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
