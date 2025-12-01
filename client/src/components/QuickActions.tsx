import { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  Bell,
  X,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

/**
 * QuickActions - Floating action button component for quick navigation
 * Provides fast access to common actions for logged-in users
 */
export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user } = useUser();

  // Get unread notification count
  const { data: notificationData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/notifications/unread-count', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get unread chat count
  const { data: chatData } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/chat/unread-count', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Get pending bookings count
  const { data: bookingsData } = useQuery({
    queryKey: ['pending-bookings-count'],
    queryFn: async () => {
      const res = await fetch('/api/vendor/bookings/pending-count', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  if (!user) {
    return null;
  }

  const actions: QuickAction[] = [
    {
      id: 'create',
      label: 'Create Service',
      icon: Plus,
      href: '/create-service',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      href: '/chat',
      badge: chatData?.count || 0,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      href: '/my-bookings',
      badge: bookingsData?.count || 0,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '/notifications',
      badge: notificationData?.count || 0,
    },
  ];

  const handleAction = (href: string) => {
    setIsOpen(false);
    navigate(href);
  };

  const totalBadge = (chatData?.count || 0) + 
    (bookingsData?.count || 0) + 
    (notificationData?.count || 0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons - shown when expanded */}
      <div
        className={cn(
          'flex flex-col-reverse gap-3 mb-3 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action) => (
          <div key={action.id} className="relative flex items-center gap-2">
            {/* Label */}
            <span className="bg-popover text-popover-foreground text-sm px-3 py-1.5 rounded-md shadow-lg whitespace-nowrap">
              {action.label}
            </span>
            
            {/* Button */}
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shadow-lg relative"
              onClick={() => handleAction(action.href)}
            >
              <action.icon className="h-5 w-5" />
              
              {/* Badge */}
              {action.badge && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-transform duration-300',
          isOpen && 'rotate-45'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <ChevronUp className="h-6 w-6" />
            {/* Total badge on main button */}
            {!isOpen && totalBadge > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalBadge > 99 ? '99+' : totalBadge}
              </span>
            )}
          </>
        )}
      </Button>
    </div>
  );
}
