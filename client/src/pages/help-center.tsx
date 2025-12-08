import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useState } from "react";
import {
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Shield,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Video,
  Loader2,
} from "lucide-react";

export default function HelpCenter() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  // FAQ data
  const faqSections = [
    {
      category: "Bookings",
      questions: [
        {
          q: "How do I book a service?",
          a: "Browse services, select your preferred provider, choose a date/time, and confirm your booking. Payment is held securely in escrow until service completion.",
        },
        {
          q: "Can I cancel or reschedule my booking?",
          a: "Yes, you can cancel or reschedule up to 24 hours before the appointment. Check our cancellation policy for specific refund terms.",
        },
        {
          q: "What if the vendor doesn't show up?",
          a: "If a vendor fails to show up, your payment is automatically refunded, and you can file a complaint for review.",
        },
      ],
    },
    {
      category: "Payments",
      questions: [
        {
          q: "How does escrow protection work?",
          a: "Your payment is held securely until the service is completed. Once both parties confirm, the funds are released to the vendor.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept credit/debit cards, TWINT, PostFinance, and bank transfers for Swiss customers.",
        },
        {
          q: "When do I get charged?",
          a: "You're charged when you confirm a booking. The funds are held in escrow and released after service completion.",
        },
      ],
    },
    {
      category: "For Vendors",
      questions: [
        {
          q: "How do I become a vendor?",
          a: "Click 'Become a Vendor', complete your profile, verify your identity, and submit your service listings for approval.",
        },
        {
          q: "What are the fees?",
          a: "We charge a 10% platform fee on completed bookings. No upfront costs or monthly subscriptions.",
        },
        {
          q: "How do I get paid?",
          a: "Payments are released to your account 24 hours after service completion confirmation, minus the platform fee.",
        },
      ],
    },
  ];

  // Guides data
  const guides = [
    {
      title: "Complete Guide to Booking Services",
      description: "Learn how to find, compare, and book the perfect service provider",
      duration: "5 min read",
      badge: "Popular",
      icon: Book,
    },
    {
      title: "Understanding Escrow Protection",
      description: "How our secure payment system protects both customers and vendors",
      duration: "3 min read",
      badge: "Essential",
      icon: Shield,
    },
    {
      title: "Getting Started as a Vendor",
      description: "Everything you need to know to start offering services on Commerzio",
      duration: "8 min read",
      badge: "For Vendors",
      icon: Users,
    },
    {
      title: "How to Handle Disputes",
      description: "Steps to resolve conflicts and get help from our support team",
      duration: "4 min read",
      badge: "Support",
      icon: AlertCircle,
    },
    {
      title: "Maximizing Your Referral Rewards",
      description: "Earn rewards by inviting friends and family to Commerzio",
      duration: "3 min read",
      badge: "Rewards",
      icon: CheckCircle2,
    },
    {
      title: "Video Tutorial: Your First Booking",
      description: "Watch a step-by-step video guide for making your first service booking",
      duration: "10 min watch",
      badge: "Video",
      icon: Video,
    },
  ];

  // Quick links data
  const quickLinks = [
    { icon: Book, label: "Getting Started", count: "12 articles", color: "from-blue-500 to-cyan-500" },
    { icon: CreditCard, label: "Payments & Escrow", count: "8 articles", color: "from-purple-500 to-pink-500" },
    { icon: Shield, label: "Safety & Security", count: "10 articles", color: "from-green-500 to-emerald-500" },
    { icon: Users, label: "Account & Profile", count: "15 articles", color: "from-orange-500 to-red-500" },
  ];

  // Contact options data
  const contactOptions = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Start Chat",
      available: "Available now",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@commerzio.ch",
      action: "Send Email",
      available: "Response in 24h",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "+41 XX XXX XX XX",
      action: "Call Us",
      available: "Mon-Fri 9am-6pm",
    },
  ];

  // Filter FAQs based on search
  const filteredFaqs = searchQuery.trim()
    ? faqSections.map(section => ({
      ...section,
      questions: section.questions.filter(
        q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.questions.length > 0)
    : faqSections;

  // Handle contact form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Message sent!",
      description: "We'll get back to you within 24 hours.",
    });

    setFormData({ name: "", email: "", subject: "", message: "" });
    setIsSubmitting(false);
  };

  // Handle contact actions
  const handleContactAction = (action: string) => {
    switch (action) {
      case "Start Chat":
        toast({
          title: "Live Chat",
          description: "Opening chat window...",
        });
        // In production, this would open a chat widget like Intercom/Zendesk
        break;
      case "Send Email":
        window.location.href = "mailto:support@commerzio.ch";
        break;
      case "Call Us":
        window.location.href = "tel:+41XXXXXXXX";
        break;
    }
  };

  return (
    <Layout>
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 shadow-lg">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-balance">How can we help you?</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Find answers, get support, and learn how to make the most of Commerzio
          </p>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles, FAQs, or topics..."
                className="pl-12 h-14 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {quickLinks.map((item) => (
            <Card
              key={item.label}
              className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border"
            >
              <CardContent className="p-6">
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}
                >
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{item.label}</h3>
                <p className="text-sm text-muted-foreground">{item.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="faq" className="mb-12">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="faq">FAQs</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          {/* FAQs Tab */}
          <TabsContent value="faq">
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

              {filteredFaqs.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No FAQs match your search. Try different keywords.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFaqs.map((section) => (
                  <Card key={section.category} className="border-border">
                    <CardHeader>
                      <CardTitle className="text-xl">{section.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {section.questions.map((item, idx) => (
                        <div key={idx} className="pb-4 border-b last:border-0 last:pb-0">
                          <h4 className="font-semibold mb-2 flex items-start gap-2">
                            <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            {item.q}
                          </h4>
                          <p className="text-sm text-muted-foreground ml-7">{item.a}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Step-by-Step Guides</h2>

              <div className="grid md:grid-cols-2 gap-6">
                {guides.map((guide) => (
                  <Card
                    key={guide.title}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-border"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent shadow-md group-hover:scale-110 transition-transform duration-300">
                          <guide.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="mb-2">
                            {guide.badge}
                          </Badge>
                          <h3 className="font-semibold mb-2">{guide.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{guide.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {guide.duration}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {contactOptions.map((contact) => (
                  <Card key={contact.title} className="border-border hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-md">
                        <contact.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold mb-2">{contact.title}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{contact.description}</p>
                      <p className="text-xs text-muted-foreground mb-4">{contact.available}</p>
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                        onClick={() => handleContactAction(contact.action)}
                      >
                        {contact.action}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-border">
                <CardHeader>
                  <CardTitle>Send us a message</CardTitle>
                  <CardDescription>Fill out the form below and we'll get back to you within 24 hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          placeholder="Your full name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        placeholder="What do you need help with?"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Textarea
                        placeholder="Describe your issue or question in detail..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Submit Message"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Still Need Help */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                onClick={() => handleContactAction("Start Chat")}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Start Live Chat
              </Button>
              <Button variant="outline" asChild>
                <Link href="/service-requests">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  File a Dispute
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </Layout>
  );
}
