/**
 * Review Request Service
 * 
 * Handles automatic review request notifications:
 * - Send review requests after booking completion
 * - Track review request status
 */

import { db } from './db';
import { bookings } from '../shared/schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import { createNotification } from './notificationService';

/**
 * Send pending review requests for completed bookings
 * Finds bookings completed 24+ hours ago without review request sent
 * @returns Number of review requests sent
 */
export async function sendPendingReviewRequests(): Promise<number> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Find completed bookings from 24+ hours ago without review request sent
  const eligibleBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, 'completed'),
        lt(bookings.completedAt, twentyFourHoursAgo),
        isNull(bookings.reviewRequestSentAt)
      )
    )
    .limit(50);

  let sent = 0;
  for (const booking of eligibleBookings) {
    try {
      await createNotification({
        userId: booking.customerId,
        type: 'review',
        title: 'How was your experience?',
        message: 'Please take a moment to leave a review for the service you received.',
        actionUrl: `/bookings/${booking.id}/review`,
        relatedEntityId: booking.id,
        relatedEntityType: 'booking',
      });

      await db.update(bookings)
        .set({ reviewRequestSentAt: new Date() })
        .where(eq(bookings.id, booking.id));

      sent++;
    } catch (error) {
      console.error(`Failed to send review request for booking ${booking.id}:`, error);
    }
  }

  return sent;
}
