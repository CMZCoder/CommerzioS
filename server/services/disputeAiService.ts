/**
 * Dispute AI Service
 * 
 * Handles AI-powered dispute analysis and resolution:
 * - Evidence analysis
 * - Generating 3 resolution options for Phase 2
 * - Making binding decisions for Phase 3
 * 
 * Uses GPT-4 for nuanced analysis of complex disputes.
 */

import OpenAI from "openai";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { escrowDisputes, escrowTransactions, users, bookings, services } from "../../shared/schema";
import { 
  disputeAiAnalysis, 
  disputeAiOptions,
  disputeAiDecisions,
  disputeResponses,
  type DisputeAiAnalysis,
  type DisputeAiOption,
  type DisputeAiDecision,
  type InsertDisputeAiAnalysis,
  type InsertDisputeAiOption,
  type InsertDisputeAiDecision
} from "../../shared/schema-disputes";

// ============================================
// CONFIGURATION
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const AI_MODEL = "gpt-4-turbo-preview";

// ============================================
// TYPES
// ============================================

interface DisputeContext {
  dispute: any;
  booking: any;
  service: any;
  customer: any;
  vendor: any;
  customerEvidence: string[];
  vendorEvidence: string[];
  chatHistory: any[];
  previousResponses: any[];
}

interface AiAnalysisResult {
  evidenceAnalysis: NonNullable<InsertDisputeAiAnalysis["evidenceAnalysis"]>;
  descriptionAnalysis: NonNullable<InsertDisputeAiAnalysis["descriptionAnalysis"]>;
  behaviorAnalysis: NonNullable<InsertDisputeAiAnalysis["behaviorAnalysis"]>;
  overallAssessment: NonNullable<InsertDisputeAiAnalysis["overallAssessment"]>;
}

interface AiResolutionOption {
  label: string;
  title: string;
  customerRefundPercent: number;
  vendorPaymentPercent: number;
  reasoning: string;
  keyFactors: string[];
  isRecommended: boolean;
}

interface AiFinalDecision {
  customerRefundPercent: number;
  vendorPaymentPercent: number;
  decisionSummary: string;
  fullReasoning: string;
  keyFactors: string[];
}

// ============================================
// CONTEXT GATHERING
// ============================================

/**
 * Gather all context needed for AI analysis
 */
async function gatherDisputeContext(disputeId: string): Promise<DisputeContext> {
  // Get dispute
  const [dispute] = await db
    .select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Get booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, dispute.bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Get escrow transaction for amount
  const [escrow] = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, dispute.bookingId))
    .limit(1);

  const escrowAmount = escrow ? escrow.amount : "0";

  // Get service
  const [service] = booking?.serviceId 
    ? await db.select().from(services).where(eq(services.id, booking.serviceId)).limit(1)
    : [null];

  // Get customer and vendor from booking
  const [customer] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, booking.customerId))
    .limit(1);

  const [vendor] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, booking.vendorId))
    .limit(1);

  // Get evidence from evidenceUrls field
  const evidenceUrls = (dispute.evidenceUrls as string[]) || [];
  // For now, split evidence (in practice you'd need better tracking of who submitted what)
  const customerEvidence = dispute.raisedBy === "customer" ? evidenceUrls : [];
  const vendorEvidence = dispute.raisedBy === "vendor" ? evidenceUrls : [];

  // Chat history is not in current schema, use empty array
  const chatHistory: any[] = [];

  // Get previous responses in this dispute
  const previousResponses = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.disputeId, disputeId))
    .orderBy(desc(disputeResponses.createdAt));

  return {
    dispute: { 
      ...dispute, 
      customerId: booking.customerId,
      vendorId: booking.vendorId,
      escrowAmount: escrowAmount,
      customerDescription: dispute.description,
      vendorResponse: null, // Would need to be tracked separately
    },
    booking,
    service,
    customer,
    vendor,
    customerEvidence,
    vendorEvidence,
    chatHistory,
    previousResponses,
  };
}

