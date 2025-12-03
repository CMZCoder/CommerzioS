/**
 * Booking & Calendar Service
 * 
 * Handles all booking-related operations including:
 * - Vendor availability settings
 * - Calendar blocking (manual blocks, holidays)
 * - Booking requests and responses
 * - Queue management
 * - Double-booking prevention
 */

import { db } from './db';
import { 
  bookings, 
  vendorAvailabilitySettings, 
  vendorCalendarBlocks,
  services,
  users,
  InsertBooking,
  InsertVendorAvailabilitySettings,
  InsertVendorCalendarBlock
} from '../shared/schema';
import { eq, and, or, gte, lte, sql, desc, asc, isNull, ne } from 'drizzle-orm';
import { createNotification, notifyBookingCreated } from './notificationService';

// ===========================================
// BOOKING NOTIFICATION HELPER
// ===========================================

/**
 * Send booking notification to the appropriate party
 */
async function sendBookingNotification(
  booking: typeof bookings.$inferSelect,
  status: 'pending' | 'accepted' | 'rejected' | 'alternative_proposed' | 'confirmed' | 'cancelled',
  cancelledBy?: 'customer' | 'vendor'
): Promise<void> {
  try {
    const [service] = await db.select({ title: services.title })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);
    
    const serviceName = service?.title || 'Service';
    let recipientId: string;
    let title: string;
    let message: string;

    switch (status) {
      case 'pending':
        recipientId = booking.vendorId;
        title = 'New Booking Request';
        message = `You have a new booking request for "${serviceName}"`;
        break;
      case 'accepted':
        recipientId = booking.customerId;
        title = 'Booking Accepted';
        message = `Your booking for "${serviceName}" has been accepted`;
        break;
      case 'rejected':
        recipientId = booking.customerId;
        title = 'Booking Declined';
        message = `Your booking for "${serviceName}" was declined${booking.rejectionReason ? `: ${booking.rejectionReason}` : ''}`;
        break;
      case 'alternative_proposed':
        recipientId = booking.customerId;
        title = 'Alternative Time Proposed';
        message = `The vendor proposed an alternative time for "${serviceName}"`;
        break;
      case 'confirmed':
        recipientId = booking.vendorId;
        title = 'Booking Confirmed';
        message = `Customer confirmed the booking for "${serviceName}"`;
        break;
      case 'cancelled':
        recipientId = cancelledBy === 'customer' ? booking.vendorId : booking.customerId;
        title = 'Booking Cancelled';
        message = `Booking for "${serviceName}" was cancelled`;
        break;
      default:
        return;
    }

    await createNotification({
      userId: recipientId,
      type: 'booking',
      title,
      message,
      actionUrl: `/bookings/${booking.id}`,
      relatedEntityId: booking.id,
      relatedEntityType: 'booking',
    });
  } catch (error) {
    console.error('Failed to send booking notification:', error);
  }
}

// ===========================================
// BOOKING NUMBER GENERATION
// ===========================================

/**
 * Generate a unique booking number
 */
export async function generateBookingNumber(): Promise<string> {
  const prefix = 'BK';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// ===========================================
// VENDOR AVAILABILITY SETTINGS
// ===========================================

/**
 * Get vendor availability settings
 */
export async function getVendorAvailabilitySettings(userId: string) {
  const [settings] = await db.select()
    .from(vendorAvailabilitySettings)
    .where(eq(vendorAvailabilitySettings.userId, userId))
    .limit(1);
  
  return settings;
}

/**
 * Create or update vendor availability settings
 */
export async function upsertVendorAvailabilitySettings(
  userId: string, 
  data: Partial<InsertVendorAvailabilitySettings>
) {
  const existing = await getVendorAvailabilitySettings(userId);
  
  if (existing) {
    const [updated] = await db.update(vendorAvailabilitySettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendorAvailabilitySettings.userId, userId))
      .returning();
    return updated;
  } else {
    const [created] = await db.insert(vendorAvailabilitySettings)
      .values({ userId, ...data })
      .returning();
    return created;
  }
}

/**
 * Default working hours structure
 */
