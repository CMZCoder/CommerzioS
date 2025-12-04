/**
 * Vendor Charge Service
 * 
 * Handles charging vendors for:
 * 1. Commission on Cash/TWINT bookings (5%)
 * 2. Dispute resolution fees (25 CHF)
 * 
 * Uses Stripe Customer objects (separate from Connect accounts)
 * with saved payment methods for off-session charges.
 */

import Stripe from "stripe";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users } from "../shared/schema";
import { 
  vendorPaymentMethods, 
  platformDebts, 
  proposals,
  type VendorPaymentMethod,
  type InsertPlatformDebt 
} from "../shared/schema-service-requests";
import { 
  disputeFeeCharges
} from "../shared/schema-disputes";

// ============================================
// CONFIGURATION
// ============================================

const PLATFORM_COMMISSION_RATE = 0.05;  // 5%
const DISPUTE_FEE_CHF = 25.00;
const MAX_CHARGE_ATTEMPTS = 3;
const RETRY_DELAY_HOURS = [1, 24, 72];  // Retry after 1h, 24h, 72h

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

// ============================================
// VENDOR PAYMENT METHOD MANAGEMENT
// ============================================

/**
 * Create a SetupIntent for vendor to add a payment method
 * This is required before they can accept Cash/TWINT proposals
 */
