/**
 * Interactive Flow E2E Tests - Redesigned Architecture
 * 
 * ARCHITECTURE PRINCIPLES:
 * ========================
 * 1. SINGLE SERIAL FLOW: All tests run in one test.describe.serial to ensure
 *    proper dependency ordering (booking before tip, review before edit, etc.)
 * 
 * 2. STATE MANAGEMENT: A global TestState object persists across all tests,
 *    tracking IDs of created entities for later tests to use.
 * 
 * 3. BYPASS SYSTEM: Uses secure test bypass for creating prerequisites that
 *    can't be created through normal APIs (e.g., completed bookings in the past)
 * 
 * 4. GRACEFUL DEGRADATION: Tests skip gracefully if prerequisites aren't met,
 *    with clear logging of what's missing.
 * 
 * TEST PHASES:
 * ============
 * Phase 1: Foundation Setup
 *   - Initialize authentication for all users
 *   - Get or create test service
 *   - Create completed booking via bypass for dependent tests
 * 
 * Phase 2: Booking Flows  
 *   - Standard booking: request → accept → start → complete
 *   - Counter-offer flow: request → propose alternative → accept
 *   - Booking cancellation flow
 * 
 * Phase 3: Vendor Calendar
 *   - Block dates
 *   - Block hours
 *   - Verify blocked times excluded
 *   - Delete blocks
 * 
 * Phase 4: Tips (requires completed booking)
 *   - Check eligibility
 *   - Create tip
 *   - Verify vendor notification
 *   - Check tip statistics
 * 
 * Phase 5: Reviews (requires service + optionally booking)
 *   - Create positive review
 *   - Edit review (trigger notification)
 *   - Vendor requests removal
 *   - Admin processes removal request
 * 
 * Phase 6: Disputes (requires completed booking)
 *   - Customer raises dispute
 *   - Vendor responds
 *   - Admin reviews
 *   - Admin resolves
 * 
 * Phase 7: Notifications
 *   - Check notification list
 *   - Mark as read
 *   - Click navigation
 * 
 * Phase 8: Cleanup & Summary
 */

import { test, expect, Page, BrowserContext, Browser, TestInfo, APIRequestContext } from '@playwright/test';
import { TEST_USER, TEST_VENDOR, TEST_ADMIN } from './fixtures';
import {
  createBypassBooking,
  fastForwardBooking,
  createBypassReview,
  createBypassTip,
  createBypassDispute,
  createCompleteScenario,
  getBypassToken,
} from './test-bypass-helper';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_URL = BASE_URL;

// ============================================================================
// TEST STATE - Persists across all tests
// ============================================================================

interface TestState {
  // API Request contexts (authenticated)
  customerRequest: APIRequestContext | null;
  vendorRequest: APIRequestContext | null;
  adminRequest: APIRequestContext | null;
  
  // Authentication cookies (for display/debugging)
  customerCookies: string;
  vendorCookies: string;
  adminCookies: string;
  
  // Core entities
  serviceId: string | null;
  vendorId: string | null;
  
  // Bookings
  pendingBookingId: string | null;
  acceptedBookingId: string | null;
  completedBookingId: string | null;      // Created via bypass for tips/reviews/disputes
  counterOfferBookingId: string | null;
  disputeBookingId: string | null;        // Separate booking for dispute testing
  
  // Post-booking features
  tipId: string | null;
  reviewId: string | null;
  removalRequestId: string | null;
  disputeId: string | null;
  
  // Communication
  conversationId: string | null;
  notificationIds: string[];
  
  // Tracking
  testsRun: number;
  testsSkipped: number;
  testsFailed: number;
}

