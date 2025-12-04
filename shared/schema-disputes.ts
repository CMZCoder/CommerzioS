/**
 * Dispute Resolution Schema Extensions
 * 
 * Extends the existing escrowDisputes table with 3-phase dispute system support.
 * This file defines additional tables needed for the AI-mediated dispute resolution.
 */

import { pgTable, text, timestamp, uuid, decimal, boolean, integer, jsonb, pgEnum, index, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users, escrowDisputes } from "./schema";

// ============================================
// ENUMS
// ============================================

export const disputePhaseEnum = pgEnum("dispute_phase", [
  "phase_1",           // Direct negotiation (7 days max)
  "phase_2",           // AI-mediated negotiation (7 days max)  
  "phase_3_pending",   // AI decision issued, 24h review period
  "phase_3_ai",        // AI final decision executed
  "phase_3_external",  // External resolution chosen
  "resolved",          // Resolved in Phase 1 or 2
  "closed"             // Administratively closed
]);

export const disputeResponseTypeEnum = pgEnum("dispute_response_type", [
  "accept_option",     // Accepted one of AI's options
  "counter_propose",   // Proposed different split
  "escalate",          // Request Phase 3 / AI decision
  "external",          // Opted for external resolution
  "no_response"        // Timed out
]);

export const externalResolutionInitiatorEnum = pgEnum("external_resolution_initiator", [
  "customer",
  "vendor", 
  "both"               // Both chose external simultaneously
]);

// ============================================
// DISPUTE PHASE TRACKING (Extends escrowDisputes)
// ============================================

export const disputePhases = pgTable("dispute_phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  
  // Current phase
  currentPhase: disputePhaseEnum("current_phase").default("phase_1").notNull(),
  
  // Phase 1 tracking
  phase1StartedAt: timestamp("phase_1_started_at"),
  phase1Deadline: timestamp("phase_1_deadline"),
  phase1CounterOffersCustomer: integer("phase_1_counter_offers_customer").default(0),
  phase1CounterOffersVendor: integer("phase_1_counter_offers_vendor").default(0),
  phase1ResolvedAt: timestamp("phase_1_resolved_at"),
  
  // Phase 2 tracking
  phase2StartedAt: timestamp("phase_2_started_at"),
  phase2Deadline: timestamp("phase_2_deadline"),
  phase2CounterOffersCustomer: integer("phase_2_counter_offers_customer").default(0),
  phase2CounterOffersVendor: integer("phase_2_counter_offers_vendor").default(0),
  phase2ResolvedAt: timestamp("phase_2_resolved_at"),
  
  // Phase 3 tracking
  phase3StartedAt: timestamp("phase_3_started_at"),
  phase3ReviewDeadline: timestamp("phase_3_review_deadline"),  // 24 hours to review AI decision
  phase3ExecutedAt: timestamp("phase_3_executed_at"),
  
  // External resolution tracking
  externalResolutionChosenBy: externalResolutionInitiatorEnum("external_resolution_chosen_by"),
  externalResolutionChosenAt: timestamp("external_resolution_chosen_at"),
  externalResolutionFeeCharged: boolean("external_resolution_fee_charged").default(false),
  externalResolutionFeeChargeId: text("external_resolution_fee_charge_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_phases_dispute_idx").on(table.disputeId),
  phaseIdx: index("dispute_phases_phase_idx").on(table.currentPhase),
}));

// ============================================
// AI DISPUTE ANALYSIS
// ============================================

export const disputeAiAnalysis = pgTable("dispute_ai_analysis", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  
  // Evidence Analysis
  evidenceAnalysis: jsonb("evidence_analysis").$type<{
    customer: {
      evidenceCount: number;
      evidenceTypes: string[];
      evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none';
      evidenceSummary: string;
    };
    vendor: {
      evidenceCount: number;
      evidenceTypes: string[];
      evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none';
      evidenceSummary: string;
    };
  }>(),
  
  // Description Analysis
  descriptionAnalysis: jsonb("description_analysis").$type<{
    customerAccount: string;
    vendorAccount: string;
    consistencyScore: number;
    contradictions: string[];
    verifiableClaims: string[];
  }>(),
  
  // Behavior Analysis
  behaviorAnalysis: jsonb("behavior_analysis").$type<{
    customer: {
      responseTime: 'fast' | 'moderate' | 'slow' | 'unresponsive';
      tone: 'professional' | 'neutral' | 'frustrated' | 'hostile';
      goodFaithScore: number;
      cooperationLevel: string;
    };
    vendor: {
      responseTime: 'fast' | 'moderate' | 'slow' | 'unresponsive';
      tone: 'professional' | 'neutral' | 'frustrated' | 'hostile';
      goodFaithScore: number;
      cooperationLevel: string;
    };
  }>(),
  
  // Overall Assessment
  overallAssessment: jsonb("overall_assessment").$type<{
    primaryIssue: string;
    faultAssessment: string;
    mitigatingFactors: string[];
    aggravatingFactors: string[];
  }>(),
  
  // Raw AI response for debugging
  rawAiResponse: jsonb("raw_ai_response"),
  aiModel: text("ai_model"),
  aiPromptTokens: integer("ai_prompt_tokens"),
  aiCompletionTokens: integer("ai_completion_tokens"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_ai_analysis_dispute_idx").on(table.disputeId),
}));

