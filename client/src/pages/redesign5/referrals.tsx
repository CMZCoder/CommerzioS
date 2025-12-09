import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Copy, Users, TrendingUp, Award, Check, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function Redesign5Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: referralStats } = useQuery<any>({ queryKey: ["/api/referrals/stats"] });
  const { data: referrals } = useQuery<any[]>({ queryKey: ["/api/referrals"] });

  const referralCode = user?.referralCode || "YOURCODE";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied to clipboard! 🎉" });
    setTimeout(() => setCopied(false), 2000);
  };

  const tiers = [
    { name: "Seedling", min: 0, max: 5, reward: "CHF 5 credit", emoji: "🌱" },
    { name: "Growing", min: 5, max: 15, reward: "CHF 10 credit", emoji: "🌿" },
    { name: "Blooming", min: 15, max: 30, reward: "CHF 15 credit", emoji: "🌻" },
    { name: "Flourishing", min: 30, max: Infinity, reward: "CHF 25 credit", emoji: "🌳" },
  ];

  const currentTier = tiers.find(
    (t) => (referralStats?.totalReferrals || 0) >= t.min && (referralStats?.totalReferrals || 0) < t.max
  ) || tiers[0];

  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? ((referralStats?.totalReferrals || 0) - currentTier.min) / (nextTier.min - currentTier.min) * 100
    : 100;

  const stats = [
    { label: "Total Referrals", value: referralStats?.totalReferrals || 0, icon: Users, gradient: "from-blue-400 to-cyan-400" },
    { label: "Active Users", value: referralStats?.activeReferrals || 0, icon: TrendingUp, gradient: "from-green-400 to-emerald-400" },
    { label: "Total Earned", value: `CHF ${referralStats?.totalEarned || 0}`, icon: Gift, gradient: "from-amber-400 to-orange-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700">Earn rewards</span>
        </div>
        <h1 className="text-3xl font-bold text-amber-900 mb-2">Referral Program</h1>
        <p className="text-amber-700/60">Invite friends and grow together</p>
      </motion.div>

      {/* Referral Link Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 border-0 rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Share your link</h2>
            <p className="text-white/80 mb-6">You'll both get a reward when they complete their first booking</p>

            <div className="flex gap-2 max-w-md mx-auto">
              <Input value={referralLink} readOnly className="h-14 bg-white/20 backdrop-blur border-white/20 text-white placeholder:text-white/60 font-mono text-sm rounded-2xl focus-visible:ring-white/30" />
              <Button onClick={copyToClipboard} className="h-14 px-6 bg-white text-orange-600 hover:bg-white/90 rounded-2xl font-semibold shadow-xl shrink-0">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </Button>
            </div>

            <div className="mt-4">
              <span className="text-white/60 text-sm">Your code: </span>
              <span className="text-white font-mono font-bold">{referralCode}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white border-amber-100 rounded-3xl p-5 hover:shadow-lg hover:shadow-amber-100/50 transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-900">{stat.value}</p>
                <p className="text-sm text-amber-700/60">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Tier Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border-amber-100 rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentTier.emoji}</span>
              <div>
                <h3 className="font-bold text-amber-900">{currentTier.name}</h3>
                <p className="text-sm text-amber-700/60">{currentTier.reward} per referral</p>
              </div>
            </div>
            {nextTier && (
              <div className="text-right">
                <p className="text-sm text-amber-700/60">Next: {nextTier.name} {nextTier.emoji}</p>
              </div>
            )}
          </div>

          {nextTier && (
            <>
              <Progress value={progressToNext} className="h-3 mb-3 bg-amber-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{referralStats?.totalReferrals || 0} referrals</span>
                <span className="text-amber-600/60">{nextTier.min - (referralStats?.totalReferrals || 0)} more to level up</span>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Tiers Overview */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
        <h3 className="text-sm font-semibold text-amber-900 mb-4">Reward Tiers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {tiers.map((tier) => {
            const isCurrentTier = tier.name === currentTier.name;
            const isUnlocked = (referralStats?.totalReferrals || 0) >= tier.min;

            return (
              <Card key={tier.name} className={`rounded-3xl p-5 transition-all ${isCurrentTier ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-orange-200/50" : "bg-white border-amber-100"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{tier.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {isUnlocked && !isCurrentTier && <Check className="w-4 h-4 text-green-500" />}
                        <h4 className={`font-semibold ${isCurrentTier ? "text-white" : "text-amber-900"}`}>{tier.name}</h4>
                      </div>
                      <p className={`text-sm ${isCurrentTier ? "text-white/80" : "text-amber-700/60"}`}>{tier.reward}</p>
                    </div>
                  </div>
                  <span className={`text-sm ${isCurrentTier ? "text-white/80" : "text-amber-600/60"}`}>
                    {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max - 1}`}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Referrals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-sm font-semibold text-amber-900 mb-4">Recent Referrals</h3>
        <Card className="bg-white border-amber-100 rounded-3xl overflow-hidden">
          {referrals?.length ? (
            <div className="divide-y divide-amber-100">
              {referrals.slice(0, 5).map((ref: any) => (
                <div key={ref.id} className="p-5 flex items-center justify-between hover:bg-amber-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-amber-100">
                      <AvatarImage src={ref.user?.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{ref.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-amber-900">{ref.user?.name || "User"}</p>
                      <p className="text-sm text-amber-600/60">Joined {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${ref.status === "completed" ? "text-green-600" : "text-amber-600/60"}`}>
                      {ref.status === "completed" ? `+CHF ${ref.reward || 10}` : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-amber-900 mb-2">No referrals yet</h4>
              <p className="text-amber-700/60">Share your link to start earning rewards</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
