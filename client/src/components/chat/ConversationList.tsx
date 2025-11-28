/**
 * ConversationList Component
 * 
 * Displays a list of chat conversations for the current user
 * Enhanced with modern styling and better visual hierarchy
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Conversation {
  id: string;
  customerId: string;
  vendorId: string;
  bookingId: string | null;
  orderId: string | null;
  serviceId: string | null;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  customerUnreadCount: number;
  vendorUnreadCount: number;
  flaggedForReview: boolean;
  createdAt: string;
}

interface ConversationListProps {
  currentUserId: string;
  selectedConversationId?: string;
  onSelectConversation: (conversation: Conversation) => void;
  role?: 'customer' | 'vendor' | 'both';
  className?: string;
}

// Generate a consistent color based on conversation id
const getAvatarGradient = (id: string) => {
  const gradients = [
    'from-violet-500 to-purple-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-500',
  ];
  const index = id.charCodeAt(0) % gradients.length;
  return gradients[index];
};

export function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  role = 'both',
  className,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', role],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations?role=${role}`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const filteredConversations = conversations.filter(conv => 
    conv.lastMessagePreview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    searchTerm === ''
  );

  if (isLoading) {
    return (
      <div className={cn("p-4 space-y-3", className)}>
        <Skeleton className="h-10 w-full rounded-xl" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
          <MessageSquare className="w-10 h-10 text-primary/60" />
        </div>
        <p className="font-semibold text-lg mb-1">No conversations yet</p>
        <p className="text-sm text-muted-foreground mb-4">
          Start chatting with vendors or customers 💬
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
          <Sparkles className="w-3 h-3" />
          Click "Message" on any service to start
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Search Bar */}
      <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-10"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No conversations match your search</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isCustomer = conversation.customerId === currentUserId;
              const unreadCount = isCustomer 
                ? conversation.customerUnreadCount 
                : conversation.vendorUnreadCount;
              const isSelected = conversation.id === selectedConversationId;
              const gradient = getAvatarGradient(conversation.id);

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200",
                    isSelected 
                      ? "bg-primary/10 border-2 border-primary/30 shadow-sm" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border-2 border-transparent",
                    unreadCount > 0 && !isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="relative">
                    <Avatar className={cn(
                      "h-12 w-12 ring-2 transition-all",
                      isSelected ? "ring-primary/50" : "ring-white dark:ring-slate-800"
                    )}>
                      <AvatarFallback className={cn(
                        "bg-gradient-to-br text-white font-semibold",
                        gradient
                      )}>
                        {isCustomer ? '🏪' : '👤'}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={cn(
                        "font-medium truncate",
                        unreadCount > 0 ? "font-semibold text-foreground" : "text-foreground/90"
                      )}>
                        {isCustomer ? 'Vendor' : 'Customer'}
                      </span>
                      {conversation.lastMessageAt && (
                        <span className={cn(
                          "text-[11px] whitespace-nowrap",
                          unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {conversation.flaggedForReview && (
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      <p className={cn(
                        "text-sm truncate",
                        unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"
                      )}>
                        {conversation.lastMessagePreview || '👋 Start a conversation'}
                      </p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <Badge className="ml-2 h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 text-xs font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer with count */}
      <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-xs text-center text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} 💬
        </p>
      </div>
    </div>
  );
}

export default ConversationList;

