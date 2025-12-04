/**
 * Test User Management Service
 * 
 * Manages dedicated test user accounts for E2E testing with:
 * - Two pre-configured test users (customer and vendor)
 * - Ghost mode to hide test data from production users
 * - Automatic cleanup of test-generated data
 * - Full audit logging and reporting
 */

import { db } from "./db";
import { eq, and, inArray, sql, like, or, desc } from "drizzle-orm";
import { 
  users, 
  services, 
  bookings, 
  reviews, 
  chatConversations, 
  chatMessages,
  notifications,
  referralTransactions,
  pointsLog,
  escrowTransactions,
  escrowDisputes,
  serviceContacts,
  servicePricingOptions,
} from "@shared/schema";
import bcrypt from "bcrypt";

// Test user configuration - completely isolated from production admins
export const TEST_USER_CONFIG = {
  // Test admin account for E2E setup/teardown operations
  admin: {
    id: "test-admin-e2e",
    email: "test-admin@commerzio.test",
    firstName: "Test",
    lastName: "Admin",
    password: "TestAdmin123Secure",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestAdmin",
    isAdmin: true,
  },
  // Regular test customer account
  customer: {
    id: "test-user-customer",
    email: "test-customer@commerzio.test",
    firstName: "Test",
    lastName: "Customer",
    password: "TestCustomer123",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestCustomer",
    isAdmin: false,
  },
  // Test vendor account
  vendor: {
    id: "test-user-vendor", 
    email: "test-vendor@commerzio.test",
    firstName: "Test",
    lastName: "Vendor",
    password: "TestVendor123",
    profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=TestVendor",
    isAdmin: false,
  },
};

// Ghost mode prefix for test data
export const TEST_DATA_PREFIX = "__TEST__";
export const TEST_EMAIL_DOMAIN = "@commerzio.test";

// Test run log entry type
export interface TestRunLog {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'cleaned';
  testType: 'e2e' | 'integration' | 'manual';
  createdData: {
    services: string[];
    bookings: string[];
    reviews: string[];
    conversations: string[];
    messages: string[];
    notifications: string[];
  };
  cleanedAt?: Date;
  notes?: string;
}

// In-memory test run tracking (could be moved to DB for persistence)
const testRunLogs: Map<string, TestRunLog> = new Map();

/**
 * Check if a user is a test user
 */
export function isTestUser(userId: string): boolean {
  return userId === TEST_USER_CONFIG.admin.id ||
         userId === TEST_USER_CONFIG.customer.id || 
         userId === TEST_USER_CONFIG.vendor.id ||
         userId.startsWith(TEST_DATA_PREFIX);
}

/**
 * Check if an email belongs to a test user
 */
export function isTestEmail(email: string): boolean {
  return email.endsWith(TEST_EMAIL_DOMAIN);
}

/**
 * Create or reset test users (including test admin)
 */
