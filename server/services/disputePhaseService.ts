/**
 * Dispute Phase Service
 * 
 * Manages the 3-phase dispute resolution flow:
 * - Phase 1: Direct negotiation (7 days)
 * - Phase 2: AI-mediated with 3 options (7 days)
 * - Phase 3: AI binding decision with 24h review period
 * 
 * Game Theory: Rejecting AI decision = External Resolution
 * - Rejector loses 100% of escrow
 * - Rejector pays 25 CHF admin fee
 * 
 * Note: This service extends the existing escrowDisputes table.
 * Customer/Vendor IDs are fetched from the related booking.
 */

import { db } from "../db";
import { eq, and, lt } from "drizzle-orm";
import { escrowDisputes, bookings } from "../../shared/schema";
import { 
  disputePhases, 
  type DisputePhase,
  type InsertDisputePhase
} from "../../shared/schema-disputes";
import { createNotification } from "../notificationService";

// ============================================
// CONSTANTS
// ============================================

const PHASE_DURATION = {
  PHASE_1_DAYS: 7,
  PHASE_2_DAYS: 7,
  PHASE_3_HOURS: 24,
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get customer and vendor IDs from a dispute via the booking
 */
export async function getDisputeParties(disputeId: string): Promise<{ 
  customerId: string; 
  vendorId: string;
  bookingId: string;
} | null> {
  const [dispute] = await db
    .select({ bookingId: escrowDisputes.bookingId })
    .from(escrowDisputes)
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  if (!dispute) return null;

  const [booking] = await db
    .select({
      customerId: bookings.customerId,
      vendorId: bookings.vendorId,
    })
    .from(bookings)
    .where(eq(bookings.id, dispute.bookingId))
    .limit(1);

  if (!booking) return null;

  return {
    customerId: booking.customerId,
    vendorId: booking.vendorId,
    bookingId: dispute.bookingId,
  };
}

/**
 * Notify both parties of a dispute event
 */
async function notifyDisputeParties(
  disputeId: string,
  title: string,
  message: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  const parties = await getDisputeParties(disputeId);
  if (!parties) return;

  await Promise.all([
    createNotification({
      userId: parties.customerId,
      type: "system",
      title,
      message,
      metadata: { disputeId, ...metadata },
    }),
    createNotification({
      userId: parties.vendorId,
      type: "system",
      title,
      message,
      metadata: { disputeId, ...metadata },
    }),
  ]);
}

// ============================================
// PHASE INITIALIZATION
// ============================================

/**
 * Initialize dispute phases when a dispute is opened
 */
export async function initializeDisputePhases(
  disputeId: string
): Promise<DisputePhase> {
  const now = new Date();
  const phase1Deadline = new Date(now.getTime() + PHASE_DURATION.PHASE_1_DAYS * 24 * 60 * 60 * 1000);

  const [phases] = await db
    .insert(disputePhases)
    .values({
      disputeId,
      currentPhase: "phase_1",
      phase1StartedAt: now,
      phase1Deadline,
    })
    .returning();

  console.log(`[DisputePhase] Initialized Phase 1 for dispute ${disputeId}, deadline: ${phase1Deadline.toISOString()}`);

  return phases;
}

/**
 * Get dispute phases for a dispute
 */
export async function getDisputePhases(disputeId: string): Promise<DisputePhase | null> {
  const [phases] = await db
    .select()
    .from(disputePhases)
    .where(eq(disputePhases.disputeId, disputeId))
    .limit(1);

  return phases || null;
}

// ============================================
// PHASE TRANSITIONS
// ============================================

/**
 * Escalate from Phase 1 to Phase 2
 */
export async function escalateToPhase2(
  disputeId: string,
  escalatedBy?: string
): Promise<DisputePhase> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases) {
    throw new Error("Dispute phases not found");
  }

  if (phases.currentPhase !== "phase_1") {
    throw new Error(`Cannot escalate to Phase 2 from ${phases.currentPhase}`);
  }

  const now = new Date();
  const phase2Deadline = new Date(now.getTime() + PHASE_DURATION.PHASE_2_DAYS * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(disputePhases)
    .set({
      currentPhase: "phase_2",
      phase1ResolvedAt: now,
      phase2StartedAt: now,
      phase2Deadline,
      updatedAt: now,
    })
    .where(eq(disputePhases.disputeId, disputeId))
    .returning();

  const message = escalatedBy 
    ? "The dispute has been escalated to AI-mediated resolution."
    : "The dispute has automatically escalated due to deadline expiry.";

  await notifyDisputeParties(disputeId, "Dispute Escalated to Phase 2", message, { phase: "phase_2" });

  console.log(`[DisputePhase] Escalated dispute ${disputeId} to Phase 2, deadline: ${phase2Deadline.toISOString()}`);

  return updated;
}

