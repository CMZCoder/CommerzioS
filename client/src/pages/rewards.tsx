/**
 * COM Points Rewards Dashboard
 * 
 * Inspired by OptimAI dashboard - dark theme, missions with tiers,
 * gamified progress tracking, and redemption shop.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { fetchApi } from "@/lib/config";
import {
    Star,
    Gift,
    ShoppingBag,
    History,
    Award,
    Users,
    CheckCircle,
    Clock,
    Zap,
    Share2,
    Heart,
    MessageSquare,
    Instagram,
    Twitter,
    Facebook,
} from "lucide-react";

// Types
interface ComPointsBalance {
    balance: number;
}

interface Mission {
    mission: {
        id: string;
        name: string;
        description: string | null;
        category: "referral" | "social_media" | "engagement" | "milestone";
        rewardPoints: number;
        tier: number | null;
        targetCount: number | null;
        isRepeatable: boolean;
    };
    userProgress?: {
        id: string;
        status: "available" | "in_progress" | "completed" | "claimed" | "expired";
        progress: number;
        targetCount: number;
        completedAt: string | null;
        claimedAt: string | null;
    };
}

interface PointsTransaction {
    id: string;
    amount: number;
    balanceAfter: number;
    sourceType: string;
    description: string | null;
    createdAt: string;
}

interface RedemptionItem {
    id: string;
    name: string;
    description: string | null;
    costPoints: number;
    itemType: string;
    valueConfig: any;
    isActive: boolean;
    stock: number | null;
    maxPerUser: number | null;
}

interface Redemption {
    id: string;
    pointsSpent: number;
    status: string;
    expiresAt: string | null;
    createdAt: string;
    item: RedemptionItem;
}

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
    referral: <Users className="h-5 w-5" />,
    social_media: <Share2 className="h-5 w-5" />,
    engagement: <MessageSquare className="h-5 w-5" />,
    milestone: <Award className="h-5 w-5" />,
};

// Category colors
const categoryColors: Record<string, string> = {
    referral: "from-green-500 to-emerald-600",
    social_media: "from-blue-500 to-indigo-600",
    engagement: "from-purple-500 to-pink-600",
    milestone: "from-yellow-500 to-orange-600",
};

export default function RewardsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("missions");

    // Fetch COM Points balance
    const { data: balanceData, isLoading: balanceLoading } = useQuery<ComPointsBalance>({
        queryKey: ["/api/com-points/balance"],
    });

    // Fetch available missions
    const { data: missionsData, isLoading: missionsLoading } = useQuery<{ missions: Mission[] }>({
        queryKey: ["/api/com-points/missions"],
    });

    // Fetch points history
    const { data: historyData } = useQuery<{ history: PointsTransaction[] }>({
        queryKey: ["/api/com-points/history"],
    });

    // Fetch shop items
    const { data: shopData, isLoading: shopLoading } = useQuery<{ items: RedemptionItem[] }>({
        queryKey: ["/api/com-points/shop"],
    });

    // Fetch user redemptions
    const { data: redemptionsData } = useQuery<{ redemptions: Redemption[] }>({
        queryKey: ["/api/com-points/redemptions"],
    });

    // Start mission mutation
    const startMission = useMutation({
        mutationFn: async (missionId: string) => {
            const res = await fetchApi(`/api/com-points/missions/${missionId}/start`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to start mission");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/missions"] });
            toast({ title: "Mission Started!", description: "Good luck completing your mission!" });
        },
    });

    // Claim reward mutation
    const claimReward = useMutation({
        mutationFn: async (missionId: string) => {
            const res = await fetchApi(`/api/com-points/missions/${missionId}/claim`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to claim reward");
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/missions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/balance"] });
            toast({
                title: "Reward Claimed! 🎉",
                description: `You earned ${data.pointsAwarded} COM Points!`
            });
        },
    });

    // Redeem item mutation
    const redeemItem = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await fetchApi(`/api/com-points/redeem/${itemId}`, {
                method: "POST",
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to redeem");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/balance"] });
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/shop"] });
            queryClient.invalidateQueries({ queryKey: ["/api/com-points/redemptions"] });
            toast({ title: "Redeemed! 🎁", description: "Check your redemptions for details." });
        },
        onError: (error: Error) => {
            toast({ title: "Redemption Failed", description: error.message, variant: "destructive" });
        },
    });

    // Group missions by category
    const groupedMissions = missionsData?.missions.reduce((acc, m) => {
        const cat = m.mission.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
    }, {} as Record<string, Mission[]>) || {};

    // Calculate completed missions count
    const completedCount = missionsData?.missions.filter(
        m => m.userProgress?.status === "claimed"
    ).length || 0;
    const totalMissions = missionsData?.missions.length || 0;

    if (balanceLoading) {
        return (
            <Layout>
                <div className="container mx-auto py-8 px-4">
                    <Skeleton className="h-8 w-64 mb-6" />
                    <div className="grid gap-6 md:grid-cols-3">
                        {[1, 2, 3].map((i) => (
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
                {/* Header with Balance */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <Zap className="h-8 w-8 text-yellow-500" />
                            COM Points
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Complete missions to earn points and redeem rewards
                        </p>
                    </div>

                    {/* Main Balance Display */}
                    <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg min-w-[200px]">
                        <p className="text-yellow-100 text-sm font-medium mb-1">Your Balance</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{balanceData?.balance || 0}</span>
                            <span className="text-lg opacity-80">pts</span>
                        </div>
                        <p className="text-yellow-100 text-xs mt-2">
                            {completedCount}/{totalMissions} Missions Completed
                        </p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">{groupedMissions.referral?.length || 0}</p>
                                    <p className="text-sm text-muted-foreground">Referral Missions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Share2 className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{groupedMissions.social_media?.length || 0}</p>
                                    <p className="text-sm text-muted-foreground">Social Missions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{groupedMissions.engagement?.length || 0}</p>
                                    <p className="text-sm text-muted-foreground">Engagement</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                    <ShoppingBag className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-yellow-600">{shopData?.items?.length || 0}</p>
                                    <p className="text-sm text-muted-foreground">Shop Items</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                        <TabsTrigger value="missions" className="gap-2">
                            <Star className="h-4 w-4" />
                            Missions
                        </TabsTrigger>
                        <TabsTrigger value="shop" className="gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Shop
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    {/* Missions Tab */}
                    <TabsContent value="missions">
                        {missionsLoading ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <Skeleton key={i} className="h-40" />
                                ))}
                            </div>
                        ) : missionsData?.missions && missionsData.missions.length > 0 ? (
                            <div className="space-y-8">
                                {Object.entries(groupedMissions).map(([category, missions]) => (
                                    <div key={category}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${categoryColors[category]} flex items-center justify-center text-white`}>
                                                {categoryIcons[category]}
                                            </div>
                                            <h2 className="text-xl font-semibold capitalize">
                                                {category.replace("_", " ")}
                                            </h2>
                                            <Badge variant="secondary">{missions.length}</Badge>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            {missions.map((m) => (
                                                <MissionCard
                                                    key={m.mission.id}
                                                    mission={m}
                                                    onStart={() => startMission.mutate(m.mission.id)}
                                                    onClaim={() => claimReward.mutate(m.mission.id)}
                                                    isStarting={startMission.isPending}
                                                    isClaiming={claimReward.isPending}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<Star className="h-12 w-12" />}
                                title="No Missions Available"
                                description="Check back later for new missions to complete!"
                            />
                        )}
                    </TabsContent>

                    {/* Shop Tab */}
                    <TabsContent value="shop">
                        {shopLoading ? (
                            <div className="grid gap-4 md:grid-cols-3">
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-48" />
                                ))}
                            </div>
                        ) : shopData?.items && shopData.items.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {shopData.items.map((item) => (
                                    <ShopItemCard
                                        key={item.id}
                                        item={item}
                                        balance={balanceData?.balance || 0}
                                        onRedeem={() => redeemItem.mutate(item.id)}
                                        isRedeeming={redeemItem.isPending}
                                    />
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={<ShoppingBag className="h-12 w-12" />}
                                title="Shop Coming Soon"
                                description="Redeem your points for exciting rewards!"
                            />
                        )}

                        {/* Redemptions History */}
                        {redemptionsData?.redemptions && redemptionsData.redemptions.length > 0 && (
                            <Card className="mt-8">
                                <CardHeader>
                                    <CardTitle>Your Redemptions</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {redemptionsData.redemptions.map((r) => (
                                            <div key={r.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{r.item.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {r.pointsSpent} pts • {new Date(r.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <Badge variant={r.status === "applied" ? "default" : "secondary"}>
                                                    {r.status}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        {historyData?.history && historyData.history.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Points History</CardTitle>
                                    <CardDescription>Track your COM Points transactions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {historyData.history.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.amount > 0
                                                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                                        }`}>
                                                        {tx.amount > 0 ? <Zap className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium capitalize">{tx.sourceType}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {tx.description || new Date(tx.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                                                        {tx.amount > 0 ? "+" : ""}{tx.amount} pts
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Balance: {tx.balanceAfter}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <EmptyState
                                icon={<History className="h-12 w-12" />}
                                title="No History Yet"
                                description="Complete missions to start earning points!"
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </Layout>
    );
}

// Mission Card Component
function MissionCard({
    mission,
    onStart,
    onClaim,
    isStarting,
    isClaiming
}: {
    mission: Mission;
    onStart: () => void;
    onClaim: () => void;
    isStarting: boolean;
    isClaiming: boolean;
}) {
    const m = mission.mission;
    const progress = mission.userProgress;
    const progressPercent = progress
        ? Math.min((progress.progress / progress.targetCount) * 100, 100)
        : 0;

    const statusConfig = {
        available: { label: "Start", color: "bg-blue-500 hover:bg-blue-600", action: onStart, loading: isStarting },
        in_progress: { label: "In Progress", color: "bg-gray-400", action: null, loading: false },
        completed: { label: "Claim Reward", color: "bg-green-500 hover:bg-green-600", action: onClaim, loading: isClaiming },
        claimed: { label: "Claimed ✓", color: "bg-gray-400", action: null, loading: false },
        expired: { label: "Expired", color: "bg-gray-400", action: null, loading: false },
    };

    const status = progress?.status || "available";
    const config = statusConfig[status];

    return (
        <Card className="overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${categoryColors[m.category]}`} />
            <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {m.tier && (
                            <Badge variant="outline" className="text-xs">
                                Tier {m.tier}
                            </Badge>
                        )}
                        <span className="text-sm text-muted-foreground capitalize">
                            {m.category.replace("_", " ")}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Zap className="h-4 w-4" />
                        +{m.rewardPoints}
                    </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{m.name}</h3>
                {m.description && (
                    <p className="text-sm text-muted-foreground mb-4">{m.description}</p>
                )}

                {/* Progress bar for in-progress missions */}
                {progress && status === "in_progress" && (
                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress.progress}/{progress.targetCount}</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                    </div>
                )}

                <Button
                    className={`w-full ${config.color}`}
                    onClick={config.action || undefined}
                    disabled={!config.action || config.loading}
                >
                    {config.loading ? "Loading..." : config.label}
                </Button>
            </CardContent>
        </Card>
    );
}

// Shop Item Card Component
function ShopItemCard({
    item,
    balance,
    onRedeem,
    isRedeeming
}: {
    item: RedemptionItem;
    balance: number;
    onRedeem: () => void;
    isRedeeming: boolean;
}) {
    const canAfford = balance >= item.costPoints;
    const isAvailable = item.stock === null || item.stock > 0;

    const itemIcons: Record<string, React.ReactNode> = {
        commission_discount: <Gift className="h-6 w-6" />,
        listing_slot: <ShoppingBag className="h-6 w-6" />,
        featured_listing: <Star className="h-6 w-6" />,
        inquiry_credits: <MessageSquare className="h-6 w-6" />,
        platform_credits: <Zap className="h-6 w-6" />,
    };

    return (
        <Card className={`relative overflow-hidden transition-all ${canAfford && isAvailable ? "hover:shadow-lg" : "opacity-60"}`}>
            {item.stock !== null && item.stock <= 5 && item.stock > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-500">Only {item.stock} left!</Badge>
            )}

            <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                        {itemIcons[item.itemType] || <Gift className="h-6 w-6" />}
                    </div>
                    <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-lg">
                        <Zap className="h-5 w-5" />
                        {item.costPoints} pts
                    </div>
                    <Button
                        onClick={onRedeem}
                        disabled={!canAfford || !isAvailable || isRedeeming}
                        size="sm"
                    >
                        {isRedeeming ? "..." : canAfford ? "Redeem" : "Not enough"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// Empty State Component
function EmptyState({
    icon,
    title,
    description
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}
