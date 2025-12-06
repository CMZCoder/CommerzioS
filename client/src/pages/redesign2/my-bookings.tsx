import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Briefcase, User, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-300", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-500/20 text-blue-300", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-purple-500/20 text-purple-300", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-500/20 text-green-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-500/20 text-red-300", icon: XCircle },
};

export default function Redesign2MyBookings() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: customerBookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings/customer"],
    enabled: !!user,
  });
  const { data: vendorBookings } = useQuery<any[]>({
    queryKey: ["/api/bookings/vendor"],
    enabled: !!user,
  });

  const filteredBookings = (bookings: any[] | undefined) => {
    if (!bookings) return [];
    let filtered = bookings;
    if (activeTab !== "all") filtered = filtered.filter(b => b.status === activeTab);
    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.service?.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const BookingCard = ({ booking, isVendorView = false }: { booking: any; isVendorView?: boolean }) => {
    const status = statusConfig[booking.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const otherParty = isVendorView ? booking.customer : booking.vendor;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
        <Card className="overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/30 transition-all">
          <CardContent className="p-0">
            <div className="flex">
              <div className="w-32 h-32 shrink-0 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                {booking.service?.images?.[0] ? (
                  <img src={booking.service.images[0]} alt={booking.service.title} className="w-full h-full object-cover opacity-80" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-white/20" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={`${status.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    <h3 className="font-semibold text-white mt-2 line-clamp-1">{booking.service?.title || "Service Booking"}</h3>
                  </div>
                  <p className="font-bold text-purple-400">CHF {booking.totalPrice || booking.service?.price || "50"}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/50">
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
                    <Avatar className="w-6 h-6 border border-white/20">
                      <AvatarImage src={otherParty?.profileImage} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-purple-500 to-pink-500 text-white">{otherParty?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-white/60">{otherParty?.name || "User"}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Message
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
        <Calendar className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Please Sign In</h1>
        <p className="text-white/50 mb-4">You need to be logged in to view your bookings.</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
        <p className="text-white/50">Manage your service bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: (customerBookings?.length || 0) + (vendorBookings?.length || 0), color: "from-slate-500/20 to-zinc-500/20" },
          { label: "Pending", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "pending").length, color: "from-yellow-500/20 to-orange-500/20" },
          { label: "Confirmed", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "confirmed").length, color: "from-blue-500/20 to-cyan-500/20" },
          { label: "Completed", value: [...(customerBookings || []), ...(vendorBookings || [])].filter(b => b.status === "completed").length, color: "from-green-500/20 to-emerald-500/20" },
        ].map((stat, i) => (
          <Card key={i} className={`p-4 backdrop-blur-xl bg-gradient-to-br ${stat.color} border-white/10`}>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-white/50">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Search bookings..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1 p-1 backdrop-blur-xl bg-white/5 rounded-xl border border-white/10">
          {["all", "pending", "confirmed", "completed"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "secondary" : "ghost"}
              size="sm"
              className={activeTab === tab ? "bg-purple-500/20 text-purple-300" : "text-white/50 hover:text-white"}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings */}
      <Tabs defaultValue="customer">
        <TabsList className="mb-6 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger value="customer" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">
            <User className="w-4 h-4 mr-2" />
            As Customer
            <Badge className="ml-2 bg-white/10 text-white/70">{customerBookings?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="vendor" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">
            <Briefcase className="w-4 h-4 mr-2" />
            As Vendor
            <Badge className="ml-2 bg-white/10 text-white/70">{vendorBookings?.length || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Card key={i} className="h-32 animate-pulse bg-white/5 border-white/10" />)}
            </div>
          ) : filteredBookings(customerBookings).length > 0 ? (
            <div className="space-y-4">
              {filteredBookings(customerBookings).map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Calendar className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No bookings found</h3>
              <p className="text-white/50 mb-4">Browse services and make your first booking</p>
              <Link href="/redesign2/search">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Browse Services</Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendor">
          {filteredBookings(vendorBookings).length > 0 ? (
            <div className="space-y-4">
              {filteredBookings(vendorBookings).map((booking) => <BookingCard key={booking.id} booking={booking} isVendorView />)}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Briefcase className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No vendor bookings</h3>
              <p className="text-white/50">You haven't received any bookings for your services yet.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
