import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Send, Search, MoreVertical, Phone, Video, Info, Paperclip,
  Image, Smile, ArrowLeft, Check, CheckCheck, Clock, User, Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function UI2Chat() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const vendorId = searchParams.get("vendor");
  const serviceId = searchParams.get("service");
  
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: conversations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/chat/conversations"],
    enabled: !!user,
  });

  const { data: messages } = useQuery<any[]>({
    queryKey: [`/api/chat/conversations/${selectedChat}/messages`],
    enabled: !!selectedChat,
    refetchInterval: 5000, // Poll every 5 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/chat/conversations/${selectedChat}/messages`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedChat}/messages`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setMessageInput("");
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle initial vendor/service params
  useEffect(() => {
    if (vendorId && conversations) {
      const existingChat = conversations.find(c => 
        c.participants?.some((p: any) => p.id === Number(vendorId))
      );
      if (existingChat) {
        setSelectedChat(existingChat.id);
      }
    }
  }, [vendorId, conversations]);

  const filteredConversations = conversations?.filter(c => {
    if (!searchQuery) return true;
    const otherParticipant = c.participants?.find((p: any) => p.id !== user?.id);
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = conversations?.find(c => c.id === selectedChat);
  const otherParticipant = selectedConversation?.participants?.find((p: any) => p.id !== user?.id);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChat) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be logged in to view messages.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
      <Card className="h-[calc(100vh-200px)] md:h-[600px] overflow-hidden">
        <div className="flex h-full">
          {/* Conversation List */}
          <div className={`w-full md:w-80 border-r flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
            {/* Header */}
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-slate-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-2" />
                        <div className="h-3 bg-slate-200 rounded w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations?.length ? (
                <div className="divide-y">
                  {filteredConversations.map((conv) => {
                    const other = conv.participants?.find((p: any) => p.id !== user?.id);
                    const lastMessage = conv.lastMessage;
                    const isSelected = selectedChat === conv.id;
                    const hasUnread = conv.unreadCount > 0;

                    return (
                      <button
                        key={conv.id}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                          isSelected ? "bg-violet-50" : ""
                        }`}
                        onClick={() => setSelectedChat(conv.id)}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={other?.profileImage} />
                            <AvatarFallback>{other?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          {hasUnread && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-violet-600 rounded-full text-xs text-white flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold truncate ${hasUnread ? "text-foreground" : ""}`}>
                              {other?.name || "User"}
                            </p>
                            {lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(lastMessage.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className={`text-sm truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                            {lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">No conversations yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start chatting with service providers
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedChat ? "flex" : "hidden md:flex"}`}>
            {selectedChat && otherParticipant ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedChat(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={otherParticipant.profileImage} />
                    <AvatarFallback>{otherParticipant.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{otherParticipant.name}</p>
                    <p className="text-sm text-muted-foreground">Online</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Info className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages?.map((message) => {
                      const isOwn = message.senderId === user?.id;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-slate-100"
                            }`}
                          >
                            <p>{message.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-white/70" : "text-muted-foreground"}`}>
                              <span className="text-xs">
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                message.read ? (
                                  <CheckCheck className="w-4 h-4" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="icon">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      className="flex-1"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Button 
                      type="submit" 
                      size="icon"
                      className="bg-gradient-to-r from-violet-600 to-indigo-600"
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a chat from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
