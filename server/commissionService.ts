/**
 * Commission Service
 * 
 * Handles all commission-related calculations:
 * - Tier-based commission rates (8% Standard, 6% Pro, 5% Elite)
 * - Kickstarter credit deductions
 * - Commission charging for Cash/TWINT bookings
 */

import { db } from "./db";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { users } from "../shared/schema";
import { 
  vendorStats, 
  kickstarterProgram,
  creditTransactions,
  commissionTiers,
  COMMISSION_RATES,
  TIER_REQUIREMENTS,
  KICKSTARTER_CONFIG,
  type VendorStats
} from "../shared/schema-vendor-stats";

// ============================================
// TYPES
// ============================================

export interface CommissionCalculation {
  grossCommission: number;        // Before credits
  creditsApplied: number;         // Credits used
  netCommission: number;          // Amount to charge
  commissionRate: number;         // The rate used (5, 6, or 8%)
  tier: "standard" | "pro" | "elite";
  breakdown: {
    bookingAmount: number;
    tierRate: number;
    grossAmount: number;
    creditsAvailable: number;
    creditsUsed: number;
    finalCharge: number;
  };
}

export interface TierEvaluation {
  currentTier: "standard" | "pro" | "elite";
  newTier: "standard" | "pro" | "elite";
  changed: boolean;
  reason: string;
  metrics: {
    completedBookings: number;
    averageRating: number | null;
    lifetimeEarnings: number;
  };
  requirements: {
    bookingsRequired: number;
    bookingsMet: boolean;
    ratingRequired: number | null;
    ratingMet: boolean;
    earningsRequired: number;
    earningsMet: boolean;
  };
}

// ============================================
// VENDOR STATS MANAGEMENT
// ============================================

/**
 * Get or create vendor stats record
 */
