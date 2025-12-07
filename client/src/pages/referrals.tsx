/**
 * Referral Dashboard Page
 * 
 * Displays user's referral statistics, referral link, 
 * referral history, and points management.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/config";
import { 
  Copy, 
  Users, 
  Gift, 
  TrendingUp, 
  Star,
  History,
  Award,
  Share2,
  CheckCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  UserCheck,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReferralStats {
  referralCode: string;
  referralLink: string;
  totalDirectReferrals: number;
  activeDirectReferrals: number;
  totalNetworkSize: number;
  totalPointsEarned: number;
  currentPoints: number;
  totalCommissionEarned: number;
  pendingCommission: number;
  referralRank: number | null;
  lastReferralAt: string | null;
}

interface Referral {
  id: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  status: string;
}

interface PointsHistory {
  id: string;
  points: number;
  balanceAfter: number;
  action: string;
  description: string | null;
  createdAt: string;
}

interface PointsSummary {
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  recentActivity: Array<{
    action: string;
    points: number;
    createdAt: string;
  }>;
}

interface ReferralConfig {
  maxLevels: number;
  pointsPerReferral: number;
  pointsPerFirstPurchase: number;
  pointsPerServiceCreation: number;
  pointsPerReview: number;
  pointsToDiscountRate: number;
  minPointsToRedeem: number;
  isActive: boolean;
}

interface MyReferrer {
  hasReferrer: boolean;
  referrer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    referralCode: string | null;
  } | null;
}

interface NetworkLevel {
  count: number;
  referrals: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
    status: string;
    referredByName?: string;
  }>;
}

interface MyNetwork {
  maxLevels: number;
  level1: NetworkLevel;
  level2: NetworkLevel;
  level3: NetworkLevel;
}

interface CommissionEvent {
  id: string;
  fromUserId: string;
  fromUserName: string;
  level: number;
  pointsEarned: number;
  commissionEarned: string;
  triggerType: string;
  triggerId: string | null;
  triggerAmount: string | null;
  status: string;
  createdAt: string;
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({ 1: true, 2: false, 3: false });

  // Fetch referral stats
  const { data: stats, isLoading: statsLoading } = useQuery<ReferralStats>({
    queryKey: ["/api/referral/my-stats"],
  });

  // Fetch user's referrals
  const { data: referrals, isLoading: referralsLoading } = useQuery<Referral[]>({
    queryKey: ["/api/referral/my-referrals"],
  });

  // Fetch points summary
  const { data: pointsSummary, isLoading: pointsLoading } = useQuery<PointsSummary>({
    queryKey: ["/api/points/summary"],
  });

  // Fetch points history
  const { data: pointsHistory } = useQuery<PointsHistory[]>({
    queryKey: ["/api/points/history"],
  });

  // Fetch referral config
  const { data: config } = useQuery<ReferralConfig>({
    queryKey: ["/api/referral/config"],
  });

  // Fetch who referred me
  const { data: myReferrer } = useQuery<MyReferrer>({
    queryKey: ["/api/referral/my-referrer"],
  });

  // Fetch multi-level network
  const { data: myNetwork, isLoading: networkLoading } = useQuery<MyNetwork>({
    queryKey: ["/api/referral/my-network"],
  });

  // Fetch my commission events
  const { data: commissions } = useQuery<CommissionEvent[]>({
    queryKey: ["/api/referral/my-commissions"],
  });

  // Copy referral link
  const copyReferralLink = async () => {
    if (stats?.referralLink) {
      await navigator.clipboard.writeText(stats.referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  // Copy referral code
  const copyReferralCode = async () => {
    if (stats?.referralCode) {
      await navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    if (stats?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Commerzio!",
          text: "Sign up using my referral link and we both earn rewards!",
          url: stats.referralLink,
        });
      } catch (err) {
        // User cancelled or error
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  // Social share functions
  const shareToWhatsApp = () => {
    const text = encodeURIComponent(`Join me on Commerzio! Sign up using my referral link and we both earn rewards: ${stats?.referralLink}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(stats?.referralLink || '')}`, '_blank');
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent("Join me on Commerzio! Sign up and we both earn rewards!");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(stats?.referralLink || '')}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent("Join me on Commerzio!");
    const body = encodeURIComponent(`Hey!\n\nI've been using Commerzio and thought you might like it too. Sign up using my referral link and we both earn rewards:\n\n${stats?.referralLink}\n\nSee you there!`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // Format trigger type
  const formatTriggerType = (type: string): string => {
    const types: Record<string, string> = {
      signup: "Signup Bonus",
      first_purchase: "First Purchase",
      service_created: "Service Created",
      order_completed: "Order Completed",
    };
    return types[type] || type;
  };

  // Redeem points mutation
  const redeemMutation = useMutation({
    mutationFn: async (data: { points: number; redemptionType: string }) => {
      const res = await fetchApi("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to redeem points");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Points Redeemed!",
        description: `You received CHF ${data.discountValue?.toFixed(2)} discount credit`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/points/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/referral/my-stats"] });
      setRedeemPoints(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (redeemPoints >= (config?.minPointsToRedeem || 100)) {
      redeemMutation.mutate({ points: redeemPoints, redemptionType: "discount" });
    }
  };

  // Format action name for display
  const formatAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      referral_signup: "Referral Signup",
      referral_first_purchase: "Referral Purchase",
      referral_service_created: "Referral Service",
      service_created: "Service Created",
      review_posted: "Review Posted",
      purchase_made: "Purchase",
      redemption: "Redemption",
      admin_adjustment: "Admin Adjustment",
      bonus: "Bonus",
    };
    return actionMap[action] || action;
  };

  if (statsLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Referral Program
          </h1>
          <p className="text-muted-foreground mt-2">
            Invite friends and earn rewards for every referral
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-blue-100">Your Points</CardDescription>
              <CardTitle className="text-3xl">{stats?.currentPoints || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-blue-100 text-sm">
                <Star className="h-4 w-4 mr-1" />
                Total earned: {stats?.totalPointsEarned || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-green-100">Total Referrals</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalDirectReferrals || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-green-100 text-sm">
                <Users className="h-4 w-4 mr-1" />
                Network: {stats?.totalNetworkSize || 0} users
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-purple-100">Commission Earned</CardDescription>
              <CardTitle className="text-3xl">
                CHF {(stats?.totalCommissionEarned || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-purple-100 text-sm">
                <Clock className="h-4 w-4 mr-1" />
                Pending: CHF {(stats?.pendingCommission || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardDescription className="text-orange-100">Referral Rank</CardDescription>
              <CardTitle className="text-3xl">
                {stats?.referralRank ? `#${stats.referralRank}` : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-orange-100 text-sm">
                <Award className="h-4 w-4 mr-1" />
                Keep referring to climb!
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Who Referred Me Card */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCheck className="h-5 w-5" />
              Who Referred You
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myReferrer?.hasReferrer && myReferrer.referrer ? (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-medium text-lg">
                  {myReferrer.referrer.firstName?.charAt(0) || "?"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    You were invited by {myReferrer.referrer.firstName} {myReferrer.referrer.lastName}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Referral code: <span className="font-mono">{myReferrer.referrer.referralCode}</span>
                  </p>
                </div>
                <Gift className="h-6 w-6 text-green-500" />
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>You joined independently</p>
                <p className="text-sm">Start inviting friends to grow your network!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link with friends. When they sign up and make purchases, you both earn rewards!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <Input
                    value={stats?.referralLink || ""}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyReferralLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Your code: <strong className="font-mono">{stats?.referralCode}</strong>
                  <Button variant="ghost" size="sm" onClick={copyReferralCode} className="ml-2 h-6 px-2">
                    <Copy className="h-3 w-3" />
                  </Button>
                </p>
              </div>
              <Button onClick={shareReferralLink} className="sm:w-auto">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            
            {/* Social Share Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={shareToWhatsApp} className="text-green-600 hover:bg-green-50">
                <MessageCircle className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              <Button variant="outline" size="sm" onClick={shareToFacebook} className="text-blue-600 hover:bg-blue-50">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Facebook
              </Button>
              <Button variant="outline" size="sm" onClick={shareToTwitter} className="text-sky-500 hover:bg-sky-50">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                X
              </Button>
              <Button variant="outline" size="sm" onClick={shareByEmail} className="text-muted-foreground hover:bg-accent">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="network" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="network">My Network</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          {/* Network Tab - Multi-level Referrals */}
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Network</CardTitle>
                <CardDescription>
                  People in your referral tree across all levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {networkLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : myNetwork ? (
                  <div className="space-y-4">
                    {/* Level 1 */}
                    <Collapsible open={expandedLevels[1]} onOpenChange={(open) => setExpandedLevels(prev => ({ ...prev, 1: open }))}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30">
                          <div className="flex items-center gap-3">
                            {expandedLevels[1] ? <ChevronDown className="h-5 w-5 text-green-600" /> : <ChevronRight className="h-5 w-5 text-green-600" />}
                            <span className="font-medium text-green-800 dark:text-green-200">Level 1 - Direct Referrals</span>
                            <Badge variant="secondary" className="bg-green-200 text-green-800">{myNetwork.level1.count}</Badge>
                          </div>
                          <span className="text-sm text-green-600">10% commission</span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-2 pl-8">
                          {myNetwork.level1.referrals.length > 0 ? myNetwork.level1.referrals.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-card rounded border">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm">
                                  {r.firstName?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                            </div>
                          )) : (
                            <p className="text-sm text-muted-foreground py-2">No direct referrals yet</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Level 2 */}
                    {myNetwork.maxLevels >= 2 && (
                      <Collapsible open={expandedLevels[2]} onOpenChange={(open) => setExpandedLevels(prev => ({ ...prev, 2: open }))}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30">
                            <div className="flex items-center gap-3">
                              {expandedLevels[2] ? <ChevronDown className="h-5 w-5 text-blue-600" /> : <ChevronRight className="h-5 w-5 text-blue-600" />}
                              <span className="font-medium text-blue-800 dark:text-blue-200">Level 2 - Indirect Referrals</span>
                              <Badge variant="secondary" className="bg-blue-200 text-blue-800">{myNetwork.level2.count}</Badge>
                            </div>
                            <span className="text-sm text-blue-600">4% commission</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 space-y-2 pl-8">
                            {myNetwork.level2.referrals.length > 0 ? myNetwork.level2.referrals.slice(0, 20).map((r) => (
                              <div key={r.id} className="flex items-center justify-between p-3 bg-card rounded border">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm">
                                    {r.firstName?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                                    <p className="text-xs text-muted-foreground">via {r.referredByName}</p>
                                  </div>
                                </div>
                                <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                              </div>
                            )) : (
                              <p className="text-sm text-muted-foreground py-2">No level 2 referrals yet</p>
                            )}
                            {myNetwork.level2.count > 20 && (
                              <p className="text-xs text-muted-foreground text-center">+ {myNetwork.level2.count - 20} more</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}

                    {/* Level 3 */}
                    {myNetwork.maxLevels >= 3 && (
                      <Collapsible open={expandedLevels[3]} onOpenChange={(open) => setExpandedLevels(prev => ({ ...prev, 3: open }))}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30">
                            <div className="flex items-center gap-3">
                              {expandedLevels[3] ? <ChevronDown className="h-5 w-5 text-purple-600" /> : <ChevronRight className="h-5 w-5 text-purple-600" />}
                              <span className="font-medium text-purple-800 dark:text-purple-200">Level 3 - Extended Network</span>
                              <Badge variant="secondary" className="bg-purple-200 text-purple-800">{myNetwork.level3.count}</Badge>
                            </div>
                            <span className="text-sm text-purple-600">1% commission</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 space-y-2 pl-8">
                            {myNetwork.level3.referrals.length > 0 ? myNetwork.level3.referrals.slice(0, 10).map((r) => (
                              <div key={r.id} className="flex items-center justify-between p-3 bg-card rounded border">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm">
                                    {r.firstName?.charAt(0) || "U"}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{r.firstName} {r.lastName}</p>
                                    <p className="text-xs text-muted-foreground">via {r.referredByName}</p>
                                  </div>
                                </div>
                                <Badge variant={r.status === "active" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                              </div>
                            )) : (
                              <p className="text-sm text-muted-foreground py-2">No level 3 referrals yet</p>
                            )}
                            {myNetwork.level3.count > 10 && (
                              <p className="text-xs text-muted-foreground text-center">+ {myNetwork.level3.count - 10} more</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No referrals yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Share your referral link to start building your network!
                    </p>
                    <Button onClick={shareReferralLink}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Your Link
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commissions Tab */}
          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Commission History
                </CardTitle>
                <CardDescription>
                  Track earnings from your referral network
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Commission Summary */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">Total Earned</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      CHF {(stats?.totalCommissionEarned || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      CHF {(stats?.pendingCommission || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Commission Events Table */}
                {commissions && commissions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>From</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-sm">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">{c.fromUserName}</TableCell>
                          <TableCell>{formatTriggerType(c.triggerType)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">L{c.level}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            CHF {parseFloat(c.commissionEarned).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={c.status === "confirmed" ? "default" : "secondary"}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No commission events yet</p>
                    <p className="text-sm">Earn commissions when your referrals make purchases</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points History Tab */}
          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>
                  Track how you've earned and spent your points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pointsHistory && pointsHistory.length > 0 ? (
                  <div className="space-y-3">
                    {pointsHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            entry.points > 0 
                              ? "bg-green-100 text-green-600" 
                              : "bg-red-100 text-red-600"
                          }`}>
                            {entry.points > 0 ? (
                              <TrendingUp className="h-5 w-5" />
                            ) : (
                              <History className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{formatAction(entry.action)}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.description || new Date(entry.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            entry.points > 0 ? "text-green-600" : "text-red-600"
                          }`}>
                            {entry.points > 0 ? "+" : ""}{entry.points}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Balance: {entry.balanceAfter}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No points activity yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start referring friends to earn your first points!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Redeem Points</CardTitle>
                  <CardDescription>
                    Convert your points into discounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Current balance: <strong>{stats?.currentPoints || 0} points</strong>
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      1 point = CHF {config?.pointsToDiscountRate || 0.01}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Points to redeem
                    </label>
                    <Input
                      type="number"
                      min={config?.minPointsToRedeem || 100}
                      max={stats?.currentPoints || 0}
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)}
                      placeholder={`Min ${config?.minPointsToRedeem || 100} points`}
                    />
                    {redeemPoints > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        = CHF {(redeemPoints * (config?.pointsToDiscountRate || 0.01)).toFixed(2)} discount
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleRedeem}
                    disabled={
                      redeemPoints < (config?.minPointsToRedeem || 100) ||
                      redeemPoints > (stats?.currentPoints || 0) ||
                      redeemMutation.isPending
                    }
                    className="w-full"
                  >
                    {redeemMutation.isPending ? "Redeeming..." : "Redeem for Discount"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How to Earn Points</CardTitle>
                  <CardDescription>
                    Multiple ways to earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Refer a Friend</p>
                        <p className="text-sm text-muted-foreground">When someone signs up</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerReferral || 100}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Gift className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Referral's First Purchase</p>
                        <p className="text-sm text-muted-foreground">When they buy a service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerFirstPurchase || 50}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Create a Service</p>
                        <p className="text-sm text-muted-foreground">List your own service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerServiceCreation || 25}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="h-10 w-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                        <Star className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Write a Review</p>
                        <p className="text-sm text-muted-foreground">Review a service</p>
                      </div>
                      <Badge variant="secondary">+{config?.pointsPerReview || 10}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

