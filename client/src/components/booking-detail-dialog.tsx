import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchApi } from '@/lib/config';
import {
    Calendar,
    Clock,
    MapPin,
    MessageSquare,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Star,
    ExternalLink,
    Loader2,
    Package,
    User,
    Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { OpenDisputeModal } from '@/components/disputes';

export interface Booking {
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
    totalPrice: string | null;
    currency: string;
    createdAt: string;
    service?: {
        id: string;
        title: string;
        price: string;
        images: string[];
    };
    vendor?: {
        id: string;
        firstName: string;
        lastName: string;
        profileImageUrl?: string;
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
    pending: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="w-4 h-4" />,
        description: "Waiting for vendor response"
    },
    accepted: {
        label: "Accepted",
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle2 className="w-4 h-4" />,
        description: "Vendor accepted your request"
    },
    alternative_proposed: {
        label: "Alternative Proposed",
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        icon: <RefreshCw className="w-4 h-4" />,
        description: "Vendor proposed a different time"
    },
    confirmed: {
        label: "Confirmed",
        color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        icon: <CheckCircle2 className="w-4 h-4" />,
        description: "Booking is confirmed"
    },
    in_progress: {
        label: "In Progress",
        color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        description: "Service is being performed"
    },
    completed: {
        label: "Completed",
        color: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        icon: <CheckCircle2 className="w-4 h-4" />,
        description: "Service completed"
    },
    cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="w-4 h-4" />,
        description: "Booking was cancelled"
    },
    rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="w-4 h-4" />,
        description: "Vendor declined the request"
    },
};

interface BookingDetailDialogProps {
    booking: Booking | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onBookingUpdate?: () => void;
}

