import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import {
  Search,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  MessageSquare,
  Calendar,
  User,
  Shield,
  ArrowRight,
  Info,
  Plus,
} from "lucide-react"

export default function DisputesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dispute Resolution Center</h1>
            <p className="text-muted-foreground">Manage and resolve disputes with our fair mediation process</p>
          </div>
          <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
            <Link href="/disputes/new">
              <Plus className="mr-2 h-4 w-4" />
              File New Dispute
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search disputes by booking ID or description..." className="pl-10" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Disputes", value: "2", icon: AlertTriangle, color: "from-orange-500 to-red-500" },
            { label: "Under Review", value: "1", icon: Clock, color: "from-blue-500 to-cyan-500" },
            { label: "Resolved", value: "5", icon: CheckCircle2, color: "from-green-500 to-emerald-500" },
            { label: "Total Filed", value: "8", icon: FileText, color: "from-purple-500 to-pink-500" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-3xl font-bold">{stat.value}</span>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="active" className="mb-8">
          <TabsList className="grid w-full max-w-lg grid-cols-4 mb-6">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="review">Under Review</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          {/* Active Disputes */}
          <TabsContent value="active">
            <div className="space-y-4">
              {[
                {
                  id: "DSP-2024-001",
                  title: "Service not completed as agreed",
                  booking: "Kitchen Renovation - BKG-2024-456",
                  vendor: "Premium Renovations GmbH",
                  amount: "CHF 2,850.00",
                  status: "pending_response",
                  statusLabel: "Awaiting Vendor Response",
                  filed: "2 days ago",
                  lastUpdate: "1 day ago",
                  description: "The vendor did not complete the agreed countertop installation.",
                  messages: 3,
                },
                {
                  id: "DSP-2024-003",
                  title: "Charged incorrect amount",
                  booking: "House Cleaning - BKG-2024-789",
                  vendor: "SparkleClean Services",
                  amount: "CHF 180.00",
                  status: "customer_action",
                  statusLabel: "Action Required",
                  filed: "5 days ago",
                  lastUpdate: "3 hours ago",
                  description: "Was charged for 3 hours instead of agreed 2 hours.",
                  messages: 7,
                },
              ].map((dispute) => (
                <Card key={dispute.id} className="border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">
                            {dispute.id}
                          </Badge>
                          <Badge
                            variant={dispute.status === "customer_action" ? "default" : "secondary"}
                            className={
                              dispute.status === "customer_action" ? "bg-gradient-to-r from-orange-500 to-red-500" : ""
                            }
                          >
                            {dispute.statusLabel}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl">{dispute.title}</CardTitle>
                        <CardDescription className="flex flex-col gap-1">
                          <span className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            {dispute.booking}
                          </span>
                          <span className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            {dispute.vendor}
                          </span>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{dispute.amount}</div>
                        <div className="text-xs text-muted-foreground">Disputed Amount</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{dispute.description}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Filed {dispute.filed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated {dispute.lastUpdate}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {dispute.messages} messages
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90" asChild>
                        <Link href={`/disputes/${dispute.id}`}>
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Under Review */}
          <TabsContent value="review">
            <Card className="border-border">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Dispute Under Admin Review</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Our support team is currently reviewing your dispute. You'll be notified once a decision is made.
                </p>
                <div className="space-y-4">
                  {[
                    {
                      id: "DSP-2024-002",
                      title: "Quality of work below standard",
                      booking: "Plumbing Repair - BKG-2024-567",
                      status: "Under admin review since 3 days",
                    },
                  ].map((dispute) => (
                    <Card key={dispute.id} className="border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="font-semibold mb-1">{dispute.title}</div>
                            <div className="text-sm text-muted-foreground">{dispute.booking}</div>
                            <Badge variant="secondary" className="mt-2">
                              {dispute.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground animate-pulse" />
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/disputes/${dispute.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resolved */}
          <TabsContent value="resolved">
            <div className="space-y-4">
              {[
                {
                  id: "DSP-2023-099",
                  title: "Late arrival and incomplete service",
                  resolution: "Partial refund of CHF 75.00 issued",
                  outcome: "favor_customer",
                  resolved: "15 days ago",
                },
                {
                  id: "DSP-2023-098",
                  title: "Customer cancelled last minute",
                  resolution: "Cancellation fee waived, both parties satisfied",
                  outcome: "mutual",
                  resolved: "1 month ago",
                },
                {
                  id: "DSP-2023-095",
                  title: "Material quality concerns",
                  resolution: "Vendor agreed to redo work with premium materials",
                  outcome: "mutual",
                  resolved: "2 months ago",
                },
              ].map((dispute) => (
                <Card key={dispute.id} className="border-border opacity-80">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="font-mono">
                            {dispute.id}
                          </Badge>
                          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{dispute.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{dispute.resolution}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Resolved {dispute.resolved}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/disputes/${dispute.id}`}>View Details</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* All Disputes */}
          <TabsContent value="all">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Showing all disputes across all statuses. Use the tabs above to filter.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* How It Works */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              How Dispute Resolution Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "File a Dispute",
                  description: "Describe the issue and provide evidence. Both parties will be notified.",
                },
                {
                  step: "2",
                  title: "Mediation Period",
                  description: "Both parties have 5 days to respond and try to reach an agreement.",
                },
                {
                  step: "3",
                  title: "Admin Review",
                  description: "If unresolved, our team reviews evidence and makes a fair decision within 3 days.",
                },
              ].map((step) => (
                <div key={step.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent text-white font-bold text-lg mb-3 shadow-md">
                    {step.step}
                  </div>
                  <h4 className="font-semibold mb-2">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
