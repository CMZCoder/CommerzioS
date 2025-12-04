/**
 * DisputeTimeline Component
 * 
 * Displays a chronological timeline of all dispute events
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  MessageSquare,
  Bot,
  Gavel,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  FileText,
  AlertCircle,
  DollarSign,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type TimelineEventType = 
  | 'dispute_opened'
  | 'evidence_submitted'
  | 'counter_offer'
  | 'offer_accepted'
  | 'escalated_phase_2'
  | 'ai_analysis'
  | 'ai_options_generated'
  | 'option_selected'
  | 'escalated_phase_3'
  | 'ai_decision'
  | 'decision_executed'
  | 'external_resolution'
  | 'dispute_resolved';

interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  userId?: string;
  userRole?: 'customer' | 'vendor' | 'system';
  metadata?: Record<string, any>;
  createdAt: string;
}

interface DisputeTimelineProps {
  events: TimelineEvent[];
  currentUserId: string;
  customerId: string;
  vendorId: string;
  className?: string;
}

const EVENT_CONFIG: Record<TimelineEventType, { 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
}> = {
  dispute_opened: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  },
  evidence_submitted: { 
    icon: FileText, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  counter_offer: { 
    icon: DollarSign, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100' 
  },
  offer_accepted: { 
    icon: Check, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  escalated_phase_2: { 
    icon: ArrowRight, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100' 
  },
  ai_analysis: { 
    icon: Bot, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-100' 
  },
  ai_options_generated: { 
    icon: Bot, 
    color: 'text-indigo-600', 
    bgColor: 'bg-indigo-100' 
  },
  option_selected: { 
    icon: Check, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  },
  escalated_phase_3: { 
    icon: ArrowRight, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100' 
  },
  ai_decision: { 
    icon: Gavel, 
    color: 'text-slate-600', 
    bgColor: 'bg-slate-100' 
  },
  decision_executed: { 
    icon: Check, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
  external_resolution: { 
    icon: ExternalLink, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  },
  dispute_resolved: { 
    icon: Check, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  },
};

export function DisputeTimeline({
  events,
  currentUserId,
  customerId,
  vendorId,
  className,
}: DisputeTimelineProps) {
  const getUserLabel = (userId?: string, userRole?: string) => {
    if (userRole === 'system') return 'System';
    if (!userId) return 'Unknown';
    if (userId === currentUserId) return 'You';
    if (userId === customerId) return 'Customer';
    if (userId === vendorId) return 'Vendor';
    return 'User';
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Dispute Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No events yet
          </p>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            {/* Events */}
            <div className="space-y-4">
              {sortedEvents.map((event, index) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = config?.icon || Clock;
                const isFirst = index === 0;
                const userLabel = getUserLabel(event.userId, event.userRole);

                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div 
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10',
                        config?.bgColor || 'bg-muted',
                        isFirst && 'ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', config?.color || 'text-muted-foreground')} />
                    </div>

                    {/* Content */}
                    <div className={cn(
                      'flex-1 pb-4',
                      index !== sortedEvents.length - 1 && 'border-b'
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </p>
                          {event.userId && (
                            <Badge variant="outline" className="text-xs mt-1">
                              <User className="w-3 h-3 mr-1" />
                              {userLabel}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Metadata Display */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                          {event.metadata.percent !== undefined && (
                            <p>
                              <span className="text-muted-foreground">Offer: </span>
                              {event.metadata.percent}% to customer
                            </p>
                          )}
                          {event.metadata.optionLabel && (
                            <p>
                              <span className="text-muted-foreground">Option: </span>
                              {event.metadata.optionLabel}
                            </p>
                          )}
                          {event.metadata.message && (
                            <p className="text-muted-foreground italic">
                              "{event.metadata.message}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
