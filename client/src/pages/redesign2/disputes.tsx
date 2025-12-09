/**
 * Disputes Page - Redesign2
 * Alternative design with teal/emerald color scheme
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    AlertTriangle, MessageSquare, Scale, Clock, CheckCircle,
    XCircle, User, Calendar, ChevronRight, Shield
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
    otherParty: { name: string };
}

export default function Redesign2Disputes() {
    const [activeTab, setActiveTab] = useState("all");

    const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
        queryKey: ["/api/disputes"],
        queryFn: () => apiRequest("/api/disputes"),
    });

    const statusConfig = {
        open: { color: "bg-amber-500/20 text-amber-300 border-amber-500/30", icon: AlertTriangle },
        under_review: { color: "bg-blue-500/20 text-blue-300 border-blue-500/30", icon: Scale },
        resolved: { color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: CheckCircle },
        closed: { color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: XCircle },
    };

    const filteredDisputes = disputes.filter(d => activeTab === "all" || d.status === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900">
            <div className="max-w-5xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-amber-500/30 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-amber-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dispute Resolution</h1>
                    <p className="text-slate-400">Fair and transparent resolution for your concerns</p>
                </motion.div>

                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { l: "Open", v: disputes.filter(d => d.status === "open").length, c: "from-amber-500 to-orange-500" },
                        { l: "Under Review", v: disputes.filter(d => d.status === "under_review").length, c: "from-blue-500 to-cyan-500" },
                        { l: "Resolved", v: disputes.filter(d => d.status === "resolved").length, c: "from-emerald-500 to-green-500" },
                        { l: "Total", v: disputes.length, c: "from-teal-500 to-cyan-500" },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                            <div className={`h-1 bg-gradient-to-r ${stat.c}`} />
                            <CardContent className="p-4 text-center">
                                <p className="text-2xl font-bold text-white">{stat.v}</p>
                                <p className="text-slate-400 text-sm">{stat.l}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="bg-slate-800/50"><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="open">Open</TabsTrigger><TabsTrigger value="under_review">Under Review</TabsTrigger><TabsTrigger value="resolved">Resolved</TabsTrigger></TabsList>
                </Tabs>

                <div className="space-y-3">
                    <AnimatePresence>
                        {isLoading ? [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />)
                            : filteredDisputes.length === 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                                    <CheckCircle className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-white mb-2">No disputes</h3>
                                    <p className="text-slate-400">Everything is running smoothly!</p>
                                </motion.div>
                            ) : filteredDisputes.map((d, i) => {
                                const StatusIcon = statusConfig[d.status]?.icon || Scale;
                                return (
                                    <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                        <Card className="bg-slate-800/50 border-slate-700/50 hover:border-amber-500/50 transition-all cursor-pointer group">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-white">Dispute #{d.id.slice(0, 8)}</span>
                                                        <Badge className={`${statusConfig[d.status]?.color} border text-xs`}><StatusIcon className="w-3 h-3 mr-1" />{d.status.replace("_", " ")}</Badge>
                                                    </div>
                                                    <p className="text-slate-400 text-sm line-clamp-1">{d.reason}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(d.createdAt).toLocaleDateString()}</span>
                                                        <span>with {d.otherParty.name}</span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="text-slate-400"><MessageSquare className="w-4 h-4" /></Button>
                                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400" />
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