/**
 * Escalate from Phase 2 to Phase 3 (AI Final Decision)
 */
export async function escalateToPhase3(
  disputeId: string,
  escalatedBy?: string
): Promise<DisputePhase> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases) {
    throw new Error("Dispute phases not found");
  }

  if (phases.currentPhase !== "phase_2") {
    throw new Error(`Cannot escalate to Phase 3 from ${phases.currentPhase}`);
  }

  const now = new Date();
  const reviewDeadline = new Date(now.getTime() + PHASE_DURATION.PHASE_3_HOURS * 60 * 60 * 1000);

  const [updated] = await db
    .update(disputePhases)
    .set({
      currentPhase: "phase_3_pending",
      phase2ResolvedAt: now,
      phase3StartedAt: now,
      phase3ReviewDeadline: reviewDeadline,
      updatedAt: now,
    })
    .where(eq(disputePhases.disputeId, disputeId))
    .returning();

  await notifyDisputeParties(
    disputeId, 
    "AI Decision Pending",
    "The AI is preparing a binding decision. You have 24 hours to review and choose External Resolution if preferred.",
    { phase: "phase_3_pending", reviewDeadline: reviewDeadline.toISOString() }
  );

  console.log(`[DisputePhase] Escalated dispute ${disputeId} to Phase 3, review deadline: ${reviewDeadline.toISOString()}`);

  return updated;
}

/**
 * Mark Phase 3 AI decision as executed
 */
export async function executePhase3Decision(disputeId: string): Promise<DisputePhase> {
  const phases = await getDisputePhases(disputeId);
  
  if (!phases) {
    throw new Error("Dispute phases not found");
  }

  if (phases.currentPhase !== "phase_3_pending") {
    throw new Error(`Cannot execute decision from ${phases.currentPhase}`);
  }

  const [updated] = await db
    .update(disputePhases)
    .set({
      currentPhase: "phase_3_ai",
      phase3ExecutedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputePhases.disputeId, disputeId))
    .returning();

  await notifyDisputeParties(
    disputeId,
    "AI Decision Executed",
    "The AI's binding decision has been executed. Funds are being transferred.",
    { phase: "phase_3_ai" }
  );

  console.log(`[DisputePhase] Executed Phase 3 AI decision for dispute ${disputeId}`);

  return updated;
}

/**
 * Mark dispute as resolved (in Phase 1 or 2)
 */
export async function markDisputeResolved(
  disputeId: string,
  resolvedInPhase: "phase_1" | "phase_2"
): Promise<DisputePhase> {
  const now = new Date();
  
  const updateData: Partial<InsertDisputePhase> = {
    currentPhase: "resolved",
    updatedAt: now,
  };

  if (resolvedInPhase === "phase_1") {
    updateData.phase1ResolvedAt = now;
  } else {
    updateData.phase2ResolvedAt = now;
  }

  const [updated] = await db
    .update(disputePhases)
    .set(updateData)
    .where(eq(disputePhases.disputeId, disputeId))
    .returning();

  console.log(`[DisputePhase] Marked dispute ${disputeId} as resolved in ${resolvedInPhase}`);

  return updated;
}

/**
 * Mark dispute as externally resolved
 */