// ============================================
// AI ANALYSIS (Phase 2)
// ============================================

/**
 * Perform comprehensive AI analysis of the dispute
 */
export async function analyzeDispute(disputeId: string): Promise<DisputeAiAnalysis> {
  const context = await gatherDisputeContext(disputeId);

  const prompt = buildAnalysisPrompt(context);

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an impartial dispute resolution specialist for a Swiss marketplace platform.
Your job is to analyze disputes between customers and vendors objectively.
Be fair, consider all evidence, and provide balanced assessments.
Always respond in valid JSON format.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,  // Lower temperature for more consistent analysis
  });

  const aiResponse = JSON.parse(response.choices[0].message.content || "{}") as AiAnalysisResult;

  // Store analysis
  const [analysis] = await db
    .insert(disputeAiAnalysis)
    .values({
      disputeId,
      evidenceAnalysis: aiResponse.evidenceAnalysis,
      descriptionAnalysis: aiResponse.descriptionAnalysis,
      behaviorAnalysis: aiResponse.behaviorAnalysis,
      overallAssessment: aiResponse.overallAssessment,
      rawAiResponse: aiResponse,
      aiModel: AI_MODEL,
      aiPromptTokens: response.usage?.prompt_tokens,
      aiCompletionTokens: response.usage?.completion_tokens,
    })
    .returning();

  console.log(`[DisputeAI] Analyzed dispute ${disputeId}`);

  return analysis;
}

function buildAnalysisPrompt(context: DisputeContext): string {
  return `Analyze this dispute and provide a comprehensive assessment.

## Dispute Details
- Dispute ID: ${context.dispute.id}
- Opened: ${context.dispute.createdAt}
- Amount in Escrow: ${context.dispute.escrowAmount} CHF

## Booking Details
- Service: ${context.service?.title || "N/A"}
- Original Price: ${context.dispute.escrowAmount} CHF
- Booking Date: ${context.booking?.requestedStartTime?.toISOString() || "N/A"}

## Customer's Claim
${context.dispute.customerDescription || "No description provided"}

## Vendor's Response
${context.dispute.vendorResponse || "No response provided"}

## Evidence Submitted

### Customer Evidence (${context.customerEvidence.length} items)
${context.customerEvidence.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "No evidence submitted"}

### Vendor Evidence (${context.vendorEvidence.length} items)
${context.vendorEvidence.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "No evidence submitted"}

## Previous Negotiation Attempts
${context.previousResponses.length > 0 
  ? context.previousResponses.map((r: any) => `- ${r.userId === context.customer.id ? "Customer" : "Vendor"}: ${r.responseType} - ${r.message || "No message"}`).join("\n")
  : "No previous negotiation attempts"}

## Response Format
Provide your analysis as a JSON object with this exact structure:
{
  "evidenceAnalysis": {
    "customer": {
      "evidenceCount": number,
      "evidenceTypes": string[],
      "evidenceStrength": "strong" | "moderate" | "weak" | "none",
      "evidenceSummary": string
    },
    "vendor": {
      "evidenceCount": number,
      "evidenceTypes": string[],
      "evidenceStrength": "strong" | "moderate" | "weak" | "none",
      "evidenceSummary": string
    }
  },
  "descriptionAnalysis": {
    "customerAccount": string,
    "vendorAccount": string,
    "consistencyScore": number (0-100),
    "contradictions": string[],
    "verifiableClaims": string[]
  },
  "behaviorAnalysis": {
    "customer": {
      "responseTime": "fast" | "moderate" | "slow" | "unresponsive",
      "tone": "professional" | "neutral" | "frustrated" | "hostile",
      "goodFaithScore": number (0-100),
      "cooperationLevel": string
    },
    "vendor": {
      "responseTime": "fast" | "moderate" | "slow" | "unresponsive",
      "tone": "professional" | "neutral" | "frustrated" | "hostile",
      "goodFaithScore": number (0-100),
      "cooperationLevel": string
    }
  },
  "overallAssessment": {
    "primaryIssue": string,
    "faultAssessment": string,
    "mitigatingFactors": string[],
    "aggravatingFactors": string[]
  }
}`;
}

