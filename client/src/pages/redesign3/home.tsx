import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, ChevronRight, Zap, Star, Shield, Clock, TrendingUp, ArrowRight, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Redesign3Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredServices } = useQuery<any[]>({
    queryKey: ["/api/services/featured"],
  });

  const { data: popularServices } = useQuery<any[]>({
    queryKey: ["/api/services/popular"],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchLocation) params.set("location", searchLocation);
    window.location.href = `/redesign3/search?${params.toString()}`;
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-4 py-20">
        {/* Animated Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-32 left-20 w-2 h-2 bg-cyan-400 shadow-[0_0_15px_#22d3ee]"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            className="absolute top-40 right-32 w-2 h-2 bg-pink-400 shadow-[0_0_15px_#f472b6]"
          />
          <motion.div 
            animate={{ x: [0, 10, 0], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, delay: 2 }}
            className="absolute bottom-40 left-1/3 w-3 h-3 bg-yellow-400 shadow-[0_0_15px_#facc15]"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-cyan-500/50 text-cyan-400 mb-8 text-xs font-mono tracking-wider bg-cyan-500/5">
              <Zap className="w-3 h-3" />
              SWISS SERVICE NETWORK v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              FIND <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">SERVICES</span>
              <br />
              <span className="text-pink-400 drop-shadow-[0_0_30px_rgba(244,114,182,0.5)]">BOOK</span> INSTANTLY
            </h1>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto font-mono">
              // Connect with verified service providers across Switzerland
            </p>
          </motion.div>

          {/* Search Box - Cyberpunk Style */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-black/80 border border-cyan-500/50 p-4 md:p-6 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="// SEARCH SERVICES..."
                    className="pl-12 h-14 bg-black border-cyan-500/30 text-white placeholder:text-gray-600 focus:border-cyan-400 focus:ring-0 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                  <Input
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="// LOCATION..."
                    className="pl-12 h-14 bg-black border-pink-500/30 text-white placeholder:text-gray-600 focus:border-pink-400 focus:ring-0 font-mono text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="h-14 px-8 bg-cyan-400 hover:bg-cyan-300 text-black font-bold tracking-wider shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:shadow-[0_0_30px_rgba(0,255,255,0.6)]">
                  SEARCH <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center gap-8 mt-10 text-sm font-mono">
            <div className="text-center">
              <p className="text-2xl font-black text-cyan-400">10K+</p>
              <p className="text-gray-500">PROVIDERS</p>
            </div>
            <div className="h-10 w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-2xl font-black text-pink-400">50K+</p>
              <p className="text-gray-500">BOOKINGS</p>
            </div>
            <div className="h-10 w-px bg-gray-800" />
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-400">4.9</p>
              <p className="text-gray-500">AVG RATING</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">SERVICE CATEGORIES</h2>
              <p className="text-gray-500 font-mono text-sm">// Browse by type</p>
            </div>
            <Link href="/redesign3/search">
              <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400 font-bold text-xs tracking-wider">
                VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories?.slice(0, 6).map((category, i) => (
              <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/redesign3/search?category=${category.slug}`}>
                  <Card className="group bg-black border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3 grayscale group-hover:grayscale-0 transition-all">{category.icon || "📦"}</div>
                      <p className="font-bold text-white text-sm tracking-wider group-hover:text-cyan-400 transition-colors">{category.name?.toUpperCase()}</p>
                      <p className="text-xs text-gray-600 font-mono mt-1">{category._count?.services || 0} services</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">FEATURED SERVICES</h2>
              <p className="text-gray-500 font-mono text-sm">// Top rated providers</p>
            </div>
            <Link href="/redesign3/search">
              <Button variant="outline" className="border-pink-500/50 text-pink-400 hover:bg-pink-400/10 hover:border-pink-400 font-bold text-xs tracking-wider">
                VIEW ALL <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredServices?.slice(0, 6).map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/redesign3/service/${service.id}`}>
                  <Card className="group bg-black border border-gray-800 hover:border-cyan-500/50 transition-all cursor-pointer overflow-hidden hover:shadow-[0_0_20px_rgba(0,255,255,0.1)]">
                    <div className="relative h-48 overflow-hidden">
                      {service.images?.[0] ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover transition-transform group-hover:scale-105 grayscale group-hover:grayscale-0" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                          <Grid3X3 className="w-12 h-12 text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                      <Badge className="absolute top-3 right-3 bg-cyan-400 text-black font-bold text-xs">FEATURED</Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-bold ml-1">{service.rating || "5.0"}</span>
                        </div>
                        <span className="text-gray-600 text-sm">({service.reviewCount || 0})</span>
                      </div>
                      <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors mb-2 line-clamp-1">{service.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-2 font-mono mb-3">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400 font-black">CHF {service.price?.toFixed(2) || "0.00"}</span>
                        <div className="flex items-center text-gray-500 text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {service.location || "Switzerland"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-black text-white text-center mb-12 tracking-tight">WHY CHOOSE US</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "VERIFIED PROVIDERS", desc: "All service providers are verified and background checked", color: "cyan" },
              { icon: Clock, title: "INSTANT BOOKING", desc: "Book services instantly with real-time availability", color: "pink" },
              { icon: TrendingUp, title: "BEST PRICES", desc: "Competitive pricing with transparent fee structure", color: "yellow" },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}>
                <Card className={`bg-black border border-${feature.color}-500/30 p-6 hover:border-${feature.color}-400 transition-all hover:shadow-[0_0_20px_rgba(${feature.color === 'cyan' ? '34,211,238' : feature.color === 'pink' ? '244,114,182' : '250,204,21'},0.1)]`}>
                  <div className={`w-12 h-12 border-2 border-${feature.color}-400 flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                  </div>
                  <h3 className={`font-bold text-white mb-2 tracking-wider`}>{feature.title}</h3>
                  <p className="text-gray-500 text-sm font-mono">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black border border-pink-500/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-pink-500/5" />
            <CardContent className="p-8 md:p-12 text-center relative">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                BECOME A <span className="text-pink-400">PROVIDER</span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto font-mono">
                // Join our network and start earning today
              </p>
              <Link href="/register">
                <Button className="bg-pink-500 hover:bg-pink-400 text-white font-bold px-8 py-6 text-sm tracking-wider shadow-[0_0_20px_rgba(236,72,153,0.4)] hover:shadow-[0_0_30px_rgba(236,72,153,0.6)]">
                  GET STARTED <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
