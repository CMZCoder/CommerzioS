/**
 * Contact Page - Redesign
 * Futuristic contact form with glass morphism
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Send, Mail, Phone, MapPin, Clock, MessageCircle,
    Loader2, CheckCircle, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function RedesignContact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const contactInfo = [
        { icon: Mail, label: "Email", value: "support@commerzio.ch", color: "from-violet-500 to-purple-500" },
        { icon: Phone, label: "Phone", value: "+41 44 000 0000", color: "from-emerald-500 to-green-500" },
        { icon: MapPin, label: "Address", value: "Zürich, Switzerland", color: "from-blue-500 to-cyan-500" },
        { icon: Clock, label: "Hours", value: "Mon-Fri 9am-6pm CET", color: "from-amber-500 to-orange-500" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/3 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30 flex items-center justify-center">
                            <MessageCircle className="w-10 h-10 text-violet-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-4">
                            Get in Touch
                        </h1>
                        <p className="text-slate-400 text-lg">
                            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2 space-y-4"
                    >
                        <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
                        {contactInfo.map((item, index) => (
                            <Card key={index} className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                                            <item.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-slate-400 text-sm">{item.label}</p>
                                            <p className="text-white font-medium">{item.value}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* World Map Placeholder */}
                        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl mt-6">
                            <CardContent className="p-6">
                                <div className="aspect-video bg-slate-800/50 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <Globe className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-500">Serving customers worldwide</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-3"
                    >
                        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-xl">
                            <CardContent className="p-8">
                                {isSubmitted ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center py-12"
                                    >
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                        <p className="text-slate-400 mb-6">
                                            Thank you for reaching out. We'll get back to you within 24 hours.
                                        </p>
                                        <Button
                                            onClick={() => setIsSubmitted(false)}
                                            variant="outline"
                                            className="border-slate-700"
                                        >
                                            Send Another Message
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <h2 className="text-xl font-bold text-white mb-6">Send us a Message</h2>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="text-slate-300">Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Your name"
                                                    className="bg-slate-800/50 border-slate-700 focus:ring-violet-500"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-slate-300">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    className="bg-slate-800/50 border-slate-700 focus:ring-violet-500"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                                            <Input
                                                id="subject"
                                                placeholder="How can we help?"
                                                className="bg-slate-800/50 border-slate-700 focus:ring-violet-500"
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="message" className="text-slate-300">Message</Label>
                                            <Textarea
                                                id="message"
                                                placeholder="Tell us more about your inquiry..."
                                                className="bg-slate-800/50 border-slate-700 focus:ring-violet-500 min-h-[150px]"
                                                required
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-lg shadow-violet-500/25"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
