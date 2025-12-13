/**
 * Launch 100 Qualification Service
 * 
 * Manages the qualifications and requirements for the Launch 100 program:
 * 1. Credit card registration check
 * 2. Positive review tracking (≥4.0 across first 5 reviews)
 * 3. 7-day commission delay after service completion
 * 4. Revocation on threshold breach
 * 
 * Requirements for Launch 100 qualification:
 * - Must have registered credit card (Stripe payment method)
 * - Must maintain ≥4.0 average rating across first 5 reviews
 * - Commission payouts delayed 7 days after service completion
 * - Status revoked if averq rating falls below threshold
 */

import { db } from "./db";
import { users, reviews, bookings } from "@shared/schema";
import { eq, and, desc, gte, sql, lt } from "drizzle-orm";
import { createNotification } from "./notificationService";

// Constants
const LAUNCH_100_REQUIREMENTS = {
    MIN_AVG_RATING: 4.0,
    REVIEW_THRESHOLD: 5, // First 5 reviews count
    COMMISSION_DELAY_DAYS: 7,
    MAX_EARLY_BIRD_POSITION: 1000,
} as const;

// Types
interface Launch100Status {
    userId: string;
    isQualified: boolean;
    isEarlyBird: boolean;
    registrationNumber: number | null;
    hasCreditCard: boolean;
    reviewStatus: {
        count: number;
        averageRating: number;
        meetsThreshold: boolean;
    };
    commissionDelayApplied: boolean;
    revokedAt: Date | null;
    revocationReason: string | null;
}

interface QualificationResult {
    qualified: boolean;
    reason: string;
    details: Partial<Launch100Status>;
}

// ===========================================
// QUALIFICATION CHECKING
// ===========================================

/**
 * Check if user qualifies for Launch 100 program
 */
export async function checkLaunch100Qualification(
    userId: string
): Promise<QualificationResult> {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return { qualified: false, reason: "User not found", details: {} };
    }

    // Check 1: Early bird position
    const registrationNumber = user.registrationNumber;
    const isEarlyBird = registrationNumber !== null &&
        registrationNumber <= LAUNCH_100_REQUIREMENTS.MAX_EARLY_BIRD_POSITION;

    if (!isEarlyBird) {
        return {
            qualified: false,
            reason: "Not an early bird user (registration number > 1000)",
            details: { isEarlyBird: false, registrationNumber }
        };
    }

    // Check 2: Credit card on file
    const hasCreditCard = !!(user.stripeCustomerId && user.hasPaymentMethod);

    if (!hasCreditCard) {
        return {
            qualified: false,
            reason: "No credit card registered with Stripe",
            details: {
                isEarlyBird: true,
                registrationNumber,
                hasCreditCard: false
            }
        };
    }

    // Check 3: Review rating threshold
    const reviewStatus = await getVendorReviewStatus(userId);

    if (reviewStatus.count >= LAUNCH_100_REQUIREMENTS.REVIEW_THRESHOLD &&
        !reviewStatus.meetsThreshold) {
        return {
            qualified: false,
            reason: `Average rating (${reviewStatus.averageRating.toFixed(2)}) below ${LAUNCH_100_REQUIREMENTS.MIN_AVG_RATING} threshold`,
            details: {
                isEarlyBird: true,
                registrationNumber,
                hasCreditCard: true,
                reviewStatus
            }
        };
    }

    // Check 4: Not previously revoked
    if (user.launch100RevokedAt) {
        return {
            qualified: false,
            reason: `Launch 100 status revoked on ${user.launch100RevokedAt.toISOString()}`,
            details: {
                isEarlyBird: true,
                registrationNumber,
                revokedAt: user.launch100RevokedAt
            }
        };
    }

    // All checks passed!
    return {
        qualified: true,
        reason: "User meets all Launch 100 requirements",
        details: {
            isQualified: true,
            isEarlyBird: true,
            registrationNumber,
            hasCreditCard: true,
            reviewStatus,
            commissionDelayApplied: true
        }
    };
}

/**
 * Get vendor's review statistics for Launch 100 evaluation
 */
