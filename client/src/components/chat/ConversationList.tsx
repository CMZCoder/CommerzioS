/**
 * ConversationList Component
 * 
 * Displays a list of chat conversations for the current user
 * Enhanced with grouping by vendor/customer and folder structure
 */

import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, AlertCircle, Search, Sparkles, ChevronDown, ChevronRight, Folder, RefreshCw, Archive, Clock, Heart, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';

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
  // Extended fields from backend joins
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

// Helper function to format timestamp compactly
const formatTimestamp = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    // Show relative time for recent messages, absolute for older ones
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return null;
  }
};

type TabType = 'all' | 'active' | 'archived' | 'expired' | 'saved';

export function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  role = 'both',
  className,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const queryClient = useQueryClient();
  
  // Fetch saved services to determine which conversations are "saved"
  const { data: savedServices = [] } = useQuery<Array<{ serviceId: string }>>({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      // The API returns favorites with serviceId directly on the favorite object
      return data.map((fav: any) => ({ 
        serviceId: fav.serviceId || fav.service?.id || fav.serviceId 
      })).filter((fav: any) => fav.serviceId); // Filter out any undefined serviceIds
    },
    enabled: activeTab === 'saved', // Only fetch when saved tab is active
  });

  const savedServiceIds = new Set(savedServices.map(s => s.serviceId).filter(Boolean));
  
  const { data: conversations = [], isLoading, error, refetch } = useQuery<Conversation[]>({
    queryKey: ['conversations', role, currentUserId, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams({
        role,
      });
      
      // Add status parameter based on active tab
      if (activeTab === 'all') {
        params.append('status', 'all');
      } else if (activeTab === 'saved') {
        params.append('savedOnly', 'true');
      } else if (activeTab === 'active' || activeTab === 'archived' || activeTab === 'expired') {
        params.append('status', activeTab);
      }
      
      const res = await fetch(`/api/chat/conversations?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Failed to fetch conversations:', res.status, errorText);
        throw new Error('Failed to fetch conversations');
      }
      const data = await res.json();
      console.log('[ConversationList] Fetched conversations:', {
        count: data.length,
        activeTab,
        role,
        currentUserId,
        conversations: data.map((c: any) => ({
          id: c.id,
          status: c.status,
          serviceId: c.serviceId,
          serviceTitle: c.service?.title,
          customerId: c.customerId,
          vendorId: c.vendorId,
          hasVendor: !!c.vendor,
          hasCustomer: !!c.customer,
          hasService: !!c.service,
        })),
      });
      return data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for better responsiveness
    refetchOnWindowFocus: true, // Refresh when user returns to tab
    refetchOnMount: true, // Refresh when component mounts
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });

  // Expose refetch function for parent to call
  useEffect(() => {
    // Listen for custom event to refetch conversations
    const handleRefetch = () => {
      console.log('[ConversationList] Refetch triggered by event');
      refetch();
    };
    window.addEventListener('refetch-conversations', handleRefetch);
    return () => window.removeEventListener('refetch-conversations', handleRefetch);
  }, [refetch]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const matchesSearch = 
        conv.lastMessagePreview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.service?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.vendor?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.vendor?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (conv.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()));
        
      return matchesSearch || searchTerm === '';
    });
  }, [conversations, searchTerm]);

  // Group conversations by other party (Vendor or Customer)
  const groupedConversations = useMemo(() => {
    const groups: Record<string, {
      partyId: string;
      partyName: string;
      partyImage?: string;
      conversations: Conversation[];
      unreadCount: number;
      latestMessageAt: string | null;
    }> = {};

    filteredConversations.forEach(conv => {
      const isCustomer = conv.customerId === currentUserId;
      const otherParty = isCustomer ? conv.vendor : conv.customer;
      
      // Use vendorId/customerId directly if otherParty data is missing
      const partyId = otherParty?.id || (isCustomer ? conv.vendorId : conv.customerId) || 'unknown';
      const partyName = otherParty 
        ? `${otherParty.firstName} ${otherParty.lastName}`.trim()
        : (isCustomer ? `Vendor ${conv.vendorId?.slice(0, 8)}` : `Customer ${conv.customerId?.slice(0, 8)}`);
      
      const unreadCount = isCustomer ? conv.customerUnreadCount : conv.vendorUnreadCount;

      if (!groups[partyId]) {
        groups[partyId] = {
          partyId,
          partyName,
          partyImage: otherParty?.profileImageUrl,
          conversations: [],
          unreadCount: 0,
          latestMessageAt: null
        };
        console.log(`[ConversationList] Created new group for ${partyName} (${partyId})`);
      }

      groups[partyId].conversations.push(conv);
      groups[partyId].unreadCount += unreadCount;
      
      console.log(`[ConversationList] Added conversation ${conv.id} (service: ${conv.service?.title || 'N/A'}) to group ${partyName} (${partyId}). Group now has ${groups[partyId].conversations.length} conversations.`);
      
      // Update latest message timestamp for sorting
      if (conv.lastMessageAt) {
        if (!groups[partyId].latestMessageAt || new Date(conv.lastMessageAt) > new Date(groups[partyId].latestMessageAt!)) {
          groups[partyId].latestMessageAt = conv.lastMessageAt;
        }
      }
    });

    // Sort conversations within groups by date
    Object.values(groups).forEach(group => {
      group.conversations.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
    });

    // Return sorted groups
    const sortedGroups = Object.values(groups).sort((a, b) => {
      const dateA = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
      const dateB = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
      return dateB - dateA;
    });
    
    // Debug: Log grouping results with detailed info
    console.log('[ConversationList] Grouped conversations:', {
      totalConversations: filteredConversations.length,
      totalGroups: sortedGroups.length,
      currentUserId,
      groups: sortedGroups.map(g => ({
        partyId: g.partyId,
        partyName: g.partyName,
        conversationCount: g.conversations.length,
        conversations: g.conversations.map(c => ({
          id: c.id,
          customerId: c.customerId,
          vendorId: c.vendorId,
          serviceId: c.serviceId,
          serviceTitle: c.service?.title,
          vendorName: c.vendor ? `${c.vendor.firstName} ${c.vendor.lastName}` : 'N/A',
        })),
      })),
      rawConversations: filteredConversations.map(c => ({
        id: c.id,
        customerId: c.customerId,
        vendorId: c.vendorId,
        serviceId: c.serviceId,
        vendorName: c.vendor ? `${c.vendor.firstName} ${c.vendor.lastName}` : 'N/A',
      })),
    });
    
    return sortedGroups;
  }, [filteredConversations, currentUserId]);

  // Helper to toggle group expansion
  const toggleGroup = (partyId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [partyId]: !prev[partyId]
    }));
  };

  // Auto-expand groups containing the selected conversation
  // Also auto-expand groups with multiple conversations (folder structure)
  useEffect(() => {
    if (groupedConversations.length > 0) {
      setExpandedGroups(prev => {
        const newExpandedGroups: Record<string, boolean> = { ...prev };
        let hasChanges = false;
        
        groupedConversations.forEach(group => {
          // Auto-expand if:
          // 1. Contains the selected conversation, OR
          // 2. Has multiple conversations (folder structure should be visible)
          const hasSelected = group.conversations.some(c => c.id === selectedConversationId);
          const hasMultiple = group.conversations.length > 1;
          
          if ((hasSelected || hasMultiple) && !newExpandedGroups[group.partyId]) {
            newExpandedGroups[group.partyId] = true;
            hasChanges = true;
            console.log(`[ConversationList] Auto-expanding group ${group.partyId} (${group.partyName}): hasSelected=${hasSelected}, hasMultiple=${hasMultiple}`);
          }
        });
        
        return hasChanges ? newExpandedGroups : prev;
      });
    }
  }, [selectedConversationId, groupedConversations]);

  // Debug logging (must be before any early returns)
  useEffect(() => {
    if (!isLoading) {
      console.log('[ConversationList] Conversations loaded:', {
        count: conversations.length,
        conversations: conversations.map(c => ({
          id: c.id,
          vendorId: c.vendorId,
          customerId: c.customerId,
          status: c.status,
          hasVendor: !!c.vendor,
          hasCustomer: !!c.customer,
          hasService: !!c.service,
          lastMessageAt: c.lastMessageAt,
        })),
        currentUserId,
        role,
      });
    }
  }, [conversations, isLoading, currentUserId, role]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Tabs */}
      <div className="border-b bg-white dark:bg-slate-900">
        <div className="flex overflow-x-auto scrollbar-hide gap-1 px-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200",
              activeTab === 'all'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <List className="w-4 h-4 inline mr-1.5" />
            All
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200",
              activeTab === 'active'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5" />
            Active
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200",
              activeTab === 'saved'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Heart className="w-4 h-4 inline mr-1.5" />
            Saved
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200",
              activeTab === 'archived'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Archive className="w-4 h-4 inline mr-1.5" />
            Archived
          </button>
          <button
            onClick={() => setActiveTab('expired')}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all duration-200",
              activeTab === 'expired'
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />
            Expired
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative flex items-center gap-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl h-10 flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              console.log('[ConversationList] Manual refetch triggered');
              refetch();
            }}
            className="h-10 w-10"
            title="Refresh conversations"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Conversation List or Empty State */}
      {isLoading ? (
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
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
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center flex-1 overflow-y-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-primary/60" />
          </div>
          <p className="font-semibold text-lg mb-1">No conversations yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            {activeTab === 'saved' 
              ? "You haven't saved any services yet. Save services to see conversations here."
              : activeTab === 'archived'
              ? "No archived conversations"
              : activeTab === 'expired'
              ? "No expired conversations"
              : "Start chatting with vendors or customers 💬"}
          </p>
          {activeTab !== 'saved' && activeTab !== 'archived' && activeTab !== 'expired' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
              <Sparkles className="w-3 h-3" />
              Click "Message" on any service to start
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1 min-h-0">
            {groupedConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No conversations match your search</p>
              </div>
            ) : (
            groupedConversations.map((group) => {
              const isGroupExpanded = expandedGroups[group.partyId];
              const hasMultiple = group.conversations.length > 1;
              
              // If single conversation, render directly (no folder needed)
              if (!hasMultiple) {
                const conversation = group.conversations[0];
                const isSelected = conversation.id === selectedConversationId;
                const serviceTitle = conversation.service?.title;
                const serviceImage = conversation.service?.images?.[0];
                const gradient = getAvatarGradient(conversation.id);
                
                return (
                  <ConversationItem 
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={isSelected}
                    onClick={() => onSelectConversation(conversation)}
                    title={serviceTitle || group.partyName}
                    subtitle={serviceTitle ? group.partyName : undefined}
                    image={serviceImage || group.partyImage}
                    gradient={gradient}
                    unreadCount={group.unreadCount}
                    isCustomer={conversation.customerId === currentUserId}
                  />
                );
              }

              // If multiple conversations, render group header + children (folder structure)
              return (
                <div key={group.partyId} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.partyId)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200",
                      "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                      isGroupExpanded && "bg-slate-50 dark:bg-slate-800/30"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800">
                        <AvatarImage src={group.partyImage} className="object-cover" />
                        <AvatarFallback className="bg-slate-200 text-slate-600">
                          {group.partyName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5 shadow-sm">
                        <div className="bg-primary text-white rounded-full p-0.5 w-5 h-5 flex items-center justify-center">
                           <Folder className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span 
                          className="font-semibold text-foreground break-words flex-1 min-w-0"
                          title={group.partyName}
                        >
                          {group.partyName}
                        </span>
                        {group.unreadCount > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-[10px]">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group.conversations.length} conversations
                      </p>
                    </div>
                    
                    {isGroupExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded Items */}
                  {isGroupExpanded && (
                    <div className="pl-4 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 ml-6 my-1">
                      {group.conversations.map(conversation => {
                        const isSelected = conversation.id === selectedConversationId;
                        const serviceTitle = conversation.service?.title || 'General Inquiry';
                        const serviceImage = conversation.service?.images?.[0];
                        const isCustomer = conversation.customerId === currentUserId;
                        const unreadCount = isCustomer ? conversation.customerUnreadCount : conversation.vendorUnreadCount;
                        
                        return (
                          <ConversationItem 
                            key={conversation.id}
                            conversation={conversation}
                            isSelected={isSelected}
                            onClick={() => onSelectConversation(conversation)}
                            title={serviceTitle}
                            image={serviceImage} // Product image
                            gradient={getAvatarGradient(conversation.id)}
                            unreadCount={unreadCount}
                            isCustomer={isCustomer}
                            compact={true}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      )}

      {/* Footer with count - only show when there are conversations */}
      {conversations.length > 0 && (
        <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs text-center text-muted-foreground">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} 💬
          </p>
        </div>
      )}
    </div>
  );
}

// Sub-component for rendering a single conversation item
function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick, 
  title, 
  subtitle,
  image, 
  gradient, 
  unreadCount,
  isCustomer,
  compact = false
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
  image?: string;
  gradient: string;
  unreadCount: number;
  isCustomer: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl text-left transition-all duration-200",
        compact ? "p-2" : "p-3",
        isSelected 
          ? "bg-primary/10 border-primary/30 shadow-sm" 
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border-transparent",
        unreadCount > 0 && !isSelected && "bg-blue-50/50 dark:bg-blue-950/20",
        "border-2",
        "min-w-0" // Prevent overflow
      )}
    >
      <div className="relative">
        <Avatar className={cn(
          "transition-all",
          compact ? "h-9 w-9" : "h-12 w-12 ring-2",
          isSelected ? "ring-primary/50" : "ring-white dark:ring-slate-800"
        )}>
          <AvatarImage src={image} className="object-cover" />
          <AvatarFallback className={cn(
            "bg-gradient-to-br text-white font-semibold",
            gradient,
            compact ? "text-[10px]" : "text-sm"
          )}>
            {isCustomer ? '🏪' : '👤'}
          </AvatarFallback>
        </Avatar>
        {/* Online indicator - commented out until real-time status is implemented
        {!compact && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
        )}
        */}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5 min-w-0">
          <span 
            className={cn(
              "font-medium flex-1 min-w-0 break-words",
              compact ? "text-xs" : "text-sm",
              unreadCount > 0 ? "font-semibold text-foreground" : "text-foreground/90"
            )}
            title={title}
          >
            {title}
          </span>
          
          {/* Meta info */}
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {!compact && conversation.service?.price && (
               <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 hidden sm:flex">
                 {conversation.service.currency || 'CHF'} {conversation.service.price}
               </Badge>
            )}
            {(() => {
              if (!conversation.lastMessageAt) return null;
              const timestamp = formatTimestamp(conversation.lastMessageAt);
              if (!timestamp) return null;
              return (
                <span className={cn(
                  "text-[10px] whitespace-nowrap text-right",
                  unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
                )} title={new Date(conversation.lastMessageAt).toLocaleString()}>
                  {timestamp}
                </span>
              );
            })()}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {conversation.flaggedForReview && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
          <div className="flex flex-col min-w-0 w-full">
            {subtitle && (
              <span 
                className="text-xs text-muted-foreground break-words mb-0.5"
                title={subtitle}
              >
                {subtitle}
              </span>
            )}
            <p 
              className={cn(
                "break-words line-clamp-2",
                compact ? "text-[10px]" : "text-xs",
                unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"
              )}
              title={conversation.lastMessagePreview || (conversation.lastMessageAt ? 'No message preview' : '👋 Start a conversation')}
            >
              {conversation.lastMessagePreview || (conversation.lastMessageAt ? 'No message preview' : '👋 Start a conversation')}
            </p>
          </div>
        </div>
      </div>

      {unreadCount > 0 && (
        <Badge className={cn(
          "ml-2 flex items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 font-bold",
          compact ? "h-5 min-w-5 px-1 text-[10px]" : "h-6 min-w-6 px-2 text-xs"
        )}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </button>
  );
}

export default ConversationList;
