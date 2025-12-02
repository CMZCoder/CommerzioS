/**
 * TWINT Eligibility Service
 * 
 * Determines if a customer can use TWINT payment with a vendor based on
 * trust-based restrictions and booking history.
 */

import { db } from './db';
import { users, bookings, reviews, escrowTransactions, services } from '../shared/schema';
import { eq, and, sql, gte, count } from 'drizzle-orm';

// TWINT eligibility thresholds
export const TWINT_ELIGIBILITY = {
  minVendorTrustScore: 4.0,        // Vendor must have 4.0+ trust score
  maxBookingAmount: 20000,          // Max CHF 200 per TWINT booking (in cents)
  minVendorCompletedBookings: 5,    // Vendor needs 5+ completed bookings
  minVendorAccountAgeDays: 30,      // Vendor account must be 30+ days old
  maxVendorDisputeRate: 0.10,       // Vendor dispute rate must be < 10%
  requirePreviousCardBooking: true, // Customer must have 1+ successful card booking with this vendor
};

export interface TwintEligibilityResult {
  allowed: boolean;
  reason?: string;
  eligibilityDetails?: {
    vendorTrustScore: number;
    vendorCompletedBookings: number;
    vendorAccountAgeDays: number;
    vendorDisputeRate: number;
    customerHasPreviousCardBooking: boolean;
    amountWithinLimit: boolean;
  };
}

/**
 * Get vendor statistics for TWINT eligibility
 */
async function getVendorStats(vendorId: string): Promise<{
  trustScore: number;
  completedBookings: number;
  disputedBookings: number;
  accountAgeDays: number;
}> {
  // Get vendor info
  const [vendor] = await db.select({
    createdAt: users.createdAt,
  })
    .from(users)
    .where(eq(users.id, vendorId))
    .limit(1);

  if (!vendor) {
    return { trustScore: 0, completedBookings: 0, disputedBookings: 0, accountAgeDays: 0 };
  }

  // Calculate account age
  const accountAgeDays = Math.floor(
    (Date.now() - vendor.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Get completed bookings count
  const [completedResult] = await db.select({
    count: count(),
  })
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'completed')
      )
    );

  const completedBookings = completedResult?.count || 0;

  // Get disputed/cancelled bookings count for dispute rate
  const [disputedResult] = await db.select({
    count: count(),
  })
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        sql`${bookings.status} IN ('cancelled', 'no_show') AND ${bookings.cancelledBy} = 'customer'`
      )
    );

  const disputedBookings = disputedResult?.count || 0;

  // Calculate trust score from reviews (average rating)
  // Join reviews with services owned by the vendor directly
  const [reviewStats] = await db.select({
    avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
  })
    .from(reviews)
    .innerJoin(
      services,
      and(
        eq(reviews.serviceId, services.id),
        eq(services.ownerId, vendorId)
      )
    );

  // If no reviews, use a default score based on completed bookings
  let trustScore = reviewStats?.avgRating || 0;
  if (trustScore === 0 && completedBookings >= 5) {
    // Give a baseline trust score if vendor has completed bookings but no reviews
    trustScore = 3.0;
  }

  return {
    trustScore,
    completedBookings,
    disputedBookings,
    accountAgeDays,
  };
}

/**
 * Check if customer has previous successful card booking with vendor
 */
async function hasPreviousCardBooking(
  customerId: string,
  vendorId: string
): Promise<boolean> {
  const [result] = await db.select({
    count: count(),
  })
    .from(bookings)
    .where(
      and(
        eq(bookings.customerId, customerId),
        eq(bookings.vendorId, vendorId),
        eq(bookings.paymentMethod, 'card'),
        eq(bookings.status, 'completed')
      )
    );

  return (result?.count || 0) > 0;
}

/**
 * Check if a customer can use TWINT payment for a booking with a vendor
 */
