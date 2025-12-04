/**
 * Dispute Resolution Service
 * 
 * Handles the high-level dispute resolution workflow:
 * - Opening disputes
 * - Recording responses
 * - Executing resolutions
 * 
 * Works with existing escrowDisputes schema and extends it
 * with the new phase-based workflow.
 */

import Stripe from "stripe";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { 
  escrowDisputes, 
  escrowTransactions,
  users, 
  bookings 
} from "../../shared/schema";
import { 
  disputePhases, 
  disputeResponses,
  disputeAiOptions,
  disputeAiDecisions,
  disputeReports,
  type DisputeResponse,
  type DisputeAiDecision
} from "../../shared/schema-disputes";
import { 
  initializeDisputePhases,
  escalateToPhase2,
  escalateToPhase3,
  markDisputeResolved,
  markExternalResolution,
  executePhase3Decision,
  getDisputePhases,
  getDisputeParties
} from "./disputePhaseService";
import { chargeDisputeFee } from "../vendorChargeService";
import { updateVendorStatsOnDispute } from "../commissionService";
import { createNotification } from "../notificationService";

// ============================================
// CONFIGURATION
// ============================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

const DISPUTE_FEE_CHF = 25.00;

// ============================================
// DISPUTE LIFECYCLE
// ============================================

/**
 * Open a new dispute on a booking
 */
export async function openDispute(
  bookingId: string,
  raisedByUserId: string,
  reason: "service_not_provided" | "poor_quality" | "wrong_service" | "overcharged" | "no_show" | "other",
  description: string,
  evidenceUrls?: string[]
): Promise<{ disputeId: string; success: boolean }> {
  // Get booking
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Determine who is raising the dispute
  const isCustomer = booking.customerId === raisedByUserId;
  const isVendor = booking.vendorId === raisedByUserId;
  
  if (!isCustomer && !isVendor) {
    throw new Error("Only the customer or vendor can open a dispute");
  }

  const raisedBy = isCustomer ? "customer" : "vendor";

  // Check if already disputed
  const [existingDispute] = await db
    .select()
    .from(escrowDisputes)
    .where(
      and(
        eq(escrowDisputes.bookingId, bookingId),
        eq(escrowDisputes.status, "open")
      )
    )
    .limit(1);

  if (existingDispute) {
    throw new Error("A dispute is already open for this booking");
  }

  // Get escrow transaction
  const [escrow] = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, bookingId))
    .limit(1);

  if (!escrow) {
    throw new Error("No escrow found for this booking");
  }

  // Create dispute using existing schema
  const [dispute] = await db
    .insert(escrowDisputes)
    .values({
      bookingId,
      escrowTransactionId: escrow.id,
      raisedBy: raisedBy as "customer" | "vendor",
      raisedByUserId,
      reason,
      description,
      evidenceUrls: evidenceUrls || [],
      status: "open",
    })
    .returning();

  // Initialize phase tracking
  await initializeDisputePhases(dispute.id);

  // Update vendor stats for commission tier impact
  await updateVendorStatsOnDispute(booking.vendorId, booking.paymentMethod === "cash" || booking.paymentMethod === "twint");

  // Notify the other party
  const otherPartyId = isCustomer ? booking.vendorId : booking.customerId;
  await createNotification({
    userId: otherPartyId,
    type: "system",
    title: "New Dispute Opened",
    message: `A ${raisedBy} has opened a dispute for booking #${booking.bookingNumber}`,
    metadata: { disputeId: dispute.id, bookingId },
  });

  console.log(`[Dispute] Opened dispute ${dispute.id} for booking ${bookingId} by ${raisedBy}`);

  return { disputeId: dispute.id, success: true };
}

// ============================================
// PHASE 1: DIRECT NEGOTIATION
// ============================================

/**
 * Submit a counter-offer in Phase 1
 */
