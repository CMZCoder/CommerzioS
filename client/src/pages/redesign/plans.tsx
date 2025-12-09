/**
 * Plans Page - Redesign
 * Futuristic pricing page with glass morphism
 */

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    Check, Zap, Crown, Sparkles, Star, ArrowRight, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";

interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    features: string[];
    popular?: boolean;
}

export default function RedesignPlans() {
    const { data: plans = [] } = useQuery<Plan[]>({
        queryKey: ["/api/plans"],
        queryFn: () => apiRequest("/api/plans"),
    });

    const defaultPlans = [
        {
            id: "free",
            name: "Starter",
            price: 0,
            period: "forever",
            icon: Sparkles,
            color: "from-slate-500 to-slate-600",
            features: [
                "Up to 3 service listings",
                "Basic profile",
                "Standard support",
                "Community access",
            ],
        },
        {
            id: "pro",
            name: "Professional",
            price: 29,
            period: "month",
            icon: Zap,
            color: "from-violet-500 to-purple-600",
            popular: true,
            features: [
                "Unlimited service listings",
                "Priority placement",
                "Verified badge",
                "Analytics dashboard",
                "Priority support",
                "Custom branding",
            ],
        },
        {
            id: "business",
            name: "Business",
            price: 79,
            period: "month",
            icon: Crown,
            color: "from-amber-500 to-orange-600",
            features: [
                "Everything in Pro",
                "Team accounts",
                "API access",
                "White-label options",
                "Dedicated account manager",
                "Custom integrations",
                "24/7 premium support",
            ],
        },
    ];

    const displayPlans = plans.length > 0 ? plans : defaultPlans;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Hero */}
            <div className="relative overflow-hidden py-20">
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 to-transparent" />
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-1/4 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-40 right-1/4 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-7xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30">
                            <Star className="w-3 h-3 mr-1" />
                            Choose Your Plan
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent mb-6">
                            Scale Your Business
                        </h1>
                        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                            Select the perfect plan to grow your service business and reach more customers
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-3 gap-6">
                    {displayPlans.map((plan: any, index) => {
                        const IconComponent = plan.icon || Sparkles;
                        const isPopular = plan.popular;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={isPopular ? "md:-mt-4 md:mb-4" : ""}
                            >
                                <Card className={`relative overflow-hidden bg-slate-900/50 border-slate-800/50 backdrop-blur-xl h-full ${isPopular ? "border-violet-500/50 shadow-lg shadow-violet-500/10" : ""}`}>
                                    {isPopular && (
                                        <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-bl-xl">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className={`h-1 bg-gradient-to-r ${plan.color}`} />

                                    <CardHeader className="pb-0">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                                            <IconComponent className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-4xl font-bold text-white">
                                                {plan.price === 0 ? "Free" : `CHF ${plan.price}`}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-slate-400">/{plan.period}</span>
                                            )}
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-6">
                                        <ul className="space-y-3 mb-8">
                                            {plan.features.map((feature: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-slate-300">
                                                    <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Button
                                            className={`w-full ${isPopular ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25" : "bg-slate-800 hover:bg-slate-700 text-white"}`}
                                            size="lg"
                                        >
                                            {plan.price === 0 ? "Get Started" : "Subscribe"}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Trust Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-16 text-center"
                >
                    <div className="inline-flex items-center gap-6 px-8 py-4 bg-slate-900/50 border border-slate-800/50 rounded-2xl backdrop-blur-xl">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Shield className="w-5 h-5 text-emerald-400" />
                            <span>Secure Payment</span>
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <Check className="w-5 h-5 text-emerald-400" />
                            <span>Cancel Anytime</span>
                        </div>
                        <div className="w-px h-6 bg-slate-700" />
                        <div className="flex items-center gap-2 text-slate-400">
                            <Star className="w-5 h-5 text-amber-400" />
                            <span>30-Day Guarantee</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