export async function markExternalResolution(
  disputeId: string,
  chosenBy: "customer" | "vendor" | "both"
): Promise<DisputePhase> {
  const [updated] = await db
    .update(disputePhases)
    .set({
      currentPhase: "phase_3_external",
      externalResolutionChosenBy: chosenBy,
      externalResolutionChosenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(disputePhases.disputeId, disputeId))
    .returning();

  console.log(`[DisputePhase] Marked dispute ${disputeId} for external resolution, chosen by: ${chosenBy}`);

  return updated;
}

// ============================================
// DEADLINE PROCESSING
// ============================================

/**
 * Process expired Phase 1 disputes (cron job)
 */
export async function processExpiredPhase1Disputes(): Promise<number> {
  const expired = await db
    .select()
    .from(disputePhases)
    .where(
      and(
        eq(disputePhases.currentPhase, "phase_1"),
        lt(disputePhases.phase1Deadline, new Date())
      )
    );

  let count = 0;
  for (const phases of expired) {
    try {
      await escalateToPhase2(phases.disputeId);
      count++;
    } catch (error: any) {
      console.error(`[DisputePhase] Failed to auto-escalate dispute ${phases.disputeId}:`, error.message);
    }
  }

  if (count > 0) {
    console.log(`[DisputePhase] Auto-escalated ${count} disputes from Phase 1 to Phase 2`);
  }

  return count;
}

/**
 * Process expired Phase 2 disputes (cron job)
 */
export async function processExpiredPhase2Disputes(): Promise<number> {
  const expired = await db
    .select()
    .from(disputePhases)
    .where(
      and(
        eq(disputePhases.currentPhase, "phase_2"),
        lt(disputePhases.phase2Deadline, new Date())
      )
    );

  let count = 0;
  for (const phases of expired) {
    try {
      await escalateToPhase3(phases.disputeId);
      count++;
    } catch (error: any) {
      console.error(`[DisputePhase] Failed to auto-escalate dispute ${phases.disputeId}:`, error.message);
    }
  }

  if (count > 0) {
    console.log(`[DisputePhase] Auto-escalated ${count} disputes from Phase 2 to Phase 3`);
  }

  return count;
}

/**
 * Process expired Phase 3 review periods (cron job)
 */
export async function processExpiredPhase3Reviews(): Promise<number> {
  const expired = await db
    .select()
    .from(disputePhases)
    .where(
      and(
        eq(disputePhases.currentPhase, "phase_3_pending"),
        lt(disputePhases.phase3ReviewDeadline, new Date())
      )
    );

  let count = 0;
  for (const phases of expired) {
    try {
      await executePhase3Decision(phases.disputeId);
      count++;
    } catch (error: any) {
      console.error(`[DisputePhase] Failed to execute AI decision for dispute ${phases.disputeId}:`, error.message);
    }
  }

  if (count > 0) {
    console.log(`[DisputePhase] Executed AI decisions for ${count} disputes`);
  }

  return count;
}

/**
 * Run all deadline processors (main cron entry point)
 */
export async function processAllDisputeDeadlines(): Promise<{
  phase1Escalated: number;
  phase2Escalated: number;
  phase3Executed: number;
}> {
  const phase1Escalated = await processExpiredPhase1Disputes();
  const phase2Escalated = await processExpiredPhase2Disputes();
  const phase3Executed = await processExpiredPhase3Reviews();

  return { phase1Escalated, phase2Escalated, phase3Executed };
}

// ============================================
// STATUS QUERIES
// ============================================

/**
 * Check if dispute can be escalated
 */
export async function canEscalateDispute(disputeId: string): Promise<{
  canEscalate: boolean;
  currentPhase: string;
  nextPhase?: string;
  reason?: string;
}> {
  const phases = await getDisputePhases(disputeId);

  if (!phases) {
    return { canEscalate: false, currentPhase: "unknown", reason: "Dispute phases not found" };
  }

  switch (phases.currentPhase) {
    case "phase_1":
      return { canEscalate: true, currentPhase: "phase_1", nextPhase: "phase_2" };
    case "phase_2":
      return { canEscalate: true, currentPhase: "phase_2", nextPhase: "phase_3_pending" };
    case "phase_3_pending":
      return { canEscalate: false, currentPhase: "phase_3_pending", reason: "Can only choose External Resolution" };
    default:
      return { canEscalate: false, currentPhase: phases.currentPhase, reason: `Cannot escalate from ${phases.currentPhase}` };
  }
}

/**
 * Get time remaining until deadline
 */
export async function getTimeUntilDeadline(disputeId: string): Promise<{
  phase: string;
  deadline: Date | null;
  remainingMs: number;
  remainingHuman: string;
  isExpired: boolean;
}> {
  const phases = await getDisputePhases(disputeId);

  if (!phases) {
    return { phase: "unknown", deadline: null, remainingMs: 0, remainingHuman: "N/A", isExpired: true };
  }

  let deadline: Date | null = null;
  switch (phases.currentPhase) {
    case "phase_1": deadline = phases.phase1Deadline; break;
    case "phase_2": deadline = phases.phase2Deadline; break;
    case "phase_3_pending": deadline = phases.phase3ReviewDeadline; break;
  }

  if (!deadline) {
    return { phase: phases.currentPhase, deadline: null, remainingMs: 0, remainingHuman: "No deadline", isExpired: false };
  }

  const remainingMs = Math.max(0, deadline.getTime() - Date.now());
  const isExpired = remainingMs <= 0;

  let remainingHuman: string;
  if (isExpired) {
    remainingHuman = "Expired";
  } else {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    remainingHuman = hours > 24 
      ? `${Math.floor(hours / 24)}d ${hours % 24}h`
      : `${hours}h ${minutes}m`;
  }

  return { phase: phases.currentPhase, deadline, remainingMs, remainingHuman, isExpired };
}

// ============================================
// EXPORTS
// ============================================

export { PHASE_DURATION };
