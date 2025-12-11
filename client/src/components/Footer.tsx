import { Link } from "wouter"
import { Shield, Star } from "lucide-react"

export function Footer() {
    return (
        <footer className="bg-card dark:bg-background border-t border-border text-muted-foreground">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-2 lg:order-first order-last">
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
                                <span className="text-xs font-medium text-primary -mt-0.5">Services</span>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-4">
                            Connecting trusted service providers with people who need their skills. Simple, secure, and Swiss.
                        </p>
                        <p className="text-xs text-muted-foreground/70 mb-6">
                            A <span className="text-foreground font-medium">Commerzio</span> company
                        </p>
                        
                        {/* Trust Badges */}
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Shield className="w-4 h-4 text-green-500" />
                                <span>SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Star className="w-4 h-4 text-primary" />
                                <span>Verified Providers</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/search" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Browse Services
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Post a Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/how-it-works" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    How it Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/referrals" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Refer & Earn
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/help-center" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/trust-safety" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Trust & Safety
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/terms" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="hover:text-primary hover:translate-x-1 inline-block transition-all duration-200">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-border">
                <div className="container mx-auto px-4 py-6 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2025 Commerzio Services AG. All rights reserved.
                    </p>
                    
                    {/* Payment Methods */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">Payment Methods:</span>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-200 cursor-default">
                                💳 Card
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-200 cursor-default">
                                📱 TWINT
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium rounded bg-muted/50 text-foreground border border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:scale-105 transition-all duration-200 cursor-default">
                                💵 Cash
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-base">🇨🇭</span>
                        <span>Made in Switzerland</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