export async function getOrCreateVendorStats(userId: string): Promise<VendorStats> {
  // Try to find existing
  const [existing] = await db
    .select()
    .from(vendorStats)
    .where(eq(vendorStats.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create new with defaults
  const [created] = await db
    .insert(vendorStats)
    .values({
      userId,
      performanceTier: "standard",
      tierHistory: [{
        tier: "standard",
        changedAt: new Date().toISOString(),
        reason: "Initial tier assignment",
      }],
    })
    .returning();

  return created;
}

/**
 * Get vendor's current commission rate based on tier
 */
export async function getVendorCommissionRate(userId: string): Promise<{
  rate: number;
  tier: "standard" | "pro" | "elite";
}> {
  const stats = await getOrCreateVendorStats(userId);
  const tier = stats.performanceTier as "standard" | "pro" | "elite";
  
  return {
    rate: COMMISSION_RATES[tier],
    tier,
  };
}

// ============================================
// COMMISSION CALCULATION
// ============================================

/**
 * Calculate commission for a booking
 * Includes tier-based rate and credit deductions
 */
export async function calculateCommission(
  vendorId: string,
  bookingAmount: number
): Promise<CommissionCalculation> {
  const stats = await getOrCreateVendorStats(vendorId);
  const tier = stats.performanceTier as "standard" | "pro" | "elite";
  const rate = COMMISSION_RATES[tier];
  
  // Calculate gross commission
  const grossCommission = Math.round((bookingAmount * rate / 100) * 100) / 100;
  
  // Check available credits
  const creditsAvailable = parseFloat(stats.commissionCredits || "0");
  
  // Apply credits (can reduce commission to 0, but not negative)
  const creditsToApply = Math.min(creditsAvailable, grossCommission);
  const netCommission = Math.max(0, grossCommission - creditsToApply);
  
  return {
    grossCommission,
    creditsApplied: creditsToApply,
    netCommission,
    commissionRate: rate,
    tier,
    breakdown: {
      bookingAmount,
      tierRate: rate,
      grossAmount: grossCommission,
      creditsAvailable,
      creditsUsed: creditsToApply,
      finalCharge: netCommission,
    },
  };
}

/**
 * Apply commission credits and record transaction
 */
export async function applyCommissionCredits(
  vendorId: string,
  amountToDeduct: number,
  bookingId: string
): Promise<{ newBalance: number; amountDeducted: number }> {
  if (amountToDeduct <= 0) {
    const stats = await getOrCreateVendorStats(vendorId);
    return { 
      newBalance: parseFloat(stats.commissionCredits || "0"), 
      amountDeducted: 0 
    };
  }

  const stats = await getOrCreateVendorStats(vendorId);
  const currentCredits = parseFloat(stats.commissionCredits || "0");
  const actualDeduction = Math.min(currentCredits, amountToDeduct);
  const newBalance = currentCredits - actualDeduction;

  // Update vendor stats
  await db
    .update(vendorStats)
    .set({
      commissionCredits: newBalance.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(vendorStats.userId, vendorId));

  // Record transaction
  await db.insert(creditTransactions).values({
    userId: vendorId,
    transactionType: "commission_deduction",
    amount: (-actualDeduction).toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    referenceType: "booking",
    referenceId: bookingId,
    description: `Commission credit applied to booking ${bookingId}`,
  });

  console.log(`[Commission] Applied ${actualDeduction} CHF credits for vendor ${vendorId}, new balance: ${newBalance}`);

  return {
    newBalance,
    amountDeducted: actualDeduction,
  };
}

// ============================================
// TIER EVALUATION
// ============================================

/**
 * Evaluate and potentially update vendor's commission tier
 */
export async function evaluateVendorTier(vendorId: string): Promise<TierEvaluation> {
  const stats = await getOrCreateVendorStats(vendorId);
  const currentTier = stats.performanceTier as "standard" | "pro" | "elite";
  
  const metrics = {
    completedBookings: stats.completedBookings || 0,
    averageRating: stats.averageRating ? parseFloat(stats.averageRating) : null,
    lifetimeEarnings: parseFloat(stats.lifetimeEarnings || "0"),
  };

  // Check Elite first (highest tier)
  const eliteReqs = TIER_REQUIREMENTS.elite;
  const eliteMet = {
    bookingsMet: metrics.completedBookings >= eliteReqs.minBookings,
    ratingMet: metrics.averageRating !== null && metrics.averageRating >= eliteReqs.minRating!,
    earningsMet: metrics.lifetimeEarnings >= eliteReqs.minEarnings,
  };

  if (eliteMet.bookingsMet && eliteMet.ratingMet && eliteMet.earningsMet) {
    return await updateTierIfChanged(vendorId, stats, currentTier, "elite", metrics, eliteReqs, eliteMet);
  }

  // Check Pro
  const proReqs = TIER_REQUIREMENTS.pro;
  const proMet = {
    bookingsMet: metrics.completedBookings >= proReqs.minBookings,
    ratingMet: metrics.averageRating !== null && metrics.averageRating >= proReqs.minRating!,
    earningsMet: metrics.lifetimeEarnings >= proReqs.minEarnings,
  };

  if (proMet.bookingsMet && proMet.ratingMet && proMet.earningsMet) {
    return await updateTierIfChanged(vendorId, stats, currentTier, "pro", metrics, proReqs, proMet);
  }

  // Default to Standard
  const standardReqs = TIER_REQUIREMENTS.standard;
  return await updateTierIfChanged(vendorId, stats, currentTier, "standard", metrics, standardReqs, {
    bookingsMet: true,
    ratingMet: true,
    earningsMet: true,
  });
}

async function updateTierIfChanged(
  vendorId: string,
  stats: VendorStats,
  currentTier: "standard" | "pro" | "elite",
  newTier: "standard" | "pro" | "elite",
  metrics: { completedBookings: number; averageRating: number | null; lifetimeEarnings: number },
  requirements: { minBookings: number; minRating: number | null; minEarnings: number },
  met: { bookingsMet: boolean; ratingMet: boolean; earningsMet: boolean }
): Promise<TierEvaluation> {
  const changed = currentTier !== newTier;
  
  let reason = "";
  if (changed) {
    if (newTier === "elite") {
      reason = "Achieved Elite status: 50+ bookings, 4.8+ rating, 25k+ earnings";
    } else if (newTier === "pro") {
      reason = currentTier === "elite" 
        ? "Downgraded from Elite: requirements no longer met"
        : "Achieved Pro status: 20+ bookings, 4.5+ rating, 10k+ earnings";
    } else {
      reason = "Reverted to Standard: tier requirements no longer met";
    }

    // Update database
    const tierHistory = stats.tierHistory || [];
    tierHistory.push({
      tier: newTier,
      changedAt: new Date().toISOString(),
      reason,
      previousTier: currentTier,
    });

    await db
      .update(vendorStats)
      .set({
        performanceTier: newTier,
        tierChangedAt: new Date(),
        tierEvaluatedAt: new Date(),
        tierHistory,
        updatedAt: new Date(),
      })
      .where(eq(vendorStats.userId, vendorId));

    console.log(`[Tier] Vendor ${vendorId} tier changed: ${currentTier} → ${newTier}`);
  } else {
    reason = `Tier ${currentTier} maintained`;
    
    await db
      .update(vendorStats)
      .set({
        tierEvaluatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(vendorStats.userId, vendorId));
  }

  return {
    currentTier,
    newTier,
    changed,
    reason,
    metrics,
    requirements: {
      bookingsRequired: requirements.minBookings,
      bookingsMet: met.bookingsMet,
      ratingRequired: requirements.minRating,
      ratingMet: met.ratingMet,
      earningsRequired: requirements.minEarnings,
      earningsMet: met.earningsMet,
    },
  };
}

// ============================================
// KICKSTARTER CREDITS
// ============================================

/**
 * Award Kickstarter credit for a qualifying review
 * Called when a 4+ star review is submitted for a vendor
 */
export async function awardKickstarterCredit(
  vendorId: string,
  reviewId: string,
  rating: number
): Promise<{ awarded: boolean; amount: number; reason: string; newBalance: number }> {
  // Check if rating qualifies
  if (rating < KICKSTARTER_CONFIG.minRatingForCredit) {
    return {
      awarded: false,
      amount: 0,
      reason: `Rating ${rating} is below minimum ${KICKSTARTER_CONFIG.minRatingForCredit}`,
      newBalance: 0,
    };
  }

  // Get vendor stats
  const stats = await getOrCreateVendorStats(vendorId);

  // Check if vendor is eligible for kickstarter
  if (!stats.kickstarterEligible) {
    return {
      awarded: false,
      amount: 0,
      reason: "Vendor is not eligible for Kickstarter program",
      newBalance: parseFloat(stats.commissionCredits || "0"),
    };
  }

  // Check if vendor has already maxed out credits
  if ((stats.creditsEarnedCount || 0) >= 5) {
    return {
      awarded: false,
      amount: 0,
      reason: "Vendor has already earned maximum Kickstarter credits (5 reviews)",
      newBalance: parseFloat(stats.commissionCredits || "0"),
    };
  }

  // Check program limits
  const [program] = await db
    .select()
    .from(kickstarterProgram)
    .where(eq(kickstarterProgram.id, "default"))
    .limit(1);

  if (!program?.isActive) {
    return {
      awarded: false,
      amount: 0,
      reason: "Kickstarter program is no longer active",
      newBalance: parseFloat(stats.commissionCredits || "0"),
    };
  }

  // Award credit
  const creditAmount = KICKSTARTER_CONFIG.creditPerReview;
  const currentCredits = parseFloat(stats.commissionCredits || "0");
  const newBalance = currentCredits + creditAmount;
  const newCount = (stats.creditsEarnedCount || 0) + 1;

  // Update vendor stats
  await db
    .update(vendorStats)
    .set({
      commissionCredits: newBalance.toFixed(2),
      creditsEarnedCount: newCount,
      lastCreditEarnedAt: new Date(),
      // If they've now earned 5, they're maxed out
      kickstarterEligible: newCount < 5,
      updatedAt: new Date(),
    })
    .where(eq(vendorStats.userId, vendorId));

  // Record transaction
  await db.insert(creditTransactions).values({
    userId: vendorId,
    transactionType: "kickstarter_award",
    amount: creditAmount.toFixed(2),
    balanceAfter: newBalance.toFixed(2),
    referenceType: "review",
    referenceId: reviewId,
    description: `Kickstarter credit for ${rating}★ review (${newCount}/5)`,
  });

  // Update program stats
  await db
    .update(kickstarterProgram)
    .set({
      totalCreditsAwarded: sql`${kickstarterProgram.totalCreditsAwarded} + ${creditAmount}`,
      vendorsMaxedOut: newCount >= 5 
        ? sql`${kickstarterProgram.vendorsMaxedOut} + 1`
        : kickstarterProgram.vendorsMaxedOut,
      updatedAt: new Date(),
    })
    .where(eq(kickstarterProgram.id, "default"));

  // Check if program should end (1000 vendors maxed out)
  if (program.vendorsMaxedOut + (newCount >= 5 ? 1 : 0) >= KICKSTARTER_CONFIG.maxVendors) {
    await db
      .update(kickstarterProgram)
      .set({
        isActive: false,
        programEndedAt: new Date(),
        programEndedReason: `Reached ${KICKSTARTER_CONFIG.maxVendors} vendors with maximum credits`,
        updatedAt: new Date(),
      })
      .where(eq(kickstarterProgram.id, "default"));

    console.log(`[Kickstarter] Program ended - ${KICKSTARTER_CONFIG.maxVendors} vendors reached max credits`);
  }

  console.log(`[Kickstarter] Awarded ${creditAmount} CHF to vendor ${vendorId} (${newCount}/5 reviews, balance: ${newBalance})`);

  return {
    awarded: true,
    amount: creditAmount,
    reason: `Awarded ${creditAmount} CHF for ${rating}★ review`,
    newBalance,
  };
}

// ============================================
// STATS UPDATE FUNCTIONS
// ============================================

/**
 * Update vendor stats after a booking completes
 */
export async function updateVendorStatsOnBookingComplete(
  vendorId: string,
  bookingAmount: number,
  isCash: boolean
): Promise<void> {
  const stats = await getOrCreateVendorStats(vendorId);
  
  await db
    .update(vendorStats)
    .set({
      totalBookings: (stats.totalBookings || 0) + 1,
      completedBookings: (stats.completedBookings || 0) + 1,
      lifetimeEarnings: (parseFloat(stats.lifetimeEarnings || "0") + bookingAmount).toFixed(2),
      last30DaysEarnings: (parseFloat(stats.last30DaysEarnings || "0") + bookingAmount).toFixed(2),
      totalCashBookings: isCash ? (stats.totalCashBookings || 0) + 1 : stats.totalCashBookings,
      last30DaysCashBookings: isCash ? (stats.last30DaysCashBookings || 0) + 1 : stats.last30DaysCashBookings,
      statsRecalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(vendorStats.userId, vendorId));

  // Re-evaluate tier
  await evaluateVendorTier(vendorId);
}

/**
 * Update vendor stats after a review is submitted
 */
export async function updateVendorStatsOnReview(
  vendorId: string,
  rating: number
): Promise<void> {
  const stats = await getOrCreateVendorStats(vendorId);
  
  const currentTotal = stats.totalReviews || 0;
  const currentAvg = stats.averageRating ? parseFloat(stats.averageRating) : 0;
  
  // Calculate new average
  const newTotal = currentTotal + 1;
  const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;

  // Update star counts
  const fiveStarDelta = rating === 5 ? 1 : 0;
  const fourStarDelta = rating === 4 ? 1 : 0;

  await db
    .update(vendorStats)
    .set({
      totalReviews: newTotal,
      averageRating: newAvg.toFixed(2),
      fiveStarReviews: (stats.fiveStarReviews || 0) + fiveStarDelta,
      fourStarReviews: (stats.fourStarReviews || 0) + fourStarDelta,
      statsRecalculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(vendorStats.userId, vendorId));

  // Re-evaluate tier (rating change might affect tier)
  await evaluateVendorTier(vendorId);
}

/**
 * Update vendor stats when a dispute is opened
 */
export async function updateVendorStatsOnDispute(
  vendorId: string,
  isCash: boolean
): Promise<void> {
  const stats = await getOrCreateVendorStats(vendorId);
  
  await db
    .update(vendorStats)
    .set({
      disputedBookings: (stats.disputedBookings || 0) + 1,
      cashDisputeCount: isCash ? (stats.cashDisputeCount || 0) + 1 : stats.cashDisputeCount,
      last30DaysCashDisputes: isCash ? (stats.last30DaysCashDisputes || 0) + 1 : stats.last30DaysCashDisputes,
      updatedAt: new Date(),
    })
    .where(eq(vendorStats.userId, vendorId));
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize commission tier configuration in database
 */
export async function initializeCommissionTiers(): Promise<void> {
  const tiers = [
    {
      id: "standard",
      commissionPercent: "8.00",
      minCompletedBookings: 0,
      minAverageRating: null,
      minLifetimeEarnings: "0.00",
      displayName: "Standard",
      description: "Default tier for all vendors",
      badgeColor: "#6B7280",
    },
    {
      id: "pro",
      commissionPercent: "6.00",
      minCompletedBookings: 20,
      minAverageRating: "4.50",
      minLifetimeEarnings: "10000.00",
      displayName: "Pro",
      description: "For established vendors with excellent ratings",
      badgeColor: "#3B82F6",
    },
    {
      id: "elite",
      commissionPercent: "5.00",
      minCompletedBookings: 50,
      minAverageRating: "4.80",
      minLifetimeEarnings: "25000.00",
      displayName: "Elite",
      description: "Top performers with exceptional track records",
      badgeColor: "#F59E0B",
    },
  ];

  for (const tier of tiers) {
    await db
      .insert(commissionTiers)
      .values(tier)
      .onConflictDoUpdate({
        target: commissionTiers.id,
        set: {
          commissionPercent: tier.commissionPercent,
          minCompletedBookings: tier.minCompletedBookings,
          minAverageRating: tier.minAverageRating,
          minLifetimeEarnings: tier.minLifetimeEarnings,
          displayName: tier.displayName,
          description: tier.description,
          badgeColor: tier.badgeColor,
          updatedAt: new Date(),
        },
      });
  }

  console.log("[Commission] Initialized commission tiers");
}

/**
 * Initialize Kickstarter program configuration
 */
export async function initializeKickstarterProgram(): Promise<void> {
  await db
    .insert(kickstarterProgram)
    .values({
      id: "default",
      maxVendors: KICKSTARTER_CONFIG.maxVendors,
      maxCreditsPerVendor: KICKSTARTER_CONFIG.maxCreditsPerVendor.toFixed(2),
      creditPerQualifyingReview: KICKSTARTER_CONFIG.creditPerReview.toFixed(2),
      minRatingForCredit: KICKSTARTER_CONFIG.minRatingForCredit.toFixed(2),
      isActive: true,
    })
    .onConflictDoNothing();

  console.log("[Kickstarter] Initialized Kickstarter program");
}

// ============================================
// EXPORTS
// ============================================

export {
  COMMISSION_RATES,
  TIER_REQUIREMENTS,
  KICKSTARTER_CONFIG,
};
