/**
 * DisputeCard Component
 * 
 * Summary card for displaying a dispute in a list view
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertCircle,
  Clock,
  MessageSquare,
  Bot,
  Gavel,
  Check,
  ExternalLink,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

type DisputePhase = 
  | 'phase_1' 
  | 'phase_2' 
  | 'phase_3_pending' 
  | 'phase_3_ai' 
  | 'phase_3_external' 
  | 'resolved';

type DisputeStatus = 
  | 'open'
  | 'under_review'
  | 'resolved_customer'
  | 'resolved_vendor'
  | 'resolved_split'
  | 'closed';

interface DisputeCardProps {
  dispute: {
    id: string;
    bookingId: string;
    bookingNumber?: string;
    reason: string;
    description: string;
    status: DisputeStatus;
    currentPhase?: DisputePhase;
    escrowAmount?: string;
    createdAt: string;
    deadline?: string | null;
  };
  otherParty: {
    name: string;
    avatar?: string;
    role: 'customer' | 'vendor';
  };
  serviceName?: string;
  onViewDetails?: () => void;
  className?: string;
}

const PHASE_CONFIG: Record<DisputePhase, { 
  label: string; 
  icon: React.ElementType; 
  color: string 
}> = {
  phase_1: { 
    label: 'Negotiation', 
    icon: MessageSquare, 
    color: 'bg-blue-100 text-blue-700' 
  },
  phase_2: { 
    label: 'AI Mediation', 
    icon: Bot, 
    color: 'bg-purple-100 text-purple-700' 
  },
  phase_3_pending: { 
    label: 'AI Decision Review', 
    icon: Gavel, 
    color: 'bg-amber-100 text-amber-700' 
  },
  phase_3_ai: { 
    label: 'AI Decided', 
    icon: Check, 
    color: 'bg-green-100 text-green-700' 
  },
  phase_3_external: { 
    label: 'External Resolution', 
    icon: ExternalLink, 
    color: 'bg-orange-100 text-orange-700' 
  },
  resolved: { 
    label: 'Resolved', 
    icon: Check, 
    color: 'bg-green-100 text-green-700' 
  },
};

const STATUS_CONFIG: Record<DisputeStatus, { 
  label: string; 
  color: string 
}> = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  resolved_customer: { label: 'Customer Favored', color: 'bg-green-100 text-green-700' },
  resolved_vendor: { label: 'Vendor Favored', color: 'bg-green-100 text-green-700' },
  resolved_split: { label: 'Split Resolution', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-700' },
};

const REASON_LABELS: Record<string, string> = {
  service_not_provided: 'Service Not Provided',
  poor_quality: 'Poor Quality',
  wrong_service: 'Wrong Service',
  overcharged: 'Overcharged',
  no_show: 'No Show',
  other: 'Other',
};

export function DisputeCard({
  dispute,
  otherParty,
  serviceName,
  onViewDetails,
  className,
}: DisputeCardProps) {
  const phaseConfig = dispute.currentPhase ? PHASE_CONFIG[dispute.currentPhase] : null;
  const statusConfig = STATUS_CONFIG[dispute.status];
  const PhaseIcon = phaseConfig?.icon || AlertCircle;

  const isActive = dispute.status === 'open' || dispute.status === 'under_review';
  const isResolved = dispute.status.startsWith('resolved_') || dispute.status === 'closed';

  const getTimeRemaining = () => {
    if (!dispute.deadline) return null;
    const deadline = new Date(dispute.deadline);
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card 
      className={cn(
        'transition-all hover:shadow-md',
        isActive && 'border-l-4 border-l-amber-500',
        isResolved && 'opacity-75',
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParty.avatar} />
              <AvatarFallback>
                {otherParty.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{otherParty.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {otherParty.role} • {serviceName || 'Service'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
            {phaseConfig && isActive && (
              <Badge variant="outline" className="text-xs">
                <PhaseIcon className="w-3 h-3 mr-1" />
                {phaseConfig.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reason & Description */}
        <div>
          <p className="text-sm font-medium">
            {REASON_LABELS[dispute.reason] || dispute.reason}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {dispute.description}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {dispute.escrowAmount && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                CHF {parseFloat(dispute.escrowAmount).toFixed(2)}
              </span>
            )}
            <span>
              Opened {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          {timeRemaining && isActive && (
            <Badge 
              variant={timeRemaining === 'Expired' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              <Clock className="w-3 h-3 mr-1" />
              {timeRemaining}
            </Badge>
          )}
        </div>

        {/* Booking Reference */}
        {dispute.bookingNumber && (
          <p className="text-xs text-muted-foreground">
            Booking #{dispute.bookingNumber}
          </p>
        )}

        {/* View Details Button */}
        {onViewDetails && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2"
            onClick={onViewDetails}
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
