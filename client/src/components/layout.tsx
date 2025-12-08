import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle, LogOut, Heart, Settings, User, Star, Gift, MessageCircle, Bell, CalendarDays, Scale, Megaphone } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { CreateServiceModal } from "@/components/create-service-modal";
import { CategorySuggestionModal } from "@/components/category-suggestion-modal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/Footer";
import { fetchApi } from "@/lib/config";
import { useState } from "react";
import { BRAND } from "@/lib/brand";

export function Layout({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showCreateService, setShowCreateService] = useState(false);
  const [showCategorySuggestion, setShowCategorySuggestion] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Smart navigation function for profile tabs
  const navigateToProfile = (tab?: string) => {
    const tabToUse = tab || 'profile';
    const newUrl = `/profile?tab=${tabToUse}`;
    // Use pushState to change URL and dispatch event so profile page detects the change
    window.history.pushState({ tab: tabToUse }, '', newUrl);
    // Dispatch custom event for profile page to listen
    window.dispatchEvent(new CustomEvent('profileTabChange', { detail: { tab: tabToUse } }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-border/50 glass-nav">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
              {/* Logo Icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              {/* Brand Name */}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">Commerzio</span>
              </div>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl px-8">
            <SearchAutocomplete />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 flex-shrink-0">
            <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/"><span className="hover:text-primary transition-colors cursor-pointer">Explore</span></Link>
              {isAuthenticated && user && (
                <Link href="/favorites"><span className="hover:text-primary transition-colors cursor-pointer">Saved</span></Link>
              )}
              <Link href="/how-it-works"><span className="hover:text-primary transition-colors cursor-pointer">How it Works</span></Link>
              {isAuthenticated && user && (
                <>
                  <Link href="/my-bookings"><span className="hover:text-primary transition-colors cursor-pointer">My Bookings</span></Link>
                  <Link href="/service-requests"><span className="hover:text-primary transition-colors cursor-pointer">Service Requests</span></Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-4">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : isAuthenticated && user ? (
                <>
                  <Button
                    className="gap-2 shadow-md shadow-primary/20"
                    onClick={() => setShowCreateService(true)}
                    data-testid="button-post-service-header"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Service
                  </Button>

                  {/* Chat Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative hover:bg-muted transition-colors"
                    onClick={() => setLocation("/chat")}
                    aria-label="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* Theme Toggle */}
                  <ThemeToggle />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors cursor-pointer">
                        <img
                          src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt="User"
                          className="w-8 h-8 rounded-full border border-border hover:ring-2 hover:ring-primary/20 transition-all"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-dropdown">
                      <DropdownMenuItem onClick={() => navigateToProfile()} data-testid="menu-item-profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('services')} data-testid="link-my-listings">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('reviews')} data-testid="menu-item-reviews">
                        <Star className="w-4 h-4 mr-2" />
                        Reviews
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/my-bookings")} data-testid="menu-item-my-bookings">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/disputes")} data-testid="menu-item-disputes">
                        <Scale className="w-4 h-4 mr-2" />
                        Disputes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/service-requests")} data-testid="menu-item-service-requests">
                        <Megaphone className="w-4 h-4 mr-2" />
                        Request a Service
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/favorites")} data-testid="menu-item-saved">
                        <Heart className="w-4 h-4 mr-2" />
                        Saved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/referrals")} data-testid="menu-item-referrals">
                        <Gift className="w-4 h-4 mr-2" />
                        Refer & Earn
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/chat")} data-testid="menu-item-messages">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/notifications")} data-testid="menu-item-notifications">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('notifications')} data-testid="menu-item-notification-settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Notification Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={async () => {
                          await fetchApi("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="text-destructive"
                        data-testid="menu-item-logout"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Theme Toggle for non-authenticated users */}
                  <ThemeToggle />
                  <Link href="/login">
                    <Button variant="ghost" data-testid="button-login">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button data-testid="button-get-started">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-6 mt-8">
                  <Link href="/"><span className="text-lg font-medium cursor-pointer">Explore</span></Link>
                  <Link href="/profile"><span className="text-lg font-medium cursor-pointer">Profile</span></Link>
                  <Link href="/favorites"><span className="text-lg font-medium cursor-pointer">Saved</span></Link>
                  <Link href="/how-it-works"><span className="text-lg font-medium cursor-pointer">How it Works</span></Link>
                  <div className="h-px bg-border my-2" />
                  {isAuthenticated && user && (
                    <>
                      <Link href="/my-bookings">
                        <span className="text-lg font-medium cursor-pointer flex items-center gap-2">
                          <CalendarDays className="w-5 h-5" />
                          My Bookings
                        </span>
                      </Link>
                      <Link href="/chat">
                        <span className="text-lg font-medium cursor-pointer flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" />
                          Messages
                        </span>
                      </Link>
                      <Link href="/notifications">
                        <span className="text-lg font-medium cursor-pointer flex items-center gap-2">
                          <Bell className="w-5 h-5" />
                          Notifications
                        </span>
                      </Link>
                      <div className="h-px bg-border my-2" />
                    </>
                  )}
                  <Button
                    className="w-full"
                    onClick={() => setShowCreateService(true)}
                    data-testid="button-post-service-mobile"
                  >
                    Post Service
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      <Footer />
      <CreateServiceModal
        open={showCreateService}
        onOpenChange={(open) => {
          setShowCreateService(open);
          if (!open) {
            // Reset selected category when modal closes
            setSelectedCategoryId(null);
          }
        }}
        onSuggestCategory={() => setShowCategorySuggestion(true)}
        onCategoryCreated={setSelectedCategoryId}
        preselectedCategoryId={selectedCategoryId}
      />
      <CategorySuggestionModal
        open={showCategorySuggestion}
        onOpenChange={setShowCategorySuggestion}
        onCategoryCreated={(categoryId) => {
          setSelectedCategoryId(categoryId);
          setShowCategorySuggestion(false);
        }}
      />
    </div>
  );
}
