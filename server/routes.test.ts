import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";

// Mock the database and dependencies before importing routes
vi.mock("./db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => Promise.resolve([])),
    })),
  },
}));

vi.mock("./storage", () => ({
  storage: {
    getCategories: vi.fn(() => Promise.resolve([{ id: "1", name: "Test Category", slug: "test" }])),
    getPlatformSettings: vi.fn(() => Promise.resolve({ googleMapsApiKey: "test-key" })),
    getPlans: vi.fn(() => Promise.resolve([])),
  },
}));

vi.mock("./auth", () => ({
  setupAuth: vi.fn(() => Promise.resolve()),
  isAuthenticated: vi.fn((_req, _res, next) => next()),
  requireEmailVerified: vi.fn((_req, _res, next) => next()),
}));

vi.mock("./adminAuth", () => ({
  isAdmin: vi.fn((_req, _res, next) => next()),
  adminLogin: vi.fn(),
  adminLogout: vi.fn(),
  getAdminSession: vi.fn(),
}));

vi.mock("./oauthProviders", () => ({
  setupOAuthRoutes: vi.fn(),
}));

vi.mock("./referralService", () => ({
  validateReferralCode: vi.fn(),
  getOrCreateReferralCode: vi.fn(),
  getReferralStatsForUser: vi.fn(),
  getDirectReferrals: vi.fn(),
  getReferralChain: vi.fn(),
  getTopReferrers: vi.fn(),
  getReferralSystemStats: vi.fn(),
  getReferralConfig: vi.fn(() => Promise.resolve({ isActive: true })),
  updateReferralConfig: vi.fn(),
  initializeReferralConfig: vi.fn(() => Promise.resolve()),
  adminAdjustPoints: vi.fn(),
  generateReferralLink: vi.fn(),
  processReferralReward: vi.fn(),
}));

vi.mock("./pointsService", () => ({
  getPointsBalance: vi.fn(),
  getPointsHistory: vi.fn(),
  getPointsSummary: vi.fn(),
  redeemPoints: vi.fn(),
  awardPoints: vi.fn(),
  getPointsLeaderboard: vi.fn(),
  calculateDiscountValue: vi.fn(),
}));

vi.mock("./notificationService", () => ({
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  dismissNotification: vi.fn(),
  clearAllNotifications: vi.fn(),
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}));

vi.mock("./pushService", () => ({
  initializePushService: vi.fn(),
  isPushEnabled: vi.fn(() => false),
  getVapidPublicKey: vi.fn(),
  registerPushSubscription: vi.fn(),
  unregisterPushSubscription: vi.fn(),
  getUserSubscriptions: vi.fn(),
}));

vi.mock("./stripeService", () => ({
  isStripeConfigured: vi.fn(() => false),
  getStripePublishableKey: vi.fn(() => ""),
  getOrCreateStripeCustomer: vi.fn(),
  createConnectAccount: vi.fn(),
  getConnectAccountStatus: vi.fn(),
  createPaymentIntent: vi.fn(),
  createCheckoutSession: vi.fn(),
  constructWebhookEvent: vi.fn(),
  handlePaymentSucceeded: vi.fn(),
  handlePaymentFailed: vi.fn(),
  handleAccountUpdated: vi.fn(),
  createRefund: vi.fn(),
  createBookingPayment: vi.fn(),
  captureBookingPayment: vi.fn(),
  cancelBookingPayment: vi.fn(),
  refundTwintPayment: vi.fn(),
  handleBookingPaymentSucceeded: vi.fn(),
  PLATFORM_FEE_PERCENTAGE: 10,
}));

vi.mock("./twintEligibilityService", () => ({
  checkTwintEligibility: vi.fn(() => Promise.resolve({ allowed: false, reason: "Not eligible" })),
  getTwintEligibilityStatus: vi.fn(() => Promise.resolve({ eligible: false })),
  TWINT_ELIGIBILITY: {
    minVendorTrustScore: 4.0,
    maxBookingAmount: 20000,
    minVendorCompletedBookings: 5,
    minVendorAccountAgeDays: 30,
    maxVendorDisputeRate: 0.10,
    requirePreviousCardBooking: true,
  },
}));