export async function initializeTestUsers(): Promise<{
  admin: typeof TEST_USER_CONFIG.admin & { created: boolean };
  customer: typeof TEST_USER_CONFIG.customer & { created: boolean };
  vendor: typeof TEST_USER_CONFIG.vendor & { created: boolean };
}> {
  const results = {
    admin: { ...TEST_USER_CONFIG.admin, created: false },
    customer: { ...TEST_USER_CONFIG.customer, created: false },
    vendor: { ...TEST_USER_CONFIG.vendor, created: false },
  };

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash(TEST_USER_CONFIG.admin.password, 10);
  const customerPasswordHash = await bcrypt.hash(TEST_USER_CONFIG.customer.password, 10);
  const vendorPasswordHash = await bcrypt.hash(TEST_USER_CONFIG.vendor.password, 10);

  // Create/update test admin user
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.id, TEST_USER_CONFIG.admin.id),
  });

  if (!existingAdmin) {
    await db.insert(users).values({
      id: TEST_USER_CONFIG.admin.id,
      email: TEST_USER_CONFIG.admin.email,
      firstName: TEST_USER_CONFIG.admin.firstName,
      lastName: TEST_USER_CONFIG.admin.lastName,
      passwordHash: adminPasswordHash,
      profileImageUrl: TEST_USER_CONFIG.admin.profileImageUrl,
      isVerified: true,
      emailVerified: true,
      isAdmin: true,
      authProvider: "local",
      status: "active",
    });
    results.admin.created = true;
  } else {
    await db.update(users)
      .set({ 
        passwordHash: adminPasswordHash,
        status: "active",
        isVerified: true,
        emailVerified: true,
        isAdmin: true,
      })
      .where(eq(users.id, TEST_USER_CONFIG.admin.id));
  }

  // Create/update customer test user
  const existingCustomer = await db.query.users.findFirst({
    where: eq(users.id, TEST_USER_CONFIG.customer.id),
  });

  if (!existingCustomer) {
    await db.insert(users).values({
      id: TEST_USER_CONFIG.customer.id,
      email: TEST_USER_CONFIG.customer.email,
      firstName: TEST_USER_CONFIG.customer.firstName,
      lastName: TEST_USER_CONFIG.customer.lastName,
      passwordHash: customerPasswordHash,
      profileImageUrl: TEST_USER_CONFIG.customer.profileImageUrl,
      isVerified: true,
      emailVerified: true,
      authProvider: "local",
      status: "active",
    });
    results.customer.created = true;
  } else {
    // Update password in case it changed
    await db.update(users)
      .set({ 
        passwordHash: customerPasswordHash,
        status: "active",
        isVerified: true,
        emailVerified: true,
      })
      .where(eq(users.id, TEST_USER_CONFIG.customer.id));
  }

  // Create/update vendor test user  
  const existingVendor = await db.query.users.findFirst({
    where: eq(users.id, TEST_USER_CONFIG.vendor.id),
  });

  if (!existingVendor) {
    await db.insert(users).values({
      id: TEST_USER_CONFIG.vendor.id,
      email: TEST_USER_CONFIG.vendor.email,
      firstName: TEST_USER_CONFIG.vendor.firstName,
      lastName: TEST_USER_CONFIG.vendor.lastName,
      passwordHash: vendorPasswordHash,
      profileImageUrl: TEST_USER_CONFIG.vendor.profileImageUrl,
      isVerified: true,
      emailVerified: true,
      authProvider: "local",
      status: "active",
      acceptCardPayments: true,
      acceptTwintPayments: true,
      acceptCashPayments: true,
    });
    results.vendor.created = true;
  } else {
    await db.update(users)
      .set({ 
        passwordHash: vendorPasswordHash,
        status: "active",
        isVerified: true,
        emailVerified: true,
      })
      .where(eq(users.id, TEST_USER_CONFIG.vendor.id));
  }

  console.log(`[TestUserService] Test users initialized:`, {
    admin: results.admin.created ? 'created' : 'updated',
    customer: results.customer.created ? 'created' : 'updated',
    vendor: results.vendor.created ? 'created' : 'updated',
  });

  return results;
}

/**
 * Start a new test run session
 */
