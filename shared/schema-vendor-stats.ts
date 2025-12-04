/**
 * Vendor Stats & Commission Tiers Schema
 * 
 * Implements the loyalty-based commission system:
 * - Standard (8%): All vendors (default)
 * - Pro (6%): 20+ bookings, 4.5+ stars, 10k+ earnings
 * - Elite (5%): 50+ bookings, 4.8+ stars, 25k+ earnings
 * 
 * Also handles Kickstarter credits (10 CHF per 4+ star review, max 50 CHF)
 */

import { pgTable, text, timestamp, decimal, boolean, integer, jsonb, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { users } from "./schema";

// ============================================
// ENUMS
// ============================================

export const performanceTierEnum = pgEnum("performance_tier", [
  "standard",        // Default - 8% commission
  "pro",             // 20+ bookings, 4.5★, 10k+ - 6% commission
  "elite"            // 50+ bookings, 4.8★, 25k+ - 5% commission
]);

export const accountStatusEnum = pgEnum("account_status", [
  "active",                      // Normal operation
  "restricted_payment_failed",   // Cash commission charge failed - hide listings, restrict bidding
  "restricted_debt",             // Outstanding platform debt - restrict new bookings
  "suspended",                   // Admin suspended
  "banned"                       // Permanently banned
]);

// ============================================
// VENDOR STATS TABLE
// ============================================

export const vendorStats = pgTable("vendor_stats", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  // Link to user (one-to-one)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  
  // === PERFORMANCE METRICS ===
  totalBookings: integer("total_bookings").default(0).notNull(),
  completedBookings: integer("completed_bookings").default(0).notNull(),
  cancelledBookings: integer("cancelled_bookings").default(0).notNull(),
  disputedBookings: integer("disputed_bookings").default(0).notNull(),
  
  // Earnings
  lifetimeEarnings: decimal("lifetime_earnings", { precision: 12, scale: 2 }).default("0.00").notNull(),
  last30DaysEarnings: decimal("last_30_days_earnings", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Ratings
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }),  // 1.00 - 5.00
  totalReviews: integer("total_reviews").default(0).notNull(),
  fiveStarReviews: integer("five_star_reviews").default(0).notNull(),
  fourStarReviews: integer("four_star_reviews").default(0).notNull(),
  
  // Response metrics
  averageResponseTimeMinutes: integer("average_response_time_minutes"),
  responseRate: decimal("response_rate", { precision: 5, scale: 2 }),  // 0.00 - 100.00%
  
  // === COMMISSION TIER ===
  performanceTier: performanceTierEnum("performance_tier").default("standard").notNull(),
  tierEvaluatedAt: timestamp("tier_evaluated_at"),
  tierChangedAt: timestamp("tier_changed_at"),
  tierHistory: jsonb("tier_history").$type<Array<{
    tier: string;
    changedAt: string;
    reason: string;
    previousTier?: string;
  }>>().default([]),
  
  // === KICKSTARTER CREDITS ===
  // 10 CHF per 4+ star review, max 50 CHF (5 reviews), first 1000 vendors
  commissionCredits: decimal("commission_credits", { precision: 10, scale: 2 }).default("0.00").notNull(),
  creditsEarnedCount: integer("credits_earned_count").default(0).notNull(),  // How many 10 CHF rewards given (max 5)
  kickstarterEligible: boolean("kickstarter_eligible").default(true).notNull(),  // False after first 1000 vendors hit 50 CHF or program ends
  lastCreditEarnedAt: timestamp("last_credit_earned_at"),
  
  // === CASH/TWINT METRICS (for collusion detection) ===
  totalCashBookings: integer("total_cash_bookings").default(0).notNull(),
  cashDisputeCount: integer("cash_dispute_count").default(0).notNull(),
  last30DaysCashBookings: integer("last_30_days_cash_bookings").default(0).notNull(),
  last30DaysCashDisputes: integer("last_30_days_cash_disputes").default(0).notNull(),
  cashPrivilegesSuspended: boolean("cash_privileges_suspended").default(false).notNull(),
  cashPrivilegesSuspendedAt: timestamp("cash_privileges_suspended_at"),
  cashPrivilegesSuspendedReason: text("cash_privileges_suspended_reason"),
  
  // === TIMESTAMPS ===
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  statsRecalculatedAt: timestamp("stats_recalculated_at"),
}, (table) => ({
  userIdx: index("vendor_stats_user_idx").on(table.userId),
  tierIdx: index("vendor_stats_tier_idx").on(table.performanceTier),
  earningsIdx: index("vendor_stats_earnings_idx").on(table.lifetimeEarnings),
  ratingIdx: index("vendor_stats_rating_idx").on(table.averageRating),
}));

