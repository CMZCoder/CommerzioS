import { Switch, Route, useLocation, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Bell, User, Menu, Heart, MessageCircle,
  ChevronDown, Home, Calendar, Settings, LogOut, Zap, Grid3X3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Redesign3 Pages - Cyberpunk Neon Design
import Redesign3Home from "./home";
import Redesign3Search from "./search";
import Redesign3Service from "./service";
import Redesign3Profile from "./profile";
import Redesign3MyBookings from "./my-bookings";
import Redesign3Chat from "./chat";
import Redesign3Favorites from "./favorites";
import Redesign3Notifications from "./notifications";
import Redesign3Referrals from "./referrals";

// Cyberpunk Neon Layout
function Redesign3Layout({ children }: { children: React.ReactNode }) {
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
    { href: "/redesign3", label: "HOME", icon: Home },
    { href: "/redesign3/search", label: "EXPLORE", icon: Grid3X3 },
    { href: "/redesign3/my-bookings", label: "BOOKINGS", icon: Calendar },
    { href: "/redesign3/chat", label: "COMMS", icon: MessageCircle },
    { href: "/redesign3/favorites", label: "SAVED", icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === "/redesign3") return location === "/redesign3";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent" />
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-pink-500/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-cyan-900/10 via-transparent to-transparent" />
        {/* Neon Glow Spots */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Header - Cyberpunk Style */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/redesign3">
              <a className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-black border-2 border-cyan-400 rotate-45 flex items-center justify-center group-hover:border-pink-400 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.5)] group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                    <Zap className="w-5 h-5 text-cyan-400 -rotate-45 group-hover:text-pink-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-white tracking-wider">COMMERZIO</span>
                  <span className="text-[10px] text-cyan-400 block tracking-[0.3em]">SERVICES</span>
                </div>
              </a>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`relative px-4 py-2 text-xs font-bold tracking-wider transition-all ${
                    isActive(item.href)
                      ? "text-cyan-400"
                      : "text-gray-500 hover:text-white"
                  }`}>
                    <item.icon className="w-4 h-4 inline mr-2" />
                    {item.label}
                    {isActive(item.href) && (
                      <>
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
                        <span className="absolute -bottom-1 left-1/2 w-1 h-1 bg-cyan-400 transform -translate-x-1/2 shadow-[0_0_5px_#22d3ee]" />
                      </>
                    )}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/redesign3/notifications">
                    <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10 border border-transparent hover:border-cyan-400/30 transition-all">
                      <Bell className="w-5 h-5" />
                      {notificationCount?.count ? (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-black text-xs font-bold flex items-center justify-center shadow-[0_0_10px_#ec4899]">
                          {notificationCount.count > 9 ? "9+" : notificationCount.count}
                        </span>
                      ) : null}
                    </Button>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-cyan-400/10 border border-cyan-500/30 hover:border-cyan-400 px-3">
                        <div className="w-7 h-7 border-2 border-cyan-400 flex items-center justify-center">
                          {user.profileImage ? (
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={user.profileImage} />
                            </Avatar>
                          ) : (
                            <span className="text-cyan-400 text-xs font-bold">
                              {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="w-3 h-3 text-cyan-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-black border-cyan-500/50 text-white shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                      <div className="px-3 py-2 border-b border-cyan-500/30">
                        <p className="font-bold text-cyan-400">{user.name || user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link href="/redesign3/profile">
                        <DropdownMenuItem className="cursor-pointer hover:bg-cyan-400/10 focus:bg-cyan-400/10 text-gray-300 hover:text-cyan-400">
                          <User className="w-4 h-4 mr-2" />
                          PROFILE
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign3/my-bookings">
                        <DropdownMenuItem className="cursor-pointer hover:bg-cyan-400/10 focus:bg-cyan-400/10 text-gray-300 hover:text-cyan-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          BOOKINGS
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign3/referrals">
                        <DropdownMenuItem className="cursor-pointer hover:bg-cyan-400/10 focus:bg-cyan-400/10 text-gray-300 hover:text-cyan-400">
                          <Zap className="w-4 h-4 mr-2" />
                          REFERRALS
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-cyan-500/30" />
                      <DropdownMenuItem className="cursor-pointer text-pink-400 hover:bg-pink-500/10 focus:bg-pink-500/10" onClick={() => window.location.href = "/api/logout"}>
                        <LogOut className="w-4 h-4 mr-2" />
                        DISCONNECT
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-400/10 border border-transparent hover:border-cyan-400/30 text-xs font-bold tracking-wider">
                      LOGIN
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                      CONNECT
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-black border-l border-cyan-500/50">
                  <nav className="flex flex-col gap-1 mt-8">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <a className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all text-xs font-bold tracking-wider ${
                          isActive(item.href)
                            ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                            : "border-transparent text-gray-500 hover:text-white hover:border-gray-500"
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

      {/* Footer - Cyberpunk Style */}
      <footer className="relative bg-black border-t border-cyan-500/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-black border-2 border-cyan-400 rotate-45 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-cyan-400 -rotate-45" />
                </div>
                <span className="text-lg font-black text-white">COMMERZIO</span>
              </div>
              <p className="text-gray-600 text-sm font-mono">
                // Swiss service network
              </p>
            </div>
            <div>
              <h4 className="font-bold text-cyan-400 mb-4 text-xs tracking-wider">SERVICES</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-mono">
                <li><Link href="/redesign3/search"><a className="hover:text-cyan-400 transition-colors">&gt; Browse</a></Link></li>
                <li><Link href="/redesign3/search?category=home"><a className="hover:text-cyan-400 transition-colors">&gt; Home</a></Link></li>
                <li><Link href="/redesign3/search?category=tech"><a className="hover:text-cyan-400 transition-colors">&gt; Tech</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-cyan-400 mb-4 text-xs tracking-wider">NETWORK</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-mono">
                <li><Link href="/how-it-works"><a className="hover:text-cyan-400 transition-colors">&gt; Protocol</a></Link></li>
                <li><Link href="/help-center"><a className="hover:text-cyan-400 transition-colors">&gt; Support</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-cyan-400 mb-4 text-xs tracking-wider">LEGAL</h4>
              <ul className="space-y-2 text-xs text-gray-500 font-mono">
                <li><Link href="/terms"><a className="hover:text-cyan-400 transition-colors">&gt; Terms</a></Link></li>
                <li><Link href="/privacy"><a className="hover:text-cyan-400 transition-colors">&gt; Privacy</a></Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-cyan-500/20 text-center text-xs text-gray-600 font-mono">
            © 2025 COMMERZIO NETWORK // ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/95 border-t border-cyan-500/30 z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex flex-col items-center gap-1 px-3 py-2 transition-all ${
                isActive(item.href) ? "text-cyan-400" : "text-gray-600"
              }`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold tracking-wider">{item.label}</span>
                {isActive(item.href) && <span className="w-1 h-1 bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />}
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
export default function Redesign3Router() {
  return (
    <Redesign3Layout>
      <Switch>
        <Route path="/redesign3" component={Redesign3Home} />
        <Route path="/redesign3/search" component={Redesign3Search} />
        <Route path="/redesign3/service/:id" component={Redesign3Service} />
        <Route path="/redesign3/profile" component={Redesign3Profile} />
        <Route path="/redesign3/my-bookings" component={Redesign3MyBookings} />
        <Route path="/redesign3/chat" component={Redesign3Chat} />
        <Route path="/redesign3/favorites" component={Redesign3Favorites} />
        <Route path="/redesign3/notifications" component={Redesign3Notifications} />
        <Route path="/redesign3/referrals" component={Redesign3Referrals} />
      </Switch>
    </Redesign3Layout>
  );
}
