import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  MoreVertical,
  Eye,
  Ban,
  RefreshCw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function AdminDashboardPage() {
  const disputes = [
    {
      id: 1,
      booking: "#B12345",
      customer: "Maria Schmidt",
      vendor: "Swiss Clean Pro",
      amount: "CHF 90",
      reason: "Service not completed",
      status: "open",
      date: "Dec 10, 2025",
    },
    {
      id: 2,
      booking: "#B12344",
      customer: "Thomas Weber",
      vendor: "AquaFix Switzerland",
      amount: "CHF 120",
      reason: "Poor quality",
      status: "under_review",
      date: "Dec 9, 2025",
    },
  ]

  const pendingServices = [
    {
      id: 1,
      title: "Emergency Plumbing Service",
      vendor: "QuickFix Plumbing",
      category: "Home Services",
      submitted: "2 days ago",
    },
    {
      id: 2,
      title: "Professional Photography",
      vendor: "Alpine Captures",
      category: "Events",
      submitted: "1 day ago",
    },
  ]

  const recentUsers = [
    { id: 1, name: "Anna Müller", email: "anna.m@email.com", type: "Customer", status: "active", joined: "Dec 10" },
    { id: 2, name: "Peter Klein", email: "peter.k@email.com", type: "Vendor", status: "active", joined: "Dec 9" },
    { id: 3, name: "Lisa Weber", email: "lisa.w@email.com", type: "Customer", status: "suspended", joined: "Dec 8" },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform management and oversight</p>
          </div>
          <Badge variant="destructive" className="gap-2">
            <Shield className="h-3 w-3" />
            Admin Access
          </Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Total Users</p>
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">55,234</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+234 this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Active Services</p>
                <ShoppingBag className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">5,432</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+45 this week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Platform Revenue</p>
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">CHF 145K</p>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <TrendingUp className="h-3 w-3" />
                <span>+12% vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Open Disputes</p>
                <AlertTriangle className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold mb-1">12</p>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <RefreshCw className="h-3 w-3" />
                <span>Requires attention</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="disputes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="services">Service Moderation</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="escrow">Escrow Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="disputes" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Active Disputes</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Requires immediate review</p>
                </div>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Disputes</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {disputes.map((dispute) => (
                  <Card key={dispute.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {dispute.booking}
                            </Badge>
                            <Badge
                              variant={
                                dispute.status === "open"
                                  ? "destructive"
                                  : dispute.status === "under_review"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {dispute.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-2 text-sm mb-2">
                            <div>
                              <span className="text-muted-foreground">Customer: </span>
                              <span className="font-medium">{dispute.customer}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Vendor: </span>
                              <span className="font-medium">{dispute.vendor}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Reason: </span>
                              <span>{dispute.reason}</span>
                            </div>
                            <div className="font-semibold text-accent">{dispute.amount}</div>
                            <div className="text-muted-foreground">{dispute.date}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild className="bg-transparent">
                            <Link href={`/admin/disputes/${dispute.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Link>
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
                <div>
                  <CardTitle>Pending Service Approvals</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Review and moderate new services</p>
                </div>
                <Badge variant="default">{pendingServices.length} Pending</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingServices.map((service) => (
                  <Card key={service.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1">{service.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{service.vendor}</p>
                            <div className="flex items-center gap-3 text-sm">
                              <Badge variant="secondary">{service.category}</Badge>
                              <span className="text-muted-foreground">Submitted {service.submitted}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button size="sm" className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search services..." className="pl-10" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src="/modern-clean-interior.png"
                          alt="Service"
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">Professional Home Cleaning</p>
                          <p className="text-xs text-muted-foreground">Swiss Clean Pro</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Active</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>Pause Service</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-10" />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="vendors">Vendors</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {user.type}
                          </Badge>
                          <Badge
                            variant={user.status === "active" ? "default" : "destructive"}
                            className="text-xs capitalize"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>View Activity</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Warn User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-amber-600">
                            <Ban className="h-4 w-4 mr-2" />
                            Suspend Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escrow" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total in Escrow</p>
                  <p className="text-3xl font-bold">CHF 45,230</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Auto-Release Pending</p>
                  <p className="text-3xl font-bold">CHF 12,450</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Disputed Amounts</p>
                  <p className="text-3xl font-bold">CHF 2,890</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Escrow Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      id: "#E12345",
                      customer: "Maria Schmidt",
                      vendor: "Swiss Clean Pro",
                      amount: "CHF 90",
                      status: "held",
                      autoRelease: "Dec 17",
                    },
                    {
                      id: "#E12344",
                      customer: "Thomas Weber",
                      vendor: "AquaFix",
                      amount: "CHF 120",
                      status: "disputed",
                      autoRelease: "-",
                    },
                    {
                      id: "#E12343",
                      customer: "Sophie Müller",
                      vendor: "FitLife",
                      amount: "CHF 60",
                      status: "released",
                      autoRelease: "-",
                    },
                  ].map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1 grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Transaction ID</p>
                          <p className="font-mono font-semibold text-sm">{transaction.id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Customer → Vendor</p>
                          <p className="text-sm">
                            {transaction.customer} → {transaction.vendor}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="font-semibold text-sm">{transaction.amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Status</p>
                          <Badge
                            variant={
                              transaction.status === "released"
                                ? "default"
                                : transaction.status === "disputed"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Total Bookings</p>
                  <p className="text-2xl font-bold mb-1">24,532</p>
                  <p className="text-xs text-muted-foreground">+1,234 this month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Completion Rate</p>
                  <p className="text-2xl font-bold mb-1">96.5%</p>
                  <p className="text-xs text-muted-foreground">+0.5% vs last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Avg. Booking Value</p>
                  <p className="text-2xl font-bold mb-1">CHF 125</p>
                  <p className="text-xs text-muted-foreground">+CHF 5 vs last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground mb-2">Dispute Rate</p>
                  <p className="text-2xl font-bold mb-1">0.8%</p>
                  <p className="text-xs text-muted-foreground">-0.1% vs last month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Vendor Response Rate</span>
                      <span className="text-sm font-bold">98%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: "98%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Customer Satisfaction</span>
                      <span className="text-sm font-bold">4.8/5</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: "96%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Service Quality Score</span>
                      <span className="text-sm font-bold">94%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: "94%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Payment Success Rate</span>
                      <span className="text-sm font-bold">99.5%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: "99.5%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Home Services", bookings: 5432, percentage: 28 },
                      { name: "Health & Wellness", bookings: 3821, percentage: 19 },
                      { name: "Education", bookings: 3124, percentage: 16 },
                      { name: "Events", bookings: 2543, percentage: 13 },
                    ].map((category) => (
                      <div key={category.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">{category.bookings} bookings</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${category.percentage * 2}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Swiss Clean Pro", revenue: "CHF 12,450", rating: 4.9 },
                      { name: "AquaFix Switzerland", revenue: "CHF 10,230", rating: 4.8 },
                      { name: "FitLife Coaching", revenue: "CHF 8,940", rating: 5.0 },
                      { name: "EduSwiss Tutoring", revenue: "CHF 7,650", rating: 4.9 },
                    ].map((vendor) => (
                      <div key={vendor.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{vendor.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{vendor.revenue}</span>
                            <span className="text-xs">•</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs">⭐</span>
                              <span className="text-xs font-medium">{vendor.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
