import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield } from "lucide-react";

export default function Privacy() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground mb-8">Last updated: November 20, 2025</p>

          <Card>
            <CardContent className="pt-6 space-y-8 text-muted-foreground">
              {/* Introduction */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Commerzio Services AG ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your personal data when you use our marketplace 
                  platform ("Platform").
                </p>
                <p className="mb-4">
                  This Privacy Policy complies with the Swiss Federal Act on Data Protection (Bundesgesetz über den 
                  Datenschutz, "DSG") and applicable Swiss data protection regulations.
                </p>
                <p>
                  By using our Platform, you agree to the collection and use of information in accordance with this 
                  Privacy Policy.
                </p>
              </section>

              <Separator />

              {/* Data Controller */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Data Controller</h2>
                <div className="bg-muted rounded-lg p-6">
                  <p className="font-semibold text-foreground mb-2">Commerzio Services AG</p>
                  <p>Bahnhofstrasse 1</p>
                  <p>8001 Zürich</p>
                  <p>Switzerland</p>
                  <p className="mt-4">
                    Data Protection Contact:{" "}
                    <a href="mailto:privacy@servemkt.ch" className="text-primary hover:underline" data-testid="link-privacy-email">
                      privacy@servemkt.ch
                    </a>
                  </p>
                </div>
              </section>

              <Separator />

              {/* Data Collection */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Collection</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">3.1 Information You Provide</h3>
                <p className="mb-2">We collect information that you voluntarily provide when you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li><strong className="text-foreground">Create an account:</strong> Name, email address, password, phone number</li>
                  <li><strong className="text-foreground">Complete your profile:</strong> Profile picture, bio, location, professional credentials</li>
                  <li><strong className="text-foreground">Post a service:</strong> Service description, pricing (CHF), category, availability</li>
                  <li><strong className="text-foreground">Communicate with others:</strong> Messages, reviews, ratings, comments</li>
                  <li><strong className="text-foreground">Contact support:</strong> Support inquiries, feedback, complaints</li>
                  <li><strong className="text-foreground">Verify your identity:</strong> Government-issued ID, proof of address, professional licenses</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">3.2 Automatically Collected Information</h3>
                <p className="mb-2">When you use our Platform, we automatically collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li><strong className="text-foreground">Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong className="text-foreground">Usage Data:</strong> Pages viewed, time spent, search queries, clicks, features used</li>
                  <li><strong className="text-foreground">Location Data:</strong> Approximate location based on IP address (with your consent)</li>
                  <li><strong className="text-foreground">Cookies and Tracking:</strong> Session cookies, preference cookies, analytics cookies</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">3.3 Information from Third Parties</h3>
                <p className="mb-2">We may receive information from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Authentication providers (e.g., Google, if you log in via third-party services)</li>
                  <li>Payment processors (for premium features)</li>
                  <li>Identity verification services</li>
                  <li>Public databases and directories</li>
                </ul>
              </section>

              <Separator />

              {/* Data Usage */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. How We Use Your Data</h2>
                <p className="mb-4">We use your personal data for the following purposes:</p>

                <h3 className="text-xl font-semibold text-foreground mb-3">4.1 Platform Operation</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Create and manage your account</li>
                  <li>Process and display service listings</li>
                  <li>Facilitate communication between users</li>
                  <li>Process payments for premium features (in CHF)</li>
                  <li>Provide customer support</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">4.2 Safety and Security</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Verify user identities</li>
                  <li>Prevent fraud and abuse</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Investigate violations and disputes</li>
                  <li>Protect the rights and safety of users</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">4.3 Platform Improvement</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Analyze usage patterns and trends</li>
                  <li>Improve user experience and features</li>
                  <li>Develop new products and services</li>
                  <li>Conduct research and analytics</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">4.4 Communication</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Send transactional emails (account notifications, listing updates)</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Notify you of changes to our policies or services</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">4.5 Legal Compliance</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Comply with legal obligations under Swiss law</li>
                  <li>Respond to legal requests and prevent legal misuse</li>
                  <li>Establish, exercise, or defend legal claims</li>
                </ul>
              </section>

              <Separator />

              {/* Data Sharing */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Sharing and Disclosure</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Public Information</h3>
                <p className="mb-4">
                  Certain information is publicly visible on your profile and service listings, including your name, 
                  profile picture, bio, services offered, prices (in CHF), location, and reviews.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.2 With Other Users</h3>
                <p className="mb-4">
                  When you contact a service provider or customer, they can see your profile information and communication history.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.3 With Service Providers</h3>
                <p className="mb-2">We share data with trusted third-party service providers who assist us with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Hosting and infrastructure (cloud services)</li>
                  <li>Payment processing</li>
                  <li>Identity verification</li>
                  <li>Email delivery</li>
                  <li>Analytics and performance monitoring</li>
                  <li>Customer support tools</li>
                </ul>
                <p className="mb-4">
                  These service providers are contractually obligated to protect your data and may only use it for the 
                  purposes we specify.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.4 Legal Requirements</h3>
                <p className="mb-2">We may disclose your data if required to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Comply with Swiss law or legal processes</li>
                  <li>Respond to requests from Swiss government authorities</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect the rights, property, or safety of Commerzio Services, users, or the public</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">5.5 Business Transfers</h3>
                <p>
                  In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring 
                  entity, subject to the same privacy protections.
                </p>
              </section>

              <Separator />

              {/* Data Retention */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Data Retention</h2>
                <p className="mb-4">
                  We retain your personal data only for as long as necessary to fulfill the purposes outlined in this 
                  Privacy Policy, unless a longer retention period is required by Swiss law.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li><strong className="text-foreground">Account Data:</strong> Retained while your account is active and for 1 year after account closure</li>
                  <li><strong className="text-foreground">Service Listings:</strong> Retained for 2 years after expiration for analytics and dispute resolution</li>
                  <li><strong className="text-foreground">Reviews and Ratings:</strong> Retained indefinitely to maintain platform integrity</li>
                  <li><strong className="text-foreground">Communications:</strong> Retained for 1 year after the last message</li>
                  <li><strong className="text-foreground">Transaction Records:</strong> Retained for 10 years as required by Swiss tax and accounting laws</li>
                  <li><strong className="text-foreground">Support Inquiries:</strong> Retained for 3 years</li>
                </ul>
                <p>
                  You may request earlier deletion of your data, subject to legal and contractual obligations.
                </p>
              </section>

              <Separator />

              {/* User Rights */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Your Rights Under Swiss DSG</h2>
                <p className="mb-4">
                  Under the Swiss Federal Act on Data Protection (DSG), you have the following rights:
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.1 Right of Access</h3>
                <p className="mb-4">
                  You have the right to request confirmation of what personal data we hold about you and to obtain a 
                  copy of that data.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.2 Right to Correction</h3>
                <p className="mb-4">
                  You have the right to request that we correct inaccurate or incomplete personal data. You can update 
                  most information directly in your account settings.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.3 Right to Deletion</h3>
                <p className="mb-4">
                  You have the right to request deletion of your personal data, subject to legal retention requirements 
                  and our legitimate interests.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.4 Right to Data Portability</h3>
                <p className="mb-4">
                  You have the right to request a copy of your data in a structured, commonly used, and machine-readable format.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.5 Right to Object</h3>
                <p className="mb-4">
                  You have the right to object to processing of your personal data for direct marketing purposes or 
                  based on legitimate interests.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">7.6 How to Exercise Your Rights</h3>
                <p className="mb-2">
                  To exercise any of these rights, contact us at:{" "}
                  <a href="mailto:privacy@servemkt.ch" className="text-primary hover:underline" data-testid="link-privacy-contact">
                    privacy@servemkt.ch
                  </a>
                </p>
                <p className="text-sm">
                  We will respond to your request within 30 days. We may request additional information to verify your 
                  identity before processing your request.
                </p>
              </section>

              <Separator />

              {/* Data Security */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Data Security</h2>
                <p className="mb-4">
                  We implement appropriate technical and organizational measures to protect your personal data against 
                  unauthorized access, loss, destruction, or alteration:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Encryption of sensitive data at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication</li>
                  <li>Employee training on data protection</li>
                  <li>Secure data centers in Switzerland and EU</li>
                </ul>
                <p>
                  However, no method of transmission or storage is 100% secure. While we strive to protect your data, 
                  we cannot guarantee absolute security.
                </p>
              </section>

              <Separator />

              {/* Cookies */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies and Tracking Technologies</h2>
                
                <h3 className="text-xl font-semibold text-foreground mb-3">9.1 What Are Cookies</h3>
                <p className="mb-4">
                  Cookies are small text files stored on your device when you visit our Platform. We use cookies and 
                  similar tracking technologies to enhance your experience.
                </p>

                <h3 className="text-xl font-semibold text-foreground mb-3">9.2 Types of Cookies We Use</h3>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li><strong className="text-foreground">Essential Cookies:</strong> Required for the Platform to function (login, security, preferences)</li>
                  <li><strong className="text-foreground">Performance Cookies:</strong> Help us understand how you use the Platform (analytics)</li>
                  <li><strong className="text-foreground">Functionality Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong className="text-foreground">Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
                </ul>

                <h3 className="text-xl font-semibold text-foreground mb-3">9.3 Managing Cookies</h3>
                <p>
                  You can control cookies through your browser settings. Note that disabling certain cookies may affect 
                  Platform functionality. Most browsers allow you to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>View and delete cookies</li>
                  <li>Block third-party cookies</li>
                  <li>Block cookies from specific sites</li>
                  <li>Block all cookies</li>
                </ul>
              </section>

              <Separator />

              {/* International Transfers */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">10. International Data Transfers</h2>
                <p className="mb-4">
                  Your data is primarily stored on servers located in Switzerland and the European Union. If we transfer 
                  data to countries outside Switzerland, we ensure adequate protection through:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Standard contractual clauses approved by Swiss authorities</li>
                  <li>Adequacy decisions recognizing equivalent data protection standards</li>
                  <li>Other legally approved safeguards</li>
                </ul>
              </section>

              <Separator />

              {/* Children's Privacy */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">11. Children's Privacy</h2>
                <p>
                  Our Platform is not intended for individuals under 18 years of age. We do not knowingly collect 
                  personal data from children. If we become aware that we have collected data from a child without 
                  parental consent, we will take steps to delete that information.
                </p>
              </section>

              <Separator />

              {/* Changes to Privacy Policy */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">12. Changes to This Privacy Policy</h2>
                <p className="mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Posting the updated policy on our Platform</li>
                  <li>Updating the "Last updated" date</li>
                  <li>Sending an email notification for significant changes</li>
                </ul>
                <p>
                  Your continued use of the Platform after changes constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              <Separator />

              {/* Supervisory Authority */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">13. Supervisory Authority</h2>
                <p className="mb-4">
                  If you have concerns about how we handle your personal data, you have the right to lodge a complaint 
                  with the Swiss Federal Data Protection and Information Commissioner (FDPIC):
                </p>
                <div className="bg-muted rounded-lg p-6">
                  <p className="font-semibold text-foreground mb-2">
                    Federal Data Protection and Information Commissioner (FDPIC)
                  </p>
                  <p>Feldeggweg 1</p>
                  <p>3003 Bern</p>
                  <p>Switzerland</p>
                  <p className="mt-4">Website: www.edoeb.admin.ch</p>
                </div>
              </section>

              <Separator />

              {/* Contact Us */}
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Us</h2>
                <p className="mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <p className="font-semibold text-foreground mb-2">Data Protection Officer</p>
                  <p>Commerzio Services AG</p>
                  <p>Bahnhofstrasse 1</p>
                  <p>8001 Zürich</p>
                  <p>Switzerland</p>
                  <p className="mt-4">
                    Email:{" "}
                    <a href="mailto:privacy@servemkt.ch" className="text-primary hover:underline" data-testid="link-dpo-email">
                      privacy@servemkt.ch
                    </a>
                  </p>
                </div>
              </section>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-8">
                <p className="text-sm text-foreground">
                  <strong>Your Privacy Matters:</strong> We are committed to transparency and protecting your personal 
                  data in compliance with Swiss data protection laws. Thank you for trusting Commerzio Services.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
