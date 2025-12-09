import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Star, Sparkles, Leaf, Sun, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export default function Redesign5Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const { data: categories } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: featuredServices } = useQuery<any[]>({ queryKey: ["/api/services/featured"] });
  const { data: topProviders } = useQuery<any[]>({ queryKey: ["/api/providers/top"] });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);
    window.location.href = `/redesign5/search?${params.toString()}`;
  };

  const categoryIcons: Record<string, string> = {
    cleaning: "🧹",
    gardening: "🌱",
    tutoring: "📚",
    beauty: "💅",
    fitness: "💪",
    repair: "🔧",
    photography: "📷",
    cooking: "👨‍🍳",
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full shadow-sm mb-6">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700 font-medium">Discover local talent</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent">Find the perfect service</span>
              <br />
              <span className="text-amber-900">for your needs</span>
            </h1>
            
            <p className="text-lg text-amber-800/70 mb-10 max-w-xl mx-auto">
              Connect with trusted professionals in your community. From home services to personal care, we've got you covered.
            </p>

            {/* Search Box */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-xl shadow-orange-200/50 p-3 max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="pl-12 h-14 bg-amber-50/50 border-0 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Your location"
                    className="pl-12 h-14 bg-amber-50/50 border-0 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-2 focus-visible:ring-amber-300"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="h-14 px-8 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl shadow-lg shadow-orange-300/50 font-semibold">
                  Search
                </Button>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-8 mt-10">
              {[
                { value: "2,500+", label: "Providers" },
                { value: "15,000+", label: "Reviews" },
                { value: "98%", label: "Satisfaction" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-2xl font-bold text-amber-900">{stat.value}</p>
                  <p className="text-sm text-amber-700/60">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-amber-900">Browse Categories</h2>
            <p className="text-amber-700/60 mt-1">Find services by category</p>
          </div>
          <Link href="/redesign5/search">
            <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.slice(0, 8).map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link href={`/redesign5/search?category=${cat.slug}`}>
                <Card className="group bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 border-amber-100 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-amber-100">
                  <div className="text-4xl mb-4">{categoryIcons[cat.slug] || "🔧"}</div>
                  <h3 className="font-semibold text-amber-900 group-hover:text-amber-700 transition-colors">{cat.name}</h3>
                  <p className="text-sm text-amber-600/60 mt-1">{cat.serviceCount || 0} services</p>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Services */}
      <section className="bg-gradient-to-b from-white to-amber-50/50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-600 mb-2">
                <Sun className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Featured</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-amber-900">Popular Services</h2>
            </div>
            <Link href="/redesign5/search">
              <Button variant="ghost" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(featuredServices || []).slice(0, 6).map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={`/redesign5/service/${service.id}`}>
                  <Card className="group bg-white border-amber-100 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {service.images?.[0] ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <Leaf className="w-12 h-12 text-amber-300" />
                        </div>
                      )}
                      <button className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                        <Heart className="w-5 h-5 text-amber-600" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-full">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                          <span className="text-sm font-medium text-amber-700">{service.rating || "5.0"}</span>
                        </div>
                        <span className="text-sm text-amber-600/60">({service.reviewCount || 0})</span>
                      </div>
                      <h3 className="font-semibold text-amber-900 mb-2 line-clamp-1 group-hover:text-amber-700 transition-colors">{service.title}</h3>
                      <p className="text-sm text-amber-700/60 line-clamp-2 mb-3">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-amber-900">CHF {service.price?.toFixed(0)}</span>
                        <span className="text-sm text-amber-600/60 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {service.location || "Switzerland"}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Providers */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-amber-900 mb-2">Meet Our Top Providers</h2>
          <p className="text-amber-700/60">Trusted professionals with excellent ratings</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {(topProviders || []).slice(0, 4).map((provider, i) => (
            <motion.div key={provider.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link href={`/redesign5/profile/${provider.id}`}>
                <Card className="group bg-white border-amber-100 rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-amber-100/50 hover:-translate-y-1">
                  <Avatar className="w-20 h-20 mx-auto mb-4 ring-4 ring-amber-100 group-hover:ring-amber-200 transition-all">
                    <AvatarImage src={provider.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700 text-xl">{provider.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-amber-900 mb-1">{provider.name}</h3>
                  <p className="text-sm text-amber-600/60 mb-3">{provider.specialty || "Service Provider"}</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500 stroke-amber-500" />
                    <span className="font-medium text-amber-900">{provider.rating || "5.0"}</span>
                    <span className="text-sm text-amber-600/60">({provider.reviewCount || 0})</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 border-0 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">Join thousands of satisfied customers and find your perfect service provider today.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/redesign5/search">
                  <Button size="lg" className="bg-white text-orange-600 hover:bg-amber-50 rounded-full px-8 shadow-lg font-semibold">
                    Find Services
                  </Button>
                </Link>
                <Link href="/signup?provider=true">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 font-semibold">
                    Become a Provider
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
