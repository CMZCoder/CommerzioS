/**
 * Credit Routes
 * API endpoints for credit-related operations
 */

import { Router } from "express";
import { isAuthenticated } from "../auth";
import { isAdmin } from "../adminAuth";
import { z } from "zod";
import {
    getCreditBalance,
    getCreditHistory,
    getCreditStats,
    addCredits,
    adminAdjustCredits,
    hasEnoughCredits,
    type CreditTransactionType,
} from "../creditService";

const router = Router();

// ===========================================
// USER ENDPOINTS
// ===========================================

/**
 * GET /api/credits/balance
 * Get current credit balance for authenticated user
 */
router.get("/balance", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const balance = await getCreditBalance(userId);
        res.json({ balance });
    } catch (error: any) {
        console.error("Error getting credit balance:", error);
        res.status(500).json({ message: "Failed to get credit balance" });
    }
});

/**
 * GET /api/credits/stats
 * Get credit statistics for authenticated user
 */
router.get("/stats", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const stats = await getCreditStats(userId);
        res.json(stats);
    } catch (error: any) {
        console.error("Error getting credit stats:", error);
        res.status(500).json({ message: "Failed to get credit stats" });
    }
});

/**
 * GET /api/credits/history
 * Get credit transaction history for authenticated user
 */
router.get("/history", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { limit, offset, type, startDate, endDate } = req.query;

        const result = await getCreditHistory(userId, {
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
            transactionType: type as CreditTransactionType | undefined,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });

        res.json(result);
    } catch (error: any) {
        console.error("Error getting credit history:", error);
        res.status(500).json({ message: "Failed to get credit history" });
    }
});

/**
 * GET /api/credits/check
 * Check if user has enough credits for an operation
 */
router.get("/check", isAuthenticated, async (req: any, res) => {
    try {
        const userId = req.user!.id;
        const { amount } = req.query;

        if (!amount || isNaN(parseInt(amount as string))) {
            return res.status(400).json({ message: "Valid amount is required" });
        }

        const hasEnough = await hasEnoughCredits(userId, parseInt(amount as string));
        const balance = await getCreditBalance(userId);

        res.json({
            hasEnough,
            balance,
            required: parseInt(amount as string),
            shortfall: hasEnough ? 0 : parseInt(amount as string) - balance
        });
    } catch (error: any) {
        console.error("Error checking credits:", error);
        res.status(500).json({ message: "Failed to check credits" });
    }
});

// ===========================================
// ADMIN ENDPOINTS
// ===========================================

// Schema for admin credit adjustment
const adminAdjustmentSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    amount: z.number().int().refine(n => n !== 0, "Amount cannot be zero"),
    reason: z.string().min(5, "Reason must be at least 5 characters"),
});

/**
 * POST /api/credits/admin/adjust
 * Admin endpoint to adjust a user's credit balance
 */
router.post("/admin/adjust", isAdmin, async (req: any, res) => {
    try {
        const validated = adminAdjustmentSchema.parse(req.body);
        const adminUserId = req.adminSession?.adminId || "system";

        const transaction = await adminAdjustCredits(
            validated.userId,
            validated.amount,
            validated.reason,
            adminUserId
        );

        res.json({
            success: true,
            message: `Credits adjusted by ${validated.amount > 0 ? '+' : ''}${validated.amount}`,
            transaction
        });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error adjusting credits:", error);
        res.status(500).json({ message: error.message || "Failed to adjust credits" });
    }
});

/**
 * GET /api/credits/admin/user/:userId
 * Admin endpoint to get a specific user's credit info
 */
router.get("/admin/user/:userId", isAdmin, async (req: any, res) => {
    try {
        const { userId } = req.params;
        const { limit, offset } = req.query;

        const [balance, stats, history] = await Promise.all([
            getCreditBalance(userId),
            getCreditStats(userId),
            getCreditHistory(userId, {
                limit: limit ? parseInt(limit as string) : 20,
                offset: offset ? parseInt(offset as string) : 0,
            }),
        ]);

        res.json({ balance, stats, history });
    } catch (error: any) {
        console.error("Error getting user credits:", error);
        res.status(500).json({ message: "Failed to get user credits" });
    }
});

// ===========================================
// PROMOTIONAL ENDPOINTS
// ===========================================

// Schema for promo code redemption
const promoCodeSchema = z.object({
    code: z.string().min(1, "Promo code is required"),
});

/**
 * POST /api/credits/redeem-promo
 * Redeem a promotional code for credits
 * TODO: Implement promo code validation system
 */
router.post("/redeem-promo", isAuthenticated, async (req: any, res) => {
    try {
        const validated = promoCodeSchema.parse(req.body);
        const userId = req.user!.id;

        // TODO: Implement promo code validation and redemption
        // For now, return a placeholder response
        return res.status(501).json({
            message: "Promo code redemption coming soon",
            code: validated.code
        });

        // Example implementation:
        // const promo = await validatePromoCode(validated.code);
        // if (!promo) {
        //   return res.status(400).json({ message: "Invalid promo code" });
        // }
        // 
        // const transaction = await addCredits(userId, promo.amount, "promo_bonus", {
        //   description: `Promo code: ${validated.code}`,
        //   referenceType: "promo",
        //   referenceId: promo.id,
        // });
        // 
        // res.json({ success: true, creditsAdded: promo.amount, transaction });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: error.errors[0].message });
        }
        console.error("Error redeeming promo code:", error);
        res.status(500).json({ message: "Failed to redeem promo code" });
    }
});

export { router as creditsRouter };

/**
 * Register credit routes with Express app
 */
export function registerCreditsRoutes(app: any): void {
    app.use("/api/credits", router);
}
