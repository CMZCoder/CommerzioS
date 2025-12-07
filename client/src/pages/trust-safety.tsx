import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, Flag, FileText, Gavel, Mail } from "lucide-react";

export default function TrustSafety() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Trust & Safety</h1>
            <p className="text-lg text-muted-foreground">
              Building a safe and trusted community for all Commerzio Services users
            </p>
          </div>

          <div className="space-y-8">
            {/* Identity Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  We take identity verification seriously to ensure trust and safety within our marketplace.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Verification Process:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Service providers must verify their identity to receive reviews and ratings</li>
                    <li>Verification includes email confirmation and phone number validation</li>
                    <li>Additional document verification may be required for certain service categories</li>
                    <li>Verified users receive a verification badge on their profile</li>
                    <li>Re-verification may be required periodically to maintain account status</li>
                  </ul>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong className="text-foreground">Note:</strong> Verification is required to build trust in our community. Unverified users can browse and contact providers, but cannot post services or leave reviews.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Review System */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Review System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Our review system is designed to maintain authenticity and help users make informed decisions.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Review Guidelines:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong className="text-foreground">Verified Users Only:</strong> Only verified users who have completed a transaction can leave reviews</li>
                    <li><strong className="text-foreground">Honest Feedback:</strong> Reviews must be based on actual experiences with the service</li>
                    <li><strong className="text-foreground">No Manipulation:</strong> Fake reviews, review swapping, or incentivized reviews are strictly prohibited</li>
                    <li><strong className="text-foreground">Permanent:</strong> Reviews cannot be edited or deleted once submitted</li>
                    <li><strong className="text-foreground">Provider Response:</strong> Service providers can respond to reviews to address concerns</li>
                  </ul>
                </div>
                <p className="mt-4">
                  We monitor reviews for authenticity and compliance with our guidelines. Suspicious reviews are investigated and may be removed.
                </p>
              </CardContent>
            </Card>

            {/* Reporting Inappropriate Listings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-primary" />
                  Reporting Inappropriate Listings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Help us maintain a safe marketplace by reporting listings or behavior that violates our policies.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Report if you see:</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Illegal services or activities</li>
                    <li>Fraudulent or deceptive listings</li>
                    <li>Inappropriate or offensive content</li>
                    <li>Spam or duplicate listings</li>
                    <li>Violations of intellectual property rights</li>
                    <li>Services prohibited by Swiss law</li>
                  </ul>
                </div>
                <div className="bg-muted rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-foreground mb-2">How to Report:</p>
                  <p className="text-sm">
                    Click the "Report" button on any listing or user profile, or contact our safety team directly at{" "}
                    <a href="mailto:safety@servemkt.ch" className="text-primary hover:underline" data-testid="link-safety-email">
                      safety@servemkt.ch
                    </a>
                  </p>
                </div>
                <p className="text-sm mt-4">
                  All reports are reviewed within 24-48 hours. Your report will remain confidential.
                </p>
              </CardContent>
            </Card>

            {/* User Guidelines and Community Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  User Guidelines & Community Standards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Our community thrives when everyone follows these guidelines:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">For All Users:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>Be respectful and professional</li>
                      <li>Communicate clearly and honestly</li>
                      <li>Protect your personal information</li>
                      <li>Report suspicious activity</li>
                      <li>Follow Swiss laws and regulations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">For Service Providers:</h4>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
                      <li>Provide accurate service descriptions</li>
                      <li>Honor quoted prices in CHF</li>
                      <li>Deliver services as promised</li>
                      <li>Maintain required licenses and insurance</li>
                      <li>Respond to inquiries promptly</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-900">
                    <strong>Warning:</strong> Violation of our community standards may result in listing removal, account suspension, or permanent ban from the platform.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dispute Resolution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-primary" />
                  Dispute Resolution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  If you experience a dispute with another user, we have a structured 3-phase resolution process designed for speed (max 14 days) and fairness.
                </p>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-semibold text-foreground">Phase 1: Direct Negotiation (Max 7 Days)</h4>
                    <p className="text-sm mt-1 mb-2 text-muted-foreground">
                      <strong>How to start:</strong> Click "Report Issue" on any completed booking before payment is released.
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                      <li>Describe the problem and upload evidence (required)</li>
                      <li>Communicate directly with the other party via chat</li>
                      <li>Vendors can propose alternative times or discounts</li>
                      <li>Maximum 3 counter-proposals per party</li>
                      <li>48-hour response window per proposal</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-yellow-400 pl-4">
                    <h4 className="font-semibold text-foreground">Phase 2: AI-Mediated Negotiation (Max 7 Days)</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm mt-2">
                      <li>Upload evidence (photos, screenshots, documents)</li>
                      <li>AI analyzes evidence, descriptions, and behavior patterns</li>
                      <li>AI proposes tailored resolution options based on analysis</li>
                      <li>Both parties can accept an option or counter-propose</li>
                      <li>If both accept the same option, dispute is resolved</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-red-400 pl-4">
                    <h4 className="font-semibold text-foreground">Phase 3: Final Resolution</h4>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm mt-2">
                      <li><strong>Option A:</strong> AI makes binding final decision (immediate)</li>
                      <li><strong>Option B:</strong> Choose "External Resolution" to handle outside platform</li>
                      <li>External resolution generates a dispute report for legal use</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong className="text-foreground">Important:</strong> AI decisions are FINAL and BINDING with no appeals within the platform. 
                    You can choose "External Resolution" to handle the dispute through mediation, arbitration, or Swiss courts - 
                    a comprehensive dispute report will be provided to both parties. Commission rules apply based on who chooses external resolution.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Commission on External Resolution:</strong><br/>
                    • Customer chooses external → Commission charged, funds to vendor<br/>
                    • Vendor chooses external → No commission, full refund to customer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Safety Team */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Our Safety Team
                </CardTitle>
                <CardDescription>
                  We're committed to maintaining a safe and trusted marketplace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  For safety concerns or reporting violations (not disputes - disputes follow the 3-phase process above), contact our safety team:
                </p>
                <p className="text-muted-foreground">
                  Email:{" "}
                  <a 
                    href="mailto:safety@servemkt.ch" 
                    className="text-primary font-medium hover:underline"
                    data-testid="link-safety-contact"
                  >
                    safety@servemkt.ch
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Note:</strong> Disputes are resolved through our 3-phase system (max 14 days). This team is for reporting platform violations and safety concerns only.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Emergency situations should be reported to local authorities immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
