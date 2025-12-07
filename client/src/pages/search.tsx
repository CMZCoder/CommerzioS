import { Layout } from "@/components/layout";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";
import { useState, useEffect } from "react";

export default function SearchResults() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const initialQuery = searchParams.get("q") || "";
  
  const [searchInput, setSearchInput] = useState(initialQuery);

  // Update search input when URL query changes
  useEffect(() => {
    setSearchInput(initialQuery);
  }, [initialQuery]);

  const { data: services = [], isLoading } = useQuery<ServiceWithDetails[]>({
    queryKey: [`/api/services`, { search: initialQuery, status: 'active' }],
    queryFn: () => apiRequest(`/api/services?search=${encodeURIComponent(initialQuery)}&status=active`),
    enabled: !!initialQuery,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchInput.trim()) {
        setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      }
    }
  };

  return (
    <Layout>
      <div className="bg-muted min-h-screen">
        {/* Header Section */}
        <div className="bg-card border-b">
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
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 h-12 text-lg"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" size="lg" data-testid="search-button">
                Search
              </Button>
            </form>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground" data-testid="search-title">
                  {initialQuery ? `Search: "${initialQuery}"` : "Search Services"}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </span>
                  ) : initialQuery ? (
                    `${services.length} service${services.length !== 1 ? 's' : ''} found`
                  ) : (
                    "Enter a search term to find services"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="container mx-auto px-4 py-8">
          {!initialQuery ? (
            <div className="text-center py-20" data-testid="empty-search-state">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Start Searching
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Enter keywords to find services. You can search by service title, description, or category.
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl border border-border p-6 animate-pulse"
                >
                  <div className="aspect-video bg-muted rounded-lg mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
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
            <div className="text-center py-20" data-testid="no-results-state">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                No services found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                We couldn't find any services matching <strong>"{initialQuery}"</strong>.
                Try different keywords or browse all services.
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
