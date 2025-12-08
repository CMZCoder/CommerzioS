import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Shield, Clock, Star, ChevronRight, MapPin, Sparkles, Award, Lock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <section className="relative bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge
              className="mb-6 bg-gradient-to-r from-primary to-accent text-white border-0 shadow-lg px-6 py-2.5"
              variant="secondary"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Trusted by 50,000+ Swiss Customers
            </Badge>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance animate-in fade-in slide-in-from-bottom-4 duration-700">
              The complete platform to discover{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                local services
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 text-balance max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
              Connect with verified service providers across Switzerland. Book with confidence using our secure escrow
              payment system.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="What service are you looking for?"
                  className="pl-12 h-14 text-base shadow-md focus:shadow-lg transition-shadow"
                />
              </div>
              <div className="relative sm:w-48">
                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  className="pl-12 h-14 text-base shadow-md focus:shadow-lg transition-shadow"
                />
              </div>
              <Button
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Search
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center text-sm">
              <span className="text-muted-foreground">Popular:</span>
              <Link href="/search?q=plumber" className="text-primary hover:underline transition-colors">
                Plumber
              </Link>
              <span className="text-border">•</span>
              <Link href="/search?q=electrician" className="text-accent hover:underline transition-colors">
                Electrician
              </Link>
              <span className="text-border">•</span>
              <Link href="/search?q=cleaning" className="text-primary hover:underline transition-colors">
                Cleaning
              </Link>
              <span className="text-border">•</span>
              <Link href="/search?q=tutoring" className="text-accent hover:underline transition-colors">
                Tutoring
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b bg-gradient-to-r from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                50K+
              </div>
              <div className="text-sm text-muted-foreground">Active Customers</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                5,000+
              </div>
              <div className="text-sm text-muted-foreground">Verified Vendors</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                98%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
            </div>
            <div className="text-center group cursor-pointer">
              <div className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                24h
              </div>
              <div className="text-sm text-muted-foreground">Avg Response Time</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Popular Categories
              </span>
            </h2>
            <Button variant="ghost" asChild className="text-primary hover:text-primary hover:bg-primary/10">
              <Link href="/categories">
                View All
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: "Home Services", count: "1,234", icon: "🏠", gradient: "from-primary/10 to-accent/10" },
              { name: "Health & Wellness", count: "892", icon: "💪", gradient: "from-accent/10 to-primary/10" },
              { name: "Education", count: "654", icon: "📚", gradient: "from-primary/10 to-success/10" },
              { name: "Events", count: "423", icon: "🎉", gradient: "from-accent/10 to-success/10" },
              { name: "Tech Support", count: "567", icon: "💻", gradient: "from-success/10 to-primary/10" },
              { name: "Transportation", count: "345", icon: "🚗", gradient: "from-success/10 to-accent/10" },
            ].map((category) => (
              <Card
                key={category.name}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1 bg-gradient-to-br from-card to-muted/30"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} services</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-accent/5 via-muted/20 to-success/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-accent to-success text-white border-0 px-4 py-2">
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              How Commerzio Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Book trusted services in three simple steps with complete security and transparency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Discover & Book</h3>
                <p className="text-muted-foreground">
                  Browse verified service providers, compare reviews, and book your preferred time slot instantly.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-primary to-accent"></div>
            </div>

            <div className="relative group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-success text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure Payment</h3>
                <p className="text-muted-foreground">
                  Pay securely with escrow protection. Funds are held until you confirm the service is completed.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-accent to-success"></div>
            </div>

            <div className="group">
              <div className="bg-card border rounded-2xl p-8 h-full shadow-md hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-success to-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4 shadow-md group-hover:scale-105 transition-transform">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Leave a Review</h3>
                <p className="text-muted-foreground">
                  Share your experience and help others make informed decisions. Build trust in our community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              Why Choose Commerzio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for the Swiss market with security and trust at its core
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Lock className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Escrow Protection</h3>
                <p className="text-muted-foreground">
                  Your payment is held securely until service completion. Full refund guarantee for disputes.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-success text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Vendors</h3>
                <p className="text-muted-foreground">
                  All service providers are verified with background checks and review systems.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-primary text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Guarantee</h3>
                <p className="text-muted-foreground">
                  98% satisfaction rate backed by our dispute resolution system and customer support.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Clock className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Booking</h3>
                <p className="text-muted-foreground">
                  Instant availability checks and booking confirmations. No more endless phone calls.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-success text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Award className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Rewards Program</h3>
                <p className="text-muted-foreground">
                  Earn points with every booking and referral. Redeem for discounts on future services.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-success to-primary text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform">
                  <Star className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Trusted Reviews</h3>
                <p className="text-muted-foreground">
                  Only verified customers can leave reviews, ensuring authentic feedback.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="container mx-auto px-4 relative text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers and verified vendors on Switzerland's most trusted service platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90 shadow-xl">
              Find Services
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-primary bg-transparent"
            >
              Become a Vendor
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
