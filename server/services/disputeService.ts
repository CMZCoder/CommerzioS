/**
 * Dispute Service
 * 
 * Handles all dispute-related operations including:
 * - Creating disputes
 * - Managing dispute status
 * - Admin resolution
 * - Escrow status updates
 */

import { db } from "../db";
import { 
  escrowDisputes, 
  escrowTransactions, 
  bookings, 
  users,
  type EscrowDispute,
  type InsertEscrowDispute,
} from "../../shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { createNotification } from "../notificationService";
import { captureBookingPayment, cancelBookingPayment, createPartialRefund } from "../stripeService";

// ===========================================
// DISPUTE CREATION
// ===========================================

interface CreateDisputeParams {
  bookingId: string;
  userId: string;
  userRole: "customer" | "vendor";
  reason: "service_not_provided" | "poor_quality" | "wrong_service" | "overcharged" | "no_show" | "other";
  description: string;
  evidenceUrls?: string[];
}

/**
 * Create a new dispute for a booking
 */
export async function createDispute(params: CreateDisputeParams): Promise<EscrowDispute> {
  const { bookingId, userId, userRole, reason, description, evidenceUrls } = params;

  // Get escrow transaction
  const [escrowTx] = await db.select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, bookingId))
    .limit(1);

  if (!escrowTx) {
    throw new Error("Escrow transaction not found");
  }

  // Can only raise dispute if escrow is held
  if (escrowTx.status !== "held") {
    throw new Error(`Cannot raise dispute on escrow in status: ${escrowTx.status}`);
  }

  // Check if dispute already exists
  const [existingDispute] = await db.select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.bookingId, bookingId))
    .limit(1);

  if (existingDispute && existingDispute.status === "open") {
    throw new Error("A dispute already exists for this booking");
  }

  // Get booking details
  const [booking] = await db.select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Create dispute record
  const [dispute] = await db.insert(escrowDisputes)
    .values({
      escrowTransactionId: escrowTx.id,
      bookingId,
      raisedBy: userRole,
      raisedByUserId: userId,
      reason,
      description,
      evidenceUrls: evidenceUrls || [],
      status: "open",
    })
    .returning();

  // Update escrow status to disputed (pauses auto-release)
  await db.update(escrowTransactions)
    .set({
      status: "disputed",
      updatedAt: new Date(),
    })
    .where(eq(escrowTransactions.id, escrowTx.id));

  // Notify the other party
  const otherPartyId = userRole === "customer" ? booking.vendorId : booking.customerId;
  await createNotification({
    userId: otherPartyId,
    type: "payment",
    title: "Dispute Raised",
    message: `A dispute has been raised for booking #${booking.bookingNumber}. Reason: ${reason}`,
    actionUrl: `/bookings/${bookingId}`,
    metadata: {
      disputeId: dispute.id,
      bookingId,
      reason,
    },
  });

  // Notify admins (could be a list in production)
  const admins = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.isAdmin, true));

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      type: "system",
      title: "New Dispute",
      message: `New dispute raised for booking #${booking.bookingNumber}`,
      actionUrl: `/admin/disputes/${dispute.id}`,
      metadata: {
        disputeId: dispute.id,
        bookingId,
      },
    });
  }

  console.log(`[Dispute] Created dispute ${dispute.id} for booking ${bookingId}`);
  return dispute;
}

// ===========================================
// DISPUTE QUERIES
// ===========================================

/**
 * Get dispute for a booking
 */
export async function getDisputeByBookingId(bookingId: string): Promise<EscrowDispute | null> {
  const [dispute] = await db.select()
    .from(escrowDisputes)
    .where(eq(escrowDisputes.bookingId, bookingId))
    .limit(1);

  return dispute || null;
}

/**
 * Get dispute by ID with full details
 */
export async function getDisputeById(disputeId: string) {
  const [result] = await db.select({
    dispute: escrowDisputes,
    booking: bookings,
    escrowTx: escrowTransactions,
    raisedByUser: {
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    },
  })
    .from(escrowDisputes)
    .innerJoin(bookings, eq(escrowDisputes.bookingId, bookings.id))
    .innerJoin(escrowTransactions, eq(escrowDisputes.escrowTransactionId, escrowTransactions.id))
    .innerJoin(users, eq(escrowDisputes.raisedByUserId, users.id))
    .where(eq(escrowDisputes.id, disputeId))
    .limit(1);

  return result || null;
}

/**
 * Get all disputes (admin)
 */
