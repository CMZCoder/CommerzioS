/**
 * ConversationList Component
 * 
 * Displays a list of chat conversations for the current user
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  role = 'both',
  className,
}: ConversationListProps) {
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', role],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations?role=${role}`);
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-2 p-2", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-muted-foreground", className)}>
        <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
        <p className="font-medium">No conversations yet</p>
        <p className="text-sm">Start chatting with vendors or customers</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-1 p-2">
        {conversations.map((conversation) => {
          const isCustomer = conversation.customerId === currentUserId;
          const unreadCount = isCustomer 
            ? conversation.customerUnreadCount 
            : conversation.vendorUnreadCount;
          const isSelected = conversation.id === selectedConversationId;

          return (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                isSelected 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted",
                unreadCount > 0 && "bg-primary/5"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {isCustomer ? 'V' : 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "font-medium truncate",
                    unreadCount > 0 && "font-semibold"
                  )}>
                    {isCustomer ? 'Vendor' : 'Customer'}
                  </span>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {conversation.flaggedForReview && (
                    <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  )}
                  <p className={cn(
                    "text-sm truncate",
                    unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </p>
                </div>
              </div>

              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export default ConversationList;

