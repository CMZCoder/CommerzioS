import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  pgEnum,
  timestamp,
  varchar,
  text,
  boolean,
  integer,
  decimal,
  serial,
  real,
  unique,
  AnyPgColumn
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// ===========================================
// BOOKING REDESIGN ENUMS
// ===========================================

/**
 * Scheduling Type - How services handle availability
 * - TIME_BOUND: Blocks specific calendar slots (e.g., Cleaning, Moving)
 * - CAPACITY_BOUND: Async work with turnaround time (e.g., Logo Design, Advisory)
 */
export const schedulingTypeEnum = pgEnum("scheduling_type", ["TIME_BOUND", "CAPACITY_BOUND"]);

/**
 * Subscription Tier - Vendor subscription levels
 * - STARTER: Free tier, 15% commission, 0 credits
 * - PRO: CHF 39/mo, 13% commission, 45 credits
 * - BUSINESS: CHF 89/mo, 9% commission, 110 credits
 */
export const subscriptionTierEnum = pgEnum("subscription_tier", ["STARTER", "PRO", "BUSINESS"]);

/**
 * Verification Level - Swiss trust tiers
 * - LEVEL_1: SMS verified only, OFFLINE payments only
 * - LEVEL_2: Stripe KYC complete, ONLINE + OFFLINE
 * - LEVEL_3: Zefix UID verified, all features + Business badge
 */
export const verificationLevelEnum = pgEnum("verification_level", ["LEVEL_1", "LEVEL_2", "LEVEL_3"]);

/**
 * Payout Preference - How vendors receive funds
 * - INSTANT: Released immediately on completion (Level 3 only)
 * - PARTIAL: % released upfront, rest on completion
 * - STANDARD: Released 5 days after completion (default)
 */
export const payoutPreferenceEnum = pgEnum("payout_preference", ["INSTANT", "PARTIAL", "STANDARD"]);

/**
 * Pricing Mode - How service items are priced
 * - fixed: Set price shown (e.g., "50 CHF")
 * - hourly: Rate-based with duration (e.g., "25 CHF/hr")
 * - inquire: No price, triggers Proposal Builder flow
 */
export const pricingModeEnum = pgEnum("pricing_mode", ["fixed", "hourly", "inquire"]);

/**
 * Dispute Phase - Stages of AI dispute resolution
 * - negotiation: Phase 1 - 48h human negotiation
 * - ai_committee: Phase 2 - 72h AI consensus
 * - binding_verdict: Phase 3 - Final AI decision
 * - closed: Dispute resolved
 */
export const disputePhaseEnum = pgEnum("dispute_phase", ["negotiation", "ai_committee", "binding_verdict", "closed"]);



// Session table
export const session = pgTable("session",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Platform settings table (non-sensitive settings only - API keys stored as env vars)
export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default('default'),
  requireEmailVerification: boolean("require_email_verification").default(false).notNull(),
  requirePhoneVerification: boolean("require_phone_verification").default(false).notNull(),
  enableSwissAddressValidation: boolean("enable_swiss_address_validation").default(true).notNull(),
  enableAiCategoryValidation: boolean("enable_ai_category_validation").default(true).notNull(),
  enableServiceContacts: boolean("enable_service_contacts").default(true).notNull(), // Show contact section in service form
  requireServiceContacts: boolean("require_service_contacts").default(false).notNull(), // Make contacts required

  // Commission settings
  platformCommissionPercent: decimal("platform_commission_percent", { precision: 5, scale: 2 }).default("8.00").notNull(), // Base platform fee (%) - 8% Standard tier
  cardProcessingFeePercent: decimal("card_processing_fee_percent", { precision: 5, scale: 2 }).default("2.90").notNull(), // Stripe card fee (%)
  cardProcessingFeeFixed: decimal("card_processing_fee_fixed", { precision: 10, scale: 2 }).default("0.30").notNull(), // Stripe fixed fee (CHF)
  twintProcessingFeePercent: decimal("twint_processing_fee_percent", { precision: 5, scale: 2 }).default("1.30").notNull(), // TWINT fee (%)

  googleMapsApiKey: text("google_maps_api_key"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Plans table
export const plans = pgTable("plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }).notNull(),
  maxImages: integer("max_images").default(4).notNull(),
  listingDurationDays: integer("listing_duration_days").default(14).notNull(),
  canRenew: boolean("can_renew").default(true).notNull(),
  featuredListing: boolean("featured_listing").default(false).notNull(),
  prioritySupport: boolean("priority_support").default(false).notNull(),
  analyticsAccess: boolean("analytics_access").default(false).notNull(),
  customBranding: boolean("custom_branding").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users table (extended for marketplace with local auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone", { length: 50 }),
  phoneNumber: varchar("phone_number", { length: 50 }),

  // Authentication fields
  passwordHash: varchar("password_hash", { length: 255 }),
  authProvider: varchar("auth_provider", { enum: ["local", "google", "twitter", "facebook"] }).default("local").notNull(),
  oauthProviderId: varchar("oauth_provider_id", { length: 255 }),

  // Email verification
  emailVerificationToken: varchar("email_verification_token", { length: 255 }),
  emailVerificationExpires: timestamp("email_verification_expires"),

  // Password reset
  passwordResetToken: varchar("password_reset_token", { length: 255 }),
  passwordResetExpires: timestamp("password_reset_expires"),

  // Login security
  lastLoginAt: timestamp("last_login_at"),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),

  // Existing verification flags
  isVerified: boolean("is_verified").default(false).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  status: varchar("status", { enum: ["active", "inactive", "warned", "suspended", "banned", "kicked"] }).default("active").notNull(),
  statusReason: text("status_reason"),
  planId: varchar("plan_id").references(() => plans.id),
  marketingPackage: varchar("marketing_package", { enum: ["basic", "pro", "premium", "enterprise"] }).default("basic"),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  preferredSearchRadiusKm: integer("preferred_search_radius_km").default(10),
  lastHomeVisitAt: timestamp("last_home_visit_at"),

  // Referral system fields
  referralCode: varchar("referral_code", { length: 20 }).unique(),
  referredBy: varchar("referred_by").references((): AnyPgColumn => users.id, { onDelete: "set null" }),
  points: integer("points").default(0).notNull(),
  totalEarnedPoints: integer("total_earned_points").default(0).notNull(),
  totalEarnedCommission: decimal("total_earned_commission", { precision: 12, scale: 2 }).default("0").notNull(),

  // Stripe integration fields
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
  stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false).notNull(),

  // Vendor billing - for commission charges on Cash/TWINT bookings
  defaultPaymentMethodId: varchar("default_payment_method_id", { length: 255 }),
  paymentMethodLast4: varchar("payment_method_last4", { length: 4 }),
  paymentMethodBrand: varchar("payment_method_brand", { length: 50 }),

  // Account status - for payment failures and restrictions
  accountStatus: varchar("account_status", {
    enum: ["active", "restricted_payment_failed", "restricted_debt", "suspended", "banned"]
  }).default("active").notNull(),
  accountStatusReason: text("account_status_reason"),
  accountStatusChangedAt: timestamp("account_status_changed_at"),

  // Vendor payment settings (for users who offer services)
  acceptCardPayments: boolean("accept_card_payments").default(true).notNull(),
  acceptTwintPayments: boolean("accept_twint_payments").default(true).notNull(),
  acceptCashPayments: boolean("accept_cash_payments").default(true).notNull(),
  requireBookingApproval: boolean("require_booking_approval").default(false).notNull(), // If true, vendor must approve each booking

  // Vendor profile fields (for Vercel Design features)
  topVendor: boolean("top_vendor").default(false).notNull(), // Top vendor badge (auto-computed: >4.5 rating + >50 bookings)
  topVendorYear: integer("top_vendor_year"), // Year awarded top vendor status
  vendorBio: text("vendor_bio"), // About section for vendor profile
  certifications: jsonb("certifications").default(sql`'[]'::jsonb`), // Array of {name: string, year?: number}
  totalCompletedBookings: integer("total_completed_bookings").default(0).notNull(), // Booking count for metrics
  avgResponseTimeMinutes: integer("avg_response_time_minutes"), // Computed avg response time from messages
  satisfactionRate: decimal("satisfaction_rate", { precision: 5, scale: 2 }), // Computed from reviews (percentage)

  // ===========================================
  // BOOKING REDESIGN FIELDS
  // ===========================================

  // Swiss Trust Verification Level
  verificationLevel: verificationLevelEnum("verification_level").default("LEVEL_1").notNull(),

  // Swiss Business Registry ID (for Level 3 verification)
  zefixUid: varchar("zefix_uid", { length: 20 }), // Format: CHE-xxx.xxx.xxx

  // Subscription tier for commission rates
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("STARTER").notNull(),

  // Credit wallet balance (for offline lead fees)
  creditBalance: integer("credit_balance").default(0).notNull(),

  // Leakage defense score (tracking chat PII violations)
  leakageScore: integer("leakage_score").default(0).notNull(),

  // Punctuality score (% on-time arrivals for TIME_BOUND services)
  punctualityScore: decimal("punctuality_score", { precision: 5, scale: 2 }),

  // AI Concierge credits (for premium AI booking assistance)
  conciergeCredits: integer("concierge_credits").default(0).notNull(),

  // COM Points balance (gamified rewards system)
  comPointsBalance: integer("com_points_balance").default(0).notNull(),

  // First 1000 users flag (for early bird benefits)
  isEarlyBird: boolean("is_early_bird").default(false).notNull(),

  // Track user registration order for early bird
  registrationNumber: integer("registration_number"),

  // Launch 100 qualification tracking
  hasPaymentMethod: boolean("has_payment_method").default(false).notNull(),
  launch100RevokedAt: timestamp("launch_100_revoked_at"),
  launch100RevocationReason: text("launch_100_revocation_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_email").on(table.email),
  index("idx_users_auth_provider").on(table.authProvider),
  index("idx_users_referral_code").on(table.referralCode),
  index("idx_users_referred_by").on(table.referredBy),
]);

// Plans relations (declared after users to avoid circular reference)
export const plansRelations = relations(plans, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  plan: one(plans, {
    fields: [users.planId],
    references: [plans.id],
  }),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
    relationName: "referrer",
  }),
  referrals: many(users, { relationName: "referrer" }),
  services: many(services),
  reviews: many(reviews),
  favorites: many(favorites),
  submittedCategories: many(submittedCategories),
  aiConversations: many(aiConversations),
  addresses: many(addresses),
  moderationActions: many(userModerationActions),
  oauthTokens: many(oauthTokens),
  pointsLog: many(pointsLog),
  referralTransactionsFrom: many(referralTransactions, { relationName: "fromUser" }),
  referralTransactionsTo: many(referralTransactions, { relationName: "toUser" }),
  // Payment & booking relations
  customerOrders: many(orders, { relationName: "customerOrders" }),
  vendorOrders: many(orders, { relationName: "vendorOrders" }),
  customerBookings: many(bookings, { relationName: "customerBookings" }),
  vendorBookings: many(bookings, { relationName: "vendorBookings" }),
  vendorAvailabilitySettings: one(vendorAvailabilitySettings),
  vendorCalendarBlocks: many(vendorCalendarBlocks),
  customerConversations: many(chatConversations, { relationName: "customerConversations" }),
  vendorConversations: many(chatConversations, { relationName: "vendorConversations" }),
  chatMessages: many(chatMessages),
  // Reports and blocks
  reportsFiled: many(userReports, { relationName: "reportsFiled" }),
  reportsReceived: many(userReports, { relationName: "reportsReceived" }),
  reportsResolved: many(userReports, { relationName: "reportsResolved" }),
  blocksGiven: many(userBlocks, { relationName: "blocksGiven" }),
  blocksReceived: many(userBlocks, { relationName: "blocksReceived" }),
}));

