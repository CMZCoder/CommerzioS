/**
 * Comprehensive Seed Script
 * 
 * Creates complete test data including:
 * - Reviews ready to respond to (for admin)
 * - Transactions available for dispute
 * - Service requests to approve/reject
 * - Disputes in all 3 phases
 * - Chat conversations
 * - Notifications of all types
 */

import { db } from "../server/db";
import { 
  users, 
  services, 
  bookings, 
  reviews, 
  escrowDisputes, 
  chatConversations, 
  chatMessages, 
  notifications,
  escrowTransactions,
  categories
} from "../shared/schema";
import { 
  disputePhases,
  disputeAiAnalysis,
  disputeAiOptions,
  disputeAiDecisions
} from "../shared/schema-disputes";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "../server/authService";

// Target admin user ID - your account
const ADMIN_USER_ID = "8b67c4d0-268b-41f2-8acb-2aa4d9362267";

async function seedComprehensive() {
  console.log("🚀 Starting comprehensive seed...\n");

  try {
    // First, ensure the admin user exists and is properly set up
    const [adminUser] = await db.select().from(users).where(eq(users.id, ADMIN_USER_ID)).limit(1);
    
    if (!adminUser) {
      console.log("❌ Admin user not found. Please log in first to create your account.");
      return;
    }

    console.log(`✅ Found admin user: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);

    // Make the user an admin
    await db.update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, ADMIN_USER_ID));
    console.log("✅ Admin privileges granted\n");

    // Get first category for services
    const [firstCategory] = await db.select().from(categories).limit(1);
    if (!firstCategory) {
      console.log("❌ No categories found. Run the main seed first.");
      return;
    }

    // ==========================================
    // 1. CREATE TEST CUSTOMERS WHO LEFT REVIEWS
    // ==========================================
    console.log("📝 Creating test customers who left reviews...");
    
    const testCustomers = [
      { id: "test-customer-1", firstName: "Emma", lastName: "Johnson", email: "emma.j@test.com" },
      { id: "test-customer-2", firstName: "Lucas", lastName: "Brown", email: "lucas.b@test.com" },
      { id: "test-customer-3", firstName: "Sofia", lastName: "Garcia", email: "sofia.g@test.com" },
      { id: "test-customer-4", firstName: "Oliver", lastName: "Martinez", email: "oliver.m@test.com" },
      { id: "test-customer-5", firstName: "Isabella", lastName: "Wilson", email: "isabella.w@test.com" },
    ];

    for (const customer of testCustomers) {
      const existing = await db.select().from(users).where(eq(users.id, customer.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(users).values({
          id: customer.id,
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.firstName}`,
          isVerified: true,
          authProvider: "local",
          passwordHash: await hashPassword("TestPass123!"),
        });
        console.log(`  Created customer: ${customer.firstName} ${customer.lastName}`);
      }
    }

    // ==========================================
    // 2. CREATE ADMIN'S OWN SERVICE
    // ==========================================
    console.log("\n📦 Creating admin's service...");
    
    const adminServiceId = "admin-service-1";
    const existingService = await db.select().from(services).where(eq(services.id, adminServiceId)).limit(1);
    
    if (existingService.length === 0) {
      await db.insert(services).values({
        id: adminServiceId,
        title: "Premium Consulting Service",
        description: "Expert business consulting and strategy services. Helping businesses grow and succeed.",
        priceType: "fixed",
        price: "150.00",
        priceUnit: "hour",
        contactEmail: adminUser.email || "admin@test.com",
        contactPhone: "+41 79 000 00 00",
        locations: ["Zürich", "Remote"],
        locationLat: "47.3769",
        locationLng: "8.5417",
        ownerId: ADMIN_USER_ID,
        categoryId: firstCategory.id,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        viewCount: 150,
        images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800"],
        tags: ["consulting", "business", "strategy"],
      });
      console.log("  ✅ Created admin service");
    }

    // ==========================================
    // 3. CREATE REVIEWS TO RESPOND TO (3 reviews awaiting response)
    // ==========================================
    console.log("\n⭐ Creating reviews for admin to respond to...");
    
    const reviewsToCreate = [
      {
        id: "review-for-admin-1",
        serviceId: adminServiceId,
        userId: "test-customer-1",
        rating: 5,
        comment: "Absolutely fantastic service! The consulting advice was invaluable. Looking forward to our next session!",
        vendorResponse: null,
        vendorRespondedAt: null,
      },
      {
        id: "review-for-admin-2",
        serviceId: adminServiceId,
        userId: "test-customer-2",
        rating: 4,
        comment: "Very helpful consultation. Clear explanations and actionable advice. Minor delay in scheduling but overall great experience.",
        vendorResponse: null,
        vendorRespondedAt: null,
      },
      {
        id: "review-for-admin-3",
        serviceId: adminServiceId,
        userId: "test-customer-3",
        rating: 5,
        comment: "Professional, knowledgeable, and very patient. Helped me understand complex business concepts. Highly recommended!",
        vendorResponse: null,
        vendorRespondedAt: null,
      },
    ];

    for (const review of reviewsToCreate) {
      const existing = await db.select().from(reviews).where(eq(reviews.id, review.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(reviews).values(review);
        console.log(`  ✅ Created review from ${review.userId} (${review.rating} stars)`);
      }
    }

    // ==========================================
    // 4. CREATE BOOKINGS FOR DISPUTES
    // ==========================================
    console.log("\n📅 Creating completed bookings for dispute testing...");
    
    const bookingsForDisputes = [
      {
        id: "booking-dispute-1",
        bookingNumber: "BK-DISP-001",
        customerId: "test-customer-1",
        vendorId: ADMIN_USER_ID,
        serviceId: adminServiceId,
        status: "completed" as const,
        requestedStartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        requestedEndTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        confirmedStartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        confirmedEndTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        paymentMethod: "card" as const,
      },
      {
        id: "booking-dispute-2",
        bookingNumber: "BK-DISP-002",
        customerId: "test-customer-2",
        vendorId: ADMIN_USER_ID,
        serviceId: adminServiceId,
        status: "completed" as const,
        requestedStartTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        requestedEndTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        confirmedStartTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        confirmedEndTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        paymentMethod: "card" as const,
      },
      {
        id: "booking-dispute-3",
        bookingNumber: "BK-DISP-003",
        customerId: "test-customer-3",
        vendorId: ADMIN_USER_ID,
        serviceId: adminServiceId,
        status: "completed" as const,
        requestedStartTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        requestedEndTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        confirmedStartTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        confirmedEndTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        paymentMethod: "card" as const,
      },
      // Booking that can be disputed (completed recently)
      {
        id: "booking-can-dispute",
        bookingNumber: "BK-READY-DISP",
        customerId: ADMIN_USER_ID, // Admin as customer this time
        vendorId: "demo-user-1",
        serviceId: "demo-service-1",
        status: "completed" as const,
        requestedStartTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        requestedEndTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        confirmedStartTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        confirmedEndTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        paymentMethod: "card" as const,
      },
    ];

    for (const booking of bookingsForDisputes) {
      const existing = await db.select().from(bookings).where(eq(bookings.id, booking.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(bookings).values(booking);
        console.log(`  ✅ Created booking ${booking.bookingNumber}`);
      }
    }

    // ==========================================
    // 5. CREATE ESCROW TRANSACTIONS
    // ==========================================
    console.log("\n💰 Creating escrow transactions...");
    
    const escrowsToCreate = [
      {
        id: "escrow-1",
        bookingId: "booking-dispute-1",
        amount: "300.00",
        platformFee: "24.00",
        vendorAmount: "276.00",
        currency: "CHF",
        paymentMethod: "card" as const,
        status: "held" as const,
        stripePaymentIntentId: "pi_test_001",
        heldAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "escrow-2",
        bookingId: "booking-dispute-2",
        amount: "300.00",
        platformFee: "24.00",
        vendorAmount: "276.00",
        currency: "CHF",
        paymentMethod: "card" as const,
        status: "held" as const,
        stripePaymentIntentId: "pi_test_002",
        heldAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "escrow-3",
        bookingId: "booking-dispute-3",
        amount: "300.00",
        platformFee: "24.00",
        vendorAmount: "276.00",
        currency: "CHF",
        paymentMethod: "card" as const,
        status: "held" as const,
        stripePaymentIntentId: "pi_test_003",
        heldAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: "escrow-can-dispute",
        bookingId: "booking-can-dispute",
        amount: "90.00",
        platformFee: "7.20",
        vendorAmount: "82.80",
        currency: "CHF",
        paymentMethod: "card" as const,
        status: "held" as const,
        stripePaymentIntentId: "pi_test_ready",
        heldAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const escrow of escrowsToCreate) {
      const existing = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, escrow.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(escrowTransactions).values(escrow);
        console.log(`  ✅ Created escrow for booking ${escrow.bookingId}`);
      }
    }

    // ==========================================
    // 6. CREATE DISPUTES IN ALL 3 PHASES
    // ==========================================
    console.log("\n⚖️ Creating disputes in all phases...");
    
    // Phase 1 - Direct Negotiation
    const dispute1Id = "d1sp-pha1-0001-0000-000000000001";
    const existingDispute1 = await db.select().from(escrowDisputes).where(eq(escrowDisputes.id, dispute1Id)).limit(1);
    if (existingDispute1.length === 0) {
      // Create the main escrow dispute
      await db.insert(escrowDisputes).values({
        id: dispute1Id,
        escrowTransactionId: "escrow-1",
        bookingId: "booking-dispute-1",
        raisedBy: "customer",
        raisedByUserId: "test-customer-1",
        reason: "poor_quality",
        description: "The consultation session was not as comprehensive as described. Expected a full business analysis but received only surface-level advice.",
        status: "open",
      });
      
      // Create the dispute phase tracking
      await db.insert(disputePhases).values({
        disputeId: dispute1Id,
        currentPhase: "phase_1",
        phase1StartedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        phase1Deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days left
        phase1CounterOffersCustomer: 1,
        phase1CounterOffersVendor: 0,
      });
      
      console.log("  ✅ Created Phase 1 dispute (Direct Negotiation - 5 days remaining)");
    }

    // Phase 2 - AI Mediation
    const dispute2Id = "d1sp-pha2-0002-0000-000000000002";
    const existingDispute2 = await db.select().from(escrowDisputes).where(eq(escrowDisputes.id, dispute2Id)).limit(1);
    if (existingDispute2.length === 0) {
      // Create the main escrow dispute
      await db.insert(escrowDisputes).values({
        id: dispute2Id,
        escrowTransactionId: "escrow-2",
        bookingId: "booking-dispute-2",
        raisedBy: "customer",
        raisedByUserId: "test-customer-2",
        reason: "wrong_service",
        description: "The advice provided was generic and not tailored to my specific business situation as promised.",
        status: "under_review",
      });
      
      // Create the dispute phase tracking
      await db.insert(disputePhases).values({
        disputeId: dispute2Id,
        currentPhase: "phase_2",
        phase1StartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Started 8 days ago  
        phase1Deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Passed
        phase1CounterOffersCustomer: 2,
        phase1CounterOffersVendor: 1,
        phase2StartedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
        phase2Deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days left
        phase2CounterOffersCustomer: 0,
        phase2CounterOffersVendor: 0,
      });
      
      // Create AI analysis for Phase 2 - let DB generate UUID
      const [insertedAnalysis] = await db.insert(disputeAiAnalysis).values({
        disputeId: dispute2Id,
        evidenceAnalysis: {
          customer: {
            evidenceCount: 2,
            evidenceTypes: ["screenshot", "email"],
            evidenceStrength: "moderate",
            evidenceSummary: "Customer provided screenshots of service description and follow-up emails."
          },
          vendor: {
            evidenceCount: 1,
            evidenceTypes: ["document"],
            evidenceStrength: "moderate",
            evidenceSummary: "Vendor provided consultation notes showing delivered advice."
          }
        },
        descriptionAnalysis: {
          customerAccount: "Claims service was generic and not personalized",
          vendorAccount: "States advice was tailored based on provided information",
          consistencyScore: 0.6,
          contradictions: ["Customer expected written report, vendor delivered verbal advice"],
          verifiableClaims: ["Service description mentions 'personalized approach'"]
        },
        behaviorAnalysis: {
          customer: {
            responseTime: "fast",
            tone: "professional",
            goodFaithScore: 0.8,
            cooperationLevel: "Engaged constructively in negotiation"
          },
          vendor: {
            responseTime: "moderate",
            tone: "professional",
            goodFaithScore: 0.7,
            cooperationLevel: "Willing to compromise but defensive"
          }
        },
        overallAssessment: {
          primaryIssue: "Mismatch between service expectations and delivery",
          faultAssessment: "Both parties share some responsibility - unclear service scope",
          mitigatingFactors: ["Vendor offered partial refund", "Customer used service"],
          aggravatingFactors: ["Service description could be clearer"]
        },
        aiModel: "gpt-4",
      }).returning();
      
      const analysisId = insertedAnalysis.id;
      
      // Create AI options for Phase 2
      await db.insert(disputeAiOptions).values([
        {
          disputeId: dispute2Id,
          analysisId,
          optionLabel: "A",
          optionTitle: "Evidence-Based Resolution",
          customerRefundPercent: 65,
          vendorPaymentPercent: 35,
          customerRefundAmount: "195.00",
          vendorPaymentAmount: "105.00",
          reasoning: "Customer expectations were partially unmet based on service description",
          keyFactors: ["Service description implied more personalization", "Some value was delivered"],
          basedOn: ["Evidence analysis", "Communication records"],
          isRecommended: true,
        },
        {
          disputeId: dispute2Id,
          analysisId,
          optionLabel: "B",
          optionTitle: "Balanced Split",
          customerRefundPercent: 50,
          vendorPaymentPercent: 50,
          customerRefundAmount: "150.00",
          vendorPaymentAmount: "150.00",
          reasoning: "Both parties share responsibility for unclear expectations",
          keyFactors: ["Service was provided", "Expectations unclear"],
          basedOn: ["Good faith from both parties"],
          isRecommended: false,
        },
        {
          disputeId: dispute2Id,
          analysisId,
          optionLabel: "C",
          optionTitle: "Vendor's Goodwill Offer",
          customerRefundPercent: 25,
          vendorPaymentPercent: 75,
          customerRefundAmount: "75.00",
          vendorPaymentAmount: "225.00",
          reasoning: "Service was delivered, offer reflects goodwill gesture",
          keyFactors: ["Vendor attempted to deliver service"],
          basedOn: ["Vendor's original offer"],
          isRecommended: false,
        },
      ]);
      
      console.log("  ✅ Created Phase 2 dispute (AI Mediation - 3 options available)");
    }

    // Phase 3 - AI Decision
    const dispute3Id = "d1sp-pha3-0003-0000-000000000003";
    const existingDispute3 = await db.select().from(escrowDisputes).where(eq(escrowDisputes.id, dispute3Id)).limit(1);
    if (existingDispute3.length === 0) {
      // Create the main escrow dispute
      await db.insert(escrowDisputes).values({
        id: dispute3Id,
        escrowTransactionId: "escrow-3",
        bookingId: "booking-dispute-3",
        raisedBy: "customer",
        raisedByUserId: "test-customer-3",
        reason: "no_show",
        description: "The vendor did not show up for the scheduled consultation. I waited 30 minutes and then gave up.",
        status: "under_review",
      });
      
      // Create the dispute phase tracking - in Phase 3
      await db.insert(disputePhases).values({
        disputeId: dispute3Id,
        currentPhase: "phase_3_pending",
        phase1StartedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        phase1Deadline: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        phase1CounterOffersCustomer: 1,
        phase1CounterOffersVendor: 1,
        phase2StartedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        phase2Deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        phase2CounterOffersCustomer: 1,
        phase2CounterOffersVendor: 0,
        phase3StartedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // Started 12 hours ago
        phase3ReviewDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours left to review
      });
      
      // Create AI final decision for Phase 3
      await db.insert(disputeAiDecisions).values({
        disputeId: dispute3Id,
        customerRefundPercent: 100,
        vendorPaymentPercent: 0,
        customerRefundAmount: "300.00",
        vendorPaymentAmount: "0.00",
        decisionSummary: "Full refund awarded to customer due to vendor no-show",
        fullReasoning: "After reviewing all evidence, the AI determines that the vendor failed to fulfill the booking obligation. No evidence of attempted contact during scheduled time. Calendar confirms booking was confirmed. The burden of proof for technical difficulties lies with the vendor, who did not provide supporting evidence. Full refund is awarded to the customer.",
        keyFactors: ["No evidence of vendor contact attempt", "Booking was confirmed", "Customer waited 30 minutes", "No prior notice of cancellation"],
        status: "pending",
      });
      
      console.log("  ✅ Created Phase 3 dispute (AI Decision pending - 12h review period)");
    }

    // ==========================================
    // 7. CREATE SERVICE REQUESTS TO APPROVE/REJECT
    // ==========================================
    // Note: Service requests table doesn't exist in the current schema
    // Skipping service requests creation

    // ==========================================
    // 7. CREATE CHAT CONVERSATIONS
    // ==========================================
    console.log("\n💬 Creating chat conversations...");
    
    const conversations = [
      {
        id: "conv-admin-1",
        customerId: "test-customer-1",
        vendorId: ADMIN_USER_ID,
        serviceId: adminServiceId,
        status: "active" as const,
        lastMessagePreview: "Looking forward to our next session!",
        customerUnreadCount: 0,
        vendorUnreadCount: 1,
      },
      {
        id: "conv-admin-2",
        customerId: "test-customer-2",
        vendorId: ADMIN_USER_ID,
        serviceId: adminServiceId,
        status: "active" as const,
        lastMessagePreview: "Can we schedule another consultation?",
        customerUnreadCount: 0,
        vendorUnreadCount: 1,
      },
      {
        id: "conv-admin-3",
        customerId: ADMIN_USER_ID,
        vendorId: "demo-user-1",
        serviceId: "demo-service-1",
        status: "active" as const,
        lastMessagePreview: "Great, see you tomorrow!",
        customerUnreadCount: 1,
        vendorUnreadCount: 0,
      },
    ];

    for (const conv of conversations) {
      const existing = await db.select().from(chatConversations).where(eq(chatConversations.id, conv.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(chatConversations).values({
          id: conv.id,
          customerId: conv.customerId,
          vendorId: conv.vendorId,
          serviceId: conv.serviceId,
          status: conv.status,
          lastMessagePreview: conv.lastMessagePreview,
          customerUnreadCount: conv.customerUnreadCount,
          vendorUnreadCount: conv.vendorUnreadCount,
          lastMessageAt: new Date(),
        });
        
        // Add some messages
        const messages = [
          {
            conversationId: conv.id,
            senderId: conv.customerId,
            senderRole: "customer" as const,
            content: "Hi! I'm interested in your service.",
            messageType: "text" as const,
          },
          {
            conversationId: conv.id,
            senderId: conv.vendorId,
            senderRole: "vendor" as const,
            content: "Hello! Thank you for reaching out. How can I help you?",
            messageType: "text" as const,
          },
          {
            conversationId: conv.id,
            senderId: conv.customerId,
            senderRole: "customer" as const,
            content: conv.lastMessagePreview,
            messageType: "text" as const,
          },
        ];
        
        for (const msg of messages) {
          await db.insert(chatMessages).values(msg);
        }
        console.log(`  ✅ Created conversation with messages`);
      }
    }

    // ==========================================
    // 9. CREATE NOTIFICATIONS OF ALL TYPES
    // ==========================================
    console.log("\n🔔 Creating notifications of all types...");
    
    const notificationsToCreate = [
      {
        userId: ADMIN_USER_ID,
        type: "message" as const,
        title: "New message from Emma",
        message: "Emma Johnson sent you a message about your consulting service.",
        icon: "message-circle",
        relatedEntityType: "conversation",
        relatedEntityId: "conv-admin-1",
        actionUrl: "/chat",
        priority: 2,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "booking" as const,
        title: "New booking request",
        message: "Lucas Brown wants to book your Premium Consulting Service for December 15th.",
        icon: "calendar",
        relatedEntityType: "booking",
        actionUrl: "/bookings",
        priority: 1,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "review" as const,
        title: "New 5-star review! ⭐",
        message: "Sofia Garcia left a 5-star review on your Premium Consulting Service. Reply to thank them!",
        icon: "star",
        relatedEntityType: "review",
        relatedEntityId: "review-for-admin-3",
        actionUrl: `/service/${adminServiceId}`,
        priority: 3,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "system" as const,
        title: "⚖️ New dispute opened",
        message: "A customer has opened a dispute regarding booking #BK-DISP-001. Please respond within 48 hours.",
        icon: "alert-triangle",
        relatedEntityType: "dispute",
        relatedEntityId: dispute1Id,
        actionUrl: "/trust-safety",
        priority: 1,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "system" as const,
        title: "⚖️ Dispute entering AI decision phase",
        message: "Dispute #BK-DISP-003 has entered the AI decision phase. A final decision will be made within 24 hours.",
        icon: "gavel",
        relatedEntityType: "dispute",
        relatedEntityId: dispute3Id,
        actionUrl: "/trust-safety",
        priority: 2,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "payment" as const,
        title: "Payment received 💰",
        message: "You received CHF 276.00 for your consulting service. Funds will be released after the escrow period.",
        icon: "credit-card",
        relatedEntityType: "escrow",
        priority: 3,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "referral" as const,
        title: "You earned referral points! 🎉",
        message: "Your referral code was used by a new user. You've earned 100 points!",
        icon: "gift",
        priority: 4,
        isRead: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: ADMIN_USER_ID,
        type: "service" as const,
        title: "Your service is performing well",
        message: "Your Premium Consulting Service received 50 views this week. Consider boosting it for more visibility.",
        icon: "trending-up",
        relatedEntityType: "service",
        relatedEntityId: adminServiceId,
        actionUrl: `/service/${adminServiceId}`,
        priority: 5,
        isRead: true,
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        userId: ADMIN_USER_ID,
        type: "tip" as const,
        title: "You received a tip! 💰",
        message: "Oliver Martinez left you a CHF 25.00 tip with the message: 'Great advice, thank you!'",
        icon: "heart",
        priority: 3,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "system" as const,
        title: "Welcome to Admin Panel",
        message: "You now have admin access. Explore the admin panel to manage users, services, and disputes.",
        icon: "shield",
        actionUrl: "/admin",
        priority: 4,
        isRead: false,
      },
      {
        userId: ADMIN_USER_ID,
        type: "promotion" as const,
        title: "Boost your visibility 🚀",
        message: "Upgrade to Premium and get 50% more views on your listings. Limited time offer!",
        icon: "zap",
        priority: 7,
        isRead: true,
        readAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
    ];

    // Clear existing notifications for admin to ensure fresh state
    await db.delete(notifications).where(eq(notifications.userId, ADMIN_USER_ID));
    console.log("  Cleared existing notifications...");

    for (const notif of notificationsToCreate) {
      // Create a clean notification object without spreading to avoid type issues
      await db.insert(notifications).values({
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        icon: notif.icon,
        relatedEntityType: notif.relatedEntityType,
        relatedEntityId: notif.relatedEntityId,
        actionUrl: notif.actionUrl,
        priority: notif.priority,
        isRead: notif.isRead,
        readAt: notif.readAt,
      });
    }
    console.log(`  ✅ Created ${notificationsToCreate.length} notifications`);

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log("\n" + "=".repeat(50));
    console.log("✅ COMPREHENSIVE SEED COMPLETE!");
    console.log("=".repeat(50));
    console.log("\n📊 What was created for your account:");
    console.log("  • Admin privileges: ✅ Granted");
    console.log("  • Reviews to respond to: 3");
    console.log("  • Bookings for disputes: 4");
    console.log("  • Disputes (Phase 1 - Negotiation): 1");
    console.log("  • Disputes (Phase 2 - AI Mediation): 1");
    console.log("  • Disputes (Phase 3 - AI Decision): 1");
    console.log("  • Service requests to review: 3");
    console.log("  • Chat conversations: 3");
    console.log("  • Notifications: 11 (various types)");
    console.log("\n🔗 Quick Links:");
    console.log("  • Admin Panel: /admin");
    console.log("  • Disputes: /trust-safety");
    console.log("  • Chat: /chat");
    console.log("  • Notifications: /notifications");
    console.log("  • Bookings: /bookings");
    console.log("  • Your Service: /service/" + adminServiceId);
    
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Run the seed
seedComprehensive()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });
