import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Gift, Users, Copy, CheckCircle, Share2, Mail, MessageCircle,
  Award, TrendingUp, Wallet, ChevronRight, Sparkles, Heart, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

const rewards = [
  { points: 100, reward: "CHF 5 Credit", icon: Wallet },
  { points: 250, reward: "CHF 15 Credit", icon: Wallet },
  { points: 500, reward: "Premium Badge", icon: Award },
  { points: 1000, reward: "CHF 50 Credit", icon: Wallet },
];

export default function UI2Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: referralStats } = useQuery<{ sent?: number; signedUp?: number; completed?: number; earned?: number }>({
    queryKey: ["/api/referrals/stats"],
    enabled: !!user,
  });

  const { data: referralHistory } = useQuery<any[]>({
    queryKey: ["/api/referrals"],
    enabled: !!user,
  });

  const referralCode = user?.referralCode || "YOURCODE";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareVia = (method: string) => {
    const text = `Join Commerzio Services and get CHF 10 credit! Use my referral code: ${referralCode}`;
    const url = referralLink;

    switch (method) {
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank");
        break;
      case "email":
        window.open(`mailto:?subject=Join Commerzio Services&body=${encodeURIComponent(text + "\n" + url)}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        break;
      default:
        copyToClipboard(url);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to access referrals.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const currentPoints = user.points || 0;
  const nextReward = rewards.find(r => r.points > currentPoints) || rewards[rewards.length - 1];
  const progressToNext = nextReward ? (currentPoints / nextReward.points) * 100 : 100;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero Banner */}
      <Card className="overflow-hidden mb-8 bg-gradient-to-r from-violet-600 to-indigo-600">
        <CardContent className="p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-4">
                <Gift className="w-3 h-3 mr-1" />
                Referral Program
              </Badge>
              <h1 className="text-3xl font-bold mb-2">Invite Friends, Earn Rewards</h1>
              <p className="text-white/80 max-w-md">
                Share your referral code and earn CHF 10 for every friend who signs up and completes their first booking.
              </p>
            </div>
            <div className="text-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <p className="text-sm text-white/80 mb-2">Your Points</p>
              <p className="text-5xl font-bold">{currentPoints}</p>
              <Award className="w-6 h-6 mx-auto mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Referrals Sent", value: referralStats?.sent || 0, icon: Share2, color: "bg-blue-100 text-blue-600" },
          { label: "Signed Up", value: referralStats?.signedUp || 0, icon: Users, color: "bg-green-100 text-green-600" },
          { label: "Completed", value: referralStats?.completed || 0, icon: CheckCircle, color: "bg-violet-100 text-violet-600" },
          { label: "Earned", value: `CHF ${referralStats?.earned || 0}`, icon: Wallet, color: "bg-yellow-100 text-yellow-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="p-4">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Share Section */}
        <div className="md:col-span-2 space-y-6">
          {/* Referral Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-violet-600" />
                Share Your Code
              </CardTitle>
              <CardDescription>Share your unique referral code with friends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
                <div className="flex gap-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="font-mono text-lg tracking-wider"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(referralCode)}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Referral Link</label>
                <div className="flex gap-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(referralLink)}
                    className="shrink-0"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <label className="text-sm font-medium mb-3 block">Share via</label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => shareVia("whatsapp")} className="gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => shareVia("email")} className="gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    Email
                  </Button>
                  <Button variant="outline" onClick={() => shareVia("twitter")} className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Twitter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                Referral History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralHistory?.length ? (
                <div className="space-y-3">
                  {referralHistory.map((referral: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={referral.referredUser?.profileImage} />
                          <AvatarFallback>{referral.referredUser?.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{referral.referredUser?.name || "User"}</p>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={
                        referral.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : referral.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-slate-100 text-slate-700"
                      }>
                        {referral.status || "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No referrals yet</h3>
                  <p className="text-muted-foreground">
                    Share your code to start earning rewards!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rewards Sidebar */}
        <div className="space-y-6">
          {/* Progress to Next Reward */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                Next Reward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{currentPoints} / {nextReward.points} pts</span>
                </div>
                <Progress value={Math.min(progressToNext, 100)} className="h-3" />
                <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-lg">
                  <nextReward.icon className="w-8 h-8 text-violet-600" />
                  <div>
                    <p className="font-semibold">{nextReward.reward}</p>
                    <p className="text-sm text-muted-foreground">
                      {nextReward.points - currentPoints} points to go
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Rewards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-violet-600" />
                Rewards Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards.map((reward, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${currentPoints >= reward.points
                        ? "bg-green-50 border-green-200"
                        : "bg-slate-50 border-slate-200"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentPoints >= reward.points
                        ? "bg-green-100 text-green-600"
                        : "bg-slate-200 text-slate-500"
                      }`}>
                      {currentPoints >= reward.points ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <reward.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{reward.reward}</p>
                      <p className="text-xs text-muted-foreground">{reward.points} points</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="bg-gradient-to-br from-violet-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[
                  "Share your unique referral code",
                  "Friend signs up using your code",
                  "Friend completes their first booking",
                  "You both earn CHF 10 credit!"
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