export async function getVendorReviewStatus(
    vendorId: string
): Promise<{ count: number; averageRating: number; meetsThreshold: boolean }> {
    // Get services owned by this vendor
    const vendorReviews = await db
        .select({
            rating: reviews.rating,
            createdAt: reviews.createdAt
        })
        .from(reviews)
        .innerJoin(bookings, eq(reviews.bookingId, bookings.id))
        .where(eq(bookings.vendorId, vendorId))
        .orderBy(reviews.createdAt)
        .limit(LAUNCH_100_REQUIREMENTS.REVIEW_THRESHOLD);

    if (vendorReviews.length === 0) {
        return { count: 0, averageRating: 5.0, meetsThreshold: true };
    }

    const totalRating = vendorReviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / vendorReviews.length;

    return {
        count: vendorReviews.length,
        averageRating: avgRating,
        meetsThreshold: avgRating >= LAUNCH_100_REQUIREMENTS.MIN_AVG_RATING
    };
}

// ===========================================
// CREDIT CARD VERIFICATION
// ===========================================

/**
 * Check if user has a valid credit card registered
 */
export async function checkCreditCardRegistration(
    userId: string
): Promise<{ registered: boolean; stripeCustomerId: string | null }> {
    const [user] = await db
        .select({
            stripeCustomerId: users.stripeCustomerId,
            hasPaymentMethod: users.hasPaymentMethod
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return { registered: false, stripeCustomerId: null };
    }

    return {
        registered: !!(user.stripeCustomerId && user.hasPaymentMethod),
        stripeCustomerId: user.stripeCustomerId
    };
}

/**
 * Mark user as having registered credit card
 */
export async function markCreditCardRegistered(
    userId: string,
    stripeCustomerId: string
): Promise<void> {
    await db
        .update(users)
        .set({
            stripeCustomerId,
            hasPaymentMethod: true,
            updatedAt: new Date()
        })
        .where(eq(users.id, userId));

    console.log(`[Launch100] Credit card registered for user ${userId}`);
}

// ===========================================
// COMMISSION DELAY
// ===========================================

/**
 * Calculate payout eligibility date (7 days after service completion)
 */
export function calculatePayoutEligibilityDate(
    serviceCompletedAt: Date
): Date {
    const eligibleDate = new Date(serviceCompletedAt);
    eligibleDate.setDate(eligibleDate.getDate() + LAUNCH_100_REQUIREMENTS.COMMISSION_DELAY_DAYS);
    return eligibleDate;
}

/**
 * Check if a booking's commission is eligible for payout
 */
export async function isCommissionPayoutEligible(
    bookingId: string
): Promise<{ eligible: boolean; eligibleDate: Date | null; reason: string }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { eligible: false, eligibleDate: null, reason: "Booking not found" };
    }

    if (booking.status !== "completed") {
        return { eligible: false, eligibleDate: null, reason: "Booking not completed" };
    }

    // Check if vendor is in Launch 100
    const qualification = await checkLaunch100Qualification(booking.vendorId);

    if (!qualification.qualified) {
        // Not in Launch 100, no delay applies
        return { eligible: true, eligibleDate: null, reason: "Vendor not in Launch 100 - no delay" };
    }

    // Calculate eligibility date
    const completedAt = booking.confirmedEndTime || booking.updatedAt;
    const eligibleDate = calculatePayoutEligibilityDate(completedAt);

    const now = new Date();
    if (now >= eligibleDate) {
        return {
            eligible: true,
            eligibleDate,
            reason: "7-day delay period has passed"
        };
    } else {
        return {
            eligible: false,
            eligibleDate,
            reason: `Payout delayed until ${eligibleDate.toISOString()}`
        };
    }
}

/**
 * Get all pending payouts for Launch 100 vendors
 */
export async function getPendingLaunch100Payouts(): Promise<Array<{
    bookingId: string;
    vendorId: string;
    amount: string;
    eligibleDate: Date;
    daysRemaining: number;
}>> {
    // Get completed bookings where vendor is Launch 100 qualified
    const completedBookings = await db
        .select({
            id: bookings.id,
            vendorId: bookings.vendorId,
            totalAmount: bookings.totalAmount,
            completedAt: bookings.confirmedEndTime
        })
        .from(bookings)
        .where(
            and(
                eq(bookings.status, "completed"),
                eq(bookings.earningsTransferred, false)
            )
        )
        .orderBy(bookings.confirmedEndTime);

    const pendingPayouts = [];

    for (const booking of completedBookings) {
        const qualification = await checkLaunch100Qualification(booking.vendorId);

        if (qualification.qualified && booking.completedAt) {
            const eligibleDate = calculatePayoutEligibilityDate(booking.completedAt);
            const now = new Date();

            if (now < eligibleDate) {
                const msRemaining = eligibleDate.getTime() - now.getTime();
                const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

                pendingPayouts.push({
                    bookingId: booking.id,
                    vendorId: booking.vendorId,
                    amount: booking.totalAmount || "0",
                    eligibleDate,
                    daysRemaining
                });
            }
        }
    }

    return pendingPayouts;
}

