import { Switch, Route, useLocation, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, MapPin, Bell, User, Menu, Heart, MessageCircle,
  ChevronDown, Plus, Home, Briefcase, Calendar, Settings, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Redesign2 Pages - Glassmorphism Design
import Redesign2Home from "./home";
import Redesign2Search from "./search";
import Redesign2Service from "./service";
import Redesign2Profile from "./profile";
import Redesign2MyBookings from "./my-bookings";
import Redesign2Chat from "./chat";
import Redesign2Favorites from "./favorites";
import Redesign2Notifications from "./notifications";
import Redesign2Referrals from "./referrals";
import Redesign2ServiceRequests from "./service-requests";
import Redesign2Disputes from "./disputes";
import Redesign2Plans from "./plans";
import Redesign2HelpCenter from "./help-center";
import Redesign2Contact from "./contact";
import Redesign2VendorBookings from "./vendor-bookings";

// Glassmorphism Layout
function Redesign2Layout({ children }: { children: React.ReactNode }) {
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
    { href: "/redesign2", label: "Home", icon: Home },
    { href: "/redesign2/search", label: "Explore", icon: Search },
    { href: "/redesign2/my-bookings", label: "Bookings", icon: Calendar },
    { href: "/redesign2/chat", label: "Messages", icon: MessageCircle },
    { href: "/redesign2/favorites", label: "Saved", icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === "/redesign2") return location === "/redesign2";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header - Glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/redesign2">
              <a className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div className="hidden sm:block">
                  <span className="text-xl font-bold text-white tracking-tight">Commerzio</span>
                  <span className="text-[10px] text-purple-300 block -mt-1">Services</span>
                </div>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isActive(item.href)
                      ? "bg-white/10 text-white backdrop-blur-sm border border-white/20 shadow-lg"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}>
                    <item.icon className="w-4 h-4 inline mr-2" />
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/redesign2/notifications">
                    <Button variant="ghost" size="icon" className="relative text-white/70 hover:text-white hover:bg-white/10 rounded-xl">
                      <Bell className="w-5 h-5" />
                      {notificationCount?.count ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs text-white flex items-center justify-center shadow-lg">
                          {notificationCount.count > 9 ? "9+" : notificationCount.count}
                        </span>
                      ) : null}
                    </Button>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10 rounded-xl px-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                          {user.profileImage ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.profileImage} />
                            </Avatar>
                          ) : (
                            <span className="text-white text-sm font-medium">
                              {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-white/60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-slate-900/90 border-white/10 text-white">
                      <div className="px-3 py-2 border-b border-white/10">
                        <p className="font-medium">{user.name || user.username}</p>
                        <p className="text-sm text-white/60">{user.email}</p>
                      </div>
                      <Link href="/redesign2/profile">
                        <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign2/my-bookings">
                        <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                          <Calendar className="w-4 h-4 mr-2" />
                          My Bookings
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10" onClick={() => window.location.href = "/api/logout"}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 shadow-lg shadow-purple-500/25">
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
                <SheetContent side="right" className="w-80 backdrop-blur-xl bg-slate-900/95 border-white/10">
                  <nav className="flex flex-col gap-2 mt-8">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.href)
                            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-white/10"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}>
                          <item.icon className="w-5 h-5" />
                          {item.label}
                        </a>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer - Glassmorphism */}
      <footer className="relative backdrop-blur-xl bg-white/5 border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold">C</span>
                </div>
                <span className="text-xl font-bold text-white">Commerzio</span>
              </div>
              <p className="text-white/50 text-sm">
                Switzerland's premium service marketplace.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/redesign2/search"><a className="hover:text-white transition-colors">Browse All</a></Link></li>
                <li><Link href="/redesign2/search?category=home"><a className="hover:text-white transition-colors">Home Services</a></Link></li>
                <li><Link href="/redesign2/search?category=tech"><a className="hover:text-white transition-colors">Tech & IT</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/how-it-works"><a className="hover:text-white transition-colors">How It Works</a></Link></li>
                <li><Link href="/help-center"><a className="hover:text-white transition-colors">Help Center</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/terms"><a className="hover:text-white transition-colors">Terms</a></Link></li>
                <li><Link href="/privacy"><a className="hover:text-white transition-colors">Privacy</a></Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/40">
            © 2025 Commerzio Services. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-slate-900/80 border-t border-white/10 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${isActive(item.href) ? "text-purple-400" : "text-white/50"
                }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
      <div className="md:hidden h-20" />
    </div>
  );
}

// Main Router
export default function Redesign2Router() {
  return (
    <Redesign2Layout>
      <Switch>
        <Route path="/redesign2" component={Redesign2Home} />
        <Route path="/redesign2/search" component={Redesign2Search} />
        <Route path="/redesign2/service/:id" component={Redesign2Service} />
        <Route path="/redesign2/profile" component={Redesign2Profile} />
        <Route path="/redesign2/my-bookings" component={Redesign2MyBookings} />
        <Route path="/redesign2/vendor-bookings" component={Redesign2VendorBookings} />
        <Route path="/redesign2/chat" component={Redesign2Chat} />
        <Route path="/redesign2/favorites" component={Redesign2Favorites} />
        <Route path="/redesign2/notifications" component={Redesign2Notifications} />
        <Route path="/redesign2/referrals" component={Redesign2Referrals} />
        <Route path="/redesign2/service-requests" component={Redesign2ServiceRequests} />
        <Route path="/redesign2/disputes" component={Redesign2Disputes} />
        <Route path="/redesign2/plans" component={Redesign2Plans} />
        <Route path="/redesign2/help-center" component={Redesign2HelpCenter} />
        <Route path="/redesign2/contact" component={Redesign2Contact} />
      </Switch>
    </Redesign2Layout>
  );
}
