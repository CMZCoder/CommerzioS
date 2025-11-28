/**
 * Chat Page
 * 
 * Full chat interface with conversation list and message window
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { Card, CardContent } from '@/components/ui/card';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function ChatPage() {
  const [location] = useLocation();
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

    // If we have a vendor ID, start or get a conversation
    if (vendorId && user) {
      fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          bookingId,
          orderId,
        }),
      })
        .then(res => res.json())
        .then(conversation => {
          setSelectedConversation(conversation);
          setIsMobileViewingChat(true);
        })
        .catch(console.error);
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

  return (
    <Layout>
      <div className="container max-w-6xl py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Chat with vendors and customers
          </p>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Conversation List */}
          <Card className="col-span-1">
            <ConversationList
              currentUserId={user.id}
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={handleSelectConversation}
              className="h-full"
            />
          </Card>

          {/* Chat Window */}
          <div className="col-span-2">
            {selectedConversation ? (
              <ChatWindow
                conversationId={selectedConversation.id}
                currentUserId={user.id}
                currentUserRole={currentUserRole as 'customer' | 'vendor'}
                className="h-full"
              />
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a chat from the list to start messaging</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden h-[calc(100vh-180px)]">
          {!isMobileViewingChat ? (
            <Card className="h-full">
              <ConversationList
                currentUserId={user.id}
                selectedConversationId={selectedConversation?.id}
                onSelectConversation={handleSelectConversation}
                className="h-full"
              />
            </Card>
          ) : selectedConversation ? (
            <div className="h-full flex flex-col">
              <Button
                variant="ghost"
                className="mb-2 self-start"
                onClick={handleBackToList}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to conversations
              </Button>
              <ChatWindow
                conversationId={selectedConversation.id}
                currentUserId={user.id}
                currentUserRole={currentUserRole as 'customer' | 'vendor'}
                className="flex-1"
              />
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