// ============================================
// AI RESOLUTION OPTIONS (Phase 2)
// ============================================

export const disputeAiOptions = pgTable("dispute_ai_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  analysisId: uuid("analysis_id").references(() => disputeAiAnalysis.id),
  
  // Option details
  optionLabel: text("option_label").notNull(),        // 'A', 'B', 'C'
  optionTitle: text("option_title").notNull(),        // "Evidence-Based Resolution"
  
  // Split percentages
  customerRefundPercent: integer("customer_refund_percent").notNull(),
  vendorPaymentPercent: integer("vendor_payment_percent").notNull(),
  
  // Calculated amounts (based on escrow amount)
  customerRefundAmount: decimal("customer_refund_amount", { precision: 10, scale: 2 }),
  vendorPaymentAmount: decimal("vendor_payment_amount", { precision: 10, scale: 2 }),
  
  // AI reasoning
  reasoning: text("reasoning").notNull(),
  keyFactors: jsonb("key_factors").$type<string[]>().default([]),
  basedOn: jsonb("based_on").$type<string[]>().default([]),
  
  // Is this the AI's recommended option?
  isRecommended: boolean("is_recommended").default(false),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_ai_options_dispute_idx").on(table.disputeId),
}));

// ============================================
// DISPUTE RESPONSES (Party Responses to Options)
// ============================================

export const disputeResponses = pgTable("dispute_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Which phase this response is for
  phase: disputePhaseEnum("phase").notNull(),
  
  // Response type
  responseType: disputeResponseTypeEnum("response_type").notNull(),
  
  // If accepting an option
  selectedOptionId: uuid("selected_option_id").references(() => disputeAiOptions.id),
  selectedOptionLabel: text("selected_option_label"),
  
  // If counter-proposing
  counterProposalPercent: integer("counter_proposal_percent"),  // Customer's proposed refund %
  counterProposalMessage: text("counter_proposal_message"),
  
  // Message/reason
  message: text("message"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_responses_dispute_idx").on(table.disputeId),
  userIdx: index("dispute_responses_user_idx").on(table.userId),
}));

// ============================================
// AI FINAL DECISION (Phase 3)
// ============================================

export const disputeAiDecisions = pgTable("dispute_ai_decisions", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  
  // Decision
  customerRefundPercent: integer("customer_refund_percent").notNull(),
  vendorPaymentPercent: integer("vendor_payment_percent").notNull(),
  customerRefundAmount: decimal("customer_refund_amount", { precision: 10, scale: 2 }).notNull(),
  vendorPaymentAmount: decimal("vendor_payment_amount", { precision: 10, scale: 2 }).notNull(),
  
  // Reasoning
  decisionSummary: text("decision_summary").notNull(),
  fullReasoning: text("full_reasoning").notNull(),
  keyFactors: jsonb("key_factors").$type<string[]>().default([]),
  
  // Execution status
  status: text("status").default("pending").notNull(),  // 'pending', 'executed', 'overridden_external'
  executedAt: timestamp("executed_at"),
  
  // If overridden by external resolution
  overriddenBy: externalResolutionInitiatorEnum("overridden_by"),
  overriddenAt: timestamp("overridden_at"),
  
  // Stripe execution
  customerRefundStripeId: text("customer_refund_stripe_id"),
  vendorPaymentStripeId: text("vendor_payment_stripe_id"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_ai_decisions_dispute_idx").on(table.disputeId),
}));

// ============================================
// DISPUTE REPORTS (For External Resolution)
// ============================================

export const disputeReports = pgTable("dispute_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  
  // Report content (comprehensive JSON)
  reportData: jsonb("report_data").$type<{
    // Parties
    customer: { name: string; email: string; phone?: string };
    vendor: { name: string; email: string; phone?: string; businessName?: string };
    
    // Booking
    booking: {
      id: string;
      bookingNumber: string;
      service: string;
      originalPrice: number;
      finalPrice?: number;
      dates: string;
      description: string;
    };
    
    // Phase 1 Summary
    phase1: {
      startDate: string;
      endDate: string;
      counterOffersCount: { customer: number; vendor: number };
      counterOffers: Array<{
        from: string;
        proposedAmount?: number;
        message: string;
        timestamp: string;
        response?: string;
      }>;
      outcome: 'resolved' | 'escalated';
    };
    
    // Phase 2 Summary
    phase2?: {
      startDate: string;
      endDate: string;
      aiProposedOptions: Array<{
        label: string;
        customerPercent: number;
        vendorPercent: number;
        reasoning: string;
      }>;
      partyResponses: {
        customer: { selectedOption?: string; counterProposals: number };
        vendor: { selectedOption?: string; counterProposals: number };
      };
      outcome: 'resolved' | 'escalated' | 'externally_resolved';
    };
    
    // Phase 3 Summary (if reached)
    phase3?: {
      aiDecision: {
        customerPercent: number;
        vendorPercent: number;
        reasoning: string;
      };
      externalResolutionChosenBy?: string;
    };
    
    // Evidence
    evidence: {
      customer: string[];
      vendor: string[];
    };
    
    // Platform Assessment
    platformAssessment: {
      summary: string;
      recommendedResolution: string;
      goodFaithIndicators: { customer: number; vendor: number };
      disclaimer: string;
    };
  }>().notNull(),
  
  // PDF generation
  pdfUrl: text("pdf_url"),
  pdfGeneratedAt: timestamp("pdf_generated_at"),
  
  // Download tracking
  downloadedByCustomer: boolean("downloaded_by_customer").default(false),
  downloadedByCustomerAt: timestamp("downloaded_by_customer_at"),
  downloadedByVendor: boolean("downloaded_by_vendor").default(false),
  downloadedByVendorAt: timestamp("downloaded_by_vendor_at"),
  
  // Timestamps
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_reports_dispute_idx").on(table.disputeId),
}));

