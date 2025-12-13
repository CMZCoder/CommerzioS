/**
 * Chat Routes
 * 
 * Modular endpoints for messaging and conversations:
 * - Conversation management (CRUD)
 * - Message sending and retrieval
 * - Read receipts
 * - User blocking
 * - Message moderation
 * - Admin flagged conversations
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { isAdmin } from "../adminAuth";
import { storage } from "../storage";
import {
    getOrCreateConversation,
    getUserConversations,
    getConversationById,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    getUnreadCount as getChatUnreadCount,
    deleteConversation,
    blockConversation,
    unblockConversation,
    blockUser,
    unblockUser,
    getBlockedUsers,
    getFlaggedConversations,
    clearConversationFlag,
    deleteMessage,
    editMessage,
    moderateMessage,
} from "../chatService";

const router = Router();

// ===========================================
// CONVERSATIONS
// ===========================================

/**
 * GET /api/chat/conversations
 * Get all conversations for current user
 */
router.get("/conversations", isAuthenticated, async (req: any, res: Response) => {
    try {
        const conversations = await getUserConversations(req.user!.id);
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
});

/**
 * GET /api/chat/unread-count
 * Get unread message count
 */
router.get("/unread-count", isAuthenticated, async (req: any, res: Response) => {
    try {
        const count = await getChatUnreadCount(req.user!.id);
        res.json({ count });
    } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ message: "Failed to fetch unread count" });
    }
});

/**
 * POST /api/chat/conversations
 * Create or get existing conversation
 */
router.post("/conversations", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { vendorId, customerId, bookingId, orderId, serviceId } = req.body;

        if (!vendorId) {
            return res.status(400).json({ message: "vendorId is required" });
        }

        let actualCustomerId = req.user!.id;
        let actualVendorId = vendorId;

        if (customerId && vendorId === req.user!.id) {
            actualCustomerId = customerId;
            actualVendorId = req.user!.id;
        }

        if (actualVendorId === actualCustomerId) {
            return res.status(400).json({ message: "Cannot start conversation with yourself" });
        }

        const conversation = await getOrCreateConversation({
            customerId: actualCustomerId,
            vendorId: actualVendorId,
            bookingId,
            orderId,
            serviceId,
        });
        res.json(conversation);
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ message: "Failed to create conversation" });
    }
});

/**
 * GET /api/chat/conversations/:id
 * Get conversation by ID
 */
router.get("/conversations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const conversation = await getConversationById(req.params.id, req.user!.id);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({ message: "Failed to fetch conversation" });
    }
});

/**
 * DELETE /api/chat/conversations/:id
 * Delete conversation
 */
router.delete("/conversations/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const success = await deleteConversation(req.params.id, req.user!.id);
        if (!success) {
            return res.status(404).json({ message: "Conversation not found or not authorized" });
        }
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting conversation:", error);
        res.status(400).json({ message: error.message || "Failed to delete conversation" });
    }
});

// ===========================================
// MESSAGES
// ===========================================

/**
 * GET /api/chat/conversations/:id/messages
 * Get messages in conversation
 */
router.get("/conversations/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { limit = 50, before } = req.query;
        const messages = await getMessages(
            req.params.id,
            req.user!.id,
            parseInt(limit as string),
            before as string
        );
        res.json(messages);
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        res.status(400).json({ message: error.message || "Failed to fetch messages" });
    }
});

/**
 * POST /api/chat/conversations/:id/messages
 * Send message
 */
router.post("/conversations/:id/messages", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { content, messageType, attachments } = req.body;

        const user = await storage.getUser(req.user!.id);
        if (!user?.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email address before sending messages.",
                requiresEmailVerification: true,
            });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Message content is required" });
        }

        const message = await sendMessage({
            conversationId: req.params.id,
            senderId: req.user!.id,
            content: content.trim(),
            messageType,
            attachments,
        });

        res.status(201).json(message);
    } catch (error: any) {
        console.error("Error sending message:", error);
        res.status(400).json({ message: error.message || "Failed to send message" });
    }
});

/**
 * POST /api/chat/conversations/:id/read
 * Mark messages as read
 */
