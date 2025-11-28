/**
 * BookingCard Component
 * 
 * Displays a single booking with status and actions
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  bookingNumber: string;
  status: string;
  requestedStartTime: string;
  requestedEndTime: string;
  confirmedStartTime: string | null;
  confirmedEndTime: string | null;
  alternativeStartTime: string | null;
  alternativeEndTime: string | null;
  alternativeMessage: string | null;
  alternativeExpiresAt: string | null;
  customerMessage: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  vendorMessage: string | null;
  rejectionReason: string | null;
  queuePosition?: number | null;
  createdAt: string;
}

interface BookingCardProps {
  booking: Booking;
  role: 'customer' | 'vendor';
  serviceName?: string;
  otherPartyName?: string;
  otherPartyImage?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onProposeAlternative?: () => void;
  onAcceptAlternative?: () => void;
  onCancel?: () => void;
  onViewDetails?: () => void;
  onChat?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  pending: { 
    color: 'bg-amber-100 text-amber-700 border-amber-200', 
    label: 'Pending',
    icon: <Clock className="w-3 h-3" />
  },
  accepted: { 
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    label: 'Accepted',
    icon: <Check className="w-3 h-3" />
  },
  rejected: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    label: 'Rejected',
    icon: <X className="w-3 h-3" />
  },
  alternative_proposed: { 
    color: 'bg-purple-100 text-purple-700 border-purple-200', 
    label: 'Alternative Proposed',
    icon: <RefreshCw className="w-3 h-3" />
  },
  confirmed: { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    label: 'Confirmed',
    icon: <Check className="w-3 h-3" />
  },
  in_progress: { 
    color: 'bg-blue-100 text-blue-700 border-blue-200', 
    label: 'In Progress',
    icon: <Clock className="w-3 h-3" />
  },
  completed: { 
    color: 'bg-green-100 text-green-700 border-green-200', 
    label: 'Completed',
    icon: <Check className="w-3 h-3" />
  },
  cancelled: { 
    color: 'bg-gray-100 text-gray-700 border-gray-200', 
    label: 'Cancelled',
    icon: <X className="w-3 h-3" />
  },
  no_show: { 
    color: 'bg-red-100 text-red-700 border-red-200', 
    label: 'No Show',
    icon: <AlertCircle className="w-3 h-3" />
  },
};

export function BookingCard({
  booking,
  role,
  serviceName,
  otherPartyName,
  otherPartyImage,
  onAccept,
  onReject,
  onProposeAlternative,
  onAcceptAlternative,
  onCancel,
  onViewDetails,
  onChat,
  isLoading,
}: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
  const displayTime = booking.confirmedStartTime || booking.requestedStartTime;
  const displayEndTime = booking.confirmedEndTime || booking.requestedEndTime;
  const isUpcoming = !isPast(new Date(displayTime));

  const canAccept = role === 'vendor' && booking.status === 'pending';
  const canReject = role === 'vendor' && booking.status === 'pending';
  const canProposeAlternative = role === 'vendor' && booking.status === 'pending';
  const canAcceptAlternative = role === 'customer' && booking.status === 'alternative_proposed';
  const canCancel = ['pending', 'accepted', 'confirmed', 'alternative_proposed'].includes(booking.status);

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      isUpcoming ? "" : "opacity-80"
    )}>
      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherPartyImage} />
            <AvatarFallback>
              {otherPartyName?.slice(0, 2).toUpperCase() || '??'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{otherPartyName || 'Unknown'}</p>
            {serviceName && (
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            )}
          </div>
        </div>
        <Badge 
          variant="outline" 
          className={cn("flex items-center gap-1", statusConfig.color)}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">
            {format(new Date(displayTime), 'EEEE, MMM d, yyyy')}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>
            {format(new Date(displayTime), 'HH:mm')} - {format(new Date(displayEndTime), 'HH:mm')}
          </span>
          {isUpcoming && (
            <span className="text-muted-foreground">
              ({formatDistanceToNow(new Date(displayTime), { addSuffix: true })})
            </span>
          )}
        </div>

        {/* Alternative Time (if proposed) */}
        {booking.status === 'alternative_proposed' && booking.alternativeStartTime && (
          <div className="p-3 bg-purple-50 rounded-lg space-y-2 border border-purple-200">
            <p className="text-sm font-medium text-purple-800">
              Alternative time proposed:
            </p>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(booking.alternativeStartTime), 'EEE, MMM d')}</span>
              <Clock className="w-4 h-4 ml-2" />
              <span>
                {format(new Date(booking.alternativeStartTime), 'HH:mm')} - 
                {format(new Date(booking.alternativeEndTime!), 'HH:mm')}
              </span>
            </div>
            {booking.alternativeMessage && (
              <p className="text-sm text-purple-600">{booking.alternativeMessage}</p>
            )}
            {booking.alternativeExpiresAt && (
              <p className="text-xs text-purple-500">
                Expires {formatDistanceToNow(new Date(booking.alternativeExpiresAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )}

        {/* Queue Position */}
        {booking.queuePosition && booking.status === 'pending' && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Clock className="w-4 h-4" />
            <span>Queue position: #{booking.queuePosition}</span>
          </div>
        )}

        {/* Contact Info */}
        {role === 'vendor' && (
          <div className="space-y-1">
            {booking.customerPhone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{booking.customerPhone}</span>
              </div>
            )}
            {booking.customerAddress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{booking.customerAddress}</span>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {booking.customerMessage && (
          <div className="p-2 bg-muted rounded text-sm">
            <p className="text-xs font-medium text-muted-foreground mb-1">Customer Note</p>
            <p>{booking.customerMessage}</p>
          </div>
        )}

        {booking.rejectionReason && (
          <div className="p-2 bg-red-50 rounded text-sm text-red-700">
            <p className="text-xs font-medium mb-1">Rejection Reason</p>
            <p>{booking.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          {canAccept && (
            <Button 
              size="sm" 
              onClick={onAccept}
              disabled={isLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
          )}
          
          {canReject && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={onReject}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
            </Button>
          )}
          
          {canProposeAlternative && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onProposeAlternative}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Propose Alternative
            </Button>
          )}

          {canAcceptAlternative && (
            <Button 
              size="sm" 
              onClick={onAcceptAlternative}
              disabled={isLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept New Time
            </Button>
          )}
          
          {canCancel && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}

          {onChat && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onChat}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Chat
            </Button>
          )}

          {onViewDetails && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onViewDetails}
              className="ml-auto"
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Booking Number */}
        <p className="text-xs text-muted-foreground">
          Booking #{booking.bookingNumber}
        </p>
      </CardContent>
    </Card>
  );
}

export default BookingCard;