export async function getAllDisputes(filters?: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { status, page = 1, limit = 20 } = filters || {};
  const offset = (page - 1) * limit;

  let query = db.select({
    dispute: escrowDisputes,
    booking: {
      id: bookings.id,
      bookingNumber: bookings.bookingNumber,
      customerId: bookings.customerId,
      vendorId: bookings.vendorId,
    },
    escrowTx: {
      id: escrowTransactions.id,
      amount: escrowTransactions.amount,
      status: escrowTransactions.status,
    },
    raisedByUser: {
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    },
  })
    .from(escrowDisputes)
    .innerJoin(bookings, eq(escrowDisputes.bookingId, bookings.id))
    .innerJoin(escrowTransactions, eq(escrowDisputes.escrowTransactionId, escrowTransactions.id))
    .innerJoin(users, eq(escrowDisputes.raisedByUserId, users.id))
    .orderBy(desc(escrowDisputes.createdAt))
    .limit(limit)
    .offset(offset);

  if (status) {
    const disputes = await db.select({
      dispute: escrowDisputes,
      booking: {
        id: bookings.id,
        bookingNumber: bookings.bookingNumber,
        customerId: bookings.customerId,
        vendorId: bookings.vendorId,
      },
      escrowTx: {
        id: escrowTransactions.id,
        amount: escrowTransactions.amount,
        status: escrowTransactions.status,
      },
      raisedByUser: {
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
      .from(escrowDisputes)
      .innerJoin(bookings, eq(escrowDisputes.bookingId, bookings.id))
      .innerJoin(escrowTransactions, eq(escrowDisputes.escrowTransactionId, escrowTransactions.id))
      .innerJoin(users, eq(escrowDisputes.raisedByUserId, users.id))
      .where(eq(escrowDisputes.status, status as any))
      .orderBy(desc(escrowDisputes.createdAt))
      .limit(limit)
      .offset(offset);
    return disputes;
  }

  return query;
}

// ===========================================
// DISPUTE RESOLUTION (ADMIN)
// ===========================================

interface ResolveDisputeParams {
  disputeId: string;
  adminId: string;
  resolution: "customer" | "vendor" | "split";
  refundPercentage?: number; // For split resolution
  notes?: string;
}

/**
 * Resolve a dispute (admin only)
 */
export async function resolveDispute(params: ResolveDisputeParams): Promise<EscrowDispute> {
  const { disputeId, adminId, resolution, refundPercentage, notes } = params;

  // Get dispute details
  const disputeDetails = await getDisputeById(disputeId);
  if (!disputeDetails) {
    throw new Error("Dispute not found");
  }

  const { dispute, booking, escrowTx } = disputeDetails;

  if (dispute.status !== "open" && dispute.status !== "under_review") {
    throw new Error("Dispute is already resolved");
  }

  const escrowAmount = parseFloat(escrowTx.amount) * 100; // Convert to cents

  try {
    // Process based on resolution type
    let finalStatus: "resolved_customer" | "resolved_vendor" | "resolved_split";
    let refundAmount: number = 0;

    switch (resolution) {
      case "customer":
        // Full refund to customer
        finalStatus = "resolved_customer";
        await cancelBookingPayment(booking.id, notes || "Dispute resolved in favor of customer");
        refundAmount = escrowAmount;
        break;

      case "vendor":
        // Release full payment to vendor
        finalStatus = "resolved_vendor";
        await captureBookingPayment(booking.id);
        break;

      case "split":
        // Partial refund based on percentage
        finalStatus = "resolved_split";
        const percentage = refundPercentage || 50;
        refundAmount = Math.round(escrowAmount * (percentage / 100));
        
        // First capture the payment
        await captureBookingPayment(booking.id);
        
        // Then create partial refund
        if (refundAmount > 0) {
          await createPartialRefund(booking.id, refundAmount, notes || "Dispute resolved with split");
        }
        break;
    }

    // Update dispute status
    const [updatedDispute] = await db.update(escrowDisputes)
      .set({
        status: finalStatus,
        resolvedBy: adminId,
        resolution: notes || `Resolved in favor of ${resolution}`,
        refundAmount: (refundAmount / 100).toString(),
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(escrowDisputes.id, disputeId))
      .returning();

    // Notify both parties
    const [customer] = await db.select()
      .from(users)
      .where(eq(users.id, booking.customerId))
      .limit(1);

    const [vendor] = await db.select()
      .from(users)
      .where(eq(users.id, booking.vendorId))
      .limit(1);

    // Notification message based on resolution
    const customerMessage = resolution === "customer"
      ? "Your dispute has been resolved in your favor. A full refund will be processed."
      : resolution === "vendor"
        ? "Your dispute has been resolved in favor of the vendor."
        : `Your dispute has been resolved. A partial refund of ${refundPercentage}% will be processed.`;

    const vendorMessage = resolution === "vendor"
      ? "The dispute has been resolved in your favor. Payment has been released."
      : resolution === "customer"
        ? "The dispute has been resolved in favor of the customer. Payment has been refunded."
        : `The dispute has been resolved with a ${refundPercentage}% refund to the customer.`;

    await createNotification({
      userId: booking.customerId,
      type: "payment",
      title: "Dispute Resolved",
      message: customerMessage,
      actionUrl: `/bookings/${booking.id}`,
    });

    await createNotification({
      userId: booking.vendorId,
      type: "payment",
      title: "Dispute Resolved",
      message: vendorMessage,
      actionUrl: `/vendor/bookings/${booking.id}`,
    });

    console.log(`[Dispute] Resolved dispute ${disputeId} as ${resolution}`);
    return updatedDispute;
  } catch (error) {
    console.error(`[Dispute] Error resolving dispute ${disputeId}:`, error);
    throw error;
  }
}

/**
 * Update dispute status to under_review
 */
export async function markDisputeUnderReview(disputeId: string, adminId: string): Promise<EscrowDispute> {
  const [updatedDispute] = await db.update(escrowDisputes)
    .set({
      status: "under_review",
      updatedAt: new Date(),
    })
    .where(eq(escrowDisputes.id, disputeId))
    .returning();

  return updatedDispute;
}

/**
 * Close a dispute without resolution (e.g., withdrawn by user)
 */
export async function closeDispute(disputeId: string, adminId: string, reason?: string): Promise<EscrowDispute> {
  // Get dispute and related escrow
  const disputeDetails = await getDisputeById(disputeId);
  if (!disputeDetails) {
    throw new Error("Dispute not found");
  }

  // Restore escrow status to held if it was disputed
  await db.update(escrowTransactions)
    .set({
      status: "held",
      updatedAt: new Date(),
    })
    .where(eq(escrowTransactions.id, disputeDetails.escrowTx.id));

  const [updatedDispute] = await db.update(escrowDisputes)
    .set({
      status: "closed",
      resolvedBy: adminId,
      resolution: reason || "Dispute closed",
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(escrowDisputes.id, disputeId))
    .returning();

  return updatedDispute;
}