router.post("/conversations/:id/read", isAuthenticated, async (req: any, res: Response) => {
    try {
        await markMessagesAsRead(req.params.id, req.user!.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error marking messages as read:", error);
        res.status(400).json({ message: error.message || "Failed to mark as read" });
    }
});

/**
 * DELETE /api/chat/messages/:id
 * Delete message (soft delete)
 */
router.delete("/messages/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const success = await deleteMessage(req.params.id, req.user!.id);
        if (!success) {
            return res.status(404).json({ message: "Message not found or not authorized" });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ message: "Failed to delete message" });
    }
});

/**
 * PATCH /api/chat/messages/:id
 * Edit message
 */
router.patch("/messages/:id", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { content } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: "Content is required" });
        }

        const message = await editMessage(req.params.id, req.user!.id, content.trim());
        if (!message) {
            return res.status(404).json({ message: "Message not found or not authorized" });
        }
        res.json(message);
    } catch (error: any) {
        console.error("Error editing message:", error);
        res.status(400).json({ message: error.message || "Failed to edit message" });
    }
});

// ===========================================
// USER BLOCKING
// ===========================================

/**
 * POST /api/chat/users/:userId/block
 * Block user
 */
router.post("/users/:userId/block", isAuthenticated, async (req: any, res: Response) => {
    try {
        await blockUser(req.user!.id, req.params.userId, req.body.reason);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error blocking user:", error);
        res.status(400).json({ message: error.message || "Failed to block user" });
    }
});

/**
 * POST /api/chat/users/:userId/unblock
 * Unblock user
 */
router.post("/users/:userId/unblock", isAuthenticated, async (req: any, res: Response) => {
    try {
        await unblockUser(req.user!.id, req.params.userId);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error unblocking user:", error);
        res.status(400).json({ message: error.message || "Failed to unblock user" });
    }
});

/**
 * GET /api/chat/blocked-users
 * Get blocked users
 */
router.get("/blocked-users", isAuthenticated, async (req: any, res: Response) => {
    try {
        const blockedUsers = await getBlockedUsers(req.user!.id);
        res.json(blockedUsers);
    } catch (error: any) {
        console.error("Error fetching blocked users:", error);
        res.status(500).json({ message: error.message || "Failed to fetch blocked users" });
    }
});

// Legacy: Block/unblock conversation
router.post("/conversations/:id/block", isAuthenticated, async (req: any, res: Response) => {
    try {
        await blockConversation(req.params.id, req.user!.id, req.body.reason);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error blocking conversation:", error);
        res.status(400).json({ message: error.message || "Failed to block conversation" });
    }
});

router.post("/conversations/:id/unblock", isAuthenticated, async (req: any, res: Response) => {
    try {
        await unblockConversation(req.params.id, req.user!.id);
        res.json({ success: true });
    } catch (error: any) {
        console.error("Error unblocking conversation:", error);
        res.status(400).json({ message: error.message || "Failed to unblock conversation" });
    }
});

// ===========================================
// MODERATION
// ===========================================

/**
 * POST /api/chat/moderate-preview
 * Preview message moderation
 */
router.post("/moderate-preview", isAuthenticated, async (req: any, res: Response) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: "Content is required" });
        }

        const result = moderateMessage(content);
        res.json({
            wouldBeFiltered: !result.isClean,
            previewContent: result.filteredContent,
            reasons: result.filterReasons,
        });
    } catch (error) {
        console.error("Error previewing moderation:", error);
        res.status(500).json({ message: "Failed to preview moderation" });
    }
});

// ===========================================
// ADMIN
// ===========================================

/**
 * GET /api/chat/admin/flagged
 * Get flagged conversations (admin only)
 */
router.get("/admin/flagged", isAdmin, async (req: any, res: Response) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const flagged = await getFlaggedConversations(
            parseInt(limit as string),
            parseInt(offset as string)
        );
        res.json(flagged);
    } catch (error) {
        console.error("Error fetching flagged conversations:", error);
        res.status(500).json({ message: "Failed to fetch flagged conversations" });
    }
});

/**
 * POST /api/chat/admin/conversations/:id/clear-flag
 * Clear conversation flag (admin only)
 */
router.post("/admin/conversations/:id/clear-flag", isAdmin, async (req: any, res: Response) => {
    try {
        await clearConversationFlag(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error("Error clearing flag:", error);
        res.status(500).json({ message: "Failed to clear flag" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as chatRouter };

export function registerChatRoutes(app: any): void {
    app.use("/api/chat", router);
}
