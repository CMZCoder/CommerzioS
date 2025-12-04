/**
 * Service Request & Proposal Service
 * 
 * Handles the demand-led marketplace where:
 * - Customers post service requests
 * - Vendors submit structured proposals
 * - Chat is read-only for vendor until customer replies
 * - Proposals expire after 48 hours
 */

import { db } from "./db";
import { eq, and, desc, sql, ne, isNull, or, gt, lt } from "drizzle-orm";
import { users, services, bookings } from "../shared/schema";
import { 
  serviceRequests, 
  proposals, 
  vendorPaymentMethods,
  type ServiceRequest,
  type Proposal,
  type InsertServiceRequest,
  type InsertProposal
} from "../shared/schema-service-requests";
import { vendorStats } from "../shared/schema-vendor-stats";
import { calculateCommission, applyCommissionCredits } from "./commissionService";
import { chargeVendorCommission } from "./vendorChargeService";
import { createNotification } from "./notificationService";

// ============================================
// CONSTANTS
// ============================================

const PROPOSAL_EXPIRY_HOURS = 48;
const DEFAULT_REQUEST_EXPIRY_DAYS = 14;

// ============================================
// SERVICE REQUEST FUNCTIONS
// ============================================

// Helper to safely convert date string to Date object
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return null;
}

/**
 * Create a new service request
 */
