import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  User, MapPin, Star, Calendar, MessageCircle, Heart, Share2,
  Shield, CheckCircle, Clock, Briefcase, Award, ThumbsUp,
  ChevronRight, ExternalLink, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function UI2UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: profileUser, isLoading } = useQuery<any>({
    queryKey: ["/api/users", id],
    queryFn: () => apiRequest(`/api/users/${id}`),
    enabled: !!id,
  });

  const { data: userServices } = useQuery<any[]>({
    queryKey: ["/api/services", { userId: id }],
    queryFn: () => apiRequest(`/api/services?userId=${id}`),
    enabled: !!id,
  });

  const { data: userReviews } = useQuery<any[]>({
    queryKey: ["/api/reviews", { userId: id }],
    queryFn: () => apiRequest(`/api/reviews?userId=${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-slate-200 rounded-2xl" />
          <div className="flex gap-8">
            <div className="w-64 space-y-4">
              <div className="h-40 bg-slate-200 rounded-xl" />
              <div className="h-32 bg-slate-200 rounded-xl" />
            </div>
            <div className="flex-1 h-96 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
        <p className="text-muted-foreground mb-4">This user doesn't exist or their profile is private.</p>
        <Link href="/ui2/search">
          <Button>Browse Services</Button>
        </Link>
      </div>
    );
  }

  const avgRating = userReviews?.length 
    ? (userReviews.reduce((acc, r) => acc + r.rating, 0) / userReviews.length).toFixed(1)
    : "5.0";

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: userReviews?.filter(r => r.rating === rating).length || 0,
    percentage: userReviews?.length 
      ? ((userReviews.filter(r => r.rating === rating).length / userReviews.length) * 100)
      : 0
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-violet-600 to-indigo-600" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
            <div className="relative">
              <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                <AvatarImage src={profileUser.profileImage} className="object-cover" />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                  {profileUser.name?.charAt(0) || profileUser.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              {profileUser.emailVerified && (
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{profileUser.name || profileUser.username}</h1>
                {profileUser.emailVerified && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">@{profileUser.username}</p>
              {profileUser.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4" />
                  {profileUser.location}
                </p>
              )}
              {profileUser.bio && (
                <p className="text-sm mt-2 max-w-2xl">{profileUser.bio}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/ui2/chat?user=${id}`}>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Star, label: "Rating", value: avgRating, color: "text-yellow-500" },
              { icon: Briefcase, label: "Services", value: userServices?.length || 0, color: "text-violet-600" },
              { icon: ThumbsUp, label: "Reviews", value: userReviews?.length || 0, color: "text-blue-500" },
              { icon: Clock, label: "Response Time", value: "< 1hr", color: "text-green-500" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="services">
        <TabsList className="mb-6">
          <TabsTrigger value="services" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Services ({userServices?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-2">
            <Star className="w-4 h-4" />
            Reviews ({userReviews?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <User className="w-4 h-4" />
            About
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services">
          {userServices?.length ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userServices.map((service: any) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                >
                  <Link href={`/ui2/service/${service.id}`}>
                    <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all">
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
                        <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800">
                          {service.category?.name || "Service"}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{service.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{service.avgRating?.toFixed(1) || "5.0"}</span>
                            <span className="text-sm text-muted-foreground">({service.reviewCount || 0})</span>
                          </div>
                          <span className="font-bold text-violet-600">
                            CHF {service.price || service.basePrice || "50"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No services yet</h3>
              <p className="text-muted-foreground">
                This user hasn't listed any services.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Rating Summary */}
            <Card className="md:col-span-1 h-fit">
              <CardHeader>
                <CardTitle>Rating Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">{avgRating}</span>
                  <div className="flex items-center justify-center gap-1 my-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(parseFloat(avgRating))
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {userReviews?.length || 0} reviews
                  </p>
                </div>

                <div className="space-y-3">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="w-3 text-sm">{rating}</span>
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <Progress value={percentage} className="flex-1 h-2" />
                      <span className="w-8 text-sm text-muted-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="md:col-span-2 space-y-4">
              {userReviews?.length ? (
                userReviews.map((review: any) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.reviewer?.profileImage} />
                          <AvatarFallback>{review.reviewer?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold">{review.reviewer?.name || "User"}</p>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.service && (
                            <Badge variant="secondary" className="mb-2">
                              {review.service.title}
                            </Badge>
                          )}
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <Star className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">
                    This user hasn't received any reviews yet.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">About</h3>
                  <p className="text-muted-foreground">
                    {profileUser.bio || "This user hasn't added a bio yet."}
                  </p>

                  <h3 className="font-semibold text-lg mt-6 mb-4">Member Since</h3>
                  <p className="text-muted-foreground">
                    {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long"
                    })}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-4">Verifications</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Email", verified: profileUser.emailVerified },
                      { label: "Phone", verified: profileUser.phoneVerified },
                      { label: "Identity", verified: profileUser.identityVerified },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        {item.verified ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                        )}
                        <span className={item.verified ? "" : "text-muted-foreground"}>
                          {item.label} {item.verified ? "Verified" : "Not Verified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
