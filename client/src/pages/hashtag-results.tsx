import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Hash, ArrowLeft } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";

export default function HashtagResults() {
  const [match, params] = useRoute("/hashtags/:hashtag");
  const [, setLocation] = useLocation();

  if (!match) return null;

  const hashtag = params.hashtag;

  const { data: services = [], isLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: [`/api/services/hashtag/${hashtag}`],
    queryFn: () => apiRequest(`/api/services/hashtag/${hashtag}`),
  });

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mb-4"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Hash className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900" data-testid="hashtag-title">
                  #{hashtag}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading ? "Loading..." : `${services.length} service${services.length !== 1 ? 's' : ''} found`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-border p-6 animate-pulse"
                >
                  <div className="aspect-video bg-slate-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="services-grid">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20" data-testid="empty-state">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                <Hash className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                No services found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any services tagged with <strong>#{hashtag}</strong>.
                Try searching for other hashtags or browse all services.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setLocation("/")}
                  data-testid="button-browse-all"
                >
                  Browse All Services
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
