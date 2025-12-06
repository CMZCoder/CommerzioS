import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin, Calendar, Settings, Grid3X3, List, Mail, Phone, Shield, Award, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Redesign5Profile() {
  const { id } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${id}`],
    enabled: !!id,
  });

  const user = id ? profileUser : currentUser;
  const isOwnProfile = !id || currentUser?.id === user?.id;

  const { data: userServices } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/services`],
    enabled: !!user?.id,
  });

  const { data: userReviews } = useQuery<any[]>({
    queryKey: [`/api/users/${user?.id}/reviews`],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-amber-100 rounded-full" />
            <div className="flex-1">
              <div className="h-8 bg-amber-100 w-1/3 rounded-full mb-3" />
              <div className="h-4 bg-amber-100 w-1/2 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Leaf className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-amber-900 mb-4">User not found</h1>
        <Link href="/redesign5">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-6">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Services", value: userServices?.length || 0 },
    { label: "Reviews", value: userReviews?.length || 0 },
    { label: "Rating", value: user.rating?.toFixed(1) || "5.0" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-24 md:pb-8">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-amber-100 rounded-3xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-28 h-28 ring-4 ring-white shadow-xl">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-amber-300 to-orange-400 text-white text-3xl font-bold">{user.name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-amber-900 mb-1">{user.name || "User"}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-amber-700/70">
                    {user.location && (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {user.location}</span>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt || Date.now()).toLocaleDateString("en", { month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                {isOwnProfile && (
                  <Link href="/redesign5/settings">
                    <Button variant="outline" className="border-amber-200 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-full">
                      <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                  </Link>
                )}
              </div>

              {user.bio && <p className="text-amber-800/70 mb-4">{user.bio}</p>}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {user.isVerified && (
                  <Badge className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3">
                    <Shield className="w-3.5 h-3.5 mr-1" /> Verified
                  </Badge>
                )}
                {user.isPro && (
                  <Badge className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3">
                    <Award className="w-3.5 h-3.5 mr-1" /> Pro
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-amber-200/50">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-amber-900 mb-1">{stat.value}</div>
                <div className="text-sm text-amber-700/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Content Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="w-full h-auto bg-amber-50 rounded-2xl p-1.5 gap-1 mb-6">
          {["services", "reviews", "about"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-1 capitalize text-amber-700 data-[state=active]:bg-white data-[state=active]:text-amber-900 data-[state=active]:shadow-sm rounded-xl py-2.5 font-medium transition-all">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="services">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-amber-700">{userServices?.length || 0} Services</h2>
            <div className="flex bg-white border border-amber-200 rounded-2xl overflow-hidden">
              <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none h-9 w-9 ${viewMode === "grid" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
                <Grid3X3 className="w-4 h-4 text-amber-700" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none h-9 w-9 border-l border-amber-200 ${viewMode === "list" ? "bg-amber-100" : "hover:bg-amber-50"}`}>
                <List className="w-4 h-4 text-amber-700" />
              </Button>
            </div>
          </div>

          {userServices?.length ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {userServices.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/redesign5/service/${service.id}`}>
                    <Card className={`group bg-white border-amber-100 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-amber-100/50 ${viewMode === "list" ? "flex flex-row" : ""}`}>
                      <div className={`overflow-hidden ${viewMode === "list" ? "w-32 h-24" : "aspect-[4/3]"}`}>
                        {service.images?.[0] ? (
                          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                            <Leaf className="w-8 h-8 text-amber-300" />
                          </div>
                        )}
                      </div>
                      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          <span className="text-sm font-medium text-amber-700">{service.rating || "5.0"}</span>
                        </div>
                        <h3 className="font-semibold text-amber-900 line-clamp-1 group-hover:text-amber-700 transition-colors">{service.title}</h3>
                        <p className="text-lg font-bold text-amber-900 mt-1">CHF {service.price?.toFixed(0)}</p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-amber-600/60">No services yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews">
          {userReviews?.length ? (
            <div className="space-y-4">
              {userReviews.map((review: any) => (
                <Card key={review.id} className="bg-white border-amber-100 rounded-3xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10 ring-2 ring-amber-100">
                      <AvatarImage src={review.reviewer?.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{review.reviewer?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-amber-900">{review.reviewer?.name || "Anonymous"}</p>
                      <p className="text-xs text-amber-600/60">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "fill-amber-500 stroke-amber-500" : "stroke-amber-200"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-amber-800/80">{review.comment}</p>
                  {review.service && (
                    <Link href={`/redesign5/service/${review.service.id}`}>
                      <span className="text-sm text-amber-600 hover:text-amber-700 mt-2 inline-block">for {review.service.title}</span>
                    </Link>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-amber-600/60">No reviews yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about">
          <Card className="bg-white border-amber-100 rounded-3xl p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-amber-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-3 text-amber-800/70">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-amber-600" />
                      </div>
                      {user.email}
                    </div>
                  )}
                  {user.phone && (
                    <div className="flex items-center gap-3 text-amber-800/70">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                        <Phone className="w-4 h-4 text-amber-600" />
                      </div>
                      {user.phone}
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-3 text-amber-800/70">
                      <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-amber-600" />
                      </div>
                      {user.location}
                    </div>
                  )}
                </div>
              </div>

              {user.skills?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-amber-900 mb-4">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill: string, i: number) => (
                      <Badge key={i} className="rounded-full bg-amber-100 text-amber-700 px-3">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.languages?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-amber-900 mb-4">Languages</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.languages.map((lang: string, i: number) => (
                      <Badge key={i} className="rounded-full bg-amber-100 text-amber-700 px-3">{lang}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