export function getDefaultWorkingHours() {
  return {
    mon: { start: '09:00', end: '17:00', enabled: true },
    tue: { start: '09:00', end: '17:00', enabled: true },
    wed: { start: '09:00', end: '17:00', enabled: true },
    thu: { start: '09:00', end: '17:00', enabled: true },
    fri: { start: '09:00', end: '17:00', enabled: true },
    sat: { start: '10:00', end: '14:00', enabled: false },
    sun: { start: null, end: null, enabled: false },
  };
}

// ===========================================
// CALENDAR BLOCKS
// ===========================================

/**
 * Get calendar blocks for a vendor
 */
export async function getVendorCalendarBlocks(
  userId: string, 
  startDate: Date, 
  endDate: Date,
  serviceId?: string
) {
  const query = db.select()
    .from(vendorCalendarBlocks)
    .where(
      and(
        eq(vendorCalendarBlocks.userId, userId),
        eq(vendorCalendarBlocks.isActive, true),
        lte(vendorCalendarBlocks.startTime, endDate),
        gte(vendorCalendarBlocks.endTime, startDate),
        // Include blocks for this specific service OR all services (null)
        serviceId 
          ? or(
              eq(vendorCalendarBlocks.serviceId, serviceId),
              isNull(vendorCalendarBlocks.serviceId)
            )
          : undefined
      )
    )
    .orderBy(asc(vendorCalendarBlocks.startTime));
  
  return await query;
}

/**
 * Create a calendar block
 */
export async function createCalendarBlock(
  userId: string,
  data: Omit<InsertVendorCalendarBlock, 'userId'>
) {
  // Validate times
  if (new Date(data.startTime) >= new Date(data.endTime)) {
    throw new Error('End time must be after start time');
  }

  const [block] = await db.insert(vendorCalendarBlocks)
    .values({ userId, ...data })
    .returning();
  
  return block;
}

/**
 * Update a calendar block
 */
export async function updateCalendarBlock(
  blockId: string,
  userId: string,
  data: Partial<InsertVendorCalendarBlock>
) {
  const [block] = await db.update(vendorCalendarBlocks)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(vendorCalendarBlocks.id, blockId),
        eq(vendorCalendarBlocks.userId, userId)
      )
    )
    .returning();
  
  return block;
}

/**
 * Delete a calendar block
 */
export async function deleteCalendarBlock(blockId: string, userId: string) {
  const [deleted] = await db.delete(vendorCalendarBlocks)
    .where(
      and(
        eq(vendorCalendarBlocks.id, blockId),
        eq(vendorCalendarBlocks.userId, userId)
      )
    )
    .returning();
  
  return deleted;
}

// ===========================================
// AVAILABILITY CHECKING
// ===========================================

interface TimeSlot {
  start: Date;
  end: Date;
}

/**
 * Check if a time slot is available for a vendor
 */
export async function isTimeSlotAvailable(
  vendorId: string,
  serviceId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
): Promise<{ available: boolean; reason?: string }> {
  // 1. Check calendar blocks
  const blocks = await getVendorCalendarBlocks(vendorId, startTime, endTime, serviceId);
  
  for (const block of blocks) {
    if (doTimesOverlap(startTime, endTime, block.startTime, block.endTime)) {
      return { 
        available: false, 
        reason: `Time blocked: ${block.title || block.blockType}` 
      };
    }
  }

  // 2. Check existing bookings
  const existingBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        // Only check active/confirmed bookings
        sql`${bookings.status} IN ('pending', 'accepted', 'confirmed', 'in_progress')`,
        // Check for time overlap
        or(
          // New booking starts during existing
          and(
            lte(bookings.confirmedStartTime, startTime),
            gte(bookings.confirmedEndTime, startTime)
          ),
          // New booking ends during existing
          and(
            lte(bookings.confirmedStartTime, endTime),
            gte(bookings.confirmedEndTime, endTime)
          ),
          // New booking contains existing
          and(
            gte(bookings.confirmedStartTime, startTime),
            lte(bookings.confirmedEndTime, endTime)
          )
        ),
        // Exclude current booking if updating
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined
      )
    );

  // Also check requested times for pending bookings
  const pendingBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'pending'),
        or(
          and(
            lte(bookings.requestedStartTime, startTime),
            gte(bookings.requestedEndTime, startTime)
          ),
          and(
            lte(bookings.requestedStartTime, endTime),
            gte(bookings.requestedEndTime, endTime)
          )
        ),
        excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined
      )
    );

  if (existingBookings.length > 0 || pendingBookings.length > 0) {
    return { 
      available: false, 
      reason: 'Time slot already booked' 
    };
  }

  // 3. Check working hours
  const settings = await getVendorAvailabilitySettings(vendorId);
  if (settings?.defaultWorkingHours) {
    const workingHours = settings.defaultWorkingHours as Record<string, any>;
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][startTime.getDay()];
    const daySettings = workingHours[dayOfWeek];
    
    if (!daySettings?.enabled) {
      return { available: false, reason: 'Vendor not available on this day' };
    }
    
    // TODO: Add time-of-day validation if needed
  }

  return { available: true };
}

