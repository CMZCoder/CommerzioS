/**
 * Test Bypass Helper
 * 
 * Provides secure bypass functionality for E2E tests to create test data
 * that bypasses normal business rules (like 24-hour booking notice).
 * 
 * SECURITY:
 * - Only works with @commerzio.test email domains
 * - Requires cryptographically signed tokens
 * - Tokens expire after 5 minutes
 * - Only works in non-production environments
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

/**
 * Get a test bypass token for an action
 */
export async function getBypassToken(email: string, action: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/test/bypass/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, action }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to get bypass token: ${error.message || response.statusText}`);
  }

  const { token } = await response.json();
  return token;
}

/**
 * Create a booking bypassing time restrictions
 */
export async function createBypassBooking(
  customerEmail: string,
  serviceId: string,
  options?: {
    status?: 'pending' | 'accepted' | 'completed';
    startTime?: Date;
    endTime?: Date;
    message?: string;
  }
): Promise<{ booking: any }> {
  const token = await getBypassToken(customerEmail, 'create-booking');
  
  const now = new Date();
  const startTime = options?.startTime || new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default: tomorrow
  const endTime = options?.endTime || new Date(startTime.getTime() + 60 * 60 * 1000); // Default: 1 hour after start

  const response = await fetch(`${BASE_URL}/api/test/bypass/booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({
      serviceId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: options?.status || 'pending',
      message: options?.message || 'E2E Test Booking',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create bypass booking: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Update booking status bypassing normal flow
 */
export async function updateBypassBookingStatus(
  customerEmail: string,
  bookingId: string,
  status: 'pending' | 'accepted' | 'completed' | 'cancelled'
): Promise<{ booking: any }> {
  const token = await getBypassToken(customerEmail, 'update-booking');

  const response = await fetch(`${BASE_URL}/api/test/bypass/booking/${bookingId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to update booking status: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Fast-forward a booking through states
 */
export async function fastForwardBooking(
  customerEmail: string,
  bookingId: string,
  toState: 'accepted' | 'in_progress' | 'completed'
): Promise<{ booking: any }> {
  const token = await getBypassToken(customerEmail, 'fast-forward');

  const response = await fetch(`${BASE_URL}/api/test/bypass/booking/${bookingId}/fast-forward`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({ toState }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to fast-forward booking: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a review bypassing validations
 */
export async function createBypassReview(
  customerEmail: string,
  vendorId: string,
  serviceId: string,
  bookingId: string,
  options?: {
    rating?: number;
    comment?: string;
  }
): Promise<{ review: any }> {
  const token = await getBypassToken(customerEmail, 'create-review');

  const response = await fetch(`${BASE_URL}/api/test/bypass/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({
      vendorId,
      serviceId,
      bookingId,
      rating: options?.rating || 5,
      comment: options?.comment || 'E2E Test Review',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create bypass review: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a tip bypassing payment processing
 */
export async function createBypassTip(
  customerEmail: string,
  vendorId: string,
  bookingId: string,
  options?: {
    amount?: number;
    message?: string;
  }
): Promise<{ tip: any }> {
  const token = await getBypassToken(customerEmail, 'create-tip');

  const response = await fetch(`${BASE_URL}/api/test/bypass/tip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({
      vendorId,
      bookingId,
      amount: options?.amount || 10,
      message: options?.message || 'E2E Test Tip',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create bypass tip: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a notification directly
 */
export async function createBypassNotification(
  userEmail: string,
  options: {
    type: 'booking' | 'review' | 'message' | 'payment' | 'system' | 'tip';
    title: string;
    message: string;
    actionUrl?: string;
    metadata?: Record<string, any>;
  }
): Promise<{ notification: any }> {
  const token = await getBypassToken(userEmail, 'create-notification');

  const response = await fetch(`${BASE_URL}/api/test/bypass/notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create bypass notification: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a dispute bypassing normal flow
 */
export async function createBypassDispute(
  userEmail: string,
  bookingId: string,
  options?: {
    reason?: string;
    amount?: number;
  }
): Promise<{ dispute: any }> {
  const token = await getBypassToken(userEmail, 'create-dispute');

  const response = await fetch(`${BASE_URL}/api/test/bypass/dispute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({
      bookingId,
      reason: options?.reason || 'service_not_provided',
      amount: options?.amount,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create bypass dispute: ${error.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Create a complete test scenario: completed booking + review
 * Useful for tests that need a fully set up booking/review state
 */
export async function createCompleteScenario(
  customerEmail: string,
  vendorId: string,
  serviceId: string,
  options?: {
    rating?: number;
  }
): Promise<{ booking: any; review: any }> {
  const token = await getBypassToken(customerEmail, 'create-scenario');

  const response = await fetch(`${BASE_URL}/api/test/bypass/scenario`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Test-Bypass-Token': token,
    },
    body: JSON.stringify({
      vendorId,
      serviceId,
      rating: options?.rating || 5,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Failed to create complete scenario: ${error.message || response.statusText}`);
  }

  return response.json();
}
