/**
 * Review Request Service
 * 
 * Handles automated review requests including:
 * - Sending review requests 24h after booking completion
 * - Tracking if review was already requested
 * - Preventing duplicate requests
 */

import { db } from './db';
import { bookings, reviews, services, users } from '@shared/schema';
import { eq, and, sql, lte, isNull } from 'drizzle-orm';
import { createNotification } from './notificationService';

// ===========================================
// REVIEW REQUEST TYPES
// ===========================================

interface ReviewRequest {
  bookingId: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  requestedAt: Date;
}

// ===========================================
// REVIEW REQUEST TRACKING
// ===========================================

// In-memory store for tracking review requests
// In production, add a reviewRequests table to schema or use a field on bookings
const reviewRequestsSent: Set<string> = new Set();

/**
 * Check if a review request was already sent for a booking
 */
export function wasReviewRequestSent(bookingId: string): boolean {
  return reviewRequestsSent.has(bookingId);
}

/**
 * Mark a review request as sent
 */
function markReviewRequestSent(bookingId: string): void {
  reviewRequestsSent.add(bookingId);
}

// ===========================================
// REVIEW REQUEST OPERATIONS
// ===========================================

/**
 * Send a review request for a completed booking
 */
export async function sendReviewRequest(bookingId: string): Promise<boolean> {
  // Check if already requested
  if (wasReviewRequestSent(bookingId)) {
    console.log(`Review request already sent for booking ${bookingId}`);
    return false;
  }
  
  try {
    // Get booking details
    const [booking] = await db.select({
      id: bookings.id,
      customerId: bookings.customerId,
      serviceId: bookings.serviceId,
      status: bookings.status,
      completedAt: bookings.completedAt,
    })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);
    
    if (!booking || booking.status !== 'completed') {
      console.log(`Booking ${bookingId} is not completed`);
      return false;
    }
    
    // Check if customer already left a review for this service
    const [existingReview] = await db.select({ id: reviews.id })
      .from(reviews)
      .where(and(
        eq(reviews.serviceId, booking.serviceId),
        eq(reviews.userId, booking.customerId)
      ))
      .limit(1);
    
    if (existingReview) {
      console.log(`Customer already reviewed service for booking ${bookingId}`);
      markReviewRequestSent(bookingId);
      return false;
    }
    
    // Get service details
    const [service] = await db.select({ title: services.title })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);
    
    const serviceName = service?.title || 'the service';
    
    // Send notification to customer
    await createNotification({
      userId: booking.customerId,
      type: 'review',
      title: 'How was your experience?',
      message: `We hope you enjoyed "${serviceName}". Would you like to leave a review?`,
      actionUrl: `/service/${booking.serviceId}?review=true`,
      relatedEntityType: 'service',
      relatedEntityId: booking.serviceId,
    });
    
    // Mark as sent
    markReviewRequestSent(bookingId);
    
    console.log(`Review request sent for booking ${bookingId}`);
    return true;
  } catch (error) {
    console.error('Failed to send review request:', error);
    return false;
  }
}

/**
 * Process pending review requests for bookings completed 24+ hours ago
 * This should be called by a scheduled job
 */
export async function processPendingReviewRequests(): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  let processed = 0;
  let sent = 0;
  let errors = 0;
  
  try {
    // Find bookings completed more than 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const completedBookings = await db.select({
      id: bookings.id,
      customerId: bookings.customerId,
      serviceId: bookings.serviceId,
      completedAt: bookings.completedAt,
    })
      .from(bookings)
      .where(and(
        eq(bookings.status, 'completed'),
        lte(bookings.completedAt, twentyFourHoursAgo)
      ))
      .limit(100); // Process in batches
    
    for (const booking of completedBookings) {
      processed++;
      
      // Skip if already sent
      if (wasReviewRequestSent(booking.id)) {
        continue;
      }
      
      try {
        const success = await sendReviewRequest(booking.id);
        if (success) {
          sent++;
        }
      } catch (error) {
        console.error(`Error processing review request for booking ${booking.id}:`, error);
        errors++;
      }
    }
    
    console.log(`Processed ${processed} bookings, sent ${sent} review requests, ${errors} errors`);
  } catch (error) {
    console.error('Error processing pending review requests:', error);
    errors++;
  }
  
  return { processed, sent, errors };
}

/**
 * Get review request status for a booking
 */
export async function getReviewRequestStatus(bookingId: string): Promise<{
  canRequest: boolean;
  alreadyRequested: boolean;
  alreadyReviewed: boolean;
  reason?: string;
}> {
  // Check if already requested
  if (wasReviewRequestSent(bookingId)) {
    return {
      canRequest: false,
      alreadyRequested: true,
      alreadyReviewed: false,
      reason: 'Review request already sent',
    };
  }
  
  // Get booking
  const [booking] = await db.select({
    id: bookings.id,
    customerId: bookings.customerId,
    serviceId: bookings.serviceId,
    status: bookings.status,
  })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  
  if (!booking) {
    return {
      canRequest: false,
      alreadyRequested: false,
      alreadyReviewed: false,
      reason: 'Booking not found',
    };
  }
  
  if (booking.status !== 'completed') {
    return {
      canRequest: false,
      alreadyRequested: false,
      alreadyReviewed: false,
      reason: 'Booking not completed',
    };
  }
  
  // Check if already reviewed
  const [existingReview] = await db.select({ id: reviews.id })
    .from(reviews)
    .where(and(
      eq(reviews.serviceId, booking.serviceId),
      eq(reviews.userId, booking.customerId)
    ))
    .limit(1);
  
  if (existingReview) {
    return {
      canRequest: false,
      alreadyRequested: false,
      alreadyReviewed: true,
      reason: 'Customer already reviewed this service',
    };
  }
  
  return {
    canRequest: true,
    alreadyRequested: false,
    alreadyReviewed: false,
  };
}
