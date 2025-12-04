import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle, LogOut, Heart, Settings, User, Star, Gift, MessageCircle, Bell, CalendarDays, Scale } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { SearchAutocomplete } from "@/components/search-autocomplete";
import { CreateServiceModal } from "@/components/create-service-modal";
import { CategorySuggestionModal } from "@/components/category-suggestion-modal";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>
      
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
              {/* Logo Icon */}
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1a56db] to-[#2ba89c] flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-white">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.125 0 7.763-2.085 9.924-5.256" 
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  <circle cx="23" cy="9" r="2.5" fill="currentColor"/>
                  <circle cx="26.5" cy="16" r="2.5" fill="currentColor"/>
                  <circle cx="23" cy="23" r="2.5" fill="currentColor"/>
                </svg>
              </div>
              {/* Brand Name */}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-lg font-bold text-foreground tracking-tight">Commerzio</span>
                <span className="text-xs font-medium text-primary -mt-0.5">Services</span>
              </div>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
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
                <Link href="/bookings"><span className="hover:text-primary transition-colors cursor-pointer">My Bookings</span></Link>
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
                    className="relative hover:bg-slate-100 transition-colors"
                    onClick={() => setLocation("/chat")}
                    aria-label="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Notification Bell */}
                  <NotificationBell />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 transition-colors cursor-pointer">
                        <img 
                          src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                          alt="User" 
                          className="w-8 h-8 rounded-full border border-border hover:ring-2 hover:ring-primary/20 transition-all"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
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
                      <DropdownMenuItem onClick={() => setLocation("/bookings")} data-testid="menu-item-my-bookings">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/disputes")} data-testid="menu-item-disputes">
                        <Scale className="w-4 h-4 mr-2" />
                        Disputes
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
          <div className="md:hidden">
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
                      <Link href="/bookings">
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

      <footer className="bg-slate-900 text-slate-300 py-16 mt-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a56db] to-[#2ba89c] flex items-center justify-center shadow-lg">
                  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-white">
                    <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.125 0 7.763-2.085 9.924-5.256" 
                          stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <circle cx="23" cy="9" r="2.5" fill="currentColor"/>
                    <circle cx="26.5" cy="16" r="2.5" fill="currentColor"/>
                    <circle cx="23" cy="23" r="2.5" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-white text-lg">Commerzio</span>
                  <span className="text-xs font-medium text-cyan-400 -mt-0.5">Services</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-4">
                {BRAND.description}
              </p>
              <p className="text-xs text-slate-500">
                A <span className="font-medium text-slate-400">{BRAND.parentCompany}</span> company
              </p>
              {/* Trust badges */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  <span>Verified Providers</span>
                </div>
              </div>
            </div>
            
            {/* Platform */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/"><span className="hover:text-white transition-colors cursor-pointer">Browse Services</span></Link></li>
                <li><Link href="/register"><span className="hover:text-white transition-colors cursor-pointer">Post a Service</span></Link></li>
                <li><Link href="/how-it-works"><span className="hover:text-white transition-colors cursor-pointer">How it Works</span></Link></li>
                <li><Link href="/referrals"><span className="hover:text-white transition-colors cursor-pointer">Refer & Earn</span></Link></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help-center"><span className="hover:text-white transition-colors cursor-pointer">Help Center</span></Link></li>
                <li><Link href="/trust-safety"><span className="hover:text-white transition-colors cursor-pointer">Trust & Safety</span></Link></li>
                <li><Link href="/contact"><span className="hover:text-white transition-colors cursor-pointer">Contact Us</span></Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms"><span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span></Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              {BRAND.copyright}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>🇨🇭</span>
              <span>Made in Switzerland</span>
            </div>
          </div>
        </div>
      </footer>
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
