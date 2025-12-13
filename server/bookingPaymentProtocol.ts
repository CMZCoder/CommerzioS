/**
 * Booking Payment Protocol Service
 * 
 * Implements the financial state machine for bookings:
 * - 24-Hour Capture Protocol (for Growth Model)
 * - 50/50 Default Split Rule (for no-shows/cancellations)
 * - Payment lifecycle management
 */

import { db } from "./db";
import { bookings, users, services, credits } from "@shared/schema";
import { eq, and, sql, lt, lte } from "drizzle-orm";
import { addCredits, deductCredits } from "./creditService";
import { createNotification } from "./notificationService";

// Types
export type PaymentState =
    | "PENDING_DEPOSIT"
    | "DEPOSIT_PAID"
    | "CAPTURE_SCHEDULED"
    | "CAPTURE_ATTEMPTED"
    | "CAPTURE_FAILED"
    | "FULLY_PAID"
    | "CASH_ON_SITE"
    | "CANCELLED"
    | "REFUNDED";

export type CancellationReason =
    | "USER_REQUESTED"
    | "VENDOR_REQUESTED"
    | "PAYMENT_FAILED"
    | "NO_SHOW"
    | "AUTO_CANCELLED";

export interface PaymentProtocolResult {
    success: boolean;
    message: string;
    newState?: PaymentState;
    vendorPayout?: number;
    platformFee?: number;
}

// Platform fee percentage (the 10% deposit IS the platform commission)
const PLATFORM_FEE_PERCENTAGE = 10;

// ===========================================
// 24-HOUR CAPTURE PROTOCOL
// ===========================================

/**
 * Calculate when to attempt remaining payment capture
 * T-24h before booking start time
 */
export function calculateCaptureTime(bookingStartTime: Date): Date {
    const captureTime = new Date(bookingStartTime);
    captureTime.setHours(captureTime.getHours() - 24);
    return captureTime;
}

/**
 * Calculate auto-cancel deadline
 * T-4h before booking start time
 */
export function calculateAutoCancelDeadline(bookingStartTime: Date): Date {
    const deadline = new Date(bookingStartTime);
    deadline.setHours(deadline.getHours() - 4);
    return deadline;
}

/**
 * Get bookings that need payment capture attempt
 * Called by scheduled job
 */
export async function getBookingsForCapture(): Promise<typeof bookings.$inferSelect[]> {
    const now = new Date();

    // Find bookings where:
    // 1. Status is 'accepted' or 'confirmed' 
    // 2. Vendor uses 'growth' model (10% deposit)
    // 3. Capture time has passed (T-24h before start)
    // 4. Not yet fully paid
    const eligibleBookings = await db
        .select()
        .from(bookings)
        .innerJoin(services, eq(bookings.serviceId, services.id))
        .where(
            and(
                sql`${bookings.status} IN ('accepted', 'confirmed')`,
                eq(services.vendorRiskModel, "growth"),
                // Additional payment state tracking would go here
                // For now, use a simple approach based on status
                sql`${bookings.requestedStartTime} > ${now}`,
                lte(sql`${bookings.requestedStartTime} - interval '24 hours'`, now)
            )
        );

    return eligibleBookings.map(b => b.bookings);
}

/**
 * Get bookings that should be auto-cancelled due to payment failure
 */
export async function getBookingsForAutoCancel(): Promise<typeof bookings.$inferSelect[]> {
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Find bookings where:
    // 1. Payment capture has failed
    // 2. Start time is within 4 hours
    // 3. Not yet cancelled
    // This is a simplified query - real implementation would track payment state
    const eligibleBookings = await db
        .select()
        .from(bookings)
        .where(
            and(
                sql`${bookings.status} = 'payment_pending'`,
                lte(bookings.requestedStartTime, fourHoursFromNow)
            )
        );

    return eligibleBookings;
}

/**
 * Attempt to capture remaining payment for a booking
 */
export async function attemptPaymentCapture(
    bookingId: string
): Promise<PaymentProtocolResult> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found" };
    }

    // Get service for pricing
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1);

    if (!service) {
        return { success: false, message: "Service not found" };
    }

    // TODO: Integrate with Stripe to capture the remaining 90%
    // For now, return a placeholder

    // On success:
    // - Update booking payment state
    // - Send confirmation to customer and vendor

    // On failure:
    // - Send payment reminder to customer
    // - Schedule for auto-cancel at T-4h

    return {
        success: true,
        message: "Payment capture initiated (placeholder)",
        newState: "CAPTURE_ATTEMPTED",
    };
}

/**
 * Handle payment capture failure
 * Send SMS/Push notification to customer
 */
export async function handleCaptureFailure(
    bookingId: string,
    reason?: string
): Promise<void> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) return;

    // Send notification to customer
    await createNotification({
        userId: booking.customerId,
        type: "payment_reminder",
        title: "Payment Required",
        message: `Your booking payment could not be processed. Please update your payment method to avoid cancellation.`,
        actionUrl: `/bookings/${bookingId}/payment`,
        priority: "high",
    });

    // TODO: Send SMS if customer has phone number and SMS credits
}

/**
 * Auto-cancel booking due to payment failure
 */