// ============================================
// RESOLUTION OPTIONS GENERATION (Phase 2)
// ============================================

/**
 * Generate 3 resolution options for Phase 2
 */
export async function generateResolutionOptions(
  disputeId: string,
  analysisId?: string
): Promise<DisputeAiOption[]> {
  const context = await gatherDisputeContext(disputeId);

  // Get analysis if available
  let analysis: DisputeAiAnalysis | null = null;
  if (analysisId) {
    const [a] = await db
      .select()
      .from(disputeAiAnalysis)
      .where(eq(disputeAiAnalysis.id, analysisId))
      .limit(1);
    analysis = a;
  } else {
    // Get latest analysis
    const [a] = await db
      .select()
      .from(disputeAiAnalysis)
      .where(eq(disputeAiAnalysis.disputeId, disputeId))
      .orderBy(desc(disputeAiAnalysis.createdAt))
      .limit(1);
    analysis = a;
  }

  const prompt = buildOptionsPrompt(context, analysis);

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an impartial dispute resolution specialist for a Swiss marketplace platform.
Generate fair resolution options that both parties might find acceptable.
Always provide exactly 3 options with different approaches.
Response in valid JSON format.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const aiResponse = JSON.parse(response.choices[0].message.content || "{}") as { options: AiResolutionOption[] };
  const escrowAmount = parseFloat(context.dispute.escrowAmount);

  // Store options
  const options: DisputeAiOption[] = [];
  
  for (const opt of aiResponse.options) {
    const customerAmount = Math.round(escrowAmount * opt.customerRefundPercent / 100 * 100) / 100;
    const vendorAmount = Math.round(escrowAmount * opt.vendorPaymentPercent / 100 * 100) / 100;

    const [saved] = await db
      .insert(disputeAiOptions)
      .values({
        disputeId,
        analysisId: analysis?.id,
        optionLabel: opt.label,
        optionTitle: opt.title,
        customerRefundPercent: opt.customerRefundPercent,
        vendorPaymentPercent: opt.vendorPaymentPercent,
        customerRefundAmount: customerAmount.toFixed(2),
        vendorPaymentAmount: vendorAmount.toFixed(2),
        reasoning: opt.reasoning,
        keyFactors: opt.keyFactors,
        basedOn: [],
        isRecommended: opt.isRecommended,
      })
      .returning();

    options.push(saved);
  }

  console.log(`[DisputeAI] Generated ${options.length} resolution options for dispute ${disputeId}`);

  return options;
}

function buildOptionsPrompt(context: DisputeContext, analysis: DisputeAiAnalysis | null): string {
  const analysisSection = analysis ? `
## AI Analysis Summary
- Customer Evidence Strength: ${(analysis.evidenceAnalysis as any)?.customer?.evidenceStrength || "N/A"}
- Vendor Evidence Strength: ${(analysis.evidenceAnalysis as any)?.vendor?.evidenceStrength || "N/A"}
- Primary Issue: ${(analysis.overallAssessment as any)?.primaryIssue || "N/A"}
- Fault Assessment: ${(analysis.overallAssessment as any)?.faultAssessment || "N/A"}
` : "";

  return `Generate 3 fair resolution options for this dispute.

## Dispute Details
- Escrow Amount: ${context.dispute.escrowAmount} CHF
- Customer's Claim: ${context.dispute.customerDescription || "N/A"}
- Vendor's Response: ${context.dispute.vendorResponse || "N/A"}

${analysisSection}

## Requirements
1. Option A: Evidence-based (favor party with stronger evidence)
2. Option B: Compromise (balanced split considering both perspectives)
3. Option C: Platform policy-based (based on what our TOS would support)

Each option must have percentages that sum to 100% (customer + vendor = 100).

## Response Format
{
  "options": [
    {
      "label": "A",
      "title": "Evidence-Based Resolution",
      "customerRefundPercent": number (0-100),
      "vendorPaymentPercent": number (0-100),
      "reasoning": "Brief explanation",
      "keyFactors": ["factor1", "factor2"],
      "isRecommended": true/false
    },
    // ... options B and C
  ]
}

Mark exactly ONE option as isRecommended: true (the most fair in your assessment).`;
}

