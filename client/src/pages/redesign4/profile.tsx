import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { Star, MapPin, Calendar, Settings, Edit2, Grid3X3, List, User, Mail, Phone, Shield, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Redesign4Profile() {
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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="flex items-start gap-8 mb-12">
            <div className="w-24 h-24 bg-stone-100 rounded-full" />
            <div className="flex-1">
              <div className="h-8 bg-stone-100 w-1/3 mb-2" />
              <div className="h-4 bg-stone-100 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-light text-stone-900 mb-4">User not found</h1>
        <Link href="/redesign4">
          <Button className="bg-stone-900 hover:bg-stone-800 text-white rounded-none">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const stats = [
    { label: "Services", value: userServices?.length || 0 },
    { label: "Reviews", value: userReviews?.length || 0 },
    { label: "Rating", value: user.rating?.toFixed(1) || "5.0" },
    { label: "Years", value: user.yearsActive || 1 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <Avatar className="w-24 h-24 border border-stone-200">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="bg-stone-100 text-stone-600 text-2xl">{user.name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-light text-stone-900 mb-1">{user.name || "User"}</h1>
                <div className="flex items-center gap-4 text-sm text-stone-500">
                  {user.location && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4 stroke-[1.5]" /> {user.location}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4 stroke-[1.5]" /> Joined {new Date(user.createdAt || Date.now()).toLocaleDateString("en", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
              {isOwnProfile && (
                <Link href="/redesign4/settings">
                  <Button variant="outline" className="border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 rounded-none">
                    <Settings className="w-4 h-4 mr-2 stroke-[1.5]" /> Settings
                  </Button>
                </Link>
              )}
            </div>

            {user.bio && <p className="text-stone-600 mb-6">{user.bio}</p>}

            <div className="flex items-center gap-3">
              {user.isVerified && (
                <Badge variant="outline" className="rounded-none border-stone-200 text-stone-600">
                  <Shield className="w-3 h-3 mr-1 stroke-[1.5]" /> Verified
                </Badge>
              )}
              {user.isPro && (
                <Badge className="bg-stone-900 text-white rounded-none">
                  <Award className="w-3 h-3 mr-1 stroke-[1.5]" /> Pro
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-10 py-8 border-y border-stone-200">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-light text-stone-900 mb-1">{stat.value}</div>
              <div className="text-xs uppercase tracking-wider text-stone-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Content Tabs */}
      <Tabs defaultValue="services" className="w-full">
        <TabsList className="w-full h-auto bg-transparent border-b border-stone-200 rounded-none p-0 gap-8">
          {["services", "reviews", "about"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-sm uppercase tracking-wider data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-stone-900 data-[state=active]:border-b-2 data-[state=active]:border-stone-900 text-stone-400 rounded-none pb-3 px-0">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="services" className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs uppercase tracking-wider text-stone-400">{userServices?.length || 0} Services</h2>
            <div className="flex border border-stone-200">
              <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")} className={`rounded-none h-8 w-8 ${viewMode === "grid" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
                <Grid3X3 className="w-4 h-4 stroke-[1.5]" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode("list")} className={`rounded-none h-8 w-8 border-l border-stone-200 ${viewMode === "list" ? "bg-stone-100" : "hover:bg-stone-50"}`}>
                <List className="w-4 h-4 stroke-[1.5]" />
              </Button>
            </div>
          </div>

          {userServices?.length ? (
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {userServices.map((service, i) => (
                <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/redesign4/service/${service.id}`}>
                    <Card className={`group bg-white border-0 shadow-none hover:shadow-md transition-all cursor-pointer overflow-hidden ${viewMode === "list" ? "flex flex-row" : ""}`}>
                      <div className={`overflow-hidden bg-stone-100 ${viewMode === "list" ? "w-36 h-28" : "aspect-[4/3]"}`}>
                        {service.images?.[0] ? (
                          <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">No image</div>
                        )}
                      </div>
                      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3 h-3 fill-stone-900 stroke-stone-900" />
                          <span className="text-sm text-stone-900">{service.rating || "5.0"}</span>
                        </div>
                        <h3 className="text-stone-900 group-hover:text-stone-600 transition-colors mb-1 line-clamp-1">{service.title}</h3>
                        <p className="text-lg font-light text-stone-900">CHF {service.price?.toFixed(0)}</p>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-stone-500">No services yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reviews" className="pt-8">
          {userReviews?.length ? (
            <div className="space-y-6">
              {userReviews.map((review: any) => (
                <div key={review.id} className="pb-6 border-b border-stone-100 last:border-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.reviewer?.avatarUrl} />
                      <AvatarFallback className="bg-stone-100 text-stone-600">{review.reviewer?.name?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-stone-900">{review.reviewer?.name || "Anonymous"}</p>
                      <p className="text-xs text-stone-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? "fill-stone-900 stroke-stone-900" : "stroke-stone-300"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-stone-600">{review.comment}</p>
                  {review.service && (
                    <Link href={`/redesign4/service/${review.service.id}`}>
                      <span className="text-xs text-stone-400 hover:text-stone-600 mt-2 inline-block">for {review.service.title}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-stone-500">No reviews yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about" className="pt-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {user.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                    <span className="text-stone-600">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                    <span className="text-stone-600">{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-stone-400 stroke-[1.5]" />
                    <span className="text-stone-600">{user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {user.skills?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none border-stone-200 text-stone-600">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}

            {user.languages?.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {user.languages.map((lang: string, i: number) => (
                    <Badge key={i} variant="outline" className="rounded-none border-stone-200 text-stone-600">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