export async function autoCancelBooking(
    bookingId: string
): Promise<PaymentProtocolResult> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found" };
    }

    // Update booking status
    await db
        .update(bookings)
        .set({
            status: "cancelled",
            cancelledByUserId: null, // System cancelled
            cancellationReason: "Payment failed - auto-cancelled",
            cancelledAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

    // Notify both parties
    await createNotification({
        userId: booking.customerId,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: "Your booking was cancelled due to payment failure.",
        actionUrl: `/bookings/${bookingId}`,
    });

    await createNotification({
        userId: booking.vendorId,
        type: "booking_cancelled",
        title: "Booking Cancelled",
        message: "A customer's booking was cancelled due to payment failure.",
        actionUrl: `/bookings/${bookingId}`,
    });

    // Apply 50/50 split to any deposit collected
    return apply5050Split(bookingId, "PAYMENT_FAILED");
}

// ===========================================
// 50/50 DEFAULT SPLIT RULE
// ===========================================

/**
 * Apply 50/50 split when booking is cancelled due to user default or no-show
 * - 50% of deposit → Platform
 * - 50% of deposit → Vendor
 */
export async function apply5050Split(
    bookingId: string,
    reason: CancellationReason
): Promise<PaymentProtocolResult> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found" };
    }

    // Get the deposit amount (10% of total)
    const depositAmount = booking.depositAmount || 0;

    if (depositAmount <= 0) {
        return {
            success: true,
            message: "No deposit to split",
            vendorPayout: 0,
            platformFee: 0,
        };
    }

    // Calculate 50/50 split
    const vendorShare = Math.floor(depositAmount / 2);
    const platformShare = depositAmount - vendorShare; // Handles odd amounts

    // Record the split
    // Vendor gets their share (would integrate with Stripe Connect payout)
    // Platform keeps their share (already collected)

    // Log for audit
    console.log(`[50/50 Split] Booking ${bookingId}: Vendor receives ${vendorShare}, Platform retains ${platformShare}`);

    // Notify vendor of their compensation
    await createNotification({
        userId: booking.vendorId,
        type: "payment_received",
        title: "Cancellation Compensation",
        message: `You've received CHF ${(vendorShare / 100).toFixed(2)} compensation for a cancelled booking.`,
        actionUrl: `/bookings/${bookingId}`,
    });

    return {
        success: true,
        message: "50/50 split applied successfully",
        vendorPayout: vendorShare,
        platformFee: platformShare,
    };
}

/**
 * Handle customer no-show
 * Called when vendor marks customer as no-show
 */
export async function handleNoShow(
    bookingId: string,
    vendorId: string
): Promise<PaymentProtocolResult> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(
            and(
                eq(bookings.id, bookingId),
                eq(bookings.vendorId, vendorId)
            )
        )
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found or unauthorized" };
    }

    // Check if booking time has passed
    const now = new Date();
    const startTime = booking.confirmedStartTime || booking.requestedStartTime;

    if (startTime && now < startTime) {
        return {
            success: false,
            message: "Cannot mark as no-show before booking time"
        };
    }

    // Update booking status
    await db
        .update(bookings)
        .set({
            status: "no_show",
            cancelledAt: new Date(),
            cancellationReason: "Customer no-show",
        })
        .where(eq(bookings.id, bookingId));

    // Apply 50/50 split
    return apply5050Split(bookingId, "NO_SHOW");
}

// ===========================================
// CASH ON-SITE HANDLING
// ===========================================

/**
 * Mark booking as paid with cash on-site
 * Only available when capture fails and vendor accepts cash
 */
export async function markPaidCashOnSite(
    bookingId: string,
    vendorId: string,
    amountReceived: number
): Promise<PaymentProtocolResult> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(
            and(
                eq(bookings.id, bookingId),
                eq(bookings.vendorId, vendorId)
            )
        )
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found or unauthorized" };
    }

    // Update booking to mark as cash payment
    await db
        .update(bookings)
        .set({
            paymentMethod: "cash",
            status: "completed",
        })
        .where(eq(bookings.id, bookingId));

    // If customer paid less than expected, the vendor bears the difference
    // The platform already has the 10% deposit

    return {
        success: true,
        message: "Marked as paid with cash on-site",
        newState: "CASH_ON_SITE",
        vendorPayout: amountReceived,
        platformFee: booking.depositAmount || 0,
    };
}

// ===========================================
// SCHEDULED JOB HANDLERS
// ===========================================

/**
 * Process all pending payment captures
 * Called by cron job every hour
 */
export async function processPaymentCaptures(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
}> {
    const bookingsToCapture = await getBookingsForCapture();
    let succeeded = 0;
    let failed = 0;

    for (const booking of bookingsToCapture) {
        const result = await attemptPaymentCapture(booking.id);
        if (result.success) {
            succeeded++;
        } else {
            failed++;
            await handleCaptureFailure(booking.id, result.message);
        }
    }

    return {
        processed: bookingsToCapture.length,
        succeeded,
        failed
    };
}

/**
 * Process all bookings that should be auto-cancelled
 * Called by cron job every 15 minutes
 */
export async function processAutoCancellations(): Promise<{
    processed: number;
    cancelled: number;
}> {
    const bookingsToCancel = await getBookingsForAutoCancel();
    let cancelled = 0;

    for (const booking of bookingsToCancel) {
        const result = await autoCancelBooking(booking.id);
        if (result.success) {
            cancelled++;
        }
    }

    return {
        processed: bookingsToCancel.length,
        cancelled
    };
}