export function startTestRun(testType: 'e2e' | 'integration' | 'manual' = 'e2e'): string {
  const runId = `${TEST_DATA_PREFIX}run_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const log: TestRunLog = {
    id: runId,
    startedAt: new Date(),
    status: 'running',
    testType,
    createdData: {
      services: [],
      bookings: [],
      reviews: [],
      conversations: [],
      messages: [],
      notifications: [],
    },
  };

  testRunLogs.set(runId, log);
  console.log(`[TestUserService] Test run started: ${runId}`);
  
  return runId;
}

/**
 * Track data created during a test run
 */
export function trackTestData(
  runId: string, 
  dataType: keyof TestRunLog['createdData'], 
  dataId: string
): void {
  const log = testRunLogs.get(runId);
  if (log) {
    log.createdData[dataType].push(dataId);
  }
}

/**
 * End a test run
 */
export function endTestRun(runId: string, status: 'completed' | 'failed' = 'completed'): TestRunLog | null {
  const log = testRunLogs.get(runId);
  if (log) {
    log.completedAt = new Date();
    log.status = status;
    console.log(`[TestUserService] Test run ended: ${runId} - ${status}`);
  }
  return log || null;
}

/**
 * Get all test run logs
 */
export function getTestRunLogs(): TestRunLog[] {
  return Array.from(testRunLogs.values()).sort((a, b) => 
    b.startedAt.getTime() - a.startedAt.getTime()
  );
}

/**
 * Clean up all data created by test users
 * This removes all traces of test interactions
 */
export async function cleanupTestData(options?: {
  runId?: string;
  keepUsers?: boolean;
  dryRun?: boolean;
}): Promise<{
  deleted: {
    services: number;
    bookings: number;
    reviews: number;
    conversations: number;
    messages: number;
    notifications: number;
    serviceContacts: number;
    pricingOptions: number;
    escrowTransactions: number;
    escrowDisputes: number;
    referralTransactions: number;
    pointsLog: number;
  };
  errors: string[];
}> {
  // Include all test user IDs (admin, customer, vendor)
  const testUserIds = [TEST_USER_CONFIG.admin.id, TEST_USER_CONFIG.customer.id, TEST_USER_CONFIG.vendor.id];
  const result = {
    deleted: {
      services: 0,
      bookings: 0,
      reviews: 0,
      conversations: 0,
      messages: 0,
      notifications: 0,
      serviceContacts: 0,
      pricingOptions: 0,
      escrowTransactions: 0,
      escrowDisputes: 0,
      referralTransactions: 0,
      pointsLog: 0,
    },
    errors: [] as string[],
  };

  const dryRun = options?.dryRun ?? false;

  try {
    // Get services created by test users (ownerId is the column name)
    const testServices = await db.query.services.findMany({
      where: inArray(services.ownerId, testUserIds),
    });
    const testServiceIds = testServices.map(s => s.id);

    if (testServiceIds.length > 0) {
      // Delete pricing options for test services
      if (!dryRun) {
        const deletedPricing = await db.delete(servicePricingOptions)
          .where(inArray(servicePricingOptions.serviceId, testServiceIds))
          .returning();
        result.deleted.pricingOptions = deletedPricing.length;
      }

      // Delete service contacts for test services
      if (!dryRun) {
        const deletedContacts = await db.delete(serviceContacts)
          .where(inArray(serviceContacts.serviceId, testServiceIds))
          .returning();
        result.deleted.serviceContacts = deletedContacts.length;
      }
    }

    // Delete reviews by or for test users (userId is the reviewer column)
    if (!dryRun) {
      const deletedReviews = await db.delete(reviews)
        .where(or(
          inArray(reviews.userId, testUserIds),
          testServiceIds.length > 0 ? inArray(reviews.serviceId, testServiceIds) : sql`false`
        ))
        .returning();
      result.deleted.reviews = deletedReviews.length;
    }

    // Get bookings involving test users for escrow transaction cleanup BEFORE deleting bookings
    const testBookings = await db.query.bookings.findMany({
      where: or(
        inArray(bookings.customerId, testUserIds),
        inArray(bookings.vendorId, testUserIds),
        testServiceIds.length > 0 ? inArray(bookings.serviceId, testServiceIds) : sql`false`
      ),
    });
    const testBookingIds = testBookings.map(b => b.id);

    // Delete escrow disputes involving test users (raisedByUserId is the column)
    if (!dryRun) {
      const deletedDisputes = await db.delete(escrowDisputes)
        .where(inArray(escrowDisputes.raisedByUserId, testUserIds))
        .returning();
      result.deleted.escrowDisputes = deletedDisputes.length;
    }

    // Delete escrow transactions by booking ID (escrowTransactions references bookingId)
    if (testBookingIds.length > 0 && !dryRun) {
      const deletedEscrow = await db.delete(escrowTransactions)
        .where(inArray(escrowTransactions.bookingId, testBookingIds))
        .returning();
      result.deleted.escrowTransactions = deletedEscrow.length;
    }

    // NOW delete bookings involving test users (after escrow transactions are deleted)
    if (!dryRun) {
      const deletedBookings = await db.delete(bookings)
        .where(or(
          inArray(bookings.customerId, testUserIds),
          inArray(bookings.vendorId, testUserIds),
          testServiceIds.length > 0 ? inArray(bookings.serviceId, testServiceIds) : sql`false`
        ))
        .returning();
      result.deleted.bookings = deletedBookings.length;
    }

    // Delete chat messages in conversations with test users
    const testConversations = await db.query.chatConversations.findMany({
      where: or(
        inArray(chatConversations.customerId, testUserIds),
        inArray(chatConversations.vendorId, testUserIds)
      ),
    });
    const conversationIds = testConversations.map(c => c.id);

    if (conversationIds.length > 0) {
      if (!dryRun) {
        const deletedMessages = await db.delete(chatMessages)
          .where(inArray(chatMessages.conversationId, conversationIds))
          .returning();
        result.deleted.messages = deletedMessages.length;
      }

      // Delete conversations
      if (!dryRun) {
        const deletedConversations = await db.delete(chatConversations)
          .where(inArray(chatConversations.id, conversationIds))
          .returning();
        result.deleted.conversations = deletedConversations.length;
      }
    }

    // Delete notifications for test users
    if (!dryRun) {
      const deletedNotifications = await db.delete(notifications)
        .where(inArray(notifications.userId, testUserIds))
        .returning();
      result.deleted.notifications = deletedNotifications.length;
    }

    // Delete referral transactions involving test users (toUserId = referrer, fromUserId = referee)
    if (!dryRun) {
      const deletedReferrals = await db.delete(referralTransactions)
        .where(or(
          inArray(referralTransactions.toUserId, testUserIds),
          inArray(referralTransactions.fromUserId, testUserIds)
        ))
        .returning();
      result.deleted.referralTransactions = deletedReferrals.length;
    }

    // Delete points log for test users
    if (!dryRun) {
      const deletedPoints = await db.delete(pointsLog)
        .where(inArray(pointsLog.userId, testUserIds))
        .returning();
      result.deleted.pointsLog = deletedPoints.length;
    }

    // Delete services created by test users (after all dependencies are removed)
    if (!dryRun && testServiceIds.length > 0) {
      const deletedServices = await db.delete(services)
        .where(inArray(services.id, testServiceIds))
        .returning();
      result.deleted.services = deletedServices.length;
    }

    // Mark test run as cleaned if specified
    if (options?.runId) {
      const log = testRunLogs.get(options.runId);
      if (log) {
        log.cleanedAt = new Date();
        log.status = 'cleaned';
      }
    }

    console.log(`[TestUserService] Cleanup ${dryRun ? '(dry run) ' : ''}completed:`, result.deleted);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error(`[TestUserService] Cleanup error:`, error);
  }

  return result;
}

/**
 * Get test data statistics
 */
export async function getTestDataStats(): Promise<{
  testUsers: { id: string; email: string | null; createdAt: Date | null }[];
  counts: {
    services: number;
    bookings: number;
    reviews: number;
    conversations: number;
    notifications: number;
  };
  lastCleanup?: Date;
  activeTestRuns: number;
}> {
  const testUserIds = [TEST_USER_CONFIG.admin.id, TEST_USER_CONFIG.customer.id, TEST_USER_CONFIG.vendor.id];

  // Get test users
  const testUsersData = await db.query.users.findMany({
    where: inArray(users.id, testUserIds),
    columns: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // Count test data
  const [servicesCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(services)
    .where(inArray(services.ownerId, testUserIds));

  const [bookingsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(or(
      inArray(bookings.customerId, testUserIds),
      inArray(bookings.vendorId, testUserIds)
    ));

  const [reviewsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviews)
    .where(inArray(reviews.userId, testUserIds));

  const [conversationsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chatConversations)
    .where(or(
      inArray(chatConversations.customerId, testUserIds),
      inArray(chatConversations.vendorId, testUserIds)
    ));

  const [notificationsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(inArray(notifications.userId, testUserIds));

  // Get last cleanup time
  const cleanedRuns = Array.from(testRunLogs.values())
    .filter(r => r.cleanedAt)
    .sort((a, b) => (b.cleanedAt?.getTime() || 0) - (a.cleanedAt?.getTime() || 0));

  const activeRuns = Array.from(testRunLogs.values())
    .filter(r => r.status === 'running').length;

  return {
    testUsers: testUsersData,
    counts: {
      services: Number(servicesCount?.count || 0),
      bookings: Number(bookingsCount?.count || 0),
      reviews: Number(reviewsCount?.count || 0),
      conversations: Number(conversationsCount?.count || 0),
      notifications: Number(notificationsCount?.count || 0),
    },
    lastCleanup: cleanedRuns[0]?.cleanedAt,
    activeTestRuns: activeRuns,
  };
}

/**
 * Check if data should be filtered in ghost mode
 * Returns true if the data should be hidden from the requesting user
 */
export function shouldHideInGhostMode(
  dataUserId: string,
  requestingUserId: string,
  ghostModeEnabled: boolean = true
): boolean {
  if (!ghostModeEnabled) return false;
  
  // If the requesting user is a test user, show all data
  if (isTestUser(requestingUserId)) return false;
  
  // If the data belongs to a test user, hide it from non-test users
  return isTestUser(dataUserId);
}

/**
 * SQL filter for ghost mode - excludes test user data from queries
 */
export function getGhostModeFilter(userIdColumn: any, ghostModeEnabled: boolean = true) {
  if (!ghostModeEnabled) return sql`true`;
  
  const testUserIds = [TEST_USER_CONFIG.admin.id, TEST_USER_CONFIG.customer.id, TEST_USER_CONFIG.vendor.id];
  return sql`${userIdColumn} NOT IN (${sql.join(testUserIds.map(id => sql`${id}`), sql`, `)})`;
}

/**
 * Delete test users entirely (use with caution)
 */
export async function deleteTestUsers(): Promise<{ deleted: boolean; error?: string }> {
  try {
    // First clean up all test data
    await cleanupTestData({ keepUsers: false });

    // Then delete the test users
    const testUserIds = [TEST_USER_CONFIG.admin.id, TEST_USER_CONFIG.customer.id, TEST_USER_CONFIG.vendor.id];
    await db.delete(users).where(inArray(users.id, testUserIds));

    console.log(`[TestUserService] Test users deleted`);
    return { deleted: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[TestUserService] Error deleting test users:`, error);
    return { deleted: false, error: errorMessage };
  }
}

/**
 * Generate a test report
 */
export async function generateTestReport(): Promise<{
  summary: {
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    cleanedRuns: number;
  };
  stats: Awaited<ReturnType<typeof getTestDataStats>>;
  recentRuns: TestRunLog[];
  testCredentials: {
    customer: { email: string; password: string };
    vendor: { email: string; password: string };
  };
}> {
  const logs = getTestRunLogs();
  const stats = await getTestDataStats();

  return {
    summary: {
      totalRuns: logs.length,
      completedRuns: logs.filter(r => r.status === 'completed').length,
      failedRuns: logs.filter(r => r.status === 'failed').length,
      cleanedRuns: logs.filter(r => r.status === 'cleaned').length,
    },
    stats,
    recentRuns: logs.slice(0, 10),
    testCredentials: {
      customer: {
        email: TEST_USER_CONFIG.customer.email,
        password: TEST_USER_CONFIG.customer.password,
      },
      vendor: {
        email: TEST_USER_CONFIG.vendor.email,
        password: TEST_USER_CONFIG.vendor.password,
      },
    },
  };
}