export async function checkTwintEligibility(
  customerId: string,
  vendorId: string,
  amount: number // in cents
): Promise<TwintEligibilityResult> {
  // Get vendor stats
  const vendorStats = await getVendorStats(vendorId);
  
  // Calculate dispute rate
  const totalRelevantBookings = vendorStats.completedBookings + vendorStats.disputedBookings;
  const disputeRate = totalRelevantBookings > 0 
    ? vendorStats.disputedBookings / totalRelevantBookings 
    : 0;

  // Check previous card booking requirement
  const hasPrevCardBooking = await hasPreviousCardBooking(customerId, vendorId);
  
  // Check amount within limit
  const amountWithinLimit = amount <= TWINT_ELIGIBILITY.maxBookingAmount;

  // Build eligibility details
  const eligibilityDetails = {
    vendorTrustScore: vendorStats.trustScore,
    vendorCompletedBookings: vendorStats.completedBookings,
    vendorAccountAgeDays: vendorStats.accountAgeDays,
    vendorDisputeRate: disputeRate,
    customerHasPreviousCardBooking: hasPrevCardBooking,
    amountWithinLimit,
  };

  // Check each eligibility requirement
  if (vendorStats.trustScore < TWINT_ELIGIBILITY.minVendorTrustScore) {
    return { 
      allowed: false, 
      reason: "TWINT available for vendors with 4.0+ rating",
      eligibilityDetails,
    };
  }

  if (amount > TWINT_ELIGIBILITY.maxBookingAmount) {
    return { 
      allowed: false, 
      reason: "TWINT limited to bookings under CHF 200",
      eligibilityDetails,
    };
  }

  if (vendorStats.completedBookings < TWINT_ELIGIBILITY.minVendorCompletedBookings) {
    return { 
      allowed: false, 
      reason: "TWINT available after vendor completes 5 bookings",
      eligibilityDetails,
    };
  }

  if (vendorStats.accountAgeDays < TWINT_ELIGIBILITY.minVendorAccountAgeDays) {
    return { 
      allowed: false, 
      reason: "TWINT available for vendors with accounts older than 30 days",
      eligibilityDetails,
    };
  }

  if (disputeRate > TWINT_ELIGIBILITY.maxVendorDisputeRate) {
    return { 
      allowed: false, 
      reason: "TWINT not available for this vendor",
      eligibilityDetails,
    };
  }

  if (TWINT_ELIGIBILITY.requirePreviousCardBooking && !hasPrevCardBooking) {
    return { 
      allowed: false, 
      reason: "Use card for your first booking with this vendor",
      eligibilityDetails,
    };
  }

  return { 
    allowed: true,
    eligibilityDetails,
  };
}

/**
 * Get simplified eligibility status for UI display
 */
export async function getTwintEligibilityStatus(
  customerId: string | undefined,
  vendorId: string,
  amount: number
): Promise<{
  eligible: boolean;
  reason?: string;
  requiresFirstCardBooking: boolean;
}> {
  // If no customer ID, check vendor-only requirements
  if (!customerId) {
    const vendorStats = await getVendorStats(vendorId);
    const totalRelevantBookings = vendorStats.completedBookings + vendorStats.disputedBookings;
    const disputeRate = totalRelevantBookings > 0 
      ? vendorStats.disputedBookings / totalRelevantBookings 
      : 0;

    const vendorEligible = 
      vendorStats.trustScore >= TWINT_ELIGIBILITY.minVendorTrustScore &&
      vendorStats.completedBookings >= TWINT_ELIGIBILITY.minVendorCompletedBookings &&
      vendorStats.accountAgeDays >= TWINT_ELIGIBILITY.minVendorAccountAgeDays &&
      disputeRate <= TWINT_ELIGIBILITY.maxVendorDisputeRate &&
      amount <= TWINT_ELIGIBILITY.maxBookingAmount;

    return {
      eligible: false, // Can't be eligible without customer
      reason: vendorEligible 
        ? "Sign in and complete a card booking first" 
        : "TWINT not available for this vendor",
      requiresFirstCardBooking: vendorEligible,
    };
  }

  const result = await checkTwintEligibility(customerId, vendorId, amount);
  
  return {
    eligible: result.allowed,
    reason: result.reason,
    requiresFirstCardBooking: !result.eligibilityDetails?.customerHasPreviousCardBooking,
  };
}
