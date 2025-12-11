import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MessageCircle, CheckCircle, Star, Shield, Zap, Users, ArrowRight, Sparkles, Clock, CreditCard, MapPin, Plus } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { ServiceFormModal } from "@/components/service-form-modal";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function HowItWorks() {
  const { user, isAuthenticated } = useAuth();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-primary/90 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <Badge variant="secondary" className="mb-4 bg-white/10 text-white border-white/20">
                <Sparkles className="w-3 h-3 mr-1" />
                Simple & Secure
              </Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
                Connect with Trusted Professionals in
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400"> Switzerland</span>
              </h1>
              <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Whether you need a service or want to offer one, our platform makes it easy to connect, book, and get things done.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/search">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-gray-200 hover:scale-105 hover:shadow-2xl gap-2 shadow-xl transition-all duration-200">
                    <Search className="w-5 h-5" />
                    Find Services
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/30 hover:scale-105 hover:shadow-lg gap-2 transition-all duration-200">
                    Become a Provider
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-8 bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Verified Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <span>All Swiss Cantons</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span>Growing Community</span>
            </div>
          </div>
        </div>
      </section>

      {/* For Customers Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">For Customers</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find the Perfect Service in 4 Steps</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From search to completion, we've made finding quality services simple and secure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Search, title: "Search", desc: "Browse categories or search by keyword. Filter by location, price, and ratings.", color: "bg-blue-500", step: 1 },
              { icon: MessageCircle, title: "Connect", desc: "Contact providers directly via in-app chat. Discuss details and get quotes.", color: "bg-violet-500", step: 2 },
              { icon: CreditCard, title: "Book & Pay", desc: "Book instantly with secure payment. Card, TWINT, or cash options available.", color: "bg-emerald-500", step: 3 },
              { icon: Star, title: "Review", desc: "Share your experience to help others. Build trust in our community.", color: "bg-amber-500", step: 4 },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
                  <div className={`absolute top-0 left-0 w-full h-1 ${item.color}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-4 mb-2">
                      <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <span className="text-4xl font-bold text-muted-foreground/30">{item.step}</span>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Providers Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-4">For Service Providers</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Grow Your Business with Commerzio</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join a community of professionals. Reach new customers, manage bookings, and get paid securely.
                </p>
                
                <div className="space-y-4">
                  {[
                    { icon: Zap, title: "Quick Setup", desc: "Create your profile and post services in minutes. Our AI helps categorize and optimize your listings." },
                    { icon: Shield, title: "Get Verified", desc: "Build trust with verification badges. Verified providers get more bookings and can receive reviews." },
                    { icon: Clock, title: "Easy Management", desc: "Manage bookings, availability, and messages all in one place. Renew listings with one click." },
                    { icon: CreditCard, title: "Secure Payments", desc: "Accept Card, TWINT, or cash. Funds held safely in escrow until service is complete." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-muted hover:bg-primary/10 dark:hover:bg-accent transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-3xl blur-2xl" />
                <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-6">Start Earning Today</h3>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>Free to list your services</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>Only 5% platform commission</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>Get paid within 24 hours</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <span>No long-term commitments</span>
                    </li>
                  </ul>
                  {isAuthenticated ? (
                    <Button size="lg" className="w-full bg-white text-slate-900 hover:bg-gray-200 hover:scale-[1.02] hover:shadow-lg transition-all duration-200" onClick={() => setIsServiceModalOpen(true)}>
                      <Plus className="w-5 h-5 mr-2" />
                      Post a Service
                    </Button>
                  ) : (
                    <Link href="/register">
                      <Button size="lg" className="w-full bg-white text-slate-900 hover:bg-gray-200 hover:scale-[1.02] hover:shadow-lg transition-all duration-200">
                        Create Free Account
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join Switzerland's growing community of service providers and customers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-200 hover:scale-105 hover:shadow-2xl shadow-xl transition-all duration-200" data-testid="link-browse-services">
                Browse Services
              </Button>
            </Link>
            {isAuthenticated ? (
              <Button size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-200" data-testid="link-post-service" onClick={() => setIsServiceModalOpen(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Post a Service
              </Button>
            ) : (
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/30 hover:scale-105 hover:shadow-lg transition-all duration-200" data-testid="link-post-service">
                  Post a Service
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Service Form Modal */}
      <ServiceFormModal open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen} />
    </Layout>
  );
}
