import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Gift, Users, Copy, Check, Share2, TrendingUp, Coins, Crown, Award, ChevronRight, Zap, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function Redesign3Referrals() {
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

  const referralCode = user?.referralCode || "LOADING";
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Join Commerzio",
        text: "Sign up and we both get rewards!",
        url: referralLink,
      });
    } else {
      copyToClipboard(referralLink);
    }
  };

  const tiers = [
    { name: "BRONZE", referrals: 0, bonus: "10%", color: "from-amber-700 to-amber-500" },
    { name: "SILVER", referrals: 5, bonus: "15%", color: "from-gray-400 to-gray-300" },
    { name: "GOLD", referrals: 15, bonus: "20%", color: "from-yellow-500 to-yellow-300" },
    { name: "PLATINUM", referrals: 30, bonus: "25%", color: "from-cyan-400 to-pink-400" },
  ];

  const currentTier = tiers.reduce((prev, curr) => (referralStats?.totalReferrals >= curr.referrals ? curr : prev), tiers[0]);
  const nextTier = tiers.find(t => t.referrals > (referralStats?.totalReferrals || 0));

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Zap className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Login to join referral program</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/50 text-cyan-400 mb-6 text-xs font-mono tracking-wider bg-cyan-500/5">
          <Zap className="w-3 h-3" />
          REFERRAL PROGRAM
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
          INVITE <span className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">FRIENDS</span>
          <br />
          EARN <span className="text-pink-400 drop-shadow-[0_0_20px_rgba(244,114,182,0.5)]">REWARDS</span>
        </h1>
        <p className="text-gray-500 font-mono max-w-xl mx-auto">// Share Commerzio and earn credits for every successful referral</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "REFERRALS", value: referralStats?.totalReferrals || 0, color: "cyan" },
          { icon: Target, label: "PENDING", value: referralStats?.pendingReferrals || 0, color: "yellow" },
          { icon: Coins, label: "EARNED", value: `CHF ${referralStats?.totalEarned || 0}`, color: "green" },
          { icon: Crown, label: "TIER", value: currentTier.name, color: "pink" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-black border border-gray-800 hover:border-cyan-500/30 transition-all">
              <CardContent className="p-5 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 text-${stat.color}-400`} />
                <p className={`text-2xl font-black text-${stat.color}-400`}>{stat.value}</p>
                <p className="text-xs text-gray-500 font-mono">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Link */}
      <Card className="mb-8 bg-black border border-cyan-500/50 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-pink-500/5" />
        <CardHeader className="relative">
          <CardTitle className="text-white tracking-wider">YOUR REFERRAL LINK</CardTitle>
          <p className="text-gray-500 font-mono text-sm">// Share to earn rewards</p>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-black border-gray-800 text-cyan-400 font-mono text-sm" />
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 shrink-0" onClick={() => copyToClipboard(referralLink)}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={shareReferral} className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              <Share2 className="w-4 h-4 mr-2" /> SHARE LINK
            </Button>
            <Button variant="outline" onClick={() => copyToClipboard(referralCode)} className="flex-1 border-pink-500/50 text-pink-400 hover:bg-pink-400/10 font-bold tracking-wider">
              <Copy className="w-4 h-4 mr-2" /> CODE: {referralCode}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Tier Progress */}
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-cyan-400 tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5" /> TIER STATUS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 border border-cyan-500/30 bg-cyan-400/5">
              <div className={`w-12 h-12 bg-gradient-to-br ${currentTier.color} flex items-center justify-center`}>
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-black text-white">{currentTier.name}</p>
                <p className="text-sm text-gray-500 font-mono">{currentTier.bonus} bonus</p>
              </div>
            </div>

            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-mono">
                  <span className="text-gray-500">Progress to {nextTier.name}</span>
                  <span className="text-cyan-400">{referralStats?.totalReferrals || 0}/{nextTier.referrals}</span>
                </div>
                <div className="h-2 bg-gray-900 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all shadow-[0_0_10px_rgba(34,211,238,0.5)]" 
                    style={{ width: `${((referralStats?.totalReferrals || 0) / nextTier.referrals) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 font-mono">{nextTier.referrals - (referralStats?.totalReferrals || 0)} more for {nextTier.bonus} bonus</p>
              </div>
            )}

            <div className="space-y-2">
              {tiers.map((tier) => (
                <div key={tier.name} className={`flex items-center justify-between p-3 border ${currentTier.name === tier.name ? "border-cyan-500/50 bg-cyan-400/5" : "border-gray-800"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                      <Crown className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-white text-sm">{tier.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gray-800 text-gray-400 font-mono text-xs">{tier.referrals}+</Badge>
                    <span className="text-cyan-400 font-bold">{tier.bonus}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="bg-black border border-gray-800">
          <CardHeader>
            <CardTitle className="text-cyan-400 tracking-wider flex items-center gap-2">
              <Users className="w-5 h-5" /> RECENT REFERRALS
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referralHistory?.length ? (
              <div className="space-y-3">
                {referralHistory.slice(0, 5).map((ref, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-800 hover:border-cyan-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">{ref.name?.[0] || "?"}</span>
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{ref.name || "Anonymous"}</p>
                        <p className="text-xs text-gray-600 font-mono">{new Date(ref.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge className={`${ref.status === "completed" ? "bg-green-400/20 text-green-400" : ref.status === "pending" ? "bg-yellow-400/20 text-yellow-400" : "bg-gray-800 text-gray-500"} font-bold text-[10px] tracking-wider`}>
                      {ref.status?.toUpperCase()}
                    </Badge>
                  </div>
                ))}
                {referralHistory.length > 5 && (
                  <Button variant="ghost" className="w-full text-gray-500 hover:text-cyan-400 font-bold text-xs tracking-wider">
                    VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500 font-mono">// No referrals yet</p>
                <p className="text-xs text-gray-600 font-mono">Share your link to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="mt-8 bg-black border border-gray-800">
        <CardHeader>
          <CardTitle className="text-cyan-400 tracking-wider">// HOW IT WORKS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "SHARE LINK", desc: "Send your unique referral link to friends" },
              { step: "02", title: "FRIEND JOINS", desc: "They sign up using your referral code" },
              { step: "03", title: "EARN REWARDS", desc: "Get credits when they complete first booking" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 border-2 border-cyan-400 mx-auto mb-4 flex items-center justify-center text-2xl font-black text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                  {item.step}
                </div>
                <h3 className="font-bold text-white mb-2 tracking-wider">{item.title}</h3>
                <p className="text-sm text-gray-500 font-mono">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