export async function createVendorSetupIntent(vendorId: string): Promise<{
  clientSecret: string;
  customerId: string;
}> {
  // Check if vendor already has a Stripe Customer
  const [existingPaymentMethod] = await db
    .select()
    .from(vendorPaymentMethods)
    .where(eq(vendorPaymentMethods.vendorId, vendorId))
    .limit(1);

  let customerId: string;

  if (existingPaymentMethod?.stripeCustomerId) {
    customerId = existingPaymentMethod.stripeCustomerId;
  } else {
    // Get vendor details for creating Stripe Customer
    const [vendor] = await db
      .select()
      .from(users)
      .where(eq(users.id, vendorId))
      .limit(1);

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    // Create Stripe Customer for the vendor
    const customer = await stripe.customers.create({
      email: vendor.email || undefined,
      name: `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || undefined,
      metadata: {
        userId: vendorId,
        type: "vendor_billing",
      },
    });

    customerId = customer.id;

    // Save to database
    await db.insert(vendorPaymentMethods).values({
      vendorId,
      stripeCustomerId: customerId,
    });
  }

  // Create SetupIntent for off-session usage
  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: "off_session",  // Critical for charging later without user present
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: {
      vendorId,
      purpose: "platform_charges",
    },
  });

  return {
    clientSecret: setupIntent.client_secret!,
    customerId,
  };
}

/**
 * Confirm and save the payment method after SetupIntent completes
 */
export async function saveVendorPaymentMethod(
  vendorId: string,
  paymentMethodId: string
): Promise<VendorPaymentMethod> {
  // Get payment method details from Stripe
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

  if (!paymentMethod.card) {
    throw new Error("Only card payment methods are supported");
  }

  // Update vendor's default payment method
  const [updated] = await db
    .update(vendorPaymentMethods)
    .set({
      defaultPaymentMethodId: paymentMethodId,
      paymentMethodLast4: paymentMethod.card.last4,
      paymentMethodBrand: paymentMethod.card.brand,
      paymentMethodExpMonth: paymentMethod.card.exp_month,
      paymentMethodExpYear: paymentMethod.card.exp_year,
      isValid: true,
      lastValidatedAt: new Date(),
      validationError: null,
      updatedAt: new Date(),
    })
    .where(eq(vendorPaymentMethods.vendorId, vendorId))
    .returning();

  return updated;
}

/**
 * Validate that a vendor has a valid payment method
 */
export async function validateVendorPaymentMethod(vendorId: string): Promise<{
  valid: boolean;
  error?: string;
  paymentMethod?: VendorPaymentMethod;
}> {
  const [paymentMethod] = await db
    .select()
    .from(vendorPaymentMethods)
    .where(eq(vendorPaymentMethods.vendorId, vendorId))
    .limit(1);

  if (!paymentMethod) {
    return { valid: false, error: "No payment method on file" };
  }

  if (!paymentMethod.defaultPaymentMethodId) {
    return { valid: false, error: "No default payment method set" };
  }

  // Check if card is expired
  const now = new Date();
  const expYear = paymentMethod.paymentMethodExpYear || 0;
  const expMonth = paymentMethod.paymentMethodExpMonth || 0;
  
  if (expYear < now.getFullYear() || 
      (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    await db
      .update(vendorPaymentMethods)
      .set({ 
        isValid: false, 
        validationError: "Card expired",
        updatedAt: new Date(),
      })
      .where(eq(vendorPaymentMethods.vendorId, vendorId));
    
    return { valid: false, error: "Card expired" };
  }

  return { valid: true, paymentMethod };
}

// ============================================
// COMMISSION CHARGING (Cash/TWINT Bookings)
// ============================================

/**
 * Calculate commission for a booking
 */
export function calculateCommission(amount: number): number {
  return Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;  // Round to 2 decimals
}

/**
 * Charge vendor commission when Cash/TWINT proposal is accepted
 * Called immediately when booking is confirmed
 */
export async function chargeVendorCommission(
  vendorId: string,
  proposalId: string,
  bookingAmount: number,
  bookingId: string
): Promise<{
  success: boolean;
  chargeId?: string;
  error?: string;
  debtCreated?: boolean;
}> {
  const commissionAmount = calculateCommission(bookingAmount);
  
  console.log(`[VendorCharge] Charging ${vendorId} commission of ${commissionAmount} CHF for proposal ${proposalId}`);

  // Validate vendor has payment method
  const validation = await validateVendorPaymentMethod(vendorId);
  
  if (!validation.valid || !validation.paymentMethod) {
    console.error(`[VendorCharge] Vendor ${vendorId} has no valid payment method: ${validation.error}`);
    
    // Create debt record
    await createPlatformDebt({
      userId: vendorId,
      debtType: "commission",
      amount: commissionAmount.toString(),
      description: `Commission for booking ${bookingId}`,
      proposalId,
      bookingId,
    });

    return { 
      success: false, 
      error: validation.error,
      debtCreated: true 
    };
  }

  try {
    // Create PaymentIntent for off-session charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(commissionAmount * 100),  // Convert to cents
      currency: "chf",
      customer: validation.paymentMethod.stripeCustomerId,
      payment_method: validation.paymentMethod.defaultPaymentMethodId!,
      off_session: true,
      confirm: true,
      description: `Platform commission for booking ${bookingId}`,
      metadata: {
        type: "vendor_commission",
        vendorId,
        proposalId,
        bookingId,
        commissionRate: PLATFORM_COMMISSION_RATE.toString(),
      },
    });

    if (paymentIntent.status === "succeeded") {
      // Update proposal with commission charged
      await db
        .update(proposals)
        .set({
          commissionAmount: commissionAmount.toString(),
          commissionCharged: true,
          commissionChargeId: paymentIntent.id,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, proposalId));

      console.log(`[VendorCharge] Successfully charged ${commissionAmount} CHF to vendor ${vendorId}`);
      
      return { 
        success: true, 
        chargeId: paymentIntent.id 
      };
    } else {
      throw new Error(`PaymentIntent status: ${paymentIntent.status}`);
    }
  } catch (error: any) {
    console.error(`[VendorCharge] Failed to charge vendor ${vendorId}:`, error.message);

    // Handle specific Stripe errors
    let errorMessage = error.message;
    
    if (error.type === "StripeCardError") {
      // Card was declined
      errorMessage = `Card declined: ${error.decline_code || error.message}`;
      
      // Mark payment method as invalid
      await db
        .update(vendorPaymentMethods)
        .set({ 
          isValid: false, 
          validationError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(vendorPaymentMethods.vendorId, vendorId));
    }

    // Update proposal with failure
    await db
      .update(proposals)
      .set({
        commissionAmount: commissionAmount.toString(),
        commissionCharged: false,
        commissionChargeFailedAt: new Date(),
        commissionChargeError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));

    // Create debt record for retry
    await createPlatformDebt({
      userId: vendorId,
      debtType: "commission",
      amount: commissionAmount.toString(),
      description: `Commission for booking ${bookingId}`,
      proposalId,
      bookingId,
      chargeAttempts: 1,
      lastAttemptAt: new Date(),
      lastAttemptError: errorMessage,
      nextAttemptAt: new Date(Date.now() + RETRY_DELAY_HOURS[0] * 60 * 60 * 1000),
    });

    return { 
      success: false, 
      error: errorMessage,
      debtCreated: true 
    };
  }
}

// ============================================
// DISPUTE FEE CHARGING (External Resolution)
// ============================================

/**
 * Charge the 25 CHF dispute fee when a party chooses External Resolution
 * 
 * Game Theory Implementation:
 * - If Vendor chooses External: Customer gets 100% refund, Vendor pays 25 CHF fee
 * - If Customer chooses External: Vendor gets funds, Customer pays 25 CHF fee
 * 
 * In the Vendor case, we need to charge their stored card since they get 0 payout.
 */
export async function chargeDisputeFee(
  disputeId: string,
  userId: string,
  userRole: "customer" | "vendor"
): Promise<{
  success: boolean;
  chargeId?: string;
  error?: string;
  debtCreated?: boolean;
}> {
  console.log(`[DisputeFee] Charging ${userId} (${userRole}) dispute fee of ${DISPUTE_FEE_CHF} CHF`);

  // For customers, we could charge their original payment method
  // For vendors, we must use their stored billing card
  
  if (userRole === "vendor") {
    // Vendor case - use their stored payment method
    return await chargeVendorDisputeFee(disputeId, userId);
  } else {
    // Customer case - we could deduct from any refund or charge their card
    // For now, create debt record (simpler implementation)
    return await chargeCustomerDisputeFee(disputeId, userId);
  }
}

async function chargeVendorDisputeFee(
  disputeId: string,
  vendorId: string
): Promise<{
  success: boolean;
  chargeId?: string;
  error?: string;
  debtCreated?: boolean;
}> {
  const validation = await validateVendorPaymentMethod(vendorId);
  
  if (!validation.valid || !validation.paymentMethod) {
    console.error(`[DisputeFee] Vendor ${vendorId} has no valid payment method: ${validation.error}`);
    
    // Create fee charge record as failed
    await db.insert(disputeFeeCharges).values({
      disputeId,
      userId: vendorId,
      amount: DISPUTE_FEE_CHF.toString(),
      reason: "external_resolution",
      status: "failed",
      chargeAttempts: 1,
      lastAttemptAt: new Date(),
      lastAttemptError: validation.error || "No valid payment method",
    });

    // Also create debt record
    await createPlatformDebt({
      userId: vendorId,
      debtType: "dispute_fee",
      amount: DISPUTE_FEE_CHF.toString(),
      description: `External resolution fee for dispute ${disputeId}`,
      disputeId,
    });

    return { 
      success: false, 
      error: validation.error,
      debtCreated: true 
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(DISPUTE_FEE_CHF * 100),
      currency: "chf",
      customer: validation.paymentMethod.stripeCustomerId,
      payment_method: validation.paymentMethod.defaultPaymentMethodId!,
      off_session: true,
      confirm: true,
      description: `Dispute resolution fee - External resolution chosen`,
      metadata: {
        type: "dispute_fee",
        disputeId,
        vendorId,
        reason: "external_resolution",
      },
    });

    if (paymentIntent.status === "succeeded") {
      await db.insert(disputeFeeCharges).values({
        disputeId,
        userId: vendorId,
        amount: DISPUTE_FEE_CHF.toString(),
        reason: "external_resolution",
        status: "charged",
        stripeChargeId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
      });

      console.log(`[DisputeFee] Successfully charged ${DISPUTE_FEE_CHF} CHF to vendor ${vendorId}`);
      
      return { success: true, chargeId: paymentIntent.id };
    } else {
      throw new Error(`PaymentIntent status: ${paymentIntent.status}`);
    }
  } catch (error: any) {
    console.error(`[DisputeFee] Failed to charge vendor ${vendorId}:`, error.message);

    await db.insert(disputeFeeCharges).values({
      disputeId,
      userId: vendorId,
      amount: DISPUTE_FEE_CHF.toString(),
      reason: "external_resolution",
      status: "failed",
      chargeAttempts: 1,
      lastAttemptAt: new Date(),
      lastAttemptError: error.message,
    });

    await createPlatformDebt({
      userId: vendorId,
      debtType: "dispute_fee",
      amount: DISPUTE_FEE_CHF.toString(),
      description: `External resolution fee for dispute ${disputeId}`,
      disputeId,
      chargeAttempts: 1,
      lastAttemptAt: new Date(),
      lastAttemptError: error.message,
    });

    return { 
      success: false, 
      error: error.message,
      debtCreated: true 
    };
  }
}

async function chargeCustomerDisputeFee(
  disputeId: string,
  customerId: string
): Promise<{
  success: boolean;
  chargeId?: string;
  error?: string;
  debtCreated?: boolean;
}> {
  // For customers, we typically don't have a stored payment method
  // Options:
  // 1. Deduct from any refund they would receive (but in External Resolution, vendor gets funds)
  // 2. Require payment before generating dispute report
  // 3. Create debt record
  
  // For MVP, create debt record and block future bookings until paid
  await db.insert(disputeFeeCharges).values({
    disputeId,
    userId: customerId,
    amount: DISPUTE_FEE_CHF.toString(),
    reason: "external_resolution",
    status: "pending",
  });

  await createPlatformDebt({
    userId: customerId,
    debtType: "dispute_fee",
    amount: DISPUTE_FEE_CHF.toString(),
    description: `External resolution fee for dispute ${disputeId}`,
    disputeId,
  });

  console.log(`[DisputeFee] Created debt record for customer ${customerId} - ${DISPUTE_FEE_CHF} CHF`);

  return { 
    success: true,  // Debt created successfully
    debtCreated: true 
  };
}

// ============================================
// PLATFORM DEBT MANAGEMENT
// ============================================

async function createPlatformDebt(debt: Partial<InsertPlatformDebt>): Promise<void> {
  await db.insert(platformDebts).values({
    userId: debt.userId!,
    debtType: debt.debtType!,
    amount: debt.amount!,
    currency: "CHF",
    description: debt.description,
    proposalId: debt.proposalId,
    disputeId: debt.disputeId,
    bookingId: debt.bookingId,
    status: "pending",
    chargeAttempts: debt.chargeAttempts || 0,
    lastAttemptAt: debt.lastAttemptAt,
    lastAttemptError: debt.lastAttemptError,
    nextAttemptAt: debt.nextAttemptAt,
  });
}

/**
 * Check if user has outstanding debts
 * Used to block new bookings/proposals
 */
export async function hasOutstandingDebts(userId: string): Promise<{
  hasDebts: boolean;
  totalAmount: number;
  debts: Array<{ type: string; amount: string; createdAt: Date }>;
}> {
  const debts = await db
    .select()
    .from(platformDebts)
    .where(
      and(
        eq(platformDebts.userId, userId),
        eq(platformDebts.status, "pending")
      )
    );

  const totalAmount = debts.reduce(
    (sum, d) => sum + parseFloat(d.amount), 
    0
  );

  return {
    hasDebts: debts.length > 0,
    totalAmount,
    debts: debts.map(d => ({
      type: d.debtType,
      amount: d.amount,
      createdAt: d.createdAt,
    })),
  };
}

/**
 * Retry failed charges (called by cron job)
 */
export async function retryFailedCharges(): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();
  
  const pendingDebts = await db
    .select()
    .from(platformDebts)
    .where(
      and(
        eq(platformDebts.status, "pending"),
        // Only retry if nextAttemptAt has passed
      )
    );

  const results = { attempted: 0, succeeded: 0, failed: 0 };

  for (const debt of pendingDebts) {
    if (debt.nextAttemptAt && debt.nextAttemptAt > now) {
      continue;  // Not time to retry yet
    }

    if ((debt.chargeAttempts || 0) >= MAX_CHARGE_ATTEMPTS) {
      // Max attempts reached, escalate to collection
      await db
        .update(platformDebts)
        .set({ 
          status: "sent_to_collection",
          updatedAt: new Date(),
        })
        .where(eq(platformDebts.id, debt.id));
      continue;
    }

    results.attempted++;

    // Attempt to charge
    const validation = await validateVendorPaymentMethod(debt.userId);
    
    if (!validation.valid || !validation.paymentMethod) {
      results.failed++;
      
      const attemptNumber = (debt.chargeAttempts || 0) + 1;
      await db
        .update(platformDebts)
        .set({
          chargeAttempts: attemptNumber,
          lastAttemptAt: new Date(),
          lastAttemptError: validation.error || "No valid payment method",
          nextAttemptAt: attemptNumber < MAX_CHARGE_ATTEMPTS 
            ? new Date(Date.now() + RETRY_DELAY_HOURS[attemptNumber - 1] * 60 * 60 * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(platformDebts.id, debt.id));
      continue;
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(parseFloat(debt.amount) * 100),
        currency: "chf",
        customer: validation.paymentMethod.stripeCustomerId,
        payment_method: validation.paymentMethod.defaultPaymentMethodId!,
        off_session: true,
        confirm: true,
        description: debt.description || `Platform fee - ${debt.debtType}`,
        metadata: {
          type: "debt_collection",
          debtId: debt.id,
          debtType: debt.debtType,
          userId: debt.userId,
        },
      });

      if (paymentIntent.status === "succeeded") {
        await db
          .update(platformDebts)
          .set({
            status: "paid",
            resolvedAt: new Date(),
            resolvedBy: "payment",
            stripeChargeId: paymentIntent.id,
            updatedAt: new Date(),
          })
          .where(eq(platformDebts.id, debt.id));

        results.succeeded++;
        console.log(`[DebtCollection] Successfully collected ${debt.amount} CHF from ${debt.userId}`);
      } else {
        throw new Error(`PaymentIntent status: ${paymentIntent.status}`);
      }
    } catch (error: any) {
      results.failed++;
      
      const attemptNumber = (debt.chargeAttempts || 0) + 1;
      await db
        .update(platformDebts)
        .set({
          chargeAttempts: attemptNumber,
          lastAttemptAt: new Date(),
          lastAttemptError: error.message,
          nextAttemptAt: attemptNumber < MAX_CHARGE_ATTEMPTS 
            ? new Date(Date.now() + RETRY_DELAY_HOURS[attemptNumber - 1] * 60 * 60 * 1000)
            : null,
          updatedAt: new Date(),
        })
        .where(eq(platformDebts.id, debt.id));
    }
  }

  console.log(`[DebtCollection] Retry complete: ${results.attempted} attempted, ${results.succeeded} succeeded, ${results.failed} failed`);
  
  return results;
}

// ============================================
// EXPORTS
// ============================================

export {
  PLATFORM_COMMISSION_RATE,
  DISPUTE_FEE_CHF,
};
