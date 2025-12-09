import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Bell, Calendar, MessageCircle, Star, CreditCard, Gift, Settings, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";

export default function Redesign4Notifications() {
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

  const getIcon = (type: string) => {
    switch (type) {
      case "booking":
        return Calendar;
      case "message":
        return MessageCircle;
      case "review":
        return Star;
      case "payment":
        return CreditCard;
      case "promotion":
        return Gift;
      default:
        return Bell;
    }
  };

  const filteredNotifications = notifications?.filter((n) => filter === "all" || n.type === filter);
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const NotificationItem = ({ notification, index }: { notification: any; index: number }) => {
    const Icon = getIcon(notification.type);

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
        <div
          onClick={() => !notification.read && markReadMutation.mutate(notification.id)}
          className={`p-5 border-b border-stone-100 cursor-pointer transition-colors ${
            notification.read ? "bg-white" : "bg-stone-50 hover:bg-stone-100"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${notification.read ? "bg-stone-100" : "bg-stone-900"}`}>
              <Icon className={`w-4 h-4 stroke-[1.5] ${notification.read ? "text-stone-500" : "text-white"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-1">
                <h3 className={`text-sm ${notification.read ? "text-stone-600" : "text-stone-900"}`}>{notification.title}</h3>
                <span className="text-xs text-stone-400 whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
              <p className="text-sm text-stone-500">{notification.message}</p>
              {notification.actionUrl && (
                <Link href={notification.actionUrl}>
                  <span className="text-sm text-stone-900 hover:underline mt-2 inline-block">View details →</span>
                </Link>
              )}
            </div>
            {!notification.read && <span className="w-2 h-2 bg-stone-900 rounded-full shrink-0 mt-2" />}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-light text-stone-900 mb-2">Notifications</h1>
          <p className="text-stone-500">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllReadMutation.mutate()} className="border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-none">
              <Check className="w-4 h-4 mr-2 stroke-[1.5]" /> Mark all read
            </Button>
          )}
          <Link href="/redesign4/settings/notifications">
            <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100">
              <Settings className="w-4 h-4 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" onValueChange={setFilter} className="w-full">
        <TabsList className="w-full h-auto bg-transparent border-b border-stone-200 rounded-none p-0 gap-6 overflow-x-auto">
          {[
            { value: "all", label: "All" },
            { value: "booking", label: "Bookings" },
            { value: "message", label: "Messages" },
            { value: "review", label: "Reviews" },
            { value: "payment", label: "Payments" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-900 data-[state=active]:border-b-2 data-[state=active]:border-stone-900 text-stone-400 rounded-none pb-3 px-0 whitespace-nowrap">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={filter} className="pt-0 mt-0">
          <Card className="bg-white border border-stone-200 rounded-none overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-stone-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-stone-100" />
                      <div className="flex-1">
                        <div className="h-4 bg-stone-100 w-1/3 mb-2" />
                        <div className="h-3 bg-stone-100 w-2/3" />
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
                <Bell className="w-12 h-12 mx-auto text-stone-300 mb-4 stroke-[1]" />
                <h3 className="text-xl text-stone-900 mb-2">No notifications</h3>
                <p className="text-stone-500">{filter === "all" ? "You're all caught up" : `No ${filter} notifications`}</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
