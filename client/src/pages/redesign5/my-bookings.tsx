import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Star, ChevronRight, CheckCircle, XCircle, AlertCircle, Search, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Redesign5MyBookings() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: bookings, isLoading } = useQuery<any[]>({
    queryKey: ["/api/bookings"],
  });

  const filteredBookings = bookings?.filter((b) => {
    const matchesFilter = filter === "all" || b.status === filter;
    const matchesSearch = !searchQuery || 
      b.service?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.provider?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { label: "Confirmed", icon: CheckCircle, bg: "bg-gradient-to-r from-green-100 to-emerald-100", text: "text-green-700", iconColor: "text-green-600" };
      case "pending":
        return { label: "Pending", icon: AlertCircle, bg: "bg-gradient-to-r from-amber-100 to-yellow-100", text: "text-amber-700", iconColor: "text-amber-600" };
      case "completed":
        return { label: "Completed", icon: CheckCircle, bg: "bg-gradient-to-r from-blue-100 to-cyan-100", text: "text-blue-700", iconColor: "text-blue-600" };
      case "cancelled":
        return { label: "Cancelled", icon: XCircle, bg: "bg-gradient-to-r from-red-100 to-rose-100", text: "text-red-700", iconColor: "text-red-600" };
      default:
        return { label: status, icon: AlertCircle, bg: "bg-amber-100", text: "text-amber-700", iconColor: "text-amber-600" };
    }
  };

  const BookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const status = getStatusConfig(booking.status);
    const StatusIcon = status.icon;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className="bg-white border-amber-100 rounded-3xl p-5 hover:shadow-lg hover:shadow-amber-100/50 transition-all">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Service Image */}
            <div className="w-full md:w-36 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-amber-100 shrink-0">
              {booking.service?.images?.[0] ? (
                <img src={booking.service.images[0]} alt={booking.service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Leaf className="w-8 h-8 text-amber-300" />
                </div>
              )}
            </div>

            {/* Booking Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <Badge className={`rounded-full ${status.bg} ${status.text} px-3`}>
                  <StatusIcon className={`w-3.5 h-3.5 mr-1 ${status.iconColor}`} /> {status.label}
                </Badge>
                <span className="text-xl font-bold text-amber-900 shrink-0">CHF {booking.totalPrice?.toFixed(0)}</span>
              </div>

              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                <Link href={`/redesign5/service/${booking.service?.id}`} className="hover:text-amber-700 transition-colors">
                  {booking.service?.title || "Service"}
                </Link>
              </h3>

              <div className="flex flex-wrap gap-4 text-sm text-amber-700/70 mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(booking.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {booking.time || "10:00 AM"}
                </span>
                {booking.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {booking.location}
                  </span>
                )}
              </div>

              {/* Provider */}
              <div className="flex items-center justify-between pt-4 border-t border-amber-100">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 ring-2 ring-amber-100">
                    <AvatarImage src={booking.provider?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{booking.provider?.name?.[0] || "P"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-amber-800">{booking.provider?.name || "Provider"}</span>
                </div>
                <Link href={`/redesign5/booking/${booking.id}`}>
                  <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full">
                    Details <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-amber-900 mb-2">My Bookings</h1>
        <p className="text-amber-700/60">Manage your appointments and reservations</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookings..."
          className="pl-12 h-12 bg-white border-amber-200 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="w-full h-auto bg-amber-50 rounded-2xl p-1.5 gap-1 mb-6 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-max text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm rounded-xl py-2.5 px-4 font-medium transition-all">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="space-y-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-40 animate-pulse bg-amber-50 border-amber-100 rounded-3xl" />
              ))}
            </>
          ) : filteredBookings?.length ? (
            <>
              {filteredBookings.map((booking, i) => (
                <BookingCard key={booking.id} booking={booking} index={i} />
              ))}
            </>
          ) : (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-amber-900 mb-2">No bookings found</h3>
              <p className="text-amber-700/60 mb-6">
                {filter === "all" ? "You haven't made any bookings yet" : `No ${filter} bookings`}
              </p>
              <Link href="/redesign5/search">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6">
                  Browse Services
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