// ============================================
// DISPUTE FEE CHARGES (25 CHF Admin Fee)
// ============================================

export const disputeFeeCharges = pgTable("dispute_fee_charges", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  disputeId: varchar("dispute_id").notNull().references(() => escrowDisputes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Fee details
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),  // 25.00 CHF
  currency: text("currency").default("CHF").notNull(),
  reason: text("reason").notNull(),  // 'external_resolution'
  
  // Charge status
  status: text("status").default("pending").notNull(),  // 'pending', 'charged', 'failed', 'waived'
  
  // Stripe
  stripeChargeId: text("stripe_charge_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  
  // If failed, track for debt collection
  chargeAttempts: integer("charge_attempts").default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastAttemptError: text("last_attempt_error"),
  
  // If waived by admin
  waivedAt: timestamp("waived_at"),
  waivedBy: varchar("waived_by").references(() => users.id),
  waiveReason: text("waive_reason"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  disputeIdx: index("dispute_fee_charges_dispute_idx").on(table.disputeId),
  userIdx: index("dispute_fee_charges_user_idx").on(table.userId),
}));

// ============================================
// RELATIONS
// ============================================

export const disputePhasesRelations = relations(disputePhases, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputePhases.disputeId],
    references: [escrowDisputes.id],
  }),
}));

export const disputeAiAnalysisRelations = relations(disputeAiAnalysis, ({ one, many }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeAiAnalysis.disputeId],
    references: [escrowDisputes.id],
  }),
  options: many(disputeAiOptions),
}));

export const disputeAiOptionsRelations = relations(disputeAiOptions, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeAiOptions.disputeId],
    references: [escrowDisputes.id],
  }),
  analysis: one(disputeAiAnalysis, {
    fields: [disputeAiOptions.analysisId],
    references: [disputeAiAnalysis.id],
  }),
}));

export const disputeResponsesRelations = relations(disputeResponses, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeResponses.disputeId],
    references: [escrowDisputes.id],
  }),
  user: one(users, {
    fields: [disputeResponses.userId],
    references: [users.id],
  }),
  selectedOption: one(disputeAiOptions, {
    fields: [disputeResponses.selectedOptionId],
    references: [disputeAiOptions.id],
  }),
}));

export const disputeAiDecisionsRelations = relations(disputeAiDecisions, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeAiDecisions.disputeId],
    references: [escrowDisputes.id],
  }),
}));

export const disputeReportsRelations = relations(disputeReports, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeReports.disputeId],
    references: [escrowDisputes.id],
  }),
}));

export const disputeFeeChargesRelations = relations(disputeFeeCharges, ({ one }) => ({
  dispute: one(escrowDisputes, {
    fields: [disputeFeeCharges.disputeId],
    references: [escrowDisputes.id],
  }),
  user: one(users, {
    fields: [disputeFeeCharges.userId],
    references: [users.id],
  }),
}));

// ============================================
// TYPES
// ============================================

export type DisputePhase = typeof disputePhases.$inferSelect;
export type InsertDisputePhase = typeof disputePhases.$inferInsert;
export type DisputeAiAnalysis = typeof disputeAiAnalysis.$inferSelect;
export type InsertDisputeAiAnalysis = typeof disputeAiAnalysis.$inferInsert;
export type DisputeAiOption = typeof disputeAiOptions.$inferSelect;
export type InsertDisputeAiOption = typeof disputeAiOptions.$inferInsert;
export type DisputeResponse = typeof disputeResponses.$inferSelect;
export type InsertDisputeResponse = typeof disputeResponses.$inferInsert;
export type DisputeAiDecision = typeof disputeAiDecisions.$inferSelect;
export type InsertDisputeAiDecision = typeof disputeAiDecisions.$inferInsert;
export type DisputeReport = typeof disputeReports.$inferSelect;
export type InsertDisputeReport = typeof disputeReports.$inferInsert;
export type DisputeFeeCharge = typeof disputeFeeCharges.$inferSelect;
export type InsertDisputeFeeCharge = typeof disputeFeeCharges.$inferInsert;
