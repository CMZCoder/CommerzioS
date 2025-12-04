/**
 * ConversationList Component (Redesigned)
 * 
 * Modern chat conversation list with smart filtering
 * Features:
 * - Unified header with search and filter dropdown
 * - Clean filter dropdown (replaces cluttered tabs)
 * - Inline unread badges with counts per category
 * - Professional conversation cards
 * - Mobile-first responsive design
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { 
  MessageSquare, 
  AlertCircle, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  RefreshCw, 
  Archive, 
  Clock, 
  Heart, 
  Inbox,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
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

// Filter type definition
type FilterType = 'all' | 'active' | 'archived' | 'expired' | 'saved';

// Filter configuration with icons and labels
const FILTERS: { value: FilterType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'all', label: 'All Messages', icon: <Inbox className="w-4 h-4" />, description: 'Show all conversations' },
  { value: 'active', label: 'Active', icon: <MessageSquare className="w-4 h-4" />, description: 'Active conversations' },
  { value: 'saved', label: 'Saved Services', icon: <Heart className="w-4 h-4" />, description: 'From saved services' },
  { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" />, description: 'Archived conversations' },
  { value: 'expired', label: 'Expired', icon: <Clock className="w-4 h-4" />, description: 'Expired conversations' },
];

// Avatar gradient generator
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

// Compact timestamp formatter
const formatTimestamp = (dateString: string | null): string | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return formatDistanceToNow(date, { addSuffix: false });
  } catch {
    return null;
  }
};

export function ConversationList({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  role = 'both',
  className,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<FilterType>('active');
  const queryClient = useQueryClient();
  
  // Fetch saved services for "saved" filter
  const { data: savedServices = [] } = useQuery<Array<{ serviceId: string }>>({
    queryKey: ['/api/favorites'],
    queryFn: async () => {
      const res = await fetch('/api/favorites', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((fav: any) => ({ 
        serviceId: fav.serviceId || fav.service?.id 
      })).filter((fav: any) => fav.serviceId);
    },
    enabled: activeFilter === 'saved',
  });

  const savedServiceIds = new Set(savedServices.map(s => s.serviceId).filter(Boolean));
  
  // Fetch conversations
  const { data: conversations = [], isLoading, error, refetch } = useQuery<Conversation[]>({
    queryKey: ['conversations', role, currentUserId, activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ role });
      
      if (activeFilter === 'all') {
        params.append('status', 'all');
      } else if (activeFilter === 'saved') {
        params.append('savedOnly', 'true');
      } else if (activeFilter === 'active' || activeFilter === 'archived' || activeFilter === 'expired') {
        params.append('status', activeFilter);
      }
      
      const res = await fetchApi(`/api/chat/conversations?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch conversations');
      }
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  // Listen for refetch events
  useEffect(() => {
    const handleRefetch = () => refetch();
    window.addEventListener('refetch-conversations', handleRefetch);
    return () => window.removeEventListener('refetch-conversations', handleRefetch);
  }, [refetch]);

  // Calculate unread count for current user
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => {
      const isCustomer = conv.customerId === currentUserId;
      return sum + (isCustomer ? conv.customerUnreadCount : conv.vendorUnreadCount);
    }, 0);
  }, [conversations, currentUserId]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    const term = searchTerm.toLowerCase();
    return conversations.filter(conv => {
      return (
        conv.lastMessagePreview?.toLowerCase().includes(term) ||
        conv.service?.title?.toLowerCase().includes(term) ||
        conv.vendor?.firstName?.toLowerCase().includes(term) ||
        conv.vendor?.lastName?.toLowerCase().includes(term) ||
        conv.customer?.firstName?.toLowerCase().includes(term) ||
        conv.customer?.lastName?.toLowerCase().includes(term)
      );
    });
  }, [conversations, searchTerm]);

  // Group conversations by other party
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
      }

      groups[partyId].conversations.push(conv);
      groups[partyId].unreadCount += unreadCount;
      
      if (conv.lastMessageAt) {
        if (!groups[partyId].latestMessageAt || new Date(conv.lastMessageAt) > new Date(groups[partyId].latestMessageAt!)) {
          groups[partyId].latestMessageAt = conv.lastMessageAt;
        }
      }
    });

    // Sort conversations within groups
    Object.values(groups).forEach(group => {
      group.conversations.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
    });

    // Return sorted groups
    return Object.values(groups).sort((a, b) => {
      const dateA = a.latestMessageAt ? new Date(a.latestMessageAt).getTime() : 0;
      const dateB = b.latestMessageAt ? new Date(b.latestMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredConversations, currentUserId]);

  // Toggle group expansion
  const toggleGroup = (partyId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [partyId]: !prev[partyId]
    }));
  };

  // Auto-expand groups with selected conversation or multiple items
  useEffect(() => {
    if (groupedConversations.length > 0) {
      setExpandedGroups(prev => {
        const newExpanded: Record<string, boolean> = { ...prev };
        let hasChanges = false;
        
        groupedConversations.forEach(group => {
          const hasSelected = group.conversations.some(c => c.id === selectedConversationId);
          const hasMultiple = group.conversations.length > 1;
          
          if ((hasSelected || hasMultiple) && !newExpanded[group.partyId]) {
            newExpanded[group.partyId] = true;
            hasChanges = true;
          }
        });
        
        return hasChanges ? newExpanded : prev;
      });
    }
  }, [selectedConversationId, groupedConversations]);

  // Get current filter config
  const currentFilter = FILTERS.find(f => f.value === activeFilter) || FILTERS[0];

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-slate-900", className)} data-testid="conversation-list">
      {/* Unified Header */}
      <div className="border-b bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 p-3">
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 justify-between h-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50"
                data-testid="chat-filter-dropdown"
              >
                <div className="flex items-center gap-2">
                  {currentFilter.icon}
                  <span className="font-medium">{currentFilter.label}</span>
                  {totalUnread > 0 && activeFilter !== 'all' && (
                    <Badge className="h-5 px-1.5 text-[10px] bg-primary/90">
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {FILTERS.map((filter) => (
                <DropdownMenuItem 
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className="flex items-center justify-between py-2.5 cursor-pointer"
                  data-testid={`chat-filter-${filter.value}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "text-muted-foreground",
                      activeFilter === filter.value && "text-primary"
                    )}>
                      {filter.icon}
                    </span>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-sm",
                        activeFilter === filter.value && "font-semibold text-primary"
                      )}>
                        {filter.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {filter.description}
                      </span>
                    </div>
                  </div>
                  {activeFilter === filter.value && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Toggle */}
          <Button
            variant={isSearchOpen ? "default" : "ghost"}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchTerm('');
            }}
            data-testid="chat-search-toggle"
          >
            {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={() => refetch()}
            disabled={isLoading}
            title="Refresh"
            data-testid="chat-refresh"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Expandable Search Input */}
        {isSearchOpen && (
          <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              autoFocus
              data-testid="chat-search"
            />
          </div>
        )}
      </div>

      {/* Conversation List */}
      {isLoading ? (
        <div className="p-4 space-y-3 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center flex-1">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mb-4">
            {searchTerm ? (
              <Search className="w-10 h-10 text-primary/60" />
            ) : (
              <MessageSquare className="w-10 h-10 text-primary/60" />
            )}
          </div>
          <p className="font-semibold text-lg mb-1">
            {searchTerm ? 'No results found' : 'No conversations'}
          </p>
          <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
            {searchTerm 
              ? 'Try a different search term'
              : activeFilter === 'saved' 
                ? "Save services to see conversations here"
                : activeFilter === 'archived'
                  ? "No archived conversations"
                  : activeFilter === 'expired'
                    ? "No expired conversations"
                    : "Start chatting with vendors or customers"
            }
          </p>
          {!searchTerm && activeFilter === 'active' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-full">
              <Sparkles className="w-3 h-3" />
              Click "Message" on any service to start
            </div>
          )}
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1" data-testid="conversation-items">
            {groupedConversations.map((group) => {
              const isGroupExpanded = expandedGroups[group.partyId];
              const hasMultiple = group.conversations.length > 1;
              
              // Single conversation - render directly
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

              // Multiple conversations - render group
              return (
                <div key={group.partyId} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.partyId)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                      "hover:bg-slate-100 dark:hover:bg-slate-800/50",
                      isGroupExpanded && "bg-slate-50 dark:bg-slate-800/30"
                    )}
                    data-testid="conversation-group"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-slate-800">
                        <AvatarImage src={group.partyImage} className="object-cover" />
                        <AvatarFallback className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {group.partyName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                        <div className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Folder className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate">{group.partyName}</span>
                        {group.unreadCount > 0 && (
                          <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-primary">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {group.conversations.length} conversations
                      </p>
                    </div>
                    
                    {isGroupExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
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
                            image={serviceImage}
                            gradient={getAvatarGradient(conversation.id)}
                            unreadCount={unreadCount}
                            isCustomer={isCustomer}
                            compact
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* Footer */}
      {filteredConversations.length > 0 && (
        <div className="p-3 border-t bg-slate-50/50 dark:bg-slate-900/50">
          <p className="text-xs text-center text-muted-foreground">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
}

// Conversation Item Component
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
        "w-full flex items-center gap-3 rounded-xl text-left transition-all",
        compact ? "p-2" : "p-3",
        isSelected 
          ? "bg-primary/10 ring-2 ring-primary/30" 
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50",
        unreadCount > 0 && !isSelected && "bg-blue-50/50 dark:bg-blue-950/20"
      )}
      data-testid="conversation-item"
    >
      <div className="relative flex-shrink-0">
        <Avatar className={cn(
          "transition-all ring-2",
          compact ? "h-9 w-9" : "h-12 w-12",
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
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            "truncate font-medium",
            compact ? "text-xs" : "text-sm",
            unreadCount > 0 && "font-semibold"
          )}>
            {title}
          </span>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!compact && conversation.service?.price && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 hidden sm:flex">
                {conversation.service.currency || 'CHF'} {conversation.service.price}
              </Badge>
            )}
            {conversation.lastMessageAt && (
              <span className={cn(
                "text-[10px] whitespace-nowrap",
                unreadCount > 0 ? "text-primary font-medium" : "text-muted-foreground"
              )} data-testid="message-timestamp">
                {formatTimestamp(conversation.lastMessageAt)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {conversation.flaggedForReview && (
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          )}
          <div className="flex flex-col min-w-0 w-full">
            {subtitle && (
              <span className="text-xs text-muted-foreground truncate mb-0.5">
                {subtitle}
              </span>
            )}
            <p className={cn(
              "truncate",
              compact ? "text-[10px]" : "text-xs",
              unreadCount > 0 ? "text-foreground/80 font-medium" : "text-muted-foreground"
            )}>
              {conversation.lastMessagePreview || '👋 Start a conversation'}
            </p>
          </div>
        </div>
      </div>

      {unreadCount > 0 && (
        <Badge 
          className={cn(
            "flex-shrink-0 rounded-full bg-primary shadow-lg shadow-primary/25 font-bold",
            compact ? "h-5 min-w-5 px-1 text-[10px]" : "h-6 min-w-6 px-2 text-xs"
          )}
          data-testid="unread-count"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </button>
  );
}

export default ConversationList;