/**
 * Helper to check if two time ranges overlap
 */
function doTimesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  return start1 < end2 && end1 > start2;
}

/**
 * Get available time slots for a service on a given date
 */
export async function getAvailableSlots(
  serviceId: string,
  date: Date,
  durationMinutes: number = 60,
  pricingOptionId?: string
): Promise<TimeSlot[]> {
  const [service] = await db.select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) {
    throw new Error('Service not found');
  }

  const vendorId = service.ownerId;
  
  // Try to get service-specific availability settings first
  let serviceAvailability: { 
    workingHours?: unknown; 
    defaultSlotDurationMinutes?: number; 
    bufferBetweenBookingsMinutes?: number;
  } | null = null;
  
  try {
    const { serviceAvailabilitySettings } = await import('../shared/schema');
    const [svcAvail] = await db.select()
      .from(serviceAvailabilitySettings)
      .where(eq(serviceAvailabilitySettings.serviceId, serviceId))
      .limit(1);
    serviceAvailability = svcAvail || null;
  } catch {
    // Table may not exist yet, continue with vendor settings
  }
  
  // Fall back to vendor availability settings
  const vendorSettings = await getVendorAvailabilitySettings(vendorId);
  
  // Get duration from pricing option if specified
  let effectiveDuration = durationMinutes;
  if (pricingOptionId) {
    const { servicePricingOptions } = await import('../shared/schema');
    const [pricingOption] = await db.select()
      .from(servicePricingOptions)
      .where(eq(servicePricingOptions.id, pricingOptionId))
      .limit(1);
    
    if (pricingOption?.durationMinutes) {
      effectiveDuration = pricingOption.durationMinutes;
    }
  }
  
  // Priority: service availability > vendor settings > defaults
  const slotDuration = serviceAvailability?.defaultSlotDurationMinutes 
    || vendorSettings?.defaultSlotDurationMinutes 
    || effectiveDuration;
    
  const buffer = serviceAvailability?.bufferBetweenBookingsMinutes 
    || vendorSettings?.bufferBetweenBookingsMinutes 
    || 15;
  
  // Get working hours for the day
  const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
  
  // Priority: service working hours > vendor working hours > defaults
  const workingHours = (serviceAvailability?.workingHours as Record<string, unknown>) 
    || (vendorSettings?.defaultWorkingHours as Record<string, unknown>) 
    || getDefaultWorkingHours();
  const daySettings = workingHours[dayOfWeek] as { enabled?: boolean; start?: string; end?: string } | undefined;
  
  if (!daySettings?.enabled || !daySettings.start || !daySettings.end) {
    return [];
  }

  // Create date range for the day
  const dayStart = new Date(date);
  const [startHour, startMin] = daySettings.start.split(':').map(Number);
  dayStart.setHours(startHour, startMin, 0, 0);
  
  const dayEnd = new Date(date);
  const [endHour, endMin] = daySettings.end.split(':').map(Number);
  dayEnd.setHours(endHour, endMin, 0, 0);

  // Get blocks and existing bookings
  const blocks = await getVendorCalendarBlocks(vendorId, dayStart, dayEnd, serviceId);
  const existingBookings = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        sql`${bookings.status} IN ('pending', 'accepted', 'confirmed', 'in_progress')`,
        gte(sql`COALESCE(${bookings.confirmedStartTime}, ${bookings.requestedStartTime})`, dayStart),
        lte(sql`COALESCE(${bookings.confirmedStartTime}, ${bookings.requestedStartTime})`, dayEnd)
      )
    );

  // Generate available slots
  const slots: TimeSlot[] = [];
  let currentTime = new Date(dayStart);
  
  while (currentTime.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
    
    // Check if slot conflicts with any block or booking
    let isBlocked = false;
    
    for (const block of blocks) {
      if (doTimesOverlap(currentTime, slotEnd, block.startTime, block.endTime)) {
        isBlocked = true;
        break;
      }
    }
    
    if (!isBlocked) {
      for (const booking of existingBookings) {
        const bookingStart = booking.confirmedStartTime || booking.requestedStartTime;
        const bookingEnd = booking.confirmedEndTime || booking.requestedEndTime;
        if (doTimesOverlap(currentTime, slotEnd, bookingStart, bookingEnd)) {
          isBlocked = true;
          break;
        }
      }
    }
    
    if (!isBlocked) {
      slots.push({ start: new Date(currentTime), end: new Date(slotEnd) });
    }
    
    // Move to next slot (considering buffer)
    currentTime = new Date(currentTime.getTime() + (slotDuration + buffer) * 60000);
  }
  
  return slots;
}

