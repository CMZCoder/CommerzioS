/**
 * Service Requests & Proposals Schema
 * 
 * Implements the demand-led bidding system where customers post requests
 * and verified vendors submit structured proposals.
 */

import { pgTable, text, timestamp, uuid, decimal, boolean, integer, jsonb, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, services } from "./schema";

// ============================================
// ENUMS
// ============================================

export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "draft",           // Customer is still editing
  "open",            // Published, accepting proposals
  "booked",          // A proposal was accepted, booking created
  "suspended",       // Temporarily hidden (by user or admin)
  "cancelled",       // Customer cancelled
  "expired"          // No proposals accepted within deadline
]);

export const moderationStatusEnum = pgEnum("moderation_status", [
  "pending_review",  // Awaiting AI moderation
  "approved",        // Passed moderation
  "rejected",        // Failed moderation
  "flagged"          // Requires manual review
]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "pending",         // Awaiting customer response
  "viewed",          // Customer has seen it
  "accepted",        // Customer accepted, booking created
  "rejected",        // Customer explicitly rejected
  "withdrawn",       // Vendor withdrew their proposal
  "expired"          // 48-hour window passed
]);

export const paymentMethodEnum = pgEnum("proposal_payment_method", [
  "card",            // Platform-processed card payment
  "twint",           // TWINT (off-platform for commission purposes)
  "cash"             // Cash (off-platform)
]);

export const paymentTimingEnum = pgEnum("proposal_payment_timing", [
  "upfront",         // Pay when booking confirmed
  "on_completion"    // Pay after service delivered
]);

// ============================================
// SERVICE REQUESTS (Customer Posts)
// ============================================

export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Who posted it
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // What they need
  title: text("title").notNull(),
  description: text("description").notNull(),
  categoryId: text("category_id"),                    // Main category
  subcategoryId: text("subcategory_id"),              // Subcategory
  
  // Budget
  budgetMin: decimal("budget_min", { precision: 10, scale: 2 }),
  budgetMax: decimal("budget_max", { precision: 10, scale: 2 }),
  budgetFlexible: boolean("budget_flexible").default(false),
  
  // When they need it
  preferredDateStart: timestamp("preferred_date_start"),
  preferredDateEnd: timestamp("preferred_date_end"),
  flexibleDates: boolean("flexible_dates").default(false),
  urgency: text("urgency"),                           // 'asap', 'this_week', 'this_month', 'flexible'
  
  // Location (PostGIS-ready)
  // Public: Shows fuzzy circle (city-level) to vendors browsing
  // Private: Exact address only visible to vendors with accepted proposals
  locationCity: text("location_city"),
  locationCanton: text("location_canton"),
  locationPostalCode: text("location_postal_code"),
  locationAddress: text("location_address"),          // Exact address (private)
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  locationRadiusKm: integer("location_radius_km").default(5),  // Fuzzy circle radius
  serviceAtCustomerLocation: boolean("service_at_customer_location").default(true),
  
  // Attachments (photos of what needs to be done)
  attachmentUrls: jsonb("attachment_urls").$type<string[]>().default([]),
  
  // Moderation (AI filter)
  moderationStatus: moderationStatusEnum("moderation_status").default("pending_review").notNull(),
  moderationReason: text("moderation_reason"),
  moderatedAt: timestamp("moderated_at"),
  
  // Status & Lifecycle
  status: serviceRequestStatusEnum("status").default("draft").notNull(),
  publishedAt: timestamp("published_at"),
  expiresAt: timestamp("expires_at"),                 // Auto-expire if no booking
  
  // Metrics
  viewCount: integer("view_count").default(0),
  proposalCount: integer("proposal_count").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  customerIdx: index("service_requests_customer_idx").on(table.customerId),
  statusIdx: index("service_requests_status_idx").on(table.status),
  moderationIdx: index("service_requests_moderation_idx").on(table.moderationStatus),
  categoryIdx: index("service_requests_category_idx").on(table.categoryId),
  locationIdx: index("service_requests_location_idx").on(table.locationCanton, table.locationPostalCode),
}));

// ============================================
// PROPOSALS (Vendor Bids)
// ============================================

