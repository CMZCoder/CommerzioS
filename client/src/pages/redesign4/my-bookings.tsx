import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Star, ChevronRight, CheckCircle, XCircle, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function Redesign4MyBookings() {
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
        return { label: "Confirmed", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" };
      case "pending":
        return { label: "Pending", icon: AlertCircle, color: "text-amber-600 bg-amber-50 border-amber-200" };
      case "completed":
        return { label: "Completed", icon: CheckCircle, color: "text-stone-600 bg-stone-50 border-stone-200" };
      case "cancelled":
        return { label: "Cancelled", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" };
      default:
        return { label: status, icon: AlertCircle, color: "text-stone-600 bg-stone-50 border-stone-200" };
    }
  };

  const BookingCard = ({ booking, index }: { booking: any; index: number }) => {
    const status = getStatusConfig(booking.status);
    const StatusIcon = status.icon;

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
        <Card className="bg-white border border-stone-200 rounded-none p-6 hover:shadow-md transition-shadow">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Service Image */}
            <div className="w-full md:w-40 aspect-[4/3] md:aspect-square bg-stone-100 overflow-hidden shrink-0">
              {booking.service?.images?.[0] ? (
                <img src={booking.service.images[0]} alt={booking.service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">No image</div>
              )}
            </div>

            {/* Booking Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <Badge variant="outline" className={`rounded-none mb-2 ${status.color}`}>
                    <StatusIcon className="w-3 h-3 mr-1" /> {status.label}
                  </Badge>
                  <h3 className="text-lg text-stone-900 mb-1">
                    <Link href={`/redesign4/service/${booking.service?.id}`} className="hover:text-stone-600 transition-colors">
                      {booking.service?.title || "Service"}
                    </Link>
                  </h3>
                </div>
                <span className="text-lg font-light text-stone-900 shrink-0">CHF {booking.totalPrice?.toFixed(0)}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-stone-500 mb-4">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 stroke-[1.5]" />
                  {new Date(booking.date).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 stroke-[1.5]" />
                  {booking.time || "10:00 AM"}
                </span>
                {booking.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 stroke-[1.5]" />
                    {booking.location}
                  </span>
                )}
              </div>

              {/* Provider */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={booking.provider?.avatarUrl} />
                    <AvatarFallback className="bg-stone-100 text-stone-600 text-sm">{booking.provider?.name?.[0] || "P"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-stone-600">{booking.provider?.name || "Provider"}</span>
                </div>
                <Link href={`/redesign4/booking/${booking.id}`}>
                  <Button variant="ghost" size="sm" className="text-stone-500 hover:text-stone-900 hover:bg-stone-50 rounded-none">
                    Details <ChevronRight className="w-4 h-4 ml-1 stroke-[1.5]" />
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-light text-stone-900 mb-2">My Bookings</h1>
        <p className="text-stone-500">Manage your appointments and reservations</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search bookings..."
          className="pl-11 h-12 bg-white border-stone-200 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="w-full h-auto bg-transparent border-b border-stone-200 rounded-none p-0 gap-6 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "pending", label: "Pending" },
            { value: "confirmed", label: "Confirmed" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-900 data-[state=active]:border-b-2 data-[state=active]:border-stone-900 text-stone-400 rounded-none pb-3 px-0 whitespace-nowrap">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="pt-8">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-40 animate-pulse bg-stone-100 border-0" />
              ))}
            </div>
          ) : filteredBookings?.length ? (
            <div className="space-y-6">
              {filteredBookings.map((booking, i) => (
                <BookingCard key={booking.id} booking={booking} index={i} />
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Calendar className="w-12 h-12 mx-auto text-stone-300 mb-4 stroke-[1]" />
              <h3 className="text-xl text-stone-900 mb-2">No bookings found</h3>
              <p className="text-stone-500 mb-6">
                {filter === "all" ? "You haven't made any bookings yet" : `No ${filter} bookings`}
              </p>
              <Link href="/redesign4/search">
                <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-none">
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