// OAuth tokens table (for storing social login tokens)
export const oauthTokens = pgTable("oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { enum: ["google", "twitter", "facebook"] }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_oauth_tokens_user").on(table.userId),
  index("idx_oauth_tokens_provider").on(table.provider),
]);

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  user: one(users, {
    fields: [oauthTokens.userId],
    references: [users.id],
  }),
}));

// ===========================================
// REFERRAL SYSTEM TABLES
// ===========================================

/**
 * Referral Configuration Table
 * Stores configurable referral settings (commission rates, max levels, etc.)
 */
export const referralConfig = pgTable("referral_config", {
  id: varchar("id").primaryKey().default("default"),
  maxLevels: integer("max_levels").default(3).notNull(),

  // Commission rates per level (as decimal, e.g., 0.10 = 10%)
  level1CommissionRate: decimal("level1_commission_rate", { precision: 5, scale: 4 }).default("0.10").notNull(),
  level2CommissionRate: decimal("level2_commission_rate", { precision: 5, scale: 4 }).default("0.04").notNull(),
  level3CommissionRate: decimal("level3_commission_rate", { precision: 5, scale: 4 }).default("0.01").notNull(),

  // Points configuration
  pointsPerReferral: integer("points_per_referral").default(100).notNull(),
  pointsPerFirstPurchase: integer("points_per_first_purchase").default(50).notNull(),
  pointsPerServiceCreation: integer("points_per_service_creation").default(25).notNull(),
  pointsPerReview: integer("points_per_review").default(10).notNull(),

  // Point redemption rates
  pointsToDiscountRate: decimal("points_to_discount_rate", { precision: 10, scale: 4 }).default("0.01").notNull(), // 1 point = 0.01 CHF
  minPointsToRedeem: integer("min_points_to_redeem").default(100).notNull(),

  // Referral system settings
  referralCodeLength: integer("referral_code_length").default(8).notNull(),
  referralLinkExpiryDays: integer("referral_link_expiry_days").default(30).notNull(),
  cookieExpiryDays: integer("cookie_expiry_days").default(30).notNull(),

  // Anti-abuse settings
  maxReferralsPerDay: integer("max_referrals_per_day").default(50).notNull(),
  minTimeBetweenReferrals: integer("min_time_between_referrals").default(60).notNull(), // seconds

  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Points Log Table
 * Tracks all point transactions (earned, spent, expired, etc.)
 */
export const pointsLog = pgTable("points_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  points: integer("points").notNull(), // Positive for earned, negative for spent
  balanceAfter: integer("balance_after").notNull(),

  action: varchar("action", {
    enum: ["referral_signup", "referral_first_purchase", "referral_service_created",
      "service_created", "review_posted", "purchase_made",
      "redemption", "admin_adjustment", "expired", "bonus"]
  }).notNull(),

  description: text("description"),

  // Reference to what triggered this point change
  referenceType: varchar("reference_type", { enum: ["user", "service", "review", "order", "admin"] }),
  referenceId: varchar("reference_id"),

  // For referral-related points, track the referral transaction
  referralTransactionId: varchar("referral_transaction_id").references(() => referralTransactions.id, { onDelete: "set null" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_points_log_user").on(table.userId),
  index("idx_points_log_action").on(table.action),
  index("idx_points_log_created").on(table.createdAt),
]);

export const pointsLogRelations = relations(pointsLog, ({ one }) => ({
  user: one(users, {
    fields: [pointsLog.userId],
    references: [users.id],
  }),
  referralTransaction: one(referralTransactions, {
    fields: [pointsLog.referralTransactionId],
    references: [referralTransactions.id],
  }),
}));

/**
 * Referral Transactions Table
 * Tracks commission and points earned from referral chain
 */
export const referralTransactions = pgTable("referral_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // The user who earned the commission/points (the referrer)
  toUserId: varchar("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // The user whose action triggered the reward (the referee, or downstream referral)
  fromUserId: varchar("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Referral level (1 = direct, 2 = second level, 3 = third level)
  level: integer("level").notNull(),

  // Points earned by toUserId from this transaction
  pointsEarned: integer("points_earned").default(0).notNull(),

  // Commission earned (monetary value in CHF)
  commissionEarned: decimal("commission_earned", { precision: 12, scale: 2 }).default("0").notNull(),

  // Commission rate used for this transaction
  commissionRate: decimal("commission_rate", { precision: 5, scale: 4 }),

  // What triggered this transaction
  triggerType: varchar("trigger_type", {
    enum: ["signup", "first_purchase", "service_created", "order_completed", "subscription_renewed"]
  }).notNull(),

  // Reference to the triggering entity (e.g., service ID, order ID)
  triggerId: varchar("trigger_id"),
  triggerAmount: decimal("trigger_amount", { precision: 12, scale: 2 }), // The base amount for commission calculation

  // Status of the transaction
  status: varchar("status", {
    enum: ["pending", "confirmed", "paid", "cancelled", "expired"]
  }).default("pending").notNull(),

  // Payout tracking
  paidAt: timestamp("paid_at"),
  payoutId: varchar("payout_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_referral_tx_to_user").on(table.toUserId),
  index("idx_referral_tx_from_user").on(table.fromUserId),
  index("idx_referral_tx_level").on(table.level),
  index("idx_referral_tx_status").on(table.status),
  index("idx_referral_tx_trigger").on(table.triggerType),
  index("idx_referral_tx_created").on(table.createdAt),
]);

export const referralTransactionsRelations = relations(referralTransactions, ({ one, many }) => ({
  toUser: one(users, {
    fields: [referralTransactions.toUserId],
    references: [users.id],
    relationName: "toUser",
  }),
  fromUser: one(users, {
    fields: [referralTransactions.fromUserId],
    references: [users.id],
    relationName: "fromUser",
  }),
  pointsLogs: many(pointsLog),
}));

/**
 * Referral Stats Cache Table
 * Cached aggregated stats for dashboard performance
 */
export const referralStats = pgTable("referral_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Direct referral counts
  totalDirectReferrals: integer("total_direct_referrals").default(0).notNull(),
  activeDirectReferrals: integer("active_direct_referrals").default(0).notNull(),

  // Network stats (all levels)
  totalNetworkSize: integer("total_network_size").default(0).notNull(),

  // Earnings
  totalPointsEarned: integer("total_points_earned").default(0).notNull(),
  totalCommissionEarned: decimal("total_commission_earned", { precision: 12, scale: 2 }).default("0").notNull(),
  pendingCommission: decimal("pending_commission", { precision: 12, scale: 2 }).default("0").notNull(),

  // Rankings
  referralRank: integer("referral_rank"),

  // Last activity
  lastReferralAt: timestamp("last_referral_at"),

  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_referral_stats_user").on(table.userId),
  index("idx_referral_stats_rank").on(table.referralRank),
]);

export const referralStatsRelations = relations(referralStats, ({ one }) => ({
  user: one(users, {
    fields: [referralStats.userId],
    references: [users.id],
  }),
}));

// ===========================================
// END REFERRAL SYSTEM TABLES
// ===========================================

// Addresses table
export const addresses = pgTable("addresses", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }),
  street: varchar("street", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  canton: varchar("canton", { length: 100 }),
  country: varchar("country", { length: 100 }).notNull().default("Switzerland"),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_addresses_user").on(table.userId),
]);

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// User moderation actions table (audit log)
export const userModerationActions = pgTable("user_moderation_actions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminId: varchar("admin_id").references(() => users.id),
  action: varchar("action", { enum: ["warn", "suspend", "ban", "kick", "reactivate"] }).notNull(),
  previousStatus: varchar("previous_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }),
  newStatus: varchar("new_status", { enum: ["active", "warned", "suspended", "banned", "kicked"] }).notNull(),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("idx_moderation_user").on(table.userId),
  index("idx_moderation_admin").on(table.adminId),
  index("idx_moderation_action").on(table.action),
]);

export const userModerationActionsRelations = relations(userModerationActions, ({ one }) => ({
  user: one(users, {
    fields: [userModerationActions.userId],
    references: [users.id],
  }),
  admin: one(users, {
    fields: [userModerationActions.adminId],
    references: [users.id],
  }),
}));

// Banned identifiers table (IP, email, phone tracking)
export const bannedIdentifiers = pgTable("banned_identifiers", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifierType: varchar("identifier_type", { enum: ["ip", "email", "phone"] }).notNull(),
  identifierValue: varchar("identifier_value", { length: 255 }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  bannedBy: varchar("banned_by").references(() => users.id),
  reason: text("reason"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [
  index("idx_banned_type_value").on(table.identifierType, table.identifierValue),
  index("idx_banned_user").on(table.userId),
]);

export const bannedIdentifiersRelations = relations(bannedIdentifiers, ({ one }) => ({
  user: one(users, {
    fields: [bannedIdentifiers.userId],
    references: [users.id],
  }),
  bannedByUser: one(users, {
    fields: [bannedIdentifiers.bannedBy],
    references: [users.id],
  }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
  subcategories: many(subcategories),
}));

// Subcategories table
export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subcategories_category").on(table.categoryId),
]);

export const subcategoriesRelations = relations(subcategories, ({ one, many }) => ({
  category: one(categories, {
    fields: [subcategories.categoryId],
    references: [categories.id],
  }),
  services: many(services),
}));

// Temporary categories (AI-suggested, auto-expire after 24 hours)
export const temporaryCategories = pgTable("temporary_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  icon: varchar("icon", { length: 50 }),
  aiSuggested: boolean("ai_suggested").default(true).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const temporaryCategoriesRelations = relations(temporaryCategories, ({ one }) => ({
  user: one(users, {
    fields: [temporaryCategories.userId],
    references: [users.id],
  }),
}));

// User-submitted categories (pending approval)
export const submittedCategories = pgTable("submitted_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const submittedCategoriesRelations = relations(submittedCategories, ({ one }) => ({
  user: one(users, {
    fields: [submittedCategories.userId],
    references: [users.id],
  }),
}));

// Price list item type
export const priceListSchema = z.object({
  description: z.string(),
  price: z.string(), // Can be "0" or empty for inquire items
  unit: z.string().optional(),
  billingType: z.enum(["once", "per_duration"]).default("once"), // once = fixed, per_duration = multiplied by booking duration
  pricingMode: z.enum(["fixed", "hourly", "inquire"]).default("fixed"), // NEW: How the item is priced
  estimatedMinutes: z.number().optional(), // NEW: For fixed-price items with duration
});

// Image metadata type
const cropAreaSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const imageMetadataSchema = z.object({
  crop: cropAreaSchema.optional(), // Percentages (0-100)
  cropPixels: cropAreaSchema.optional(), // Pixel coordinates
  rotation: z.number().default(0),
  zoom: z.number().default(1).optional(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id),
  priceType: varchar("price_type", { enum: ["fixed", "list", "text"] }).default("fixed").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  priceText: text("price_text"),
  priceList: jsonb("price_list").default(sql`'[]'::jsonb`),
  priceUnit: varchar("price_unit", { enum: ["hour", "job", "consultation", "day", "month"] }).notNull(),
  locations: text("locations").array().default(sql`ARRAY[]::text[]`).notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  preferredLocationName: varchar("preferred_location_name", { length: 200 }),
  images: text("images").array().default(sql`ARRAY[]::text[]`).notNull(),
  imageMetadata: jsonb("image_metadata").default(sql`'[]'::jsonb`),
  mainImageIndex: integer("main_image_index").default(0).notNull(),
  status: varchar("status", { enum: ["draft", "active", "paused", "expired", "archived"] }).default("draft").notNull(),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`).notNull(),
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`).notNull(),
  contactPhone: varchar("contact_phone", { length: 50 }).notNull(),
  contactEmail: varchar("contact_email", { length: 200 }).notNull(),
  viewCount: integer("view_count").default(0).notNull(),
  shareCount: integer("share_count").default(0).notNull(),

  // Payment preferences for this service
  acceptedPaymentMethods: text("accepted_payment_methods").array().default(sql`ARRAY['card', 'twint', 'cash']::text[]`).notNull(),

  // Cancellation Policy (for dispute resolution)
  cancellationPolicy: varchar("cancellation_policy", {
    enum: ["flexible", "moderate", "strict", "custom"]
  }).default("flexible").notNull(),
  // For custom policy: what % vendor keeps on customer no-show (0-100)
  customNoShowFeePercent: integer("custom_no_show_fee_percent").default(0),

  // Vercel Design features
  minBookingHours: integer("min_booking_hours").default(1), // Minimum hours per booking (e.g., "Minimum 2 hours")
  whatsIncluded: text("whats_included").array().default(sql`ARRAY[]::text[]`), // What's included list
  featured: boolean("featured").default(false).notNull(), // Featured listing badge

  // Smart Booking System
  requiresScheduling: boolean("requires_scheduling").default(true).notNull(), // Does this service need calendar booking?

  // ===========================================
  // BOOKING REDESIGN FIELDS
  // ===========================================

  // Scheduling type - determines availability logic
  schedulingType: schedulingTypeEnum("scheduling_type").default("TIME_BOUND").notNull(),

  // For TIME_BOUND: how many concurrent bookings at same slot (e.g., cleaning agency with 5 staff)
  concurrentCapacity: integer("concurrent_capacity").default(1).notNull(),

  // For CAPACITY_BOUND: max active orders (e.g., designer can handle 5 projects)
  maxConcurrentOrders: integer("max_concurrent_orders").default(10).notNull(),

  // For CAPACITY_BOUND: estimated delivery time in hours
  turnaroundTimeHours: integer("turnaround_time_hours"),

  // Per-service instant booking toggle (overrides listing default)
  instantBookingEnabled: boolean("instant_booking_enabled").default(true).notNull(),

  // Vendor's choice: how funds are released
  payoutPreference: payoutPreferenceEnum("payout_preference").default("STANDARD").notNull(),

  // Minimum hours notice before booking (prevent last-minute bookings)
  minLeadTimeHours: integer("min_lead_time_hours").default(2).notNull(),

  // Vendor risk model choice: 10% deposit (Growth) vs 100% upfront (Secure)
  vendorRiskModel: varchar("vendor_risk_model", {
    enum: ["growth", "secure"]
  }).default("growth").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_services_owner").on(table.ownerId),
  index("idx_services_category").on(table.categoryId),
  index("idx_services_status").on(table.status),
]);

