/**
 * ChatWindow Component
 * 
 * Displays messages in a conversation with real-time updates
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageInput } from './MessageInput';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';
import { 
  MessageSquare, 
  AlertTriangle, 
  Shield, 
  X, 
  MoreVertical,
  Flag,
  Trash2,
  Edit,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'vendor' | 'system';
  content: string;
  originalContent: string | null;
  messageType: string;
  wasFiltered: boolean;
  filterReason: string | null;
  readAt: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserRole: 'customer' | 'vendor';
  otherPartyName?: string;
  otherPartyImage?: string;
  onClose?: () => void;
  className?: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserRole,
  otherPartyName,
  otherPartyImage,
  onClose,
  className,
}: ChatWindowProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to mark as read');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete message mutation
  const deleteMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete message');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnread = messages.some(m => m.senderId !== currentUserId && !m.readAt);
      if (hasUnread) {
        markReadMutation.mutate();
      }
    }
  }, [messages, currentUserId]);

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d, HH:mm');
  };

  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt);
    const previous = new Date(messages[index - 1].createdAt);
    return !isSameDay(current, previous);
  };

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMMM d');
  };

  if (isLoading) {
    return (
      <Card className={cn("flex flex-col h-full", className)}>
        <CardHeader className="border-b p-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "")}>
                <Skeleton className="h-16 w-48 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <CardHeader className="border-b p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherPartyImage} />
            <AvatarFallback>
              {otherPartyName?.slice(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{otherPartyName || 'Chat'}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {currentUserRole === 'customer' ? 'Vendor' : 'Customer'}
            </p>
          </div>
        </div>
        {onClose && (
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const isSystem = message.senderRole === 'system';

              return (
                <div key={message.id}>
                  {/* Date Separator */}
                  {shouldShowDateSeparator(index) && (
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                        {formatDateSeparator(message.createdAt)}
                      </span>
                    </div>
                  )}

                  {/* System Message */}
                  {isSystem ? (
                    <div className="flex justify-center">
                      <div className="px-4 py-2 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {message.content}
                      </div>
                    </div>
                  ) : (
                    /* Regular Message */
                    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] group relative",
                        isOwn ? "order-2" : "order-1"
                      )}>
                        <div className={cn(
                          "px-4 py-2 rounded-2xl",
                          isOwn 
                            ? "bg-primary text-primary-foreground rounded-br-sm" 
                            : "bg-muted rounded-bl-sm",
                          message.isDeleted && "italic opacity-70"
                        )}>
                          {message.wasFiltered && (
                            <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                              <AlertTriangle className="w-3 h-3" />
                              Message filtered
                            </div>
                          )}
                          <p className={cn(
                            "text-sm break-words",
                            message.isDeleted && "text-muted-foreground"
                          )}>
                            {message.content}
                          </p>
                        </div>
                        
                        <div className={cn(
                          "flex items-center gap-1 mt-1 text-xs text-muted-foreground",
                          isOwn ? "justify-end" : "justify-start"
                        )}>
                          <span>{formatMessageDate(message.createdAt)}</span>
                          {message.isEdited && <span>(edited)</span>}
                          {isOwn && (
                            message.readAt 
                              ? <CheckCheck className="w-3 h-3 text-primary" />
                              : <Check className="w-3 h-3" />
                          )}
                        </div>

                        {/* Message Actions */}
                        {isOwn && !message.isDeleted && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="absolute -right-8 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(message.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <MessageInput
          onSend={(content) => sendMutation.mutate(content)}
          isLoading={sendMutation.isPending}
          placeholder="Type a message..."
        />
      </div>
    </Card>
  );
}

export default ChatWindow;

