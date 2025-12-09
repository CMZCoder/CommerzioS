import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Users, Copy, Check, Share2, TrendingUp, Coins, Crown, Award, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Redesign2Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: referralStats } = useQuery<any>({
    queryKey: ["/api/referrals/stats"],
    enabled: !!user,
  });
  const { data: referralHistory } = useQuery<any[]>({
    queryKey: ["/api/referrals/history"],
    enabled: !!user,
  });

  const referralCode = user?.referralCode || "LOADING...";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join me on Commerzio!",
        text: "Sign up using my referral link and we both get rewarded!",
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink);
    }
  };

  const tiers = [
    { name: "Bronze", referrals: 0, bonus: "10%", color: "from-amber-700 to-amber-500" },
    { name: "Silver", referrals: 5, bonus: "15%", color: "from-slate-400 to-slate-300" },
    { name: "Gold", referrals: 15, bonus: "20%", color: "from-yellow-500 to-yellow-300" },
    { name: "Platinum", referrals: 30, bonus: "25%", color: "from-purple-400 to-pink-300" },
  ];

  const currentTier = tiers.reduce((prev, curr) => (referralStats?.totalReferrals >= curr.referrals ? curr : prev), tiers[0]);
  const nextTier = tiers.find(t => t.referrals > (referralStats?.totalReferrals || 0));

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Gift className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Please Sign In</h1>
        <p className="text-white/50 mb-4">Join our referral program and start earning rewards.</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6">
          <Gift className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 text-sm font-medium">Referral Program</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Invite Friends, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Earn Rewards</span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto">Share Commerzio with friends and earn credits for every successful referral. The more you share, the more you earn!</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Referrals", value: referralStats?.totalReferrals || 0, color: "from-blue-500/20 to-cyan-500/20" },
          { icon: TrendingUp, label: "Pending", value: referralStats?.pendingReferrals || 0, color: "from-yellow-500/20 to-orange-500/20" },
          { icon: Coins, label: "Total Earned", value: `CHF ${referralStats?.totalEarned || 0}`, color: "from-green-500/20 to-emerald-500/20" },
          { icon: Crown, label: "Current Tier", value: currentTier.name, color: "from-purple-500/20 to-pink-500/20" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={`p-5 backdrop-blur-xl bg-gradient-to-br ${stat.color} border-white/10`}>
              <div className="flex flex-col gap-2">
                <stat.icon className="w-6 h-6 text-white/70" />
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Link Card */}
      <Card className="mb-8 backdrop-blur-xl bg-white/5 border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
        <CardHeader className="relative">
          <CardTitle className="text-xl text-white">Your Referral Link</CardTitle>
          <p className="text-white/50">Share this link with friends to earn rewards</p>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-white/10 border-white/20 text-white font-mono text-sm" />
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 shrink-0" onClick={() => copyToClipboard(referralLink)}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={shareReferral} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Share2 className="w-4 h-4 mr-2" /> Share Link
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(referralCode)} className="flex-1 border-white/20 text-white hover:bg-white/10">
              <Copy className="w-4 h-4 mr-2" /> Code: {referralCode}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tier Progress */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Tier Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${currentTier.color} flex items-center justify-center`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">{currentTier.name} Tier</p>
                <p className="text-sm text-white/60">{currentTier.bonus} bonus on all referrals</p>
              </div>
            </div>

            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Progress to {nextTier.name}</span>
                  <span className="text-white">{referralStats?.totalReferrals || 0} / {nextTier.referrals}</span>
                </div>
                <Progress value={((referralStats?.totalReferrals || 0) / nextTier.referrals) * 100} className="h-2 bg-white/10" />
                <p className="text-xs text-white/50">{nextTier.referrals - (referralStats?.totalReferrals || 0)} more referrals to unlock {nextTier.bonus} bonus</p>
              </div>
            )}

            <div className="space-y-2">
              {tiers.map((tier) => (
                <div key={tier.name} className={`flex items-center justify-between p-3 rounded-lg ${currentTier.name === tier.name ? "bg-purple-500/20 border border-purple-500/30" : "bg-white/5"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-medium text-white">{tier.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-white/10 text-white/70 border-0">{tier.referrals}+ refs</Badge>
                    <span className="text-purple-400 font-semibold">{tier.bonus}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Referral History */}
        <Card className="backdrop-blur-xl bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Recent Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralHistory?.length ? (
              <div className="space-y-3">
                {referralHistory.slice(0, 5).map((referral, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        {referral.name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-white">{referral.name || "Anonymous"}</p>
                        <p className="text-xs text-white/50">{new Date(referral.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className={`${referral.status === "completed" ? "bg-green-500/20 text-green-400" : referral.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/60"} border-0`}>
                      {referral.status}
                    </Badge>
                  </div>
                ))}
                {referralHistory.length > 5 && (
                  <Button variant="ghost" className="w-full text-white/60 hover:text-white hover:bg-white/10">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-white/30 mb-3" />
                <p className="text-white/60">No referrals yet</p>
                <p className="text-sm text-white/40">Share your link to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="mt-8 backdrop-blur-xl bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Share Your Link", desc: "Send your unique referral link to friends via email, social media, or messaging apps." },
              { step: "2", title: "Friends Sign Up", desc: "When they create an account using your link, they become your referral." },
              { step: "3", title: "Earn Rewards", desc: "You earn credits when they complete their first booking. Higher tiers mean bigger bonuses!" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-white/50">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