// ============================================
// FINAL DECISION (Phase 3)
// ============================================

/**
 * Generate binding AI decision for Phase 3
 */
export async function generateFinalDecision(disputeId: string): Promise<DisputeAiDecision> {
  const context = await gatherDisputeContext(disputeId);

  // Get all analysis and responses from Phase 2
  const [analysis] = await db
    .select()
    .from(disputeAiAnalysis)
    .where(eq(disputeAiAnalysis.disputeId, disputeId))
    .orderBy(desc(disputeAiAnalysis.createdAt))
    .limit(1);

  const options = await db
    .select()
    .from(disputeAiOptions)
    .where(eq(disputeAiOptions.disputeId, disputeId));

  const responses = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.disputeId, disputeId))
    .orderBy(desc(disputeResponses.createdAt));

  const prompt = buildDecisionPrompt(context, analysis, options, responses);

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      {
        role: "system",
        content: `You are rendering a binding decision as an impartial dispute resolution specialist.
This decision is FINAL and will be executed automatically.
Be fair, thorough, and explain your reasoning clearly.
Both parties agreed to binding AI arbitration when using the platform.
Response in valid JSON format.`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,  // Very low temperature for consistency
  });

  const aiResponse = JSON.parse(response.choices[0].message.content || "{}") as AiFinalDecision;
  const escrowAmount = parseFloat(context.dispute.escrowAmount);

  const customerAmount = Math.round(escrowAmount * aiResponse.customerRefundPercent / 100 * 100) / 100;
  const vendorAmount = Math.round(escrowAmount * aiResponse.vendorPaymentPercent / 100 * 100) / 100;

  // Store decision
  const [decision] = await db
    .insert(disputeAiDecisions)
    .values({
      disputeId,
      customerRefundPercent: aiResponse.customerRefundPercent,
      vendorPaymentPercent: aiResponse.vendorPaymentPercent,
      customerRefundAmount: customerAmount.toFixed(2),
      vendorPaymentAmount: vendorAmount.toFixed(2),
      decisionSummary: aiResponse.decisionSummary,
      fullReasoning: aiResponse.fullReasoning,
      keyFactors: aiResponse.keyFactors,
      status: "pending",
    })
    .returning();

  console.log(`[DisputeAI] Generated final decision for dispute ${disputeId}: Customer ${aiResponse.customerRefundPercent}%, Vendor ${aiResponse.vendorPaymentPercent}%`);

  return decision;
}