export const proposals = pgTable("proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Links
  serviceRequestId: uuid("service_request_id").notNull().references(() => serviceRequests.id, { onDelete: "cascade" }),
  vendorId: uuid("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: uuid("service_id").references(() => services.id),  // Which of their services they're offering
  
  // Pricing
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  priceBreakdown: jsonb("price_breakdown").$type<{
    labor?: number;
    materials?: number;
    travel?: number;
    other?: number;
    description?: string;
  }>(),
  
  // Payment Terms
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentTiming: paymentTimingEnum("payment_timing").notNull(),
  
  // Proposal Content
  coverLetter: text("cover_letter").notNull(),        // Why they're the right choice
  estimatedDuration: text("estimated_duration"),      // "2 hours", "3-4 days"
  proposedDate: timestamp("proposed_date"),           // When they can do it
  proposedDateEnd: timestamp("proposed_date_end"),    // End time if applicable
  
  // Attachments (portfolio, certifications)
  attachmentUrls: jsonb("attachment_urls").$type<string[]>().default([]),
  
  // Status
  status: proposalStatusEnum("status").default("pending").notNull(),
  viewedAt: timestamp("viewed_at"),
  respondedAt: timestamp("responded_at"),
  
  // If rejected, optional reason
  rejectionReason: text("rejection_reason"),
  
  // For Cash/TWINT proposals - commission tracking
  commissionAmount: decimal("commission_amount", { precision: 10, scale: 2 }),
  commissionCharged: boolean("commission_charged").default(false),
  commissionChargeId: text("commission_charge_id"),   // Stripe charge ID
  commissionChargeFailedAt: timestamp("commission_charge_failed_at"),
  commissionChargeError: text("commission_charge_error"),
  
  // Expiry (proposals expire after 48 hours if not responded to)
  expiresAt: timestamp("expires_at").notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  requestIdx: index("proposals_request_idx").on(table.serviceRequestId),
  vendorIdx: index("proposals_vendor_idx").on(table.vendorId),
  statusIdx: index("proposals_status_idx").on(table.status),
  expiresIdx: index("proposals_expires_idx").on(table.expiresAt),
  // One proposal per vendor per request
  uniqueVendorRequest: unique("proposals_vendor_request_unique").on(table.vendorId, table.serviceRequestId),
}));

// ============================================
// VENDOR PAYMENT METHODS (For Commission Charging)
// ============================================

export const vendorPaymentMethods = pgTable("vendor_payment_methods", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  vendorId: uuid("vendor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Stripe Customer (separate from Connect account)
  stripeCustomerId: text("stripe_customer_id").notNull(),
  
  // Default payment method for charges
  defaultPaymentMethodId: text("default_payment_method_id"),
  paymentMethodLast4: text("payment_method_last4"),
  paymentMethodBrand: text("payment_method_brand"),   // 'visa', 'mastercard', etc.
  paymentMethodExpMonth: integer("payment_method_exp_month"),
  paymentMethodExpYear: integer("payment_method_exp_year"),
  
  // Validation status
  isValid: boolean("is_valid").default(true),
  lastValidatedAt: timestamp("last_validated_at"),
  validationError: text("validation_error"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  vendorIdx: index("vendor_payment_methods_vendor_idx").on(table.vendorId),
}));

// ============================================
// PLATFORM DEBTS (Failed Charges)
// ============================================

export const platformDebts = pgTable("platform_debts", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // What is owed
  debtType: text("debt_type").notNull(),              // 'commission', 'dispute_fee', 'other'
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("CHF").notNull(),
  description: text("description"),
  
  // Related records
  proposalId: uuid("proposal_id").references(() => proposals.id),
  disputeId: uuid("dispute_id"),                      // References escrowDisputes
  bookingId: uuid("booking_id"),
  
  // Status
  status: text("status").default("pending").notNull(), // 'pending', 'paid', 'waived', 'sent_to_collection'
  
  // Retry tracking
  chargeAttempts: integer("charge_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastAttemptError: text("last_attempt_error"),
  nextAttemptAt: timestamp("next_attempt_at"),
  
  // Resolution
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),                    // 'payment', 'admin_waiver', 'collection'
  stripeChargeId: text("stripe_charge_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("platform_debts_user_idx").on(table.userId),
  statusIdx: index("platform_debts_status_idx").on(table.status),
}));

// ============================================
// RELATIONS
// ============================================

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  customer: one(users, {
    fields: [serviceRequests.customerId],
    references: [users.id],
  }),
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [proposals.serviceRequestId],
    references: [serviceRequests.id],
  }),
  vendor: one(users, {
    fields: [proposals.vendorId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [proposals.serviceId],
    references: [services.id],
  }),
}));

export const vendorPaymentMethodsRelations = relations(vendorPaymentMethods, ({ one }) => ({
  vendor: one(users, {
    fields: [vendorPaymentMethods.vendorId],
    references: [users.id],
  }),
}));

export const platformDebtsRelations = relations(platformDebts, ({ one }) => ({
  user: one(users, {
    fields: [platformDebts.userId],
    references: [users.id],
  }),
  proposal: one(proposals, {
    fields: [platformDebts.proposalId],
    references: [proposals.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;
export type VendorPaymentMethod = typeof vendorPaymentMethods.$inferSelect;
export type InsertVendorPaymentMethod = typeof vendorPaymentMethods.$inferInsert;
export type PlatformDebt = typeof platformDebts.$inferSelect;
export type InsertPlatformDebt = typeof platformDebts.$inferInsert;
