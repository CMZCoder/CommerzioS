/**
 * Notifications Routes
 * 
 * Modular endpoints for notification management:
 * - Fetch notifications (paginated, filtered)
 * - Mark read/unread
 * - Dismiss and clear
 * - Preferences management
 * - Push subscription management
 */

import { Router, Request, Response } from "express";
import { isAuthenticated } from "../auth";
import { isAdmin } from "../adminAuth";
import {
    getNotifications,
    getUnreadCount as getNotificationUnreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
    getNotificationPreferences,
    updateNotificationPreferences,
    createNotification,
} from "../notificationService";
import {
    initializePushService,
    isPushEnabled,
    getVapidPublicKey,
    registerPushSubscription,
    unregisterPushSubscription,
    getUserSubscriptions,
} from "../pushService";
import { updateNotificationPreferencesSchema, NOTIFICATION_TYPES } from "@shared/schema";
import type { NotificationType } from "@shared/schema";

const router = Router();

// Initialize push service
initializePushService();

// ===========================================
// NOTIFICATION FETCH & READ OPERATIONS
// ===========================================

/**
 * GET /api/notifications
 * Get notifications for authenticated user
 * Supports pagination and filtering by type/read status
 */
router.get("/", isAuthenticated, async (req: any, res: Response) => {
    try {
        const {
            limit = "20",
            offset = "0",
            unreadOnly = "false",
            types
        } = req.query;

        const result = await getNotifications(req.user!.id, {
            limit: parseInt(limit as string),
            offset: parseInt(offset as string),
            unreadOnly: unreadOnly === "true",
            types: types ? (types as string).split(",") as NotificationType[] : undefined,
        });

        res.json(result);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Failed to fetch notifications" });
    }
});

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for badge display
 */
router.get("/unread-count", isAuthenticated, async (req: any, res: Response) => {
    try {
        const count = await getNotificationUnreadCount(req.user!.id);
        res.json({ count });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Failed to fetch unread count" });
    }
});

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.post("/:id/read", isAuthenticated, async (req: any, res: Response) => {
    try {
        const success = await markAsRead(req.params.id, req.user!.id);
        if (!success) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ message: "Failed to mark as read" });
    }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post("/mark-all-read", isAuthenticated, async (req: any, res: Response) => {
    try {
        const count = await markAllAsRead(req.user!.id);
        res.json({ success: true, count });
    } catch (error) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ message: "Failed to mark all as read" });
    }
});

/**
 * POST /api/notifications/:id/dismiss
 * Dismiss (soft delete) a notification
 */
router.post("/:id/dismiss", isAuthenticated, async (req: any, res: Response) => {
    try {
        const success = await dismissNotification(req.params.id, req.user!.id);
        if (!success) {
            return res.status(404).json({ message: "Notification not found" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error dismissing notification:", error);
        res.status(500).json({ message: "Failed to dismiss notification" });
    }
});

/**
 * POST /api/notifications/clear-all
 * Clear all notifications for user
 */
router.post("/clear-all", isAuthenticated, async (req: any, res: Response) => {
    try {
        const count = await clearAllNotifications(req.user!.id);
        res.json({ success: true, count });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: "Failed to clear notifications" });
    }
});

// ===========================================
// NOTIFICATION PREFERENCES
// ===========================================

/**
 * GET /api/notifications/preferences
 * Get user's notification preferences
 */
router.get("/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
        const preferences = await getNotificationPreferences(req.user!.id);
        res.json(preferences);
    } catch (error) {
        console.error("Error fetching preferences:", error);
        res.status(500).json({ message: "Failed to fetch preferences" });
    }
});

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put("/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
        const validationResult = updateNotificationPreferencesSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                message: "Invalid preferences data",
                errors: validationResult.error.errors
            });
        }

        const preferences = await updateNotificationPreferences(
            req.user!.id,
            validationResult.data
        );
        res.json(preferences);
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ message: "Failed to update preferences" });
    }
});

/**
 * PATCH /api/notifications/preferences
 * Partial update notification preferences (for Settings page)
 */
router.patch("/preferences", isAuthenticated, async (req: any, res: Response) => {
    try {
        const preferences = await updateNotificationPreferences(
            req.user!.id,
            req.body
        );
        res.json(preferences);
    } catch (error) {
        console.error("Error updating preferences:", error);
        res.status(500).json({ message: "Failed to update preferences" });
    }
});

/**
 * GET /api/notifications/types
 * Get available notification types (for UI)
 */
router.get("/types", (req: Request, res: Response) => {
    res.json({
        types: NOTIFICATION_TYPES,
        descriptions: {
            message: "Chat messages from vendors or customers",
            booking: "Booking confirmations, updates, and reminders",
            referral: "Referral rewards and new sign-ups",
            service: "Service approval and status updates",
            payment: "Payment receipts and payout notifications",
            system: "Platform updates and announcements",
            review: "New reviews on your services",
            promotion: "Special offers and promotional content",
        },
    });
});

// ===========================================
// PUSH NOTIFICATION SUBSCRIPTION
// ===========================================

/**
 * GET /api/notifications/push/vapid-key
 * Get VAPID public key for push subscription
 */
router.get("/push/vapid-key", (req: Request, res: Response) => {
    if (!isPushEnabled()) {
        return res.status(503).json({
            message: "Push notifications not configured",
            enabled: false
        });
    }
    res.json({
        publicKey: getVapidPublicKey(),
        enabled: true
    });
});

/**
 * POST /api/notifications/push/subscribe
 * Register a push subscription
 */
router.post("/push/subscribe", isAuthenticated, async (req: any, res: Response) => {
    try {
        if (!isPushEnabled()) {
            return res.status(503).json({ message: "Push notifications not configured" });
        }

        const { subscription, deviceInfo } = req.body;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return res.status(400).json({ message: "Invalid subscription data" });
        }

        const result = await registerPushSubscription(
            req.user!.id,
            subscription,
            deviceInfo
        );

        // Enable push in user's preferences
        await updateNotificationPreferences(req.user!.id, { pushEnabled: true });

        res.status(201).json(result);
    } catch (error) {
        console.error("Error registering push subscription:", error);
        res.status(500).json({ message: "Failed to register subscription" });
    }
});

/**
 * POST /api/notifications/push/unsubscribe
 * Unregister a push subscription
 */
router.post("/push/unsubscribe", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({ message: "Endpoint is required" });
        }

        const success = await unregisterPushSubscription(req.user!.id, endpoint);

        // Check if user has any remaining subscriptions
        const remaining = await getUserSubscriptions(req.user!.id);
        if (remaining.length === 0) {
            // Disable push in preferences if no subscriptions left
            await updateNotificationPreferences(req.user!.id, { pushEnabled: false });
        }

        res.json({ success });
    } catch (error) {
        console.error("Error unregistering push subscription:", error);
        res.status(500).json({ message: "Failed to unregister subscription" });
    }
});

/**
 * GET /api/notifications/push/subscriptions
 * Get user's push subscriptions
 */
router.get("/push/subscriptions", isAuthenticated, async (req: any, res: Response) => {
    try {
        const subscriptions = await getUserSubscriptions(req.user!.id);
        res.json({ subscriptions });
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as notificationsRouter };

/**
 * Register notifications routes with Express app
 */
export function registerNotificationsRoutes(app: any): void {
    app.use("/api/notifications", router);
}
