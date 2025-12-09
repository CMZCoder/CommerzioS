import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, Search, MoreVertical, Phone, Video, ArrowLeft, Check, CheckCheck, Image, Paperclip, Smile, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";

export default function Redesign5Chat() {
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
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-white">
      <div className="p-4 border-b border-amber-100">
        <h2 className="text-xl font-bold text-amber-900 mb-4">Messages</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="pl-11 h-11 bg-white border-amber-200 rounded-2xl text-amber-900 placeholder:text-amber-400 focus-visible:ring-amber-300"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 bg-amber-100 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-amber-100 w-1/2 rounded-full mb-2" />
                  <div className="h-3 bg-amber-100 w-3/4 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations?.length ? (
          <div className="p-2">
            {filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-3 flex items-center gap-3 text-left rounded-2xl transition-all mb-1 ${
                  selectedConversation?.id === conv.id ? "bg-gradient-to-r from-amber-100 to-orange-100" : "hover:bg-amber-50"
                }`}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12 ring-2 ring-white shadow-md">
                    <AvatarImage src={conv.participant?.avatarUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{conv.participant?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  {conv.participant?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-amber-900 truncate">{conv.participant?.name || "User"}</h3>
                    <span className="text-xs text-amber-600/60">{new Date(conv.lastMessageAt || conv.updatedAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-sm text-amber-700/70 truncate">{conv.lastMessage || "Start a conversation"}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow-md">{conv.unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-amber-600/60">No conversations yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const MessageView = () => (
    <div className="h-full flex flex-col bg-gradient-to-b from-orange-50/50 to-amber-50/30">
      {/* Header */}
      <div className="p-4 bg-white/80 backdrop-blur border-b border-amber-100 flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-amber-50" onClick={() => setSelectedConversation(null)}>
          <ArrowLeft className="w-5 h-5 text-amber-900" />
        </Button>
        <Avatar className="w-11 h-11 ring-2 ring-amber-100">
          <AvatarImage src={selectedConversation?.participant?.avatarUrl} />
          <AvatarFallback className="bg-gradient-to-br from-amber-200 to-orange-200 text-amber-700">{selectedConversation?.participant?.name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900">{selectedConversation?.participant?.name || "User"}</h3>
          <p className="text-xs text-amber-600/60">{selectedConversation?.participant?.isOnline ? "Online" : "Offline"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50">
            <Phone className="w-5 h-5 text-amber-700" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50">
            <Video className="w-5 h-5 text-amber-700" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50">
            <MoreVertical className="w-5 h-5 text-amber-700" />
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
                  <div className={`px-4 py-3 rounded-3xl ${isOwn ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-lg" : "bg-white text-amber-900 shadow-sm rounded-bl-lg"}`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <div className={`flex items-center gap-1 mt-1.5 px-1 ${isOwn ? "justify-end" : ""}`}>
                    <span className="text-xs text-amber-600/50">{new Date(msg.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                    {isOwn && (msg.read ? <CheckCheck className="w-3.5 h-3.5 text-amber-500" /> : <Check className="w-3.5 h-3.5 text-amber-400" />)}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 bg-white/80 backdrop-blur border-t border-amber-100">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 shrink-0">
            <Paperclip className="w-5 h-5 text-amber-600" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 shrink-0">
            <Image className="w-5 h-5 text-amber-600" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="h-11 bg-amber-50/50 border-amber-200 rounded-full pr-12 text-amber-900 placeholder:text-amber-400 focus-visible:ring-amber-300"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            />
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full hover:bg-amber-100 w-9 h-9">
              <Smile className="w-5 h-5 text-amber-500" />
            </Button>
          </div>
          <Button onClick={handleSend} disabled={!message.trim()} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full h-11 w-11 p-0 shadow-lg shadow-orange-200/50">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-100">
          <Send className="w-8 h-8 text-amber-400" />
        </div>
        <h3 className="text-lg font-bold text-amber-900 mb-2">Your messages</h3>
        <p className="text-amber-600/60">Select a conversation to start messaging</p>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)] flex bg-white rounded-3xl border border-amber-100 shadow-xl shadow-amber-100/50 max-w-6xl mx-auto overflow-hidden my-4 mx-4 md:mx-auto">
      {/* Conversation List */}
      <div className={`w-full md:w-80 shrink-0 border-r border-amber-100 ${selectedConversation ? "hidden md:block" : ""}`}>
        <ConversationList />
      </div>

      {/* Message View */}
      <div className={`flex-1 ${!selectedConversation ? "hidden md:block" : ""}`}>
        {selectedConversation ? <MessageView /> : <EmptyState />}
      </div>
    </div>
  );
}
