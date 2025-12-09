import { Switch, Route, useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MapPin, Bell, User, Menu, X, Heart, MessageCircle,
  Sparkles, ChevronDown, Plus, Home, Briefcase, BookOpen,
  Calendar, Settings, Star, Award, Users, LogOut, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Redesign Pages
import RedesignHome from "./home";
import RedesignSearch from "./search";
import RedesignService from "./service";
import RedesignProfile from "./profile";
import RedesignMyBookings from "./my-bookings";
import RedesignChat from "./chat";
import RedesignFavorites from "./favorites";
import RedesignNotifications from "./notifications";
import RedesignBookService from "./book-service";
import RedesignUserProfile from "./user-profile";
import RedesignReferrals from "./referrals";
import RedesignServiceRequests from "./service-requests";
import RedesignDisputes from "./disputes";
import RedesignPlans from "./plans";
import RedesignHelpCenter from "./help-center";
import RedesignContact from "./contact";
import RedesignVendorBookings from "./vendor-bookings";

// Shared layout for Redesign
function RedesignLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: notificationCount } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
  });

  const navItems = [
    { href: "/redesign", label: "Home", icon: Home },
    { href: "/redesign/search", label: "Browse", icon: Search },
    { href: "/redesign/my-bookings", label: "Bookings", icon: Calendar },
    { href: "/redesign/chat", label: "Messages", icon: MessageCircle },
    { href: "/redesign/favorites", label: "Favorites", icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === "/redesign") return location === "/redesign";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/redesign">
              <a className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-white tracking-tight">Commerzio</span>
                  <span className="text-xs text-slate-400 block">Services</span>
                </div>
              </a>
            </Link>

            {/* Desktop Search */}
            <div className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
              <Link href="/redesign/search" className="w-full">
                <a className="flex items-center w-full bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 px-4 py-2.5 hover:bg-white/15 transition-colors group">
                  <Search className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  <span className="ml-3 text-slate-400 group-hover:text-white transition-colors">Search services...</span>
                  <div className="ml-auto flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Zürich</span>
                  </div>
                </a>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.slice(0, 3).map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/redesign/notifications">
                    <Button variant="ghost" size="icon" className="relative text-slate-300 hover:text-white hover:bg-white/10 rounded-xl">
                      <Bell className="w-5 h-5" />
                      {notificationCount?.count ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                          {notificationCount.count > 9 ? "9+" : notificationCount.count}
                        </span>
                      ) : null}
                    </Button>
                  </Link>
                  <Link href="/redesign/chat">
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link href="/redesign/favorites">
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white hover:bg-white/10 rounded-xl">
                      <Heart className="w-5 h-5" />
                    </Button>
                  </Link>

                  <div className="w-px h-8 bg-white/20 mx-2 hidden sm:block" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 rounded-xl px-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profileImage} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm">
                            {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-3 py-2 border-b">
                        <p className="font-medium">{user.name || user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <Link href="/redesign/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign/my-bookings">
                        <DropdownMenuItem className="cursor-pointer">
                          <Calendar className="w-4 h-4 mr-2" />
                          My Bookings
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign/profile?tab=services">
                        <DropdownMenuItem className="cursor-pointer">
                          <Briefcase className="w-4 h-4 mr-2" />
                          My Services
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign/favorites">
                        <DropdownMenuItem className="cursor-pointer">
                          <Heart className="w-4 h-4 mr-2" />
                          Favorites
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign/referrals">
                        <DropdownMenuItem className="cursor-pointer">
                          <Award className="w-4 h-4 mr-2" />
                          Referrals
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <Link href="/redesign/profile?tab=settings">
                        <DropdownMenuItem className="cursor-pointer">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer text-red-600" onClick={() => window.location.href = "/api/logout"}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl hidden sm:flex">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-slate-900 border-slate-800 text-white">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">Commerzio</span>
                      </div>
                    </div>

                    {/* Mobile Search */}
                    <Link href="/redesign/search" onClick={() => setMobileMenuOpen(false)}>
                      <a className="flex items-center w-full bg-white/10 rounded-xl px-4 py-3 mb-6">
                        <Search className="w-5 h-5 text-slate-400" />
                        <span className="ml-3 text-slate-400">Search services...</span>
                      </a>
                    </Link>

                    {/* Mobile Nav */}
                    <nav className="flex-1 space-y-1">
                      {navItems.map((item) => (
                        <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                          <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive(item.href)
                            ? "bg-gradient-to-r from-violet-500/20 to-indigo-500/20 text-white"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}>
                            <item.icon className="w-5 h-5" />
                            {item.label}
                          </a>
                        </Link>
                      ))}
                      {user && (
                        <>
                          <Link href="/redesign/notifications" onClick={() => setMobileMenuOpen(false)}>
                            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
                              <Bell className="w-5 h-5" />
                              Notifications
                              {notificationCount?.count ? (
                                <Badge className="ml-auto bg-red-500">{notificationCount.count}</Badge>
                              ) : null}
                            </a>
                          </Link>
                          <Link href="/redesign/profile" onClick={() => setMobileMenuOpen(false)}>
                            <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
                              <User className="w-5 h-5" />
                              Profile
                            </a>
                          </Link>
                        </>
                      )}
                    </nav>

                    {/* Mobile Footer */}
                    {user ? (
                      <div className="pt-4 border-t border-slate-800">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => window.location.href = "/api/logout"}
                        >
                          <LogOut className="w-5 h-5 mr-3" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-slate-800 space-y-2">
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full border-slate-700 text-white hover:bg-white/10">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          <Button className="w-full bg-gradient-to-r from-violet-500 to-indigo-600">
                            Get Started
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold">Commerzio Services</span>
              </div>
              <p className="text-slate-400 text-sm">
                Switzerland's premier service marketplace connecting professionals with customers.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/redesign/search?category=home"><a className="hover:text-white">Home Services</a></Link></li>
                <li><Link href="/redesign/search?category=design"><a className="hover:text-white">Design & Creative</a></Link></li>
                <li><Link href="/redesign/search?category=education"><a className="hover:text-white">Education</a></Link></li>
                <li><Link href="/redesign/search?category=business"><a className="hover:text-white">Business</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/how-it-works"><a className="hover:text-white">How It Works</a></Link></li>
                <li><Link href="/trust-safety"><a className="hover:text-white">Trust & Safety</a></Link></li>
                <li><Link href="/help-center"><a className="hover:text-white">Help Center</a></Link></li>
                <li><Link href="/contact"><a className="hover:text-white">Contact</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/terms"><a className="hover:text-white">Terms of Service</a></Link></li>
                <li><Link href="/privacy"><a className="hover:text-white">Privacy Policy</a></Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
            © 2025 Commerzio Services. All rights reserved. Made with ❤️ in Switzerland
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${isActive(item.href) ? "text-violet-600" : "text-slate-500"
                }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer for mobile bottom nav */}
      <div className="md:hidden h-20" />
    </div>
  );
}

