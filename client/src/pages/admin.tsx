import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, FileText, CreditCard, CheckCircle, XCircle, Trash2, Brain, Send, Loader2, Sparkles, BarChart3, Settings, Eye, EyeOff } from "lucide-react";
import type { User, Service, Plan, SubmittedCategory } from "@shared/schema";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["/api/admin/session"],
    queryFn: () => apiRequest("/api/admin/session"),
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      apiRequest("/api/admin/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: () => {
      setIsLoggedIn(true);
      refetchSession();
      toast({
        title: "Success",
        description: "Logged in as admin",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  if (!session?.isAdmin && !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-6 h-6 text-primary" />
              <CardTitle>Admin Login</CardTitle>
            </div>
            <CardDescription>Enter admin credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate(loginForm);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="admin"
                  data-testid="input-admin-username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="admin"
                  data-testid="input-admin-password"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-admin-login">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">ServeMkt Admin Panel</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                apiRequest("/api/admin/logout", { method: "POST" });
                setIsLoggedIn(false);
                refetchSession();
              }}
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="services" data-testid="tab-services">
              <FileText className="w-4 h-4 mr-2" />
              Services
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <CheckCircle className="w-4 h-4 mr-2" />
              Category Suggestions
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <CreditCard className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" data-testid="tab-ai-assistant">
              <Brain className="w-4 h-4 mr-2" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServicesManagement />
          </TabsContent>

          <TabsContent value="categories">
            <CategorySuggestionsManagement />
          </TabsContent>

          <TabsContent value="plans">
            <PlansManagement />
          </TabsContent>

          <TabsContent value="ai-assistant">
            <AIAssistantManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UsersManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users"),
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    queryFn: () => apiRequest("/api/plans"),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage user accounts, roles, and plans</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.isVerified ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Verified</Badge>
                  ) : (
                    <Badge variant="secondary">Not Verified</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {user.isAdmin ? (
                    <Badge className="bg-primary">Admin</Badge>
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.planId || ""}
                    onValueChange={(planId) => updateUserMutation.mutate({ id: user.id, data: { planId } })}
                  >
                    <SelectTrigger className="w-40" data-testid={`select-plan-${user.id}`}>
                      <SelectValue placeholder="No plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateUserMutation.mutate({
                        id: user.id,
                        data: { isAdmin: !user.isAdmin },
                      })
                    }
                    data-testid={`button-toggle-admin-${user.id}`}
                  >
                    {user.isAdmin ? "Remove Admin" : "Make Admin"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ServicesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
    queryFn: () => apiRequest("/api/admin/services"),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/admin/services/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Management</CardTitle>
        <CardDescription>View and manage all services</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service: any) => (
              <TableRow key={service.id} data-testid={`row-service-${service.id}`}>
                <TableCell className="font-medium">{service.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={service.status === "active" ? "default" : "secondary"}
                  >
                    {service.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  CHF {service.price || "N/A"}
                </TableCell>
                <TableCell>{service.viewCount}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteServiceMutation.mutate(service.id)}
                    data-testid={`button-delete-service-${service.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CategorySuggestionsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<SubmittedCategory[]>({
    queryKey: ["/api/admin/category-suggestions"],
    queryFn: () => apiRequest("/api/admin/category-suggestions"),
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/api/admin/category-suggestions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/category-suggestions"] });
      toast({
        title: "Success",
        description: "Category suggestion updated",
      });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Suggestions</CardTitle>
        <CardDescription>Review and manage user-submitted categories</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions.map((suggestion: any) => (
              <TableRow key={suggestion.id} data-testid={`row-suggestion-${suggestion.id}`}>
                <TableCell className="font-medium">{suggestion.name}</TableCell>
                <TableCell>{suggestion.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      suggestion.status === "approved"
                        ? "default"
                        : suggestion.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {suggestion.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {suggestion.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          updateSuggestionMutation.mutate({
                            id: suggestion.id,
                            status: "approved",
                          })
                        }
                        data-testid={`button-approve-${suggestion.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          updateSuggestionMutation.mutate({
                            id: suggestion.id,
                            status: "rejected",
                          })
                        }
                        data-testid={`button-reject-${suggestion.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PlansManagement() {
  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    queryFn: () => apiRequest("/api/plans"),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan Management</CardTitle>
        <CardDescription>View and manage subscription plans</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price (Monthly)</TableHead>
              <TableHead>Max Images</TableHead>
              <TableHead>Listing Duration</TableHead>
              <TableHead>Features</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>CHF {plan.priceMonthly}</TableCell>
                <TableCell>{plan.maxImages}</TableCell>
                <TableCell>{plan.listingDurationDays} days</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {plan.featuredListing && <Badge variant="secondary">Featured</Badge>}
                    {plan.prioritySupport && <Badge variant="secondary">Priority Support</Badge>}
                    {plan.analyticsAccess && <Badge variant="secondary">Analytics</Badge>}
                    {plan.customBranding && <Badge variant="secondary">Branding</Badge>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function AIAssistantManagement() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users"),
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/admin/services"],
    queryFn: () => apiRequest("/api/admin/services"),
  });

  const { data: categories = [] } = useQuery<SubmittedCategory[]>({
    queryKey: ["/api/admin/category-suggestions"],
    queryFn: () => apiRequest("/api/admin/category-suggestions"),
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    queryFn: () => apiRequest("/api/plans"),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const platformStats = {
    totalUsers: users.length,
    totalServices: services.length,
    activeServices: services.filter((s: any) => s.status === "active").length,
    pendingCategories: categories.filter((c: any) => c.status === "pending").length,
    totalPlans: plans.length,
  };

  const handleSendMessage = async (queryText?: string) => {
    const messageText = queryText || input.trim();
    if (!messageText || isTyping) return;

    if (!queryText) {
      setInput("");
    }

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: messageText },
    ];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await apiRequest<{ response: string }>("/api/ai/admin-assist", {
        method: "POST",
        body: JSON.stringify({
          query: messageText,
          context: {
            platformStats,
            currentPage: "admin",
          },
          conversationHistory: messages,
        }),
      });

      setMessages([
        ...newMessages,
        { role: "assistant", content: response.response },
      ]);
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to get AI response",
        variant: "destructive",
      });

      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyzePlatform = () => {
    const analysisQuery = `Please analyze the current platform data and provide insights. Here's what I can see: ${platformStats.totalUsers} total users, ${platformStats.activeServices} active services out of ${platformStats.totalServices} total, and ${platformStats.pendingCategories} pending category suggestions. What patterns, issues, or opportunities should I be aware of?`;
    handleSendMessage(analysisQuery);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card data-testid="card-stat-users">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {platformStats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-services">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-services">
              {platformStats.totalServices}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-active-services">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-services">
              {platformStats.activeServices}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-pending-categories">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-pending-categories">
              {platformStats.pendingCategories}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-plans">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-plans">
              {platformStats.totalPlans}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Admin Assistant
              </CardTitle>
              <CardDescription>
                Get AI-powered insights and assistance for platform management
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={handleAnalyzePlatform}
              disabled={isTyping}
              data-testid="button-analyze-platform"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Platform Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages Area */}
          <ScrollArea className="h-[400px] border rounded-md p-4" data-testid="area-chat-messages">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12" data-testid="text-welcome-admin">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium">Welcome to AI Admin Assistant</p>
                  <p className="mt-2 text-sm">
                    Ask questions about your platform, request insights, or click "Analyze Platform Data" for automated analysis.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                  data-testid={`message-${message.role}-${index}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start" data-testid="indicator-typing-admin">
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about your platform..."
                disabled={isTyping}
                className="flex-1"
                data-testid="input-admin-message"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isTyping}
                data-testid="button-send-admin-message"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1" data-testid="text-ai-powered-admin">
                <Sparkles className="h-3 w-3" />
                <span>Powered by AI</span>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="hover:text-foreground transition-colors"
                  data-testid="button-clear-admin-chat"
                >
                  Clear conversation
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingApiKeys, setIsSavingApiKeys] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    twilioSid: false,
    twilioToken: false,
    emailKey: false,
  });

  const [apiKeys, setApiKeys] = useState({
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    emailServiceProvider: "",
    emailServiceApiKey: "",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("/api/settings"),
  });

  const { data: envStatus } = useQuery({
    queryKey: ["/api/admin/env-status"],
    queryFn: () => apiRequest("/api/admin/env-status"),
  });

  const [localSettings, setLocalSettings] = useState({
    requireEmailVerification: false,
    requirePhoneVerification: false,
    enableSwissAddressValidation: true,
    enableAiCategoryValidation: true,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        requireEmailVerification: settings.requireEmailVerification ?? false,
        requirePhoneVerification: settings.requirePhoneVerification ?? false,
        enableSwissAddressValidation: settings.enableSwissAddressValidation ?? true,
        enableAiCategoryValidation: settings.enableAiCategoryValidation ?? true,
      });
    }
  }, [settings]);

  const handleSaveVerificationSettings = async () => {
    setIsSavingSettings(true);
    try {
      await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(localSettings),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Verification settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsSavingApiKeys(true);
    try {
      const envVars: Record<string, string> = {};
      
      if (apiKeys.twilioAccountSid) envVars.TWILIO_ACCOUNT_SID = apiKeys.twilioAccountSid;
      if (apiKeys.twilioAuthToken) envVars.TWILIO_AUTH_TOKEN = apiKeys.twilioAuthToken;
      if (apiKeys.twilioPhoneNumber) envVars.TWILIO_PHONE_NUMBER = apiKeys.twilioPhoneNumber;
      if (apiKeys.emailServiceProvider) envVars.EMAIL_SERVICE_PROVIDER = apiKeys.emailServiceProvider;
      if (apiKeys.emailServiceApiKey) envVars.EMAIL_SERVICE_API_KEY = apiKeys.emailServiceApiKey;

      if (Object.keys(envVars).length === 0) {
        toast({
          title: "Warning",
          description: "No API keys to save. Please enter at least one value.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Info",
        description: "Setting environment variables...",
      });

      setApiKeys({
        twilioAccountSid: "",
        twilioAuthToken: "",
        twilioPhoneNumber: "",
        emailServiceProvider: "",
        emailServiceApiKey: "",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/admin/env-status"] });
      
      toast({
        title: "Success",
        description: "API keys saved successfully. Please note: Environment variables must be set in your Replit environment for persistence.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setIsSavingApiKeys(false);
    }
  };

  const isConfigured = (service: string) => {
    if (!envStatus) return false;
    if (service === "twilio") return envStatus.twilioConfigured;
    if (service === "email") return envStatus.emailConfigured;
    return false;
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Alert data-testid="alert-settings-info">
        <AlertDescription>
          These settings control verification requirements for the platform. For MVP/testing, you can disable verification even without configuring API keys.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Verification Settings</CardTitle>
          <CardDescription>
            Configure verification requirements for users and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between" data-testid="setting-email-verification">
              <div className="space-y-0.5">
                <Label htmlFor="require-email">Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify their email address before posting services
                </p>
              </div>
              <Switch
                id="require-email"
                checked={localSettings.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, requireEmailVerification: checked })
                }
                data-testid="switch-email-verification"
              />
            </div>

            <div className="flex items-center justify-between" data-testid="setting-phone-verification">
              <div className="space-y-0.5">
                <Label htmlFor="require-phone">Require Phone Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Services must have verified phone numbers (requires Twilio configuration)
                </p>
              </div>
              <Switch
                id="require-phone"
                checked={localSettings.requirePhoneVerification}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, requirePhoneVerification: checked })
                }
                data-testid="switch-phone-verification"
              />
            </div>

            <div className="flex items-center justify-between" data-testid="setting-swiss-validation">
              <div className="space-y-0.5">
                <Label htmlFor="swiss-address">Enable Swiss Address Validation</Label>
                <p className="text-sm text-muted-foreground">
                  Validate that service locations are valid Swiss addresses
                </p>
              </div>
              <Switch
                id="swiss-address"
                checked={localSettings.enableSwissAddressValidation}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, enableSwissAddressValidation: checked })
                }
                data-testid="switch-swiss-validation"
              />
            </div>

            <div className="flex items-center justify-between" data-testid="setting-ai-validation">
              <div className="space-y-0.5">
                <Label htmlFor="ai-category">Enable AI Category Validation</Label>
                <p className="text-sm text-muted-foreground">
                  Use AI to validate and suggest category improvements (requires OpenAI API key)
                </p>
              </div>
              <Switch
                id="ai-category"
                checked={localSettings.enableAiCategoryValidation}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, enableAiCategoryValidation: checked })
                }
                data-testid="switch-ai-validation"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveVerificationSettings}
              disabled={isSavingSettings}
              data-testid="button-save-verification-settings"
            >
              {isSavingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Verification Settings"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Configure API keys for third-party services (stored as environment variables)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert data-testid="alert-api-keys-info">
            <AlertDescription>
              API keys are stored as environment variables for security. Enter values below and click Save to configure. Leave fields empty to keep existing values.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Twilio Configuration
                <Badge variant={isConfigured("twilio") ? "default" : "secondary"} data-testid="badge-twilio-status">
                  {isConfigured("twilio") ? "✓ Configured" : "✗ Not Configured"}
                </Badge>
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="twilio-sid">Account SID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="twilio-sid"
                      type={showApiKeys.twilioSid ? "text" : "password"}
                      value={apiKeys.twilioAccountSid}
                      onChange={(e) => setApiKeys({ ...apiKeys, twilioAccountSid: e.target.value })}
                      placeholder="Enter Twilio Account SID"
                      data-testid="input-twilio-sid"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKeys({ ...showApiKeys, twilioSid: !showApiKeys.twilioSid })}
                      data-testid="button-toggle-twilio-sid"
                    >
                      {showApiKeys.twilioSid ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="twilio-token">Auth Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="twilio-token"
                      type={showApiKeys.twilioToken ? "text" : "password"}
                      value={apiKeys.twilioAuthToken}
                      onChange={(e) => setApiKeys({ ...apiKeys, twilioAuthToken: e.target.value })}
                      placeholder="Enter Twilio Auth Token"
                      data-testid="input-twilio-token"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKeys({ ...showApiKeys, twilioToken: !showApiKeys.twilioToken })}
                      data-testid="button-toggle-twilio-token"
                    >
                      {showApiKeys.twilioToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="twilio-phone">Phone Number</Label>
                  <Input
                    id="twilio-phone"
                    type="text"
                    value={apiKeys.twilioPhoneNumber}
                    onChange={(e) => setApiKeys({ ...apiKeys, twilioPhoneNumber: e.target.value })}
                    placeholder="+41 XX XXX XX XX"
                    data-testid="input-twilio-phone"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                Email Service Configuration
                <Badge variant={isConfigured("email") ? "default" : "secondary"} data-testid="badge-email-status">
                  {isConfigured("email") ? "✓ Configured" : "✗ Not Configured"}
                </Badge>
              </h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email-provider">Email Service Provider</Label>
                  <Select
                    value={apiKeys.emailServiceProvider}
                    onValueChange={(value) => setApiKeys({ ...apiKeys, emailServiceProvider: value })}
                  >
                    <SelectTrigger id="email-provider" data-testid="select-email-provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">AWS SES</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email-api-key">API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email-api-key"
                      type={showApiKeys.emailKey ? "text" : "password"}
                      value={apiKeys.emailServiceApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, emailServiceApiKey: e.target.value })}
                      placeholder="Enter Email Service API Key"
                      data-testid="input-email-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKeys({ ...showApiKeys, emailKey: !showApiKeys.emailKey })}
                      data-testid="button-toggle-email-key"
                    >
                      {showApiKeys.emailKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveApiKeys}
              disabled={isSavingApiKeys}
              data-testid="button-save-api-keys"
            >
              {isSavingApiKeys ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Keys"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
