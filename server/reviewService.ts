/**
 * Review Service
 * Handles review operations including edits with notifications and removal requests
 */

import { db } from './db';
import { reviews, reviewRemovalRequests, services, users, notifications, bookings } from '../shared/schema';
import { eq, and, desc, isNull, gt, lt, gte, lte, count, sql } from 'drizzle-orm';

export interface EditReviewInput {
  reviewId: string;
  userId: string;
  newRating: number;
  newComment: string;
}

export interface EditReviewResult {
  success: boolean;
  review?: typeof reviews.$inferSelect;
  error?: string;
  notificationSent?: boolean;
}

/**
 * Edit an existing review with notification to vendor if rating changes
 */
export async function editReview(input: EditReviewInput): Promise<EditReviewResult> {
  // Get the existing review
  const [review] = await db.select()
    .from(reviews)
    .where(and(
      eq(reviews.id, input.reviewId),
      eq(reviews.userId, input.userId)
    ))
    .limit(1);

  if (!review) {
    return { success: false, error: 'Review not found or not owned by user' };
  }

  // Check edit limits (max 2 edits within 7 days)
  if (review.editCount >= 2) {
    return { success: false, error: 'Maximum edit limit reached (2 edits allowed)' };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (review.createdAt < sevenDaysAgo) {
    return { success: false, error: 'Reviews can only be edited within 7 days of creation' };
  }

  // Determine rating direction
  const previousRating = review.rating;
  let ratingDirection: 'improved' | 'worsened' | 'same' = 'same';
  if (input.newRating > previousRating) {
    ratingDirection = 'improved';
  } else if (input.newRating < previousRating) {
    ratingDirection = 'worsened';
  }

  // Update the review
  const [updatedReview] = await db.update(reviews)
    .set({
      rating: input.newRating,
      comment: input.newComment,
      editCount: review.editCount + 1,
      lastEditedAt: new Date(),
      previousRating,
      ratingDirection,
    })
    .where(eq(reviews.id, input.reviewId))
    .returning();

  // Send notification to vendor if rating changed
  let notificationSent = false;
  if (ratingDirection !== 'same') {
    await notifyVendorOfReviewChange(updatedReview, previousRating);
    notificationSent = true;
  }

  return { success: true, review: updatedReview, notificationSent };
}

/**
 * Notify vendor when a review rating changes
 */
async function notifyVendorOfReviewChange(review: typeof reviews.$inferSelect, previousRating: number) {
  // Get service and vendor
  const [service] = await db.select()
    .from(services)
    .where(eq(services.id, review.serviceId))
    .limit(1);

  if (!service) return;

  // Get reviewer name
  const [reviewer] = await db.select()
    .from(users)
    .where(eq(users.id, review.userId))
    .limit(1);

  const ratingChanged = review.rating > previousRating 
    ? `improved from ${previousRating} to ${review.rating} stars`
    : `decreased from ${previousRating} to ${review.rating} stars`;

  const emoji = review.rating > previousRating ? '⬆️' : '⬇️';

  await db.insert(notifications).values({
    userId: service.ownerId,
    type: 'review',
    title: `Review Updated ${emoji}`,
    message: `${reviewer?.firstName || 'A customer'} updated their review for "${service.title}". Rating ${ratingChanged}.`,
    actionUrl: `/services/${service.id}#reviews`,
    metadata: {
      reviewId: review.id,
      serviceId: service.id,
      previousRating,
      newRating: review.rating,
      direction: review.ratingDirection,
    },
  });
}

// ============================================
// REVIEW REMOVAL REQUESTS
// ============================================

export interface CreateRemovalRequestInput {
  reviewId: string;
  requesterId: string;
  reason: 'inappropriate' | 'fake' | 'spam' | 'off_topic' | 'harassment' | 'other';
  details: string;
}

export interface RemovalRequestResult {
  success: boolean;
  request?: typeof reviewRemovalRequests.$inferSelect;
  error?: string;
}

/**
 * Request removal of a review (by vendor)
 */
export async function createRemovalRequest(input: CreateRemovalRequestInput): Promise<RemovalRequestResult> {
  // Check review exists
  const [review] = await db.select()
    .from(reviews)
    .innerJoin(services, eq(reviews.serviceId, services.id))
    .where(eq(reviews.id, input.reviewId))
    .limit(1);

  if (!review) {
    return { success: false, error: 'Review not found' };
  }

  // Verify requester is the service owner (vendor)
  if (review.services.ownerId !== input.requesterId) {
    return { success: false, error: 'Only the service owner can request review removal' };
  }

  // Check if there's already a pending request
  const [existingRequest] = await db.select()
    .from(reviewRemovalRequests)
    .where(and(
      eq(reviewRemovalRequests.reviewId, input.reviewId),
      eq(reviewRemovalRequests.status, 'pending')
    ))
    .limit(1);

  if (existingRequest) {
    return { success: false, error: 'A removal request is already pending for this review' };
  }

  // Create the request
  const [request] = await db.insert(reviewRemovalRequests)
    .values({
      reviewId: input.reviewId,
      requesterId: input.requesterId,
      reason: input.reason,
      details: input.details,
    })
    .returning();

  // Notify admin (create system notification for admins)
  const admins = await db.select()
    .from(users)
    .where(eq(users.isAdmin, true));

  for (const admin of admins) {
    await db.insert(notifications).values({
      userId: admin.id,
      type: 'system',
      title: 'New Review Removal Request',
      message: `A vendor has requested removal of a review. Reason: ${input.reason}`,
      actionUrl: `/admin/review-requests/${request.id}`,
      metadata: {
        requestId: request.id,
        reviewId: input.reviewId,
      },
    });
  }

  return { success: true, request };
}

/**
 * Get all removal requests (for admin)
 */
export async function getRemovalRequests(status?: 'pending' | 'under_review' | 'approved' | 'rejected') {
  const conditions = status ? [eq(reviewRemovalRequests.status, status)] : [];
  
  return db.select({
    request: reviewRemovalRequests,
    review: reviews,
    service: {
      id: services.id,
      title: services.title,
    },
    requester: {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
    },
  })
    .from(reviewRemovalRequests)
    .innerJoin(reviews, eq(reviewRemovalRequests.reviewId, reviews.id))
    .innerJoin(services, eq(reviews.serviceId, services.id))
    .innerJoin(users, eq(reviewRemovalRequests.requesterId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(reviewRemovalRequests.createdAt));
}

/**
 * Process a removal request (admin action)
 */
export async function processRemovalRequest(
  requestId: string,
  adminId: string,
  decision: 'approved' | 'rejected',
  adminNotes?: string
): Promise<RemovalRequestResult> {
  const [request] = await db.select()
    .from(reviewRemovalRequests)
    .where(eq(reviewRemovalRequests.id, requestId))
    .limit(1);

  if (!request) {
    return { success: false, error: 'Request not found' };
  }

  // Update request status
  const [updatedRequest] = await db.update(reviewRemovalRequests)
    .set({
      status: decision,
      reviewedBy: adminId,
      reviewedAt: new Date(),
      adminNotes,
      updatedAt: new Date(),
    })
    .where(eq(reviewRemovalRequests.id, requestId))
    .returning();

  // If approved, delete the review
  if (decision === 'approved') {
    await db.delete(reviews).where(eq(reviews.id, request.reviewId));
  }

  // Notify the requester
  await db.insert(notifications).values({
    userId: request.requesterId,
    type: 'system',
    title: decision === 'approved' ? 'Review Removed' : 'Review Removal Request Rejected',
    message: decision === 'approved' 
      ? 'Your review removal request has been approved. The review has been removed.'
      : `Your review removal request was rejected.${adminNotes ? ` Reason: ${adminNotes}` : ''}`,
    actionUrl: decision === 'approved' ? '/profile?tab=services' : `/services/${request.reviewId}`,
    metadata: {
      requestId,
      decision,
    },
  });

  return { success: true, request: updatedRequest };
}

/**
 * Get removal requests for a vendor
 */
export async function getVendorRemovalRequests(vendorId: string) {
  return db.select({
    request: reviewRemovalRequests,
    review: reviews,
    service: {
      id: services.id,
      title: services.title,
    },
  })
    .from(reviewRemovalRequests)
    .innerJoin(reviews, eq(reviewRemovalRequests.reviewId, reviews.id))
    .innerJoin(services, eq(reviews.serviceId, services.id))
    .where(eq(reviewRemovalRequests.requesterId, vendorId))
    .orderBy(desc(reviewRemovalRequests.createdAt));
}

/**
 * Get count of pending removal requests (for admin dashboard)
 */
export async function getPendingRemovalRequestCount(): Promise<number> {
  const [result] = await db.select({ count: count() })
    .from(reviewRemovalRequests)
    .where(eq(reviewRemovalRequests.status, 'pending'));
  
  return result?.count || 0;
}
