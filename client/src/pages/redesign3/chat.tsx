import { useState, useEffect, useRef } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle, Send, Search, MoreVertical, Phone, Video, ArrowLeft, Image, Paperclip, Smile, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/api";

export default function Redesign3Chat() {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery<any>({ queryKey: ["/api/auth/user"] });
  const { data: conversations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });
  const { data: messages } = useQuery<any[]>({
    queryKey: [`/api/conversations/${selectedConversation?.id}/messages`],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest(`/api/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation?.id}/messages`] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (message.trim() && selectedConversation) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const filteredConversations = conversations?.filter(c =>
    c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <MessageCircle className="w-16 h-16 mx-auto text-gray-700 mb-4" />
        <h1 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h1>
        <p className="text-gray-500 font-mono mb-4">// Authentication required</p>
        <Link href="/login">
          <Button className="bg-cyan-400 text-black hover:bg-cyan-300 font-bold tracking-wider">LOGIN</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">MESSAGES</h1>
          <p className="text-gray-500 font-mono text-sm">// Secure communication channel</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-0 h-[600px] border border-cyan-500/30 bg-black overflow-hidden">
        {/* Conversations List */}
        <div className={`border-r border-gray-800 flex flex-col ${selectedConversation ? "hidden md:flex" : ""}`}>
          {/* Search */}
          <div className="p-3 border-b border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="// Search..."
                className="pl-10 bg-black border-gray-800 text-white placeholder:text-gray-600 focus:border-cyan-400 font-mono text-sm"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-900 animate-pulse" />)}
              </div>
            ) : filteredConversations?.length ? (
              <div>
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-l-2 cursor-pointer transition-all ${
                      selectedConversation?.id === conv.id
                        ? "bg-cyan-400/10 border-cyan-400"
                        : "border-transparent hover:bg-gray-900 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center">
                          {conv.otherUser?.profileImage ? (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={conv.otherUser.profileImage} />
                            </Avatar>
                          ) : (
                            <span className="text-cyan-400 font-bold text-sm">{conv.otherUser?.name?.[0] || "?"}</span>
                          )}
                        </div>
                        {conv.otherUser?.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-cyan-400 border-2 border-black shadow-[0_0_5px_#22d3ee]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">{conv.otherUser?.name || "Unknown"}</span>
                          <span className="text-[10px] text-gray-600 font-mono">{new Date(conv.lastMessage?.createdAt || conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate font-mono">{conv.lastMessage?.content || "No messages"}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-cyan-400 text-black font-bold text-[10px] min-w-5 h-5 flex items-center justify-center">{conv.unreadCount}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-700 mb-3" />
                <p className="text-gray-500 font-mono text-sm">// No conversations</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`md:col-span-2 flex flex-col ${!selectedConversation ? "hidden md:flex" : ""}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)} className="md:hidden text-gray-500 hover:text-cyan-400">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div className="w-10 h-10 border border-cyan-500/50 flex items-center justify-center">
                    {selectedConversation.otherUser?.profileImage ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={selectedConversation.otherUser.profileImage} />
                      </Avatar>
                    ) : (
                      <span className="text-cyan-400 font-bold">{selectedConversation.otherUser?.name?.[0] || "?"}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{selectedConversation.otherUser?.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500 font-mono">
                      {selectedConversation.otherUser?.isOnline ? (
                        <span className="text-cyan-400">● ONLINE</span>
                      ) : (
                        "OFFLINE"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cyan-400 hover:bg-cyan-400/10">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white hover:bg-gray-800">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages?.map((msg, i) => {
                    const isOwn = msg.senderId === user.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? "order-2" : ""}`}>
                          <div className={`p-3 ${
                            isOwn
                              ? "bg-cyan-400 text-black"
                              : "bg-gray-900 border border-gray-800 text-white"
                          }`}>
                            <p className="text-sm font-mono">{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-600 font-mono ${isOwn ? "justify-end" : ""}`}>
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cyan-400 shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cyan-400 shrink-0">
                    <Image className="w-5 h-5" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="// Type message..."
                    className="flex-1 bg-black border-gray-800 text-white placeholder:text-gray-600 focus:border-cyan-400 font-mono"
                  />
                  <Button variant="ghost" size="icon" className="text-gray-500 hover:text-cyan-400 shrink-0">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleSend} disabled={!message.trim()} className="bg-cyan-400 hover:bg-cyan-300 text-black shrink-0">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 border-2 border-cyan-500/30 mx-auto mb-4 flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-gray-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">SELECT A CONVERSATION</h3>
                <p className="text-gray-500 font-mono text-sm">// Choose from existing chats or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
