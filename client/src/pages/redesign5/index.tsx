import { Switch, Route, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, User, Calendar, MessageCircle, Heart, Bell, Gift, Menu, X, LogOut, Leaf, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

import Redesign5Home from "./home";
import Redesign5Search from "./search";
import Redesign5Service from "./service";
import Redesign5Profile from "./profile";
import Redesign5MyBookings from "./my-bookings";
import Redesign5Chat from "./chat";
import Redesign5Favorites from "./favorites";
import Redesign5Notifications from "./notifications";
import Redesign5Referrals from "./referrals";

const navItems = [
  { path: "/redesign5", label: "Home", icon: Home },
  { path: "/redesign5/search", label: "Explore", icon: Search },
  { path: "/redesign5/bookings", label: "Bookings", icon: Calendar },
  { path: "/redesign5/favorites", label: "Favorites", icon: Heart },
  { path: "/redesign5/chat", label: "Messages", icon: MessageCircle },
];

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useQuery<any>({ queryKey: ["/api/user"] });
  const { data: notifications } = useQuery<any[]>({ queryKey: ["/api/notifications"] });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-amber-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/redesign5">
              <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent hidden sm:block">Servizio</span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location === item.path || (item.path !== "/redesign5" && location.startsWith(item.path));
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div whileHover={{ y: -2 }} className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700" : "text-amber-900/60 hover:text-amber-900 hover:bg-amber-50"}`}>
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <Link href="/redesign5/notifications">
                <motion.div whileHover={{ y: -2 }} className="relative p-2.5 rounded-full hover:bg-amber-50 transition-colors">
                  <Bell className="w-5 h-5 text-amber-900/60" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">{unreadCount}</span>
                  )}
                </motion.div>
              </Link>

              {user ? (
                <Link href="/redesign5/profile">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Avatar className="w-9 h-9 ring-2 ring-amber-200 ring-offset-2 cursor-pointer">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{user.name?.[0] || user.email?.[0] || "U"}</AvatarFallback>
                    </Avatar>
                  </motion.div>
                </Link>
              ) : (
                <Link href="/login">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full px-5 shadow-lg shadow-orange-200/50">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Mobile Menu */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50">
                    <Menu className="w-5 h-5 text-amber-900" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-gradient-to-b from-amber-50 to-white border-l border-amber-100 p-0">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xl font-semibold text-amber-900">Servizio</span>
                    </div>
                    <nav className="space-y-2">
                      {navItems.map((item) => {
                        const isActive = location === item.path;
                        return (
                          <Link key={item.path} href={item.path}>
                            <div onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700" : "text-amber-900/60 hover:text-amber-900 hover:bg-amber-50"}`}>
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                      <Link href="/redesign5/referrals">
                        <div onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-2xl text-amber-900/60 hover:text-amber-900 hover:bg-amber-50 transition-all">
                          <Gift className="w-5 h-5" />
                          <span className="font-medium">Referrals</span>
                        </div>
                      </Link>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <AnimatePresence mode="wait">
          <motion.div key={location} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-amber-50 to-amber-100/50 border-t border-amber-100/50 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-amber-900">Servizio</span>
              </div>
              <p className="text-amber-700/70 text-sm leading-relaxed">Connect with talented service providers in your area.</p>
            </div>
            {[
              { title: "Company", links: ["About", "Careers", "Press", "Blog"] },
              { title: "Support", links: ["Help Center", "Safety", "Terms", "Privacy"] },
              { title: "Community", links: ["Providers", "Forum", "Events", "Partners"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-amber-900 mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-amber-700/70 hover:text-amber-700 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-amber-200/50">
            <p className="text-sm text-amber-700/60">© 2025 Servizio. Made with care.</p>
            <div className="flex items-center gap-1 mt-4 md:mt-0">
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700/60">Bringing warmth to services</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-amber-100 shadow-lg shadow-amber-900/5">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location === item.path || (item.path !== "/redesign5" && location.startsWith(item.path));
            return (
              <Link key={item.path} href={item.path}>
                <motion.div whileTap={{ scale: 0.9 }} className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl ${isActive ? "text-orange-600" : "text-amber-900/40"}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function Redesign5() {
  return (
    <Layout>
      <Switch>
        <Route path="/redesign5" component={Redesign5Home} />
        <Route path="/redesign5/search" component={Redesign5Search} />
        <Route path="/redesign5/service/:id" component={Redesign5Service} />
        <Route path="/redesign5/profile/:id?" component={Redesign5Profile} />
        <Route path="/redesign5/bookings" component={Redesign5MyBookings} />
        <Route path="/redesign5/chat" component={Redesign5Chat} />
        <Route path="/redesign5/favorites" component={Redesign5Favorites} />
        <Route path="/redesign5/notifications" component={Redesign5Notifications} />
        <Route path="/redesign5/referrals" component={Redesign5Referrals} />
      </Switch>
    </Layout>
  );
}
