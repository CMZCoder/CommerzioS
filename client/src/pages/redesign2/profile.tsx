import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, Calendar, Briefcase, Star, Settings, Award, TrendingUp, Clock, CheckCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Redesign2Profile() {
  const { data: user, isLoading } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: services } = useQuery<any[]>({ queryKey: ["/api/services/my"], enabled: !!user });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-48 bg-white/5 rounded-2xl mb-8" />
          <div className="h-96 bg-white/5 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-white/30 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Please Sign In</h1>
        <p className="text-white/50 mb-4">You need to be logged in to view your profile.</p>
        <Link href="/login">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="mb-8 overflow-hidden backdrop-blur-xl bg-white/5 border-white/10">
        <div className="h-32 bg-gradient-to-r from-purple-500/30 to-pink-500/30" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <Avatar className="w-24 h-24 border-4 border-slate-900 shadow-xl">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{user.name || user.username}</h1>
                {user.emailVerified && <CheckCircle className="w-5 h-5 text-blue-400" />}
              </div>
              <p className="text-white/50">@{user.username}</p>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Briefcase, label: "Services", value: services?.length || 0, color: "from-purple-500/20 to-pink-500/20 text-purple-400" },
              { icon: Star, label: "Avg Rating", value: "5.0", color: "from-yellow-500/20 to-orange-500/20 text-yellow-400" },
              { icon: Calendar, label: "Bookings", value: 0, color: "from-blue-500/20 to-cyan-500/20 text-blue-400" },
              { icon: Award, label: "Points", value: user.points || 0, color: "from-green-500/20 to-emerald-500/20 text-green-400" },
            ].map((stat, i) => (
              <div key={i} className={`p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br ${stat.color} border border-white/10 text-center`}>
                <stat.icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
          {[
            { value: "overview", label: "Overview", icon: User },
            { value: "services", label: "My Services", icon: Briefcase },
            { value: "reviews", label: "Reviews", icon: Star },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300 text-white/60"
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: Calendar, text: "New booking received", time: "2 hours ago", color: "bg-blue-500/20 text-blue-400" },
                    { icon: Star, text: "Received a 5-star review", time: "1 day ago", color: "bg-yellow-500/20 text-yellow-400" },
                    { icon: MessageCircle, text: "New message", time: "2 days ago", color: "bg-green-500/20 text-green-400" },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.color}`}>
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{activity.text}</p>
                        <p className="text-sm text-white/50">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: TrendingUp, label: "Profile Views", value: "1,234", color: "text-green-400" },
                    { icon: Clock, label: "Response Time", value: "< 1 hour", color: "text-blue-400" },
                    { icon: CheckCircle, label: "Completion Rate", value: "98%", color: "text-purple-400" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-3">
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        <span className="text-white/70">{stat.label}</span>
                      </div>
                      <span className="font-bold text-white">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="services">
          {services?.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service: any) => (
                <Card key={service.id} className="overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 group">
                  <div className="relative h-40 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                    {service.images?.[0] ? (
                      <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover opacity-80" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-white/20" />
                      </div>
                    )}
                    <Badge className="absolute top-3 left-3 bg-green-500/20 text-green-300 border-0">Active</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-1 line-clamp-1">{service.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-white/50 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{service.avgRating?.toFixed(1) || "5.0"}</span>
                      <span>•</span>
                      <span>{service.reviewCount || 0} reviews</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-400">CHF {service.price || service.basePrice || "50"}</span>
                      <Link href={`/redesign2/service/${service.id}`}>
                        <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">View</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
              <Briefcase className="w-16 h-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No services yet</h3>
              <p className="text-white/50 mb-4">Start offering your skills and services.</p>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">Create Your First Service</Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="p-12 text-center backdrop-blur-xl bg-white/5 border-white/10">
            <Star className="w-16 h-16 mx-auto text-white/30 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No reviews yet</h3>
            <p className="text-white/50">Complete bookings to start receiving reviews.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
