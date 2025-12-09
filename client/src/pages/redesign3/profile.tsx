import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Settings, Star, Calendar, MessageCircle, Heart, Edit, Camera, MapPin, Mail, Phone, Shield, Plus, ExternalLink, Zap, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Redesign3Profile() {
  const { data: user, isLoading } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: userServices } = useQuery<any[]>({
    queryKey: ["/api/services/my-services"],
    enabled: !!user,
  });
  const { data: userReviews } = useQuery<any[]>({
    queryKey: ["/api/reviews/received"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-900 mb-8" />
          <div className="h-8 w-48 bg-gray-900" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Authentication required</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="bg-black border border-cyan-500/50 overflow-hidden mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-pink-500/5" />
        <CardContent className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-cyan-400 flex items-center justify-center">
                {user.profileImage ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback className="bg-black text-cyan-400 text-3xl font-black">
                      {user.name?.[0] || user.username?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-cyan-400 text-4xl font-black">
                    {user.name?.[0] || user.username?.[0] || "U"}
                  </span>
                )}
              </div>
              <Button size="icon" className="absolute -bottom-2 -right-2 w-8 h-8 bg-cyan-400 hover:bg-cyan-300 text-black">
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-black text-white mb-2">{user.name || user.username}</h1>
              <p className="text-gray-500 font-mono text-sm mb-4">{user.email}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                {user.location && (
                  <div className="flex items-center text-gray-400 text-sm">
                    <MapPin className="w-4 h-4 mr-1 text-cyan-400" />
                    {user.location}
                  </div>
                )}
                {user.isVerified && (
                  <Badge className="bg-cyan-400/20 text-cyan-400 border-0 font-bold text-xs">
                    <Shield className="w-3 h-3 mr-1" /> VERIFIED
                  </Badge>
                )}
              </div>

              <div className="flex justify-center md:justify-start gap-3">
                <Link href="/redesign3/profile/edit">
                  <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-xs tracking-wider">
                    <Edit className="w-4 h-4 mr-2" /> EDIT PROFILE
                  </Button>
                </Link>
                <Link href="/redesign3/profile/settings">
                  <Button variant="outline" className="border-gray-800 text-gray-400 hover:text-white hover:border-gray-600 font-bold text-xs tracking-wider">
                    <Settings className="w-4 h-4 mr-2" /> SETTINGS
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Zap, label: "SERVICES", value: userServices?.length || 0, color: "cyan" },
          { icon: Calendar, label: "BOOKINGS", value: user.completedBookings || 0, color: "pink" },
          { icon: Star, label: "RATING", value: user.rating || "5.0", color: "yellow" },
          { icon: MessageCircle, label: "REVIEWS", value: userReviews?.length || 0, color: "green" },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-black border border-gray-800 hover:border-cyan-500/30 transition-all">
              <CardContent className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 text-${stat.color}-400`} />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 font-mono">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="services">
        <TabsList className="bg-black border border-gray-800 p-1 mb-6">
          <TabsTrigger value="services" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            MY SERVICES
          </TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            REVIEWS
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-cyan-400/20 data-[state=active]:text-cyan-400 text-gray-500 font-bold text-xs tracking-wider">
            ACTIVITY
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">MY SERVICES</h2>
            <Link href="/redesign3/services/create">
              <Button className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs tracking-wider">
                <Plus className="w-4 h-4 mr-2" /> CREATE SERVICE
              </Button>
            </Link>
          </div>

          {userServices?.length ? (
            <div className="grid md:grid-cols-2 gap-6">
              {userServices.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="bg-black border border-gray-800 hover:border-cyan-500/50 transition-all overflow-hidden">
                    <div className="relative h-32">
                      {service.images?.[0] ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          <Grid3X3 className="w-10 h-10 text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <Badge className={`absolute top-2 right-2 ${service.status === "active" ? "bg-cyan-400 text-black" : "bg-gray-800 text-gray-400"} font-bold text-[10px]`}>
                        {service.status?.toUpperCase() || "ACTIVE"}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-white mb-2">{service.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-black">CHF {service.price?.toFixed(2)}</span>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                          {service.rating || "5.0"}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Link href={`/redesign3/services/edit/${service.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 border-gray-800 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 font-bold text-xs">
                            EDIT
                          </Button>
                        </Link>
                        <Link href={`/redesign3/service/${service.id}`}>
                          <Button variant="outline" size="sm" className="flex-1 border-gray-800 text-gray-400 hover:text-white font-bold text-xs">
                            VIEW
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Zap className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO SERVICES YET</h3>
              <p className="text-gray-500 font-mono mb-4">// Create your first service to start earning</p>
              <Link href="/redesign3/services/create">
                <Button className="bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-wider">
                  <Plus className="w-4 h-4 mr-2" /> CREATE SERVICE
                </Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {userReviews?.length ? (
            <div className="space-y-4">
              {userReviews.map((review, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="bg-black border border-gray-800">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center shrink-0">
                          <span className="text-cyan-400 font-bold text-sm">{review.reviewer?.name?.[0] || "U"}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-bold text-white">{review.reviewer?.name || "Anonymous"}</p>
                            <span className="text-xs text-gray-600 font-mono">{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"}`} />
                            ))}
                          </div>
                          <p className="text-gray-400 text-sm font-mono">{review.comment}</p>
                          {review.service && (
                            <Link href={`/redesign3/service/${review.service.id}`}>
                              <Badge className="mt-2 bg-gray-800 text-gray-400 hover:text-cyan-400 cursor-pointer text-xs">
                                {review.service.title} <ExternalLink className="w-3 h-3 ml-1" />
                              </Badge>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-black border border-gray-800 p-12 text-center">
              <Star className="w-16 h-16 mx-auto text-gray-700 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">NO REVIEWS YET</h3>
              <p className="text-gray-500 font-mono">// Reviews will appear here once you complete bookings</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card className="bg-black border border-gray-800 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-700 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">ACTIVITY LOG</h3>
            <p className="text-gray-500 font-mono">// Coming soon</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