// ============================================
// KICKSTARTER PROGRAM TRACKING
// ============================================

export const kickstarterProgram = pgTable("kickstarter_program", {
  id: text("id").primaryKey().default("default"),
  
  // Program limits
  maxVendors: integer("max_vendors").default(1000).notNull(),
  maxCreditsPerVendor: decimal("max_credits_per_vendor", { precision: 10, scale: 2 }).default("50.00").notNull(),
  creditPerQualifyingReview: decimal("credit_per_qualifying_review", { precision: 10, scale: 2 }).default("10.00").notNull(),
  minRatingForCredit: decimal("min_rating_for_credit", { precision: 3, scale: 2 }).default("4.00").notNull(),
  
  // Current status
  vendorsEnrolled: integer("vendors_enrolled").default(0).notNull(),
  vendorsMaxedOut: integer("vendors_maxed_out").default(0).notNull(),  // Vendors who hit 50 CHF
  totalCreditsAwarded: decimal("total_credits_awarded", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Program state
  isActive: boolean("is_active").default(true).notNull(),
  programEndedAt: timestamp("program_ended_at"),
  programEndedReason: text("program_ended_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// COMMISSION TIER CONFIGURATION
// ============================================

export const commissionTiers = pgTable("commission_tiers", {
  id: text("id").primaryKey(),  // 'standard', 'pro', 'elite'
  
  // Commission rate
  commissionPercent: decimal("commission_percent", { precision: 5, scale: 2 }).notNull(),
  
  // Requirements to achieve this tier
  minCompletedBookings: integer("min_completed_bookings").default(0).notNull(),
  minAverageRating: decimal("min_average_rating", { precision: 3, scale: 2 }),
  minLifetimeEarnings: decimal("min_lifetime_earnings", { precision: 12, scale: 2 }).default("0.00").notNull(),
  
  // Display
  displayName: text("display_name").notNull(),
  description: text("description"),
  badgeColor: text("badge_color"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// CREDIT TRANSACTIONS (Audit Trail)
// ============================================

export const creditTransactions = pgTable("credit_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Transaction type
  transactionType: text("transaction_type").notNull(),  // 'kickstarter_award', 'commission_deduction', 'admin_adjustment', 'expiry'
  
  // Amount (positive for credits added, negative for deductions)
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
  
  // Reference
  referenceType: text("reference_type"),  // 'review', 'booking', 'admin'
  referenceId: text("reference_id"),
  
  // Description
  description: text("description"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("credit_transactions_user_idx").on(table.userId),
  typeIdx: index("credit_transactions_type_idx").on(table.transactionType),
  createdIdx: index("credit_transactions_created_idx").on(table.createdAt),
}));

// ============================================
// RELATIONS
// ============================================

export const vendorStatsRelations = relations(vendorStats, ({ one }) => ({
  user: one(users, {
    fields: [vendorStats.userId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type VendorStats = typeof vendorStats.$inferSelect;
export type InsertVendorStats = typeof vendorStats.$inferInsert;

export type KickstarterProgram = typeof kickstarterProgram.$inferSelect;
export type InsertKickstarterProgram = typeof kickstarterProgram.$inferInsert;

export type CommissionTier = typeof commissionTiers.$inferSelect;
export type InsertCommissionTier = typeof commissionTiers.$inferInsert;

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

// ============================================
// CONSTANTS
// ============================================

export const COMMISSION_RATES = {
  standard: 8.00,
  pro: 6.00,
  elite: 5.00,
} as const;

export const TIER_REQUIREMENTS = {
  standard: {
    minBookings: 0,
    minRating: null,
    minEarnings: 0,
  },
  pro: {
    minBookings: 20,
    minRating: 4.5,
    minEarnings: 10000,
  },
  elite: {
    minBookings: 50,
    minRating: 4.8,
    minEarnings: 25000,
  },
} as const;

export const KICKSTARTER_CONFIG = {
  maxVendors: 1000,
  maxCreditsPerVendor: 50.00,
  creditPerReview: 10.00,
  minRatingForCredit: 4.0,
} as const;
