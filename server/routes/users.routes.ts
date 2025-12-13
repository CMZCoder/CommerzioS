/**
 * Users Routes
 * 
 * Handles user profile management endpoints:
 * - GET /api/auth/user - Current user session
 * - PATCH /api/users/me - Update profile
 * - DELETE /api/users/me - Delete account
 * - POST /api/users/me/deactivate - Deactivate account
 * - POST /api/auth/reactivate - Reactivate account
 * - GET/POST /api/users/me/addresses - Address management
 */

import { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, userAddresses, insertAddressSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import { isAuthenticated } from "../auth";
import { deleteUser, deactivateUser, reactivateUserWithCredentials } from "../authService";
import { sendDeactivationEmail, sendReactivationEmail } from "../emailService";
import { storage } from "../storage";

type AuthenticatedRequest = Request & {
    user?: { id: string; email: string; firstName?: string };
    logout: (cb: (err: any) => void) => void;
    login: (user: any, cb: (err: any) => void) => void;
    session: any;
};

export function registerUsersRoutes(app: Express): void {

    // ============================================
    // CURRENT USER SESSION
    // ============================================

    /**
     * GET /api/auth/user
     * Get current authenticated user
     */
    app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const user = await storage.getUser(userId);
            res.json(user);
        } catch (error) {
            console.error("Error fetching user:", error);
            res.status(500).json({ message: "Failed to fetch user" });
        }
    });

    // ============================================
    // PROFILE MANAGEMENT
    // ============================================

    /**
     * PATCH /api/users/me
     * Update current user profile
     */
    app.patch('/api/users/me', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const {
                firstName, lastName, phoneNumber, profileImageUrl,
                locationLat, locationLng, preferredLocationName,
                acceptCardPayments, acceptTwintPayments, acceptCashPayments, requireBookingApproval,
                vendorBio
            } = req.body;

            // Validate Swiss phone number if provided
            if (phoneNumber) {
                const swissPhoneRegex = /^\+41\s?(\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\d{9,11})$/;
                const normalizedPhone = phoneNumber.replace(/\s/g, '');
                if (!swissPhoneRegex.test(normalizedPhone)) {
                    return res.status(400).json({
                        message: "Invalid phone number. Swiss phone numbers must start with +41 (e.g., +41 44 123 4567)"
                    });
                }
            }

            // Validate location fields
            if ((locationLat !== undefined || locationLng !== undefined) && (locationLat === undefined || locationLng === undefined)) {
                return res.status(400).json({
                    message: "Both latitude and longitude must be provided together"
                });
            }

            const updateData: Record<string, any> = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
            if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
            if (locationLat !== undefined) updateData.locationLat = locationLat ? parseFloat(locationLat) : null;
            if (locationLng !== undefined) updateData.locationLng = locationLng ? parseFloat(locationLng) : null;
            if (preferredLocationName !== undefined) updateData.preferredLocationName = preferredLocationName;
            if (acceptCardPayments !== undefined) updateData.acceptCardPayments = acceptCardPayments;
            if (acceptTwintPayments !== undefined) updateData.acceptTwintPayments = acceptTwintPayments;
            if (acceptCashPayments !== undefined) updateData.acceptCashPayments = acceptCashPayments;
            if (requireBookingApproval !== undefined) updateData.requireBookingApproval = requireBookingApproval;
            if (vendorBio !== undefined) updateData.vendorBio = vendorBio;

            const user = await storage.updateUserProfile(userId, updateData);
            res.json(user);
        } catch (error) {
            console.error("Error updating user profile:", error);
            res.status(500).json({ message: "Failed to update profile" });
        }
    });

    /**
     * DELETE /api/users/me
     * Delete current user account (hard delete)
     */
    app.delete('/api/users/me', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const result = await deleteUser(userId);

            if (!result.success) {
                return res.status(500).json({ message: result.message });
            }

            req.logout((err) => {
                if (err) console.error("Logout error after delete:", err);
                req.session.destroy(() => {
                    res.clearCookie("sid");
                    res.json({ message: result.message });
                });
            });
        } catch (error: any) {
            console.error("Error deleting user:", error);
            res.status(500).json({ message: "Failed to delete user", details: error.message });
        }
    });

    // ============================================
    // ACCOUNT DEACTIVATION/REACTIVATION
    // ============================================

    /**
     * POST /api/users/me/deactivate
     * Temporarily deactivate current user account
     */
    app.post('/api/users/me/deactivate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const userEmail = req.user!.email;
            const userFirstName = req.user!.firstName || "there";

            const result = await deactivateUser(userId);

            if (!result.success) {
                return res.status(400).json({ message: result.message });
            }

            // Send confirmation email
            sendDeactivationEmail(userEmail, userFirstName).catch(err =>
                console.error("Failed to send deactivation email:", err)
            );

            req.logout((err) => {
                if (err) console.error("Logout error after deactivation:", err);
                req.session.destroy(() => {
                    res.clearCookie("sid");
                    res.json({ message: "Account deactivated successfully" });
                });
            });
        } catch (error: any) {
            console.error("Error deactivating user:", error);
            res.status(500).json({ message: "Failed to deactivate user" });
        }
    });

    /**
     * POST /api/auth/reactivate
     * Reactivate a deactivated account
     */
    app.post('/api/auth/reactivate', async (req: AuthenticatedRequest, res: Response) => {
        try {
            const { email, password } = req.body;

            const result = await reactivateUserWithCredentials(email, password);

            if (!result.success) {
                return res.status(401).json({ message: result.message });
            }

            req.login(result.user, (err: any) => {
                if (err) {
                    return res.status(500).json({ message: "Reactivation successful, but login failed. Please login manually." });
                }
                res.json({ message: result.message, user: result.user });
            });
        } catch (error: any) {
            console.error("Error reactivating user:", error);
            res.status(500).json({ message: "Failed to reactivate user" });
        }
    });

    // ============================================
    // ADDRESS MANAGEMENT
    // ============================================

    /**
     * GET /api/users/me/addresses
     * Get all addresses for current user
     */
    app.get('/api/users/me/addresses', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const addresses = await storage.getAddresses(userId);
            res.json(addresses);
        } catch (error) {
            console.error("Error fetching addresses:", error);
            res.status(500).json({ message: "Failed to fetch addresses" });
        }
    });

    /**
     * POST /api/users/me/addresses
     * Add a new address for current user
     */
    app.post('/api/users/me/addresses', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const validatedData = insertAddressSchema.parse({
                ...req.body,
                userId,
            });

            const address = await storage.createAddress(validatedData);
            res.status(201).json(address);
        } catch (error: any) {
            console.error("Error creating address:", error);
            if (error.name === 'ZodError') {
                return res.status(400).json({ message: "Invalid address data", errors: error.errors });
            }
            res.status(500).json({ message: "Failed to create address" });
        }
    });

    /**
     * PATCH /api/users/me/addresses/:id
     * Update an address
     */
    app.patch('/api/users/me/addresses/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const addressId = req.params.id;

            // Verify ownership
            const [address] = await db.select()
                .from(userAddresses)
                .where(eq(userAddresses.id, addressId));

            if (!address || address.userId !== userId) {
                return res.status(404).json({ message: "Address not found" });
            }

            const updated = await storage.updateAddress(addressId, req.body);
            res.json(updated);
        } catch (error) {
            console.error("Error updating address:", error);
            res.status(500).json({ message: "Failed to update address" });
        }
    });

    /**
     * DELETE /api/users/me/addresses/:id
     * Delete an address
     */
    app.delete('/api/users/me/addresses/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const addressId = req.params.id;

            // Verify ownership
            const [address] = await db.select()
                .from(userAddresses)
                .where(eq(userAddresses.id, addressId));

            if (!address || address.userId !== userId) {
                return res.status(404).json({ message: "Address not found" });
            }

            await storage.deleteAddress(addressId);
            res.json({ message: "Address deleted" });
        } catch (error) {
            console.error("Error deleting address:", error);
            res.status(500).json({ message: "Failed to delete address" });
        }
    });

    console.log("✓ Users routes registered");
}