export async function createServiceRequest(
  customerId: string,
  data: Omit<InsertServiceRequest, "id" | "customerId" | "createdAt" | "updatedAt">
): Promise<ServiceRequest> {
  // Set default expiry (14 days from now)
  const expiresAt = data.expiresAt 
    ? toDate(data.expiresAt)
    : new Date(Date.now() + DEFAULT_REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Destructure all fields and handle dates explicitly
  const {
    // These fields are handled separately
    preferredDateStart: prefDateStart,
    preferredDateEnd: prefDateEnd,
    publishedAt,
    moderatedAt,
    expiresAt: _expiresAt, // already handled above
    status,
    // All other fields are safe to pass through
    ...safeData
  } = data;

  const [request] = await db
    .insert(serviceRequests)
    .values({
      ...safeData,
      customerId,
      expiresAt: expiresAt!,
      preferredDateStart: toDate(prefDateStart),
      preferredDateEnd: toDate(prefDateEnd),
      publishedAt: toDate(publishedAt),
      moderatedAt: toDate(moderatedAt),
      status: status || "draft",
      moderationStatus: "pending_review",
    })
    .returning();

  console.log(`[ServiceRequest] Created request ${request.id} for customer ${customerId}`);

  return request;
}

/**
 * Publish a service request (make it visible to vendors)
 */
export async function publishServiceRequest(
  requestId: string,
  customerId: string
): Promise<ServiceRequest> {
  const [updated] = await db
    .update(serviceRequests)
    .set({
      status: "open",
      publishedAt: new Date(),
      moderationStatus: "approved", // TODO: Run AI moderation first
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(serviceRequests.id, requestId),
        eq(serviceRequests.customerId, customerId),
        eq(serviceRequests.status, "draft")
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Service request not found or cannot be published");
  }

  console.log(`[ServiceRequest] Published request ${requestId}`);

  return updated;
}

/**
 * Get service requests for vendors to browse
 * Returns fuzzy location only (city, canton) - exact address hidden
 */
export async function getOpenServiceRequests(options: {
  categoryId?: string;
  canton?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  requests: Array<Omit<ServiceRequest, "locationAddress">>;
  total: number;
}> {
  const { categoryId, canton, limit = 20, offset = 0 } = options;

  // Build where conditions
  const conditions = [
    eq(serviceRequests.status, "open"),
    eq(serviceRequests.moderationStatus, "approved"),
    gt(serviceRequests.expiresAt, new Date()),
  ];

  if (categoryId) {
    conditions.push(eq(serviceRequests.categoryId, categoryId));
  }

  if (canton) {
    conditions.push(eq(serviceRequests.locationCanton, canton));
  }

  // Get requests without exact address
  const requests = await db
    .select({
      id: serviceRequests.id,
      customerId: serviceRequests.customerId,
      title: serviceRequests.title,
      description: serviceRequests.description,
      categoryId: serviceRequests.categoryId,
      subcategoryId: serviceRequests.subcategoryId,
      budgetMin: serviceRequests.budgetMin,
      budgetMax: serviceRequests.budgetMax,
      budgetFlexible: serviceRequests.budgetFlexible,
      preferredDateStart: serviceRequests.preferredDateStart,
      preferredDateEnd: serviceRequests.preferredDateEnd,
      flexibleDates: serviceRequests.flexibleDates,
      urgency: serviceRequests.urgency,
      // Fuzzy location only
      locationCity: serviceRequests.locationCity,
      locationCanton: serviceRequests.locationCanton,
      locationPostalCode: serviceRequests.locationPostalCode,
      locationRadiusKm: serviceRequests.locationRadiusKm,
      serviceAtCustomerLocation: serviceRequests.serviceAtCustomerLocation,
      attachmentUrls: serviceRequests.attachmentUrls,
      status: serviceRequests.status,
      moderationStatus: serviceRequests.moderationStatus,
      moderationReason: serviceRequests.moderationReason,
      moderatedAt: serviceRequests.moderatedAt,
      publishedAt: serviceRequests.publishedAt,
      expiresAt: serviceRequests.expiresAt,
      viewCount: serviceRequests.viewCount,
      proposalCount: serviceRequests.proposalCount,
      createdAt: serviceRequests.createdAt,
      updatedAt: serviceRequests.updatedAt,
    })
    .from(serviceRequests)
    .where(and(...conditions))
    .orderBy(desc(serviceRequests.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(serviceRequests)
    .where(and(...conditions));

  return {
    requests: requests as Array<Omit<ServiceRequest, "locationAddress">>,
    total: Number(count),
  };
}

/**
 * Get customer's own service requests
 */
export async function getMyServiceRequests(
  customerId: string
): Promise<ServiceRequest[]> {
  const requests = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.customerId, customerId))
    .orderBy(desc(serviceRequests.createdAt));

  return requests;
}

/**
 * Get a service request by ID (public view - no address)
 */
export async function getServiceRequestById(
  requestId: string
): Promise<Omit<ServiceRequest, "locationAddress" | "locationLat" | "locationLng"> | null> {
  const [request] = await db
    .select({
      id: serviceRequests.id,
      customerId: serviceRequests.customerId,
      title: serviceRequests.title,
      description: serviceRequests.description,
      categoryId: serviceRequests.categoryId,
      subcategoryId: serviceRequests.subcategoryId,
      budgetMin: serviceRequests.budgetMin,
      budgetMax: serviceRequests.budgetMax,
      budgetFlexible: serviceRequests.budgetFlexible,
      preferredDateStart: serviceRequests.preferredDateStart,
      preferredDateEnd: serviceRequests.preferredDateEnd,
      flexibleDates: serviceRequests.flexibleDates,
      urgency: serviceRequests.urgency,
      locationCity: serviceRequests.locationCity,
      locationCanton: serviceRequests.locationCanton,
      locationPostalCode: serviceRequests.locationPostalCode,
      locationRadiusKm: serviceRequests.locationRadiusKm,
      serviceAtCustomerLocation: serviceRequests.serviceAtCustomerLocation,
      attachmentUrls: serviceRequests.attachmentUrls,
      status: serviceRequests.status,
      moderationStatus: serviceRequests.moderationStatus,
      moderationReason: serviceRequests.moderationReason,
      moderatedAt: serviceRequests.moderatedAt,
      publishedAt: serviceRequests.publishedAt,
      expiresAt: serviceRequests.expiresAt,
      viewCount: serviceRequests.viewCount,
      proposalCount: serviceRequests.proposalCount,
      createdAt: serviceRequests.createdAt,
      updatedAt: serviceRequests.updatedAt,
    })
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  return request || null;
}

/**
 * Get vendor's proposals (alias for getVendorProposals)
 */
export async function getMyProposals(
  vendorId: string
): Promise<Array<Proposal & { request: ServiceRequest }>> {
  return getVendorProposals(vendorId);
}

/**
 * Get service request with full details (for customer or accepted vendor)
 */
export async function getServiceRequestFull(
  requestId: string,
  userId: string
): Promise<ServiceRequest | null> {
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!request) return null;

  // Customer can always see full details
  if (request.customerId === userId) {
    return request;
  }

  // Check if vendor has an accepted proposal
  const [acceptedProposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.serviceRequestId, requestId),
        eq(proposals.vendorId, userId),
        eq(proposals.status, "accepted")
      )
    )
    .limit(1);

  if (acceptedProposal) {
    return request; // Vendor with accepted proposal can see full address
  }

  // Otherwise return without exact address
  return {
    ...request,
    locationAddress: null,
    locationLat: null,
    locationLng: null,
  } as ServiceRequest;
}

