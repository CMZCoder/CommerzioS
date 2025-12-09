/**
 * Secure Test Bypass Service
 * 
 * Provides cryptographically secured test-only functionality that bypasses
 * normal business rules (like 24-hour booking notice) for E2E testing.
 * 
 * SECURITY MEASURES:
 * 1. Only works in non-production environments
 * 2. Tokens are cryptographically signed with HMAC-SHA256
 * 3. Tokens expire after 5 minutes
 * 4. Tokens are single-use (tracked and invalidated)
 * 5. Special test header required
 * 6. Only test domain emails can use bypass
 */

import crypto from 'crypto';
import { db } from './db';
import {
  bookings, services, reviews, users, notifications,
  escrowTransactions, escrowDisputes, tips
} from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// Test bypass secret - only exists in memory, never logged
const TEST_BYPASS_SECRET = process.env.TEST_BYPASS_SECRET || crypto.randomBytes(32).toString('hex');

// Track used tokens to prevent replay attacks
const usedTokens = new Set<string>();

// Clean up old tokens periodically
setInterval(() => {
  usedTokens.clear();
}, 10 * 60 * 1000); // Clear every 10 minutes

// Test domain for email validation
const TEST_EMAIL_DOMAIN = '@commerzio.test';

interface TestBypassToken {
  userId: string;
  action: string;
  timestamp: number;
  nonce: string;
}

/**
 * Generate a secure test bypass token
 */
export function generateTestBypassToken(userId: string, action: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test bypass not available in production');
  }

  const payload: TestBypassToken = {
    userId,
    action,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString('hex'),
  };

  const payloadString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', TEST_BYPASS_SECRET)
    .update(payloadString)
    .digest('hex');

  const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
  return token;
}

/**
 * Validate and consume a test bypass token
 */
export function validateTestBypassToken(token: string, expectedAction: string): TestBypassToken | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { payload, signature } = decoded;

    // Check signature
    const expectedSignature = crypto
      .createHmac('sha256', TEST_BYPASS_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      console.warn('[TestBypass] Invalid signature');
      return null;
    }

    // Check if token was already used (replay protection)
    const tokenId = `${payload.nonce}:${payload.timestamp}`;
    if (usedTokens.has(tokenId)) {
      console.warn('[TestBypass] Token already used');
      return null;
    }

    // Check expiration (5 minute window)
    const MAX_AGE = 5 * 60 * 1000;
    if (Date.now() - payload.timestamp > MAX_AGE) {
      console.warn('[TestBypass] Token expired');
      return null;
    }

    // Check action matches
    if (payload.action !== expectedAction) {
      console.warn('[TestBypass] Action mismatch');
      return null;
    }

    // Mark token as used
    usedTokens.add(tokenId);

    return payload;
  } catch (error) {
    console.warn('[TestBypass] Token validation failed:', error);
    return null;
  }
}

/**
 * Check if a user email is a test user
 */
export function isTestUser(email: string): boolean {
  return email.endsWith(TEST_EMAIL_DOMAIN);
}

/**
 * Get a test bypass token for a user by email
 * Looks up the user and generates a token if they're a test user
 */
export async function getTestBypassTokenForUser(email: string, action: string): Promise<string | null> {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  if (!isTestUser(email)) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return null;
  }

  return generateTestBypassToken(user.id, action);
}

/**
 * Middleware to validate test bypass requests
 */
export function validateTestBypassRequest(
  req: any,
  action: string
): { valid: boolean; userId?: string; error?: string } {
  // Never allow in production
  if (process.env.NODE_ENV === 'production') {
    return { valid: false, error: 'Not available in production' };
  }

  // Check for test bypass header
  const bypassToken = req.headers['x-test-bypass-token'];
  if (!bypassToken) {
    return { valid: false, error: 'Missing test bypass token' };
  }

  // Validate token
  const tokenData = validateTestBypassToken(bypassToken, action);
  if (!tokenData) {
    return { valid: false, error: 'Invalid or expired test bypass token' };
  }

  return { valid: true, userId: tokenData.userId };
}

// =============================================================================
// TEST BYPASS OPERATIONS
// =============================================================================

/**
 * Create a booking bypassing time restrictions
 * Only works for test users
 */