// ===========================================
// REVOCATION LOGIC
// ===========================================

/**
 * Check and process rating threshold breaches
 * Should be called after each new review
 */
export async function processReviewForLaunch100(
    vendorId: string,
    newRating: number
): Promise<{ revoked: boolean; reason?: string }> {
    const qualification = await checkLaunch100Qualification(vendorId);

    if (!qualification.qualified) {
        return { revoked: false };
    }

    const reviewStatus = await getVendorReviewStatus(vendorId);

    // Only check threshold if we have enough reviews
    if (reviewStatus.count >= LAUNCH_100_REQUIREMENTS.REVIEW_THRESHOLD &&
        !reviewStatus.meetsThreshold) {

        await revokeLaunch100Status(
            vendorId,
            `Average rating (${reviewStatus.averageRating.toFixed(2)}) fell below ${LAUNCH_100_REQUIREMENTS.MIN_AVG_RATING} threshold`
        );

        return {
            revoked: true,
            reason: `Launch 100 status revoked due to low rating average`
        };
    }

    return { revoked: false };
}

/**
 * Revoke Launch 100 status for a user
 */
export async function revokeLaunch100Status(
    userId: string,
    reason: string
): Promise<void> {
    await db
        .update(users)
        .set({
            launch100RevokedAt: new Date(),
            launch100RevocationReason: reason,
            updatedAt: new Date()
        })
        .where(eq(users.id, userId));

    // Notify user
    await createNotification({
        userId,
        type: "system",
        title: "Launch 100 Status Revoked",
        message: `Your Launch 100 early bird status has been revoked: ${reason}`,
        metadata: { reason },
        actionUrl: "/profile"
    });

    console.log(`[Launch100] Status revoked for user ${userId}: ${reason}`);
}

// ===========================================
// STATUS QUERIES
// ===========================================

/**
 * Get full Launch 100 status for a user
 */
export async function getLaunch100Status(
    userId: string
): Promise<Launch100Status> {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    if (!user) {
        return {
            userId,
            isQualified: false,
            isEarlyBird: false,
            registrationNumber: null,
            hasCreditCard: false,
            reviewStatus: { count: 0, averageRating: 0, meetsThreshold: false },
            commissionDelayApplied: false,
            revokedAt: null,
            revocationReason: null
        };
    }

    const reviewStatus = await getVendorReviewStatus(userId);
    const qualification = await checkLaunch100Qualification(userId);
    const hasCreditCard = !!(user.stripeCustomerId && user.hasPaymentMethod);
    const isEarlyBird = user.registrationNumber !== null &&
        user.registrationNumber <= LAUNCH_100_REQUIREMENTS.MAX_EARLY_BIRD_POSITION;

    return {
        userId,
        isQualified: qualification.qualified,
        isEarlyBird,
        registrationNumber: user.registrationNumber,
        hasCreditCard,
        reviewStatus,
        commissionDelayApplied: qualification.qualified,
        revokedAt: user.launch100RevokedAt || null,
        revocationReason: user.launch100RevocationReason || null
    };
}

/**
 * Get Launch 100 program statistics
 */
export async function getLaunch100ProgramStats(): Promise<{
    totalEarlyBirds: number;
    qualifiedCount: number;
    revokedCount: number;
    averageRating: number;
}> {
    // Count early birds
    const [earlyBirdCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
            and(
                sql`${users.registrationNumber} <= ${LAUNCH_100_REQUIREMENTS.MAX_EARLY_BIRD_POSITION}`,
                sql`${users.registrationNumber} IS NOT NULL`
            )
        );

    // Count revoked
    const [revokedCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.launch100RevokedAt} IS NOT NULL`);

    // Calculate qualified (early bird - revoked - no payment method)
    const [qualifiedCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(
            and(
                sql`${users.registrationNumber} <= ${LAUNCH_100_REQUIREMENTS.MAX_EARLY_BIRD_POSITION}`,
                sql`${users.registrationNumber} IS NOT NULL`,
                sql`${users.launch100RevokedAt} IS NULL`,
                eq(users.hasPaymentMethod, true)
            )
        );

    return {
        totalEarlyBirds: Number(earlyBirdCount?.count || 0),
        qualifiedCount: Number(qualifiedCount?.count || 0),
        revokedCount: Number(revokedCount?.count || 0),
        averageRating: 0 // Would need aggregate query across all early bird reviews
    };
}

// Export constants for external use
export { LAUNCH_100_REQUIREMENTS };
