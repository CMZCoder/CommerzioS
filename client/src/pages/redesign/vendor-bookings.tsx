/**
 * Vendor Bookings Page - Redesign
 * Futuristic dashboard for vendors to manage their bookings
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Calendar, Clock, User, MapPin, CheckCircle, XCircle,
    MessageCircle, ChevronRight, Filter, Star, DollarSign,
    TrendingUp, Users, CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";

interface Booking {
    id: string;
    serviceName: string;
    customer: { name: string; avatar?: string };
    date: string;
    time: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    price: number;
    location?: string;
}

export default function RedesignVendorBookings() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: bookings = [], isLoading } = useQuery<Booking[]>({
        queryKey: ["/api/vendor/bookings"],
        queryFn: () => apiRequest("/api/vendor/bookings"),
    });

    const statusConfig = {
        pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
        confirmed: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: CheckCircle },
        completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
        cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
    };

    const stats = [
        { label: "Total Bookings", value: bookings.length, icon: CalendarDays, color: "from-violet-500 to-purple-500" },
        { label: "Pending", value: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "from-amber-500 to-orange-500" },
        { label: "This Month", value: bookings.filter(b => new Date(b.date).getMonth() === new Date().getMonth()).length, icon: TrendingUp, color: "from-emerald-500 to-green-500" },
        { label: "Revenue", value: `CHF ${bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + b.price, 0)}`, icon: DollarSign, color: "from-blue-500 to-cyan-500" },
    ];

    const filteredBookings = bookings.filter(b =>
        activeTab === "all" || b.status === activeTab
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-cyan-600/10" />

                <div className="relative px-6 py-12 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-2">
                            Booking Dashboard
                        </h1>
                        <p className="text-slate-400">Manage your incoming bookings and appointments</p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 pb-12">
                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {stats.map((stat, i) => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden">
                            <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">{stat.label}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
                                        <stat.icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Tabs and Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 rounded-2xl">
                            <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-xl">Pending</TabsTrigger>
                            <TabsTrigger value="confirmed" className="rounded-xl">Confirmed</TabsTrigger>
                            <TabsTrigger value="completed" className="rounded-xl">Completed</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button variant="outline" className="border-slate-700 text-slate-300">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </motion.div>

                {/* Bookings List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-28 bg-slate-900/50 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredBookings.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    <Calendar className="w-10 h-10 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No bookings yet</h3>
                                <p className="text-slate-400">Bookings will appear here when customers book your services</p>
                            </motion.div>
                        ) : (
                            filteredBookings.map((booking, index) => {
                                const StatusIcon = statusConfig[booking.status]?.icon || Clock;
                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden group hover:border-violet-500/50 transition-all">
                                            <CardContent className="p-4 md:p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                            <User className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-white">{booking.serviceName}</h3>
                                                            <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                                                                <span>{booking.customer.name}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(booking.date).toLocaleDateString()}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {booking.time}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Badge className={`${statusConfig[booking.status]?.color} border rounded-full`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />
                                                            {booking.status}
                                                        </Badge>
                                                        <span className="text-emerald-400 font-semibold">CHF {booking.price}</span>
                                                        {booking.status === "pending" && (
                                                            <div className="flex gap-2">
                                                                <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                                                                    <XCircle className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                        <Button size="sm" variant="ghost" className="text-slate-400">
                                                            <MessageCircle className="w-4 h-4" />
                                                        </Button>
                                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 transition-colors" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