/**
 * Increment view count for a service request
 */
export async function incrementRequestViewCount(requestId: string): Promise<void> {
  await db
    .update(serviceRequests)
    .set({
      viewCount: sql`${serviceRequests.viewCount} + 1`,
    })
    .where(eq(serviceRequests.id, requestId));
}

// ============================================
// PROPOSAL FUNCTIONS
// ============================================

/**
 * Check if vendor can submit a Cash/TWINT proposal
 * Requires valid payment method on file
 */
export async function canVendorBidCash(vendorId: string): Promise<{
  canBid: boolean;
  reason?: string;
}> {
  // Check if vendor has a valid payment method
  const [paymentMethod] = await db
    .select()
    .from(vendorPaymentMethods)
    .where(eq(vendorPaymentMethods.vendorId, vendorId))
    .limit(1);

  if (!paymentMethod) {
    return {
      canBid: false,
      reason: "You must add a card to bid on Cash/TWINT jobs. This allows us to charge commission when the booking is confirmed.",
    };
  }

  if (!paymentMethod.defaultPaymentMethodId) {
    return {
      canBid: false,
      reason: "Your payment method is not fully set up. Please complete the setup to bid on Cash/TWINT jobs.",
    };
  }

  if (!paymentMethod.isValid) {
    return {
      canBid: false,
      reason: `Your payment method is invalid: ${paymentMethod.validationError || "Please update your card"}`,
    };
  }

  // Check for outstanding debts
  const stats = await db
    .select()
    .from(vendorStats)
    .where(eq(vendorStats.userId, vendorId))
    .limit(1);

  if (stats[0]?.cashPrivilegesSuspended) {
    return {
      canBid: false,
      reason: stats[0].cashPrivilegesSuspendedReason || "Cash bidding privileges suspended due to dispute history",
    };
  }

  return { canBid: true };
}

/**
 * Submit a proposal for a service request
 */
