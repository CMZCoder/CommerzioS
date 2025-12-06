/**
 * Contact Page - Redesign2
 * Alternative design with teal/emerald color scheme
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Mail, Phone, MapPin, Clock, MessageCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const contactInfo = [
    { icon: Mail, label: "Email", value: "support@commerzio.ch", color: "from-teal-500 to-emerald-500" },
    { icon: Phone, label: "Phone", value: "+41 44 000 0000", color: "from-blue-500 to-cyan-500" },
    { icon: MapPin, label: "Address", value: "Zürich, Switzerland", color: "from-emerald-500 to-green-500" },
    { icon: Clock, label: "Hours", value: "Mon-Fri 9am-6pm CET", color: "from-amber-500 to-orange-500" },
];

export default function Redesign2Contact() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950/20 to-slate-900">
            <div className="max-w-5xl mx-auto px-6 py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-teal-400" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Get in Touch</h1>
                    <p className="text-slate-400">We'd love to hear from you</p>
                </motion.div>

                <div className="grid lg:grid-cols-5 gap-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
                        {contactInfo.map((item, i) => (
                            <Card key={i} className="bg-slate-800/50 border-slate-700/50">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}><item.icon className="w-5 h-5 text-white" /></div>
                                    <div>
                                        <p className="text-slate-500 text-sm">{item.label}</p>
                                        <p className="text-white font-medium">{item.value}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
                        <Card className="bg-slate-800/50 border-slate-700/50">
                            <CardContent className="p-6">
                                {isSubmitted ? (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                                        <p className="text-slate-400 mb-4">We'll get back to you within 24 hours.</p>
                                        <Button onClick={() => setIsSubmitted(false)} variant="outline" className="border-slate-700">Send Another</Button>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <h2 className="text-lg font-semibold text-white mb-4">Send a Message</h2>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div><Label className="text-slate-300">Name</Label><Input className="bg-slate-900/50 border-slate-700 mt-1" required /></div>
                                            <div><Label className="text-slate-300">Email</Label><Input type="email" className="bg-slate-900/50 border-slate-700 mt-1" required /></div>
                                        </div>
                                        <div><Label className="text-slate-300">Subject</Label><Input className="bg-slate-900/50 border-slate-700 mt-1" required /></div>
                                        <div><Label className="text-slate-300">Message</Label><Textarea className="bg-slate-900/50 border-slate-700 mt-1 min-h-[120px]" required /></div>
                                        <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400" disabled={isSubmitting}>
                                            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Message</>}
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
