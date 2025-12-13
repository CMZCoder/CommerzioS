/**
 * Credit Service
 * Handles all credit-related operations for the CommerzioS platform.
 * 
 * Credits are used for:
 * - Offline lead fees
 * - Premium AI concierge services
 * - Promotional bonuses
 * - Subscription benefits
 */

import { db } from "./db";
import { credits, users } from "@shared/schema";
import { eq, desc, and, sql, between, gte, lte } from "drizzle-orm";

// Types for credit transactions
export type CreditTransactionType =
    | "launch_gift"
    | "subscription_credit"
    | "top_up"
    | "lead_fee"
    | "refund"
    | "admin_adjustment"
    | "promo_bonus"
    | "expired";

export type CreditReferenceType =
    | "booking"
    | "subscription"
    | "admin"
    | "promo"
    | "system";

export interface CreateCreditTransactionParams {
    userId: string;
    amount: number; // Positive = credit, Negative = debit
    transactionType: CreditTransactionType;
    description?: string;
    referenceType?: CreditReferenceType;
    referenceId?: string;
}

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number;
    balanceAfter: number;
    transactionType: CreditTransactionType;
    description: string | null;
    referenceType: CreditReferenceType | null;
    referenceId: string | null;
    createdAt: Date;
}

// ===========================================
// CORE CREDIT OPERATIONS
// ===========================================

/**
 * Get the current credit balance for a user
 */
export async function getCreditBalance(userId: string): Promise<number> {
    const [user] = await db
        .select({ creditBalance: users.creditBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

    return user?.creditBalance ?? 0;
}

/**
 * Create a credit transaction and update user balance atomically
 */
export async function createCreditTransaction(
    params: CreateCreditTransactionParams
): Promise<CreditTransaction> {
    const { userId, amount, transactionType, description, referenceType, referenceId } = params;

    // Use a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
        // Get current balance
        const [user] = await tx
            .select({ creditBalance: users.creditBalance })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) {
            throw new Error(`User ${userId} not found`);
        }

        const currentBalance = user.creditBalance ?? 0;
        const newBalance = currentBalance + amount;

        // Check for insufficient balance on debits
        if (amount < 0 && newBalance < 0) {
            throw new Error(`Insufficient credit balance. Current: ${currentBalance}, Required: ${Math.abs(amount)}`);
        }

        // Update user balance
        await tx
            .update(users)
            .set({ creditBalance: newBalance })
            .where(eq(users.id, userId));

        // Create transaction record
        const [transaction] = await tx
            .insert(credits)
            .values({
                userId,
                amount,
                balanceAfter: newBalance,
                transactionType,
                description: description ?? null,
                referenceType: referenceType ?? null,
                referenceId: referenceId ?? null,
            })
            .returning();

        return transaction;
    });

    return result as CreditTransaction;
}

/**
 * Add credits to a user's balance
 */
export async function addCredits(
    userId: string,
    amount: number,
    transactionType: CreditTransactionType,
    options?: {
        description?: string;
        referenceType?: CreditReferenceType;
        referenceId?: string;
    }
): Promise<CreditTransaction> {
    if (amount <= 0) {
        throw new Error("Amount must be positive for credit additions");
    }

    return createCreditTransaction({
        userId,
        amount,
        transactionType,
        description: options?.description,
        referenceType: options?.referenceType,
        referenceId: options?.referenceId,
    });
}

/**
 * Deduct credits from a user's balance
 */
export async function deductCredits(
    userId: string,
    amount: number,
    transactionType: CreditTransactionType,
    options?: {
        description?: string;
        referenceType?: CreditReferenceType;
        referenceId?: string;
    }
): Promise<CreditTransaction> {
    if (amount <= 0) {
        throw new Error("Amount must be positive for credit deductions");
    }

    return createCreditTransaction({
        userId,
        amount: -amount, // Negative for debit
        transactionType,
        description: options?.description,
        referenceType: options?.referenceType,
        referenceId: options?.referenceId,
    });
}

/**
 * Get credit transaction history for a user
 */
export async function getCreditHistory(
    userId: string,
    options?: {
        limit?: number;
        offset?: number;
        transactionType?: CreditTransactionType;
        startDate?: Date;
        endDate?: Date;
    }
): Promise<{ transactions: CreditTransaction[]; total: number }> {
    const conditions = [eq(credits.userId, userId)];

    if (options?.transactionType) {
        conditions.push(eq(credits.transactionType, options.transactionType));
    }

    if (options?.startDate && options?.endDate) {
        conditions.push(between(credits.createdAt, options.startDate, options.endDate));
    } else if (options?.startDate) {
        conditions.push(gte(credits.createdAt, options.startDate));
    } else if (options?.endDate) {
        conditions.push(lte(credits.createdAt, options.endDate));
    }

    // Get total count
    const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(credits)
        .where(and(...conditions));

    // Get transactions
    const transactions = await db
        .select()
        .from(credits)
        .where(and(...conditions))
        .orderBy(desc(credits.createdAt))
        .limit(options?.limit ?? 50)
        .offset(options?.offset ?? 0);

    return {
        transactions: transactions as CreditTransaction[],
        total: Number(countResult?.count ?? 0),
    };
}