export async function submitCounterOffer(
  disputeId: string,
  userId: string,
  proposedRefundPercent: number,
  message?: string
): Promise<DisputeResponse> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases || phases.currentPhase !== "phase_1") {
    throw new Error("Counter-offers only allowed in Phase 1");
  }

  const parties = await getDisputeParties(disputeId);
  if (!parties) {
    throw new Error("Dispute parties not found");
  }

  const isCustomer = parties.customerId === userId;
  const isVendor = parties.vendorId === userId;
  
  if (!isCustomer && !isVendor) {
    throw new Error("User is not part of this dispute");
  }

  // Validate percentage
  if (proposedRefundPercent < 0 || proposedRefundPercent > 100) {
    throw new Error("Refund percentage must be between 0 and 100");
  }

  // Record response
  const [response] = await db
    .insert(disputeResponses)
    .values({
      disputeId,
      userId,
      phase: "phase_1",
      responseType: "counter_propose",
      counterProposalPercent: proposedRefundPercent,
      counterProposalMessage: message,
      message,
    })
    .returning();

  // Notify other party
  const otherPartyId = isCustomer ? parties.vendorId : parties.customerId;
  await createNotification({
    userId: otherPartyId,
    type: "system",
    title: "New Counter-Offer",
    message: `A counter-offer of ${proposedRefundPercent}% refund has been proposed`,
    metadata: { disputeId, proposedRefundPercent },
  });

  console.log(`[Dispute] ${isCustomer ? "Customer" : "Vendor"} submitted counter-offer: ${proposedRefundPercent}%`);

  return response;
}

/**
 * Accept a counter-offer in Phase 1 (resolves dispute)
 */
export async function acceptCounterOffer(
  disputeId: string,
  userId: string,
  responseId: string
): Promise<{ resolved: boolean; customerPercent: number; vendorPercent: number }> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases || phases.currentPhase !== "phase_1") {
    throw new Error("Can only accept counter-offers in Phase 1");
  }

  // Get the counter-offer
  const [counterOffer] = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.id, responseId))
    .limit(1);

  if (!counterOffer || counterOffer.disputeId !== disputeId) {
    throw new Error("Counter-offer not found");
  }

  // User cannot accept their own offer
  if (counterOffer.userId === userId) {
    throw new Error("Cannot accept your own counter-offer");
  }

  const customerPercent = counterOffer.counterProposalPercent!;
  const vendorPercent = 100 - customerPercent;

  // Record acceptance
  await db.insert(disputeResponses).values({
    disputeId,
    userId,
    phase: "phase_1",
    responseType: "accept_option",
    message: `Accepted counter-offer: ${customerPercent}% refund`,
  });

  // Execute resolution
  await executeResolution(disputeId, customerPercent, vendorPercent, "phase_1_agreement");

  // Mark dispute as resolved
  await markDisputeResolved(disputeId, "phase_1");

  console.log(`[Dispute] Phase 1 resolved: Customer ${customerPercent}%, Vendor ${vendorPercent}%`);

  return { resolved: true, customerPercent, vendorPercent };
}

/**
 * Request escalation to next phase
 */
export async function requestEscalation(
  disputeId: string,
  userId: string
): Promise<void> {
  const parties = await getDisputeParties(disputeId);
  if (!parties) {
    throw new Error("Dispute not found");
  }

  if (parties.customerId !== userId && parties.vendorId !== userId) {
    throw new Error("User is not part of this dispute");
  }

  const phases = await getDisputePhases(disputeId);
  if (!phases) {
    throw new Error("Dispute phases not found");
  }

  // Record escalation request
  await db.insert(disputeResponses).values({
    disputeId,
    userId,
    phase: phases.currentPhase,
    responseType: "escalate",
    message: "Requested escalation",
  });

  // Perform escalation
  if (phases.currentPhase === "phase_1") {
    await escalateToPhase2(disputeId, userId);
  } else if (phases.currentPhase === "phase_2") {
    await escalateToPhase3(disputeId, userId);
  }
}

// ============================================
// PHASE 2: AI-MEDIATED RESOLUTION
// ============================================

/**
 * Accept one of the AI's resolution options
 */
