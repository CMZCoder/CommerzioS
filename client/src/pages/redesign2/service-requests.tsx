/**
 * Service Requests Page - Redesign2
 * Alternative design with teal/emerald color scheme
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Plus, FileText, Clock, CheckCircle, XCircle, MessageCircle,
    MapPin, Calendar, ChevronRight, Sparkles, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";

interface ServiceRequest {
    id: string;
    title: string;
    description: string;
    status: "open" | "in_progress" | "completed" | "cancelled";
    budget?: string;
    location?: string;
    createdAt: string;
    responses: number;
}

export default function Redesign2ServiceRequests() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
        queryKey: ["/api/service-requests"],
        queryFn: () => apiRequest("/api/service-requests"),
    });

    const statusConfig = {
        open: { color: "bg-teal-500/20 text-teal-300 border-teal-500/30", icon: Sparkles },
        in_progress: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Clock },
        completed: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle },
        cancelled: { color: "bg-red-500/20 text-red-300 border-red-500/30", icon: XCircle },
    };

    const filteredRequests = requests.filter(r =>
        activeTab === "all" || r.status === activeTab
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950/30 to-slate-900">
            {/* Hero */}
            <div className="relative px-6 py-16 max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 rounded-full border border-teal-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        <span className="text-teal-300 text-sm font-medium">Post Your Request</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Service Requests</h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                        Describe what you need and get quotes from verified professionals
                    </p>
                    <Button size="lg" className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl px-8">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Request
                    </Button>
                </motion.div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-6 pb-12">
                <Card className="bg-slate-800/50 border-slate-700/50 mb-6">
                    <CardContent className="p-4 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input placeholder="Search requests..." className="pl-10 bg-slate-900/50 border-slate-700" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-slate-900/50">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="open">Open</TabsTrigger>
                                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <AnimatePresence>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />)
                        ) : filteredRequests.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                                <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                                <p className="text-slate-400">Create your first service request</p>
                            </motion.div>
                        ) : (
                            filteredRequests.map((request, i) => {
                                const StatusIcon = statusConfig[request.status]?.icon || FileText;
                                return (
                                    <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <Card className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all cursor-pointer group">
                                            <CardContent className="p-5 flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <Badge className={`${statusConfig[request.status]?.color} border`}>
                                                            <StatusIcon className="w-3 h-3 mr-1" />{request.status.replace("_", " ")}
                                                        </Badge>
                                                        {request.budget && <span className="text-teal-400 font-semibold">{request.budget}</span>}
                                                    </div>
                                                    <h3 className="text-lg font-semibold text-white group-hover:text-teal-300 transition-colors">{request.title}</h3>
                                                    <p className="text-slate-400 text-sm line-clamp-1 mt-1">{request.description}</p>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                                                        {request.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{request.location}</span>}
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(request.createdAt).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{request.responses} responses</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-teal-400 transition-colors" />
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
