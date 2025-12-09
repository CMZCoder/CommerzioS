/**
 * Disputes Page - Redesign
 * Futuristic design with glass morphism and animations
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle, MessageSquare, Scale, Clock, CheckCircle,
    XCircle, FileText, User, Calendar, ChevronRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";

interface Dispute {
    id: string;
    bookingId: string;
    reason: string;
    status: "open" | "under_review" | "resolved" | "closed";
    createdAt: string;
    resolvedAt?: string;
    otherParty: { name: string; avatar?: string };
}

export default function RedesignDisputes() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
        queryKey: ["/api/disputes"],
        queryFn: () => apiRequest("/api/disputes"),
    });

    const statusConfig = {
        open: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: AlertTriangle },
        under_review: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Scale },
        resolved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
        closed: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: XCircle },
    };

    const filteredDisputes = disputes.filter(d =>
        activeTab === "all" || d.status === activeTab
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-red-600/10" />
                <div className="absolute inset-0 backdrop-blur-3xl" />

                <div className="relative px-6 py-16 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Shield className="w-10 h-10 text-amber-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-amber-200 to-red-200 bg-clip-text text-transparent mb-4">
                            Dispute Resolution
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Fair and transparent resolution for any issues with your bookings
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                >
                    {[
                        { label: "Open", value: disputes.filter(d => d.status === "open").length, color: "from-amber-500 to-orange-500" },
                        { label: "Under Review", value: disputes.filter(d => d.status === "under_review").length, color: "from-blue-500 to-cyan-500" },
                        { label: "Resolved", value: disputes.filter(d => d.status === "resolved").length, color: "from-emerald-500 to-green-500" },
                        { label: "Total", value: disputes.length, color: "from-violet-500 to-purple-500" },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden">
                            <div className={`h-1 bg-gradient-to-r ${stat.color}`} />
                            <CardContent className="p-4 text-center">
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                <p className="text-slate-400 text-sm">{stat.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 rounded-2xl">
                        <TabsTrigger value="all" className="rounded-xl">All</TabsTrigger>
                        <TabsTrigger value="open" className="rounded-xl">Open</TabsTrigger>
                        <TabsTrigger value="under_review" className="rounded-xl">Under Review</TabsTrigger>
                        <TabsTrigger value="resolved" className="rounded-xl">Resolved</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Disputes List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-32 bg-slate-900/50 rounded-2xl animate-pulse" />
                            ))
                        ) : filteredDisputes.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No disputes</h3>
                                <p className="text-slate-400">Everything is running smoothly!</p>
                            </motion.div>
                        ) : (
                            filteredDisputes.map((dispute, index) => {
                                const StatusIcon = statusConfig[dispute.status]?.icon || FileText;
                                return (
                                    <motion.div
                                        key={dispute.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden group hover:border-amber-500/50 transition-all cursor-pointer">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                            <User className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="font-semibold text-white">Dispute #{dispute.id.slice(0, 8)}</h3>
                                                                <Badge className={`${statusConfig[dispute.status]?.color} border rounded-full`}>
                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                    {dispute.status.replace("_", " ")}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-slate-400 text-sm line-clamp-1">{dispute.reason}</p>
                                                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(dispute.createdAt).toLocaleDateString()}
                                                                </span>
                                                                <span>with {dispute.otherParty.name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Button variant="outline" size="sm" className="border-slate-700">
                                                            <MessageSquare className="w-4 h-4 mr-1" />
                                                            Chat
                                                        </Button>
                                                        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition-colors" />
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
