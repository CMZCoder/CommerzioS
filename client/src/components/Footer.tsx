import { Link } from "wouter"
import { BRAND } from "@/lib/brand"

export function Footer() {
    return (
        <footer className="bg-card dark:bg-background border-t border-border text-muted-foreground py-16 mt-20">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-2">
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
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-4">
                            {BRAND.description}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            A <span className="font-medium text-muted-foreground">{BRAND.parentCompany}</span> company
                        </p>
                        {/* Trust badges */}
                        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span>SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span>Verified Providers</span>
                            </div>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Browse Services</span></Link></li>
                            <li><Link href="/register"><span className="hover:text-foreground transition-colors cursor-pointer">Post a Service</span></Link></li>
                            <li><Link href="/how-it-works"><span className="hover:text-foreground transition-colors cursor-pointer">How it Works</span></Link></li>
                            <li><Link href="/referrals"><span className="hover:text-foreground transition-colors cursor-pointer">Refer & Earn</span></Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Support</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/help-center"><span className="hover:text-foreground transition-colors cursor-pointer">Help Center</span></Link></li>
                            <li><Link href="/trust-safety"><span className="hover:text-foreground transition-colors cursor-pointer">Trust & Safety</span></Link></li>
                            <li><Link href="/contact"><span className="hover:text-foreground transition-colors cursor-pointer">Contact Us</span></Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-foreground mb-4">Legal</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/terms"><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></Link></li>
                            <li><Link href="/privacy"><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground/70">
                        {BRAND.copyright}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                        <span>🇨🇭</span>
                        <span>Made in Switzerland</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
