/**
 * Service Requests Page - Redesign
 * Futuristic design with glass morphism and animations
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Plus, FileText, Clock, CheckCircle, XCircle, MessageCircle,
    MapPin, Calendar, ChevronRight, Sparkles, Filter, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function RedesignServiceRequests() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    const { data: requests = [], isLoading } = useQuery<ServiceRequest[]>({
        queryKey: ["/api/service-requests"],
        queryFn: () => apiRequest("/api/service-requests"),
    });

    const statusConfig = {
        open: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Sparkles },
        in_progress: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock },
        completed: { color: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: CheckCircle },
        cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
    };

    const filteredRequests = requests.filter(r =>
        activeTab === "all" || r.status === activeTab
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section with Glass Effect */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-cyan-600/20" />
                <div className="absolute inset-0 backdrop-blur-3xl" />

                <div className="relative px-6 py-16 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-4">
                            Service Requests
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Post what you need and let verified professionals come to you with offers
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 flex justify-center"
                    >
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-lg shadow-violet-500/25 rounded-2xl px-8"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Request
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-8"
                >
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <Input
                                        placeholder="Search your requests..."
                                        className="pl-10 bg-slate-800/50 border-slate-700 focus:ring-violet-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" className="border-slate-700 text-slate-300">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="bg-slate-900/50 border border-slate-800/50 p-1 rounded-2xl">
                        <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-violet-600">All</TabsTrigger>
                        <TabsTrigger value="open" className="rounded-xl data-[state=active]:bg-emerald-600">Open</TabsTrigger>
                        <TabsTrigger value="in_progress" className="rounded-xl data-[state=active]:bg-blue-600">In Progress</TabsTrigger>
                        <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-violet-600">Completed</TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Request Cards */}
                <div className="grid gap-6">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <motion.div
                                    key={`skeleton-${i}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-40 bg-slate-900/50 rounded-2xl animate-pulse"
                                />
                            ))
                        ) : filteredRequests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-16"
                            >
                                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800/50 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                                <p className="text-slate-400 mb-6">Create your first service request to get started</p>
                                <Button className="bg-gradient-to-r from-violet-600 to-cyan-600">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Request
                                </Button>
                            </motion.div>
                        ) : (
                            filteredRequests.map((request, index) => {
                                const StatusIcon = statusConfig[request.status]?.icon || FileText;
                                return (
                                    <motion.div
                                        key={request.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden group hover:border-violet-500/50 transition-all cursor-pointer">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <Badge className={`${statusConfig[request.status]?.color} border rounded-full`}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {request.status.replace("_", " ")}
                                                            </Badge>
                                                            {request.budget && (
                                                                <span className="text-emerald-400 font-semibold">{request.budget}</span>
                                                            )}
                                                        </div>

                                                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                                                            {request.title}
                                                        </h3>

                                                        <p className="text-slate-400 line-clamp-2 mb-4">
                                                            {request.description}
                                                        </p>

                                                        <div className="flex items-center gap-6 text-sm text-slate-500">
                                                            {request.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="w-4 h-4" />
                                                                    {request.location}
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-4 h-4" />
                                                                {new Date(request.createdAt).toLocaleDateString()}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MessageCircle className="w-4 h-4" />
                                                                {request.responses} responses
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
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
