/**
 * Layout Component - Ember Theme
 * Warm amber/orange/gold color scheme with glass morphism
 */

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, PlusCircle, LogOut, Heart, Settings, User, Star, Gift, MessageCircle, Bell, CalendarDays, Scale, Megaphone, Search, ChevronDown, Sparkles } from "lucide-react";
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
    window.history.pushState({ tab: tabToUse }, '', newUrl);
    window.dispatchEvent(new CustomEvent('profileTabChange', { detail: { tab: tabToUse } }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950 font-sans">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Header - Glass Morphism */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-zinc-900/70 border-b border-zinc-800/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-lg font-bold text-white tracking-tight">Commerzio</span>
                <span className="text-xs font-medium text-amber-400 -mt-0.5">Services</span>
              </div>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md">
            <div className="w-full relative">
              <SearchAutocomplete />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 flex-shrink-0">
            <nav className="flex items-center gap-1">
              <Link href="/">
                <span className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  Explore
                </span>
              </Link>
              {isAuthenticated && user && (
                <Link href="/favorites">
                  <span className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                    Saved
                  </span>
                </Link>
              )}
              <Link href="/how-it-works">
                <span className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                  How it Works
                </span>
              </Link>
              {isAuthenticated && user && (
                <>
                  <Link href="/bookings">
                    <span className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer">
                      My Bookings
                    </span>
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center gap-3">
              {isLoading ? (
                <div className="text-sm text-slate-400">Loading...</div>
              ) : isAuthenticated && user ? (
                <>
                  <Button
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-orange-500/25 border-0"
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
                    className="relative text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    onClick={() => setLocation("/chat")}
                    aria-label="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>

                  {/* Notification Bell */}
                  <NotificationBell />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-amber-500/30">
                          <img
                            src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                            alt="User"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-zinc-900/95 border-zinc-700 text-slate-200">
                      <div className="px-3 py-2 border-b border-zinc-700">
                        <p className="font-medium text-white">{user.firstName || user.email}</p>
                        <p className="text-sm text-slate-400">{user.email}</p>
                      </div>
                      <DropdownMenuItem onClick={() => navigateToProfile()} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('services')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="link-my-listings">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        My Listings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('reviews')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-reviews">
                        <Star className="w-4 h-4 mr-2" />
                        Reviews
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/bookings")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-my-bookings">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        My Bookings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/disputes")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-disputes">
                        <Scale className="w-4 h-4 mr-2" />
                        Disputes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/service-requests")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-service-requests">
                        <Megaphone className="w-4 h-4 mr-2" />
                        Request a Service
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/favorites")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-saved">
                        <Heart className="w-4 h-4 mr-2" />
                        Saved
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/referrals")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-referrals">
                        <Gift className="w-4 h-4 mr-2" />
                        Refer & Earn
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-700" />
                      <DropdownMenuItem onClick={() => setLocation("/chat")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-messages">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Messages
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/notifications")} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-notifications">
                        <Bell className="w-4 h-4 mr-2" />
                        Notifications
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigateToProfile('notifications')} className="cursor-pointer hover:bg-white/10 focus:bg-white/10" data-testid="menu-item-notification-settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-zinc-700" />
                      <DropdownMenuItem
                        onClick={async () => {
                          await fetchApi("/api/auth/logout", { method: "POST" });
                          window.location.href = "/";
                        }}
                        className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
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
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10" data-testid="button-login">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-orange-500/25 border-0" data-testid="button-get-started">
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
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 backdrop-blur-xl bg-zinc-900/95 border-zinc-700">
                <div className="flex flex-col gap-6 mt-8">
                  <Link href="/"><span className="text-lg font-medium text-white cursor-pointer hover:text-amber-400 transition-colors">Explore</span></Link>
                  <Link href="/profile"><span className="text-lg font-medium text-white cursor-pointer hover:text-amber-400 transition-colors">Profile</span></Link>
                  <Link href="/favorites"><span className="text-lg font-medium text-white cursor-pointer hover:text-amber-400 transition-colors">Saved</span></Link>
                  <Link href="/how-it-works"><span className="text-lg font-medium text-white cursor-pointer hover:text-amber-400 transition-colors">How it Works</span></Link>
                  <div className="h-px bg-zinc-700 my-2" />
                  {isAuthenticated && user && (
                    <>
                      <Link href="/bookings">
                        <span className="text-lg font-medium text-white cursor-pointer flex items-center gap-2 hover:text-amber-400 transition-colors">
                          <CalendarDays className="w-5 h-5" />
                          My Bookings
                        </span>
                      </Link>
                      <Link href="/chat">
                        <span className="text-lg font-medium text-white cursor-pointer flex items-center gap-2 hover:text-amber-400 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          Messages
                        </span>
                      </Link>
                      <Link href="/notifications">
                        <span className="text-lg font-medium text-white cursor-pointer flex items-center gap-2 hover:text-amber-400 transition-colors">
                          <Bell className="w-5 h-5" />
                          Notifications
                        </span>
                      </Link>
                      <div className="h-px bg-zinc-700 my-2" />
                    </>
                  )}
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white"
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

      <main id="main-content" className="flex-1 relative" tabIndex={-1}>
        {children}
      </main>

      {/* Footer - Glass Morphism */}
      <footer className="relative backdrop-blur-xl bg-zinc-900/80 border-t border-zinc-800/50 mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-bold text-white text-lg">Commerzio</span>
                  <span className="text-xs font-medium text-amber-400 -mt-0.5">Services</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-4">
                {BRAND.description}
              </p>
              <p className="text-xs text-slate-500">
                A <span className="font-medium text-slate-400">{BRAND.parentCompany}</span> company
              </p>
              {/* Trust badges */}
              <div className="flex items-center gap-4 mt-6 pt-6 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span>Verified Providers</span>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Browse Services</span></Link></li>
                <li><Link href="/register"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Post a Service</span></Link></li>
                <li><Link href="/how-it-works"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">How it Works</span></Link></li>
                <li><Link href="/referrals"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Refer & Earn</span></Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/help-center"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Help Center</span></Link></li>
                <li><Link href="/trust-safety"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Trust & Safety</span></Link></li>
                <li><Link href="/contact"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Contact Us</span></Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Terms of Service</span></Link></li>
                <li><Link href="/privacy"><span className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer">Privacy Policy</span></Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
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
