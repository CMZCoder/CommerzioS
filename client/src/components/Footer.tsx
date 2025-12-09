import { Link } from "wouter"
import { BRAND } from "@/lib/brand"

export function Footer() {
    return (
        <footer className="bg-card dark:bg-background border-t border-border text-muted-foreground py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand Column - Only on large screens */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 lg:order-first order-last">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-primary-foreground">
                                    <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12c4.125 0 7.763-2.085 9.924-5.256"
                                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                                    <circle cx="23" cy="9" r="2.5" fill="currentColor" />
                                    <circle cx="26.5" cy="16" r="2.5" fill="currentColor" />
                                    <circle cx="23" cy="23" r="2.5" fill="currentColor" />
                                </svg>
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="font-bold text-foreground text-lg">Commerzio</span>
                                <span className="text-xs font-medium text-accent -mt-0.5">Services</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs hidden lg:block">
                            {BRAND.description}
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about"><span className="hover:text-foreground transition-colors cursor-pointer">About</span></Link></li>
                            <li><Link href="/how-it-works"><span className="hover:text-foreground transition-colors cursor-pointer">How It Works</span></Link></li>
                            <li><Link href="/trust-safety"><span className="hover:text-foreground transition-colors cursor-pointer">Trust & Safety</span></Link></li>
                            <li><Link href="/pricing"><span className="hover:text-foreground transition-colors cursor-pointer">Pricing</span></Link></li>
                        </ul>
                    </div>

                    {/* For Vendors */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">For Vendors</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/register"><span className="hover:text-foreground transition-colors cursor-pointer">Become a Vendor</span></Link></li>
                            <li><Link href="/vendor-resources"><span className="hover:text-foreground transition-colors cursor-pointer">Resources</span></Link></li>
                            <li><Link href="/success-stories"><span className="hover:text-foreground transition-colors cursor-pointer">Success Stories</span></Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/help-center"><span className="hover:text-foreground transition-colors cursor-pointer">Help Center</span></Link></li>
                            <li><Link href="/contact"><span className="hover:text-foreground transition-colors cursor-pointer">Contact</span></Link></li>
                            <li><Link href="/dispute-resolution"><span className="hover:text-foreground transition-colors cursor-pointer">Dispute Resolution</span></Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/terms"><span className="hover:text-foreground transition-colors cursor-pointer">Terms</span></Link></li>
                            <li><Link href="/privacy"><span className="hover:text-foreground transition-colors cursor-pointer">Privacy</span></Link></li>
                            <li><Link href="/cookies"><span className="hover:text-foreground transition-colors cursor-pointer">Cookies</span></Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs font-bold text-foreground">C</span>
                        </div>
                        <span>© 2025 Commerzio Services. Made in Switzerland with</span>
                        <span className="text-red-500">❤</span>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground/70">Payment Methods:</span>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50">
                                Card
                            </span>
                            <span className="px-3 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50">
                                TWINT
                            </span>
                            <span className="px-3 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50">
                                Cash
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
