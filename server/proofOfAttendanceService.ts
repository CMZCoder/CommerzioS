/**
 * Proof of Attendance Service
 * 
 * Provides QR code and remote proof mechanisms for booking completion:
 * - QR Code generation for on-site verification
 * - Remote check-in via geolocation
 * - Punctuality score tracking for vendors
 */

import { db } from "./db";
import { bookings, users, services } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { createNotification } from "./notificationService";
import crypto from "crypto";

// Types
export type AttendanceCheckType = "QR_SCAN" | "REMOTE_CHECKIN" | "MANUAL";
export type AttendanceStatus = "PENDING" | "CHECKED_IN" | "COMPLETED" | "NO_SHOW";

export interface AttendanceRecord {
    bookingId: string;
    checkType: AttendanceCheckType;
    checkedInAt: Date;
    completedAt?: Date;
    vendorOnTime: boolean;
    customerLocation?: { lat: number; lng: number };
    vendorLocation?: { lat: number; lng: number };
}

export interface QRCodeData {
    token: string;
    bookingId: string;
    serviceId: string;
    expiresAt: Date;
}

// Token validity period (2 hours before to 1 hour after booking start)
const TOKEN_VALID_HOURS_BEFORE = 2;
const TOKEN_VALID_HOURS_AFTER = 1;

// ===========================================
// QR CODE GENERATION
// ===========================================

/**
 * Generate a unique QR code token for a booking
 */
export async function generateQRToken(bookingId: string): Promise<QRCodeData> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        throw new Error("Booking not found");
    }

    // Generate a cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate validity window
    const startTime = booking.confirmedStartTime || booking.requestedStartTime;
    if (!startTime) {
        throw new Error("Booking has no scheduled start time");
    }

    const validFrom = new Date(startTime);
    validFrom.setHours(validFrom.getHours() - TOKEN_VALID_HOURS_BEFORE);

    const expiresAt = new Date(startTime);
    expiresAt.setHours(expiresAt.getHours() + TOKEN_VALID_HOURS_AFTER);

    // Store token in booking (would need to add field to schema)
    // For now, we'll generate deterministically based on booking ID + secret
    const deterministicToken = crypto
        .createHmac("sha256", process.env.QR_SECRET || "default-secret")
        .update(`${bookingId}-${startTime.toISOString()}`)
        .digest("hex");

    return {
        token: deterministicToken,
        bookingId,
        serviceId: booking.serviceId,
        expiresAt,
    };
}

/**
 * Generate QR code URL for a booking
 * Returns a URL that opens the customer check-in page
 */
export function generateQRCodeURL(token: string, bookingId: string): string {
    const baseUrl = process.env.FRONTEND_URL || "https://commerzio.ch";
    return `${baseUrl}/check-in?token=${token}&booking=${bookingId}`;
}

/**
 * Validate a QR code token
 */
export async function validateQRToken(
    token: string,
    bookingId: string
): Promise<{ valid: boolean; reason?: string }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { valid: false, reason: "Booking not found" };
    }

    // Regenerate the expected token
    const startTime = booking.confirmedStartTime || booking.requestedStartTime;
    if (!startTime) {
        return { valid: false, reason: "Booking has no scheduled time" };
    }

    const expectedToken = crypto
        .createHmac("sha256", process.env.QR_SECRET || "default-secret")
        .update(`${bookingId}-${startTime.toISOString()}`)
        .digest("hex");

    if (token !== expectedToken) {
        return { valid: false, reason: "Invalid token" };
    }

    // Check time validity
    const now = new Date();
    const validFrom = new Date(startTime);
    validFrom.setHours(validFrom.getHours() - TOKEN_VALID_HOURS_BEFORE);

    const validUntil = new Date(startTime);
    validUntil.setHours(validUntil.getHours() + TOKEN_VALID_HOURS_AFTER);

    if (now < validFrom) {
        return { valid: false, reason: "Check-in not yet available" };
    }

    if (now > validUntil) {
        return { valid: false, reason: "Check-in window expired" };
    }

    return { valid: true };
}

// ===========================================
// REMOTE CHECK-IN
// ===========================================

/**
 * Validate that customer is at the service location
 * Uses geolocation to verify proximity
 */
export async function validateRemoteCheckin(
    bookingId: string,
    customerLocation: { lat: number; lng: number }
): Promise<{ valid: boolean; reason?: string; distance?: number }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { valid: false, reason: "Booking not found" };
    }

    // Get service location
    const [service] = await db
        .select()
        .from(services)
        .where(eq(services.id, booking.serviceId))
        .limit(1);

    if (!service || !service.locationLat || !service.locationLng) {
        // No location data - allow remote checkin without verification
        return { valid: true };
    }

    // Calculate distance using Haversine formula
    const distance = calculateDistance(
        customerLocation.lat,
        customerLocation.lng,
        Number(service.locationLat),
        Number(service.locationLng)
    );

    // Allow check-in within 500 meters
    const MAX_DISTANCE_METERS = 500;

    if (distance > MAX_DISTANCE_METERS) {
        return {
            valid: false,
            reason: `Too far from service location (${Math.round(distance)}m away)`,
            distance
        };
    }

    return { valid: true, distance };
}

