/**
 * Chat Page (Redesigned)
 * 
 * Modern chat interface with clean layout
 * Features:
 * - Unified design language
 * - Smart filter dropdown (replaces cluttered tabs)
 * - Professional responsive layout
 * - Smooth transitions
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageSquare, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';

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
  // Extended fields for context
  service?: {
    id: string;
    title: string;
    images?: string[];
    price?: string | number;
    currency?: string;
  };
  vendor?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

export default function ChatPage() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isMobileViewingChat, setIsMobileViewingChat] = useState(false);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const res = await fetchApi('/api/auth/user');
      if (!res.ok) return null;
      return res.json();
    },
  });

  // Parse URL params for direct links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('booking');
    const orderId = params.get('order');
    const vendorId = params.get('vendor');
    const serviceId = params.get('service');

    // If we have a vendor ID, start or get a conversation
    if (vendorId && user) {
      fetchApi('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          bookingId,
          orderId,
          serviceId,
        }),
      })
        .then(async res => {
        if (!res.ok) {
          const error = await res.json().catch(() => ({ message: 'Failed to create conversation' }));
          console.error('Failed to create conversation:', error);
          throw new Error(error.message || 'Failed to create conversation');
        }
        return res.json();
      })
        .then(conversation => {
          console.log('[ChatPage] Conversation created/retrieved:', conversation);
          setSelectedConversation(conversation);
          setIsMobileViewingChat(true);
          
          // Aggressively invalidate and refetch all conversation queries
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Wait a bit then refetch to ensure backend has processed
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['conversations'] });
            // Also trigger custom event for ConversationList to refetch
            window.dispatchEvent(new Event('refetch-conversations'));
          }, 200);
        })
        .catch(error => {
          console.error('[ChatPage] Error creating conversation:', error);
        });
    }
  }, [location, user]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileViewingChat(true);
  };

  const handleBackToList = () => {
    setIsMobileViewingChat(false);
    setSelectedConversation(null);
  };

  const handleDeleteConversation = () => {
    setSelectedConversation(null);
    setIsMobileViewingChat(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-5xl py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sign in to view messages</p>
              <p className="text-sm">You need to be logged in to access your conversations</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const currentUserRole = selectedConversation?.customerId === user.id ? 'customer' : 'vendor';
  
  // Get the other party info
  const otherParty = currentUserRole === 'customer' 
    ? selectedConversation?.vendor 
    : selectedConversation?.customer;
  
  const otherPartyName = otherParty 
    ? `${otherParty.firstName} ${otherParty.lastName}` 
    : undefined;

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="container max-w-7xl py-4 md:py-6 px-4">
          {/* Header - Clean and minimal */}
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Messages
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Chat with vendors and customers
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-time messaging</span>
            </div>
          </div>

          {/* Desktop Layout - Modern two-column */}
          <div className="hidden md:grid md:grid-cols-[400px_1fr] gap-4 h-[calc(100vh-180px)] min-h-[500px]">
            {/* Conversation List - Clean card */}
            <Card className="border shadow-lg overflow-hidden h-full bg-white dark:bg-slate-900">
              <ConversationList
                currentUserId={user.id}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                className="h-full"
              />
            </Card>

            {/* Chat Window - Main content area */}
            <div className="flex flex-col h-full overflow-hidden">
              {selectedConversation ? (
                <Card className="h-full flex flex-col overflow-hidden border shadow-lg bg-white dark:bg-slate-900">
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={user.id}
                    currentUserRole={currentUserRole as 'customer' | 'vendor'}
                    otherPartyName={otherPartyName}
                    otherPartyImage={otherParty?.profileImageUrl}
                    otherPartyId={otherParty?.id}
                    service={selectedConversation.service}
                    onDelete={handleDeleteConversation}
                    className="flex-1 border-0 h-full"
                  />
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center border shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                  <CardContent className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center rotate-3 shadow-lg">
                      <MessageSquare className="w-12 h-12 text-primary/60 -rotate-3" />
                    </div>
                    <p className="text-xl font-semibold mb-2">Select a conversation</p>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                      Choose a chat from the list to start messaging
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Mobile Layout - Full screen switching */}
          <div className="md:hidden h-[calc(100vh-160px)]">
            {!isMobileViewingChat ? (
              <Card className="h-full border shadow-lg overflow-hidden">
                <ConversationList
                  currentUserId={user.id}
                  selectedConversationId={selectedConversation?.id}
                  onSelectConversation={handleSelectConversation}
                  className="h-full"
                />
              </Card>
            ) : selectedConversation ? (
              <div className="h-full flex flex-col overflow-hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-2 self-start -ml-2 text-muted-foreground hover:text-foreground"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span className="font-medium">All chats</span>
                </Button>
                
                <Card className="flex-1 border shadow-lg overflow-hidden">
                  <ChatWindow
                    conversationId={selectedConversation.id}
                    currentUserId={user.id}
                    currentUserRole={currentUserRole as 'customer' | 'vendor'}
                    otherPartyName={otherPartyName}
                    otherPartyImage={otherParty?.profileImageUrl}
                    otherPartyId={otherParty?.id}
                    service={selectedConversation.service}
                    onClose={handleBackToList}
                    onDelete={handleDeleteConversation}
                    className="flex-1 border-0 h-full"
                  />
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