export async function acceptAiOption(
  disputeId: string,
  userId: string,
  optionId: string
): Promise<DisputeResponse> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases || phases.currentPhase !== "phase_2") {
    throw new Error("AI options can only be accepted in Phase 2");
  }

  // Get the option
  const [option] = await db
    .select()
    .from(disputeAiOptions)
    .where(eq(disputeAiOptions.id, optionId))
    .limit(1);

  if (!option || option.disputeId !== disputeId) {
    throw new Error("Option not found");
  }

  const parties = await getDisputeParties(disputeId);
  if (!parties) {
    throw new Error("Dispute not found");
  }

  const isCustomer = parties.customerId === userId;
  const isVendor = parties.vendorId === userId;
  
  if (!isCustomer && !isVendor) {
    throw new Error("User is not part of this dispute");
  }

  // Record acceptance
  const [response] = await db
    .insert(disputeResponses)
    .values({
      disputeId,
      userId,
      phase: "phase_2",
      responseType: "accept_option",
      selectedOptionId: optionId,
      selectedOptionLabel: option.optionLabel,
      message: `Accepted Option ${option.optionLabel}`,
    })
    .returning();

  // Check if both parties accepted the same option
  const otherPartyId = isCustomer ? parties.vendorId : parties.customerId;
  const [otherPartyResponse] = await db
    .select()
    .from(disputeResponses)
    .where(
      and(
        eq(disputeResponses.disputeId, disputeId),
        eq(disputeResponses.userId, otherPartyId),
        eq(disputeResponses.responseType, "accept_option"),
        eq(disputeResponses.selectedOptionId, optionId)
      )
    )
    .limit(1);

  if (otherPartyResponse) {
    // Both accepted same option - resolve!
    await executeResolution(
      disputeId, 
      option.customerRefundPercent, 
      option.vendorPaymentPercent, 
      "phase_2_agreement"
    );
    await markDisputeResolved(disputeId, "phase_2");

    console.log(`[Dispute] Phase 2 resolved: Both parties accepted Option ${option.optionLabel}`);
  } else {
    // Notify other party
    await createNotification({
      userId: otherPartyId,
      type: "system",
      title: "Option Selected",
      message: `The other party selected Option ${option.optionLabel}`,
      metadata: { disputeId, optionLabel: option.optionLabel },
    });
  }

  return response;
}

// ============================================
// PHASE 3: EXTERNAL RESOLUTION (Game Theory)
// ============================================

/**
 * Choose External Resolution (reject AI decision)
 * 
 * GAME THEORY:
 * - Rejector gets 0% of escrow
 * - Other party gets 100% of escrow
 * - Rejector pays 25 CHF admin fee
 */
export async function chooseExternalResolution(
  disputeId: string,
  userId: string
): Promise<{ 
  success: boolean; 
  feeCharged: boolean; 
  outcome: { customerPercent: number; vendorPercent: number };
}> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases || phases.currentPhase !== "phase_3_pending") {
    throw new Error("External resolution only available during Phase 3 review period");
  }

  const parties = await getDisputeParties(disputeId);
  if (!parties) {
    throw new Error("Dispute not found");
  }

  const isCustomer = parties.customerId === userId;
  const isVendor = parties.vendorId === userId;
  
  if (!isCustomer && !isVendor) {
    throw new Error("User is not part of this dispute");
  }

  // Record external resolution choice
  await db.insert(disputeResponses).values({
    disputeId,
    userId,
    phase: "phase_3_pending",
    responseType: "external",
    message: "Chose external resolution",
  });

  // REJECTOR LOSES 100%
  let customerPercent: number;
  let vendorPercent: number;

  if (isCustomer) {
    customerPercent = 0;
    vendorPercent = 100;
  } else {
    customerPercent = 100;
    vendorPercent = 0;
  }

  // Charge the 25 CHF fee to the rejector
  const feeResult = await chargeDisputeFee(
    disputeId, 
    userId, 
    isCustomer ? "customer" : "vendor"
  );

  // Execute the fund swap
  await executeResolution(disputeId, customerPercent, vendorPercent, "external_resolution");

  // Mark dispute phase
  await markExternalResolution(disputeId, isCustomer ? "customer" : "vendor");

  // Notify both parties
  const customerMessage = isCustomer 
    ? "You chose external resolution. The vendor receives full payment, and you've been charged a 25 CHF fee."
    : "The vendor chose external resolution. You receive a full refund.";
  
  const vendorMessage = isVendor 
    ? "You chose external resolution. The customer receives a full refund, and you've been charged a 25 CHF fee."
    : "The customer chose external resolution. You receive full payment.";

  await createNotification({
    userId: parties.customerId,
    type: "payment",
    title: "External Resolution Chosen",
    message: customerMessage,
    metadata: { disputeId, outcome: { customerPercent, vendorPercent } },
  });

  await createNotification({
    userId: parties.vendorId,
    type: "payment",
    title: "External Resolution Chosen",
    message: vendorMessage,
    metadata: { disputeId, outcome: { customerPercent, vendorPercent } },
  });

  console.log(`[Dispute] External resolution: ${isCustomer ? "Customer" : "Vendor"} rejected. Customer ${customerPercent}%, Vendor ${vendorPercent}%`);

  return {
    success: true,
    feeCharged: feeResult.success || feeResult.debtCreated || false,
    outcome: { customerPercent, vendorPercent },
  };
}

// ============================================
// FUND EXECUTION
// ============================================

