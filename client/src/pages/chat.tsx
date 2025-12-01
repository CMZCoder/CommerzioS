/**
 * Chat Page
 * 
 * Full chat interface with conversation list and message window
 * Features:
 * - Centered chat panel with professional styling
 * - Product/seller context in header
 * - Responsive layout
 */

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageSquare, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
      const res = await fetch('/api/auth/user');
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
      fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950/50 dark:to-slate-900">
        <div className="container max-w-7xl py-4 md:py-6 px-4">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Chat with vendors and customers
            </p>
          </div>

          {/* Desktop Layout - Centered chat panel */}
          <div className="hidden md:grid md:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-180px)] min-h-[500px]">
            {/* Conversation List - Fixed width sidebar */}
            <Card className="border-0 shadow-lg overflow-hidden h-full">
              <ConversationList
                currentUserId={user.id}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                className="h-full"
              />
            </Card>

            {/* Chat Window - Expanded to fill available space */}
            <div className="flex flex-col h-full overflow-hidden w-full">
              <div className="w-full h-full flex flex-col shadow-xl rounded-2xl overflow-hidden">
                {selectedConversation ? (
                  <div className="h-full flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                    {/* Chat Window with enhanced styling */}
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
                  </div>
                ) : (
                  <Card className="h-full flex items-center justify-center border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                    <CardContent className="text-center text-muted-foreground py-16">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MessageSquare className="w-12 h-12 text-primary/60" />
                      </div>
                      <p className="text-xl font-semibold mb-2">Select a conversation</p>
                      <p className="text-sm max-w-xs mx-auto">Choose a chat from the list to start messaging with vendors or customers</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden h-[calc(100vh-160px)]">
            {!isMobileViewingChat ? (
              <Card className="h-full border-0 shadow-lg overflow-hidden">
                <ConversationList
                  currentUserId={user.id}
                  selectedConversationId={selectedConversation?.id}
                  onSelectConversation={handleSelectConversation}
                  className="h-full"
                />
              </Card>
            ) : selectedConversation ? (
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex items-center mb-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 hover:bg-transparent -ml-2"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    <span className="font-medium">Back</span>
                  </Button>
                </div>
                
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
                  className="flex-1 border-0 shadow-lg rounded-xl overflow-hidden"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

