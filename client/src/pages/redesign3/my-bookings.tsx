import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, User, MessageCircle, Star, CheckCircle, XCircle, AlertCircle, Filter, ChevronDown, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "PENDING", icon: Clock, color: "bg-yellow-400/20 text-yellow-400 border-yellow-500/30" },
  confirmed: { label: "CONFIRMED", icon: CheckCircle, color: "bg-cyan-400/20 text-cyan-400 border-cyan-500/30" },
  completed: { label: "COMPLETED", icon: CheckCircle, color: "bg-green-400/20 text-green-400 border-green-500/30" },
  cancelled: { label: "CANCELLED", icon: XCircle, color: "bg-red-400/20 text-red-400 border-red-500/30" },
  disputed: { label: "DISPUTED", icon: AlertCircle, color: "bg-pink-400/20 text-pink-400 border-pink-500/30" },
};

export default function Redesign3MyBookings() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings", { status: statusFilter !== "all" ? statusFilter : undefined }],
    enabled: !!user,
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      await apiRequest(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Booking cancelled" });
    },
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Calendar className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Login required to view bookings</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(b => ["pending", "confirmed"].includes(b.status)) || [];
  const pastBookings = bookings?.filter(b => ["completed", "cancelled"].includes(b.status)) || [];

  const BookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const status = statusConfig[booking.status] || statusConfig.pending;
    const StatusIcon = status.icon;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className="bg-black border border-gray-800 hover:border-cyan-500/30 transition-all overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              {/* Service Image */}
              <div className="w-full md:w-40 h-32 md:h-auto relative shrink-0">
                {booking.service?.images?.[0] ? (
                  <img src={booking.service.images[0]} alt={booking.service.title} className="w-full h-full object-cover grayscale" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <Zap className="w-8 h-8 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
              </div>

              {/* Booking Details */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge className={`${status.color} border font-bold text-[10px] tracking-wider mb-2`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    <h3 className="font-bold text-white">{booking.service?.title || "Service"}</h3>
                  </div>
                  <span className="text-cyan-400 font-black">CHF {booking.totalPrice?.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="flex items-center text-gray-400 font-mono">
                    <Calendar className="w-4 h-4 mr-2 text-cyan-400" />
                    {new Date(booking.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-400 font-mono">
                    <Clock className="w-4 h-4 mr-2 text-pink-400" />
                    {booking.time || "TBD"}
                  </div>
                  <div className="flex items-center text-gray-400 font-mono">
                    <User className="w-4 h-4 mr-2 text-yellow-400" />
                    {booking.provider?.name || "Provider"}
                  </div>
                  <div className="flex items-center text-gray-400 font-mono">
                    <MapPin className="w-4 h-4 mr-2 text-green-400" />
                    {booking.location || "TBD"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/redesign3/service/${booking.serviceId}`}>
                    <Button variant="outline" size="sm" className="border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 font-bold text-xs">
                      VIEW <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <Link href={`/redesign3/chat?booking=${booking.id}`}>
                    <Button variant="outline" size="sm" className="border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 font-bold text-xs">
                      <MessageCircle className="w-3 h-3 mr-1" /> MESSAGE
                    </Button>
                  </Link>
                  {booking.status === "pending" && (
                    <Button variant="outline" size="sm" onClick={() => cancelBookingMutation.mutate(booking.id)} className="border-gray-800 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 font-bold text-xs">
                      CANCEL
                    </Button>
                  )}
                  {booking.status === "completed" && !booking.hasReview && (
                    <Link href={`/redesign3/review/${booking.id}`}>
                      <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-xs">
                        <Star className="w-3 h-3 mr-1" /> REVIEW
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">MY BOOKINGS</h1>
          <p className="text-gray-500 font-mono text-sm">// Manage your service bookings</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-black border-gray-800 text-gray-400 focus:border-cyan-400">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent className="bg-black border-gray-800">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "TOTAL", value: bookings?.length || 0, color: "cyan" },
          { label: "UPCOMING", value: upcomingBookings.length, color: "yellow" },
          { label: "COMPLETED", value: pastBookings.filter(b => b.status === "completed").length, color: "green" },
          { label: "CANCELLED", value: pastBookings.filter(b => b.status === "cancelled").length, color: "red" },
        ].map((stat, i) => (
          <Card key={i} className="bg-black border border-gray-800">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-black text-${stat.color}-400`}>{stat.value}</p>
              <p className="text-xs text-gray-500 font-mono">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-black border border-gray-800 p-1 mb-6">
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            UPCOMING <Badge className="ml-2 bg-gray-800 text-gray-400">{upcomingBookings.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            PAST <Badge className="ml-2 bg-gray-800 text-gray-400">{pastBookings.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Card key={i} className="h-32 animate-pulse bg-gray-900 border-gray-800" />)}
            </div>
          ) : upcomingBookings.length ? (
            <div className="space-y-4">
              {upcomingBookings.map((booking, i) => <BookingCard key={booking.id} booking={booking} index={i} />)}
            </div>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO UPCOMING BOOKINGS</h3>
              <p className="text-gray-500 font-mono mb-4">// Browse services to make a booking</p>
              <Link href="/redesign3/search">
                <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">
                  BROWSE SERVICES
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length ? (
            <div className="space-y-4">
              {pastBookings.map((booking, i) => <BookingCard key={booking.id} booking={booking} index={i} />)}
            </div>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO PAST BOOKINGS</h3>
              <p className="text-gray-500 font-mono">// Your completed bookings will appear here</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