// ===========================================
// BUSINESS LOGIC FUNCTIONS
// ===========================================

/**
 * Award launch gift credits to new users
 * Based on verification level:
 * - LEVEL_1 (SMS): 0 credits
 * - LEVEL_2 (Stripe KYC): 25 credits
 * - LEVEL_3 (Zefix UID): 75 credits
 */
export async function awardLaunchGift(
    userId: string,
    verificationLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3"
): Promise<CreditTransaction | null> {
    const creditAmounts = {
        LEVEL_1: 0,
        LEVEL_2: 25,
        LEVEL_3: 75,
    };

    const amount = creditAmounts[verificationLevel];

    if (amount <= 0) {
        return null;
    }

    return addCredits(userId, amount, "launch_gift", {
        description: `Launch gift for ${verificationLevel} verification`,
        referenceType: "system",
    });
}

/**
 * Award subscription credits monthly
 * Based on subscription tier:
 * - STARTER: 0 credits
 * - PRO: 45 credits (39 CHF/mo)
 * - BUSINESS: 110 credits (89 CHF/mo)
 */
export async function awardSubscriptionCredits(
    userId: string,
    subscriptionTier: "STARTER" | "PRO" | "BUSINESS",
    subscriptionId?: string
): Promise<CreditTransaction | null> {
    const creditAmounts = {
        STARTER: 0,
        PRO: 45,
        BUSINESS: 110,
    };

    const amount = creditAmounts[subscriptionTier];

    if (amount <= 0) {
        return null;
    }

    return addCredits(userId, amount, "subscription_credit", {
        description: `Monthly ${subscriptionTier} subscription credits`,
        referenceType: "subscription",
        referenceId: subscriptionId,
    });
}

/**
 * Charge offline lead fee
 * When a user books an offline/TWINT_DIRECT service via chat
 * Fee: 5 credits per lead
 */
export async function chargeOfflineLeadFee(
    vendorId: string,
    bookingId: string,
    serviceName?: string
): Promise<CreditTransaction> {
    const OFFLINE_LEAD_FEE = 5;

    return deductCredits(vendorId, OFFLINE_LEAD_FEE, "lead_fee", {
        description: serviceName
            ? `Offline lead fee for: ${serviceName}`
            : "Offline lead fee",
        referenceType: "booking",
        referenceId: bookingId,
    });
}

/**
 * Refund credits to a user
 * Used when a dispute is resolved in customer's favor
 */
export async function refundCredits(
    userId: string,
    amount: number,
    reason: string,
    referenceId?: string
): Promise<CreditTransaction> {
    return addCredits(userId, amount, "refund", {
        description: reason,
        referenceType: "system",
        referenceId,
    });
}

/**
 * Admin adjustment for credits
 * Can be positive (add) or negative (deduct)
 */
export async function adminAdjustCredits(
    userId: string,
    amount: number,
    reason: string,
    adminUserId: string
): Promise<CreditTransaction> {
    const transactionType: CreditTransactionType = "admin_adjustment";

    return createCreditTransaction({
        userId,
        amount,
        transactionType,
        description: `Admin (${adminUserId}): ${reason}`,
        referenceType: "admin",
        referenceId: adminUserId,
    });
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function hasEnoughCredits(
    userId: string,
    requiredAmount: number
): Promise<boolean> {
    const balance = await getCreditBalance(userId);
    return balance >= requiredAmount;
}

/**
 * Get credit statistics for a user
 */
export async function getCreditStats(userId: string): Promise<{
    currentBalance: number;
    totalEarned: number;
    totalSpent: number;
    thisMonthEarned: number;
    thisMonthSpent: number;
}> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get current balance
    const currentBalance = await getCreditBalance(userId);

    // Get all-time totals
    const allTimeStats = await db
        .select({
            totalEarned: sql<number>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`,
            totalSpent: sql<number>`COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)`,
        })
        .from(credits)
        .where(eq(credits.userId, userId));

    // Get this month totals
    const monthlyStats = await db
        .select({
            earned: sql<number>`COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0)`,
            spent: sql<number>`COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0)`,
        })
        .from(credits)
        .where(and(
            eq(credits.userId, userId),
            gte(credits.createdAt, startOfMonth)
        ));

    return {
        currentBalance,
        totalEarned: Number(allTimeStats[0]?.totalEarned ?? 0),
        totalSpent: Number(allTimeStats[0]?.totalSpent ?? 0),
        thisMonthEarned: Number(monthlyStats[0]?.earned ?? 0),
        thisMonthSpent: Number(monthlyStats[0]?.spent ?? 0),
    };
}
