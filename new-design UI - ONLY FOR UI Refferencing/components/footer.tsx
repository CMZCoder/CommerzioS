import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-to-br from-card via-primary/5 to-card text-card-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Platform */}
          <div>
            <h3 className="font-semibold mb-4 text-primary">Platform</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/trust-safety" className="hover:text-primary transition-colors">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">For Vendors</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/vendor/register" className="hover:text-accent transition-colors">
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link href="/vendor/resources" className="hover:text-accent transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/vendor/success" className="hover:text-accent transition-colors">
                  Success Stories
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-primary">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/disputes" className="hover:text-primary transition-colors">
                  Dispute Resolution
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4 text-accent">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-accent transition-colors">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-accent transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-accent transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
              C
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Commerzio Services. Made in Switzerland with <span className="text-primary">♥</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Payment Methods:</span>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg text-xs font-medium hover:border-primary/40 transition-colors cursor-pointer">
                Card
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 rounded-lg text-xs font-medium hover:border-accent/40 transition-colors cursor-pointer">
                TWINT
              </div>
              <div className="px-3 py-1.5 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-lg text-xs font-medium hover:border-primary/40 transition-colors cursor-pointer">
                Cash
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
