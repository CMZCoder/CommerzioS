import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MessageCircle, CheckCircle, Star } from "lucide-react";

export default function HowItWorks() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">How ServeMkt Works</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Connect with trusted service providers in Switzerland in four simple steps
          </p>

          <div className="grid gap-8 md:grid-cols-2 mb-16">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                  <Search className="w-6 h-6" />
                </div>
                <CardTitle>1. Search for Services</CardTitle>
                <CardDescription>
                  Use our search bar or browse categories to find the service you need. Filter by location, price, and rating.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <CardTitle>2. Contact the Provider</CardTitle>
                <CardDescription>
                  Found the right service? Contact the provider directly using the contact details on their listing.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <CardTitle>3. Arrange & Complete</CardTitle>
                <CardDescription>
                  Discuss details, agree on terms, and complete the service. Payment is handled directly between you and the provider.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white mb-4">
                  <Star className="w-6 h-6" />
                </div>
                <CardTitle>4. Leave a Review</CardTitle>
                <CardDescription>
                  Help others by sharing your experience. Only verified users can leave reviews to ensure quality and trust.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="bg-slate-100 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">For Service Providers</h2>
            <div className="space-y-4 text-muted-foreground">
              <p><strong>1. Create an account</strong> - Log in with Google or create an account to get started.</p>
              <p><strong>2. Post your service</strong> - Describe your service, set your price (in CHF), and choose a category. Our AI helps categorize your listing.</p>
              <p><strong>3. Get verified</strong> - Complete identity verification to build trust and receive reviews.</p>
              <p><strong>4. Manage your listings</strong> - Services expire after 14 days but can be renewed. Upgrade to marketing packages for better visibility.</p>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Ready to get started?</h3>
            <p className="text-muted-foreground mb-6">Join thousands of service providers and customers in Switzerland</p>
            <div className="flex gap-4 justify-center">
              <a href="/" className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors" data-testid="link-browse-services">
                Browse Services
              </a>
              <a href="/api/login" className="px-6 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-colors" data-testid="link-post-service">
                Post a Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
