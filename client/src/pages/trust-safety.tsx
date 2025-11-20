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
              Building a safe and trusted community for all ServeMkt users
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
                <div className="bg-slate-100 rounded-lg p-4 mt-4">
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
                  If you experience a dispute with another user, we're here to help facilitate a resolution.
                </p>
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Resolution Process:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li><strong className="text-foreground">Direct Communication:</strong> First, try to resolve the issue directly with the other party</li>
                    <li><strong className="text-foreground">Contact Support:</strong> If direct communication fails, contact our safety team with details</li>
                    <li><strong className="text-foreground">Mediation:</strong> We'll review the situation and may offer mediation services</li>
                    <li><strong className="text-foreground">Investigation:</strong> For serious violations, we'll conduct a full investigation</li>
                    <li><strong className="text-foreground">Action:</strong> We may take action including warnings, refunds facilitation, or account termination</li>
                  </ol>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 mt-4">
                  <p className="text-sm">
                    <strong className="text-foreground">Important:</strong> ServeMkt acts as a platform connecting users. While we facilitate dispute resolution, we are not responsible for transactions between users. All disputes are subject to Swiss law and jurisdiction in Zürich, Switzerland.
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
                  For safety concerns, reports, or dispute resolution, contact our dedicated safety team:
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
