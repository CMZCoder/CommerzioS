import { Page } from '@playwright/test';

/**
 * Database fixture utilities for E2E tests
 * Provides seeding and cleanup functionality for test isolation
 */

/**
 * API helper to interact with test database endpoints
 * Note: These endpoints should only be available in test/development environments
 */
const TEST_API_BASE = '/api/test';

/**
 * Seed database with test data via API
 * This calls a test-only API endpoint that populates the database
 */
export async function seedDatabase(page: Page): Promise<void> {
  const response = await page.request.post(`${TEST_API_BASE}/seed`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok()) {
    console.warn('Database seeding failed or endpoint not available');
  }
}

/**
 * Clean up test data from database
 * This removes test data created during test runs
 */
export async function cleanupDatabase(page: Page): Promise<void> {
  const response = await page.request.post(`${TEST_API_BASE}/cleanup`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok()) {
    console.warn('Database cleanup failed or endpoint not available');
  }
}

/**
 * Reset database to known state
 * Combines cleanup and seeding
 */
export async function resetDatabase(page: Page): Promise<void> {
  await cleanupDatabase(page);
  await seedDatabase(page);
}

/**
 * Create a test user via API
 */
export async function createTestUser(
  page: Page,
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'customer' | 'vendor' | 'admin';
  }
): Promise<{ id: number; email: string } | null> {
  const response = await page.request.post(`${TEST_API_BASE}/users`, {
    data: userData,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.ok()) {
    return response.json();
  }
  
  console.warn('Failed to create test user');
  return null;
}

/**
 * Delete a test user via API
 */
export async function deleteTestUser(page: Page, userId: number): Promise<boolean> {
  const response = await page.request.delete(`${TEST_API_BASE}/users/${userId}`);
  return response.ok();
}

/**
 * Create a test service via API
 */
export async function createTestService(
  page: Page,
  serviceData: {
    title: string;
    description: string;
    vendorId: number;
    category: string;
    pricing: object;
  }
): Promise<{ id: number; title: string } | null> {
  const response = await page.request.post(`${TEST_API_BASE}/services`, {
    data: serviceData,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.ok()) {
    return response.json();
  }
  
  console.warn('Failed to create test service');
  return null;
}

/**
 * Delete a test service via API
 */
export async function deleteTestService(page: Page, serviceId: number): Promise<boolean> {
  const response = await page.request.delete(`${TEST_API_BASE}/services/${serviceId}`);
  return response.ok();
}

/**
 * Create a test booking via API
 */
export async function createTestBooking(
  page: Page,
  bookingData: {
    serviceId: number;
    customerId: number;
    date: string;
    time: string;
    status?: string;
  }
): Promise<{ id: number } | null> {
  const response = await page.request.post(`${TEST_API_BASE}/bookings`, {
    data: bookingData,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.ok()) {
    return response.json();
  }
  
  console.warn('Failed to create test booking');
  return null;
}

/**
 * Delete a test booking via API
 */
export async function deleteTestBooking(page: Page, bookingId: number): Promise<boolean> {
  const response = await page.request.delete(`${TEST_API_BASE}/bookings/${bookingId}`);
  return response.ok();
}

/**
 * Update test booking status via API
 */
export async function updateBookingStatus(
  page: Page,
  bookingId: number,
  status: string
): Promise<boolean> {
  const response = await page.request.patch(`${TEST_API_BASE}/bookings/${bookingId}`, {
    data: { status },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.ok();
}

/**
 * Create a test conversation via API
 */
export async function createTestConversation(
  page: Page,
  conversationData: {
    participantIds: number[];
    bookingId?: number;
  }
): Promise<{ id: number } | null> {
  const response = await page.request.post(`${TEST_API_BASE}/conversations`, {
    data: conversationData,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (response.ok()) {
    return response.json();
  }
  
  console.warn('Failed to create test conversation');
  return null;
}

/**
 * Simulate time passing for scheduled tasks (e.g., escrow auto-release)
 * This is useful for testing time-based functionality
 */
export async function simulateTimePassing(
  page: Page,
  hours: number
): Promise<boolean> {
  const response = await page.request.post(`${TEST_API_BASE}/time/advance`, {
    data: { hours },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return response.ok();
}

/**
 * Get test data summary (useful for debugging)
 */
export async function getTestDataSummary(page: Page): Promise<object | null> {
  const response = await page.request.get(`${TEST_API_BASE}/summary`);
  
  if (response.ok()) {
    return response.json();
  }
  
  return null;
}
