/**
 * ChatWindow Component
 * 
 * Displays messages in a conversation with real-time updates
 * Features: 
 * - Emoji support
 * - Improved styling with professional SaaS look
 * - Read receipts
 * - Clickable seller/product context
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Trash2,
  Check,
  CheckCheck,
  Package,
  Ban,
  Unlock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

interface ServiceContext {
  id: string;
  title: string;
  images?: string[];
  price?: string | number;
  currency?: string;
}

interface VendorContext {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  currentUserRole: 'customer' | 'vendor';
  otherPartyName?: string;
  otherPartyImage?: string;
  otherPartyId?: string;
  service?: ServiceContext;
  onClose?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  currentUserRole,
  otherPartyName,
  otherPartyImage,
  otherPartyId,
  service,
  onClose,
  onDelete,
  className,
}: ChatWindowProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  // Fetch conversation details to ensure data persistence on refresh
  const { data: conversationData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch blocked users to check if this user is blocked
  const { data: blockedUsers = [] } = useQuery({
    queryKey: ['blocked-users', currentUserId],
    queryFn: async () => {
      const res = await fetch('/api/chat/blocked-users', {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Check if the other party is blocked
  const isUserBlocked = otherPartyId && blockedUsers.some((u: any) => u.id === otherPartyId);

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        credentials: 'include',
      });
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
        credentials: 'include',
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
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      // CRITICAL: Also invalidate and refetch conversations list to update last message preview immediately
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['conversations'] });
        window.dispatchEvent(new Event('refetch-conversations'));
      }, 100);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const res = await fetch(`/api/chat/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
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

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to delete conversation' }));
        throw new Error(error.message || 'Failed to delete conversation');
      }
      return res.json();
    },
    onSuccess: () => {
      // Close dialog first
      setShowDeleteDialog(false);
      // Invalidate all conversation-related queries and force refetch
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.refetchQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      toast.success('Conversation deleted');
      // Close chat window and clear selection
      if (onDelete) {
        onDelete();
      } else if (onClose) {
        onClose();
      }
    },
    onError: (error: Error) => {
      console.error('Delete conversation error:', error);
      toast.error(error.message || 'Failed to delete conversation');
    },
  });

  // Block conversation mutation
  // Block user mutation (archives all conversations with that user)
  const blockUserMutation = useMutation({
    mutationFn: async () => {
      if (!otherPartyId) {
        throw new Error('Cannot block: user ID not available');
      }
      const res = await fetch(`/api/chat/users/${otherPartyId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Blocked by user' }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to block user' }));
        throw new Error(error.message || 'Failed to block user');
      }
      return res.json();
    },
    onSuccess: () => {
      setShowBlockDialog(false);
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User blocked. All conversations with this user have been archived.');
      if (onDelete) {
        onDelete(); // Close chat after blocking
      }
    },
    onError: (error: Error) => {
      console.error('Block user error:', error);
      toast.error(error.message || 'Failed to block user');
    },
  });

  // Unblock user mutation (restores all archived conversations with that user)
  const unblockUserMutation = useMutation({
    mutationFn: async () => {
      if (!otherPartyId) {
        throw new Error('Cannot unblock: user ID not available');
      }
      const res = await fetch(`/api/chat/users/${otherPartyId}/unblock`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to unblock user' }));
        throw new Error(error.message || 'Failed to unblock user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
      toast.success('User unblocked. All conversations with this user have been restored.');
    },
    onError: (error: Error) => {
      console.error('Unblock user error:', error);
      toast.error(error.message || 'Failed to unblock user');
    },
  });

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    // Find the ScrollArea viewport element (Radix UI structure)
    if (scrollAreaRef.current) {
      // Try multiple possible selectors for Radix ScrollArea viewport
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement ||
                      scrollAreaRef.current.querySelector('[style*="overflow"]') as HTMLElement ||
                      scrollAreaRef.current.querySelector('div[class*="viewport"]') as HTMLElement;
      
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth'
        });
        return;
      }
      
      // If no viewport found, try scrolling the root element
      const root = scrollAreaRef.current as HTMLElement;
      if (root) {
        root.scrollTo({
          top: root.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    
    // Fallback: scroll the marker div's parent
    if (scrollRef.current && scrollRef.current.parentElement) {
      scrollRef.current.parentElement.scrollTo({
        top: scrollRef.current.parentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      // Use multiple attempts to ensure scroll happens
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(), 50);
        setTimeout(() => scrollToBottom(), 150);
        setTimeout(() => scrollToBottom(), 300);
      });
    }
  }, [messages.length]); // Use length to avoid re-scrolling on every message property change

  // Force scroll when message is sent
  useEffect(() => {
    if (sendMutation.isSuccess) {
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(), 100);
        setTimeout(() => scrollToBottom(), 250);
      });
    }
  }, [sendMutation.isSuccess]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0) {
      const hasUnread = messages.some(m => m.senderId !== currentUserId && !m.readAt);
      if (hasUnread) {
        // Debounce to avoid too many API calls
        const timeoutId = setTimeout(() => {
          markReadMutation.mutate();
        }, 500);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [messages.length, currentUserId]); // Use length to avoid re-running on every message property change

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

  // Determine the profile link based on role - use fetched data or fallback to props
  const displayService = conversationData?.service || service;
  const displayOtherParty = conversationData 
    ? (currentUserRole === 'customer' ? conversationData.vendor : conversationData.customer)
    : null;
  const displayName = displayOtherParty 
    ? `${displayOtherParty.firstName || ''} ${displayOtherParty.lastName || ''}`.trim()
    : otherPartyName || 'Chat';
  const displayImage = displayOtherParty?.profileImageUrl || otherPartyImage;
  const displayOtherPartyId = displayOtherParty?.id || otherPartyId;
  const profileLink = displayOtherPartyId
    ? `/users/${displayOtherPartyId}`
    : '#';

  return (
    <Card className={cn("flex flex-col h-full overflow-hidden border-0 shadow-none rounded-none md:rounded-xl md:border md:shadow-sm", className)}>
      {/* Header - Professional SaaS style */}
      <CardHeader className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 flex flex-row items-center justify-between gap-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Clickable Avatar */}
          <Link href={profileLink} className="relative flex-shrink-0 group">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm group-hover:ring-primary/20 transition-all">
              <AvatarImage src={displayImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {displayName.slice(0, 2).toUpperCase() || '??'}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator - Mocked for now, can be real if socket connected */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
          </Link>
          
          <div className="flex flex-col min-w-0">
            {/* Header Info: [Name] • [Service] • [Price] */}
            <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
              <Link 
                href={profileLink}
                className="hover:text-primary transition-colors truncate"
              >
                {displayName}
              </Link>
              
              {displayService && (
                <>
                  <span className="text-muted-foreground/40 mx-0.5">•</span>
                  <Link 
                    href={`/service/${displayService.id}`}
                    className="hover:text-primary transition-colors truncate font-medium"
                  >
                    {displayService.title}
                  </Link>
                  {displayService.price && (
                    <>
                      <span className="text-muted-foreground/40 mx-0.5">•</span>
                      <span className="text-muted-foreground font-normal">
                        {displayService.currency || 'CHF'} {displayService.price}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Online Status */}
            <div className="flex items-center text-xs text-muted-foreground gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span>Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {displayService && (
             <Button asChild variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex text-muted-foreground hover:text-primary">
               <Link href={`/service/${displayService.id}`} title="View Service">
                 <Package className="w-5 h-5" />
               </Link>
             </Button>
          )}
          
          {/* Delete Conversation */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isUserBlocked ? (
                <DropdownMenuItem 
                  onClick={() => unblockUserMutation.mutate()}
                  disabled={unblockUserMutation.isPending}
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Unblock User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setShowBlockDialog(true)}
                  disabled={blockUserMutation.isPending}
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
                disabled={deleteConversationMutation.isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onClose && (
            <Button size="icon" variant="ghost" onClick={onClose} className="h-9 w-9 text-muted-foreground hover:text-destructive">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative bg-slate-50/50 dark:bg-slate-900/50">
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
          <div className="p-4 md:p-6 space-y-6 min-h-full flex flex-col justify-end">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground flex-1">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 ring-4 ring-primary/5">
                  <MessageSquare className="w-8 h-8 text-primary/40" />
                </div>
                <p className="font-medium text-lg text-foreground">No messages yet</p>
                <p className="text-sm text-center max-w-[250px]">Start the conversation with {otherPartyName?.split(' ')[0] || 'them'} about {service?.title || 'this service'}.</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === currentUserId;
                const isSystem = message.senderRole === 'system';
                const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== message.senderId || shouldShowDateSeparator(index));

                return (
                  <div key={message.id} className="space-y-6">
                    {/* Date Separator */}
                    {shouldShowDateSeparator(index) && (
                      <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/40" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background/50 backdrop-blur-sm px-2 text-muted-foreground rounded-full border border-border/40">
                            {formatDateSeparator(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* System Message */}
                    {isSystem ? (
                      <div className="flex justify-center">
                        <div className="bg-muted/50 border border-border/50 rounded-full px-4 py-1.5 text-xs text-muted-foreground flex items-center gap-2 max-w-[90%] text-center">
                          <Shield className="w-3 h-3 text-primary flex-shrink-0" />
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      /* Regular Message */
                      <div className={cn(
                        "flex gap-3 group",
                        isOwn ? "justify-end" : "justify-start"
                      )}>
                        {/* Avatar for received messages - Only on desktop/tablet usually, or keep small on mobile */}
                        {!isOwn && (
                          <div className="flex-shrink-0 w-8 pt-1 hidden sm:block">
                            {showAvatar ? (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={otherPartyImage} />
                                <AvatarFallback className="text-[10px]">
                                  {otherPartyName?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : <div className="w-8" />}
                          </div>
                        )}
                        
                        <div className={cn(
                          "flex flex-col max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]",
                          isOwn ? "items-end" : "items-start"
                        )}>
                          {/* Sender Name (optional, good for group chats or clarity) */}
                          {!isOwn && showAvatar && (
                            <span className="text-[10px] text-muted-foreground ml-1 mb-1 hidden sm:block">
                              {otherPartyName}
                            </span>
                          )}

                          <div className={cn(
                            "relative px-4 py-2.5 shadow-sm text-sm whitespace-pre-wrap break-words",
                            isOwn 
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm" 
                              : "bg-white dark:bg-slate-800 border border-border/50 rounded-2xl rounded-tl-sm",
                            message.isDeleted && "italic opacity-70 bg-muted text-muted-foreground border-dashed"
                          )}>
                            {message.wasFiltered && (
                              <div className={cn(
                                "flex items-center gap-1.5 text-[10px] mb-1.5 pb-1.5 border-b w-full",
                                isOwn ? "border-white/20 text-white/80" : "border-slate-200 dark:border-slate-700 text-amber-600"
                              )}>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Filtered for safety</span>
                              </div>
                            )}
                            
                            {message.content}
                            
                            {/* Timestamp & Status inside bubble */}
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1 text-[10px] select-none",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground/70"
                            )}>
                              <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                              {message.isEdited && <span>(edited)</span>}
                              {isOwn && (
                                <span className={cn(
                                  "flex items-center gap-0.5",
                                  message.readAt ? "text-white" : "text-white/50"
                                )}>
                                  {message.readAt 
                                    ? (
                                      <>
                                        <CheckCheck className="w-3 h-3" />
                                        <span className="text-[9px] ml-0.5">Seen</span>
                                      </>
                                    )
                                    : <Check className="w-3 h-3" />
                                  }
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Mobile-only message actions trigger could go here */}
                        </div>
                        
                        {/* Desktop Actions */}
                        {isOwn && !message.isDeleted && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center hidden sm:block">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-full">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => deleteMessageMutation.mutate(message.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            {/* Invisible element to scroll to */}
            <div ref={scrollRef} /> 
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="border-t bg-background p-3 md:p-4">
        <MessageInput
          onSend={(content) => sendMutation.mutate(content)}
          isLoading={sendMutation.isPending}
          placeholder="Type a message..."
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone. 
              All messages in this conversation will be permanently removed. You can start a new conversation with this person later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversationMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConversationMutation.isPending}
            >
              {deleteConversationMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? All conversations with this user will be archived. 
              You won't be able to send or receive messages from them. You can unblock them later if you change your mind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => blockUserMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={blockUserMutation.isPending}
            >
              {blockUserMutation.isPending ? 'Blocking...' : 'Block User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ChatWindow;