// Main Redesign Router
export default function RedesignRouter() {
  return (
    <RedesignLayout>
      <Switch>
        <Route path="/redesign" component={RedesignHome} />
        <Route path="/redesign/search" component={RedesignSearch} />
        <Route path="/redesign/service/:id" component={RedesignService} />
        <Route path="/redesign/book/:id" component={RedesignBookService} />
        <Route path="/redesign/profile" component={RedesignProfile} />
        <Route path="/redesign/my-bookings" component={RedesignMyBookings} />
        <Route path="/redesign/vendor-bookings" component={RedesignVendorBookings} />
        <Route path="/redesign/chat" component={RedesignChat} />
        <Route path="/redesign/favorites" component={RedesignFavorites} />
        <Route path="/redesign/notifications" component={RedesignNotifications} />
        <Route path="/redesign/user/:id" component={RedesignUserProfile} />
        <Route path="/redesign/referrals" component={RedesignReferrals} />
        <Route path="/redesign/service-requests" component={RedesignServiceRequests} />
        <Route path="/redesign/disputes" component={RedesignDisputes} />
        <Route path="/redesign/plans" component={RedesignPlans} />
        <Route path="/redesign/help-center" component={RedesignHelpCenter} />
        <Route path="/redesign/contact" component={RedesignContact} />
      </Switch>
    </RedesignLayout>
  );
}

