import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, ArrowRight, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function Redesign4Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  const { data: categories } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredServices } = useQuery<any[]>({
    queryKey: ["/api/services/featured"],
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (searchLocation) params.set("location", searchLocation);
    window.location.href = `/redesign4/search?${params.toString()}`;
  };

  return (
    <div>
      {/* Hero - Typographic Focus */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl md:text-7xl font-light text-stone-900 leading-tight tracking-tight mb-8">
              Find the perfect
              <br />
              <span className="italic">service provider</span>
            </h1>
            <p className="text-lg text-stone-500 mb-12 max-w-lg mx-auto leading-relaxed">
              Connect with trusted professionals across Switzerland.
              Quality services, transparent pricing.
            </p>
          </motion.div>

          {/* Search - Minimal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="bg-white border border-stone-200 p-4 md:p-6 max-w-2xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="What service do you need?"
                    className="pl-11 h-12 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
                  <Input
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Location"
                    className="pl-11 h-12 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} className="h-12 px-8 bg-stone-900 hover:bg-stone-800 text-white rounded-none">
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories - Grid */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-light text-stone-900">Categories</h2>
              <p className="text-stone-500 mt-2">Browse by service type</p>
            </div>
            <Link href="/redesign4/search">
              <Button variant="ghost" className="text-stone-600 hover:text-stone-900 hover:bg-transparent group">
                View all <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[1.5]" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-stone-200">
            {categories?.slice(0, 6).map((category, i) => (
              <motion.div key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/redesign4/search?category=${category.slug}`}>
                  <div className="bg-white p-8 text-center hover:bg-stone-50 transition-colors cursor-pointer aspect-square flex flex-col items-center justify-center">
                    <span className="text-3xl mb-4">{category.icon || "○"}</span>
                    <span className="text-sm text-stone-900">{category.name}</span>
                    <span className="text-xs text-stone-400 mt-1">{category._count?.services || 0}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-light text-stone-900">Featured</h2>
              <p className="text-stone-500 mt-2">Handpicked by our team</p>
            </div>
            <Link href="/redesign4/search">
              <Button variant="ghost" className="text-stone-600 hover:text-stone-900 hover:bg-transparent group">
                View all <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform stroke-[1.5]" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredServices?.slice(0, 6).map((service, i) => (
              <motion.div key={service.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/redesign4/service/${service.id}`}>
                  <Card className="group bg-white border-0 shadow-none hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                      {service.images?.[0] ? (
                        <img src={service.images[0]} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">No image</div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-stone-900 fill-stone-900 stroke-[1.5]" />
                        <span className="text-sm text-stone-900">{service.rating || "5.0"}</span>
                        <span className="text-sm text-stone-400">({service.reviewCount || 0})</span>
                      </div>
                      <h3 className="text-lg text-stone-900 group-hover:text-stone-600 transition-colors mb-2">{service.title}</h3>
                      <p className="text-sm text-stone-500 line-clamp-2 mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium text-stone-900">CHF {service.price?.toFixed(0)}</span>
                        <span className="text-sm text-stone-400">{service.location}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6 bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: "10,000+", label: "Service Providers" },
              { value: "50,000+", label: "Completed Bookings" },
              { value: "4.9", label: "Average Rating" },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <p className="text-5xl font-light text-white mb-2">{stat.value}</p>
                <p className="text-stone-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-light text-stone-900 mb-6">
            Ready to offer your services?
          </h2>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Join our network of trusted professionals and connect with customers across Switzerland.
          </p>
          <Link href="/register">
            <Button className="bg-stone-900 hover:bg-stone-800 text-white px-8 py-6 text-sm rounded-none">
              Become a Provider <ArrowRight className="w-4 h-4 ml-2 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