// ===========================================
// BOOKING REQUESTS
// ===========================================

/**
 * Create a new booking request
 */
export async function createBookingRequest(data: {
  customerId: string;
  serviceId: string;
  pricingOptionId?: string;
  requestedStartTime: Date;
  requestedEndTime: Date;
  customerMessage?: string;
  customerPhone?: string;
  customerAddress?: string;
}): Promise<typeof bookings.$inferSelect> {
  // Get service to find vendor
  const [service] = await db.select()
    .from(services)
    .where(eq(services.id, data.serviceId))
    .limit(1);

  if (!service) {
    throw new Error('Service not found');
  }

  // Check vendor settings
  const settings = await getVendorAvailabilitySettings(service.ownerId);
  
  // Check minimum notice
  const minNoticeHours = settings?.minBookingNoticeHours || 24;
  const minNoticeTime = new Date(Date.now() + minNoticeHours * 60 * 60 * 1000);
  if (data.requestedStartTime < minNoticeTime) {
    throw new Error(`Booking requires at least ${minNoticeHours} hours notice`);
  }

  // Check maximum advance booking
  const maxAdvanceDays = settings?.maxBookingAdvanceDays || 90;
  const maxAdvanceTime = new Date(Date.now() + maxAdvanceDays * 24 * 60 * 60 * 1000);
  if (data.requestedStartTime > maxAdvanceTime) {
    throw new Error(`Cannot book more than ${maxAdvanceDays} days in advance`);
  }

  // Check availability
  const availability = await isTimeSlotAvailable(
    service.ownerId,
    data.serviceId,
    data.requestedStartTime,
    data.requestedEndTime
  );

  if (!availability.available) {
    throw new Error(availability.reason || 'Time slot not available');
  }

  // Generate booking number
  const bookingNumber = await generateBookingNumber();

  // Determine initial status based on auto-accept setting
  const status = settings?.autoAcceptBookings ? 'accepted' : 'pending';
  const acceptedAt = settings?.autoAcceptBookings ? new Date() : null;
  const confirmedStartTime = settings?.autoAcceptBookings ? data.requestedStartTime : null;
  const confirmedEndTime = settings?.autoAcceptBookings ? data.requestedEndTime : null;

  // Create booking
  const [booking] = await db.insert(bookings)
    .values({
      bookingNumber,
      customerId: data.customerId,
      vendorId: service.ownerId,
      serviceId: data.serviceId,
      pricingOptionId: data.pricingOptionId,
      requestedStartTime: data.requestedStartTime,
      requestedEndTime: data.requestedEndTime,
      confirmedStartTime,
      confirmedEndTime,
      status,
      customerMessage: data.customerMessage,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
      acceptedAt,
    })
    .returning();

  // Get vendor name for notifications
  const [vendor] = await db.select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, service.ownerId))
    .limit(1);
  
  const vendorName = vendor ? `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'the vendor' : 'the vendor';

  // Notify vendor about new booking request (only if pending, not auto-accepted)
  if (status === 'pending') {
    await sendBookingNotification(booking, 'pending');
  } else {
    // If auto-accepted, notify customer
    await sendBookingNotification(booking, 'accepted');
  }

  // Send confirmation notification to customer
  await notifyBookingCreated(
    data.customerId,
    booking.id,
    bookingNumber,
    service.title,
    vendorName,
    data.requestedStartTime,
    status === 'accepted' || status === 'confirmed'
  );

  return booking;
}

/**
 * Accept a booking request
 */
export async function acceptBooking(
  bookingId: string,
  vendorId: string,
  vendorMessage?: string
): Promise<typeof bookings.$inferSelect> {
  const [booking] = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'pending')
      )
    )
    .limit(1);

  if (!booking) {
    throw new Error('Booking not found or cannot be accepted');
  }

  // Verify the slot is still available
  const availability = await isTimeSlotAvailable(
    vendorId,
    booking.serviceId,
    booking.requestedStartTime,
    booking.requestedEndTime,
    bookingId
  );

  if (!availability.available) {
    throw new Error('Time slot is no longer available');
  }

  const [updated] = await db.update(bookings)
    .set({
      status: 'accepted',
      confirmedStartTime: booking.requestedStartTime,
      confirmedEndTime: booking.requestedEndTime,
      vendorMessage,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  await sendBookingNotification(updated, 'accepted');

  return updated;
}

/**
 * Reject a booking request
 */
export async function rejectBooking(
  bookingId: string,
  vendorId: string,
  rejectionReason?: string
): Promise<typeof bookings.$inferSelect> {
  const [updated] = await db.update(bookings)
    .set({
      status: 'rejected',
      rejectionReason,
      vendorMessage: rejectionReason,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'pending')
      )
    )
    .returning();

  if (!updated) {
    throw new Error('Booking not found or cannot be rejected');
  }

  await sendBookingNotification(updated, 'rejected');

  return updated;
}

/**
 * Propose an alternative time for a booking
 */
export async function proposeAlternative(
  bookingId: string,
  vendorId: string,
  alternativeStartTime: Date,
  alternativeEndTime: Date,
  alternativeMessage?: string,
  expiryHours: number = 48
): Promise<typeof bookings.$inferSelect> {
  // Verify the alternative slot is available
  const availability = await isTimeSlotAvailable(
    vendorId,
    (await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1))[0]?.serviceId || '',
    alternativeStartTime,
    alternativeEndTime
  );

  if (!availability.available) {
    throw new Error('Alternative time slot is not available');
  }

  const alternativeExpiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  const [updated] = await db.update(bookings)
    .set({
      status: 'alternative_proposed',
      alternativeStartTime,
      alternativeEndTime,
      alternativeMessage,
      alternativeExpiresAt,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'pending')
      )
    )
    .returning();

  if (!updated) {
    throw new Error('Booking not found or cannot propose alternative');
  }

  await sendBookingNotification(updated, 'alternative_proposed');

  return updated;
}

/**
 * Customer accepts the alternative time
 */
export async function acceptAlternative(
  bookingId: string,
  customerId: string
): Promise<typeof bookings.$inferSelect> {
  const [booking] = await db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.customerId, customerId),
        eq(bookings.status, 'alternative_proposed')
      )
    )
    .limit(1);

  if (!booking) {
    throw new Error('Booking not found or cannot accept alternative');
  }

  // Check if alternative hasn't expired
  if (booking.alternativeExpiresAt && booking.alternativeExpiresAt < new Date()) {
    throw new Error('Alternative proposal has expired');
  }

  const [updated] = await db.update(bookings)
    .set({
      status: 'confirmed',
      confirmedStartTime: booking.alternativeStartTime,
      confirmedEndTime: booking.alternativeEndTime,
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  await sendBookingNotification(updated, 'confirmed');

  return updated;
}

/**
 * Cancel a booking
 */
export async function cancelBooking(
  bookingId: string,
  userId: string,
  cancellationReason?: string
): Promise<typeof bookings.$inferSelect> {
  const [booking] = await db.select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    throw new Error('Booking not found');
  }

  // Determine who is cancelling
  let cancelledBy: 'customer' | 'vendor';
  if (booking.customerId === userId) {
    cancelledBy = 'customer';
  } else if (booking.vendorId === userId) {
    cancelledBy = 'vendor';
  } else {
    throw new Error('Not authorized to cancel this booking');
  }

  // Check if booking can be cancelled
  const cancellableStatuses = ['pending', 'accepted', 'confirmed', 'alternative_proposed'];
  if (!cancellableStatuses.includes(booking.status)) {
    throw new Error('Booking cannot be cancelled');
  }

  const [updated] = await db.update(bookings)
    .set({
      status: 'cancelled',
      cancelledBy,
      cancellationReason,
      cancelledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();

  await sendBookingNotification(updated, 'cancelled', cancelledBy);

  return updated;
}

// ===========================================
// BOOKING RETRIEVAL
// ===========================================

/**
 * Get bookings for a customer
 */
export async function getCustomerBookings(
  customerId: string,
  status?: string,
  limit: number = 20,
  offset: number = 0
) {
  const query = db.select()
    .from(bookings)
    .where(
      and(
        eq(bookings.customerId, customerId),
        status ? eq(bookings.status, status as any) : undefined
      )
    )
    .orderBy(desc(bookings.createdAt))
    .limit(limit)
    .offset(offset);

  return await query;
}

/**
 * Get bookings for a vendor
 */
export async function getVendorBookings(
  vendorId: string,
  status?: string,
  startDate?: Date,
  endDate?: Date,
  limit: number = 20,
  offset: number = 0
) {
  const conditions = [eq(bookings.vendorId, vendorId)];
  
  if (status) {
    conditions.push(eq(bookings.status, status as any));
  }
  
  if (startDate) {
    conditions.push(gte(sql`COALESCE(${bookings.confirmedStartTime}, ${bookings.requestedStartTime})`, startDate));
  }
  
  if (endDate) {
    conditions.push(lte(sql`COALESCE(${bookings.confirmedStartTime}, ${bookings.requestedStartTime})`, endDate));
  }

  return await db.select()
    .from(bookings)
    .where(and(...conditions))
    .orderBy(asc(sql`COALESCE(${bookings.confirmedStartTime}, ${bookings.requestedStartTime})`))
    .limit(limit)
    .offset(offset);
}

/**
 * Get a single booking by ID
 */
export async function getBookingById(bookingId: string, userId?: string) {
  const [booking] = await db.select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) {
    return null;
  }

  // If userId provided, verify access
  if (userId && booking.customerId !== userId && booking.vendorId !== userId) {
    return null;
  }

  return booking;
}

/**
 * Mark booking as started
 */
export async function startBooking(bookingId: string, vendorId: string) {
  const [updated] = await db.update(bookings)
    .set({
      status: 'in_progress',
      startedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.vendorId, vendorId),
        or(
          eq(bookings.status, 'accepted'),
          eq(bookings.status, 'confirmed')
        )
      )
    )
    .returning();

  return updated;
}

/**
 * Mark booking as completed
 */
export async function completeBooking(bookingId: string, vendorId: string) {
  const [updated] = await db.update(bookings)
    .set({
      status: 'completed',
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'in_progress')
      )
    )
    .returning();

  return updated;
}

// ===========================================
// QUEUE MANAGEMENT
// ===========================================

/**
 * Get pending bookings count for a vendor
 */
export async function getPendingBookingsCount(vendorId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, vendorId),
        eq(bookings.status, 'pending')
      )
    );
  
  return result[0]?.count || 0;
}

/**
 * Get queue position for a booking
 */
export async function getQueuePosition(bookingId: string): Promise<number | null> {
  const [booking] = await db.select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking || booking.status !== 'pending') {
    return null;
  }

  const earlier = await db.select({ count: sql<number>`count(*)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.vendorId, booking.vendorId),
        eq(bookings.status, 'pending'),
        lte(bookings.createdAt, booking.createdAt),
        ne(bookings.id, bookingId)
      )
    );

  return (earlier[0]?.count || 0) + 1;
}