export const servicesRelations = relations(services, ({ one, many }) => ({
  owner: one(users, {
    fields: [services.ownerId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [services.subcategoryId],
    references: [subcategories.id],
  }),
  reviews: many(reviews),
  favorites: many(favorites),
  serviceContacts: many(serviceContacts),
  // Payment & booking relations
  pricingOptions: many(servicePricingOptions),
  orders: many(orders),
  bookings: many(bookings),
  calendarBlocks: many(vendorCalendarBlocks),
  chatConversations: many(chatConversations),
}));

// Service contacts table (support multiple phone/email with verification)
export const serviceContacts = pgTable("service_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  contactType: varchar("contact_type", { enum: ["phone", "email"] }).notNull(),
  value: varchar("value", { length: 200 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 100 }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationExpiresAt: timestamp("verification_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_contacts_service").on(table.serviceId),
]);

export const serviceContactsRelations = relations(serviceContacts, ({ one }) => ({
  service: one(services, {
    fields: [serviceContacts.serviceId],
    references: [services.id],
  }),
}));

// AI conversations table (track AI interactions)
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  conversationType: varchar("conversation_type", { enum: ["admin_assist", "user_support", "category_validation"] }).notNull(),
  messages: jsonb("messages").default(sql`'[]'::jsonb`).notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`).notNull(),
  status: varchar("status", { enum: ["active", "completed", "archived"] }).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_conversations_user").on(table.userId),
  index("idx_ai_conversations_type").on(table.conversationType),
]);

export const aiConversationsRelations = relations(aiConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
}));

// Reviews table - comprehensive multi-criteria reviews from customers on services
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),

  // Overall rating (calculated average of criteria)
  rating: integer("rating").notNull(),

  // Multi-criteria ratings (1-5 stars each) for service reviews
  qualityRating: integer("quality_rating"), // Quality of service delivered
  communicationRating: integer("communication_rating"), // Vendor communication
  punctualityRating: integer("punctuality_rating"), // Timeliness and scheduling
  valueRating: integer("value_rating"), // Value for the price paid

  comment: text("comment").notNull(),
  editCount: integer("edit_count").default(0).notNull(),
  lastEditedAt: timestamp("last_edited_at"),
  // Track rating history for notification purposes
  previousRating: integer("previous_rating"),
  ratingDirection: varchar("rating_direction", { enum: ["improved", "worsened", "same"] }),
  // Vendor response to review
  vendorResponse: text("vendor_response"),
  vendorRespondedAt: timestamp("vendor_responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reviews_service").on(table.serviceId),
  index("idx_reviews_user").on(table.userId),
  index("idx_reviews_booking").on(table.bookingId),
]);

// Review Removal Requests - vendors can request admin review of inappropriate reviews
export const reviewRemovalRequests = pgTable("review_removal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewId: varchar("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  requesterId: varchar("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: varchar("reason", {
    enum: ["inappropriate", "fake", "spam", "off_topic", "harassment", "other"]
  }).notNull(),
  details: text("details").notNull(),

  // Admin handling
  status: varchar("status", {
    enum: ["pending", "under_review", "approved", "rejected"]
  }).default("pending").notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  adminNotes: text("admin_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_removal_requests_review").on(table.reviewId),
  index("idx_removal_requests_requester").on(table.requesterId),
  index("idx_removal_requests_status").on(table.status),
]);

export const reviewRemovalRequestsRelations = relations(reviewRemovalRequests, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewRemovalRequests.reviewId],
    references: [reviews.id],
  }),
  requester: one(users, {
    fields: [reviewRemovalRequests.requesterId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reviewRemovalRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

// Customer Reviews - vendors review customers after completed bookings (multi-criteria)
export const customerReviews = pgTable("customer_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }).unique(),

  // Overall rating (calculated average of criteria)
  rating: integer("rating").notNull(),

  // Multi-criteria ratings (1-5 stars each) for customer reviews
  communicationRating: integer("communication_rating"), // Customer communication
  punctualityRating: integer("punctuality_rating"), // Customer timeliness
  respectRating: integer("respect_rating"), // Customer respect and professionalism

  comment: text("comment").notNull(),
  editCount: integer("edit_count").default(0).notNull(),
  lastEditedAt: timestamp("last_edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_customer_reviews_vendor").on(table.vendorId),
  index("idx_customer_reviews_customer").on(table.customerId),
  index("idx_customer_reviews_booking").on(table.bookingId),
]);

export const customerReviewsRelations = relations(customerReviews, ({ one }) => ({
  vendor: one(users, {
    fields: [customerReviews.vendorId],
    references: [users.id],
    relationName: "vendorCustomerReviews",
  }),
  customer: one(users, {
    fields: [customerReviews.customerId],
    references: [users.id],
    relationName: "customerReceivedReviews",
  }),
  booking: one(bookings, {
    fields: [customerReviews.bookingId],
    references: [bookings.id],
  }),
}));

// Favorites table (bonus feature)
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
  index("idx_favorites_service").on(table.serviceId),
]);

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [favorites.serviceId],
    references: [services.id],
  }),
}));

// ===========================================
// BOOKING REDESIGN - NEW TABLES
// ===========================================

/**
 * Credits Ledger - Tracks all credit transactions
 * Used for offline lead fees, promotional credits, etc.
 */
export const credits = pgTable("credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Transaction amount (positive = credit, negative = debit)
  amount: integer("amount").notNull(),
  balanceAfter: integer("balance_after").notNull(),

  // Transaction type
  transactionType: varchar("transaction_type", {
    enum: [
      "launch_gift",           // Initial credits on verification
      "subscription_credit",   // Monthly subscription credits
      "top_up",               // Purchased credits
      "lead_fee",             // Charged for offline booking
      "refund",               // Returned credits
      "admin_adjustment",     // Manual admin adjustment
      "promo_bonus",          // Promotional bonus
      "expired"               // Expired unused credits
    ]
  }).notNull(),

  // Description for the transaction
  description: text("description"),

  // Reference to what triggered this transaction
  referenceType: varchar("reference_type", {
    enum: ["booking", "subscription", "admin", "promo", "system"]
  }),
  referenceId: varchar("reference_id"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_credits_user").on(table.userId),
  index("idx_credits_type").on(table.transactionType),
  index("idx_credits_created").on(table.createdAt),
]);

export const creditsRelations = relations(credits, ({ one }) => ({
  user: one(users, {
    fields: [credits.userId],
    references: [users.id],
  }),
}));

/**
 * Blocked Slots - Manual calendar blocks by vendors
 * Allows vendors to mark specific slots as unavailable
 */
export const blockedSlots = pgTable("blocked_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),

  // Block period
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),

  // Block reason (optional)
  reason: varchar("reason", {
    enum: ["holiday", "external_booking", "personal", "maintenance", "other"]
  }).default("other"),

  note: text("note"),

  // If true, blocks ALL services for this vendor
  allServices: boolean("all_services").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_blocked_slots_vendor").on(table.vendorId),
  index("idx_blocked_slots_service").on(table.serviceId),
  index("idx_blocked_slots_time").on(table.startTime, table.endTime),
]);

export const blockedSlotsRelations = relations(blockedSlots, ({ one }) => ({
  vendor: one(users, {
    fields: [blockedSlots.vendorId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [blockedSlots.serviceId],
    references: [services.id],
  }),
}));

/**
 * Price Inquiries - Customer requests for "inquire for price" items
 * Triggers the Proposal Builder flow
 */
export const priceInquiries = pgTable("price_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Links
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),

  // What they selected (array of priceList items with pricingMode: "inquire")
  selectedItems: jsonb("selected_items").default(sql`'[]'::jsonb`),

  // Customer input
  description: text("description").notNull(),
  attachments: jsonb("attachments").default(sql`'[]'::jsonb`), // Array of file URLs
  preferredDateStart: timestamp("preferred_date_start"),
  preferredDateEnd: timestamp("preferred_date_end"),
  flexibleDates: boolean("flexible_dates").default(true).notNull(),

  // Status
  status: varchar("status", {
    enum: ["pending", "quoted", "accepted", "rejected", "expired", "converted"]
  }).default("pending").notNull(),

  // Timestamps
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_price_inquiries_customer").on(table.customerId),
  index("idx_price_inquiries_vendor").on(table.vendorId),
  index("idx_price_inquiries_service").on(table.serviceId),
  index("idx_price_inquiries_status").on(table.status),
]);

export const priceInquiriesRelations = relations(priceInquiries, ({ one, many }) => ({
  customer: one(users, {
    fields: [priceInquiries.customerId],
    references: [users.id],
    relationName: "customerInquiries",
  }),
  vendor: one(users, {
    fields: [priceInquiries.vendorId],
    references: [users.id],
    relationName: "vendorInquiries",
  }),
  service: one(services, {
    fields: [priceInquiries.serviceId],
    references: [services.id],
  }),
  quotes: many(vendorQuotes),
}));

/**
 * Vendor Quotes - Vendor responses to price inquiries
 * The Proposal Builder output
 */
export const vendorQuotes = pgTable("vendor_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inquiryId: varchar("inquiry_id").notNull().references(() => priceInquiries.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Quote details - line items array
  lineItems: jsonb("line_items").notNull().$type<{
    description: string;
    quantity: number;
    unitPrice: number; // in cents (CHF)
    unit: string; // "once", "hour", "day"
    subtotal: number;
  }[]>(),

  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),

  // Scheduling
  estimatedDuration: text("estimated_duration"), // "2-3 hours", "1 day"
  proposedDate: timestamp("proposed_date"),
  proposedEndDate: timestamp("proposed_end_date"),

  // Message
  coverLetter: text("cover_letter").notNull(),

  // Validity
  validUntil: timestamp("valid_until").notNull(),

  // Status
  status: varchar("status", {
    enum: ["pending", "accepted", "rejected", "expired", "withdrawn"]
  }).default("pending").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_vendor_quotes_inquiry").on(table.inquiryId),
  index("idx_vendor_quotes_vendor").on(table.vendorId),
  index("idx_vendor_quotes_status").on(table.status),
]);

export const vendorQuotesRelations = relations(vendorQuotes, ({ one }) => ({
  inquiry: one(priceInquiries, {
    fields: [vendorQuotes.inquiryId],
    references: [priceInquiries.id],
  }),
  vendor: one(users, {
    fields: [vendorQuotes.vendorId],
    references: [users.id],
  }),
}));

/**
 * Disputes - AI-managed dispute resolution
 * Tracks the 3-phase dispute process
 */
export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Links - bookingId references the existing bookings table
  bookingId: varchar("booking_id").notNull(),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  vendorId: varchar("vendor_id").notNull().references(() => users.id),

  // Dispute details
  reason: varchar("reason", {
    enum: ["no_show", "poor_quality", "incomplete", "damage", "wrong_service", "overcharge", "other"]
  }).notNull(),
  description: text("description").notNull(),

  // Evidence from both parties
  customerEvidence: jsonb("customer_evidence").default(sql`'[]'::jsonb`), // Array of file URLs
  vendorEvidence: jsonb("vendor_evidence").default(sql`'[]'::jsonb`),

  // Amount in dispute (in cents)
  disputedAmount: integer("disputed_amount").notNull(),

  // Current phase - using varchar instead of enum to avoid migration conflicts
  phase: varchar("phase", {
    enum: ["negotiation", "ai_committee", "binding_verdict", "closed"]
  }).default("negotiation").notNull(),

  // Phase 1 data: negotiation offers
  negotiationOffers: jsonb("negotiation_offers").default(sql`'[]'::jsonb`),

  // Phase 2 data: AI committee options
  aiOptions: jsonb("ai_options").default(sql`'[]'::jsonb`),
  customerVote: varchar("customer_vote"),
  vendorVote: varchar("vendor_vote"),

  // Phase 3 data: final verdict
  finalVerdict: varchar("final_verdict", {
    enum: ["NO_REFUND", "PARTIAL", "FULL"]
  }),
  refundPercentage: integer("refund_percentage"),
  verdictReasoning: text("verdict_reasoning"),

  // Execution
  refundAmount: integer("refund_amount"),
  vendorPenalty: integer("vendor_penalty"),
  refundedAt: timestamp("refunded_at"),

  // Timeline tracking
  phase1Deadline: timestamp("phase1_deadline"),
  phase2Deadline: timestamp("phase2_deadline"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),

  // Status flags
  isClosed: boolean("is_closed").default(false).notNull(),
  closedReason: varchar("closed_reason", {
    enum: ["resolved", "settled", "verdict_executed", "withdrawn", "expired"]
  }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_disputes_booking").on(table.bookingId),
  index("idx_disputes_customer").on(table.customerId),
  index("idx_disputes_vendor").on(table.vendorId),
  index("idx_disputes_phase").on(table.phase),
  index("idx_disputes_closed").on(table.isClosed),
]);

export const disputesRelations = relations(disputes, ({ one }) => ({
  customer: one(users, {
    fields: [disputes.customerId],
    references: [users.id],
    relationName: "customerDisputes",
  }),
  vendor: one(users, {
    fields: [disputes.vendorId],
    references: [users.id],
    relationName: "vendorDisputes",
  }),
}));

// ===========================================
// COM POINTS GAMIFIED REWARDS SYSTEM
// ===========================================

/**
 * Mission Category - Types of missions users can complete
 */
export const missionCategoryEnum = pgEnum("mission_category", [
  "referral",
  "social_media",
  "engagement",
  "milestone"
]);

/**
 * Mission Status - Progress states for user missions
 */
export const missionStatusEnum = pgEnum("mission_status", [
  "available",
  "in_progress",
  "completed",
  "claimed",
  "expired"
]);

/**
 * Redemption Item Type - Types of items in the redemption shop
 */
export const redemptionItemTypeEnum = pgEnum("redemption_item_type", [
  "commission_discount",
  "listing_slot",
  "featured_listing",
  "inquiry_credits",
  "platform_credits"
]);

/**
 * COM Points Ledger - Tracks all point transactions
 */
export const comPointsLedger = pgTable("com_points_ledger", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  amount: integer("amount").notNull(), // positive = earn, negative = spend
  balanceAfter: integer("balance_after").notNull(),

  sourceType: varchar("source_type", {
    enum: ["mission", "redemption", "referral", "admin", "system"]
  }).notNull(),
  sourceId: varchar("source_id"), // mission_id, redemption_id, etc.
  description: text("description"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_com_points_user").on(table.userId),
  index("idx_com_points_created").on(table.createdAt),
]);

export const comPointsLedgerRelations = relations(comPointsLedger, ({ one }) => ({
  user: one(users, {
    fields: [comPointsLedger.userId],
    references: [users.id],
  }),
}));

/**
 * Missions - Defines available missions for earning COM Points
 */
export const missions = pgTable("missions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: missionCategoryEnum("category").notNull(),

  rewardPoints: integer("reward_points").notNull(),

  // Verification settings
  verificationType: varchar("verification_type", {
    enum: ["oauth", "database_trigger", "api_webhook", "manual"]
  }).notNull(),
  verificationConfig: jsonb("verification_config"), // { platform: "twitter", action: "follow" }

  // Tiered missions (e.g., invite 1, 10, 25, 50 friends)
  tier: integer("tier").default(1), // For tiered missions
  targetCount: integer("target_count").default(1), // Number needed to complete

  // Availability
  isActive: boolean("is_active").default(true).notNull(),
  isRepeatable: boolean("is_repeatable").default(false).notNull(),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_missions_category").on(table.category),
  index("idx_missions_active").on(table.isActive),
]);

/**
 * User Missions - Tracks user progress on missions
 */
export const userMissions = pgTable("user_missions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  missionId: varchar("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),

  status: missionStatusEnum("status").default("in_progress").notNull(),

  progress: integer("progress").default(0).notNull(), // Current count
  targetCount: integer("target_count").default(1).notNull(), // From mission

  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_missions_user").on(table.userId),
  index("idx_user_missions_status").on(table.status),
  unique("unq_user_mission").on(table.userId, table.missionId),
]);

export const userMissionsRelations = relations(userMissions, ({ one }) => ({
  user: one(users, {
    fields: [userMissions.userId],
    references: [users.id],
  }),
  mission: one(missions, {
    fields: [userMissions.missionId],
    references: [missions.id],
  }),
}));

/**
 * Redemption Items - Items available in the redemption shop
 */
export const redemptionItems = pgTable("redemption_items", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  costPoints: integer("cost_points").notNull(),
  itemType: redemptionItemTypeEnum("item_type").notNull(),

  // Value config depends on item type
  // commission_discount: { discount_percent: 5, max_value_cents: 20000 }
  // listing_slot: { slots: 1 }
  // featured_listing: { days: 7 }
  // inquiry_credits: { credits: 50 }
  // platform_credits: { amount_cents: 1000 }
  valueConfig: jsonb("value_config").notNull(),

  // Availability
  isActive: boolean("is_active").default(true).notNull(),
  stock: integer("stock"), // null = unlimited
  maxPerUser: integer("max_per_user"), // null = unlimited

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_redemption_items_type").on(table.itemType),
  index("idx_redemption_items_active").on(table.isActive),
]);

/**
 * Redemptions - User redemption transactions
 */
export const redemptions = pgTable("redemptions", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => redemptionItems.id, { onDelete: "cascade" }),

  pointsSpent: integer("points_spent").notNull(),

  status: varchar("status", {
    enum: ["pending", "applied", "expired", "cancelled"]
  }).default("pending").notNull(),

  // For commission discounts - which booking it was applied to
  appliedToBookingId: varchar("applied_to_booking_id"),
  appliedAt: timestamp("applied_at"),
  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_redemptions_user").on(table.userId),
  index("idx_redemptions_status").on(table.status),
]);

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(users, {
    fields: [redemptions.userId],
    references: [users.id],
  }),
  item: one(redemptionItems, {
    fields: [redemptions.itemId],
    references: [redemptionItems.id],
  }),
}));

/**
 * Social Connections - OAuth tokens for social media verification
 */
export const socialConnections = pgTable("social_connections", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  platform: varchar("platform", {
    enum: ["twitter", "instagram", "facebook", "tiktok"]
  }).notNull(),

  platformUserId: varchar("platform_user_id"),
  platformUsername: varchar("platform_username"),
  accessToken: text("access_token"), // Encrypted in practice
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),

  isConnected: boolean("is_connected").default(true).notNull(),
  lastVerifiedAt: timestamp("last_verified_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_social_connections_user").on(table.userId),
  unique("unq_social_platform").on(table.userId, table.platform),
]);

export const socialConnectionsRelations = relations(socialConnections, ({ one }) => ({
  user: one(users, {
    fields: [socialConnections.userId],
    references: [users.id],
  }),
}));

// Types
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserWithPlan = User & { plan?: Plan };

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

export type TemporaryCategory = typeof temporaryCategories.$inferSelect;
export type InsertTemporaryCategory = typeof temporaryCategories.$inferInsert;

export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type ServiceContact = typeof serviceContacts.$inferSelect;
export type InsertServiceContact = typeof serviceContacts.$inferInsert;

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

export type CustomerReview = typeof customerReviews.$inferSelect;
export type InsertCustomerReview = typeof customerReviews.$inferInsert;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export type SubmittedCategory = typeof submittedCategories.$inferSelect;
export type InsertSubmittedCategory = typeof submittedCategories.$inferInsert;

export type SelectAddress = typeof addresses.$inferSelect;

export type UserModerationAction = typeof userModerationActions.$inferSelect;
export type InsertUserModerationAction = typeof userModerationActions.$inferInsert;

export type BannedIdentifier = typeof bannedIdentifiers.$inferSelect;
export type InsertBannedIdentifier = typeof bannedIdentifiers.$inferInsert;

// ===========================================
// BOOKING REDESIGN TYPES
// ===========================================
export type Credit = typeof credits.$inferSelect;
export type InsertCredit = typeof credits.$inferInsert;

export type BlockedSlot = typeof blockedSlots.$inferSelect;
export type InsertBlockedSlot = typeof blockedSlots.$inferInsert;

export type PriceInquiry = typeof priceInquiries.$inferSelect;
export type InsertPriceInquiry = typeof priceInquiries.$inferInsert;

export type VendorQuote = typeof vendorQuotes.$inferSelect;
export type InsertVendorQuote = typeof vendorQuotes.$inferInsert;

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

// ===========================================
// COM POINTS TYPES
// ===========================================
export type ComPointsLedger = typeof comPointsLedger.$inferSelect;
export type InsertComPointsLedger = typeof comPointsLedger.$inferInsert;

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

export type UserMission = typeof userMissions.$inferSelect;
export type InsertUserMission = typeof userMissions.$inferInsert;

export type RedemptionItem = typeof redemptionItems.$inferSelect;
export type InsertRedemptionItem = typeof redemptionItems.$inferInsert;

export type Redemption = typeof redemptions.$inferSelect;
export type InsertRedemption = typeof redemptions.$inferInsert;

export type SocialConnection = typeof socialConnections.$inferSelect;
export type InsertSocialConnection = typeof socialConnections.$inferInsert;

export const insertServiceSchema = createInsertSchema(services, {
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
  contactPhone: z.string().min(10, "Valid phone number required"),
  contactEmail: z.string().email("Valid email required"),
  locations: z.array(z.string()).min(1, "At least one location required"),
  priceType: z.enum(["fixed", "list", "text"]),
  price: z.string().optional(),
  priceText: z.string().optional(),
  priceList: z.any().optional(),
  hashtags: z.array(z.string().min(1, "Hashtag must have at least 1 character")).max(5, "Maximum 5 hashtags allowed").optional(),
  subcategoryId: z.string().optional().nullable(),
}).omit({
  id: true,
  ownerId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
  status: true,
}).superRefine((val, ctx) => {
  if (val.priceType === "fixed" && (!val.price || isNaN(Number(val.price)))) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["price"],
      message: "Price is required for fixed pricing",
    });
  }
  if (val.priceType === "text" && !val.priceText) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["priceText"],
      message: "Price text is required",
    });
  }
});

// Draft schema - relaxed validation for saving incomplete services
export const insertServiceDraftSchema = createInsertSchema(services, {
  title: z.string().max(200).optional().default(""),
  description: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  contactEmail: z.string().optional().default(""),
  locations: z.array(z.string()).optional().default([]),
  priceType: z.enum(["fixed", "list", "text"]).optional().default("fixed"),
  price: z.string().optional(),
  priceText: z.string().optional(),
  priceList: z.any().optional(),
  hashtags: z.array(z.string()).max(5).optional().default([]),
  subcategoryId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  images: z.array(z.string()).optional().default([]),
  imageMetadata: z.any().optional(),
  mainImageIndex: z.number().optional().default(0),
  priceUnit: z.string().optional().default("hour"),
  acceptedPaymentMethods: z.array(z.string()).optional().default(["card", "twint", "cash"]),
}).omit({
  id: true,
  ownerId: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Review must be at least 10 characters"),
}).omit({
  id: true,
  createdAt: true,
  serviceId: true,
  userId: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertSubmittedCategorySchema = createInsertSchema(submittedCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
}).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertPlanSchema = createInsertSchema(plans, {
  name: z.string().min(3, "Plan name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
  maxImages: z.number().min(1).max(100),
  listingDurationDays: z.number().min(1).max(365),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceContactSchema = createInsertSchema(serviceContacts, {
  value: z.string().min(1, "Contact value is required"),
  contactType: z.enum(["phone", "email"]),
  name: z.string().optional(),
  role: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  isVerified: true,
  verificationCode: true,
  verificationExpiresAt: true,
});

export const insertTemporaryCategorySchema = createInsertSchema(temporaryCategories, {
  name: z.string().min(3, "Category name must be at least 3 characters").max(100),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(100),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAiConversationSchema = createInsertSchema(aiConversations, {
  conversationType: z.enum(["admin_assist", "user_support", "category_validation"]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAddressSchema = createInsertSchema(addresses, {
  street: z.string().min(1, "Street is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  postalCode: z.string().min(1, "Postal code is required").max(20),
  canton: z.string().optional(),
  label: z.string().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAddress = z.infer<typeof insertAddressSchema>;

export const insertUserModerationActionSchema = createInsertSchema(userModerationActions, {
  action: z.enum(["warn", "suspend", "ban", "kick", "reactivate"]),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertBannedIdentifierSchema = createInsertSchema(bannedIdentifiers, {
  identifierType: z.enum(["ip", "email", "phone"]),
  identifierValue: z.string().min(1, "Identifier value is required"),
  reason: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// OAuth tokens types
export type OAuthToken = typeof oauthTokens.$inferSelect;
export type InsertOAuthToken = typeof oauthTokens.$inferInsert;

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
});

export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// ===========================================
// REFERRAL SYSTEM TYPES AND SCHEMAS
// ===========================================

// Referral Config types
export type ReferralConfig = typeof referralConfig.$inferSelect;
export type InsertReferralConfig = typeof referralConfig.$inferInsert;

// Points Log types
export type PointsLog = typeof pointsLog.$inferSelect;
export type InsertPointsLog = typeof pointsLog.$inferInsert;

// Referral Transaction types
export type ReferralTransaction = typeof referralTransactions.$inferSelect;
export type InsertReferralTransaction = typeof referralTransactions.$inferInsert;

// Referral Stats types
export type ReferralStats = typeof referralStats.$inferSelect;
export type InsertReferralStats = typeof referralStats.$inferInsert;

// Extended register schema with referral code
export const registerWithReferralSchema = registerSchema.extend({
  referralCode: z.string().min(4).max(20).optional(),
});

// Referral code validation schema
export const referralCodeSchema = z.object({
  referralCode: z.string().min(4, "Referral code must be at least 4 characters").max(20),
});

// Points redemption schema
export const redeemPointsSchema = z.object({
  points: z.number().min(1, "Must redeem at least 1 point"),
  redemptionType: z.enum(["discount", "promo_package", "visibility_boost"]),
  targetId: z.string().optional(), // e.g., service ID for visibility boost
});

// Admin referral adjustment schema
export const adminReferralAdjustmentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  points: z.number(),
  reason: z.string().min(1, "Reason is required"),
});

// Referral config update schema
export const updateReferralConfigSchema = z.object({
  maxLevels: z.number().min(1).max(10).optional(),
  level1CommissionRate: z.string().optional(),
  level2CommissionRate: z.string().optional(),
  level3CommissionRate: z.string().optional(),
  pointsPerReferral: z.number().min(0).optional(),
  pointsPerFirstPurchase: z.number().min(0).optional(),
  pointsPerServiceCreation: z.number().min(0).optional(),
  pointsPerReview: z.number().min(0).optional(),
  pointsToDiscountRate: z.string().optional(),
  minPointsToRedeem: z.number().min(0).optional(),
  maxReferralsPerDay: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});

// ===========================================
// STRIPE PAYMENT SYSTEM
// ===========================================

/**
 * Service Pricing Options Table
 * Allows multiple pricing tiers per service (e.g., basic, premium, enterprise)
 */
export const servicePricingOptions = pgTable("service_pricing_options", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),

  // Pricing option details
  label: varchar("label", { length: 100 }).notNull(), // e.g., "Basic Cleaning", "Deep Clean"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),

  // Billing interval
  billingInterval: varchar("billing_interval", {
    enum: ["one_time", "hourly", "daily", "weekly", "monthly", "yearly"]
  }).default("one_time").notNull(),

  // Duration for the service (in minutes)
  durationMinutes: integer("duration_minutes"),

  // Stripe Price ID (created when pricing option is added)
  stripePriceId: varchar("stripe_price_id", { length: 255 }),

  // === NEW: Flexible Pricing Fields ===
  // Unit multipliers: e.g., { type: "pet", label: "dogs", quantity: 2, extraPrice: 1000, maxAllowed: 5 }
  includedUnits: jsonb("included_units").default(sql`'[]'::jsonb`),

  // Size pricing tiers: e.g., { type: "pet_size", options: [{label: "Small", priceAdjustment: 0}, {label: "Large", priceAdjustment: 2000}] }
  tiers: jsonb("tiers").default(sql`'[]'::jsonb`),

  // Surcharge modifiers: e.g., { weekendSurcharge: {type: "percentage", value: 20}, eveningSurcharge: {afterHour: 18, value: 1000} }
  modifiers: jsonb("modifiers").default(sql`'{}'::jsonb`),

  // Ordering
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pricing_options_service").on(table.serviceId),
  index("idx_pricing_options_active").on(table.isActive),
]);

export const servicePricingOptionsRelations = relations(servicePricingOptions, ({ one }) => ({
  service: one(services, {
    fields: [servicePricingOptions.serviceId],
    references: [services.id],
  }),
}));

/**
 * Service Availability Settings Table
 * Service-specific availability settings that override vendor defaults
 */
export const serviceAvailabilitySettings = pgTable("service_availability_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }).unique(),

  // Working hours override: { mon: { start: "09:00", end: "17:00", enabled: true }, ... }
  workingHours: jsonb("working_hours").default(sql`'{}'::jsonb`),

  // Slot generation settings
  defaultSlotDurationMinutes: integer("default_slot_duration_minutes").default(60).notNull(),
  bufferBetweenBookingsMinutes: integer("buffer_between_bookings_minutes").default(15).notNull(),

  // Booking preferences
  instantBooking: boolean("instant_booking").default(false).notNull(),
  minBookingNoticeHours: integer("min_booking_notice_hours").default(24),
  maxBookingAdvanceDays: integer("max_booking_advance_days").default(90),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_service_availability_service").on(table.serviceId),
]);

export const serviceAvailabilitySettingsRelations = relations(serviceAvailabilitySettings, ({ one }) => ({
  service: one(services, {
    fields: [serviceAvailabilitySettings.serviceId],
    references: [services.id],
  }),
}));

/**
 * Pricing Audit Log Table
 * Tracks all pricing changes for security and accountability
 */
export const pricingAuditLog = pgTable("pricing_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Who made the change
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // What was changed
  entityType: varchar("entity_type", { enum: ["service", "pricing_option"] }).notNull(),
  entityId: varchar("entity_id").notNull(),

  // Action performed
  action: varchar("action", { enum: ["create", "update", "delete", "activate", "deactivate"] }).notNull(),

  // Values
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),

  // Request metadata for security
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_pricing_audit_user").on(table.userId),
  index("idx_pricing_audit_entity").on(table.entityType, table.entityId),
  index("idx_pricing_audit_created").on(table.createdAt),
]);

export const pricingAuditLogRelations = relations(pricingAuditLog, ({ one }) => ({
  user: one(users, {
    fields: [pricingAuditLog.userId],
    references: [users.id],
  }),
}));

/**
 * Booking Sessions Table
 * Stores temporary booking sessions with locked pricing to prevent price manipulation
 */
export const bookingSessions = pgTable("booking_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Session owner
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),

  // Session token for anonymous users
  sessionToken: varchar("session_token", { length: 255 }),

  // Booking details
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  pricingOptionId: varchar("pricing_option_id").references(() => servicePricingOptions.id, { onDelete: "set null" }),

  // Locked pricing at session creation time (prevents price manipulation during checkout)
  lockedPricing: jsonb("locked_pricing").notNull(),

  // Requested time slot
  requestedStartTime: timestamp("requested_start_time"),
  requestedEndTime: timestamp("requested_end_time"),

  // Session status
  status: varchar("status", { enum: ["active", "completed", "expired", "abandoned"] }).default("active").notNull(),

  // Session expiry (default 5 minutes)
  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_booking_sessions_user").on(table.userId),
  index("idx_booking_sessions_token").on(table.sessionToken),
  index("idx_booking_sessions_service").on(table.serviceId),
  index("idx_booking_sessions_status").on(table.status),
  index("idx_booking_sessions_expires").on(table.expiresAt),
]);

export const bookingSessionsRelations = relations(bookingSessions, ({ one }) => ({
  user: one(users, {
    fields: [bookingSessions.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [bookingSessions.serviceId],
    references: [services.id],
  }),
  pricingOption: one(servicePricingOptions, {
    fields: [bookingSessions.pricingOptionId],
    references: [servicePricingOptions.id],
  }),
}));

/**
 * Orders Table
 * Tracks all orders/purchases made on the platform
 */
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number", { length: 20 }).unique().notNull(),

  // Parties involved
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  pricingOptionId: varchar("pricing_option_id").references(() => servicePricingOptions.id, { onDelete: "set null" }),

  // Pricing at time of order (snapshot)
  priceLabel: varchar("price_label", { length: 100 }),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),

  // Order status
  status: varchar("status", {
    enum: ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded", "disputed"]
  }).default("pending").notNull(),

  // Payment info (Stripe)
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  paymentStatus: varchar("payment_status", {
    enum: ["pending", "processing", "succeeded", "failed", "refunded", "cancelled"]
  }).default("pending").notNull(),
  paidAt: timestamp("paid_at"),

  // Vendor payout
  vendorPayoutAmount: decimal("vendor_payout_amount", { precision: 10, scale: 2 }),
  vendorPayoutStatus: varchar("vendor_payout_status", {
    enum: ["pending", "processing", "paid", "failed"]
  }).default("pending").notNull(),
  vendorPaidAt: timestamp("vendor_paid_at"),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),

  // Linked booking (if applicable)
  bookingId: varchar("booking_id"),

  // Notes
  customerNotes: text("customer_notes"),
  vendorNotes: text("vendor_notes"),
  adminNotes: text("admin_notes"),

  // Referral tracking (for commission calculation)
  referralProcessed: boolean("referral_processed").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_orders_customer").on(table.customerId),
  index("idx_orders_vendor").on(table.vendorId),
  index("idx_orders_service").on(table.serviceId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_payment_status").on(table.paymentStatus),
  index("idx_orders_created").on(table.createdAt),
]);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
    relationName: "customerOrders",
  }),
  vendor: one(users, {
    fields: [orders.vendorId],
    references: [users.id],
    relationName: "vendorOrders",
  }),
  service: one(services, {
    fields: [orders.serviceId],
    references: [services.id],
  }),
  pricingOption: one(servicePricingOptions, {
    fields: [orders.pricingOptionId],
    references: [servicePricingOptions.id],
  }),
  booking: one(bookings, {
    fields: [orders.bookingId],
    references: [bookings.id],
  }),
  chatConversation: one(chatConversations),
}));

// ===========================================
// BOOKING & CALENDAR SYSTEM
// ===========================================

/**
 * Vendor Availability Settings
 * Stores vendor's general availability preferences
 */
export const vendorAvailabilitySettings = pgTable("vendor_availability_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Default working hours (JSON: { mon: { start: "09:00", end: "17:00" }, ... })
  defaultWorkingHours: jsonb("default_working_hours").default(sql`'{}'::jsonb`),

  // Timezone
  timezone: varchar("timezone", { length: 50 }).default("Europe/Zurich").notNull(),

  // Booking settings
  minBookingNoticeHours: integer("min_booking_notice_hours").default(24).notNull(),
  maxBookingAdvanceDays: integer("max_booking_advance_days").default(90).notNull(),
  defaultSlotDurationMinutes: integer("default_slot_duration_minutes").default(60).notNull(),
  bufferBetweenBookingsMinutes: integer("buffer_between_bookings_minutes").default(15).notNull(),

  // Auto-accept settings
  autoAcceptBookings: boolean("auto_accept_bookings").default(false).notNull(),
  requireDeposit: boolean("require_deposit").default(false).notNull(),
  depositPercentage: integer("deposit_percentage").default(20),

  // Notifications
  emailNotifications: boolean("email_notifications").default(true).notNull(),
  smsNotifications: boolean("sms_notifications").default(false).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_vendor_availability_user").on(table.userId),
]);

export const vendorAvailabilitySettingsRelations = relations(vendorAvailabilitySettings, ({ one }) => ({
  user: one(users, {
    fields: [vendorAvailabilitySettings.userId],
    references: [users.id],
  }),
}));

/**
 * Vendor Calendar Blocks
 * Manual blocks, holidays, unavailable periods
 */
export const vendorCalendarBlocks = pgTable("vendor_calendar_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Block period
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),

  // Block type
  blockType: varchar("block_type", {
    enum: ["manual", "holiday", "personal", "break", "maintenance"]
  }).default("manual").notNull(),

  // Recurrence (null = one-time, else: daily, weekly, monthly)
  recurrence: varchar("recurrence", { enum: ["daily", "weekly", "monthly"] }),
  recurrenceEndDate: timestamp("recurrence_end_date"),

  // Details
  title: varchar("title", { length: 100 }),
  notes: text("notes"),

  // For specific service blocking (null = all services blocked)
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "cascade" }),

  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_calendar_blocks_user").on(table.userId),
  index("idx_calendar_blocks_time").on(table.startTime, table.endTime),
  index("idx_calendar_blocks_service").on(table.serviceId),
]);

export const vendorCalendarBlocksRelations = relations(vendorCalendarBlocks, ({ one }) => ({
  user: one(users, {
    fields: [vendorCalendarBlocks.userId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [vendorCalendarBlocks.serviceId],
    references: [services.id],
  }),
}));

/**
 * Bookings Table
 * All booking requests and confirmed bookings
 */
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingNumber: varchar("booking_number", { length: 20 }).unique().notNull(),

  // Parties
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  pricingOptionId: varchar("pricing_option_id").references(() => servicePricingOptions.id, { onDelete: "set null" }),

  // Payment method: card (escrow), twint (instant), cash (no payment)
  paymentMethod: varchar("payment_method", {
    enum: ["card", "twint", "cash"]
  }).notNull().default("card"),

  // Stripe payment tracking
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

  // TWINT-specific fields
  twintTransactionId: varchar("twint_transaction_id", { length: 255 }),
  twintRefundId: varchar("twint_refund_id", { length: 255 }),

  // Requested time slot
  requestedStartTime: timestamp("requested_start_time").notNull(),
  requestedEndTime: timestamp("requested_end_time").notNull(),

  // Confirmed time slot (may differ from requested if alternative proposed)
  confirmedStartTime: timestamp("confirmed_start_time"),
  confirmedEndTime: timestamp("confirmed_end_time"),

  // Status workflow: pending → accepted/rejected/alternative_proposed → confirmed/cancelled
  status: varchar("status", {
    enum: [
      "pending",           // Initial request from customer
      "accepted",          // Vendor accepted
      "rejected",          // Vendor rejected
      "alternative_proposed", // Vendor proposed different time
      "confirmed",         // Customer confirmed (after alternative or deposit paid)
      "in_progress",       // Service being delivered
      "completed",         // Service completed
      "cancelled",         // Cancelled by either party
      "no_show"            // Customer didn't show up
    ]
  }).default("pending").notNull(),

  // Customer confirmation for escrow release
  confirmedByCustomer: boolean("confirmed_by_customer").default(false),
  customerConfirmedAt: timestamp("customer_confirmed_at"),

  // Alternative proposal (if vendor proposes different time)
  alternativeStartTime: timestamp("alternative_start_time"),
  alternativeEndTime: timestamp("alternative_end_time"),
  alternativeMessage: text("alternative_message"),
  alternativeExpiresAt: timestamp("alternative_expires_at"),

  // Queue position (for waitlist functionality)
  queuePosition: integer("queue_position"),

  // Customer details at booking time
  customerMessage: text("customer_message"),
  customerPhone: varchar("customer_phone", { length: 50 }),
  customerAddress: text("customer_address"),

  // Vendor response
  vendorMessage: text("vendor_message"),
  rejectionReason: text("rejection_reason"),

  // Cancellation
  cancelledBy: varchar("cancelled_by", { enum: ["customer", "vendor", "system"] }),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),

  // Reminders sent
  reminderSentAt: timestamp("reminder_sent_at"),

  // Review request tracking (automatic system-sent request)
  reviewRequestSentAt: timestamp("review_request_sent_at"),

  // Manual review request by vendor (max 2 requests, 3-day cooldown)
  vendorReviewRequestCount: integer("vendor_review_request_count").default(0),
  lastVendorReviewRequestAt: timestamp("last_vendor_review_request_at"),

  // Timestamps for status changes
  acceptedAt: timestamp("accepted_at"),
  confirmedAt: timestamp("confirmed_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_bookings_customer").on(table.customerId),
  index("idx_bookings_vendor").on(table.vendorId),
  index("idx_bookings_service").on(table.serviceId),
  index("idx_bookings_status").on(table.status),
  index("idx_bookings_requested_time").on(table.requestedStartTime),
  index("idx_bookings_confirmed_time").on(table.confirmedStartTime),
  index("idx_bookings_payment_method").on(table.paymentMethod),
]);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
    relationName: "customerBookings",
  }),
  vendor: one(users, {
    fields: [bookings.vendorId],
    references: [users.id],
    relationName: "vendorBookings",
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  pricingOption: one(servicePricingOptions, {
    fields: [bookings.pricingOptionId],
    references: [servicePricingOptions.id],
  }),
  orders: many(orders),
  chatConversation: one(chatConversations),
  escrowTransaction: one(escrowTransactions),
}));

// ===========================================
// ESCROW TRANSACTIONS SYSTEM
// ===========================================

/**
 * Escrow Transactions Table
 * Tracks payment flow for bookings (escrow for card, instant for TWINT)
 */
export const escrowTransactions = pgTable("escrow_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }).unique(),

  // Payment details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),
  platformFee: decimal("platform_fee", { precision: 10, scale: 2 }).notNull(),
  vendorAmount: decimal("vendor_amount", { precision: 10, scale: 2 }).notNull(),

  // Payment method (mirrors booking for easy querying)
  paymentMethod: varchar("payment_method", {
    enum: ["card", "twint", "cash"]
  }).notNull(),

  // Stripe tracking
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  stripeTransferId: varchar("stripe_transfer_id", { length: 255 }),

  // TWINT-specific
  twintTransactionId: varchar("twint_transaction_id", { length: 255 }),
  twintRefundId: varchar("twint_refund_id", { length: 255 }),

  // Escrow status:
  // - pending: payment initiated but not confirmed
  // - held: card payment authorized but not captured (escrow)
  // - released: funds transferred to vendor
  // - refund_requested: customer requested refund (TWINT only)
  // - refunded: funds returned to customer
  // - cancelled: payment cancelled before completion
  // - failed: payment failed
  // - disputed: dispute raised, auto-release paused
  status: varchar("status", {
    enum: ["pending", "held", "released", "refund_requested", "refunded", "cancelled", "failed", "disputed"]
  }).default("pending").notNull(),

  // Refund tracking
  refundRequestedAt: timestamp("refund_requested_at"),
  refundReason: text("refund_reason"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),

  // Auto-release settings (for card escrow)
  autoReleaseAt: timestamp("auto_release_at"),
  autoReleaseWarningSentAt: timestamp("auto_release_warning_sent_at"),

  // Timestamps
  paidAt: timestamp("paid_at"),
  heldAt: timestamp("held_at"),
  releasedAt: timestamp("released_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_escrow_booking").on(table.bookingId),
  index("idx_escrow_status").on(table.status),
  index("idx_escrow_payment_method").on(table.paymentMethod),
  index("idx_escrow_auto_release").on(table.autoReleaseAt),
]);

export const escrowTransactionsRelations = relations(escrowTransactions, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [escrowTransactions.bookingId],
    references: [bookings.id],
  }),
  tips: many(tips),
}));

// ===========================================
// TIPS SYSTEM
// ===========================================

/**
 * Tips Table
 * Allows customers to tip vendors after service completion
 */
export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),
  escrowTransactionId: varchar("escrow_transaction_id").references(() => escrowTransactions.id, { onDelete: "set null" }),

  // Parties
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Amount
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),

  // Optional message with the tip
  message: text("message"),

  // Payment tracking
  paymentMethod: varchar("payment_method", {
    enum: ["card", "twint", "cash"]
  }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

  // Status
  status: varchar("status", {
    enum: ["pending", "completed", "failed", "refunded"]
  }).default("pending").notNull(),

  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_tips_booking").on(table.bookingId),
  index("idx_tips_customer").on(table.customerId),
  index("idx_tips_vendor").on(table.vendorId),
  index("idx_tips_status").on(table.status),
]);

export const tipsRelations = relations(tips, ({ one }) => ({
  booking: one(bookings, {
    fields: [tips.bookingId],
    references: [bookings.id],
  }),
  escrowTransaction: one(escrowTransactions, {
    fields: [tips.escrowTransactionId],
    references: [escrowTransactions.id],
  }),
  customer: one(users, {
    fields: [tips.customerId],
    references: [users.id],
    relationName: "customerTips",
  }),
  vendor: one(users, {
    fields: [tips.vendorId],
    references: [users.id],
    relationName: "vendorTips",
  }),
}));

// ===========================================
// ESCROW DISPUTES SYSTEM
// ===========================================

/**
 * Escrow Disputes Table
 * Tracks disputes raised by customers or vendors for escrow transactions
 */
export const escrowDisputes = pgTable("escrow_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  escrowTransactionId: varchar("escrow_transaction_id").notNull().references(() => escrowTransactions.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id, { onDelete: "cascade" }),

  // Who raised the dispute
  raisedBy: varchar("raised_by", { enum: ["customer", "vendor"] }).notNull(),
  raisedByUserId: varchar("raised_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Dispute details
  reason: varchar("reason", {
    enum: ["service_not_provided", "poor_quality", "wrong_service", "overcharged", "no_show", "other"]
  }).notNull(),
  description: text("description").notNull(),
  evidenceUrls: jsonb("evidence_urls").$type<string[]>(),

  // Resolution
  status: varchar("status", {
    enum: ["open", "under_review", "resolved_customer", "resolved_vendor", "resolved_split", "closed"]
  }).default("open").notNull(),

  resolvedBy: varchar("resolved_by").references(() => users.id), // Admin who resolved
  resolution: text("resolution"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("idx_escrow_disputes_escrow").on(table.escrowTransactionId),
  index("idx_escrow_disputes_booking").on(table.bookingId),
  index("idx_escrow_disputes_status").on(table.status),
  index("idx_escrow_disputes_raised_by").on(table.raisedByUserId),
]);

export const escrowDisputesRelations = relations(escrowDisputes, ({ one }) => ({
  escrowTransaction: one(escrowTransactions, {
    fields: [escrowDisputes.escrowTransactionId],
    references: [escrowTransactions.id],
  }),
  booking: one(bookings, {
    fields: [escrowDisputes.bookingId],
    references: [bookings.id],
  }),
  raisedByUser: one(users, {
    fields: [escrowDisputes.raisedByUserId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [escrowDisputes.resolvedBy],
    references: [users.id],
  }),
}));

// ===========================================
// CHAT SYSTEM
// ===========================================

/**
 * Chat Conversations Table
 * Links conversations to bookings/orders
 */
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Participants
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  vendorId: varchar("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Context (at least one should be set)
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").references(() => orders.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id, { onDelete: "set null" }),

  // Conversation status
  status: varchar("status", {
    enum: ["active", "archived", "blocked", "closed"]
  }).default("active").notNull(),

  // Last activity tracking
  lastMessageAt: timestamp("last_message_at"),
  lastMessagePreview: varchar("last_message_preview", { length: 100 }),

  // Unread counts (per participant)
  customerUnreadCount: integer("customer_unread_count").default(0).notNull(),
  vendorUnreadCount: integer("vendor_unread_count").default(0).notNull(),

  // Moderation
  flaggedForReview: boolean("flagged_for_review").default(false).notNull(),
  flagReason: text("flag_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_conversations_customer").on(table.customerId),
  index("idx_chat_conversations_vendor").on(table.vendorId),
  index("idx_chat_conversations_booking").on(table.bookingId),
  index("idx_chat_conversations_order").on(table.orderId),
  index("idx_chat_conversations_last_message").on(table.lastMessageAt),
  // Unique constraint to prevent duplicate conversations between same parties for same service
  // Note: This only prevents duplicates with the same serviceId - conversations with NULL serviceId
  // are considered general inquiries and should also be unique per customer-vendor pair
  unique("unique_active_conversation").on(table.customerId, table.vendorId, table.serviceId).nullsNotDistinct(),
]);

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  customer: one(users, {
    fields: [chatConversations.customerId],
    references: [users.id],
    relationName: "customerConversations",
  }),
  vendor: one(users, {
    fields: [chatConversations.vendorId],
    references: [users.id],
    relationName: "vendorConversations",
  }),
  booking: one(bookings, {
    fields: [chatConversations.bookingId],
    references: [bookings.id],
  }),
  order: one(orders, {
    fields: [chatConversations.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [chatConversations.serviceId],
    references: [services.id],
  }),
  messages: many(chatMessages),
}));

/**
 * Chat Messages Table
 * Individual messages with moderation tracking
 */
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id, { onDelete: "cascade" }),

  // Sender
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderRole: varchar("sender_role", { enum: ["customer", "vendor", "system"] }).notNull(),

  // Message content
  content: text("content").notNull(),
  originalContent: text("original_content"), // Stored if message was modified by filter

  // Message type
  messageType: varchar("message_type", {
    enum: ["text", "image", "file", "system", "booking_update", "payment_update"]
  }).default("text").notNull(),

  // Attachments (for images/files)
  attachments: jsonb("attachments").default(sql`'[]'::jsonb`),

  // Moderation
  wasFiltered: boolean("was_filtered").default(false).notNull(),
  filterReason: varchar("filter_reason", {
    enum: ["profanity", "contact_info", "spam", "manual"]
  }),
  blockedContent: text("blocked_content"), // What was blocked (for admin review)

  // Read status
  readAt: timestamp("read_at"),

  // Edit/delete
  isEdited: boolean("is_edited").default(false).notNull(),
  editedAt: timestamp("edited_at"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_conversation").on(table.conversationId),
  index("idx_chat_messages_sender").on(table.senderId),
  index("idx_chat_messages_created").on(table.createdAt),
]);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

/**
 * User Reports Table
 * For reporting users in chat conversations
 */
export const userReports = pgTable("user_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Reporter
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Reported user
  reportedUserId: varchar("reported_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Context
  conversationId: varchar("conversation_id").references(() => chatConversations.id, { onDelete: "cascade" }),
  messageId: varchar("message_id").references(() => chatMessages.id, { onDelete: "cascade" }),

  // Report details
  reportType: varchar("report_type", {
    enum: ["spam", "harassment", "scam", "inappropriate_content", "fake_account", "other"]
  }).notNull(),

  description: text("description").notNull(),

  // AI moderation results
  aiSeverity: varchar("ai_severity", {
    enum: ["low", "medium", "high", "critical"]
  }),

  aiAnalysis: text("ai_analysis"),

  aiRecommendation: text("ai_recommendation"),

  // Status
  status: varchar("status", {
    enum: ["pending", "under_review", "resolved", "dismissed"]
  }).default("pending").notNull(),

  // Resolution
  adminDecision: varchar("admin_decision", {
    enum: ["warning", "suspension", "ban", "no_action"]
  }),

  adminNotes: text("admin_notes"),

  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_reports_reporter").on(table.reporterId),
  index("idx_user_reports_reported").on(table.reportedUserId),
  index("idx_user_reports_conversation").on(table.conversationId),
  index("idx_user_reports_status").on(table.status),
  index("idx_user_reports_severity").on(table.aiSeverity),
]);

export const userReportsRelations = relations(userReports, ({ one }) => ({
  reporter: one(users, {
    fields: [userReports.reporterId],
    references: [users.id],
    relationName: "reportsFiled",
  }),
  reportedUser: one(users, {
    fields: [userReports.reportedUserId],
    references: [users.id],
    relationName: "reportsReceived",
  }),
  conversation: one(chatConversations, {
    fields: [userReports.conversationId],
    references: [chatConversations.id],
  }),
  message: one(chatMessages, {
    fields: [userReports.messageId],
    references: [chatMessages.id],
  }),
  resolvedByUser: one(users, {
    fields: [userReports.resolvedBy],
    references: [users.id],
    relationName: "reportsResolved",
  }),
}));

/**
 * User Blocks Table
 * For blocking users in chat
 */
export const userBlocks = pgTable("user_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Blocker
  blockerId: varchar("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Blocked user
  blockedUserId: varchar("blocked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Reason
  reason: text("reason"),

  // Block scope
  blockType: varchar("block_type", {
    enum: ["chat_only", "full_block"] // chat_only blocks only messaging, full_block blocks all interaction
  }).default("chat_only").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_user_blocks_blocker").on(table.blockerId),
  index("idx_user_blocks_blocked").on(table.blockedUserId),
  unique("unique_user_block").on(table.blockerId, table.blockedUserId),
]);

export const userBlocksRelations = relations(userBlocks, ({ one }) => ({
  blocker: one(users, {
    fields: [userBlocks.blockerId],
    references: [users.id],
    relationName: "blocksGiven",
  }),
  blockedUser: one(users, {
    fields: [userBlocks.blockedUserId],
    references: [users.id],
    relationName: "blocksReceived",
  }),
}));

// ===========================================
// STRIPE USER EXTENSIONS (add to users table later via migration)
// Note: These fields should be added to the users table
// stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
// stripeConnectAccountId: varchar("stripe_connect_account_id", { length: 255 }),
// stripeConnectOnboarded: boolean("stripe_connect_onboarded").default(false),
// ===========================================

// ===========================================
// NOTIFICATION SYSTEM
// ===========================================

/**
 * Notification Types Enum
 * Defines all possible notification categories
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "message",      // New chat message
  "booking",      // Booking updates (new, accepted, rejected, etc.)
  "referral",     // Referral-related (new referral, commission earned)
  "service",      // Service updates (approved, featured, etc.)
  "payment",      // Payment-related (received, payout, etc.)
  "system",       // System notifications (maintenance, updates)
  "review",       // New review received
  "promotion",    // Promotional notifications
  "tip",          // Tip received from customer
  "question",     // New question or answer on listing
]);

/**
 * Notifications Table
 * Stores all user notifications with AI prioritization support
 */
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Notification content
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  icon: varchar("icon", { length: 50 }), // Icon name for UI (e.g., "message", "bell", "dollar")

  // Related entities (for navigation)
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'booking', 'conversation', 'service', 'order'
  relatedEntityId: varchar("related_entity_id"),
  actionUrl: varchar("action_url", { length: 500 }), // Where to navigate on click

  // AI Prioritization
  priority: integer("priority").default(5).notNull(), // 1 (highest) to 10 (lowest)
  aiRelevanceScore: decimal("ai_relevance_score", { precision: 4, scale: 3 }), // 0.000 to 1.000
  aiReasoning: text("ai_reasoning"), // Why AI assigned this priority

  // Status tracking
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  isDismissed: boolean("is_dismissed").default(false).notNull(),

  // Delivery tracking
  deliveredVia: jsonb("delivered_via").default([]).notNull(), // ['in_app', 'email', 'push']
  emailSentAt: timestamp("email_sent_at"),
  pushSentAt: timestamp("push_sent_at"),

  // Metadata
  metadata: jsonb("metadata").default({}), // Additional data specific to notification type

  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Optional expiration
}, (table) => [
  index("idx_notifications_user").on(table.userId),
  index("idx_notifications_user_unread").on(table.userId, table.isRead),
  index("idx_notifications_type").on(table.type),
  index("idx_notifications_created").on(table.createdAt),
  index("idx_notifications_priority").on(table.userId, table.priority),
]);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

/**
 * Notification Preferences Table
 * User-specific notification settings
 */
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Global toggle
  notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),

  // Delivery method toggles
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  pushEnabled: boolean("push_enabled").default(false).notNull(),

  // Per-type settings (stored as JSON for flexibility)
  // Each type has { in_app: boolean, email: boolean, push: boolean }
  typeSettings: jsonb("type_settings").default({
    message: { in_app: true, email: true, push: true },
    booking: { in_app: true, email: true, push: true },
    question: { in_app: true, email: true, push: false }, // Q&A notifications
    tip: { in_app: true, email: true, push: false }, // Tip notifications
    referral: { in_app: true, email: false, push: false },
    service: { in_app: true, email: false, push: false },
    payment: { in_app: true, email: true, push: true },
    system: { in_app: true, email: false, push: false },
    review: { in_app: true, email: true, push: false },
    promotion: { in_app: true, email: false, push: false },
  }).notNull(),

  // Quiet hours (do not disturb)
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  quietHoursStart: varchar("quiet_hours_start", { length: 5 }), // "22:00" format
  quietHoursEnd: varchar("quiet_hours_end", { length: 5 }),     // "08:00" format
  quietHoursTimezone: varchar("quiet_hours_timezone", { length: 50 }).default("UTC"),

  // Additional preferences
  soundEnabled: boolean("sound_enabled").default(true).notNull(),
  vibrationEnabled: boolean("vibration_enabled").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

/**
 * Push Subscriptions Table
 * Stores Web Push API subscription data for each user device
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Web Push subscription data (from PushSubscription object)
  endpoint: text("endpoint").notNull(),
  p256dhKey: text("p256dh_key").notNull(), // Public key for encryption
  authKey: text("auth_key").notNull(),     // Auth secret

  // Device info
  userAgent: varchar("user_agent", { length: 500 }),
  deviceName: varchar("device_name", { length: 100 }),
  deviceType: varchar("device_type", { length: 20 }), // 'desktop', 'mobile', 'tablet'

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lastFailureReason: text("last_failure_reason"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
}, (table) => [
  index("idx_push_subscriptions_user").on(table.userId),
  index("idx_push_subscriptions_active").on(table.userId, table.isActive),
  index("idx_push_subscriptions_endpoint").on(table.endpoint),
]);

/**
 * Listing Questions Table
 */
export const listingQuestions = pgTable("listing_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceId: varchar("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who asked
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  isAnswered: boolean("is_answered").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qa_questions_service_id").on(table.serviceId),
  index("idx_qa_questions_user_id").on(table.userId),
]);

export const listingQuestionsRelations = relations(listingQuestions, ({ one, many }) => ({
  service: one(services, {
    fields: [listingQuestions.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [listingQuestions.userId],
    references: [users.id],
  }),
  answers: many(listingAnswers),
}));

/**
 * Listing Answers Table
 */
export const listingAnswers = pgTable("listing_answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull().references(() => listingQuestions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who answered
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(), // Per-answer privacy - controls visibility of this Q&A pair
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qa_answers_question_id").on(table.questionId),
  index("idx_qa_answers_user_id").on(table.userId),
]);

export const listingAnswersRelations = relations(listingAnswers, ({ one }) => ({
  question: one(listingQuestions, {
    fields: [listingAnswers.questionId],
    references: [listingQuestions.id],
  }),
  user: one(users, {
    fields: [listingAnswers.userId],
    references: [users.id],
  }),
}));

/*
 * Types for Questions and Answers
 */
export type ListingQuestion = typeof listingQuestions.$inferSelect;
export type InsertListingQuestion = typeof listingQuestions.$inferInsert;
export type ListingAnswer = typeof listingAnswers.$inferSelect;
export type InsertListingAnswer = typeof listingAnswers.$inferInsert;

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// ===========================================
// INSERT SCHEMAS
// ===========================================

export const insertServicePricingOptionSchema = createInsertSchema(servicePricingOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceAvailabilitySettingsSchema = createInsertSchema(serviceAvailabilitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPricingAuditLogSchema = createInsertSchema(pricingAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSessionSchema = createInsertSchema(bookingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorAvailabilitySettingsSchema = createInsertSchema(vendorAvailabilitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorCalendarBlockSchema = createInsertSchema(vendorCalendarBlocks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscrowTransactionSchema = createInsertSchema(escrowTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEscrowDisputeSchema = createInsertSchema(escrowDisputes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

// Notification preferences update schema (for API validation)
export const updateNotificationPreferencesSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  typeSettings: z.record(z.object({
    in_app: z.boolean(),
    email: z.boolean(),
    push: z.boolean(),
  })).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursTimezone: z.string().optional(),
  soundEnabled: z.boolean().optional(),
  vibrationEnabled: z.boolean().optional(),
});

// ===========================================
// TYPE EXPORTS
// ===========================================

export type ServicePricingOption = typeof servicePricingOptions.$inferSelect;
export type InsertServicePricingOption = typeof servicePricingOptions.$inferInsert;

export type ServiceAvailabilitySettings = typeof serviceAvailabilitySettings.$inferSelect;
export type InsertServiceAvailabilitySettings = typeof serviceAvailabilitySettings.$inferInsert;

export type PricingAuditLog = typeof pricingAuditLog.$inferSelect;
export type InsertPricingAuditLog = typeof pricingAuditLog.$inferInsert;

export type BookingSession = typeof bookingSessions.$inferSelect;
export type InsertBookingSession = typeof bookingSessions.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export type VendorAvailabilitySettings = typeof vendorAvailabilitySettings.$inferSelect;
export type InsertVendorAvailabilitySettings = typeof vendorAvailabilitySettings.$inferInsert;

export type VendorCalendarBlock = typeof vendorCalendarBlocks.$inferSelect;
export type InsertVendorCalendarBlock = typeof vendorCalendarBlocks.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type InsertEscrowTransaction = typeof escrowTransactions.$inferInsert;

export type EscrowDispute = typeof escrowDisputes.$inferSelect;
export type InsertEscrowDispute = typeof escrowDisputes.$inferInsert;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ===========================================
// E2E TEST BUG REPORTS
// ===========================================

/**
 * E2E Test Bug Reports Table
 * Stores automated test failures for admin review
 */
export const e2eBugReports = pgTable("e2e_bug_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),

  // Test identification
  testFile: varchar("test_file", { length: 255 }).notNull(),
  testName: varchar("test_name", { length: 500 }).notNull(),
  testSuite: varchar("test_suite", { length: 255 }),

  // Error details
  errorType: varchar("error_type", { length: 100 }).notNull(), // timeout, assertion, network, etc.
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),

  // Context for debugging
  screenshotUrl: varchar("screenshot_url", { length: 500 }),
  pageUrl: varchar("page_url", { length: 500 }),
  userAgent: varchar("user_agent", { length: 500 }),

  // Test user context
  testUserId: varchar("test_user_id", { length: 100 }),
  testUserRole: varchar("test_user_role", { length: 50 }), // customer, vendor, admin

  // LLM-friendly prompt
  llmPrompt: text("llm_prompt"), // Pre-formatted prompt to paste into LLM for fixing

  // Steps to reproduce
  stepsToReproduce: jsonb("steps_to_reproduce").default([]),

  // Related data
  apiEndpoint: varchar("api_endpoint", { length: 255 }),
  apiResponse: jsonb("api_response"),
  requestPayload: jsonb("request_payload"),

  // Status tracking
  status: varchar("status", { enum: ["new", "investigating", "fixed", "wont_fix", "duplicate"] }).default("new").notNull(),
  priority: varchar("priority", { enum: ["critical", "high", "medium", "low"] }).default("medium").notNull(),
  assignedTo: varchar("assigned_to", { length: 100 }),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),

  // Metadata
  browserName: varchar("browser_name", { length: 50 }),
  browserVersion: varchar("browser_version", { length: 50 }),
  runId: varchar("run_id", { length: 100 }), // Test run identifier
  retryCount: integer("retry_count").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_bug_reports_status").on(table.status),
  index("idx_bug_reports_priority").on(table.priority),
  index("idx_bug_reports_created").on(table.createdAt),
  index("idx_bug_reports_test").on(table.testFile, table.testName),
]);

export type E2EBugReport = typeof e2eBugReports.$inferSelect;
export type InsertE2EBugReport = typeof e2eBugReports.$inferInsert;

export const insertE2EBugReportSchema = createInsertSchema(e2eBugReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// User Reports
export const insertUserReportSchema = createInsertSchema(userReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserReport = typeof userReports.$inferSelect;
export type InsertUserReport = typeof userReports.$inferInsert;

// User Blocks
export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true,
});

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

// Payment method constants
export const PAYMENT_METHODS = ["card", "twint", "cash"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// Escrow status constants
export const ESCROW_STATUSES = [
  "pending",
  "held",
  "released",
  "refund_requested",
  "refunded",
  "cancelled",
  "failed",
  "disputed",
] as const;
export type EscrowStatus = typeof ESCROW_STATUSES[number];

// Notification type constants for use throughout the app
export const NOTIFICATION_TYPES = [
  "message",
  "booking",
  "referral",
  "service",
  "payment",
  "system",
  "review",
  "promotion",
  "tip",
  "question",
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

// Tips types
export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

// Review Removal Request types
export type ReviewRemovalRequest = typeof reviewRemovalRequests.$inferSelect;
export type InsertReviewRemovalRequest = typeof reviewRemovalRequests.$inferInsert;

// ============================================
// Orphan Image Archiving System
// ============================================

// Reason why an image was archived
export const archiveReasonEnum = pgEnum("archive_reason", [
  "draft_deleted",
  "form_abandoned",
  "service_deleted",
  "unlinked_cleanup",
  "manual"
]);

// Archived images table - stores compressed versions of orphaned images
export const archivedImages = pgTable("archived_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalPath: varchar("original_path", { length: 500 }).notNull(), // Original path in storage
  archivePath: varchar("archive_path", { length: 500 }).notNull(), // Compressed archive path
  originalSizeBytes: integer("original_size_bytes"),
  compressedSizeBytes: integer("compressed_size_bytes"),
  compressionQuality: integer("compression_quality").default(70).notNull(),
  reason: archiveReasonEnum("reason").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // User who uploaded (if known)
  serviceId: varchar("service_id"), // Associated service ID (if any, at time of archival)
  metadata: jsonb("metadata"), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(), // 6 months from creation
}, (table) => [
  index("idx_archived_images_expires").on(table.expiresAt),
  index("idx_archived_images_user").on(table.userId),
]);

// Orphan image cleanup logs - for admin visibility
export const orphanImageLogs = pgTable("orphan_image_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  action: varchar("action", { enum: ["archived", "deleted", "cleanup_started", "cleanup_completed"] }).notNull(),
  imagePath: varchar("image_path", { length: 500 }),
  archiveId: varchar("archive_id").references(() => archivedImages.id, { onDelete: "set null" }),
  reason: varchar("reason", { length: 255 }),
  details: jsonb("details"), // Additional details (count, duration, etc.)
  triggeredBy: varchar("triggered_by", { enum: ["system", "user", "scheduled", "admin"] }).default("system").notNull(),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: "set null" }), // If triggered by admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertArchivedImageSchema = createInsertSchema(archivedImages).omit({
  id: true,
  createdAt: true,
});

export const insertOrphanImageLogSchema = createInsertSchema(orphanImageLogs).omit({
  id: true,
  createdAt: true,
});

export type ArchivedImage = typeof archivedImages.$inferSelect;
export type InsertArchivedImage = typeof archivedImages.$inferInsert;
export type OrphanImageLog = typeof orphanImageLogs.$inferSelect;
export type InsertOrphanImageLog = typeof orphanImageLogs.$inferInsert;
