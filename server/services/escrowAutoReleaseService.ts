/**
 * Escrow Auto-Release Service
 * 
 * Runs periodically to:
 * 1. Auto-release escrow payments after 48 hours
 * 2. Send warning emails 24 hours before auto-release
 */

import { db } from "../db";
import { escrowTransactions, bookings, users } from "../../shared/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { captureBookingPayment, transferToVendor } from "../stripeService";
import { createNotification } from "../notificationService";
import { sendEmail } from "../emailService";

// ===========================================
// AUTO-RELEASE PROCESSING
// ===========================================

interface AutoReleaseResult {
  released: number;
  errors: number;
  errorDetails: string[];
}

/**
 * Process all escrow transactions eligible for auto-release
 * Criteria:
 * - status = 'held'
 * - autoReleaseAt <= now
 * - No active dispute (status !== 'disputed')
 */
export async function processAutoReleases(): Promise<AutoReleaseResult> {
  const result: AutoReleaseResult = {
    released: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    const now = new Date();

    // Find all escrow transactions eligible for auto-release
    const eligibleTransactions = await db
      .select({
        escrowTx: escrowTransactions,
        booking: bookings,
        vendor: users,
        customer: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(escrowTransactions)
      .innerJoin(bookings, eq(escrowTransactions.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.vendorId, users.id))
      .where(
        and(
          eq(escrowTransactions.status, "held"),
          lte(escrowTransactions.autoReleaseAt, now)
        )
      );

    console.log(`[EscrowAutoRelease] Found ${eligibleTransactions.length} transactions eligible for auto-release`);

    for (const { escrowTx, booking, vendor } of eligibleTransactions) {
      try {
        // Double-check status hasn't changed
        if (escrowTx.status !== "held") {
          continue;
        }

        // Capture the payment (release funds to vendor)
        const captured = await captureBookingPayment(booking.id);
        
        if (!captured) {
          throw new Error("Failed to capture payment");
        }

        // Transfer to vendor's Stripe Connect account if available
        if (vendor.stripeConnectAccountId && vendor.stripeConnectOnboarded) {
          await transferToVendor({
            escrowTransactionId: escrowTx.id,
            vendorId: vendor.id,
            amount: Math.round(parseFloat(escrowTx.vendorAmount) * 100), // Convert to cents
          });
        }

        // Update booking status to completed if not already
        await db.update(bookings)
          .set({
            status: "completed",
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(bookings.id, booking.id),
              sql`${bookings.status} != 'completed'`
            )
          );

        // Get customer details for notification
        const [customer] = await db
          .select()
          .from(users)
          .where(eq(users.id, booking.customerId))
          .limit(1);

        // Send notification to customer
        await createNotification({
          userId: booking.customerId,
          type: "payment",
          title: "Payment Released",
          message: `Your escrow payment of CHF ${escrowTx.amount} has been auto-released to the vendor after 48 hours.`,
          actionUrl: `/bookings?booking=${booking.id}`,
          metadata: {
            bookingId: booking.id,
            amount: escrowTx.amount,
            autoReleased: true,
          },
        });

        // Send notification to vendor
        await createNotification({
          userId: booking.vendorId,
          type: "payment",
          title: "Payment Received",
          message: `Payment of CHF ${escrowTx.vendorAmount} has been released to your account.`,
          actionUrl: `/vendor/bookings?booking=${booking.id}`,
          metadata: {
            bookingId: booking.id,
            amount: escrowTx.vendorAmount,
            autoReleased: true,
          },
        });

        console.log(`[EscrowAutoRelease] Released escrow for booking ${booking.id}`);
        result.released++;
      } catch (error: any) {
        console.error(`[EscrowAutoRelease] Error processing booking ${booking.id}:`, error);
        result.errors++;
        result.errorDetails.push(`Booking ${booking.id}: ${error.message}`);
      }
    }

    console.log(`[EscrowAutoRelease] Completed: ${result.released} released, ${result.errors} errors`);
    return result;
  } catch (error) {
    console.error("[EscrowAutoRelease] Fatal error:", error);
    throw error;
  }
}

// ===========================================
// AUTO-RELEASE WARNING EMAILS
// ===========================================

/**
 * Send warning emails 24 hours before auto-release
 * Criteria:
 * - status = 'held'
 * - autoReleaseAt is within next 24 hours
 * - autoReleaseWarningSentAt is null (haven't sent warning yet)
 */
export async function sendAutoReleaseWarnings(): Promise<number> {
  try {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find escrow transactions that need warning emails
    const transactionsNeedingWarning = await db
      .select({
        escrowTx: escrowTransactions,
        booking: bookings,
        customer: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
        },
      })
      .from(escrowTransactions)
      .innerJoin(bookings, eq(escrowTransactions.bookingId, bookings.id))
      .innerJoin(users, eq(bookings.customerId, users.id))
      .where(
        and(
          eq(escrowTransactions.status, "held"),
          lte(escrowTransactions.autoReleaseAt, twentyFourHoursFromNow),
          isNull(escrowTransactions.autoReleaseWarningSentAt)
        )
      );

    console.log(`[EscrowAutoRelease] Found ${transactionsNeedingWarning.length} transactions needing warning emails`);

    let sentCount = 0;

    for (const { escrowTx, booking, customer } of transactionsNeedingWarning) {
      try {
        // Calculate hours until release
        const hoursUntilRelease = escrowTx.autoReleaseAt 
          ? Math.round((new Date(escrowTx.autoReleaseAt).getTime() - now.getTime()) / (1000 * 60 * 60))
          : 24;

        const disputeUrl = `${process.env.APP_URL || "http://localhost:5000"}/bookings/${booking.id}?action=dispute`;

        // Send warning email to customer
        if (customer.email) {
          await sendEmail({
            to: customer.email,
            subject: "Your payment will be released in 24 hours",
            html: `
              <h2>Payment Auto-Release Warning</h2>
              <p>Hello ${customer.firstName || "Customer"},</p>
              <p>Your escrow payment of <strong>CHF ${escrowTx.amount}</strong> for booking <strong>#${booking.bookingNumber}</strong> will be automatically released to the vendor in <strong>${hoursUntilRelease} hours</strong>.</p>
              <p>If you experienced any issues with the service, please report them before the auto-release:</p>
              <p><a href="${disputeUrl}" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 5px;">Report an Issue</a></p>
              <p>If you're satisfied with the service, no action is needed. The payment will be released automatically.</p>
              <p>Thank you for using Commerzio!</p>
            `,
          });
        }

        // Send in-app notification
        await createNotification({
          userId: customer.id,
          type: "payment",
          title: "Payment Auto-Release Warning",
          message: `Your payment of CHF ${escrowTx.amount} will be released to the vendor in ${hoursUntilRelease} hours. Report any issues before then.`,
          actionUrl: `/bookings?booking=${booking.id}`,
          metadata: {
            bookingId: booking.id,
            amount: escrowTx.amount,
            hoursUntilRelease,
            isWarning: true,
          },
        });

        // Update escrow transaction to mark warning sent
        await db.update(escrowTransactions)
          .set({
            autoReleaseWarningSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(escrowTransactions.id, escrowTx.id));

        console.log(`[EscrowAutoRelease] Sent warning for booking ${booking.id}`);
        sentCount++;
      } catch (error) {
        console.error(`[EscrowAutoRelease] Error sending warning for booking ${booking.id}:`, error);
      }
    }

    console.log(`[EscrowAutoRelease] Sent ${sentCount} warning emails`);
    return sentCount;
  } catch (error) {
    console.error("[EscrowAutoRelease] Error sending warnings:", error);
    throw error;
  }
}

// ===========================================
// CRON JOB RUNNER
// ===========================================

/**
 * Main function to run both auto-release and warning email tasks
 * This is called by the cron job
 */
export async function runEscrowAutoReleaseTasks(): Promise<void> {
  console.log("[EscrowAutoRelease] Starting scheduled tasks...");
  
  try {
    // Process auto-releases
    await processAutoReleases();
    
    // Send warning emails
    await sendAutoReleaseWarnings();
    
    console.log("[EscrowAutoRelease] Scheduled tasks completed");
  } catch (error) {
    console.error("[EscrowAutoRelease] Error in scheduled tasks:", error);
  }
}
