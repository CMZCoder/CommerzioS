/**
 * Plans Page - Redesign2
 * Alternative pricing design with teal/emerald color scheme
 */

import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles, Star, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
    { id: "free", name: "Starter", price: 0, period: "forever", icon: Sparkles, color: "from-slate-500 to-slate-600", features: ["Up to 3 service listings", "Basic profile", "Standard support", "Community access"] },
    { id: "pro", name: "Professional", price: 29, period: "month", icon: Zap, color: "from-teal-500 to-emerald-500", popular: true, features: ["Unlimited listings", "Priority placement", "Verified badge", "Analytics dashboard", "Priority support", "Custom branding"] },
    { id: "business", name: "Business", price: 79, period: "month", icon: Crown, color: "from-amber-500 to-orange-500", features: ["Everything in Pro", "Team accounts", "API access", "White-label options", "Dedicated manager", "Custom integrations", "24/7 support"] },
];

export default function Redesign2Plans() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-teal-950/20 to-slate-900">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <Badge className="mb-4 bg-teal-500/20 text-teal-300 border-teal-500/30"><Star className="w-3 h-3 mr-1" />Pricing</Badge>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Plan</h1>
                    <p className="text-slate-400 text-lg max-w-xl mx-auto">Scale your business with the perfect plan</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {plans.map((plan, i) => (
                        <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={plan.popular ? "md:-mt-4 md:mb-4" : ""}>
                            <Card className={`relative bg-slate-800/50 border-slate-700/50 h-full ${plan.popular ? "border-teal-500/50 ring-1 ring-teal-500/30" : ""}`}>
                                {plan.popular && <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-medium rounded-bl-xl">Popular</div>}
                                <div className={`h-1 bg-gradient-to-r ${plan.color}`} />
                                <CardHeader className="pb-0">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                                        <plan.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mt-2">
                                        <span className="text-3xl font-bold text-white">{plan.price === 0 ? "Free" : `CHF ${plan.price}`}</span>
                                        {plan.price > 0 && <span className="text-slate-400 text-sm">/{plan.period}</span>}
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((f, j) => <li key={j} className="flex items-start gap-2 text-slate-300 text-sm"><Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />{f}</li>)}
                                    </ul>
                                    <Button className={`w-full ${plan.popular ? "bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400" : "bg-slate-700 hover:bg-slate-600"}`}>
                                        {plan.price === 0 ? "Get Started" : "Subscribe"}<ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 text-center">
                    <div className="inline-flex items-center gap-6 px-6 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                        <div className="flex items-center gap-2 text-slate-400 text-sm"><Shield className="w-4 h-4 text-teal-400" />Secure Payment</div>
                        <div className="w-px h-4 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-400 text-sm"><Check className="w-4 h-4 text-teal-400" />Cancel Anytime</div>
                        <div className="w-px h-4 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-400 text-sm"><Star className="w-4 h-4 text-amber-400" />30-Day Guarantee</div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
