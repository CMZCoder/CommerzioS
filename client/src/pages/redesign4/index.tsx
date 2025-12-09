import { Switch, Route, useLocation, Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Bell, User, Menu, Heart, MessageCircle,
  ChevronDown, Home, Calendar, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Redesign4 Pages - Minimalist Swiss Design
import Redesign4Home from "./home";
import Redesign4Search from "./search";
import Redesign4Service from "./service";
import Redesign4Profile from "./profile";
import Redesign4MyBookings from "./my-bookings";
import Redesign4Chat from "./chat";
import Redesign4Favorites from "./favorites";
import Redesign4Notifications from "./notifications";
import Redesign4Referrals from "./referrals";

// Minimalist Swiss Layout
function Redesign4Layout({ children }: { children: React.ReactNode }) {
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
    { href: "/redesign4", label: "Home", icon: Home },
    { href: "/redesign4/search", label: "Services", icon: Search },
    { href: "/redesign4/my-bookings", label: "Bookings", icon: Calendar },
    { href: "/redesign4/chat", label: "Messages", icon: MessageCircle },
    { href: "/redesign4/favorites", label: "Saved", icon: Heart },
  ];

  const isActive = (href: string) => {
    if (href === "/redesign4") return location === "/redesign4";
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header - Clean & Minimal */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo - Typographic */}
            <Link href="/redesign4">
              <a className="flex items-center">
                <span className="text-2xl font-light tracking-tight text-stone-900">commerzio</span>
              </a>
            </Link>

            {/* Desktop Navigation - Minimal */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a className={`text-sm tracking-wide transition-colors ${
                    isActive(item.href)
                      ? "text-stone-900"
                      : "text-stone-400 hover:text-stone-600"
                  }`}>
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link href="/redesign4/notifications">
                    <Button variant="ghost" size="icon" className="relative text-stone-500 hover:text-stone-900 hover:bg-transparent">
                      <Bell className="w-5 h-5 stroke-[1.5]" />
                      {notificationCount?.count ? (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-stone-900 rounded-full text-[10px] text-white flex items-center justify-center">
                          {notificationCount.count > 9 ? "9+" : notificationCount.count}
                        </span>
                      ) : null}
                    </Button>
                  </Link>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 hover:bg-transparent px-2">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden">
                          {user.profileImage ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.profileImage} />
                            </Avatar>
                          ) : (
                            <span className="text-stone-600 text-sm">
                              {user.name?.charAt(0) || user.username?.charAt(0) || "U"}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-white border-stone-200 shadow-lg">
                      <div className="px-4 py-3 border-b border-stone-100">
                        <p className="font-medium text-stone-900">{user.name || user.username}</p>
                        <p className="text-sm text-stone-500">{user.email}</p>
                      </div>
                      <Link href="/redesign4/profile">
                        <DropdownMenuItem className="cursor-pointer text-stone-600 hover:text-stone-900 hover:bg-stone-50">
                          <User className="w-4 h-4 mr-2 stroke-[1.5]" />
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/redesign4/referrals">
                        <DropdownMenuItem className="cursor-pointer text-stone-600 hover:text-stone-900 hover:bg-stone-50">
                          <Heart className="w-4 h-4 mr-2 stroke-[1.5]" />
                          Referrals
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-stone-100" />
                      <DropdownMenuItem className="cursor-pointer text-stone-500 hover:text-stone-700 hover:bg-stone-50" onClick={() => window.location.href = "/api/logout"}>
                        <LogOut className="w-4 h-4 mr-2 stroke-[1.5]" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-stone-600 hover:text-stone-900 hover:bg-transparent text-sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-stone-900 text-white hover:bg-stone-800 text-sm px-6 rounded-none">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden text-stone-600 hover:text-stone-900 hover:bg-transparent">
                    <Menu className="w-6 h-6 stroke-[1.5]" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-white border-stone-200">
                  <nav className="flex flex-col gap-1 mt-12">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                        <a className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                          isActive(item.href)
                            ? "text-stone-900 bg-stone-50"
                            : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                        }`}>
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
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Minimal */}
      <footer className="bg-white border-t border-stone-200 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            <div className="col-span-2 md:col-span-1">
              <span className="text-xl font-light text-stone-900">commerzio</span>
              <p className="text-stone-500 text-sm mt-4 leading-relaxed">
                Swiss-quality service marketplace.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Services</h4>
              <ul className="space-y-3 text-sm text-stone-600">
                <li><Link href="/redesign4/search"><a className="hover:text-stone-900 transition-colors">Browse</a></Link></li>
                <li><Link href="/redesign4/search?category=home"><a className="hover:text-stone-900 transition-colors">Home</a></Link></li>
                <li><Link href="/redesign4/search?category=tech"><a className="hover:text-stone-900 transition-colors">Technology</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-stone-600">
                <li><Link href="/about"><a className="hover:text-stone-900 transition-colors">About</a></Link></li>
                <li><Link href="/help"><a className="hover:text-stone-900 transition-colors">Support</a></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-wider text-stone-400 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-stone-600">
                <li><Link href="/terms"><a className="hover:text-stone-900 transition-colors">Terms</a></Link></li>
                <li><Link href="/privacy"><a className="hover:text-stone-900 transition-colors">Privacy</a></Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 mt-12 border-t border-stone-100 text-center text-sm text-stone-400">
            © 2025 Commerzio
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-40">
        <div className="flex items-center justify-around py-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`flex flex-col items-center gap-1 ${
                isActive(item.href) ? "text-stone-900" : "text-stone-400"
              }`}>
                <item.icon className="w-5 h-5 stroke-[1.5]" />
                <span className="text-[10px]">{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
      <div className="md:hidden h-16" />
    </div>
  );
}

// Main Router
export default function Redesign4Router() {
  return (
    <Redesign4Layout>
      <Switch>
        <Route path="/redesign4" component={Redesign4Home} />
        <Route path="/redesign4/search" component={Redesign4Search} />
        <Route path="/redesign4/service/:id" component={Redesign4Service} />
        <Route path="/redesign4/profile" component={Redesign4Profile} />
        <Route path="/redesign4/my-bookings" component={Redesign4MyBookings} />
        <Route path="/redesign4/chat" component={Redesign4Chat} />
        <Route path="/redesign4/favorites" component={Redesign4Favorites} />
        <Route path="/redesign4/notifications" component={Redesign4Notifications} />
        <Route path="/redesign4/referrals" component={Redesign4Referrals} />
      </Switch>
    </Redesign4Layout>
  );
}