export async function createTestBooking(data: {
  customerId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status?: 'pending' | 'accepted' | 'completed';
  message?: string;
}): Promise<typeof bookings.$inferSelect> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  // Validate customer is a test user
  const [customer] = await db.select().from(users).where(eq(users.id, data.customerId)).limit(1);
  if (!customer || !customer.email || !isTestUser(customer.email)) {
    throw new Error('Only test users can use bypass operations');
  }

  // Get service
  const [service] = await db.select().from(services).where(eq(services.id, data.serviceId)).limit(1);
  if (!service) {
    throw new Error('Service not found');
  }

  // Generate booking number
  const bookingNumber = `TEST-${Date.now().toString(36).toUpperCase()}`;

  const status = data.status || 'pending';
  const now = new Date();

  const [booking] = await db.insert(bookings)
    .values({
      bookingNumber,
      customerId: data.customerId,
      vendorId: service.ownerId,
      serviceId: data.serviceId,
      requestedStartTime: data.startTime,
      requestedEndTime: data.endTime,
      confirmedStartTime: status !== 'pending' ? data.startTime : null,
      confirmedEndTime: status !== 'pending' ? data.endTime : null,
      status,
      customerMessage: data.message || 'Test booking via bypass',
      acceptedAt: status !== 'pending' ? now : null,
      startedAt: status === 'completed' ? now : null,
      completedAt: status === 'completed' ? now : null,
    })
    .returning();

  console.log(`[TestBypass] Created booking ${booking.id} with status ${status}`);
  return booking;
}

/**
 * Update booking status bypassing normal flow
 */
export async function updateTestBookingStatus(
  bookingId: string,
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
): Promise<typeof bookings.$inferSelect | null> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  const now = new Date();
  const updates: any = { status, updatedAt: now };

  switch (status) {
    case 'accepted': {
      updates.acceptedAt = now;
      // Copy requested times to confirmed times
      const [existing] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
      if (existing) {
        updates.confirmedStartTime = existing.requestedStartTime;
        updates.confirmedEndTime = existing.requestedEndTime;
      }
      break;
    }
    case 'in_progress':
      updates.startedAt = now;
      break;
    case 'completed':
      updates.completedAt = now;
      break;
    case 'cancelled':
      updates.cancelledAt = now;
      break;
  }

  const [updated] = await db.update(bookings)
    .set(updates)
    .where(eq(bookings.id, bookingId))
    .returning();

  console.log(`[TestBypass] Updated booking ${bookingId} to status ${status}`);
  return updated;
}

/**
 * Create a review bypassing normal validations
 */
export async function createTestReview(data: {
  customerId: string;
  vendorId: string;
  serviceId: string;
  bookingId: string;
  rating: number;
  title?: string;
  comment?: string;
}): Promise<typeof reviews.$inferSelect> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  // Validate customer is a test user
  const [customer] = await db.select().from(users).where(eq(users.id, data.customerId)).limit(1);
  if (!customer || !customer.email || !isTestUser(customer.email)) {
    throw new Error('Only test users can use bypass operations');
  }

  const [review] = await db.insert(reviews)
    .values({
      userId: data.customerId,
      serviceId: data.serviceId,
      bookingId: data.bookingId,
      rating: data.rating,
      comment: data.comment || 'This is a test review created via bypass',
    })
    .returning();

  console.log(`[TestBypass] Created review ${review.id} with rating ${data.rating}`);
  return review;
}

/**
 * Create a tip bypassing payment processing
 */
export async function createTestTip(data: {
  customerId: string;
  vendorId: string;
  bookingId: string;
  amount: number;
  message?: string;
}): Promise<typeof tips.$inferSelect> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  // Validate customer is a test user
  const [customer] = await db.select().from(users).where(eq(users.id, data.customerId)).limit(1);
  if (!customer || !customer.email || !isTestUser(customer.email)) {
    throw new Error('Only test users can use bypass operations');
  }

  const [tip] = await db.insert(tips)
    .values({
      customerId: data.customerId,
      vendorId: data.vendorId,
      bookingId: data.bookingId,
      amount: data.amount.toString(),
      message: data.message || 'Test tip via bypass',
      paymentMethod: 'card',
      status: 'completed',
      completedAt: new Date(),
    })
    .returning();

  console.log(`[TestBypass] Created tip ${tip.id} for CHF ${data.amount}`);
  return tip;
}

