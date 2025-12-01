/**
 * Points Service
 * 
 * Manages the points system including:
 * - Awarding points for platform actions
 * - Point redemption for discounts/perks
 * - Points history and balance tracking
 * - Point expiration (if enabled)
 * 
 * Points can be earned through:
 * - Referrals (signing up others)
 * - Creating services
 * - Posting reviews
 * - Making purchases
 * - Platform actions (configurable)
 */

import { db } from "./db";
import { users, pointsLog, referralTransactions } from "@shared/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { getReferralConfig } from "./referralService";

// ===========================================
// POINT ACTIONS
// ===========================================

export type PointAction = 
  | "referral_signup"
  | "referral_first_purchase"
  | "referral_service_created"
  | "service_created"
  | "review_posted"
  | "purchase_made"
  | "redemption"
  | "admin_adjustment"
  | "expired"
  | "bonus";

// ===========================================
// AWARD POINTS
// ===========================================

/**
 * Award points to a user for an action
 */
export async function awardPoints(params: {
  userId: string;
  action: PointAction;
  description?: string;
  referenceType?: "user" | "service" | "review" | "order" | "admin";
  referenceId?: string;
  customPoints?: number; // Override default points for this action
}): Promise<{
  success: boolean;
  pointsAwarded: number;
  newBalance: number;
  message?: string;
}> {
  const { userId, action, description, referenceType, referenceId, customPoints } = params;
  
  const config = await getReferralConfig();
  
  // Determine points to award
  let points = customPoints;
  
  if (points === undefined) {
    switch (action) {
      case "service_created":
        points = config.pointsPerServiceCreation;
        break;
      case "review_posted":
        points = config.pointsPerReview;
        break;
      case "referral_signup":
        points = config.pointsPerReferral;
        break;
      case "referral_first_purchase":
        points = config.pointsPerFirstPurchase;
        break;
      case "referral_service_created":
        points = Math.floor(config.pointsPerServiceCreation * 0.5); // 50% for referral
        break;
      default:
        points = 0;
    }
  }
  
  if (points <= 0) {
    return {
      success: false,
      pointsAwarded: 0,
      newBalance: 0,
      message: "No points to award for this action",
    };
  }
  
  // Update user's points
  await db
    .update(users)
    .set({
      points: sql`${users.points} + ${points}`,
      totalEarnedPoints: sql`${users.totalEarnedPoints} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  // Get new balance
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const newBalance = user?.points || 0;
  
  // Log the points
  await db.insert(pointsLog).values({
    userId,
    points,
    balanceAfter: newBalance,
    action,
    description: description || getDefaultDescription(action),
    referenceType,
    referenceId,
  });
  
  return {
    success: true,
    pointsAwarded: points,
    newBalance,
  };
}

/**
 * Get default description for point action
 */
function getDefaultDescription(action: PointAction): string {
  const descriptions: Record<PointAction, string> = {
    referral_signup: "Points earned for referring a new user",
    referral_first_purchase: "Points earned from referral's first purchase",
    referral_service_created: "Points earned from referral's service creation",
    service_created: "Points earned for creating a service",
    review_posted: "Points earned for posting a review",
    purchase_made: "Points earned for making a purchase",
    redemption: "Points redeemed",
    admin_adjustment: "Administrative adjustment",
    expired: "Points expired",
    bonus: "Bonus points",
  };
  
  return descriptions[action] || "Points transaction";
}

// ===========================================
// REDEEM POINTS
// ===========================================

export type RedemptionType = "discount" | "promo_package" | "visibility_boost";

/**
 * Redeem points for a benefit
 */
export async function redeemPoints(params: {
  userId: string;
  points: number;
  redemptionType: RedemptionType;
  targetId?: string; // e.g., service ID for visibility boost
}): Promise<{
  success: boolean;
  message: string;
  discountValue?: number;
  newBalance?: number;
}> {
  const { userId, points, redemptionType, targetId } = params;
  
  const config = await getReferralConfig();
  
  // Validate minimum points
  if (points < config.minPointsToRedeem) {
    return {
      success: false,
      message: `Minimum ${config.minPointsToRedeem} points required for redemption`,
    };
  }
  
  // Check user's balance
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  if (!user || user.points < points) {
    return {
      success: false,
      message: "Insufficient points balance",
    };
  }
  
  // Calculate discount value
  const discountValue = Number((points * config.pointsToDiscountRate).toFixed(2));
  
  // Deduct points
  await db
    .update(users)
    .set({
      points: sql`${users.points} - ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  // Get new balance
  const [updatedUser] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const newBalance = updatedUser?.points || 0;
  
  // Log the redemption
  await db.insert(pointsLog).values({
    userId,
    points: -points, // Negative for redemption
    balanceAfter: newBalance,
    action: "redemption",
    description: `Redeemed ${points} points for ${redemptionType}${targetId ? ` (${targetId})` : ""}`,
    referenceType: targetId ? "service" : undefined,
    referenceId: targetId,
  });
  
  return {
    success: true,
    message: `Successfully redeemed ${points} points for ${discountValue.toFixed(2)} CHF value`,
    discountValue,
    newBalance,
  };
}

// ===========================================
// POINTS QUERIES
// ===========================================

/**
 * Get user's current points balance
 */
export async function getPointsBalance(userId: string): Promise<number> {
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return user?.points || 0;
}

/**
 * Get user's points history
 */
export async function getPointsHistory(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Array<{
  id: string;
  points: number;
  balanceAfter: number;
  action: string;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: Date;
}>> {
  const history = await db
    .select()
    .from(pointsLog)
    .where(eq(pointsLog.userId, userId))
    .orderBy(desc(pointsLog.createdAt))
    .limit(limit)
    .offset(offset);
  
  return history;
}

/**
 * Get points summary for a user
 */
export async function getPointsSummary(userId: string): Promise<{
  currentBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  pendingFromReferrals: number;
  recentActivity: Array<{
    action: string;
    points: number;
    createdAt: Date;
  }>;
}> {
  // Get user data
  const [user] = await db
    .select({
      points: users.points,
      totalEarned: users.totalEarnedPoints,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  // Calculate total redeemed
  const [redeemed] = await db
    .select({
      total: sql<number>`COALESCE(SUM(ABS(points)), 0)`,
    })
    .from(pointsLog)
    .where(
      and(
        eq(pointsLog.userId, userId),
        eq(pointsLog.action, "redemption")
      )
    );
  
  // Get recent activity
  const recentActivity = await db
    .select({
      action: pointsLog.action,
      points: pointsLog.points,
      createdAt: pointsLog.createdAt,
    })
    .from(pointsLog)
    .where(eq(pointsLog.userId, userId))
    .orderBy(desc(pointsLog.createdAt))
    .limit(10);

  // Calculate pending points from referrals
  const [pendingPoints] = await db
    .select({
      total: sql<number>`COALESCE(SUM(points_earned), 0)`,
    })
    .from(referralTransactions)
    .where(
      and(
        eq(referralTransactions.toUserId, userId),
        eq(referralTransactions.status, 'pending')
      )
    );
  
  return {
    currentBalance: user?.points || 0,
    totalEarned: user?.totalEarned || 0,
    totalRedeemed: Number(redeemed?.total) || 0,
    pendingFromReferrals: Number(pendingPoints?.total) || 0,
    recentActivity,
  };
}

// ===========================================
// POINTS LEADERBOARD
// ===========================================

/**
 * Get points leaderboard
 */
export async function getPointsLeaderboard(limit: number = 10): Promise<Array<{
  rank: number;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  points: number;
  totalEarned: number;
}>> {
  const leaderboard = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      points: users.points,
      totalEarned: users.totalEarnedPoints,
    })
    .from(users)
    .where(sql`${users.points} > 0`)
    .orderBy(desc(users.points))
    .limit(limit);
  
  return leaderboard.map((user, index) => ({
    rank: index + 1,
    ...user,
  }));
}

// ===========================================
// POINTS CALCULATIONS
// ===========================================

/**
 * Calculate discount value from points
 */
export async function calculateDiscountValue(points: number): Promise<number> {
  const config = await getReferralConfig();
  return Number((points * config.pointsToDiscountRate).toFixed(2));
}

/**
 * Calculate points needed for a discount amount
 */
export async function calculatePointsNeeded(discountAmount: number): Promise<number> {
  const config = await getReferralConfig();
  return Math.ceil(discountAmount / config.pointsToDiscountRate);
}

// ===========================================
// POINTS EXPIRATION (Optional Feature)
// ===========================================

/**
 * Expire old unused points (if expiration is enabled)
 * This would be called by a scheduled job
 */
export async function expireOldPoints(daysOld: number = 365): Promise<{
  usersAffected: number;
  pointsExpired: number;
}> {
  // This is a placeholder for future implementation
  // For now, points don't expire
  return {
    usersAffected: 0,
    pointsExpired: 0,
  };
}

// ===========================================
// BONUS POINTS
// ===========================================

/**
 * Award bonus points (for promotions, milestones, etc.)
 */
export async function awardBonusPoints(params: {
  userId: string;
  points: number;
  reason: string;
}): Promise<{
  success: boolean;
  newBalance: number;
}> {
  const { userId, points, reason } = params;
  
  if (points <= 0) {
    return { success: false, newBalance: 0 };
  }
  
  // Update user's points
  await db
    .update(users)
    .set({
      points: sql`${users.points} + ${points}`,
      totalEarnedPoints: sql`${users.totalEarnedPoints} + ${points}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
  
  // Get new balance
  const [user] = await db
    .select({ points: users.points })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const newBalance = user?.points || 0;
  
  // Log the bonus
  await db.insert(pointsLog).values({
    userId,
    points,
    balanceAfter: newBalance,
    action: "bonus",
    description: reason,
  });
  
  return {
    success: true,
    newBalance,
  };
}

