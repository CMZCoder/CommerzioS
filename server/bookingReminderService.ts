/**
 * Booking Reminder Service
 * 
 * Sends automated reminders for upcoming bookings:
 * - 24 hours before the appointment
 * - 1 hour before the appointment
 * - 15 minutes before the appointment
 * 
 * This service should be run periodically (e.g., every 5-15 minutes) via a cron job
 */

import { db } from './db';
import { bookings, services, users } from '../shared/schema';
import { eq, and, gte, lte, isNull, or } from 'drizzle-orm';
import { notifyBookingReminder } from './notificationService';

// Track sent reminders to avoid duplicates (in-memory for simplicity)
// In production, consider storing this in the database or Redis
const sentReminders = new Map<string, Set<string>>();

// Cleanup old entries periodically (every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [key, _] of sentReminders) {
    const [_, timestamp] = key.split('_');
    if (parseInt(timestamp) < oneHourAgo) {
      sentReminders.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Get reminder key for deduplication
 */
function getReminderKey(bookingId: string, reminderType: string): string {
  return `${bookingId}_${reminderType}`;
}

/**
 * Check if reminder was already sent
 */
function wasReminderSent(bookingId: string, reminderType: string): boolean {
  const key = getReminderKey(bookingId, reminderType);
  return sentReminders.has(key);
}

/**
 * Mark reminder as sent
 */
function markReminderSent(bookingId: string, reminderType: string): void {
  const key = getReminderKey(bookingId, reminderType);
  sentReminders.set(key, new Set([reminderType]));
}

/**
 * Send booking reminders for upcoming appointments
 * @returns Number of reminders sent
 */
export async function sendBookingReminders(): Promise<number> {
  const now = new Date();
  let remindersSent = 0;

  try {
    // Define time windows for each reminder type
    const reminderWindows = [
      {
        type: '24h' as const,
        minTime: new Date(now.getTime() + 23.5 * 60 * 60 * 1000), // 23.5 hours from now
        maxTime: new Date(now.getTime() + 24.5 * 60 * 60 * 1000), // 24.5 hours from now
      },
      {
        type: '1h' as const,
        minTime: new Date(now.getTime() + 55 * 60 * 1000), // 55 minutes from now
        maxTime: new Date(now.getTime() + 65 * 60 * 1000), // 65 minutes from now
      },
      {
        type: '15min' as const,
        minTime: new Date(now.getTime() + 12 * 60 * 1000), // 12 minutes from now
        maxTime: new Date(now.getTime() + 18 * 60 * 1000), // 18 minutes from now
      },
    ];

    for (const window of reminderWindows) {
      // Find bookings that fall within this reminder window
      const upcomingBookings = await db.select({
        booking: bookings,
        service: {
          title: services.title,
        },
        vendor: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
        .from(bookings)
        .innerJoin(services, eq(services.id, bookings.serviceId))
        .innerJoin(users, eq(users.id, bookings.vendorId))
        .where(
          and(
            // Only confirmed or accepted bookings
            or(
              eq(bookings.status, 'confirmed'),
              eq(bookings.status, 'accepted')
            ),
            // Check confirmed or requested start time within window
            or(
              and(
                gte(bookings.confirmedStartTime, window.minTime),
                lte(bookings.confirmedStartTime, window.maxTime)
              ),
              and(
                isNull(bookings.confirmedStartTime),
                gte(bookings.requestedStartTime, window.minTime),
                lte(bookings.requestedStartTime, window.maxTime)
              )
            )
          )
        );

      for (const { booking, service, vendor } of upcomingBookings) {
        // Check if we already sent this reminder
        if (wasReminderSent(booking.id, window.type)) {
          continue;
        }

        const vendorName = `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'your vendor';
        const startTime = booking.confirmedStartTime || booking.requestedStartTime;

        try {
          // Send reminder to customer
          await notifyBookingReminder(
            booking.customerId,
            booking.id,
            service.title,
            vendorName,
            startTime,
            window.type
          );

          // Mark as sent
          markReminderSent(booking.id, window.type);
          remindersSent++;

          console.log(`[BookingReminder] Sent ${window.type} reminder for booking ${booking.bookingNumber}`);
        } catch (error) {
          console.error(`[BookingReminder] Failed to send ${window.type} reminder for booking ${booking.id}:`, error);
        }
      }
    }

    if (remindersSent > 0) {
      console.log(`[BookingReminder] Sent ${remindersSent} reminders`);
    }

    return remindersSent;
  } catch (error) {
    console.error('[BookingReminder] Error processing reminders:', error);
    return remindersSent;
  }
}

/**
 * Start the booking reminder scheduler
 * Runs every 5 minutes
 */
export function startBookingReminderScheduler(): void {
  console.log('[BookingReminder] Starting reminder scheduler...');
  
  // Run immediately on startup
  sendBookingReminders().catch(console.error);
  
  // Then run every 5 minutes
  setInterval(() => {
    sendBookingReminders().catch(console.error);
  }, 5 * 60 * 1000);
}

/**
 * Send vendor reminders for upcoming appointments
 * Vendors get reminded about their schedule
 */
export async function sendVendorBookingReminders(): Promise<number> {
  const now = new Date();
  let remindersSent = 0;

  try {
    // Remind vendors 1 hour before appointments
    const minTime = new Date(now.getTime() + 55 * 60 * 1000);
    const maxTime = new Date(now.getTime() + 65 * 60 * 1000);

    const upcomingBookings = await db.select({
      booking: bookings,
      service: {
        title: services.title,
      },
      customer: {
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
      .from(bookings)
      .innerJoin(services, eq(services.id, bookings.serviceId))
      .innerJoin(users, eq(users.id, bookings.customerId))
      .where(
        and(
          or(
            eq(bookings.status, 'confirmed'),
            eq(bookings.status, 'accepted')
          ),
          or(
            and(
              gte(bookings.confirmedStartTime, minTime),
              lte(bookings.confirmedStartTime, maxTime)
            ),
            and(
              isNull(bookings.confirmedStartTime),
              gte(bookings.requestedStartTime, minTime),
              lte(bookings.requestedStartTime, maxTime)
            )
          )
        )
      );

    for (const { booking, service, customer } of upcomingBookings) {
      const reminderKey = `vendor_${booking.id}_1h`;
      if (wasReminderSent(booking.id, reminderKey)) {
        continue;
      }

      const customerName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'a customer';
      const startTime = booking.confirmedStartTime || booking.requestedStartTime;

      try {
        await notifyBookingReminder(
          booking.vendorId,
          booking.id,
          service.title,
          customerName,
          startTime,
          '1h'
        );

        markReminderSent(booking.id, reminderKey);
        remindersSent++;

        console.log(`[BookingReminder] Sent vendor reminder for booking ${booking.bookingNumber}`);
      } catch (error) {
        console.error(`[BookingReminder] Failed to send vendor reminder for booking ${booking.id}:`, error);
      }
    }

    return remindersSent;
  } catch (error) {
    console.error('[BookingReminder] Error processing vendor reminders:', error);
    return remindersSent;
  }
}
