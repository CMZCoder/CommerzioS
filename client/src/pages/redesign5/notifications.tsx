import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bell, Calendar, MessageCircle, Star, CreditCard, Gift, Settings, Check, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

export default function Redesign5Notifications() {
  const [filter, setFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/notifications/read-all");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const getIconConfig = (type: string) => {
    switch (type) {
      case "booking":
        return { icon: Calendar, gradient: "from-blue-400 to-cyan-400" };
      case "message":
        return { icon: MessageCircle, gradient: "from-purple-400 to-pink-400" };
      case "review":
        return { icon: Star, gradient: "from-amber-400 to-orange-400" };
      case "payment":
        return { icon: CreditCard, gradient: "from-green-400 to-emerald-400" };
      case "promotion":
        return { icon: Gift, gradient: "from-rose-400 to-pink-400" };
      default:
        return { icon: Bell, gradient: "from-amber-400 to-orange-400" };
    }
  };

  const filteredNotifications = notifications?.filter((n) => filter === "all" || n.type === filter);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const NotificationItem = ({ notification, index }: { notification: any; index: number }) => {
    const iconConfig = getIconConfig(notification.type);
    const Icon = iconConfig.icon;

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
        <div
          onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
          className={`p-5 cursor-pointer transition-all rounded-2xl mb-2 ${
            notification.read ? "bg-white hover:bg-amber-50" : "bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${iconConfig.gradient} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className={`font-semibold ${notification.read ? "text-amber-800" : "text-amber-900"}`}>{notification.title}</h3>
                <span className="text-xs text-amber-600/60 whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-amber-700/70">{notification.message}</p>
              {notification.actionUrl && (
                <Link href={notification.actionUrl}>
                  <span className="text-sm font-medium text-amber-600 hover:text-amber-700 mt-2 inline-block">View details →</span>
                </Link>
              )}
            </div>
            {!notification.read && <span className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shrink-0 mt-1.5 shadow-md" />}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">Notifications</h1>
          <p className="text-amber-700/60">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up! 🎉"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllReadMutation.mutate()} className="border-amber-200 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-full">
              <Check className="w-4 h-4 mr-2" /> Mark all read
            </Button>
          )}
          <Link href="/redesign5/settings/notifications">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50">
              <Settings className="w-5 h-5 text-amber-700" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="w-full h-auto bg-amber-50 rounded-2xl p-1.5 gap-1 mb-6 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "booking", label: "Bookings" },
            { value: "message", label: "Messages" },
            { value: "review", label: "Reviews" },
            { value: "payment", label: "Payments" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1 min-w-max text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm rounded-xl py-2.5 px-4 font-medium transition-all">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter}>
          <Card className="bg-white border-amber-100 rounded-3xl overflow-hidden p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-5 animate-pulse rounded-2xl bg-amber-50">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-2xl" />
                      <div className="flex-1">
                        <div className="h-4 bg-amber-100 w-1/3 rounded-full mb-2" />
                        <div className="h-3 bg-amber-100 w-2/3 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications?.length ? (
              <div>
                {filteredNotifications.map((notification, i) => (
                  <NotificationItem key={notification.id} notification={notification} index={i} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">No notifications</h3>
                <p className="text-amber-700/60">{filter === "all" ? "You're all caught up!" : `No ${filter} notifications`}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
