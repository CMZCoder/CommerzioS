/**
 * Help Center Page - Redesign
 * Futuristic design with search and categories
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Search, HelpCircle, Book, MessageCircle, Shield, CreditCard,
    Calendar, Star, ChevronRight, ExternalLink, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const categories = [
    { id: "getting-started", name: "Getting Started", icon: Book, color: "from-violet-500 to-purple-500", articles: 12 },
    { id: "bookings", name: "Bookings", icon: Calendar, color: "from-blue-500 to-cyan-500", articles: 15 },
    { id: "payments", name: "Payments", icon: CreditCard, color: "from-emerald-500 to-green-500", articles: 8 },
    { id: "trust-safety", name: "Trust & Safety", icon: Shield, color: "from-amber-500 to-orange-500", articles: 10 },
    { id: "reviews", name: "Reviews", icon: Star, color: "from-pink-500 to-rose-500", articles: 6 },
    { id: "account", name: "Account", icon: HelpCircle, color: "from-indigo-500 to-blue-500", articles: 9 },
];

const popularArticles = [
    { title: "How to create your first service listing", category: "Getting Started" },
    { title: "Understanding our booking process", category: "Bookings" },
    { title: "Setting up payment methods", category: "Payments" },
    { title: "How reviews and ratings work", category: "Reviews" },
    { title: "Cancellation and refund policies", category: "Bookings" },
];

export default function RedesignHelpCenter() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                            <HelpCircle className="w-10 h-10 text-violet-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-4">
                            How can we help?
                        </h1>
                        <p className="text-slate-400 text-lg mb-8">
                            Search our knowledge base or browse categories below
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-xl mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                                placeholder="Search for articles, topics, or questions..."
                                className="pl-12 py-6 text-lg bg-slate-900/80 border-slate-700 focus:ring-violet-500 rounded-2xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                {/* Categories Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {categories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                            >
                                <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden group cursor-pointer hover:border-violet-500/50 transition-all">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                                                <category.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                                                    {category.name}
                                                </h3>
                                                <p className="text-slate-400 text-sm">{category.articles} articles</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Popular Articles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-16"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">Popular Articles</h2>
                    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-0 divide-y divide-slate-800">
                            {popularArticles.map((article, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    className="p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <Book className="w-5 h-5 text-slate-500" />
                                        <div>
                                            <h4 className="text-white group-hover:text-violet-300 transition-colors">
                                                {article.title}
                                            </h4>
                                            <p className="text-slate-500 text-sm">{article.category}</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                                </motion.div>
                            ))}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border-violet-500/30 backdrop-blur-xl overflow-hidden">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                                <Headphones className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Still need help?</h3>
                            <p className="text-slate-300 mb-6">
                                Our support team is available 24/7 to assist you
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button className="bg-white text-slate-900 hover:bg-slate-100">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Start Chat
                                </Button>
                                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                                    Send Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
