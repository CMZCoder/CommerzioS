/**
 * QuickActions Component
 * 
 * Floating action button for logged-in users with quick access to:
 * - Create new service
 * - View messages (with unread count)
 * - Check bookings (with pending count)
 * - View notifications (with unread count)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Plus, 
  MessageCircle, 
  Calendar, 
  Bell, 
  X,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface QuickActionsProps {
  className?: string;
}

interface CountsData {
  unreadMessages?: number;
  pendingBookings?: number;
  unreadNotifications?: number;
}

export function QuickActions({ className }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Fetch counts for badges
  const { data: counts } = useQuery<CountsData>({
    queryKey: ['/api/quick-actions/counts'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const actions = [
    {
      icon: Plus,
      label: 'Create Service',
      href: '/create-service',
      count: undefined,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      href: '/chat',
      count: counts?.unreadMessages,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Calendar,
      label: 'Bookings',
      href: '/bookings',
      count: counts?.pendingBookings,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: Bell,
      label: 'Notifications',
      href: '/notifications',
      count: counts?.unreadNotifications,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  const totalCount = (counts?.unreadMessages || 0) + 
                     (counts?.pendingBookings || 0) + 
                     (counts?.unreadNotifications || 0);

  return (
    <div className={cn('fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2', className)}>
      {/* Action buttons (shown when open) */}
      <div
        className={cn(
          'flex flex-col gap-2 transition-all duration-300',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        {actions.map((action, index) => (
          <Link key={action.href} href={action.href}>
            <Button
              variant="default"
              size="lg"
              className={cn(
                'relative rounded-full shadow-lg transition-all duration-200',
                'hover:scale-105',
                action.color
              )}
              style={{
                transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              }}
              onClick={() => setIsOpen(false)}
            >
              <action.icon className="h-5 w-5 text-white" />
              <span className="text-white text-sm font-medium">{action.label}</span>
              {action.count && action.count > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
                >
                  {action.count > 99 ? '99+' : action.count}
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        variant="default"
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-xl transition-all duration-300',
          'hover:scale-110 active:scale-95',
          isOpen ? 'bg-gray-600 hover:bg-gray-700' : 'bg-primary hover:bg-primary/90'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <ChevronUp className="h-6 w-6" />
            {totalCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center rounded-full text-xs"
              >
                {totalCount > 99 ? '99+' : totalCount}
              </Badge>
            )}
          </>
        )}
      </Button>
    </div>
  );
}

export default QuickActions;
