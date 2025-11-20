import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-muted-foreground">
              We're here to help. Reach out to us with any questions or concerns.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">General Inquiries</p>
                    <a 
                      href="mailto:info@servemkt.ch" 
                      className="text-primary font-medium hover:underline"
                      data-testid="link-info-email"
                    >
                      info@servemkt.ch
                    </a>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Customer Support</p>
                    <a 
                      href="mailto:support@servemkt.ch" 
                      className="text-primary font-medium hover:underline"
                      data-testid="link-support-email"
                    >
                      support@servemkt.ch
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Our Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="not-italic text-muted-foreground" data-testid="text-address">
                    <strong className="text-foreground">ServeMkt AG</strong><br />
                    Bahnhofstrasse 1<br />
                    8001 Zürich<br />
                    Switzerland
                  </address>
                </CardContent>
              </Card>

              <Card className="bg-slate-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Response Times</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• General inquiries: Within 48 hours</li>
                    <li>• Support requests: Within 24 hours</li>
                    <li>• Safety concerns: Within 12 hours</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-4">
                    *Response times apply to business days (Monday-Friday)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-contact-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-contact-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="How can we help you?"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      data-testid="textarea-contact-message"
                    />
                  </div>

                  <Button type="submit" className="w-full gap-2" data-testid="button-send-message">
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Additional Help Links */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/help-center" className="text-primary hover:underline" data-testid="link-help-center">
                Visit our Help Center
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/trust-safety" className="text-primary hover:underline" data-testid="link-trust-safety">
                Trust & Safety
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/terms" className="text-primary hover:underline" data-testid="link-terms">
                Terms of Service
              </a>
              <span className="text-muted-foreground">•</span>
              <a href="/privacy" className="text-primary hover:underline" data-testid="link-privacy">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
