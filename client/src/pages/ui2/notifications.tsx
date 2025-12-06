import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell, Check, CheckCheck, Calendar, MessageCircle, Star, CreditCard,
  User, Settings, Trash2, Clock, AlertCircle, Info, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

const notificationConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  booking: { icon: Calendar, color: "text-blue-600", bgColor: "bg-blue-100" },
  message: { icon: MessageCircle, color: "text-green-600", bgColor: "bg-green-100" },
  review: { icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-100" },
  payment: { icon: CreditCard, color: "text-violet-600", bgColor: "bg-violet-100" },
  system: { icon: Info, color: "text-slate-600", bgColor: "bg-slate-100" },
  promotion: { icon: Gift, color: "text-pink-600", bgColor: "bg-pink-100" },
  alert: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-100" },
};

export default function UI2Notifications() {
  const { toast } = useToast();

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

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
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view notifications.</p>
        <Link href="/login">
          <Button>Sign In</Button>
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
        className={`p-4 rounded-xl ${notification.read ? "bg-white" : "bg-violet-50"} border hover:shadow-md transition-all`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              {!notification.read && (
                <Badge className="bg-violet-600 shrink-0">New</Badge>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {new Date(notification.createdAt).toLocaleString()}
              </div>
              <div className="flex gap-2">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Mark Read
                  </Button>
                )}
                {notification.link && (
                  <Link href={notification.link}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={() => deleteNotificationMutation.mutate(notification.id)}
                >
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadNotifications.length} unread notifications
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Bell, label: "Total", value: notifications?.length || 0, color: "bg-slate-100 text-slate-700" },
          { icon: AlertCircle, label: "Unread", value: unreadNotifications.length, color: "bg-violet-100 text-violet-700" },
          { icon: Calendar, label: "Bookings", value: notifications?.filter(n => n.type === "booking").length || 0, color: "bg-blue-100 text-blue-700" },
          { icon: MessageCircle, label: "Messages", value: notifications?.filter(n => n.type === "message").length || 0, color: "bg-green-100 text-green-700" },
        ].map((stat, i) => (
          <Card key={i} className={`p-4 ${stat.color}`}>
            <div className="flex items-center gap-3">
              <stat.icon className="w-5 h-5" />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Notifications Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-2">{notifications?.length || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge variant="secondary" className="ml-2">{unreadNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="read">
            Read
            <Badge variant="secondary" className="ml-2">{readNotifications.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : notifications?.length ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! Check back later for updates.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length ? (
            <div className="space-y-4">
              {unreadNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <CheckCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">All caught up!</h3>
              <p className="text-muted-foreground">
                You have no unread notifications.
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="read">
          {readNotifications.length ? (
            <div className="space-y-4">
              {readNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No read notifications</h3>
              <p className="text-muted-foreground">
                Notifications you've read will appear here.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Settings Link */}
      <Card className="mt-8 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Notification Settings</p>
              <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
            </div>
          </div>
          <Link href="/ui2/profile?tab=settings">
            <Button variant="outline">Configure</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
