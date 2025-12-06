import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Calendar, MessageCircle, Star, CreditCard, Info, Gift, AlertCircle, Trash2, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

const notificationConfig: Record<string, { icon: any; color: string }> = {
  booking: { icon: Calendar, color: "bg-blue-500/20 text-blue-400" },
  message: { icon: MessageCircle, color: "bg-green-500/20 text-green-400" },
  review: { icon: Star, color: "bg-yellow-500/20 text-yellow-400" },
  payment: { icon: CreditCard, color: "bg-purple-500/20 text-purple-400" },
  system: { icon: Info, color: "bg-slate-500/20 text-slate-400" },
  promotion: { icon: Gift, color: "bg-pink-500/20 text-pink-400" },
  alert: { icon: AlertCircle, color: "bg-red-500/20 text-red-400" },
};

export default function Redesign2Notifications() {
  const { toast } = useToast();

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: notifications, isLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/notifications/read-all", { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/notifications/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Notification deleted" });
    },
  });

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const readNotifications = notifications?.filter(n => n.read) || [];

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Bell className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Please Sign In</h1>
        <p className="text-white/50 mb-4">You need to be logged in to view notifications.</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Sign In</Button>
        </Link>
      </div>
    );
  }

  const NotificationItem = ({ notification }: { notification: any }) => {
    const config = notificationConfig[notification.type] || notificationConfig.system;
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl backdrop-blur-xl ${notification.read ? "bg-white/5" : "bg-purple-500/10"} border border-white/10 hover:border-white/20 transition-all`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-semibold ${!notification.read ? "text-white" : "text-white/70"}`}>{notification.title}</h4>
                <p className="text-sm text-white/50 mt-1">{notification.message}</p>
              </div>
              {!notification.read && <Badge className="bg-purple-500/30 text-purple-300 border-0 shrink-0">New</Badge>}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-white/40">
                <Clock className="w-3 h-3" />
                {new Date(notification.createdAt).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {!notification.read && (
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10" onClick={() => markAsReadMutation.mutate(notification.id)}>
                    <Check className="w-4 h-4 mr-1" />
                    Mark Read
                  </Button>
                )}
                {notification.link && (
                  <Link href={notification.link}>
                    <Button variant="outline" size="sm" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10">View</Button>
                  </Link>
                )}
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-red-400 hover:bg-red-500/10" onClick={() => deleteNotificationMutation.mutate(notification.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-white/50">{unreadNotifications.length} unread notifications</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Bell, label: "Total", value: notifications?.length || 0, color: "from-slate-500/20 to-zinc-500/20" },
          { icon: AlertCircle, label: "Unread", value: unreadNotifications.length, color: "from-purple-500/20 to-pink-500/20" },
          { icon: Calendar, label: "Bookings", value: notifications?.filter(n => n.type === "booking").length || 0, color: "from-blue-500/20 to-cyan-500/20" },
          { icon: MessageCircle, label: "Messages", value: notifications?.filter(n => n.type === "message").length || 0, color: "from-green-500/20 to-emerald-500/20" },
        ].map((stat, i) => (
          <Card key={i} className={`p-4 backdrop-blur-xl bg-gradient-to-br ${stat.color} border-white/10`}>
            <div className="flex items-center gap-3">
              <stat.icon className="w-5 h-5 text-white/70" />
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/50">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">
            All <Badge className="ml-2 bg-white/10 text-white/70">{notifications?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">
            Unread <Badge className="ml-2 bg-white/10 text-white/70">{unreadNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60">
            Read <Badge className="ml-2 bg-white/10 text-white/70">{readNotifications.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Card key={i} className="h-24 animate-pulse bg-white/5 border-white/10" />)}
            </div>
          ) : notifications?.length ? (
            <div className="space-y-4">
              {notifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Bell className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No notifications</h3>
              <p className="text-white/50">You're all caught up!</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length ? (
            <div className="space-y-4">
              {unreadNotifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <CheckCheck className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-white/50">You have no unread notifications.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read">
          {readNotifications.length ? (
            <div className="space-y-4">
              {readNotifications.map((notification) => <NotificationItem key={notification.id} notification={notification} />)}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Bell className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No read notifications</h3>
              <p className="text-white/50">Notifications you've read will appear here.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8 p-4 backdrop-blur-xl bg-white/5 border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white/50" />
            <div>
              <p className="font-medium text-white">Notification Settings</p>
              <p className="text-sm text-white/50">Manage your notification preferences</p>
            </div>
          </div>
          <Link href="/redesign2/profile?tab=settings">
            <Button variant="outline" className="border-white/20 text-white/70 hover:text-white hover:bg-white/10">Configure</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
