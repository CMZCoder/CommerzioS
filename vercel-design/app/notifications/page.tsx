import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Calendar, MessageSquare, Star, Gift, DollarSign, TrendingUp, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: "booking",
      icon: Calendar,
      title: "Booking Confirmed",
      message: "Your booking with Swiss Clean Pro has been confirmed for Dec 15, 2025 at 10:00 AM.",
      time: "5 minutes ago",
      read: false,
      action: "/bookings/1",
      color: "from-primary to-accent",
    },
    {
      id: 2,
      type: "message",
      icon: MessageSquare,
      title: "New Message",
      message: "AquaFix Switzerland sent you a message about your upcoming service.",
      time: "1 hour ago",
      read: false,
      action: "/messages",
      color: "from-accent to-success",
    },
    {
      id: 3,
      type: "review",
      icon: Star,
      title: "Review Request",
      message: "How was your experience with FitLife Coaching? Leave a review to earn 50 points.",
      time: "3 hours ago",
      read: false,
      action: "/bookings/3",
      color: "from-success to-primary",
    },
    {
      id: 4,
      type: "payment",
      icon: DollarSign,
      title: "Payment Released",
      message: "CHF 90 has been released to Swiss Clean Pro after service completion.",
      time: "5 hours ago",
      read: true,
      action: "/bookings/1",
      color: "from-primary to-accent",
    },
    {
      id: 5,
      type: "reward",
      icon: Gift,
      title: "Points Earned",
      message: "You've earned 100 reward points! Total: 1,250 points (CHF 12.50 value).",
      time: "1 day ago",
      read: true,
      action: "/rewards",
      color: "from-accent to-success",
    },
    {
      id: 6,
      type: "reminder",
      icon: Clock,
      title: "Booking Reminder",
      message: "Your appointment with EduSwiss Tutoring is tomorrow at 2:00 PM.",
      time: "1 day ago",
      read: true,
      action: "/bookings/4",
      color: "from-success to-primary",
    },
  ]

  const systemNotifications = [
    {
      id: 7,
      type: "security",
      icon: Shield,
      title: "Security Update",
      message: "Your account security has been enhanced with two-factor authentication.",
      time: "2 days ago",
      read: true,
      color: "from-primary to-accent",
    },
    {
      id: 8,
      type: "promotion",
      icon: TrendingUp,
      title: "Special Offer",
      message: "Get 20% off your next booking! Limited time offer for premium members.",
      time: "3 days ago",
      read: true,
      color: "from-accent to-success",
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Notifications</h1>
            <p className="text-muted-foreground">
              You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="outline">Mark All as Read</Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              All
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gradient-to-br from-accent to-primary">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {notifications.map((notification) => {
              const Icon = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""} hover:shadow-md transition-all cursor-pointer group`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-gradient-to-br from-accent to-primary rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                          {notification.action && (
                            <Button size="sm" variant="ghost" className="text-primary h-7" asChild>
                              <Link href={notification.action}>View Details</Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {systemNotifications.map((notification) => {
              const Icon = notification.icon
              return (
                <Card key={notification.id} className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-3">
            {notifications
              .filter((n) => n.type === "booking" || n.type === "payment" || n.type === "reminder")
              .map((notification) => {
                const Icon = notification.icon
                return (
                  <Card
                    key={notification.id}
                    className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""} hover:shadow-md transition-all cursor-pointer group`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-gradient-to-br from-accent to-primary rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                            {notification.action && (
                              <Button size="sm" variant="ghost" className="text-primary h-7" asChild>
                                <Link href={notification.action}>View Details</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>

          <TabsContent value="messages" className="space-y-3">
            {notifications
              .filter((n) => n.type === "message" || n.type === "review")
              .map((notification) => {
                const Icon = notification.icon
                return (
                  <Card
                    key={notification.id}
                    className={`${!notification.read ? "border-primary/50 bg-primary/5" : ""} hover:shadow-md transition-all cursor-pointer group`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-gradient-to-br from-accent to-primary rounded-full flex-shrink-0 ml-2"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                            {notification.action && (
                              <Button size="sm" variant="ghost" className="text-primary h-7" asChild>
                                <Link href={notification.action}>View Details</Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </TabsContent>

          <TabsContent value="system" className="space-y-3">
            {systemNotifications.map((notification) => {
              const Icon = notification.icon
              return (
                <Card key={notification.id} className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${notification.color} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>

        {/* Empty State Example */}
        <div className="mt-8 text-center p-8 border-2 border-dashed border-border rounded-2xl hidden">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">You have no new notifications at this time.</p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
