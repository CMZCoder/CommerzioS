import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Send, Search, MoreVertical, Phone, Video, ArrowLeft, Check, CheckCheck, Image, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

export default function Redesign4Chat() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: messages } = useQuery<any[]>({
    queryKey: [`/api/conversations/${selectedConversation?.id}/messages`],
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000,
  });

  const { data: currentUser } = useQuery<any>({ queryKey: ["/api/user"] });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, { content: text });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${selectedConversation?.id}/messages`] });
      setMessage("");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = conversations?.filter((c) =>
    c.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (message.trim() && selectedConversation) {
      sendMutation.mutate(message.trim());
    }
  };

  const ConversationList = () => (
    <div className="h-full flex flex-col bg-white border-r border-stone-200">
      <div className="p-4 border-b border-stone-100">
        <h2 className="text-lg text-stone-900 mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 stroke-[1.5]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-10 h-10 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-stone-100 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 w-1/2 mb-2" />
                  <div className="h-3 bg-stone-100 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations?.length ? (
          <div>
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-stone-100 ${
                  selectedConversation?.id === conv.id ? "bg-stone-50" : "hover:bg-stone-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conv.participant?.avatarUrl} />
                    <AvatarFallback className="bg-stone-100 text-stone-600">{conv.participant?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  {conv.participant?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm text-stone-900 truncate">{conv.participant?.name || "User"}</h3>
                    <span className="text-xs text-stone-400">{new Date(conv.lastMessageAt || conv.updatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm text-stone-500 truncate">{conv.lastMessage || "Start a conversation"}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-stone-900 text-white text-xs flex items-center justify-center rounded-full">{conv.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-stone-500">No conversations yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const MessageView = () => (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-stone-200 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden rounded-none" onClick={() => setSelectedConversation(null)}>
          <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={selectedConversation?.participant?.avatarUrl} />
          <AvatarFallback className="bg-stone-100 text-stone-600">{selectedConversation?.participant?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-sm text-stone-900">{selectedConversation?.participant?.name || "User"}</h3>
          <p className="text-xs text-stone-500">{selectedConversation?.participant?.isOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100">
            <Phone className="w-4 h-4 stroke-[1.5]" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100">
            <Video className="w-4 h-4 stroke-[1.5]" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100">
            <MoreVertical className="w-4 h-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages?.map((msg, i) => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] ${isOwn ? "order-2" : ""}`}>
                  <div className={`px-4 py-3 ${isOwn ? "bg-stone-900 text-white" : "bg-white border border-stone-200 text-stone-900"}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                    <span className="text-xs text-stone-400">{new Date(msg.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                    {isOwn && (msg.read ? <CheckCheck className="w-3 h-3 text-stone-400" /> : <Check className="w-3 h-3 text-stone-400" />)}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-white border-t border-stone-200">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100 shrink-0">
            <Paperclip className="w-4 h-4 stroke-[1.5]" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-none hover:bg-stone-100 shrink-0">
            <Image className="w-4 h-4 stroke-[1.5]" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-10 bg-stone-50 border-0 text-stone-900 placeholder:text-stone-400 focus:ring-1 focus:ring-stone-900 rounded-none"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          />
          <Button onClick={handleSend} disabled={!message.trim()} className="bg-stone-900 hover:bg-stone-800 text-white rounded-none h-10 px-6">
            <Send className="w-4 h-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="h-full flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-stone-100 flex items-center justify-center">
          <Send className="w-6 h-6 text-stone-400 stroke-[1.5]" />
        </div>
        <h3 className="text-lg text-stone-900 mb-2">Your messages</h3>
        <p className="text-stone-500 text-sm">Select a conversation to start messaging</p>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-stone-200 max-w-6xl mx-auto">
      {/* Conversation List - Desktop or when no conversation selected on mobile */}
      <div className={`w-full md:w-80 shrink-0 ${selectedConversation ? "hidden md:block" : ""}`}>
        <ConversationList />
      </div>

      {/* Message View */}
      <div className={`flex-1 ${!selectedConversation ? "hidden md:block" : ""}`}>
        {selectedConversation ? <MessageView /> : <EmptyState />}
      </div>
    </div>
  );
}
