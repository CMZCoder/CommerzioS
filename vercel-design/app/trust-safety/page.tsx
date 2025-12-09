import Link from "next/link"
import { Shield, CheckCircle2, UserCheck, Lock, AlertTriangle, FileText, Phone, Eye, Scale, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl font-bold mb-6 text-balance">Trust & Safety</h1>
            <p className="text-xl text-muted-foreground text-pretty">
              Your security is our top priority. Learn how we protect every transaction and interaction on Commerzio.
            </p>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Commitment to You</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've built Commerzio with multiple layers of protection to ensure safe, secure transactions for everyone
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Vendors</h3>
              <p className="text-muted-foreground">
                Every service provider undergoes a rigorous verification process including identity checks, license
                verification, and background screening.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-muted-foreground">
                All payments are processed through our secure escrow system. Your money is protected until you confirm
                the service is complete.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">24/7 Monitoring</h3>
              <p className="text-muted-foreground">
                Our security team continuously monitors the platform for suspicious activity and responds immediately to
                any concerns.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Verified Reviews</h3>
              <p className="text-muted-foreground">
                Only customers who completed a verified booking can leave reviews, ensuring authentic feedback you can
                trust.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Scale className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Dispute Resolution</h3>
              <p className="text-muted-foreground">
                Professional mediation team available to resolve any disputes fairly and efficiently for both parties.
              </p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Data Privacy</h3>
              <p className="text-muted-foreground">
                Your personal information is encrypted and never shared without your consent. We comply with Swiss data
                protection laws.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Verification */}
      <section className="py-20 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Vendor Verification Process</h2>
              <p className="text-lg text-muted-foreground">
                Multi-step verification ensures only qualified professionals join our platform
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Identity Verification</h3>
                  <p className="text-muted-foreground">
                    Government-issued ID verification and face matching to confirm identity authenticity.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Professional License Check</h3>
                  <p className="text-muted-foreground">
                    Verification of relevant professional licenses, certifications, and insurance where required.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Background Screening</h3>
                  <p className="text-muted-foreground">
                    Criminal background checks and verification of business registration for applicable services.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Skills Assessment</h3>
                  <p className="text-muted-foreground">
                    Portfolio review and skills verification to ensure quality service delivery standards.
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex gap-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-foreground">5</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Ongoing Monitoring</h3>
                  <p className="text-muted-foreground">
                    Continuous performance monitoring through customer reviews, response times, and completion rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Escrow Protection */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">How Escrow Protection Works</h2>
              <p className="text-lg text-muted-foreground">Your payment is secure every step of the way</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Payment Held</h3>
                <p className="text-muted-foreground">
                  When you book a service, your payment is securely held in escrow - not released to the vendor yet.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Service Completed</h3>
                <p className="text-muted-foreground">
                  The vendor completes the agreed service. You have time to review and approve the work.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Payment Released</h3>
                <p className="text-muted-foreground">
                  Once you confirm satisfaction, payment is automatically released to the vendor. If there's an issue,
                  we mediate.
                </p>
              </div>
            </div>

            <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8">
              <div className="flex gap-4">
                <Shield className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Your Money is Protected</h3>
                  <p className="text-muted-foreground mb-4">
                    Escrow protection means vendors can't access your payment until you're satisfied. If a service isn't
                    delivered as promised, you're eligible for a full refund through our dispute resolution process.
                  </p>
                  <Link href="/disputes">
                    <Button variant="outline" className="rounded-full bg-transparent">
                      Learn About Dispute Resolution
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Guidelines */}
      <section className="py-20 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Safety Guidelines</h2>
              <p className="text-lg text-muted-foreground">Tips to help you stay safe when using Commerzio</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Do's</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Always book and pay through the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Check vendor verification badges and reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Communicate through our secure messaging system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Get written quotes and agreements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Report suspicious behavior immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Read service descriptions and terms carefully</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Don'ts</h3>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Never pay outside the platform</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don't share personal financial information</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Avoid vendors who rush you or pressure you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don't ignore red flags or negative reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Never approve payment before work is complete</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>Don't communicate outside the platform</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Report & Contact */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Report a Concern</h2>
              <p className="text-lg text-muted-foreground">If you encounter any issues, we're here to help 24/7</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Report Suspicious Activity</h3>
                <p className="text-sm text-muted-foreground mb-4">Flag inappropriate behavior or suspicious accounts</p>
                <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                  Report Now
                </Button>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">24/7 Support</h3>
                <p className="text-sm text-muted-foreground mb-4">Get immediate assistance from our safety team</p>
                <Link href="/help">
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                    Contact Support
                  </Button>
                </Link>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Scale className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">File a Dispute</h3>
                <p className="text-sm text-muted-foreground mb-4">Resolve payment or service quality issues</p>
                <Link href="/disputes">
                  <Button variant="outline" size="sm" className="rounded-full bg-transparent">
                    Start Dispute
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Your Safety is Our Mission</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            We continuously invest in security measures and safety protocols to protect our community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/help">
              <Button size="lg" className="rounded-full">
                Contact Safety Team
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="rounded-full bg-transparent">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
