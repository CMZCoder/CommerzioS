import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Heart,
  Star,
  MapPin,
  Shield,
  Calendar,
  Trash2,
  Clock,
  Grid3X3,
  List,
  FolderHeart,
  Bell,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const favoriteServices = [
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
      savedDate: "Dec 1, 2025",
      category: "Home Services",
      available: true,
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
      savedDate: "Nov 28, 2025",
      category: "Home Services",
      available: true,
    },
    {
      id: 3,
      title: "Personal Training & Fitness Coaching",
      vendor: "FitLife Coaching",
      rating: 5.0,
      reviews: 98,
      price: "CHF 60/session",
      location: "Lausanne",
      image: "/personal-trainer-gym.jpg",
      verified: true,
      savedDate: "Nov 25, 2025",
      category: "Health & Wellness",
      available: true,
    },
    {
      id: 4,
      title: "Mathematics Tutoring - All Levels",
      vendor: "EduSwiss Tutoring",
      rating: 4.9,
      reviews: 143,
      price: "CHF 50/hr",
      location: "Bern",
      image: "/tutoring-student-learning.jpg",
      verified: true,
      savedDate: "Nov 20, 2025",
      category: "Education",
      available: false,
    },
    {
      id: 5,
      title: "Wedding & Event Photography",
      vendor: "Alpine Moments",
      rating: 4.8,
      reviews: 76,
      price: "From CHF 1,200",
      location: "Interlaken",
      image: "/professional-photographer-camera.jpg",
      verified: true,
      savedDate: "Nov 15, 2025",
      category: "Events",
      available: true,
    },
    {
      id: 6,
      title: "Certified Plumbing Services",
      vendor: "AquaFix Switzerland",
      rating: 4.9,
      reviews: 156,
      price: "From CHF 120",
      location: "Basel",
      image: "/plumber-professional-tools.jpg",
      verified: true,
      savedDate: "Nov 10, 2025",
      category: "Home Services",
      available: true,
    },
  ]

  const collections = [
    { name: "Home Renovation", count: 4, icon: "🏠" },
    { name: "Wedding Planning", count: 3, icon: "💒" },
    { name: "Fitness Goals", count: 2, icon: "💪" },
  ]

  const recentlyViewed = [
    {
      id: 7,
      title: "Interior Design Consultation",
      vendor: "Swiss Design Studio",
      rating: 4.7,
      price: "CHF 150/hr",
      image: "/interior-design-consultation.jpg",
    },
    {
      id: 8,
      title: "Garden Landscaping",
      vendor: "GreenScape Pro",
      rating: 4.6,
      price: "From CHF 500",
      image: "/garden-landscaping.jpg",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <Heart className="h-8 w-8 text-primary fill-primary/20" />
                My Favorites
              </h1>
              <p className="text-muted-foreground">
                {favoriteServices.length} saved services across {collections.length} collections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <FolderHeart className="h-4 w-4" />
                New Collection
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Bell className="h-4 w-4" />
                Price Alerts
              </Button>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search your favorites..." className="pl-10" />
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Saved</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="lg:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="home">Home Services</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="events">Events</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Favorites</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="recent">Recently Viewed</TabsTrigger>
            </TabsList>
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{favoriteServices.length}</p>
                    <p className="text-xs text-muted-foreground">Total Saved</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Star className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">4.9</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-success/5 to-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{favoriteServices.filter((s) => s.verified).length}</p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-primary/5 to-success/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{favoriteServices.filter((s) => s.available).length}</p>
                    <p className="text-xs text-muted-foreground">Available</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteServices.map((service) => (
                <Card
                  key={service.id}
                  className={`overflow-hidden hover:border-primary transition-all group h-full ${!service.available ? "opacity-75" : ""}`}
                >
                  <div className="relative">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground">
                      {service.category}
                    </Badge>
                    {!service.available && (
                      <Badge className="absolute top-3 left-3 mt-8 bg-destructive text-destructive-foreground">
                        Unavailable
                      </Badge>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Link href={`/services/${service.id}`}>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {service.title}
                        </h3>
                      </Link>
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

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-lg font-bold">{service.price}</span>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Saved {service.savedDate}
                        </p>
                      </div>
                      <Button size="sm" disabled={!service.available} asChild={service.available}>
                        {service.available ? (
                          <Link href={`/booking/new?service=${service.id}`}>Book Now</Link>
                        ) : (
                          <span>Unavailable</span>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card
                  key={collection.name}
                  className="hover:border-primary transition-all cursor-pointer group overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{collection.icon}</div>
                      <Badge variant="secondary">{collection.count} items</Badge>
                    </div>
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors mb-2">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your curated collection of {collection.name.toLowerCase()} services
                    </p>
                    <Button variant="ghost" size="sm" className="gap-2 p-0 h-auto text-primary">
                      View Collection
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Collection Card */}
              <Card className="border-dashed hover:border-primary transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <FolderHeart className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Create Collection</h3>
                  <p className="text-sm text-muted-foreground">Organize your favorites into custom groups</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewed.map((service) => (
                <Card key={service.id} className="overflow-hidden hover:border-primary transition-all group">
                  <div className="relative">
                    <img
                      src={service.image || "/placeholder.svg"}
                      alt={service.title}
                      className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
                    >
                      <Heart className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <Link href={`/services/${service.id}`}>
                      <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1 mb-1">
                        {service.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground mb-2">{service.vendor}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-accent text-accent" />
                        <span className="text-xs font-medium">{service.rating}</span>
                      </div>
                      <span className="text-sm font-bold">{service.price}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {recentlyViewed.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Recent Views</h3>
                  <p className="text-muted-foreground mb-4">Services you browse will appear here</p>
                  <Button asChild>
                    <Link href="/services">Browse Services</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
