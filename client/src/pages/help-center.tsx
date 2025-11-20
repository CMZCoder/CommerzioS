import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail } from "lucide-react";

export default function HelpCenter() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Help Center</h1>
          <p className="text-lg text-muted-foreground text-center mb-12">
            Find answers to common questions about using ServeMkt
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {/* How to Post a Service */}
            <AccordionItem value="post-service" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-post-service">
                How do I post a service?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>Posting a service on ServeMkt is quick and easy:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Log in to your account or create a new one</li>
                  <li>Click the "Post Service" button in the navigation bar</li>
                  <li>Fill in your service details including title, description, and price in CHF</li>
                  <li>Choose a category (our AI can help suggest the best category)</li>
                  <li>Add your location and contact information</li>
                  <li>Review and publish your listing</li>
                </ol>
                <p className="mt-3">
                  Your service will be live immediately and will remain active for 14 days. You can renew or upgrade your listing at any time from your dashboard.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* How to Find Services */}
            <AccordionItem value="find-services" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-find-services">
                How do I find services?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>Finding the right service provider is simple:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the search bar at the top of the page to search by keywords</li>
                  <li>Browse by category to explore different types of services</li>
                  <li>Filter results by location, price range, and rating</li>
                  <li>Read reviews and ratings from other users</li>
                  <li>Check the provider's profile and service details</li>
                </ul>
                <p className="mt-3">
                  Once you find a service you're interested in, you can contact the provider directly using the contact information provided on their listing.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Payment and Pricing */}
            <AccordionItem value="payment-pricing" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-payment-pricing">
                How does payment and pricing work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>All prices on ServeMkt are displayed in Swiss Francs (CHF):</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>For Customers:</strong> Payment is handled directly between you and the service provider. ServeMkt does not process payments.</li>
                  <li><strong>For Providers:</strong> You set your own prices and payment terms. Discuss payment methods with customers directly.</li>
                  <li><strong>Listing Fees:</strong> Basic listings are free for 14 days. Premium marketing packages are available for increased visibility.</li>
                  <li><strong>No Commission:</strong> We don't take a commission on transactions between customers and providers.</li>
                </ul>
                <p className="mt-3">
                  Always agree on pricing and payment terms before starting work. We recommend documenting the agreement in writing.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Account Management */}
            <AccordionItem value="account-management" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-account-management">
                How do I manage my account?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>Managing your ServeMkt account is easy through your dashboard:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Profile Settings:</strong> Update your personal information, contact details, and profile picture</li>
                  <li><strong>My Services:</strong> View, edit, renew, or delete your service listings</li>
                  <li><strong>Verification:</strong> Complete identity verification to build trust and unlock features</li>
                  <li><strong>Notifications:</strong> Manage your email preferences and notification settings</li>
                  <li><strong>Account Security:</strong> Update your password and security settings</li>
                </ul>
                <p className="mt-3">
                  Access your dashboard by clicking on your profile icon in the top right corner.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Reviews and Ratings */}
            <AccordionItem value="reviews-ratings" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-reviews-ratings">
                How do reviews and ratings work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>Reviews help build trust in our community:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Who Can Review:</strong> Only verified users who have completed a transaction can leave reviews</li>
                  <li><strong>Rating System:</strong> Rate services from 1 to 5 stars based on your experience</li>
                  <li><strong>Written Reviews:</strong> Share detailed feedback to help others make informed decisions</li>
                  <li><strong>Response:</strong> Service providers can respond to reviews</li>
                  <li><strong>Authenticity:</strong> All reviews are checked for authenticity and compliance with our guidelines</li>
                </ul>
                <p className="mt-3">
                  Reviews cannot be deleted or edited once submitted, so please provide honest and constructive feedback.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Listing Expiration */}
            <AccordionItem value="listing-expiration" className="bg-white rounded-lg border px-6">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline" data-testid="accordion-listing-expiration">
                Why do listings expire after 14 days?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground space-y-3">
                <p>Listings expire to ensure our marketplace stays fresh and up-to-date:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Ensures all services displayed are currently available</li>
                  <li>Encourages providers to keep information accurate and current</li>
                  <li>Maintains a high-quality user experience for customers</li>
                </ul>
                <p className="mt-3">
                  You can easily renew your listing from your dashboard before or after it expires. Renewal is free for basic listings.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Contact Support Section */}
          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Still need help?
              </CardTitle>
              <CardDescription>
                Our support team is here to assist you with any questions or issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Contact us at:{" "}
                <a 
                  href="mailto:support@servemkt.ch" 
                  className="text-primary font-medium hover:underline"
                  data-testid="link-support-email"
                >
                  support@servemkt.ch
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                We typically respond within 24 hours during business days.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