/**
 * Execute the actual fund transfer based on resolution
 */
async function executeResolution(
  disputeId: string,
  customerPercent: number,
  vendorPercent: number,
  resolutionType: string
): Promise<void> {
  const [dispute] = await db
    .select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Get booking for amount
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, dispute.bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Get escrow transaction for payment details
  const [escrow] = await db
    .select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.id, dispute.escrowTransactionId))
    .limit(1);

  if (!escrow) {
    throw new Error("Escrow transaction not found");
  }

  const escrowAmount = parseFloat(escrow.amount);
  const customerAmount = Math.round(escrowAmount * customerPercent / 100 * 100) / 100;
  const vendorAmount = Math.round(escrowAmount * vendorPercent / 100 * 100) / 100;

  console.log(`[Dispute] Executing resolution: Customer ${customerAmount} CHF, Vendor ${vendorAmount} CHF`);

  try {
    // Refund to customer if they get any amount
    if (customerAmount > 0 && booking.stripePaymentIntentId) {
      await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: Math.round(customerAmount * 100),
        reason: "requested_by_customer",
        metadata: {
          type: "dispute_resolution",
          disputeId,
          resolutionType,
        },
      });
    }

    // Transfer to vendor if they get any amount
    if (vendorAmount > 0) {
      const [vendor] = await db
        .select()
        .from(users)
        .where(eq(users.id, booking.vendorId))
        .limit(1);

      if (vendor?.stripeConnectAccountId) {
        await stripe.transfers.create({
          amount: Math.round(vendorAmount * 100),
          currency: "chf",
          destination: vendor.stripeConnectAccountId,
          transfer_group: `dispute_${disputeId}`,
          metadata: {
            type: "dispute_resolution",
            disputeId,
            resolutionType,
          },
        });
      }
    }

    // Update dispute status - map to valid enum values
    const status = customerPercent > vendorPercent 
      ? "resolved_customer" 
      : vendorPercent > customerPercent 
        ? "resolved_vendor" 
        : "resolved_split";

    await db
      .update(escrowDisputes)
      .set({
        status,
        resolvedAt: new Date(),
        refundAmount: customerAmount.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(escrowDisputes.id, disputeId));

    // Update escrow transaction
    await db
      .update(escrowTransactions)
      .set({
        status: customerPercent === 100 ? "refunded" : "released",
        releasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(escrowTransactions.id, dispute.escrowTransactionId));

    console.log(`[Dispute] Resolution executed successfully`);

  } catch (error: any) {
    console.error(`[Dispute] Failed to execute resolution:`, error.message);
    throw error;
  }
}

// ============================================
// QUERIES
// ============================================

/**
 * Get dispute details with all phase information
 */
export async function getDisputeDetails(disputeId: string): Promise<{
  dispute: any;
  phases: any;
  parties: { customerId: string; vendorId: string } | null;
  aiDecision: DisputeAiDecision | null;
  responses: DisputeResponse[];
}> {
  const [dispute] = await db
    .select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  const phases = await getDisputePhases(disputeId);
  const parties = await getDisputeParties(disputeId);

  const [aiDecision] = await db
    .select()
    .from(disputeAiDecisions)
    .where(eq(disputeAiDecisions.disputeId, disputeId))
    .orderBy(desc(disputeAiDecisions.createdAt))
    .limit(1);

  const responses = await db
    .select()
    .from(disputeResponses)
    .where(eq(disputeResponses.disputeId, disputeId))
    .orderBy(desc(disputeResponses.createdAt));

  return {
    dispute,
    phases,
    parties,
    aiDecision: aiDecision || null,
    responses,
  };
}

/**
 * Get disputes for a user
 */
export async function getUserDisputes(
  userId: string
): Promise<any[]> {
  // Get bookings where user is customer or vendor
  const customerBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.customerId, userId));
  
  const vendorBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.vendorId, userId));

  const bookingIds = [
    ...customerBookings.map(b => b.id),
    ...vendorBookings.map(b => b.id),
  ];

  if (bookingIds.length === 0) {
    return [];
  }

  // Get disputes for these bookings
  const disputes = [];
  for (const bookingId of bookingIds) {
    const bookingDisputes = await db
      .select()
      .from(escrowDisputes)
      .where(eq(escrowDisputes.bookingId, bookingId))
      .orderBy(desc(escrowDisputes.createdAt));
    disputes.push(...bookingDisputes);
  }

  return disputes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ============================================
// EXPORTS
// ============================================

export {
  DISPUTE_FEE_CHF,
};