/**
 * Create a notification bypassing normal triggers
 */
export async function createTestNotification(data: {
  userId: string;
  type: 'booking' | 'review' | 'message' | 'payment' | 'system' | 'tip' | 'referral' | 'service' | 'promotion';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}): Promise<typeof notifications.$inferSelect> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  const [notification] = await db.insert(notifications)
    .values({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      isRead: false,
    })
    .returning();

  console.log(`[TestBypass] Created notification ${notification.id} of type ${data.type}`);
  return notification;
}

/**
 * Create a dispute bypassing normal flow
 */
export async function createTestDispute(data: {
  bookingId: string;
  raisedBy: string;
  reason: string;
  amount?: number;
}): Promise<typeof escrowDisputes.$inferSelect> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  // Get the booking to find related escrow
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, data.bookingId)).limit(1);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Determine who is raising the dispute
  const raisedByUserId = data.raisedBy;
  const [raisingUser] = await db.select().from(users).where(eq(users.id, raisedByUserId)).limit(1);
  if (!raisingUser || !raisingUser.email || !isTestUser(raisingUser.email)) {
    throw new Error('Only test users can use bypass operations');
  }

  // Determine if customer or vendor
  const raisedByRole: 'customer' | 'vendor' =
    raisedByUserId === booking.customerId ? 'customer' : 'vendor';

  // Try to find or create escrow transaction
  let [escrow] = await db.select()
    .from(escrowTransactions)
    .where(eq(escrowTransactions.bookingId, data.bookingId))
    .limit(1);

  if (!escrow) {
    // Create a test escrow transaction with required fields
    const amount = (data.amount || 100).toString();
    const platformFee = (parseFloat(amount) * 0.10).toFixed(2); // 10% fee
    const vendorAmount = (parseFloat(amount) - parseFloat(platformFee)).toFixed(2);

    [escrow] = await db.insert(escrowTransactions)
      .values({
        bookingId: data.bookingId,
        amount: amount,
        platformFee: platformFee,
        vendorAmount: vendorAmount,
        paymentMethod: 'card',
        currency: 'CHF',
        status: 'held',
        heldAt: new Date(),
      })
      .returning();
  }

  // Cast reason to valid type
  const validReasons = ['service_not_provided', 'poor_quality', 'wrong_service', 'overcharged', 'no_show', 'other'] as const;
  const reason = validReasons.includes(data.reason as any) ? data.reason as typeof validReasons[number] : 'other';

  const [dispute] = await db.insert(escrowDisputes)
    .values({
      escrowTransactionId: escrow.id,
      bookingId: data.bookingId,
      raisedBy: raisedByRole,
      raisedByUserId: raisedByUserId,
      reason: reason,
      description: `Test dispute: ${data.reason}`,
      status: 'open',
    })
    .returning();

  console.log(`[TestBypass] Created dispute ${dispute.id} for booking ${data.bookingId}`);
  return dispute;
}

/**
 * Fast-forward a booking through all states
 */
export async function fastForwardBooking(
  bookingId: string,
  toState: 'accepted' | 'in_progress' | 'completed'
): Promise<typeof bookings.$inferSelect | null> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  const states = ['accepted', 'in_progress', 'completed'];
  const targetIndex = states.indexOf(toState);

  let current: typeof bookings.$inferSelect | null = null;

  for (let i = 0; i <= targetIndex; i++) {
    current = await updateTestBookingStatus(bookingId, states[i] as any);
  }

  return current;
}

/**
 * Create complete test scenario: service + booking + review
 */
export async function createCompleteTestScenario(data: {
  customerId: string;
  vendorId: string;
  serviceId: string;
  rating?: number;
}): Promise<{
  booking: typeof bookings.$inferSelect;
  review: typeof reviews.$inferSelect;
}> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test operations not available in production');
  }

  // Create completed booking
  const now = new Date();
  const booking = await createTestBooking({
    customerId: data.customerId,
    serviceId: data.serviceId,
    startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'completed',
    message: 'Test scenario booking',
  });

  // Create review
  const review = await createTestReview({
    customerId: data.customerId,
    vendorId: data.vendorId,
    serviceId: data.serviceId,
    bookingId: booking.id,
    rating: data.rating || 5,
    title: 'Test Scenario Review',
    comment: 'Created via test scenario bypass',
  });

  return { booking, review };
}
