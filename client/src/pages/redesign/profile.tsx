import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User, Settings, Briefcase, CreditCard, Star, Calendar, Plus,
  Edit, Trash2, Eye, MapPin, Mail, Phone, Shield, CheckCircle,
  Camera, Save, X, Award, TrendingUp, Clock, MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function UI2Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const initialTab = searchParams.get("tab") || "overview";

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services/my"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{ bookings?: number; services?: number; reviews?: number }>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  if (userLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-slate-200 rounded-2xl mb-8" />
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
            <div className="flex-1 h-96 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view your profile.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
                {user.emailVerified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {user.location}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href="/ui2/profile?tab=settings">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Briefcase, label: "Services", value: services?.length || 0, color: "text-violet-600" },
              { icon: Star, label: "Avg Rating", value: "5.0", color: "text-yellow-500" },
              { icon: Calendar, label: "Bookings", value: stats?.bookings || 0, color: "text-blue-500" },
              { icon: Award, label: "Points", value: user.points || 0, color: "text-green-500" },
            ].map((stat, i) => (
              <Card key={i} className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-transparent p-0 mb-6">
          {[
            { value: "overview", label: "Overview", icon: User },
            { value: "services", label: "My Services", icon: Briefcase },
            { value: "reviews", label: "Reviews", icon: Star },
            { value: "payments", label: "Payments", icon: CreditCard },
            { value: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="data-[state=active]:bg-violet-100 data-[state=active]:text-violet-700 rounded-lg px-4"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: Calendar, text: "New booking received", time: "2 hours ago", color: "bg-blue-100 text-blue-600" },
                    { icon: Star, text: "Received a 5-star review", time: "1 day ago", color: "bg-yellow-100 text-yellow-600" },
                    { icon: MessageCircle, text: "New message from customer", time: "2 days ago", color: "bg-green-100 text-green-600" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.text}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/ui2/my-bookings">
                  <Button variant="outline" className="w-full mt-4">
                    View All Activity
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span>Profile Views</span>
                    </div>
                    <span className="font-bold">1,234</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span>Response Time</span>
                    </div>
                    <span className="font-bold">&lt; 1 hour</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-violet-600" />
                      <span>Completion Rate</span>
                    </div>
                    <span className="font-bold">98%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">My Services</h2>
              <p className="text-muted-foreground">Manage your listed services</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
              <Plus className="w-4 h-4 mr-2" />
              Add New Service
            </Button>
          </div>

          {services?.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <Card key={service.id} className="overflow-hidden group">
                  <div className="relative h-40 bg-slate-200">
                    {service.images?.[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-3 left-3 ${service.status === "active" ? "bg-green-500" : "bg-yellow-500"
                        }`}
                    >
                      {service.status || "Active"}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{service.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{service.avgRating?.toFixed(1) || "5.0"}</span>
                      <span>•</span>
                      <span>{service.reviewCount || 0} reviews</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-violet-600">
                        CHF {service.price || service.basePrice || "50"}
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/ui2/service/${service.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No services yet</h3>
              <p className="text-muted-foreground mb-4">
                Start offering your skills and services to customers.
              </p>
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Service
              </Button>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews Received</CardTitle>
              <CardDescription>What customers say about your services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground">
                  Complete bookings to start receiving reviews from customers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">CHF 0.00</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">CHF 0.00</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">CHF 0.00</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Your payment history will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={user.name} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input defaultValue={user.username} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user.email} type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input defaultValue={user.phone} type="tel" />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea defaultValue={user.bio} rows={3} />
                </div>
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Email notifications", description: "Receive booking updates via email" },
                    { label: "Push notifications", description: "Get notified on your device" },
                    { label: "Marketing emails", description: "Receive tips and promotions" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch defaultChecked={i < 2} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" />
                    Two-Factor Authentication
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