function buildDecisionPrompt(
  context: DisputeContext,
  analysis: DisputeAiAnalysis | null,
  options: DisputeAiOption[],
  responses: any[]
): string {
  // Summarize Phase 2 activity
  const customerResponses = responses.filter(r => r.userId === context.customer.id);
  const vendorResponses = responses.filter(r => r.userId === context.vendor.id);

  const phase2Summary = options.length > 0 ? `
## Phase 2 Options Presented
${options.map(o => `- Option ${o.optionLabel}: ${o.customerRefundPercent}% customer / ${o.vendorPaymentPercent}% vendor - ${o.optionTitle}`).join("\n")}

## Party Responses
- Customer selected: ${customerResponses.find(r => r.selectedOptionLabel)?.selectedOptionLabel || "None"}
- Vendor selected: ${vendorResponses.find(r => r.selectedOptionLabel)?.selectedOptionLabel || "None"}
- Customer counter-proposals: ${customerResponses.filter(r => r.responseType === "counter_propose").length}
- Vendor counter-proposals: ${vendorResponses.filter(r => r.responseType === "counter_propose").length}
` : "No Phase 2 options were generated.";

  const analysisSection = analysis ? `
## AI Analysis
- Customer Evidence: ${(analysis.evidenceAnalysis as any)?.customer?.evidenceStrength || "N/A"}
- Vendor Evidence: ${(analysis.evidenceAnalysis as any)?.vendor?.evidenceStrength || "N/A"}
- Fault Assessment: ${(analysis.overallAssessment as any)?.faultAssessment || "N/A"}
` : "";

  return `Render a FINAL BINDING DECISION for this dispute.

## Dispute Details
- Escrow Amount: ${context.dispute.escrowAmount} CHF
- Customer's Claim: ${context.dispute.customerDescription || "N/A"}
- Vendor's Response: ${context.dispute.vendorResponse || "N/A"}

${analysisSection}

${phase2Summary}

## Your Task
Make a final, binding decision on how to split the ${context.dispute.escrowAmount} CHF escrow.
Consider all evidence, both parties' behavior during negotiation, and platform policies.
The percentages MUST sum to 100%.

## Response Format
{
  "customerRefundPercent": number (0-100),
  "vendorPaymentPercent": number (0-100),
  "decisionSummary": "One paragraph summary of the decision",
  "fullReasoning": "Detailed multi-paragraph explanation of the decision",
  "keyFactors": ["factor1", "factor2", "factor3"]
}

Be fair and thorough. Both parties have agreed to abide by this decision.`;
}

// ============================================
// DECISION EXECUTION
// ============================================

/**
 * Mark AI decision as executed after funds transfer
 */
export async function markDecisionExecuted(
  decisionId: string,
  customerRefundStripeId?: string,
  vendorPaymentStripeId?: string
): Promise<DisputeAiDecision> {
  const [updated] = await db
    .update(disputeAiDecisions)
    .set({
      status: "executed",
      executedAt: new Date(),
      customerRefundStripeId,
      vendorPaymentStripeId,
      updatedAt: new Date(),
    })
    .where(eq(disputeAiDecisions.id, decisionId))
    .returning();

  console.log(`[DisputeAI] Marked decision ${decisionId} as executed`);

  return updated;
}

/**
 * Mark AI decision as overridden by external resolution
 */
export async function markDecisionOverridden(
  decisionId: string,
  overriddenBy: "customer" | "vendor" | "both"
): Promise<DisputeAiDecision> {
  const [updated] = await db
    .update(disputeAiDecisions)
    .set({
      status: "overridden_external",
      overriddenBy,
      overriddenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputeAiDecisions.id, decisionId))
    .returning();

  console.log(`[DisputeAI] Marked decision ${decisionId} as overridden by ${overriddenBy}`);

  return updated;
}

// ============================================
// QUERIES
// ============================================

/**
 * Get the latest AI analysis for a dispute
 */
export async function getLatestAnalysis(disputeId: string): Promise<DisputeAiAnalysis | null> {
  const [analysis] = await db
    .select()
    .from(disputeAiAnalysis)
    .where(eq(disputeAiAnalysis.disputeId, disputeId))
    .orderBy(desc(disputeAiAnalysis.createdAt))
    .limit(1);

  return analysis || null;
}

/**
 * Get resolution options for a dispute
 */
export async function getResolutionOptions(disputeId: string): Promise<DisputeAiOption[]> {
  return db
    .select()
    .from(disputeAiOptions)
    .where(eq(disputeAiOptions.disputeId, disputeId))
    .orderBy(disputeAiOptions.optionLabel);
}

/**
 * Get the AI decision for a dispute
 */
export async function getAiDecision(disputeId: string): Promise<DisputeAiDecision | null> {
  const [decision] = await db
    .select()
    .from(disputeAiDecisions)
    .where(eq(disputeAiDecisions.disputeId, disputeId))
    .orderBy(desc(disputeAiDecisions.createdAt))
    .limit(1);

  return decision || null;
}
