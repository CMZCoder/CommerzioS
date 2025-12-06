import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search, MapPin, Star, ArrowRight, Sparkles, TrendingUp, Shield, 
  Clock, Heart, ChevronRight, CheckCircle, Zap, Users, Home as HomeIcon,
  Briefcase, BookOpen, Dumbbell, Car, PawPrint, Music, Laptop, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const categoryConfig = [
  { id: 1, icon: HomeIcon, name: "Home Services", gradient: "from-blue-400 to-cyan-400" },
  { id: 2, icon: Palette, name: "Design", gradient: "from-purple-400 to-pink-400" },
  { id: 3, icon: BookOpen, name: "Education", gradient: "from-green-400 to-emerald-400" },
  { id: 4, icon: Dumbbell, name: "Wellness", gradient: "from-orange-400 to-yellow-400" },
  { id: 5, icon: Briefcase, name: "Business", gradient: "from-slate-400 to-zinc-400" },
  { id: 6, icon: Car, name: "Auto", gradient: "from-red-400 to-orange-400" },
  { id: 7, icon: PawPrint, name: "Pet Care", gradient: "from-amber-400 to-yellow-300" },
  { id: 8, icon: Music, name: "Events", gradient: "from-violet-400 to-purple-400" },
  { id: 9, icon: Laptop, name: "Tech", gradient: "from-indigo-400 to-blue-400" },
];

export default function Redesign2Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("Zürich");

  const { data: services } = useQuery<any[]>({
    queryKey: ["/api/services"],
  });

  const featuredServices = services?.slice(0, 6) || [];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm mb-6">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium Swiss Marketplace
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            Find Your Perfect
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 text-transparent bg-clip-text">
              Service Provider
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto"
          >
            Connect with verified professionals. Quality services, transparent pricing.
          </motion.p>

          {/* Glassmorphism Search Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-2 border border-white/20 shadow-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = `/redesign2/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`;
                }}
                className="flex flex-col md:flex-row gap-2"
              >
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    placeholder="What service do you need?"
                    className="pl-12 h-14 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:bg-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative md:w-48">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <Input
                    placeholder="Location"
                    className="pl-12 h-14 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:bg-white/10"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-14 px-8 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 rounded-xl shadow-lg shadow-purple-500/25"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </motion.div>

          {/* Quick Categories */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-8"
          >
            {["Cleaning", "Web Design", "Personal Training", "Photography", "Plumbing"].map((cat) => (
              <Link key={cat} href={`/redesign2/search?q=${encodeURIComponent(cat)}`}>
                <Badge
                  variant="secondary"
                  className="bg-white/5 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-all border border-white/10 backdrop-blur-sm"
                >
                  {cat}
                </Badge>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Browse Categories</h2>
            <p className="text-white/50">Explore our professional services</p>
          </div>
          <Link href="/redesign2/search">
            <Button variant="outline" className="rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10">
              View All
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4">
          {categoryConfig.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <Link href={`/redesign2/search?category=${cat.id}`}>
                <div className="group cursor-pointer">
                  <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/30 transition-all text-center">
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}>
                      <cat.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm text-white/70 group-hover:text-white transition-colors">
                      {cat.name}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Services */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Featured Services</h2>
            <p className="text-white/50">Top-rated professionals near you</p>
          </div>
          <Link href="/redesign2/search">
            <Button variant="outline" className="rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10">
              View All
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredServices.map((service: any, i: number) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Link href={`/redesign2/service/${service.id}`}>
                <Card className="overflow-hidden backdrop-blur-xl bg-white/5 border-white/10 hover:border-white/30 transition-all cursor-pointer group">
                  <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                    {service.images?.[0] ? (
                      <img
                        src={service.images[0]}
                        alt={service.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Briefcase className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>

                    <Badge className="absolute top-3 left-3 bg-white/10 backdrop-blur-sm text-white border-0">
                      {service.category?.name || "Service"}
                    </Badge>

                    <div className="absolute bottom-3 left-3">
                      <span className="text-white font-bold text-xl">
                        CHF {service.price || service.basePrice || "50"}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {service.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="w-7 h-7 border border-white/20">
                        <AvatarImage src={service.user?.profileImage} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs">
                          {service.user?.name?.charAt(0) || "V"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white/70">{service.user?.name || "Provider"}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-white/70">{service.avgRating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {service.user?.emailVerified && (
                        <Badge className="text-xs bg-green-500/20 text-green-300 border-0">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      <Badge className="text-xs bg-purple-500/20 text-purple-300 border-0">
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
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Users, value: "10,000+", label: "Happy Customers" },
              { icon: Briefcase, value: "2,500+", label: "Service Providers" },
              { icon: CheckCircle, value: "50,000+", label: "Completed Bookings" },
              { icon: Star, value: "4.9", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                  <stat.icon className="w-7 h-7 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl border border-white/20 p-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/60 mb-8">
            Join thousands of satisfied customers today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/redesign2/search">
              <Button size="lg" className="rounded-xl bg-white text-purple-600 hover:bg-white/90 px-8">
                Find Services
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 px-8">
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
