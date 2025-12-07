import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { type PageContext } from "@/hooks/use-page-context";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface FloatingChatWidgetProps {
  pageContext?: PageContext;
}

const STORAGE_KEY = "servemkt-chat-history";
const PROACTIVE_DELAY = 2000; // Show help after 2 seconds
const STUCK_DELAY = 30000; // Offer help after 30 seconds of inactivity

export function FloatingChatWidget({ pageContext }: FloatingChatWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProactiveBadge, setShowProactiveBadge] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const [contextualGreeting, setContextualGreeting] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const proactiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stuckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load conversation from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse stored messages:", e);
      }
    }
  }, []);

  // Save conversation to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Generate contextual greeting based on page context
  const generateContextualGreeting = (context: PageContext): string => {
    if (context.currentAction === "creating_service") {
      const { formData } = context;
      if (!formData.hasTitle && !formData.hasDescription) {
        return "I see you're creating a service! Need help getting started with a title or description?";
      } else if (formData.hasTitle && !formData.hasDescription) {
        return "Great title! Need help writing a compelling description for your service?";
      } else if (formData.hasImages && formData.imageCount && formData.imageCount > 0 && !formData.hasTitle) {
        return `I see you've uploaded ${formData.imageCount} image${formData.imageCount > 1 ? 's' : ''}! Need help creating a title based on your images?`;
      } else if (!formData.hasPrice) {
        return "Need help determining the right pricing for your service?";
      } else if (!formData.hasLocation) {
        return "Don't forget to add service locations! Need suggestions for Swiss cities?";
      }
      return "I'm here to help you create an amazing service listing! What do you need assistance with?";
    } else if (context.currentAction === "editing_service") {
      return "Need help improving your service listing? I can assist with descriptions, pricing, and more!";
    } else if (context.currentAction === "viewing_service") {
      return "Looking at a service? I can help you understand how to contact the provider or leave a review!";
    } else if (context.currentAction === "browsing") {
      return "Browsing services? I can help you find the perfect match or filter by category!";
    }
    return "Hi! How can I help you today?";
  };

  // Proactive assistance when modal opens
  // Extract specific values to avoid unnecessary re-renders when pageContext changes
  const currentAction = pageContext?.currentAction;
  const lastInteraction = pageContext?.metadata.lastInteraction;
  
  useEffect(() => {
    if (!pageContext) return;

    // Clear existing timeouts
    if (proactiveTimeoutRef.current) {
      clearTimeout(proactiveTimeoutRef.current);
    }
    if (stuckTimeoutRef.current) {
      clearTimeout(stuckTimeoutRef.current);
    }

    // Show proactive badge when creating/editing service
    if (currentAction === "creating_service" || currentAction === "editing_service") {
      // Show badge after a short delay
      proactiveTimeoutRef.current = setTimeout(() => {
        setShowProactiveBadge(true);
        setShowPulse(true);
        setContextualGreeting(generateContextualGreeting(pageContext));
      }, PROACTIVE_DELAY);

      // Check if user is stuck (no interaction for 30 seconds)
      const timeSinceLastInteraction = lastInteraction 
        ? Date.now() - lastInteraction 
        : 0;

      if (timeSinceLastInteraction < STUCK_DELAY) {
        stuckTimeoutRef.current = setTimeout(() => {
          if (!isOpen) {
            setShowPulse(true);
            setShowProactiveBadge(true);
          }
        }, STUCK_DELAY - timeSinceLastInteraction);
      }
    } else {
      setShowProactiveBadge(false);
      setShowPulse(false);
      setContextualGreeting(null);
    }

    return () => {
      if (proactiveTimeoutRef.current) {
        clearTimeout(proactiveTimeoutRef.current);
      }
      if (stuckTimeoutRef.current) {
        clearTimeout(stuckTimeoutRef.current);
      }
    };
  }, [currentAction, isOpen, lastInteraction, pageContext]);

  // Auto-expand chat with contextual greeting when clicking while badge is shown
  const handleOpenChat = () => {
    setIsOpen(true);
    setShowPulse(false);

    // Add contextual greeting as first message if available and no messages exist
    if (contextualGreeting && messages.length === 0) {
      setMessages([{ role: "assistant", content: contextualGreeting }]);
    }

    // Auto-hide badge after opening
    setTimeout(() => {
      setShowProactiveBadge(false);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    // Add user message to chat
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      // Prepare user context
      const userContext = {
        isAuthenticated,
        hasServices: undefined, // Will be populated by backend if authenticated
        plan: user?.plan?.name,
      };

      // Call AI support API with page context
      const response = await apiRequest<{ response: string }>("/api/ai/user-support", {
        method: "POST",
        body: JSON.stringify({
          query: userMessage,
          userContext,
          pageContext: pageContext ? {
            currentPage: pageContext.currentPage,
            currentAction: pageContext.currentAction,
            formData: pageContext.formData,
          } : undefined,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      // Add AI response to chat
      setMessages([
        ...newMessages,
        { role: "assistant", content: response.response },
      ]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to get response. Please try again.");
      
      // Add error message to chat
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "I'm sorry, I'm having trouble responding right now. Please try again or contact support if the issue persists.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  return (
    <>
      {/* Pulse animation CSS */}
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.9);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(0.9);
            opacity: 1;
          }
        }
        
        .pulse-animation {
          animation: pulse-ring 2s ease-in-out infinite;
        }

        .badge-bounce {
          animation: bounce 2s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>

      {/* Floating chat button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative">
            {/* Proactive badge */}
            {showProactiveBadge && (
              <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg badge-bounce flex items-center gap-1" data-testid="badge-proactive-help">
                <Lightbulb className="w-3 h-3" />
                <span>Tip</span>
              </div>
            )}
            
            {/* Pulse effect */}
            {showPulse && (
              <div className="absolute inset-0 rounded-full bg-blue-600 opacity-75 pulse-animation" />
            )}
            
            {/* Chat button */}
            <Button
              onClick={handleOpenChat}
              className={`h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-110 relative ${showPulse ? 'animate-pulse' : ''}`}
              data-testid="button-open-chat"
              aria-label="Open chat support"
            >
              <MessageCircle className="h-6 w-6 text-white" />
            </Button>
          </div>
        )}

        {/* Chat panel */}
        {isOpen && (
          <Card
            className="w-[350px] h-[500px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-300"
            data-testid="panel-chat"
          >
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <CardTitle className="text-lg font-semibold" data-testid="text-chat-title">
                Commerzio Support
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
                aria-label="Close chat"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            {/* Messages area */}
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && !contextualGreeting && (
                    <div className="text-center text-muted-foreground text-sm py-8" data-testid="text-welcome">
                      <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p>Hi! How can I help you today?</p>
                      <p className="mt-1 text-xs">Ask me anything about Commerzio Services!</p>
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
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start" data-testid="indicator-typing">
                      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="text-center text-red-500 text-xs" data-testid="text-error">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input area */}
              <div className="border-t p-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isTyping}
                    className="flex-1"
                    data-testid="input-message"
                    aria-label="Type your message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    data-testid="button-send-message"
                    aria-label="Send message"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Footer with AI indicator and clear button */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1" data-testid="text-ai-powered">
                    <Sparkles className="h-3 w-3" />
                    <span>Powered by AI</span>
                  </div>
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearChat}
                      className="hover:text-foreground transition-colors"
                      data-testid="button-clear-chat"
                      aria-label="Clear chat history"
                    >
                      Clear chat
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
