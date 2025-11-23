import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useLocation, Link } from "wouter";
import { Star, CheckCircle2, Calendar, ShieldCheck, Mail, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";
import { ServiceCard } from "@/components/service-card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { User, Review, Service, Category } from "@shared/schema";

interface UserReview extends Review {
  user: User;
  service: Service & {
    owner: User;
    category: Category;
  };
}

export default function UserProfile() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const userId = params.userId!;
  const [showExpired, setShowExpired] = useState(false);

  const { data: user, isLoading: userLoading, error: userError } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    queryFn: () => apiRequest(`/api/users/${userId}`),
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: [`/api/users/${userId}/services`, showExpired],
    queryFn: () => apiRequest(`/api/users/${userId}/services?includeExpired=${showExpired}`),
    enabled: !!user,
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<UserReview[]>({
    queryKey: [`/api/users/${userId}/reviews`],
    queryFn: () => apiRequest(`/api/users/${userId}/reviews`),
    enabled: !!user,
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold" data-testid="text-loading">Loading user profile...</h1>
        </div>
      </Layout>
    );
  }

  if (userError || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold" data-testid="text-user-not-found">User not found</h1>
          <Button onClick={() => setLocation("/")} className="mt-4" data-testid="button-go-home">Go Home</Button>
        </div>
      </Layout>
    );
  }

  const activeServicesCount = services.filter(s => s.status === 'active').length;
  const expiredServicesCount = services.filter(s => s.status === 'expired').length;

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="container mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-8 mb-8">
            <div className="flex flex-col items-center text-center">
              {/* Profile Image */}
              <img
                src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                alt={`${user.firstName} ${user.lastName}`}
                className="w-32 h-32 rounded-full ring-4 ring-slate-100 mb-4"
                data-testid="img-profile"
              />

              {/* Name and Verification */}
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </h1>
                {user.isVerified && (
                  <CheckCircle2 className="w-7 h-7 text-primary fill-primary/10" data-testid="icon-verified" />
                )}
              </div>

              {/* Email */}
              {user.email && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4" data-testid="text-email">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-center gap-2 text-muted-foreground mb-4" data-testid="text-member-since">
                <Calendar className="w-4 h-4" />
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                {user.isVerified && (
                  <Badge variant="secondary" className="flex items-center gap-1" data-testid="badge-verified">
                    <ShieldCheck className="w-4 h-4" />
                    Identity Verified
                  </Badge>
                )}
                {user.marketingPackage && (
                  <Badge variant="outline" className="capitalize" data-testid="badge-plan">
                    {user.marketingPackage} Plan
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-8 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Services
                <Badge variant="secondary" className="rounded-full" data-testid="badge-services-count">
                  {showExpired ? expiredServicesCount : activeServicesCount}
                </Badge>
              </h2>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-expired"
                  checked={showExpired}
                  onCheckedChange={setShowExpired}
                  data-testid="switch-show-expired"
                />
                <Label htmlFor="show-expired" className="cursor-pointer">
                  Show Expired Services
                </Label>
              </div>
            </div>

            {servicesLoading ? (
              <p className="text-muted-foreground italic" data-testid="text-loading-services">Loading services...</p>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p data-testid="text-no-services">
                  {showExpired
                    ? "No expired services to show"
                    : "This user hasn't posted any active services yet"}
                </p>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-border p-8">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold">Reviews</h2>
              <Badge variant="secondary" className="rounded-full" data-testid="badge-reviews-count">
                {reviews.length}
              </Badge>
            </div>

            {reviewsLoading ? (
              <p className="text-muted-foreground italic" data-testid="text-loading-reviews">Loading reviews...</p>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-border last:border-0 pb-6 last:pb-0"
                    data-testid={`review-${review.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold" data-testid={`review-service-name-${review.id}`}>
                            Review for:{" "}
                            <Link
                              href={`/service/${review.service.id}`}
                              className="text-primary hover:underline"
                              data-testid={`link-service-${review.service.id}`}
                            >
                              {review.service.title}
                            </Link>
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground" data-testid={`review-date-${review.id}`}>
                          {format(new Date(review.createdAt), 'MMMM d, yyyy')}
                        </div>
                      </div>
                      <div className="flex" data-testid={`review-rating-${review.id}`}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600" data-testid={`review-comment-${review.id}`}>
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p data-testid="text-no-reviews">This user hasn't written any reviews yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