export async function submitProposal(
  vendorId: string,
  data: {
    serviceRequestId: string;
    serviceId?: string;
    price: number;
    priceBreakdown?: InsertProposal["priceBreakdown"];
    paymentMethod: "card" | "twint" | "cash";
    paymentTiming: "upfront" | "on_completion";
    coverLetter: string;
    estimatedDuration?: string;
    proposedDate?: Date;
    proposedDateEnd?: Date;
    attachmentUrls?: string[];
  }
): Promise<Proposal> {
  // Check if request exists and is open
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.id, data.serviceRequestId),
        eq(serviceRequests.status, "open")
      )
    )
    .limit(1);

  if (!request) {
    throw new Error("Service request not found or not accepting proposals");
  }

  // Vendor cannot bid on their own request
  if (request.customerId === vendorId) {
    throw new Error("You cannot submit a proposal for your own request");
  }

  // Check if vendor already has a proposal for this request
  const [existingProposal] = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.serviceRequestId, data.serviceRequestId),
        eq(proposals.vendorId, vendorId),
        ne(proposals.status, "withdrawn"),
        ne(proposals.status, "rejected"),
        ne(proposals.status, "expired")
      )
    )
    .limit(1);

  if (existingProposal) {
    throw new Error("You already have an active proposal for this request");
  }

  // For Cash/TWINT proposals, verify vendor has payment method
  if (data.paymentMethod === "cash" || data.paymentMethod === "twint") {
    const cashCheck = await canVendorBidCash(vendorId);
    if (!cashCheck.canBid) {
      throw new Error(cashCheck.reason);
    }
  }

  // Calculate expiry (48 hours from now)
  const expiresAt = new Date(Date.now() + PROPOSAL_EXPIRY_HOURS * 60 * 60 * 1000);

  // Create proposal
  const [proposal] = await db
    .insert(proposals)
    .values({
      serviceRequestId: data.serviceRequestId,
      vendorId,
      serviceId: data.serviceId,
      price: data.price.toFixed(2),
      priceBreakdown: data.priceBreakdown,
      paymentMethod: data.paymentMethod,
      paymentTiming: data.paymentTiming,
      coverLetter: data.coverLetter,
      estimatedDuration: data.estimatedDuration,
      proposedDate: data.proposedDate,
      proposedDateEnd: data.proposedDateEnd,
      attachmentUrls: data.attachmentUrls || [],
      status: "pending",
      expiresAt,
    })
    .returning();

  // Update proposal count on request
  await db
    .update(serviceRequests)
    .set({
      proposalCount: sql`${serviceRequests.proposalCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, data.serviceRequestId));

  // Notify customer
  await createNotification({
    userId: request.customerId,
    type: "service",
    title: "New Proposal Received",
    message: `A vendor has submitted a proposal for "${request.title}"`,
    metadata: {
      type: "new_proposal",
      requestId: data.serviceRequestId,
      proposalId: proposal.id,
    },
    actionUrl: `/service-requests?requestId=${data.serviceRequestId}&proposals=true`,
  });

  console.log(`[Proposal] Vendor ${vendorId} submitted proposal ${proposal.id} for request ${data.serviceRequestId}`);

  return proposal;
}

/**
 * Withdraw a proposal (vendor action)
 */
export async function withdrawProposal(
  proposalId: string,
  vendorId: string
): Promise<Proposal> {
  const [updated] = await db
    .update(proposals)
    .set({
      status: "withdrawn",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(proposals.id, proposalId),
        eq(proposals.vendorId, vendorId),
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        )
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Proposal not found or cannot be withdrawn");
  }

  console.log(`[Proposal] Vendor ${vendorId} withdrew proposal ${proposalId}`);

  return updated;
}

/**
 * Mark proposal as viewed by customer
 */
export async function markProposalViewed(
  proposalId: string,
  customerId: string
): Promise<void> {
  // Verify customer owns the request
  const [proposal] = await db
    .select({
      proposal: proposals,
      request: serviceRequests,
    })
    .from(proposals)
    .innerJoin(serviceRequests, eq(proposals.serviceRequestId, serviceRequests.id))
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposal || proposal.request.customerId !== customerId) {
    return; // Silently fail for non-owners
  }

  if (proposal.proposal.status === "pending") {
    await db
      .update(proposals)
      .set({
        status: "viewed",
        viewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, proposalId));
  }
}

/**
 * Reject a proposal (customer action)
 */
export async function rejectProposal(
  proposalId: string,
  customerId: string,
  reason?: string
): Promise<Proposal> {
  // Verify customer owns the request
  const [proposalWithRequest] = await db
    .select({
      proposal: proposals,
      request: serviceRequests,
    })
    .from(proposals)
    .innerJoin(serviceRequests, eq(proposals.serviceRequestId, serviceRequests.id))
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposalWithRequest || proposalWithRequest.request.customerId !== customerId) {
    throw new Error("Proposal not found or unauthorized");
  }

  const [updated] = await db
    .update(proposals)
    .set({
      status: "rejected",
      rejectionReason: reason,
      respondedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(proposals.id, proposalId),
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        )
      )
    )
    .returning();

  if (!updated) {
    throw new Error("Proposal cannot be rejected");
  }

  // Notify vendor
  await createNotification({
    userId: proposalWithRequest.proposal.vendorId,
    type: "service",
    title: "Proposal Rejected",
    message: `Your proposal for "${proposalWithRequest.request.title}" was not accepted`,
    metadata: {
      type: "proposal_rejected",
      proposalId,
      requestId: proposalWithRequest.request.id,
    },
    actionUrl: `/service-requests`,
  });

  console.log(`[Proposal] Customer ${customerId} rejected proposal ${proposalId}`);

  return updated;
}

/**
 * Accept a proposal and create a booking
 */
export async function acceptProposal(
  proposalId: string,
  customerId: string
): Promise<{ proposal: Proposal; bookingId: string }> {
  // Get proposal with request details
  const [proposalWithRequest] = await db
    .select({
      proposal: proposals,
      request: serviceRequests,
    })
    .from(proposals)
    .innerJoin(serviceRequests, eq(proposals.serviceRequestId, serviceRequests.id))
    .where(eq(proposals.id, proposalId))
    .limit(1);

  if (!proposalWithRequest || proposalWithRequest.request.customerId !== customerId) {
    throw new Error("Proposal not found or unauthorized");
  }

  const { proposal, request } = proposalWithRequest;

  if (proposal.status !== "pending" && proposal.status !== "viewed") {
    throw new Error("Proposal is no longer available for acceptance");
  }

  if (new Date() > proposal.expiresAt) {
    throw new Error("Proposal has expired");
  }

  // For Cash/TWINT + on_completion: Charge commission immediately
  const isCashPayment = proposal.paymentMethod === "cash" || proposal.paymentMethod === "twint";
  const isOnCompletion = proposal.paymentTiming === "on_completion";
  
  let commissionResult = null;
  if (isCashPayment) {
    // Calculate and charge commission
    const bookingAmount = parseFloat(proposal.price);
    const commission = await calculateCommission(proposal.vendorId, bookingAmount);
    
    // Apply credits first
    if (commission.creditsApplied > 0) {
      await applyCommissionCredits(
        proposal.vendorId, 
        commission.creditsApplied,
        proposalId // Use proposalId as reference for now
      );
    }

    // Charge the net commission to vendor's card
    if (commission.netCommission > 0) {
      commissionResult = await chargeVendorCommission(
        proposal.vendorId,
        proposalId,
        bookingAmount,
        proposalId // Will be replaced with actual bookingId
      );

      if (!commissionResult.success && commissionResult.debtCreated) {
        // Commission charge failed but we created a debt record
        // Continue with booking but vendor will have restricted status
        console.warn(`[Proposal] Commission charge failed for vendor ${proposal.vendorId}, debt created`);
      }
    }
  }

  // Update proposal status
  const [updatedProposal] = await db
    .update(proposals)
    .set({
      status: "accepted",
      respondedAt: new Date(),
      commissionAmount: commissionResult ? commissionResult.chargeId ? (await calculateCommission(proposal.vendorId, parseFloat(proposal.price))).grossCommission.toFixed(2) : null : null,
      commissionCharged: commissionResult?.success || false,
      commissionChargeId: commissionResult?.chargeId,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, proposalId))
    .returning();

  // Update request status
  await db
    .update(serviceRequests)
    .set({
      status: "booked",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, request.id));

  // Reject all other pending proposals
  const otherProposals = await db
    .update(proposals)
    .set({
      status: "rejected",
      rejectionReason: "Another proposal was accepted",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(proposals.serviceRequestId, request.id),
        ne(proposals.id, proposalId),
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        )
      )
    )
    .returning();

  // Notify rejected vendors
  for (const rejected of otherProposals) {
    await createNotification({
      userId: rejected.vendorId,
      type: "service",
      title: "Request Fulfilled",
      message: `The request "${request.title}" was fulfilled by another vendor`,
      metadata: {
        type: "request_fulfilled",
        proposalId: rejected.id,
        requestId: request.id,
      },
      actionUrl: `/service-requests`,
    });
  }

  // TODO: Create actual booking using existing createBooking flow
  // For now, return a placeholder
  const bookingId = `booking_${Date.now()}`; // Placeholder

  // Notify vendor of acceptance
  await createNotification({
    userId: proposal.vendorId,
    type: "booking",
    title: "Proposal Accepted! 🎉",
    message: `Your proposal for "${request.title}" was accepted!`,
    metadata: {
      type: "proposal_accepted",
      proposalId,
      requestId: request.id,
      bookingId,
    },
    actionUrl: `/bookings`,
  });

  console.log(`[Proposal] Customer ${customerId} accepted proposal ${proposalId}, booking ${bookingId} created`);

  return {
    proposal: updatedProposal,
    bookingId,
  };
}

/**
 * Get proposals for a service request (customer view)
 */
export async function getProposalsForRequest(
  requestId: string,
  customerId: string
): Promise<Array<Proposal & { vendor: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null; averageRating: string | null } }>> {
  // Verify customer owns the request
  const [request] = await db
    .select()
    .from(serviceRequests)
    .where(
      and(
        eq(serviceRequests.id, requestId),
        eq(serviceRequests.customerId, customerId)
      )
    )
    .limit(1);

  if (!request) {
    throw new Error("Service request not found or unauthorized");
  }

  const results = await db
    .select({
      proposal: proposals,
      vendor: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
      },
      vendorStats: {
        averageRating: vendorStats.averageRating,
      },
    })
    .from(proposals)
    .innerJoin(users, eq(proposals.vendorId, users.id))
    .leftJoin(vendorStats, eq(proposals.vendorId, vendorStats.userId))
    .where(eq(proposals.serviceRequestId, requestId))
    .orderBy(desc(proposals.createdAt));

  return results.map(r => ({
    ...r.proposal,
    vendor: {
      ...r.vendor,
      averageRating: r.vendorStats?.averageRating || null,
    },
  }));
}

/**
 * Get vendor's proposals
 */
export async function getVendorProposals(
  vendorId: string,
  status?: "pending" | "viewed" | "accepted" | "rejected" | "withdrawn" | "expired"
): Promise<Array<Proposal & { request: ServiceRequest }>> {
  const conditions = [eq(proposals.vendorId, vendorId)];
  
  if (status) {
    conditions.push(eq(proposals.status, status));
  }

  const results = await db
    .select({
      proposal: proposals,
      request: serviceRequests,
    })
    .from(proposals)
    .innerJoin(serviceRequests, eq(proposals.serviceRequestId, serviceRequests.id))
    .where(and(...conditions))
    .orderBy(desc(proposals.createdAt));

  return results.map(r => ({
    ...r.proposal,
    request: r.request,
  }));
}

// ============================================
// EXPIRY MANAGEMENT
// ============================================

/**
 * Expire stale proposals (run via cron)
 */
export async function expireStaleProposals(): Promise<number> {
  const expired = await db
    .update(proposals)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        ),
        lt(proposals.expiresAt, new Date())
      )
    )
    .returning();

  if (expired.length > 0) {
    console.log(`[Proposal] Expired ${expired.length} stale proposals`);
    
    // Notify vendors
    for (const proposal of expired) {
      await createNotification({
        userId: proposal.vendorId,
        type: "service",
        title: "Proposal Expired",
        message: "Your proposal expired without a response",
        metadata: {
          type: "proposal_expired",
          proposalId: proposal.id,
        },
        actionUrl: `/service-requests`,
      });
    }
  }

  return expired.length;
}

/**
 * Expire stale service requests (run via cron)
 */
export async function expireStaleRequests(): Promise<number> {
  const expired = await db
    .update(serviceRequests)
    .set({
      status: "expired",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(serviceRequests.status, "open"),
        lt(serviceRequests.expiresAt, new Date())
      )
    )
    .returning();

  if (expired.length > 0) {
    console.log(`[ServiceRequest] Expired ${expired.length} stale requests`);
    
    // Notify customers
    for (const request of expired) {
      await createNotification({
        userId: request.customerId,
        type: "service",
        title: "Request Expired",
        message: `Your request "${request.title}" has expired`,
        metadata: {
          type: "request_expired",
          requestId: request.id,
        },
        actionUrl: `/service-requests`,
      });
    }

    // Also expire any pending proposals on these requests
    for (const request of expired) {
      await db
        .update(proposals)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(proposals.serviceRequestId, request.id),
            or(
              eq(proposals.status, "pending"),
              eq(proposals.status, "viewed")
            )
          )
        );
    }
  }

  return expired.length;
}

/**
 * Update a service request (only if owned by customer and still editable)
 */
export async function updateServiceRequest(
  requestId: string,
  customerId: string,
  data: Partial<Pick<ServiceRequest, 'title' | 'description' | 'budgetMin' | 'budgetMax' | 'budgetFlexible' | 'categoryId' | 'subcategoryId' | 'urgency' | 'locationCity' | 'locationCanton' | 'preferredDateStart' | 'preferredDateEnd' | 'flexibleDates'>>
): Promise<ServiceRequest> {
  // Check ownership and status
  const [existing] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!existing) {
    throw new Error("Service request not found");
  }
  
  if (existing.customerId !== customerId) {
    throw new Error("You can only edit your own requests");
  }
  
  // Can only edit if draft or open
  if (existing.status !== "draft" && existing.status !== "open") {
    throw new Error("Cannot edit a request that is no longer active");
  }

  const [updated] = await db
    .update(serviceRequests)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId))
    .returning();

  console.log(`[ServiceRequest] Updated request ${requestId}`);
  return updated;
}

/**
 * Deactivate (suspend) a service request - hides it from public but keeps proposals
 */
export async function deactivateServiceRequest(
  requestId: string,
  customerId: string
): Promise<ServiceRequest> {
  // Check ownership
  const [existing] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!existing) {
    throw new Error("Service request not found");
  }
  
  if (existing.customerId !== customerId) {
    throw new Error("You can only deactivate your own requests");
  }
  
  if (existing.status !== "open" && existing.status !== "draft") {
    throw new Error("Can only deactivate active requests");
  }

  const [updated] = await db
    .update(serviceRequests)
    .set({
      status: "suspended",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId))
    .returning();

  console.log(`[ServiceRequest] Deactivated request ${requestId}`);
  return updated;
}

/**
 * Reactivate a suspended service request
 */
export async function reactivateServiceRequest(
  requestId: string,
  customerId: string
): Promise<ServiceRequest> {
  const [existing] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!existing) {
    throw new Error("Service request not found");
  }
  
  if (existing.customerId !== customerId) {
    throw new Error("You can only reactivate your own requests");
  }
  
  if (existing.status !== "suspended") {
    throw new Error("Can only reactivate suspended requests");
  }

  const [updated] = await db
    .update(serviceRequests)
    .set({
      status: "open",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId))
    .returning();

  console.log(`[ServiceRequest] Reactivated request ${requestId}`);
  return updated;
}

/**
 * Delete a service request - also cancels all pending proposals
 */
export async function deleteServiceRequest(
  requestId: string,
  customerId: string
): Promise<void> {
  // Check ownership
  const [existing] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, requestId))
    .limit(1);

  if (!existing) {
    throw new Error("Service request not found");
  }
  
  if (existing.customerId !== customerId) {
    throw new Error("You can only delete your own requests");
  }
  
  // Cannot delete if a proposal was accepted (booking created)
  if (existing.status === "booked") {
    throw new Error("Cannot delete a request with an accepted booking");
  }

  // Get pending proposals to notify vendors
  const pendingProposals = await db
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.serviceRequestId, requestId),
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        )
      )
    );

  // Notify vendors of cancelled proposals
  for (const proposal of pendingProposals) {
    await createNotification({
      userId: proposal.vendorId,
      type: "service",
      title: "Request Cancelled",
      message: `The customer has cancelled their request "${existing.title}"`,
      metadata: {
        type: "request_cancelled",
        requestId: requestId,
        proposalId: proposal.id,
      },
      actionUrl: `/service-requests`,
    });
  }

  // Update request status to cancelled (soft delete to preserve history)
  await db
    .update(serviceRequests)
    .set({
      status: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(serviceRequests.id, requestId));

  // Mark all pending proposals as expired/withdrawn
  await db
    .update(proposals)
    .set({
      status: "withdrawn",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(proposals.serviceRequestId, requestId),
        or(
          eq(proposals.status, "pending"),
          eq(proposals.status, "viewed")
        )
      )
    );

  console.log(`[ServiceRequest] Deleted request ${requestId}, notified ${pendingProposals.length} vendors`);
}
