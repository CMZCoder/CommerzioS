import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Terms() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: November 20, 2025</p>

          <Card>
            <CardContent className="pt-6 space-y-8 text-muted-foreground">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                <p className="mb-4">
                  These Terms of Service ("Terms") govern your access to and use of Commerzio Services AG's marketplace platform 
                  ("Platform", "Service", "we", "us", or "our"). By accessing or using our Platform, you agree to be 
                  bound by these Terms and all applicable laws and regulations.
                </p>
                <p className="mb-4">
                  Commerzio Services AG is a Swiss company registered in Zürich, Switzerland. These Terms are governed by Swiss 
                  law, specifically the Swiss Code of Obligations (Obligationenrecht, "OR").
                </p>
                <p>
                  If you do not agree to these Terms, you may not access or use the Platform.
                </p>
              </section>

              <Separator />

              {/* Services Provided */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Services Provided</h2>
                <p className="mb-4">
                  Commerzio Services operates an online marketplace that connects service providers with customers seeking services 
                  within Switzerland. We provide:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>A platform for service providers to advertise their services</li>
                  <li>A search and discovery system for customers to find services</li>
                  <li>User profiles, reviews, and rating systems</li>
                  <li>Communication facilitation between users</li>
                </ul>
                <p className="font-semibold text-foreground">
                  Important: Commerzio Services is a platform only. We are not a party to any agreements between service providers 
                  and customers. All transactions, payments, and service delivery occur directly between users.
                </p>
              </section>

              <Separator />

              {/* User Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. User Responsibilities</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">3.1 Account Registration</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>You must provide accurate and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must be at least 18 years old to use the Platform</li>
                  <li>You agree to notify us immediately of any unauthorized use of your account</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">3.2 Prohibited Activities</h3>
                <p className="mb-2">Users must not:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Post false, misleading, or fraudulent content</li>
                  <li>Offer or request illegal services</li>
                  <li>Violate any Swiss laws or regulations</li>
                  <li>Infringe on intellectual property rights of others</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Manipulate reviews or ratings</li>
                  <li>Use the Platform for any commercial purpose other than as intended</li>
                  <li>Attempt to circumvent security measures or access unauthorized areas</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">3.3 Compliance with Laws</h3>
                <p>
                  Users must comply with all applicable Swiss federal and cantonal laws, including but not limited to 
                  tax obligations, licensing requirements, and data protection regulations.
                </p>
              </section>

              <Separator />

              {/* Service Provider Responsibilities */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Service Provider Responsibilities</h2>
                <p className="mb-4">Service providers agree to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Provide accurate descriptions of services offered</li>
                  <li>Honor quoted prices (displayed in Swiss Francs - CHF)</li>
                  <li>Maintain any required professional licenses, permits, or insurance</li>
                  <li>Deliver services in a professional and timely manner</li>
                  <li>Respond to customer inquiries within a reasonable timeframe</li>
                  <li>Comply with all applicable Swiss laws and regulations for their profession</li>
                  <li>Manage their own tax obligations and business registrations as required by Swiss law</li>
                </ul>
                <p className="font-semibold text-foreground">
                  Service providers are solely responsible for the quality, legality, and delivery of their services. 
                  Commerzio Services assumes no responsibility for services provided through the Platform.
                </p>
              </section>

              <Separator />

              {/* Listing Policies */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Listing Policies</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Service listings are active for 14 days from the date of posting</li>
                  <li>Listings may be renewed by the service provider</li>
                  <li>We reserve the right to remove listings that violate these Terms</li>
                  <li>Marketing packages and featured listings are subject to separate pricing and terms</li>
                  <li>All prices must be displayed in Swiss Francs (CHF)</li>
                </ul>
              </section>

              <Separator />

              {/* Payments and Fees */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Payments and Fees</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">6.1 Platform Fees</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Basic service listings are free for 14 days</li>
                  <li>Premium features and marketing packages are subject to fees as displayed on the Platform</li>
                  <li>All platform fees are charged in Swiss Francs (CHF)</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">6.2 Service Transactions</h3>
                <p>
                  Payment for services is handled directly between customers and service providers. Commerzio Services does not 
                  process, hold, or take commission on payments for services. Users are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>Agreeing on payment terms and methods</li>
                  <li>Processing payments according to Swiss law</li>
                  <li>Issuing appropriate invoices and receipts</li>
                  <li>Managing refunds or disputes related to service transactions</li>
                </ul>
              </section>

              <Separator />

              {/* Intellectual Property */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Intellectual Property</h2>
                <p className="mb-4">
                  The Platform and its content (excluding user-generated content) are owned by Commerzio Services AG and are 
                  protected by Swiss and international copyright, trademark, and other intellectual property laws.
                </p>
                <p className="mb-4">
                  By posting content on the Platform, you grant Commerzio Services a non-exclusive, worldwide, royalty-free license 
                  to use, display, and distribute your content in connection with operating the Platform.
                </p>
                <p>
                  You retain all ownership rights to content you post and are responsible for ensuring you have the right 
                  to share such content.
                </p>
              </section>

              <Separator />

              {/* Limitation of Liability */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Limitation of Liability</h2>
                <p className="mb-4">
                  In accordance with Article 100 of the Swiss Code of Obligations (OR):
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Commerzio Services AG acts solely as an intermediary platform connecting users</li>
                  <li>We are not liable for the quality, safety, legality, or delivery of services offered through the Platform</li>
                  <li>We are not liable for actions, omissions, or conduct of any users</li>
                  <li>We are not responsible for disputes between users</li>
                  <li>Our liability for direct damages is limited to the amount of fees paid by you in the 12 months preceding the claim</li>
                  <li>We are not liable for indirect, consequential, or special damages</li>
                </ul>
                <p className="font-semibold text-foreground">
                  This limitation does not apply to liability for intentional misconduct or gross negligence, or where 
                  such limitation is prohibited by mandatory Swiss law.
                </p>
              </section>

              <Separator />

              {/* Indemnification */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless Commerzio Services AG, its officers, directors, employees, and agents 
                  from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>Your use of the Platform</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of any rights of another user or third party</li>
                  <li>Services you provide or receive through the Platform</li>
                </ul>
              </section>

              <Separator />

              {/* Termination */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. Termination</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">10.1 By You</h3>
                <p className="mb-4">
                  You may terminate your account at any time by contacting us at info@servemkt.ch.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">10.2 By Us</h3>
                <p className="mb-4">
                  We reserve the right to suspend or terminate your account immediately if:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>You violate these Terms</li>
                  <li>We are required to do so by law</li>
                  <li>Your conduct harms or may harm other users or the Platform</li>
                  <li>We cease operating the Platform</li>
                </ul>
                <p>
                  Upon termination, your right to use the Platform ceases immediately. Provisions that by their nature 
                  should survive termination shall survive, including intellectual property rights, limitation of 
                  liability, and dispute resolution provisions.
                </p>
              </section>

              <Separator />

              {/* Dispute Resolution */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">11. Dispute Resolution and Governing Law</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">11.1 Governing Law</h3>
                <p className="mb-4">
                  These Terms are governed by and construed in accordance with the laws of Switzerland, specifically 
                  the Swiss Code of Obligations (OR), without regard to its conflict of law provisions.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">11.2 Jurisdiction</h3>
                <p className="mb-4">
                  Any disputes arising from or relating to these Terms or your use of the Platform shall be subject to 
                  the exclusive jurisdiction of the courts of Zürich, Switzerland.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">11.3 Dispute Resolution Process</h3>
                <p className="mb-2">Before initiating legal proceedings, parties agree to:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Attempt to resolve disputes through good faith negotiations</li>
                  <li>Contact our support team at support@servemkt.ch for mediation assistance</li>
                  <li>Allow 30 days for resolution attempts before pursuing legal action</li>
                </ol>
              </section>

              <Separator />

              {/* Changes to Terms */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">12. Changes to Terms</h2>
                <p className="mb-4">
                  We reserve the right to modify these Terms at any time. Changes will be effective immediately upon 
                  posting to the Platform. Your continued use of the Platform after changes constitutes acceptance of 
                  the modified Terms.
                </p>
                <p>
                  Material changes will be communicated via email to registered users at least 30 days before they take effect.
                </p>
              </section>

              <Separator />

              {/* Data Protection */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">13. Data Protection</h2>
                <p>
                  Your use of the Platform is also governed by our Privacy Policy, which complies with the Swiss Federal 
                  Act on Data Protection (DSG). Please review our Privacy Policy to understand our data practices.
                </p>
              </section>

              <Separator />

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information</h2>
                <div className="bg-muted rounded-lg p-6">
                  <p className="font-semibold text-foreground mb-2">Commerzio Services AG</p>
                  <p>Bahnhofstrasse 1</p>
                  <p>8001 Zürich</p>
                  <p>Switzerland</p>
                  <p className="mt-4">
                    Email:{" "}
                    <a href="mailto:info@servemkt.ch" className="text-primary hover:underline" data-testid="link-info-email">
                      info@servemkt.ch
                    </a>
                  </p>
                  <p>
                    Support:{" "}
                    <a href="mailto:support@servemkt.ch" className="text-primary hover:underline" data-testid="link-support-email">
                      support@servemkt.ch
                    </a>
                  </p>
                </div>
              </section>

              <Separator />

              {/* Severability */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">15. Severability</h2>
                <p>
                  If any provision of these Terms is found to be invalid or unenforceable under Swiss law, that provision 
                  shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall 
                  remain in full force and effect.
                </p>
              </section>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
                <p className="text-sm text-foreground">
                  <strong>Acknowledgment:</strong> By using Commerzio Services, you acknowledge that you have read, understood, 
                  and agree to be bound by these Terms of Service.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
