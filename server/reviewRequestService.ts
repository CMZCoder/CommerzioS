/**
 * Review Request Service
 * 
 * Automatically sends review requests to customers after their booking
 * is completed. Implements a 24-hour delay to allow time for the service
 * to be delivered.
 */

import { db } from './db';
import { bookings, services, users } from '@shared/schema';
import { eq, and, lte, isNull, sql } from 'drizzle-orm';
import { createNotification } from './notificationService';

// ===========================================
// REVIEW REQUEST TRACKING
// ===========================================

// We track sent review requests in a simple way by adding a timestamp
// to the booking. For now, we'll use the existing completedAt field
// and add a check against a review request sent flag.

/**
 * Send pending review requests for completed bookings
 * Should be called periodically (e.g., via cron job)
 */
export async function sendPendingReviewRequests(): Promise<{
  sent: number;
  failed: number;
}> {
  let sent = 0;
  let failed = 0;

  try {
    // Find completed bookings from 24+ hours ago that haven't had review requests sent
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get completed bookings with service and customer info
    const completedBookings = await db
      .select({
        bookingId: bookings.id,
        customerId: bookings.customerId,
        vendorId: bookings.vendorId,
        serviceId: bookings.serviceId,
        completedAt: bookings.completedAt,
        serviceTitle: services.title,
        vendorFirstName: users.firstName,
        vendorLastName: users.lastName,
      })
      .from(bookings)
      .innerJoin(services, eq(bookings.serviceId, services.id))
      .innerJoin(users, eq(bookings.vendorId, users.id))
      .where(
        and(
          eq(bookings.status, 'completed'),
          lte(bookings.completedAt, twentyFourHoursAgo),
          isNull(bookings.reminderSentAt) // Using reminderSentAt to track if review request was sent
        )
      )
      .limit(100); // Process in batches

    for (const booking of completedBookings) {
      try {
        // Send notification to customer asking for review
        const vendorName = [booking.vendorFirstName, booking.vendorLastName]
          .filter(Boolean)
          .join(' ') || 'the service provider';

        await createNotification({
          userId: booking.customerId,
          type: 'review',
          title: 'How was your experience?',
          message: `Share your feedback about "${booking.serviceTitle}" with ${vendorName}`,
          actionUrl: `/service/${booking.serviceId}?review=true`,
          relatedEntityType: 'booking',
          relatedEntityId: booking.bookingId,
          metadata: {
            serviceId: booking.serviceId,
            serviceTitle: booking.serviceTitle,
            vendorId: booking.vendorId,
          },
        });

        // Mark as sent by updating reminderSentAt
        await db.update(bookings)
          .set({ 
            reminderSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, booking.bookingId));

        sent++;
        console.log(`[ReviewRequest] Sent review request for booking ${booking.bookingId}`);
      } catch (error) {
        failed++;
        console.error(`[ReviewRequest] Failed to send for booking ${booking.bookingId}:`, error);
      }
    }
  } catch (error) {
    console.error('[ReviewRequest] Error in sendPendingReviewRequests:', error);
  }

  return { sent, failed };
}

/**
 * Check if a review request has been sent for a booking
 */
export async function hasReviewRequestBeenSent(bookingId: string): Promise<boolean> {
  const [booking] = await db
    .select({ reminderSentAt: bookings.reminderSentAt })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  return booking?.reminderSentAt !== null;
}