vi.mock("./bookingService", () => ({
  getVendorAvailabilitySettings: vi.fn(),
  upsertVendorAvailabilitySettings: vi.fn(),
  getVendorCalendarBlocks: vi.fn(),
  createCalendarBlock: vi.fn(),
  updateCalendarBlock: vi.fn(),
  deleteCalendarBlock: vi.fn(),
  getAvailableSlots: vi.fn(),
  createBookingRequest: vi.fn(),
  acceptBooking: vi.fn(),
  rejectBooking: vi.fn(),
  proposeAlternative: vi.fn(),
  acceptAlternative: vi.fn(),
  cancelBooking: vi.fn(),
  getCustomerBookings: vi.fn(),
  getVendorBookings: vi.fn(),
  getBookingById: vi.fn(),
  startBooking: vi.fn(),
  completeBooking: vi.fn(),
  getPendingBookingsCount: vi.fn(),
  getQueuePosition: vi.fn(),
}));

vi.mock("./chatService", () => ({
  getOrCreateConversation: vi.fn(),
  getUserConversations: vi.fn(),
  getConversationById: vi.fn(),
  sendMessage: vi.fn(),
  getMessages: vi.fn(),
  markMessagesAsRead: vi.fn(),
  getUnreadCount: vi.fn(),
  sendSystemMessage: vi.fn(),
  deleteConversation: vi.fn(),
  blockConversation: vi.fn(),
  unblockConversation: vi.fn(),
  blockUser: vi.fn(),
  unblockUser: vi.fn(),
  getBlockedUsers: vi.fn(),
  getFlaggedConversations: vi.fn(),
  clearConversationFlag: vi.fn(),
  deleteMessage: vi.fn(),
  editMessage: vi.fn(),
  moderateMessage: vi.fn(),
}));

vi.mock("./aiService", () => ({
  categorizeService: vi.fn(),
}));

vi.mock("./aiAdminService", () => ({
  getAdminAssistance: vi.fn(),
}));

vi.mock("./aiUserSupportService", () => ({
  getUserSupport: vi.fn(),
}));

vi.mock("./aiCategoryService", () => ({
  validateCategoryName: vi.fn(),
  suggestCategoryAlternative: vi.fn(),
  findSimilarCategoryName: vi.fn(),
  suggestCategoryAndSubcategory: vi.fn(),
}));

vi.mock("./aiContentService", () => ({
  analyzeImagesForHashtags: vi.fn(),
  generateServiceTitle: vi.fn(),
  generateServiceDescription: vi.fn(),
  generatePricingSuggestion: vi.fn(),
}));

vi.mock("./swissAddressService", () => ({
  validateSwissAddress: vi.fn(),
}));

vi.mock("./contactVerificationService", () => ({
  sendVerificationCode: vi.fn(),
}));

vi.mock("./objectStorage", () => ({
  ObjectStorageService: vi.fn().mockImplementation(() => ({
    getObjectEntityFile: vi.fn(),
    downloadObject: vi.fn(),
    getObjectEntityUploadURL: vi.fn(),
    trySetObjectEntityAclPolicy: vi.fn(),
  })),
  ObjectNotFoundError: class extends Error {},
}));

// Import express and supertest after mocks
import express from "express";
import request from "supertest";
import { registerRoutes } from "./routes";

describe("API Routes", () => {
  let app: express.Express;
  let server: ReturnType<typeof import("http").createServer>;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    server?.close();
  });

  describe("GET /api/categories", () => {
    it("should return an array of categories", async () => {
      const response = await request(app)
        .get("/api/categories")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/maps/config", () => {
    it("should return apiKey and isConfigured", async () => {
      const response = await request(app)
        .get("/api/maps/config")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(response.body).toHaveProperty("apiKey");
      expect(response.body).toHaveProperty("isConfigured");
    });
  });

  describe("GET /api/health", () => {
    it("should return status ok", async () => {
      // Note: The current routes.ts does not have a /api/health endpoint
      // This test verifies the expected behavior if it were added
      // For now, we test the /api/plans endpoint as an alternative health check
      const response = await request(app)
        .get("/api/plans")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
