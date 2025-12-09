import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
  MessageCircle, Star, MapPin, User, Briefcase, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-violet-100 text-violet-700", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function UI2MyBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: customerBookings, isLoading: customerLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings/customer"],
    enabled: !!user,
  });

  const { data: vendorBookings, isLoading: vendorLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings/vendor"],
    enabled: !!user,
  });

  const isVendor = user?.services?.length > 0;

  const filteredBookings = (bookings: any[] | undefined) => {
    if (!bookings) return [];
    let filtered = bookings;
    if (activeTab !== "all") {
      filtered = filtered.filter(b => b.status === activeTab);
    }
    if (searchQuery) {
      filtered = filtered.filter(b => 
        b.service?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const BookingCard = ({ booking, isVendorView = false }: { booking: any; isVendorView?: boolean }) => {
    const status = statusConfig[booking.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const otherParty = isVendorView ? booking.customer : booking.vendor;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
      >
        <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer">
          <CardContent className="p-0">
            <div className="flex">
              {/* Image */}
              <div className="w-32 h-32 shrink-0 bg-slate-200">
                {booking.service?.images?.[0] ? (
                  <img
                    src={booking.service.images[0]}
                    alt={booking.service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    <h3 className="font-semibold mt-2 line-clamp-1">
                      {booking.service?.title || "Service Booking"}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-600">CHF {booking.totalPrice || booking.service?.price || "50"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(booking.scheduledDate || booking.createdAt).toLocaleDateString()}
                  </div>
                  {booking.scheduledTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {booking.scheduledTime}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={otherParty?.profileImage} />
                      <AvatarFallback className="text-xs">{otherParty?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{otherParty?.name || "User"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/ui2/chat?booking=${booking.id}`}>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Message
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your bookings.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">Manage your service bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: (customerBookings?.length || 0) + (vendorBookings?.length || 0), color: "bg-slate-100 text-slate-700" },
          { label: "Pending", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "pending").length, color: "bg-yellow-100 text-yellow-700" },
          { label: "Confirmed", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "confirmed").length, color: "bg-blue-100 text-blue-700" },
          { label: "Completed", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "completed").length, color: "bg-green-100 text-green-700" },
        ].map((stat, i) => (
          <Card key={i} className={`p-4 ${stat.color}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings Tabs */}
      <Tabs defaultValue="customer">
        <TabsList className="mb-6">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            As Customer
            <Badge variant="secondary">{customerBookings?.length || 0}</Badge>
          </TabsTrigger>
          {isVendor && (
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              As Vendor
              <Badge variant="secondary">{vendorBookings?.length || 0}</Badge>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="customer">
          {customerLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-32 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filteredBookings(customerBookings).length > 0 ? (
            <div className="space-y-4">
              {filteredBookings(customerBookings).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || activeTab !== "all" 
                  ? "Try adjusting your filters" 
                  : "Browse services and make your first booking"}
              </p>
              <Link href="/ui2/search">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  Browse Services
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendor">
          {vendorLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-32 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : filteredBookings(vendorBookings).length > 0 ? (
            <div className="space-y-4">
              {filteredBookings(vendorBookings).map((booking) => (
                <BookingCard key={booking.id} booking={booking} isVendorView />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No vendor bookings</h3>
              <p className="text-muted-foreground mb-4">
                You haven't received any bookings for your services yet.
              </p>
              <Link href="/ui2/profile?tab=services">
                <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                  Manage Services
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
