import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle, LogOut, Star, Settings, User, Gift, MessageCircle, Bell, CalendarDays, Scale, Megaphone, Briefcase, List, ChevronDown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
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
    window.history.pushState({ tab: tabToUse }, '', newUrl);
    window.dispatchEvent(new CustomEvent('profileTabChange', { detail: { tab: tabToUse } }));
  };

  // Common nav link styles for consistency
  const navLinkClass = "relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200";
  const navIconClass = "w-4 h-4 transition-transform duration-200 group-hover:scale-110";

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">Commerzio</span>
              </div>
            </div>
          </Link>

          {/* Search - Desktop (wider) */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <SearchAutocomplete />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {/* Navigation Links */}
            <nav className="flex items-center gap-1">
              <Link href="/">
                <span className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">Explore</span>
              </Link>
              
              <Link href="/how-it-works">
                <span className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">How it Works</span>
              </Link>
              
              {/* Saved - with premium Star icon */}
              {isAuthenticated && user && (
                <Link href="/favorites">
                  <span className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 group">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500/30 group-hover:fill-amber-500 group-hover:scale-110 transition-all duration-200" />
                    Saved
                  </span>
                </Link>
              )}
              
              {/* My Activity Dropdown */}
              {isAuthenticated && user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 group">
                      <Briefcase className="w-4 h-4 group-hover:text-primary transition-colors" />
                      My Activity
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1">
                    <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">Activity</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setLocation("/my-bookings")} className="cursor-pointer rounded-md px-2 py-2 gap-3">
                      <CalendarDays className="w-4 h-4 text-muted-foreground" />
                      <span>My Bookings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigateToProfile('services')} className="cursor-pointer rounded-md px-2 py-2 gap-3">
                      <List className="w-4 h-4 text-muted-foreground" />
                      <span>My Listings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/service-requests")} className="cursor-pointer rounded-md px-2 py-2 gap-3">
                      <Megaphone className="w-4 h-4 text-muted-foreground" />
                      <span>Service Requests</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Divider */}
            <div className="w-px h-6 bg-border" />

            {/* Action Buttons - consistent gap-3 spacing */}
            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
              ) : isAuthenticated && user ? (
                <>
                  <Button
                    className="gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
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
                    className="relative h-9 w-9 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200"
                    onClick={() => setLocation("/chat")}
                    aria-label="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Notification Bell */}
                  <NotificationBell />

                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-transparent p-0 h-9 w-9">
                        <img
                          src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                          alt="User"
                          className="w-8 h-8 rounded-full border-2 border-transparent hover:border-primary/30 ring-2 ring-border hover:ring-primary/20 transition-all duration-200"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-1">
                      <DropdownMenuItem onClick={() => navigateToProfile()} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-profile">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('services')} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="link-my-listings">
                        <List className="w-4 h-4 text-muted-foreground" />
                        <span>My Listings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('reviews')} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-reviews">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span>Reviews</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/my-bookings")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-my-bookings">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <span>My Bookings</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/disputes")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-disputes">
                        <Scale className="w-4 h-4 text-muted-foreground" />
                        <span>Disputes</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/service-requests")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-service-requests">
                        <Megaphone className="w-4 h-4 text-muted-foreground" />
                        <span>Service Requests</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/favorites")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-saved">
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>Saved</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/referrals")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-referrals">
                        <Gift className="w-4 h-4 text-muted-foreground" />
                        <span>Refer & Earn</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem onClick={() => setLocation("/chat")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-messages">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span>Messages</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/notifications")} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-notifications">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span>Notifications</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('notifications')} className="cursor-pointer rounded-md px-2 py-2 gap-3" data-testid="menu-item-notification-settings">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        <span>Notification Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={async () => {
                          await fetchApi("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="cursor-pointer rounded-md px-2 py-2 gap-3 text-destructive focus:text-destructive"
                        data-testid="menu-item-logout"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <Link href="/login">
                    <Button variant="ghost" className="hover:bg-muted transition-all duration-200" data-testid="button-login">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200" data-testid="button-get-started">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/"><span className="flex items-center gap-3 text-lg font-medium cursor-pointer py-2">Explore</span></Link>
                  <Link href="/profile"><span className="flex items-center gap-3 text-lg font-medium cursor-pointer py-2">Profile</span></Link>
                  <Link href="/favorites">
                    <span className="flex items-center gap-3 text-lg font-medium cursor-pointer py-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500/30" />
                      Saved
                    </span>
                  </Link>
                  <Link href="/how-it-works"><span className="flex items-center gap-3 text-lg font-medium cursor-pointer py-2">How it Works</span></Link>
                  
                  <div className="h-px bg-border my-2" />
                  
                  {isAuthenticated && user && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</p>
                      <Link href="/my-bookings">
                        <span className="flex items-center gap-3 text-base font-medium cursor-pointer py-2 pl-1">
                          <CalendarDays className="w-5 h-5 text-muted-foreground" />
                          My Bookings
                        </span>
                      </Link>
                      <button 
                        onClick={() => navigateToProfile('services')}
                        className="flex items-center gap-3 text-base font-medium cursor-pointer py-2 pl-1 text-left"
                      >
                        <List className="w-5 h-5 text-muted-foreground" />
                        My Listings
                      </button>
                      <Link href="/service-requests">
                        <span className="flex items-center gap-3 text-base font-medium cursor-pointer py-2 pl-1">
                          <Megaphone className="w-5 h-5 text-muted-foreground" />
                          Service Requests
                        </span>
                      </Link>
                      
                      <div className="h-px bg-border my-2" />
                      
                      <Link href="/chat">
                        <span className="flex items-center gap-3 text-base font-medium cursor-pointer py-2 pl-1">
                          <MessageCircle className="w-5 h-5 text-muted-foreground" />
                          Messages
                        </span>
                      </Link>
                      <Link href="/notifications">
                        <span className="flex items-center gap-3 text-base font-medium cursor-pointer py-2 pl-1">
                          <Bell className="w-5 h-5 text-muted-foreground" />
                          Notifications
                        </span>
                      </Link>
                      
                      <div className="h-px bg-border my-2" />
                    </>
                  )}
                  
                  <Button
                    className="w-full mt-2"
                    onClick={() => setShowCreateService(true)}
                    data-testid="button-post-service-mobile"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
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
