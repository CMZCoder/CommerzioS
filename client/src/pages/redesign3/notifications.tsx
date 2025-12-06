import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Calendar, MessageCircle, Star, CreditCard, Info, Gift, AlertCircle, Trash2, Clock, Settings, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

const notificationConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  booking: { icon: Calendar, color: "text-cyan-400", bgColor: "bg-cyan-400/20" },
  message: { icon: MessageCircle, color: "text-green-400", bgColor: "bg-green-400/20" },
  review: { icon: Star, color: "text-yellow-400", bgColor: "bg-yellow-400/20" },
  payment: { icon: CreditCard, color: "text-pink-400", bgColor: "bg-pink-400/20" },
  system: { icon: Zap, color: "text-gray-400", bgColor: "bg-gray-400/20" },
  promotion: { icon: Gift, color: "text-purple-400", bgColor: "bg-purple-400/20" },
  alert: { icon: AlertCircle, color: "text-red-400", bgColor: "bg-red-400/20" },
};

export default function Redesign3Notifications() {
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
      toast({ title: "All marked as read" });
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
        <Bell className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Authentication required</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  const NotificationItem = ({ notification, index }: { notification: any; index: number }) => {
    const config = notificationConfig[notification.type] || notificationConfig.system;
    const Icon = config.icon;

    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
        <div className={`p-4 border-l-2 ${notification.read ? "border-gray-800 bg-black" : "border-cyan-400 bg-cyan-400/5"} hover:bg-gray-900/50 transition-all`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 ${config.bgColor} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className={`font-bold ${!notification.read ? "text-white" : "text-gray-400"}`}>{notification.title}</h4>
                {!notification.read && <Badge className="bg-cyan-400 text-black font-bold text-[10px]">NEW</Badge>}
              </div>
              <p className="text-sm text-gray-500 font-mono mb-2">{notification.message}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-gray-600 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(notification.createdAt).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  {!notification.read && (
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 text-xs font-mono" onClick={() => markAsReadMutation.mutate(notification.id)}>
                      <Check className="w-3 h-3 mr-1" /> READ
                    </Button>
                  )}
                  {notification.link && (
                    <Link href={notification.link}>
                      <Button variant="ghost" size="sm" className="text-cyan-400 hover:bg-cyan-400/10 text-xs font-mono">VIEW</Button>
                    </Link>
                  )}
                  <Button variant="ghost" size="icon" className="text-gray-600 hover:text-red-400 hover:bg-red-500/10 w-8 h-8" onClick={() => deleteNotificationMutation.mutate(notification.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
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
          <h1 className="text-3xl font-black text-white">NOTIFICATIONS</h1>
          <p className="text-gray-500 font-mono text-sm">// {unreadNotifications.length} unread alerts</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-xs tracking-wider" onClick={() => markAllAsReadMutation.mutate()}>
            <CheckCheck className="w-4 h-4 mr-2" /> MARK ALL READ
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Bell, label: "TOTAL", value: notifications?.length || 0, color: "text-gray-400" },
          { icon: AlertCircle, label: "UNREAD", value: unreadNotifications.length, color: "text-cyan-400" },
          { icon: Calendar, label: "BOOKINGS", value: notifications?.filter(n => n.type === "booking").length || 0, color: "text-pink-400" },
          { icon: MessageCircle, label: "MESSAGES", value: notifications?.filter(n => n.type === "message").length || 0, color: "text-green-400" },
        ].map((stat, i) => (
          <Card key={i} className="bg-black border border-gray-800">
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 font-mono">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-black border border-gray-800 p-1 mb-6">
          <TabsTrigger value="all" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            ALL <Badge className="ml-2 bg-gray-800 text-gray-400">{notifications?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            UNREAD <Badge className="ml-2 bg-gray-800 text-gray-400">{unreadNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            READ <Badge className="ml-2 bg-gray-800 text-gray-400">{readNotifications.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-900 animate-pulse" />)}
            </div>
          ) : notifications?.length ? (
            <Card className="bg-black border border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-800">
                {notifications.map((notification, i) => <NotificationItem key={notification.id} notification={notification} index={i} />)}
              </div>
            </Card>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO NOTIFICATIONS</h3>
              <p className="text-gray-500 font-mono">// System is quiet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length ? (
            <Card className="bg-black border border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-800">
                {unreadNotifications.map((notification, i) => <NotificationItem key={notification.id} notification={notification} index={i} />)}
              </div>
            </Card>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <CheckCheck className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">ALL CLEAR</h3>
              <p className="text-gray-500 font-mono">// No unread notifications</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read">
          {readNotifications.length ? (
            <Card className="bg-black border border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-800">
                {readNotifications.map((notification, i) => <NotificationItem key={notification.id} notification={notification} index={i} />)}
              </div>
            </Card>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO READ NOTIFICATIONS</h3>
              <p className="text-gray-500 font-mono">// Archive is empty</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card className="mt-8 bg-black border border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-bold text-white">NOTIFICATION SETTINGS</p>
              <p className="text-sm text-gray-500 font-mono">// Configure alerts</p>
            </div>
          </div>
          <Link href="/redesign3/profile?tab=settings">
            <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 font-bold text-xs tracking-wider">CONFIGURE</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
