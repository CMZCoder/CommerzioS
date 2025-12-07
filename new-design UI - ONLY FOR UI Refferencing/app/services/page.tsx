import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, MapPin, Star, Heart, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"

export default function ServicesPage() {
  const services = [
    {
      id: 1,
      title: "Professional Home Cleaning Service",
      vendor: "Swiss Clean Pro",
      rating: 4.9,
      reviews: 234,
      price: "CHF 45/hr",
      location: "Zürich",
      image: "/modern-clean-interior.png",
      verified: true,
      featured: true,
    },
    {
      id: 2,
      title: "Licensed Electrician - Same Day Service",
      vendor: "PowerTech Solutions",
      rating: 4.8,
      reviews: 187,
      price: "CHF 85/hr",
      location: "Geneva",
      image: "/electrician-working-professional.jpg",
      verified: true,
      featured: false,
    },
    {
      id: 3,
      title: "Certified Plumbing Services",
      vendor: "AquaFix Switzerland",
      rating: 4.9,
      reviews: 156,
      price: "From CHF 120",
      location: "Basel",
      image: "/plumber-professional-tools.jpg",
      verified: true,
      featured: true,
    },
    {
      id: 4,
      title: "Personal Training & Fitness Coaching",
      vendor: "FitLife Coaching",
      rating: 5.0,
      reviews: 98,
      price: "CHF 60/session",
      location: "Lausanne",
      image: "/personal-trainer-gym.jpg",
      verified: true,
      featured: false,
    },
    {
      id: 5,
      title: "Mathematics Tutoring - All Levels",
      vendor: "EduSwiss Tutoring",
      rating: 4.9,
      reviews: 143,
      price: "CHF 50/hr",
      location: "Bern",
      image: "/tutoring-student-learning.jpg",
      verified: true,
      featured: false,
    },
    {
      id: 6,
      title: "Wedding & Event Photography",
      vendor: "Alpine Moments",
      rating: 4.8,
      reviews: 76,
      price: "From CHF 1,200",
      location: "Interlaken",
      image: "/professional-photographer-camera.jpg",
      verified: true,
      featured: true,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Discover Services</h1>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search services..." className="pl-10" />
            </div>
            <div className="relative lg:w-64">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
              <Input placeholder="Location" className="pl-10" />
            </div>
            <Select defaultValue="relevance">
              <SelectTrigger className="lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="reviews">Most Reviews</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="gap-2">
              All Categories
              <button className="hover:text-foreground">×</button>
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">Showing {services.length} services</p>
          <Button variant="ghost" size="sm" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Now
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.id}`}>
              <Card className="overflow-hidden hover:border-primary transition-all group h-full">
                <div className="relative">
                  <img
                    src={service.image || "/placeholder.svg"}
                    alt={service.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {service.featured && (
                    <Badge className="absolute top-3 left-3" variant="default">
                      Featured
                    </Badge>
                  )}
                  <Button size="icon" variant="secondary" className="absolute top-3 right-3 h-8 w-8">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                      {service.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">{service.vendor}</span>
                    {service.verified && <Shield className="h-3 w-3 text-accent" />}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold text-sm">{service.rating}</span>
                      <span className="text-xs text-muted-foreground">({service.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {service.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{service.price}</span>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline">
            Load More Services
          </Button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
