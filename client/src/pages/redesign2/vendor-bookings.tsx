/**
 * Vendor Bookings Page - Redesign2
 * Alternative design with teal/emerald color scheme
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, User, CheckCircle, XCircle, MessageCircle, ChevronRight, Filter, DollarSign, TrendingUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";

interface Booking {
    id: string;
    serviceName: string;
    customer: { name: string };
    date: string;
    time: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    price: number;
}

export default function Redesign2VendorBookings() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: bookings = [], isLoading } = useQuery<Booking[]>({
        queryKey: ["/api/vendor/bookings"],
        queryFn: () => apiRequest("/api/vendor/bookings"),
    });

    const statusConfig = {
        pending: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: Clock },
        confirmed: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: CheckCircle },
        completed: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle },
        cancelled: { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
    };

    const stats = [
        { label: "Total", value: bookings.length, icon: CalendarDays, color: "from-teal-500 to-emerald-500" },
        { label: "Pending", value: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "from-amber-500 to-orange-500" },
        { label: "This Month", value: bookings.filter(b => new Date(b.date).getMonth() === new Date().getMonth()).length, icon: TrendingUp, color: "from-emerald-500 to-green-500" },
        { label: "Revenue", value: `CHF ${bookings.filter(b => b.status === "completed").reduce((sum, b) => sum + b.price, 0)}`, icon: DollarSign, color: "from-blue-500 to-cyan-500" },
    ];

    const filteredBookings = bookings.filter(b => activeTab === "all" || b.status === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950/20 to-slate-900">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-1">Booking Dashboard</h1>
                    <p className="text-slate-400">Manage your bookings and appointments</p>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                            <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-sm">{stat.label}</p>
                                    <p className="text-xl font-bold text-white">{stat.value}</p>
                                </div>
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}><stat.icon className="w-4 h-4 text-white" /></div>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="bg-slate-800/50"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="confirmed">Confirmed</TabsTrigger><TabsTrigger value="completed">Completed</TabsTrigger></TabsList>
                    </Tabs>
                    <Button variant="outline" className="border-slate-700 text-slate-300"><Filter className="w-4 h-4 mr-2" />Filter</Button>
                </motion.div>

                <div className="space-y-3">
                    <AnimatePresence>
                        {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />)
                            : filteredBookings.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                                    <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No bookings yet</h3>
                                    <p className="text-slate-400">Bookings will appear here when customers book</p>
                                </motion.div>
                            ) : filteredBookings.map((booking, i) => {
                                const StatusIcon = statusConfig[booking.status]?.icon || Clock;
                                return (
                                    <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                                        <Card className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all group">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium text-white">{booking.serviceName}</h3>
                                                    <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                                                        <span>{booking.customer.name}</span>
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(booking.date).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.time}</span>
                                                    </div>
                                                </div>
                                                <Badge className={`${statusConfig[booking.status]?.color} border text-xs`}><StatusIcon className="w-3 h-3 mr-1" />{booking.status}</Badge>
                                                <span className="text-teal-400 font-semibold">CHF {booking.price}</span>
                                                {booking.status === "pending" && (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8 w-8 p-0"><XCircle className="w-4 h-4" /></Button>
                                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 h-8 w-8 p-0"><CheckCircle className="w-4 h-4" /></Button>
                                                    </div>
                                                )}
                                                <Button size="sm" variant="ghost" className="text-slate-400 h-8 w-8 p-0"><MessageCircle className="w-4 h-4" /></Button>
                                                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400" />
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