/**
 * Calculate distance between two coordinates in meters
 * Using Haversine formula
 */
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
}

// ===========================================
// ATTENDANCE TRACKING
// ===========================================

/**
 * Record customer check-in for a booking
 */
export async function recordCheckin(
    bookingId: string,
    checkType: AttendanceCheckType,
    location?: { lat: number; lng: number }
): Promise<{ success: boolean; message: string }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found" };
    }

    if (booking.status !== "confirmed" && booking.status !== "accepted") {
        return { success: false, message: "Booking is not in an active state" };
    }

    // Update booking status to in_progress
    await db
        .update(bookings)
        .set({
            status: "in_progress",
            // Would add checkedInAt, checkType fields to schema
        })
        .where(eq(bookings.id, bookingId));

    // Notify vendor that customer has arrived
    await createNotification({
        userId: booking.vendorId,
        type: "booking_update",
        title: "Customer Checked In",
        message: "Your customer has checked in and is ready for the service.",
        actionUrl: `/bookings/${bookingId}`,
    });

    return { success: true, message: "Check-in recorded successfully" };
}

/**
 * Record service completion
 */
export async function recordCompletion(
    bookingId: string,
    completedBy: "vendor" | "customer"
): Promise<{ success: boolean; message: string }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        return { success: false, message: "Booking not found" };
    }

    // Update booking status
    await db
        .update(bookings)
        .set({
            status: "completed",
            completedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId));

    // Notify both parties
    await createNotification({
        userId: booking.customerId,
        type: "booking_completed",
        title: "Service Completed",
        message: "Your booking has been marked as complete. Please leave a review!",
        actionUrl: `/bookings/${bookingId}/review`,
    });

    await createNotification({
        userId: booking.vendorId,
        type: "booking_completed",
        title: "Service Completed",
        message: "Booking completed. Payment will be processed shortly.",
        actionUrl: `/bookings/${bookingId}`,
    });

    return { success: true, message: "Completion recorded successfully" };
}

// ===========================================
// PUNCTUALITY SCORE
// ===========================================

/**
 * Record vendor arrival time and update punctuality score
 */
export async function recordVendorArrival(
    bookingId: string,
    vendorLocation?: { lat: number; lng: number }
): Promise<{ onTime: boolean; minutesLate?: number }> {
    const [booking] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);

    if (!booking) {
        throw new Error("Booking not found");
    }

    const now = new Date();
    const scheduledTime = booking.confirmedStartTime || booking.requestedStartTime;

    if (!scheduledTime) {
        return { onTime: true };
    }

    // Allow 5 minute grace period
    const gracePeriodMs = 5 * 60 * 1000;
    const lateThreshold = new Date(scheduledTime.getTime() + gracePeriodMs);

    const onTime = now <= lateThreshold;
    const minutesLate = onTime ? 0 : Math.floor((now.getTime() - scheduledTime.getTime()) / 60000);

    // Update vendor punctuality score
    await updatePunctualityScore(booking.vendorId, onTime);

    return { onTime, minutesLate };
}

/**
 * Update vendor's punctuality score
 * Score is a rolling percentage of on-time arrivals
 */
async function updatePunctualityScore(
    vendorId: string,
    wasOnTime: boolean
): Promise<void> {
    const [vendor] = await db
        .select({ punctualityScore: users.punctualityScore })
        .from(users)
        .where(eq(users.id, vendorId))
        .limit(1);

    if (!vendor) return;

    // Use exponential moving average for score
    // Weight recent arrivals more heavily
    const alpha = 0.1; // Smoothing factor
    const currentScore = parseFloat(vendor.punctualityScore || "100");
    const newDataPoint = wasOnTime ? 100 : 0;
    const newScore = alpha * newDataPoint + (1 - alpha) * currentScore;

    await db
        .update(users)
        .set({ punctualityScore: newScore.toFixed(2) })
        .where(eq(users.id, vendorId));
}

/**
 * Get vendor's punctuality score
 */
export async function getVendorPunctualityScore(
    vendorId: string
): Promise<{ score: number; rating: string }> {
    const [vendor] = await db
        .select({ punctualityScore: users.punctualityScore })
        .from(users)
        .where(eq(users.id, vendorId))
        .limit(1);

    const score = parseFloat(vendor?.punctualityScore || "100");

    let rating: string;
    if (score >= 95) rating = "Excellent";
    else if (score >= 85) rating = "Good";
    else if (score >= 70) rating = "Fair";
    else rating = "Needs Improvement";

    return { score, rating };
}
