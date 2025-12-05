/**
 * Tip Service
 * Handles customer tips to vendors after service completion
 */

import { db } from './db';
import { tips, bookings, users, escrowTransactions, notifications, services } from '../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2025-03-31.basil' as any });

export interface CreateTipInput {
  bookingId: string;
  customerId: string;
  amount: number;
  message?: string;
  paymentMethod: 'card' | 'twint' | 'cash';
}

export interface TipResult {
  success: boolean;
  tip?: typeof tips.$inferSelect;
  clientSecret?: string;
  error?: string;
}

/**
 * Create a tip for a completed booking
 */
export async function createTip(input: CreateTipInput): Promise<TipResult> {
  // Validate booking exists and is completed
  const [booking] = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.id, input.bookingId),
      eq(bookings.customerId, input.customerId)
    ))
    .limit(1);

  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }

  if (booking.status !== 'completed') {
    return { success: false, error: 'Can only tip for completed bookings' };
  }

  // Check if tip already exists
  const [existingTip] = await db.select()
    .from(tips)
    .where(eq(tips.bookingId, input.bookingId))
    .limit(1);

  if (existingTip) {
    return { success: false, error: 'Tip already submitted for this booking' };
  }

  // Get escrow transaction if exists
  const [escrow] = await db.select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, input.bookingId))
    .limit(1);

  // For card payments, create Stripe payment intent
  let stripePaymentIntentId: string | undefined;
  let clientSecret: string | undefined;

  if (input.paymentMethod === 'card' && input.amount > 0) {
    try {
      // Get vendor's Stripe Connect account
      const [vendor] = await db.select()
        .from(users)
        .where(eq(users.id, booking.vendorId))
        .limit(1);

      if (!vendor?.stripeConnectAccountId) {
        return { success: false, error: 'Vendor not set up to receive tips' };
      }

      // Create payment intent with automatic transfer to vendor
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: 'chf',
        automatic_payment_methods: { enabled: true },
        transfer_data: {
          destination: vendor.stripeConnectAccountId,
        },
        metadata: {
          type: 'tip',
          bookingId: input.bookingId,
          customerId: input.customerId,
          vendorId: booking.vendorId,
        },
      });

      stripePaymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret || undefined;
    } catch (error) {
      console.error('Stripe error creating tip payment:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Create tip record
  const [newTip] = await db.insert(tips)
    .values({
      bookingId: input.bookingId,
      escrowTransactionId: escrow?.id,
      customerId: input.customerId,
      vendorId: booking.vendorId,
      amount: input.amount.toString(),
      message: input.message,
      paymentMethod: input.paymentMethod,
      stripePaymentIntentId,
      status: input.paymentMethod === 'cash' ? 'completed' : 'pending',
      completedAt: input.paymentMethod === 'cash' ? new Date() : undefined,
    })
    .returning();

  // For cash tips, notify vendor immediately
  if (input.paymentMethod === 'cash') {
    await notifyVendorOfTip(newTip);
  }

  return {
    success: true,
    tip: newTip,
    clientSecret,
  };
}

/**
 * Confirm tip payment (called after Stripe payment completes)
 */
export async function confirmTipPayment(tipId: string): Promise<TipResult> {
  const [tip] = await db.update(tips)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(tips.id, tipId))
    .returning();

  if (tip) {
    await notifyVendorOfTip(tip);
    return { success: true, tip };
  }

  return { success: false, error: 'Tip not found' };
}

/**
 * Get tips received by a vendor
 */
export async function getVendorTips(vendorId: string) {
  return db.select({
    tip: tips,
    booking: bookings,
    customer: {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    },
  })
    .from(tips)
    .innerJoin(bookings, eq(tips.bookingId, bookings.id))
    .innerJoin(users, eq(tips.customerId, users.id))
    .where(and(
      eq(tips.vendorId, vendorId),
      eq(tips.status, 'completed')
    ))
    .orderBy(desc(tips.createdAt));
}

/**
 * Get tips given by a customer
 */
export async function getCustomerTips(customerId: string) {
  return db.select({
    tip: tips,
    booking: bookings,
    vendor: {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    },
    service: {
      id: services.id,
      title: services.title,
    },
  })
    .from(tips)
    .innerJoin(bookings, eq(tips.bookingId, bookings.id))
    .innerJoin(users, eq(tips.vendorId, users.id))
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(tips.customerId, customerId))
    .orderBy(desc(tips.createdAt));
}

/**
 * Check if customer can tip for a booking
 */
export async function canTip(bookingId: string, customerId: string): Promise<{ canTip: boolean; reason?: string }> {
  const [booking] = await db.select()
    .from(bookings)
    .where(and(
      eq(bookings.id, bookingId),
      eq(bookings.customerId, customerId)
    ))
    .limit(1);

  if (!booking) {
    return { canTip: false, reason: 'Booking not found' };
  }

  if (booking.status !== 'completed') {
    return { canTip: false, reason: 'Booking not completed' };
  }

  const [existingTip] = await db.select()
    .from(tips)
    .where(eq(tips.bookingId, bookingId))
    .limit(1);

  if (existingTip) {
    return { canTip: false, reason: 'Already tipped' };
  }

  return { canTip: true };
}

/**
 * Notify vendor of received tip
 */
async function notifyVendorOfTip(tip: typeof tips.$inferSelect) {
  const [booking] = await db.select()
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.id, tip.bookingId))
    .limit(1);

  if (!booking) return;

  const [customer] = await db.select()
    .from(users)
    .where(eq(users.id, tip.customerId))
    .limit(1);

  await db.insert(notifications).values({
    userId: tip.vendorId,
    type: 'tip',
    title: 'You received a tip! 🎉',
    message: `${customer?.firstName || 'A customer'} left you a CHF ${tip.amount} tip${tip.message ? `: "${tip.message}"` : ''}`,
    actionUrl: `/vendor/bookings?booking=${tip.bookingId}`,
    metadata: {
      tipId: tip.id,
      bookingId: tip.bookingId,
      amount: tip.amount,
    },
  });
}

/**
 * Get vendor's total tips
 */
export async function getVendorTipStats(vendorId: string) {
  const vendorTips = await db.select()
    .from(tips)
    .where(and(
      eq(tips.vendorId, vendorId),
      eq(tips.status, 'completed')
    ));

  const totalAmount = vendorTips.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const count = vendorTips.length;
  const averageAmount = count > 0 ? totalAmount / count : 0;

  return {
    totalAmount,
    count,
    averageAmount,
  };
}