export function BookingDetailDialog({ booking, open, onOpenChange, onBookingUpdate }: BookingDetailDialogProps) {
    const queryClient = useQueryClient();
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);

    // Cancel booking mutation
    const cancelMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await fetchApi(`/api/bookings/${bookingId}/cancel`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to cancel booking');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
            toast.success('Booking cancelled successfully');
            setShowCancelDialog(false);
            onOpenChange(false);
            if (onBookingUpdate) onBookingUpdate();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to cancel booking');
        },
    });

    // Accept alternative time mutation
    const acceptAlternativeMutation = useMutation({
        mutationFn: async (bookingId: string) => {
            const res = await fetchApi(`/api/bookings/${bookingId}/accept-alternative`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to accept alternative');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
            toast.success('Alternative time accepted!');
            onOpenChange(false);
            if (onBookingUpdate) onBookingUpdate();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to accept alternative');
        },
    });

    const getStatusInfo = (status: string) => statusConfig[status] || statusConfig.pending;

    if (!booking) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Booking Details
                        </DialogTitle>
                        <DialogDescription>
                            #{booking.bookingNumber}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Status */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge className={getStatusInfo(booking.status).color}>
                                {getStatusInfo(booking.status).icon}
                                <span className="ml-1">{getStatusInfo(booking.status).label}</span>
                            </Badge>
                        </div>

                        {/* Service Info */}
                        <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <Package className="w-4 h-4" /> Service
                            </h4>
                            <Card className="overflow-hidden">
                                <CardContent className="p-0 flex items-center gap-3">
                                    {booking.service?.images?.[0] ? (
                                        <img
                                            src={booking.service.images[0]}
                                            alt={booking.service.title}
                                            className="w-20 h-20 object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-muted flex items-center justify-center">
                                            <Package className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="p-3">
                                        <p className="font-medium">{booking.service?.title || 'Service'}</p>
                                        {booking.totalPrice && (
                                            <p className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                                {booking.currency} {parseFloat(booking.totalPrice).toFixed(2)}
                                            </p>
                                        )}
                                        <Link href={`/service/${booking.service?.id}`}>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                                View Service <ExternalLink className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Vendor Info */}
                        {booking.vendor && (
                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2">
                                    <User className="w-4 h-4" /> Service Provider
                                </h4>
                                <div className="flex items-center gap-3 p-3 rounded-lg border">
                                    <Avatar className="w-12 h-12">
                                        <AvatarImage src={booking.vendor.profileImageUrl} />
                                        <AvatarFallback>
                                            {booking.vendor.firstName?.[0]}{booking.vendor.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">
                                            {booking.vendor.firstName} {booking.vendor.lastName}
                                        </p>
                                        <Link href={`/users/${booking.vendor.id}`}>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                                View Profile <ExternalLink className="w-3 h-3 ml-1" />
                                            </Button>
                                        </Link>
                                    </div>
                                    <Link href={`/chat?vendor=${booking.vendor.id}&booking=${booking.id}&service=${booking.service?.id}`}>
                                        <Button size="sm" variant="outline">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            Chat
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Date/Time */}
                        <div className="space-y-3">
                            <h4 className="font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Schedule
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground mb-1">Start</p>
                                    <p className="font-medium text-sm">
                                        {format(new Date(booking.requestedStartTime), 'PPp')}
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg border">
                                    <p className="text-xs text-muted-foreground mb-1">End</p>
                                    <p className="font-medium text-sm">
                                        {format(new Date(booking.requestedEndTime), 'PPp')}
                                    </p>
                                </div>
                            </div>

                            {/* Alternative Proposal */}
                            {booking.status === 'alternative_proposed' && booking.alternativeStartTime && (
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <p className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                                        <RefreshCw className="w-4 h-4 inline mr-1" />
                                        Alternative Time Proposed
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">New Start</p>
                                            <p className="font-medium text-sm">
                                                {format(new Date(booking.alternativeStartTime), 'PPp')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 dark:text-blue-400">New End</p>
                                            <p className="font-medium text-sm">
                                                {booking.alternativeEndTime && format(new Date(booking.alternativeEndTime), 'PPp')}
                                            </p>
                                        </div>
                                    </div>
                                    {booking.alternativeMessage && (
                                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                                            "{booking.alternativeMessage}"
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => acceptAlternativeMutation.mutate(booking.id)}
                                            disabled={acceptAlternativeMutation.isPending}
                                            className="flex-1"
                                        >
                                            {acceptAlternativeMutation.isPending ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                            )}
                                            Accept
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowCancelDialog(true)}
                                            className="flex-1"
                                        >
                                            <XCircle className="w-4 h-4 mr-1" />
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        {booking.customerAddress && (
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Location
                                </h4>
                                <p className="text-sm text-muted-foreground p-3 rounded-lg border">
                                    {booking.customerAddress}
                                </p>
                            </div>
                        )}

                        {/* Messages */}
                        {(booking.customerMessage || booking.vendorMessage || booking.rejectionReason) && (
                            <div className="space-y-3">
                                <h4 className="font-medium flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Messages
                                </h4>
                                {booking.customerMessage && (
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-xs text-muted-foreground mb-1">Your message</p>
                                        <p className="text-sm">{booking.customerMessage}</p>
                                    </div>
                                )}
                                {booking.vendorMessage && (
                                    <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1">Vendor response</p>
                                        <p className="text-sm">{booking.vendorMessage}</p>
                                    </div>
                                )}
                                {booking.rejectionReason && (
                                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Reason for decline</p>
                                        <p className="text-sm">{booking.rejectionReason}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Completed - Leave Review */}
                        {booking.status === 'completed' && booking.service && (
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
                                <Star className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                                <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                                    How was your experience?
                                </p>
                                <Link href={`/service/${booking.service.id}?review=true`}>
                                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                                        <Star className="w-4 h-4 mr-1" />
                                        Leave a Review
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                        {/* Cancel button for pending/accepted bookings */}
                        {['pending', 'accepted', 'confirmed'].includes(booking.status) && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowCancelDialog(true)}
                                className="w-full sm:w-auto"
                            >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancel Booking
                            </Button>
                        )}
                        {/* Open Dispute button for completed/in_progress bookings */}
                        {['completed', 'in_progress'].includes(booking.status) && (
                            <Button
                                variant="outline"
                                onClick={() => setShowDisputeModal(true)}
                                className="w-full sm:w-auto border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            >
                                <Scale className="w-4 h-4 mr-1" />
                                Open Dispute
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => cancelMutation.mutate(booking.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : null}
                            Yes, Cancel
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Open Dispute Modal */}
            <OpenDisputeModal
                bookingId={booking.id}
                bookingNumber={booking.bookingNumber}
                serviceName={booking.service?.title || 'Service'}
                escrowAmount={parseFloat(booking.totalPrice || '0')}
                open={showDisputeModal}
                onOpenChange={(open) => setShowDisputeModal(open)}
                onSubmit={async (data) => {
                    // Open dispute via API
                    const response = await fetchApi(`/api/disputes/booking/${booking.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                    if (!response.ok) {
                        throw new Error('Failed to open dispute');
                    }
                    setShowDisputeModal(false);
                    toast.success("Dispute opened successfully");
                }}
            />
        </>
    );
}
