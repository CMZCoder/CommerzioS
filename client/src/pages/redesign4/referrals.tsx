import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Copy, Users, TrendingUp, Award, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

export default function Redesign4Referrals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: referralStats } = useQuery<any>({ queryKey: ["/api/referrals/stats"] });
  const { data: referrals } = useQuery<any[]>({ queryKey: ["/api/referrals"] });

  const referralCode = user?.referralCode || "YOURCODE";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const tiers = [
    { name: "Starter", min: 0, max: 5, reward: "CHF 5 credit per referral" },
    { name: "Advocate", min: 5, max: 15, reward: "CHF 10 credit per referral" },
    { name: "Champion", min: 15, max: 30, reward: "CHF 15 credit per referral" },
    { name: "Ambassador", min: 30, max: Infinity, reward: "CHF 25 credit per referral" },
  ];

  const currentTier = tiers.find(
    (t) => (referralStats?.totalReferrals || 0) >= t.min && (referralStats?.totalReferrals || 0) < t.max
  ) || tiers[0];

  const nextTier = tiers[tiers.indexOf(currentTier) + 1];
  const progressToNext = nextTier
    ? ((referralStats?.totalReferrals || 0) - currentTier.min) / (nextTier.min - currentTier.min) * 100
    : 100;

  const stats = [
    { label: "Total Referrals", value: referralStats?.totalReferrals || 0, icon: Users },
    { label: "Active Users", value: referralStats?.activeReferrals || 0, icon: TrendingUp },
    { label: "Total Earned", value: `CHF ${referralStats?.totalEarned || 0}`, icon: Gift },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <h1 className="text-3xl font-light text-stone-900 mb-2">Referral Program</h1>
        <p className="text-stone-500">Invite friends and earn rewards for every successful referral</p>
      </motion.div>

      {/* Referral Link */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-white border border-stone-200 rounded-none p-8 mb-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-stone-100 mx-auto mb-4 flex items-center justify-center">
              <Gift className="w-7 h-7 text-stone-600 stroke-[1.5]" />
            </div>
            <h2 className="text-xl font-light text-stone-900 mb-2">Share your referral link</h2>
            <p className="text-stone-500 text-sm">You'll both receive a reward when they complete their first booking</p>
          </div>

          <div className="flex gap-2 max-w-lg mx-auto">
            <Input value={referralLink} readOnly className="h-12 bg-stone-50 border-0 text-stone-600 font-mono text-sm rounded-none" />
            <Button onClick={copyToClipboard} className="h-12 px-6 bg-stone-900 hover:bg-stone-800 text-white rounded-none shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          <div className="text-center mt-4">
            <span className="text-xs uppercase tracking-wider text-stone-400">Your code: </span>
            <span className="text-sm font-mono text-stone-900">{referralCode}</span>
          </div>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white border border-stone-200 rounded-none p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-stone-600 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-2xl font-light text-stone-900">{stat.value}</p>
                <p className="text-xs uppercase tracking-wider text-stone-400">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Tier Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-white border border-stone-200 rounded-none p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-1">Current Tier</h3>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-stone-900 stroke-[1.5]" />
                <span className="text-xl font-light text-stone-900">{currentTier.name}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">{currentTier.reward}</p>
            </div>
          </div>

          {nextTier && (
            <>
              <Progress value={progressToNext} className="h-1 mb-4 bg-stone-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">{referralStats?.totalReferrals || 0} referrals</span>
                <span className="text-stone-400">{nextTier.min - (referralStats?.totalReferrals || 0)} more to {nextTier.name}</span>
              </div>
            </>
          )}
        </Card>
      </motion.div>

      {/* Tiers */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
        <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Reward Tiers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {tiers.map((tier, i) => {
            const isCurrentTier = tier.name === currentTier.name;
            const isUnlocked = (referralStats?.totalReferrals || 0) >= tier.min;

            return (
              <Card key={tier.name} className={`rounded-none p-5 transition-all ${isCurrentTier ? "bg-stone-900 text-white border-stone-900" : "bg-white border border-stone-200"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isUnlocked && <Check className={`w-4 h-4 ${isCurrentTier ? "text-white" : "text-stone-400"}`} />}
                      <h4 className={`font-medium ${isCurrentTier ? "text-white" : "text-stone-900"}`}>{tier.name}</h4>
                    </div>
                    <p className={`text-sm ${isCurrentTier ? "text-white/70" : "text-stone-500"}`}>{tier.reward}</p>
                  </div>
                  <span className={`text-sm ${isCurrentTier ? "text-white/70" : "text-stone-400"}`}>
                    {tier.max === Infinity ? `${tier.min}+` : `${tier.min}-${tier.max - 1}`} referrals
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Referrals */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Recent Referrals</h3>
        <Card className="bg-white border border-stone-200 rounded-none overflow-hidden">
          {referrals?.length ? (
            <div className="divide-y divide-stone-100">
              {referrals.slice(0, 5).map((ref: any, i: number) => (
                <div key={ref.id} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={ref.user?.avatarUrl} />
                      <AvatarFallback className="bg-stone-100 text-stone-600">{ref.user?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-stone-900">{ref.user?.name || "User"}</p>
                      <p className="text-xs text-stone-400">Joined {new Date(ref.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${ref.status === "completed" ? "text-green-600" : "text-stone-400"}`}>
                      {ref.status === "completed" ? `+CHF ${ref.reward || 10}` : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-stone-300 mb-4 stroke-[1]" />
              <h4 className="text-lg text-stone-900 mb-2">No referrals yet</h4>
              <p className="text-stone-500 text-sm">Share your link to start earning rewards</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
