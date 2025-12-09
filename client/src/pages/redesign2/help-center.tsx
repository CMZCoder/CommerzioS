/**
 * Help Center Page - Redesign2
 * Alternative design with teal/emerald color scheme
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, HelpCircle, Book, MessageCircle, Shield, CreditCard, Calendar, Star, ChevronRight, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categories = [
    { id: "getting-started", name: "Getting Started", icon: Book, color: "from-teal-500 to-emerald-500", articles: 12 },
    { id: "bookings", name: "Bookings", icon: Calendar, color: "from-blue-500 to-cyan-500", articles: 15 },
    { id: "payments", name: "Payments", icon: CreditCard, color: "from-emerald-500 to-green-500", articles: 8 },
    { id: "trust-safety", name: "Trust & Safety", icon: Shield, color: "from-amber-500 to-orange-500", articles: 10 },
    { id: "reviews", name: "Reviews", icon: Star, color: "from-pink-500 to-rose-500", articles: 6 },
    { id: "account", name: "Account", icon: HelpCircle, color: "from-indigo-500 to-blue-500", articles: 9 },
];

const popularArticles = [
    "How to create your first service listing",
    "Understanding our booking process",
    "Setting up payment methods",
    "How reviews and ratings work",
    "Cancellation and refund policies",
];

export default function Redesign2HelpCenter() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950/20 to-slate-900">
            <div className="max-w-5xl mx-auto px-6 py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-teal-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">How can we help?</h1>
                    <p className="text-slate-400 mb-8">Search or browse categories below</p>
                    <div className="relative max-w-md mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input placeholder="Search for help..." className="pl-12 py-5 bg-slate-800/50 border-slate-700 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
                    <h2 className="text-xl font-semibold text-white mb-4">Browse by Category</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {categories.map((cat, i) => (
                            <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                                <Card className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all cursor-pointer group">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}><cat.icon className="w-5 h-5 text-white" /></div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-white group-hover:text-teal-300 transition-colors">{cat.name}</h3>
                                            <p className="text-slate-500 text-sm">{cat.articles} articles</p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400" />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
                    <h2 className="text-xl font-semibold text-white mb-4">Popular Articles</h2>
                    <Card className="bg-slate-800/50 border-slate-700/50">
                        <CardContent className="p-0 divide-y divide-slate-700">
                            {popularArticles.map((article, i) => (
                                <div key={i} className="p-4 flex items-center gap-3 hover:bg-slate-700/30 transition-colors cursor-pointer group">
                                    <Book className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-300 group-hover:text-teal-300 transition-colors flex-1">{article}</span>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="bg-gradient-to-r from-teal-600/20 to-emerald-600/20 border-teal-500/30">
                        <CardContent className="p-8 text-center">
                            <Headphones className="w-12 h-12 text-teal-400 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">Still need help?</h3>
                            <p className="text-slate-300 mb-4">Our team is available 24/7</p>
                            <div className="flex justify-center gap-3">
                                <Button className="bg-white text-slate-900 hover:bg-slate-100"><MessageCircle className="w-4 h-4 mr-2" />Chat</Button>
                                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Email</Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
