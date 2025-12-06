import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, ArrowRight, Sparkles, TrendingUp, Shield, 
  Clock, Heart, ChevronRight, CheckCircle, Zap, Users, Home as HomeIcon,
  Briefcase, BookOpen, Dumbbell, Car, PawPrint, Music, Gavel, Laptop, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categoryConfig = [
  { id: 1, icon: HomeIcon, name: "Home Services", color: "from-blue-500 to-cyan-400" },
  { id: 2, icon: Palette, name: "Design & Creative", color: "from-purple-500 to-pink-400" },
  { id: 3, icon: BookOpen, name: "Education", color: "from-green-500 to-emerald-400" },
  { id: 4, icon: Dumbbell, name: "Wellness & Fitness", color: "from-orange-500 to-yellow-400" },
  { id: 5, icon: Briefcase, name: "Business Support", color: "from-slate-600 to-slate-400" },
  { id: 6, icon: Car, name: "Automotive", color: "from-red-500 to-orange-400" },
  { id: 7, icon: PawPrint, name: "Pet Care", color: "from-amber-500 to-yellow-300" },
  { id: 8, icon: Music, name: "Entertainment", color: "from-violet-500 to-purple-400" },
  { id: 9, icon: Gavel, name: "Legal & Financial", color: "from-teal-500 to-cyan-400" },
  { id: 10, icon: Laptop, name: "Tech & IT", color: "from-indigo-500 to-blue-400" },
];

export default function UI2Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Zürich, Switzerland");

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => ({
      users: 10000,
      providers: 2500,
      bookings: 50000,
      rating: 4.8
    })
  });

  const featuredServices = services?.slice(0, 8) || [];
  const topProviders = services
    ?.reduce((acc: any[], s: any) => {
      if (s.user && !acc.find(p => p.id === s.user.id)) {
        acc.push(s.user);
      }
      return acc;
    }, [])
    .slice(0, 4) || [];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <Sparkles className="w-3 h-3 mr-1" />
                #1 Swiss Service Marketplace
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
            >
              Find the Perfect
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-pink-300 text-transparent bg-clip-text">
                Service Provider
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto"
            >
              Connect with verified professionals for any task. From home services to creative work,
              find trusted experts near you.
            </motion.p>

            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full max-w-3xl mx-auto"
            >
              <Card className="p-2 shadow-2xl">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    window.location.href = `/ui2/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`;
                  }}
                  className="flex flex-col md:flex-row gap-2"
                >
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="What do you need help with?" 
                      className="pl-12 h-14 text-lg border-0 focus-visible:ring-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      placeholder="Location"
                      className="pl-12 h-14 text-lg border-0 focus-visible:ring-0"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Quick Category Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 mt-6"
            >
              <span className="text-white/60 text-sm">Popular:</span>
              {["Cleaning", "Plumbing", "Web Design", "Personal Training", "Photography"].map((cat) => (
                <Link key={cat} href={`/ui2/search?q=${encodeURIComponent(cat)}`}>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white hover:bg-white/30 cursor-pointer transition-colors"
                  >
                    {cat}
                  </Badge>
                </Link>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-white/10 backdrop-blur-md border-t border-white/20">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Users, value: stats?.users?.toLocaleString() || "10,000+", label: "Active Users" },
                { icon: Briefcase, value: stats?.providers?.toLocaleString() || "2,500+", label: "Providers" },
                { icon: CheckCircle, value: stats?.bookings?.toLocaleString() || "50,000+", label: "Bookings" },
                { icon: Star, value: stats?.rating || "4.8", label: "Avg Rating" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 justify-center">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/70">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Browse by Category</h2>
            <p className="text-muted-foreground">Explore our wide range of professional services</p>
          </div>
          <Link href="/ui2/search">
            <Button variant="outline" className="rounded-xl hidden md:flex">
              View All
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(categories || categoryConfig).slice(0, 10).map((cat: any, i: number) => {
            const config = categoryConfig.find(c => c.id === cat.id) || categoryConfig[i % categoryConfig.length];
            const Icon = config?.icon || HomeIcon;
            return (
              <motion.div
                key={cat.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
              >
                <Link href={`/ui2/search?category=${cat.id}`}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all cursor-pointer group">
                    <div className={`relative h-28 bg-gradient-to-br ${config?.color || 'from-slate-500 to-slate-400'}`}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                      </div>
                    </div>
                    <CardContent className="p-3 text-center">
                      <h3 className="font-semibold text-sm group-hover:text-violet-600 transition-colors">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground">{cat._count?.services || Math.floor(Math.random() * 200 + 50)} services</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Services</h2>
              <p className="text-muted-foreground">Top-rated services in your area</p>
            </div>
            <Link href="/ui2/search">
              <Button variant="outline" className="rounded-xl">
                View All
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service: any, i: number) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Link href={`/ui2/service/${service.id}`}>
                  <Card className="overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all cursor-pointer group">
                    <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300">
                      {service.images?.[0] ? (
                        <img 
                          src={service.images[0]} 
                          alt={service.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Briefcase className="w-16 h-16 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full shadow-md"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>

                      <Badge className="absolute top-3 left-3 bg-white/90 text-slate-800">
                        {service.category?.name || "Service"}
                      </Badge>

                      <div className="absolute bottom-3 left-3">
                        <span className="text-white font-bold text-lg">
                          CHF {service.price || service.basePrice || "50"}
                          {service.priceType === "hourly" ? "/hr" : ""}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-base mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                        {service.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={service.user?.profileImage} />
                          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs">
                            {service.user?.name?.charAt(0) || "V"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium">{service.user?.name || "Provider"}</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{service.avgRating?.toFixed(1) || "5.0"}</span>
                            <span className="text-xs text-muted-foreground">({service.reviewCount || 0})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {service.user?.emailVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Quick Response
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Providers Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Top-Rated Providers</h2>
            <p className="text-muted-foreground">Meet our highest-rated service professionals</p>
          </div>
          <Link href="/ui2/profile">
            <Button variant="outline" className="rounded-xl">
              Become a Provider
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {topProviders.map((provider: any, i: number) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <Card className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-all text-center p-6">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <Avatar className="w-full h-full">
                    <AvatarImage src={provider.profileImage} className="object-cover" />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                      {provider.name?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  {provider.emailVerified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-lg mb-1">{provider.name || provider.username}</h3>
                <p className="text-sm text-muted-foreground mb-3">Service Provider</p>

                <div className="flex items-center justify-center gap-1 mb-4">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">5.0</span>
                  <span className="text-sm text-muted-foreground">(150+ reviews)</span>
                </div>

                <Link href={`/ui2/user/${provider.id}`}>
                  <Button className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700">
                    View Profile
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-violet-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of satisfied customers and service providers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ui2/search">
              <Button size="lg" variant="secondary" className="rounded-xl text-lg px-8">
                Find Services
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="rounded-xl text-lg px-8 bg-white text-violet-600 hover:bg-white/90">
                Become a Provider
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