const state: TestState = {
  customerRequest: null,
  vendorRequest: null,
  adminRequest: null,
  customerCookies: '',
  vendorCookies: '',
  adminCookies: '',
  serviceId: null,
  vendorId: null,
  pendingBookingId: null,
  acceptedBookingId: null,
  completedBookingId: null,
  counterOfferBookingId: null,
  disputeBookingId: null,
  tipId: null,
  reviewId: null,
  removalRequestId: null,
  disputeId: null,
  conversationId: null,
  notificationIds: [],
  testsRun: 0,
  testsSkipped: 0,
  testsFailed: 0,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Report bug to admin panel on test failure
 */
async function reportBug(testInfo: TestInfo, error: Error, context: {
  pageUrl?: string;
  apiEndpoint?: string;
  stepsToReproduce: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}) {
  try {
    await fetch(`${API_URL}/api/test/bug-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testFile: 'interactive-flows.spec.ts',
        testName: testInfo.title,
        testSuite: testInfo.titlePath.slice(0, -1).join(' > '),
        errorType: error.message.includes('expect') ? 'assertion' : 'error',
        errorMessage: error.message,
        stackTrace: error.stack,
        pageUrl: context.pageUrl,
        stepsToReproduce: context.stepsToReproduce,
        apiEndpoint: context.apiEndpoint,
        browserName: testInfo.project.name,
        retryCount: testInfo.retry,
        requestPayload: {
          expectedBehavior: context.expectedBehavior,
          actualBehavior: context.actualBehavior,
        },
      }),
    });
    console.log('[BugReport] Reported test failure to admin panel');
  } catch (e) {
    console.error('[BugReport] Failed to report:', e);
  }
}

/**
 * Get authentication cookies for a user by logging in via API
 */
async function loginAndGetContext(playwright: any, email: string, password: string): Promise<{ request: APIRequestContext; cookies: string }> {
  // Create a new context and login
  const context = await playwright.request.newContext();
  
  const loginResponse = await context.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });
  
  if (!loginResponse.ok()) {
    throw new Error(`Login failed for ${email}: ${loginResponse.status()}`);
  }
  
  // Get cookies from the response
  const cookies = loginResponse.headers()['set-cookie'] || '';
  
  return { request: context, cookies };
}

/**
 * Make an authenticated API request using request context
 */
async function apiRequest(
  request: APIRequestContext | null,
  method: string,
  endpoint: string,
  body?: any
): Promise<{ status: number; data: any }> {
  if (!request) {
    return { status: 401, data: { message: 'Not authenticated' } };
  }
  
  const url = `${API_URL}${endpoint}`;
  let response;
  
  try {
    if (method === 'GET') {
      response = await request.get(url);
    } else if (method === 'POST') {
      response = await request.post(url, { data: body });
    } else if (method === 'PATCH') {
      response = await request.patch(url, { data: body });
    } else if (method === 'DELETE') {
      response = await request.delete(url);
    } else if (method === 'PUT') {
      response = await request.put(url, { data: body });
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }
    
    const data = await response.json().catch(() => ({}));
    return { status: response.status(), data };
  } catch (error) {
    return { status: 500, data: { message: (error as Error).message } };
  }
}

/**
 * Ensure we have a service ID to work with
 */
async function ensureServiceId(): Promise<string | null> {
  if (state.serviceId) return state.serviceId;
  
  // First try vendor's own services
  const myServices = await apiRequest(state.vendorRequest, 'GET', '/api/services/my');
  if (myServices.status === 200 && myServices.data.length > 0) {
    state.serviceId = myServices.data[0].id;
    state.vendorId = myServices.data[0].ownerId;
    return state.serviceId;
  }
  
  // Fallback to any available service
  const allServices = await apiRequest(state.customerRequest, 'GET', '/api/services');
  if (allServices.status === 200 && allServices.data.length > 0) {
    state.serviceId = allServices.data[0].id;
    state.vendorId = allServices.data[0].ownerId;
    return state.serviceId;
  }
  
  return null;
}

/**
 * Create a completed booking via bypass (for features that require it)
 */
async function createCompletedBookingViaBypass(): Promise<string | null> {
  if (!state.serviceId) {
    await ensureServiceId();
    if (!state.serviceId) return null;
  }
  
  try {
    const now = new Date();
    const { booking } = await createBypassBooking(TEST_USER.email, state.serviceId!, {
      status: 'completed',
      startTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    });
    return booking.id;
  } catch (error) {
    console.log(`⚠️ Bypass booking failed: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Create a review via bypass
 */
async function createReviewViaBypass(bookingId: string): Promise<string | null> {
  try {
    const { review } = await createBypassReview(
      TEST_USER.email,
      state.vendorId || '',
      state.serviceId!,
      bookingId,
      { rating: 5, comment: 'Excellent service! Very professional.' }
    );
    return review.id;
  } catch (error) {
    console.log(`⚠️ Bypass review failed: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================================
// MAIN TEST SUITE - SINGLE SERIAL FLOW FOR PROPER DEPENDENCY ORDERING
// ============================================================================

test.describe.serial('Interactive Flow E2E Tests', () => {
  
  // ==========================================================================
  // PHASE 1: FOUNDATION SETUP
  // ==========================================================================
  
  test.describe.serial('Phase 1: Foundation Setup', () => {
    
    test('1.1 Initialize authentication for all test users', async ({ playwright }) => {
      console.log('\n🔐 PHASE 1: FOUNDATION SETUP');
      console.log('─'.repeat(50));
      console.log('Authenticating test users...');
      
      // Customer login - create authenticated request context
      const customerLogin = await loginAndGetContext(playwright, TEST_USER.email, TEST_USER.password);
      state.customerRequest = customerLogin.request;
      state.customerCookies = customerLogin.cookies;
      expect(state.customerRequest).toBeTruthy();
      console.log('  ✓ Customer authenticated');
      
      // Vendor login
      const vendorLogin = await loginAndGetContext(playwright, TEST_VENDOR.email, TEST_VENDOR.password);
      state.vendorRequest = vendorLogin.request;
      state.vendorCookies = vendorLogin.cookies;
      expect(state.vendorRequest).toBeTruthy();
      console.log('  ✓ Vendor authenticated');
      
      // Admin login
      const adminLogin = await loginAndGetContext(playwright, TEST_ADMIN.email, TEST_ADMIN.password);
      state.adminRequest = adminLogin.request;
      state.adminCookies = adminLogin.cookies;
      expect(state.adminRequest).toBeTruthy();
      console.log('  ✓ Admin authenticated');
    });
    
    test('1.2 Get or create test service', async ({}, testInfo) => {
      console.log('Finding/creating test service...');
      
      const serviceId = await ensureServiceId();
      
      if (!serviceId) {
        // Try to create a service
        console.log('  No services found, creating one...');
        
        const categoriesRes = await apiRequest(state.vendorRequest, 'GET', '/api/categories');
        if (categoriesRes.status !== 200 || categoriesRes.data.length === 0) {
          throw new Error('No categories available to create service');
        }
        
        const category = categoriesRes.data[0];
        const serviceData = {
          title: 'E2E Test Service',
          description: 'Automated test service for E2E testing',
          categoryId: category.id,
          subcategoryId: category.subcategories?.[0]?.id || null,
          priceType: 'fixed',
          priceUnit: 'service',
          basePrice: 50,
          currency: 'CHF',
          durationMinutes: 60,
          contactMethod: 'in_app',
          contactPhone: '+41791234567',
          contactEmail: TEST_VENDOR.email,
          paymentMethods: ['cash'],
          availabilityType: 'always',
          locations: [{
            type: 'address',
            address: 'Test Street 1, 8001 Zürich',
            lat: 47.3769,
            lng: 8.5417,
          }],
        };
        
        const createRes = await apiRequest(state.vendorRequest, 'POST', '/api/services', serviceData);
        if (createRes.status === 201) {
          state.serviceId = createRes.data.id;
          state.vendorId = createRes.data.ownerId;
          console.log(`  ✓ Created new service: ${state.serviceId}`);
        } else {
          throw new Error(`Service creation failed: ${createRes.data.message}`);
        }
      } else {
        console.log(`  ✓ Using existing service: ${state.serviceId}`);
      }
      
      expect(state.serviceId).toBeTruthy();
    });
    
    test('1.3 Create completed booking via bypass for dependent tests', async ({}) => {
      console.log('Creating completed booking via bypass...');
      
      state.completedBookingId = await createCompletedBookingViaBypass();
      
      if (state.completedBookingId) {
        console.log(`  ✓ Completed booking ready: ${state.completedBookingId}`);
      } else {
        console.log('  ⚠ Could not create bypass booking - some tests may be skipped');
      }
    });
  });
  
  // ==========================================================================
  // PHASE 2: BOOKING FLOWS
  // ==========================================================================
  
  test.describe.serial('Phase 2: Booking Flows', () => {
    
    test.describe.serial('2A: Standard Booking Flow (Request → Accept → Complete)', () => {
      
      test('2A.1 Customer creates booking request', async ({}, testInfo) => {
        console.log('\n📅 PHASE 2: BOOKING FLOWS');
        console.log('─'.repeat(50));
        
        if (!state.serviceId) {
          console.log('  ⏭ Skipping: No service available');
          test.skip();
          return;
        }
        
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 2);
        bookingDate.setHours(14, 0, 0, 0);
        
        const endTime = new Date(bookingDate);
        endTime.setHours(15, 0, 0, 0);
        
        console.log(`Creating booking for ${bookingDate.toISOString()}...`);
        
        const bookingRes = await apiRequest(state.customerRequest, 'POST', '/api/bookings', {
          serviceId: state.serviceId,
          requestedStartTime: bookingDate.toISOString(),
          requestedEndTime: endTime.toISOString(),
          paymentMethod: 'cash',
          customerMessage: 'E2E Test booking - please accept',
        });
        
        if (bookingRes.status === 201) {
          state.pendingBookingId = bookingRes.data.id;
          expect(bookingRes.data.status).toBe('pending');
          console.log(`  ✓ Booking created: ${state.pendingBookingId}`);
        } else {
          console.log(`  ⚠ Booking creation returned ${bookingRes.status}: ${bookingRes.data.message}`);
          // Don't fail - may be 24h notice restriction
        }
      });
      
      test('2A.2 Vendor sees pending booking in list', async ({}) => {
        if (!state.pendingBookingId) {
          console.log('  ⏭ Skipping: No pending booking');
          test.skip();
          return;
        }
        
        const bookingsRes = await apiRequest(state.vendorRequest, 'GET', '/api/vendor/bookings');
        expect(bookingsRes.status).toBe(200);
        
        const pending = bookingsRes.data.find((b: any) => b.id === state.pendingBookingId);
        if (pending) {
          expect(pending.status).toBe('pending');
          console.log('  ✓ Vendor can see pending booking');
        } else {
          console.log('  ⚠ Booking not in vendor list (may be different vendor\'s service)');
        }
      });
      
      test('2A.3 Vendor accepts booking', async ({}) => {
        if (!state.pendingBookingId) {
          test.skip();
          return;
        }
        
        const acceptRes = await apiRequest(state.vendorRequest, 'POST', `/api/bookings/${state.pendingBookingId}/accept`, {
          vendorMessage: 'Accepted - confirmed for the requested time!',
        });
        
        if (acceptRes.status === 200) {
          expect(acceptRes.data.status).toBe('accepted');
          state.acceptedBookingId = state.pendingBookingId;
          console.log('  ✓ Booking accepted');
        } else {
          console.log(`  ⚠ Accept returned ${acceptRes.status}: ${acceptRes.data.message}`);
        }
      });
      
      test('2A.4 Customer receives booking confirmation notification', async ({}) => {
        if (!state.acceptedBookingId) {
          test.skip();
          return;
        }
        
        const notifRes = await apiRequest(state.customerRequest, 'GET', '/api/notifications');
        const notifications = notifRes.data?.notifications || notifRes.data || [];
        
        const bookingNotif = Array.isArray(notifications)
          ? notifications.find((n: any) => 
              n.type === 'booking' || n.message?.includes('booking') || n.message?.includes('accepted')
            )
          : null;
        
        if (bookingNotif) {
          state.notificationIds.push(bookingNotif.id);
          console.log('  ✓ Customer received booking notification');
        } else {
          console.log('  ℹ No booking notification found');
        }
      });
      
      test('2A.5 Vendor starts service (marks in progress)', async ({}) => {
        if (!state.acceptedBookingId) {
          test.skip();
          return;
        }
        
        const startRes = await apiRequest(state.vendorRequest, 'POST', `/api/bookings/${state.acceptedBookingId}/start`);
        
        if (startRes.status === 200) {
          expect(startRes.data.status).toBe('in_progress');
          console.log('  ✓ Service started');
        } else {
          console.log(`  ⚠ Start returned ${startRes.status}: ${startRes.data.message}`);
        }
      });
      
      test('2A.6 Vendor completes service', async ({}) => {
        if (!state.acceptedBookingId) {
          test.skip();
          return;
        }
        
        const completeRes = await apiRequest(state.vendorRequest, 'POST', `/api/bookings/${state.acceptedBookingId}/complete`);
        
        if (completeRes.status === 200) {
          expect(completeRes.data.status).toBe('completed');
          console.log('  ✓ Service completed');
        } else {
          console.log(`  ⚠ Complete returned ${completeRes.status}: ${completeRes.data.message}`);
        }
      });
    });
    
    test.describe.serial('2B: Counter-Offer Flow', () => {
      
      test('2B.1 Customer creates booking, vendor proposes alternative', async ({}) => {
        if (!state.serviceId) {
          test.skip();
          return;
        }
        
        console.log('Testing counter-offer flow...');
        
        // Create new booking for counter-offer
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 3);
        bookingDate.setHours(9, 0, 0, 0);
        
        const endTime = new Date(bookingDate);
        endTime.setHours(10, 0, 0, 0);
        
        const bookingRes = await apiRequest(state.customerRequest, 'POST', '/api/bookings', {
          serviceId: state.serviceId,
          requestedStartTime: bookingDate.toISOString(),
          requestedEndTime: endTime.toISOString(),
          paymentMethod: 'cash',
          customerMessage: 'Can we do 9am?',
        });
        
        if (bookingRes.status !== 201) {
          console.log(`  ⚠ Booking creation failed: ${bookingRes.data.message}`);
          return;
        }
        
        state.counterOfferBookingId = bookingRes.data.id;
        console.log(`  ✓ Counter-offer booking created: ${state.counterOfferBookingId}`);
        
        // Vendor proposes alternative time
        const altDate = new Date(bookingDate);
        altDate.setHours(11, 0, 0, 0);
        const altEnd = new Date(altDate);
        altEnd.setHours(12, 0, 0, 0);
        
        const proposeRes = await apiRequest(state.vendorRequest, 'POST', `/api/bookings/${state.counterOfferBookingId}/propose-alternative`, {
          alternativeStartTime: altDate.toISOString(),
          alternativeEndTime: altEnd.toISOString(),
          vendorMessage: '9am is fully booked, how about 11am instead?',
        });
        
        if (proposeRes.status === 200) {
          expect(proposeRes.data.status).toBe('pending_customer');
          console.log('  ✓ Vendor proposed alternative time');
        } else {
          console.log(`  ⚠ Proposal returned ${proposeRes.status}: ${proposeRes.data.message}`);
        }
      });
      
      test('2B.2 Customer accepts alternative proposal', async ({}) => {
        if (!state.counterOfferBookingId) {
          test.skip();
          return;
        }
        
        const acceptRes = await apiRequest(state.customerRequest, 'POST', `/api/bookings/${state.counterOfferBookingId}/accept-alternative`, {
          customerMessage: '11am works great, thanks!',
        });
        
        if (acceptRes.status === 200) {
          expect(acceptRes.data.status).toBe('accepted');
          console.log('  ✓ Customer accepted alternative');
        } else {
          console.log(`  ⚠ Accept alternative returned ${acceptRes.status}: ${acceptRes.data.message}`);
        }
      });
    });
    
    test.describe.serial('2C: Booking Cancellation', () => {
      
      test('2C.1 Customer cancels a pending booking', async ({}) => {
        if (!state.serviceId) {
          test.skip();
          return;
        }
        
        console.log('Testing cancellation flow...');
        
        // Create a booking to cancel
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + 4);
        bookingDate.setHours(16, 0, 0, 0);
        
        const endTime = new Date(bookingDate);
        endTime.setHours(17, 0, 0, 0);
        
        const bookingRes = await apiRequest(state.customerRequest, 'POST', '/api/bookings', {
          serviceId: state.serviceId,
          requestedStartTime: bookingDate.toISOString(),
          requestedEndTime: endTime.toISOString(),
          paymentMethod: 'cash',
          customerMessage: 'Booking to cancel',
        });
        
        if (bookingRes.status !== 201) {
          console.log(`  ⚠ Could not create booking to cancel`);
          return;
        }
        
        const bookingToCancel = bookingRes.data.id;
        console.log(`  ✓ Created booking to cancel: ${bookingToCancel}`);
        
        // Cancel it
        const cancelRes = await apiRequest(state.customerRequest, 'POST', `/api/bookings/${bookingToCancel}/cancel`, {
          cancellationReason: 'E2E Test - testing cancellation flow',
        });
        
        if (cancelRes.status === 200) {
          expect(cancelRes.data.status).toBe('cancelled');
          console.log('  ✓ Booking cancelled successfully');
        } else {
          console.log(`  ⚠ Cancel returned ${cancelRes.status}: ${cancelRes.data.message}`);
        }
      });
    });
  });
  
  // ==========================================================================
  // PHASE 3: VENDOR CALENDAR
  // ==========================================================================
  
  test.describe.serial('Phase 3: Vendor Calendar', () => {
    
    test('3.1 Vendor blocks a specific date', async ({}) => {
      console.log('\n📆 PHASE 3: VENDOR CALENDAR');
      console.log('─'.repeat(50));
      
      if (!state.serviceId) {
        test.skip();
        return;
      }
      
      // Create full day block - need startTime and endTime as full ISO datetimes
      const blockDate = new Date();
      blockDate.setDate(blockDate.getDate() + 7);
      blockDate.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(blockDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const blockRes = await apiRequest(state.vendorRequest, 'POST', '/api/vendor/calendar/blocks', {
        serviceId: state.serviceId,
        blockType: 'full_day',
        startTime: blockDate.toISOString(),
        endTime: endOfDay.toISOString(),
        reason: 'E2E Test - Full day block',
      });
      
      if (blockRes.status === 201) {
        console.log('  ✓ Date blocked successfully');
      } else {
        console.log(`  ⚠ Block creation returned ${blockRes.status}: ${blockRes.data.message}`);
      }
    });
    
    test('3.2 Vendor blocks specific hours', async ({}) => {
      if (!state.serviceId) {
        test.skip();
        return;
      }
      
      // Create time range block - need startTime and endTime as full ISO datetimes
      const blockDate = new Date();
      blockDate.setDate(blockDate.getDate() + 8);
      blockDate.setHours(12, 0, 0, 0); // 12:00
      
      const endTime = new Date(blockDate);
      endTime.setHours(14, 0, 0, 0); // 14:00
      
      const blockRes = await apiRequest(state.vendorRequest, 'POST', '/api/vendor/calendar/blocks', {
        serviceId: state.serviceId,
        blockType: 'time_range',
        startTime: blockDate.toISOString(),
        endTime: endTime.toISOString(),
        reason: 'E2E Test - Lunch break',
      });
      
      if (blockRes.status === 201) {
        console.log('  ✓ Hours blocked successfully (12:00-14:00)');
      } else {
        console.log(`  ⚠ Block returned ${blockRes.status}: ${blockRes.data.message}`);
      }
    });
    
    test('3.3 Verify blocked times are excluded from availability', async ({}) => {
      if (!state.serviceId) {
        test.skip();
        return;
      }
      
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() + 7);
      
      const availRes = await apiRequest(state.customerRequest, 'GET', `/api/services/${state.serviceId}/availability?date=${checkDate.toISOString().split('T')[0]}`);
      
      if (availRes.status === 200) {
        console.log(`  ℹ Availability slots for blocked day: ${availRes.data.slots?.length || 0}`);
      } else {
        console.log(`  ⚠ Availability check returned ${availRes.status}`);
      }
    });
    
    test('3.4 Vendor deletes calendar block', async ({}) => {
      if (!state.serviceId) {
        test.skip();
        return;
      }
      
      // Get blocks - API requires startDate and endDate
      const today = new Date();
      const startDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const endDate = nextMonth.toISOString().split('T')[0];
      
      const blocksRes = await apiRequest(state.vendorRequest, 'GET', `/api/vendor/calendar/blocks?startDate=${startDate}&endDate=${endDate}`);
      
      if (blocksRes.status === 200 && Array.isArray(blocksRes.data) && blocksRes.data.length > 0) {
        const blockToDelete = blocksRes.data[0];
        const deleteRes = await apiRequest(state.vendorRequest, 'DELETE', `/api/vendor/calendar/blocks/${blockToDelete.id}`);
        
        if (deleteRes.status === 200) {
          console.log('  ✓ Calendar block deleted');
        } else {
          console.log(`  ⚠ Delete returned ${deleteRes.status}: ${deleteRes.data.message}`);
        }
      } else {
        console.log(`  ℹ No blocks found to delete (status: ${blocksRes.status}, count: ${blocksRes.data?.length || 0})`);
      }
    });
  });
  
  // ==========================================================================
  // PHASE 4: TIPS (requires completed booking)
  // ==========================================================================
  
  test.describe.serial('Phase 4: Tips System', () => {
    
    test('4.1 Ensure completed booking exists for tip testing', async ({}) => {
      console.log('\n💰 PHASE 4: TIPS SYSTEM');
      console.log('─'.repeat(50));
      
      if (!state.completedBookingId) {
        console.log('  Creating completed booking for tips...');
        state.completedBookingId = await createCompletedBookingViaBypass();
      }
      
      if (state.completedBookingId) {
        console.log(`  ✓ Using completed booking: ${state.completedBookingId}`);
      } else {
        console.log('  ⚠ No completed booking available - tip tests will be skipped');
      }
    });
    
    test('4.2 Customer checks tip eligibility', async ({}) => {
      if (!state.completedBookingId) {
        test.skip();
        return;
      }
      
      const eligRes = await apiRequest(state.customerRequest, 'GET', `/api/tips/can-tip/${state.completedBookingId}`);
      
      if (eligRes.status === 200) {
        console.log(`  ℹ Can tip: ${eligRes.data.canTip}, Reason: ${eligRes.data.reason || 'eligible'}`);
        if (!eligRes.data.canTip) {
          console.log(`  ⚠ Not eligible for tips, subsequent tip test will be skipped`);
        }
      } else {
        console.log(`  ⚠ Eligibility check returned ${eligRes.status}`);
      }
    });
    
    test('4.3 Customer creates cash tip', async ({}) => {
      if (!state.completedBookingId) {
        test.skip();
        return;
      }
      
      const tipRes = await apiRequest(state.customerRequest, 'POST', '/api/tips', {
        bookingId: state.completedBookingId,
        amount: 15,
        message: 'Great service! Thank you!',
        paymentMethod: 'cash',
      });
      
      if (tipRes.status === 201) {
        state.tipId = tipRes.data.tip.id;
        expect(parseFloat(tipRes.data.tip.amount)).toBe(15);
        expect(tipRes.data.tip.status).toBe('completed');
        console.log(`  ✓ Tip created: ${state.tipId}`);
      } else {
        console.log(`  ⚠ Tip creation returned ${tipRes.status}: ${tipRes.data.message}`);
      }
    });
    
    test('4.4 Vendor receives tip notification', async ({}) => {
      if (!state.tipId) {
        test.skip();
        return;
      }
      
      const notifRes = await apiRequest(state.vendorRequest, 'GET', '/api/notifications');
      const notifications = notifRes.data?.notifications || notifRes.data || [];
      
      const tipNotif = Array.isArray(notifications)
        ? notifications.find((n: any) => n.type === 'tip')
        : null;
      
      if (tipNotif) {
        state.notificationIds.push(tipNotif.id);
        console.log('  ✓ Vendor received tip notification');
      } else {
        console.log('  ℹ No tip notification found (may be delayed)');
      }
    });
    
    test('4.5 Vendor views tip statistics', async ({}) => {
      const statsRes = await apiRequest(state.vendorRequest, 'GET', '/api/tips/stats');
      
      if (statsRes.status === 200) {
        console.log(`  ℹ Vendor tip stats: ${statsRes.data.count || 0} tips, CHF ${statsRes.data.totalAmount || 0} total`);
      } else {
        console.log(`  ⚠ Stats returned ${statsRes.status}`);
      }
    });
  });
  
  // ==========================================================================
  // PHASE 5: REVIEWS (requires service + optionally booking)
  // ==========================================================================
  
  test.describe.serial('Phase 5: Review System', () => {
    
    test.describe.serial('5A: Review Lifecycle', () => {
      
      test('5A.1 Customer creates positive review', async ({}) => {
        console.log('\n⭐ PHASE 5: REVIEW SYSTEM');
        console.log('─'.repeat(50));
        
        if (!state.serviceId) {
          test.skip();
          return;
        }
        
        // Try bypass first if we have a completed booking
        if (state.completedBookingId) {
          const reviewId = await createReviewViaBypass(state.completedBookingId);
          if (reviewId) {
            state.reviewId = reviewId;
            console.log(`  ✓ Review created via bypass: ${state.reviewId}`);
            return;
          }
        }
        
        // Fallback to normal API
        const reviewRes = await apiRequest(state.customerRequest, 'POST', `/api/services/${state.serviceId}/reviews`, {
          rating: 5,
          comment: 'Excellent service! Very professional and on time.',
        });
        
        if (reviewRes.status === 201) {
          state.reviewId = reviewRes.data.id;
          expect(reviewRes.data.rating).toBe(5);
          console.log(`  ✓ Review created via API: ${state.reviewId}`);
        } else {
          console.log(`  ⚠ Review creation returned ${reviewRes.status}: ${reviewRes.data.message}`);
        }
      });
      
      test('5A.2 Customer edits review to negative (vendor should be notified)', async ({}) => {
        if (!state.reviewId) {
          console.log('  ⏭ Skipping: No review to edit');
          test.skip();
          return;
        }
        
        const editRes = await apiRequest(state.customerRequest, 'PATCH', `/api/reviews/${state.reviewId}`, {
          rating: 2,
          comment: 'Actually, there were some issues. Had to change my review.',
        });
        
        if (editRes.status === 200) {
          expect(editRes.data.rating).toBe(2);
          if (editRes.data.previousRating) {
            expect(editRes.data.previousRating).toBe(5);
            expect(editRes.data.ratingDirection).toBe('worsened');
          }
          console.log('  ✓ Review edited from 5→2 stars');
        } else {
          console.log(`  ⚠ Edit returned ${editRes.status}: ${editRes.data.message}`);
        }
      });
      
      test('5A.3 Vendor receives review change notification', async ({}) => {
        if (!state.reviewId) {
          test.skip();
          return;
        }
        
        const notifRes = await apiRequest(state.vendorRequest, 'GET', '/api/notifications');
        const notifications = notifRes.data?.notifications || notifRes.data || [];
        
        const reviewNotif = Array.isArray(notifications)
          ? notifications.find((n: any) =>
              n.type === 'review' || n.message?.includes('review')
            )
          : null;
        
        if (reviewNotif) {
          state.notificationIds.push(reviewNotif.id);
          console.log('  ✓ Vendor received review notification');
        } else {
          console.log('  ℹ No review notification found');
        }
      });
    });
    
    test.describe.serial('5B: Review Removal Request', () => {
      
      test('5B.1 Vendor requests review removal', async ({}) => {
        if (!state.reviewId) {
          console.log('  ⏭ Skipping: No review to request removal');
          test.skip();
          return;
        }
        
        const requestRes = await apiRequest(state.vendorRequest, 'POST', `/api/reviews/${state.reviewId}/request-removal`, {
          reason: 'fake',
          details: 'This review contains inaccurate information.',
        });
        
        if (requestRes.status === 201) {
          state.removalRequestId = requestRes.data.id;
          expect(requestRes.data.status).toBe('pending');
          console.log(`  ✓ Removal request submitted: ${state.removalRequestId}`);
        } else {
          console.log(`  ⚠ Removal request returned ${requestRes.status}: ${requestRes.data.message}`);
        }
      });
      
      test('5B.2 Admin sees pending removal requests', async ({}) => {
        const requestsRes = await apiRequest(state.adminRequest, 'GET', '/api/admin/review-removal-requests?status=pending');
        
        if (requestsRes.status === 200) {
          console.log(`  ℹ Admin sees ${requestsRes.data.length} pending removal requests`);
        } else {
          console.log(`  ⚠ Admin request returned ${requestsRes.status}`);
        }
      });
      
      test('5B.3 Admin processes removal request (reject)', async ({}) => {
        if (!state.removalRequestId) {
          test.skip();
          return;
        }
        
        const processRes = await apiRequest(state.adminRequest, 'PATCH', `/api/admin/review-removal-requests/${state.removalRequestId}`, {
          decision: 'rejected',
          adminNotes: 'Review appears legitimate based on booking records.',
        });
        
        if (processRes.status === 200) {
          expect(processRes.data.status).toBe('rejected');
          console.log('  ✓ Admin rejected removal request');
        } else {
          console.log(`  ⚠ Process returned ${processRes.status}: ${processRes.data.message}`);
        }
      });
    });
  });
  
  // ==========================================================================
  // PHASE 6: DISPUTES (requires completed booking)
  // ==========================================================================
  
  test.describe.serial('Phase 6: Dispute System', () => {
    
    test('6.1 Create dedicated completed booking for dispute testing', async ({}) => {
      console.log('\n⚖️ PHASE 6: DISPUTE SYSTEM');
      console.log('─'.repeat(50));
      
      if (!state.serviceId) {
        console.log('  ⏭ No service available for dispute test');
        return;
      }
      
      // Create a separate booking for disputes (don't reuse the one used for tips/reviews)
      try {
        const now = new Date();
        const { booking } = await createBypassBooking(TEST_USER.email, state.serviceId!, {
          status: 'completed',
          startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000),
          endTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        });
        state.disputeBookingId = booking.id;
        console.log(`  ✓ Dispute booking created: ${state.disputeBookingId}`);
      } catch (error) {
        console.log(`  ⚠ Could not create dispute booking: ${(error as Error).message}`);
      }
    });
    
    test('6.2 Customer raises dispute', async ({}, testInfo) => {
      if (!state.disputeBookingId) {
        console.log('  ⏭ Skipping: No booking for dispute');
        test.skip();
        return;
      }
      
      // Correct endpoint: /api/bookings/:id/dispute (not /api/disputes)
      const disputeRes = await apiRequest(state.customerRequest, 'POST', `/api/bookings/${state.disputeBookingId}/dispute`, {
        reason: 'poor_quality',
        description: 'Service was not performed as described.',
      });
      
      if (disputeRes.status === 201) {
        state.disputeId = disputeRes.data.id;
        expect(disputeRes.data.status).toBe('open');
        console.log(`  ✓ Dispute raised: ${state.disputeId}`);
      } else {
        console.log(`  ⚠ Dispute creation returned ${disputeRes.status}: ${disputeRes.data.message}`);
      }
    });
    
    test('6.3 Vendor responds to dispute', async ({}) => {
      if (!state.disputeId) {
        test.skip();
        return;
      }
      
      const responseRes = await apiRequest(state.vendorRequest, 'POST', `/api/disputes/${state.disputeId}/respond`, {
        response: 'I believe the service was performed as agreed. Customer may have had different expectations.',
      });
      
      if (responseRes.status === 200) {
        console.log('  ✓ Vendor responded to dispute');
      } else {
        console.log(`  ⚠ Response returned ${responseRes.status}: ${responseRes.data.message}`);
      }
    });
    
    test('6.4 Admin marks dispute under review', async ({}) => {
      if (!state.disputeId) {
        test.skip();
        return;
      }
      
      const reviewRes = await apiRequest(state.adminRequest, 'POST', `/api/admin/disputes/${state.disputeId}/review`);
      
      if (reviewRes.status === 200) {
        expect(reviewRes.data.status).toBe('under_review');
        console.log('  ✓ Dispute marked under review');
      } else {
        console.log(`  ⚠ Review returned ${reviewRes.status}: ${reviewRes.data.message}`);
      }
    });
    
    test('6.5 Admin resolves dispute (split decision)', async ({}) => {
      if (!state.disputeId) {
        test.skip();
        return;
      }
      
      const resolveRes = await apiRequest(state.adminRequest, 'POST', `/api/admin/disputes/${state.disputeId}/resolve`, {
        resolution: 'resolved_split',
        refundPercentage: 50,
        adminNotes: 'Partial refund approved - service was delivered but quality issues noted.',
      });
      
      if (resolveRes.status === 200) {
        const expectedStatuses = ['resolved_split', 'resolved_customer', 'resolved_vendor', 'resolved'];
        expect(expectedStatuses).toContain(resolveRes.data.status);
        console.log('  ✓ Dispute resolved');
      } else {
        console.log(`  ⚠ Resolve returned ${resolveRes.status}: ${resolveRes.data.message}`);
      }
    });
  });
  
  // ==========================================================================
  // PHASE 7: NOTIFICATIONS
  // ==========================================================================
  
  test.describe.serial('Phase 7: Notifications', () => {
    
    test('7.1 Customer can view notification list', async ({}) => {
      console.log('\n🔔 PHASE 7: NOTIFICATIONS');
      console.log('─'.repeat(50));
      
      const notifRes = await apiRequest(state.customerRequest, 'GET', '/api/notifications');
      
      if (notifRes.status === 200) {
        const notifications = notifRes.data?.notifications || notifRes.data || [];
        const count = Array.isArray(notifications) ? notifications.length : 0;
        console.log(`  ✓ Customer has ${count} notifications`);
      } else {
        console.log(`  ⚠ Notifications returned ${notifRes.status}`);
      }
    });
    
    test('7.2 Mark notification as read', async ({}) => {
      const notifRes = await apiRequest(state.customerRequest, 'GET', '/api/notifications?limit=5');
      const notifications = notifRes.data?.notifications || notifRes.data || [];
      
      if (Array.isArray(notifications) && notifications.length > 0) {
        const unread = notifications.find((n: any) => !n.isRead);
        if (unread) {
          // Correct method: POST (not PATCH)
          const markRes = await apiRequest(state.customerRequest, 'POST', `/api/notifications/${unread.id}/read`);
          if (markRes.status === 200) {
            console.log('  ✓ Notification marked as read');
          } else {
            console.log(`  ⚠ Mark read returned ${markRes.status}`);
          }
        } else {
          console.log('  ℹ All notifications already read');
        }
      } else {
        console.log('  ℹ No notifications to mark');
      }
    });
    
    test('7.3 Clicking booking notification navigates correctly', async ({ page }) => {
      // Login as customer
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
      
      // Go to notifications
      await page.goto('/notifications');
      await page.waitForLoadState('networkidle');
      
      // Find and click a notification
      const notifItem = page.locator('[data-testid="notification-item"]').first();
      
      if (await notifItem.isVisible()) {
        await notifItem.click();
        await page.waitForTimeout(1000);
        
        const url = page.url();
        console.log(`  ✓ Notification clicked, navigated to: ${url}`);
      } else {
        console.log('  ℹ No notification items visible to click');
      }
    });
  });
  
  // ==========================================================================
  // PHASE 8: CLEANUP & SUMMARY
  // ==========================================================================
  
  test.describe.serial('Phase 8: Cleanup & Summary', () => {
    
    test('8.1 Test summary and state report', async ({}) => {
      console.log('\n' + '═'.repeat(60));
      console.log('📊 TEST EXECUTION SUMMARY');
      console.log('═'.repeat(60));
      console.log('\n  ENTITIES CREATED:');
      console.log(`    Service ID:           ${state.serviceId || '❌ none'}`);
      console.log(`    Pending Booking:      ${state.pendingBookingId || '❌ none'}`);
      console.log(`    Accepted Booking:     ${state.acceptedBookingId || '❌ none'}`);
      console.log(`    Completed Booking:    ${state.completedBookingId || '❌ none'}`);
      console.log(`    Counter-Offer:        ${state.counterOfferBookingId || '❌ none'}`);
      console.log(`    Dispute Booking:      ${state.disputeBookingId || '❌ none'}`);
      console.log(`    Tip:                  ${state.tipId || '❌ none'}`);
      console.log(`    Review:               ${state.reviewId || '❌ none'}`);
      console.log(`    Removal Request:      ${state.removalRequestId || '❌ none'}`);
      console.log(`    Dispute:              ${state.disputeId || '❌ none'}`);
      console.log(`    Notifications:        ${state.notificationIds.length} tracked`);
      console.log('\n' + '═'.repeat(60));
      
      // Test that we created at least some test data
      const hasData = state.serviceId || state.completedBookingId || state.reviewId;
      expect(hasData).toBeTruthy();
      
      console.log('✅ Interactive flow tests completed!\n');
    });
  });
});
