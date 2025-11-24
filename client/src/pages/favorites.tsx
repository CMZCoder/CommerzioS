import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { CategoryFilterBar } from "@/components/category-filter-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, type FavoriteWithService, type CategoryWithTemporary } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";

export default function Saved() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const { data: saved = [], isLoading: savedLoading } = useQuery<FavoriteWithService[]>({
    queryKey: ["/api/favorites"],
    queryFn: () => apiRequest("/api/favorites"),
    enabled: isAuthenticated,
  });

  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  // Filter saved services by category
  const filteredSaved = useMemo(() => {
    if (!selectedCategory) return saved;
    return saved.filter((fav) => fav.service.categoryId === selectedCategory);
  }, [saved, selectedCategory]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    saved.forEach((fav) => {
      counts[fav.service.categoryId] = (counts[fav.service.categoryId] || 0) + 1;
    });
    return counts;
  }, [saved]);

  // Show loading state while checking auth
  if (authLoading || savedLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-slate-400 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Loading your saved services...</h3>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect message for unauthenticated users
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-lg mx-auto">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In to View Saved Services</h2>
            <p className="text-slate-600 mb-6">
              You need to be signed in to save and view your saved services.
            </p>
            <Link href="/">
              <Button className="gap-2">
                Browse Services <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-slate-50 to-white">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-full">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Your Saved Listings</h1>
                  {saved.length > 0 && (
                    <div className="text-slate-600 mt-1">
                      You have <Badge variant="secondary" className="mx-1">{saved.length}</Badge> saved service{saved.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              
              <Link href="/">
                <Button variant="outline" className="gap-2" data-testid="button-browse-services">
                  Browse More Services <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Category Filter Bar */}
        {saved.length > 0 && (
          <CategoryFilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            serviceCount={saved.length}
            categoryCounts={categoryCounts}
          />
        )}

        <div className="container mx-auto px-4 py-12">
          {/* Saved Grid or Empty State */}
          {saved.length > 0 ? (
            filteredSaved.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredSaved.map((fav, index) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    data-testid={`saved-service-${fav.service.id}`}
                  >
                    <ServiceCard service={fav.service} isSaved={true} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-20 bg-white rounded-2xl border border-dashed"
              >
                <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <Heart className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">No Services in This Category</h2>
                <p className="text-slate-600 max-w-md mx-auto mb-6">
                  You don't have any saved services in this category.
                </p>
                <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                  Show All Saved Services
                </Button>
              </motion.div>
            )
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-20 bg-white rounded-2xl border border-dashed"
              data-testid="empty-saved-state"
            >
              <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No Saved Services Yet</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-6">
                You haven't saved any services yet. Browse services and click the heart icon to save your favorites!
              </p>
              <Link href="/">
                <Button size="lg" className="gap-2" data-testid="button-browse-services-empty">
                  Browse Services <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
        </div>
    </Layout>
  );
}
