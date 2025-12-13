/**
 * Reviews Routes
 * 
 * Modular endpoints for review management:
 * - Service reviews (customer reviewing vendor)
 * - Customer reviews (vendor reviewing customer)
 * - Review editing and deletion
 * - Review requests
 * - Bookings to review
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { reviews, customerReviews, services, users, bookings as bookingsTable } from "@shared/schema";
import { editReview } from "../reviewService";

const router = Router();

// ===========================================
// SERVICE REVIEWS (customer reviews vendor)
// ===========================================

/**
 * GET /api/reviews/received
 * Get reviews received on user's services
 */
router.get("/received", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const receivedReviews = await db
            .select({
                id: reviews.id,
                rating: reviews.rating,
                comment: reviews.comment,
                editCount: reviews.editCount,
                lastEditedAt: reviews.lastEditedAt,
                createdAt: reviews.createdAt,
                reviewer: {
                    id: users.id,
                    email: users.email,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                },
                service: {
                    id: services.id,
                    title: services.title,
                },
            })
            .from(reviews)
            .innerJoin(users, eq(reviews.userId, users.id))
            .innerJoin(services, eq(reviews.serviceId, services.id))
            .where(eq(services.ownerId, userId));

        res.json(receivedReviews);
    } catch (error) {
        console.error("Error fetching received reviews:", error);
        res.status(500).json({ message: "Failed to fetch received reviews" });
    }
});

/**
 * GET /api/reviews/given
 * Get reviews given by the user (as customer)
 */
router.get("/given", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const givenReviews = await db
            .select({
                id: reviews.id,
                rating: reviews.rating,
                comment: reviews.comment,
                editCount: reviews.editCount,
                lastEditedAt: reviews.lastEditedAt,
                createdAt: reviews.createdAt,
                bookingId: reviews.bookingId,
                service: {
                    id: services.id,
                    title: services.title,
                    ownerId: services.ownerId,
                },
            })
            .from(reviews)
            .innerJoin(services, eq(reviews.serviceId, services.id))
            .where(eq(reviews.userId, userId))
            .orderBy(desc(reviews.createdAt));

        // Add vendor info
        const reviewsWithVendor = await Promise.all(
            givenReviews.map(async (review) => {
                const [vendor] = await db
                    .select({
                        id: users.id,
                        firstName: users.firstName,
                        lastName: users.lastName,
                        profileImageUrl: users.profileImageUrl,
                    })
                    .from(users)
                    .where(eq(users.id, review.service.ownerId))
                    .limit(1);
                return {
                    ...review,
                    vendor,
                };
            })
        );

        res.json(reviewsWithVendor);
    } catch (error) {
        console.error("Error fetching reviews given:", error);
        res.status(500).json({ message: "Failed to fetch reviews given" });
    }
});

/**
 * PATCH /api/reviews/:reviewId
 * Edit a review
 */
router.patch("/:reviewId", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const reviewId = req.params.reviewId;
        const { rating, comment } = req.body;

        const result = await editReview({
            reviewId,
            userId,
            newRating: rating,
            newComment: comment,
        });

        if (!result.success) {
            return res.status(400).json({ message: result.error });
        }

        res.json({
            ...result.review,
            notificationSent: result.notificationSent,
        });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ message: "Failed to update review" });
    }
});

/**
 * DELETE /api/reviews/:reviewId
 * Delete a review
 */
router.delete("/:reviewId", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const reviewId = req.params.reviewId;

        const reviewData = await db.select().from(reviews).where(eq(reviews.id, reviewId));
        if (reviewData.length === 0) {
            return res.status(404).json({ message: "Review not found" });
        }

        const review = reviewData[0];
        if (review.userId !== userId) {
            return res.status(403).json({ message: "Not authorized to delete this review" });
        }

        await db.delete(reviews).where(eq(reviews.id, reviewId));
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting review:", error);
        res.status(500).json({ message: "Failed to delete review" });
    }
});

// ===========================================
// CUSTOMER REVIEWS (vendor reviews customer)
// ===========================================

/**
 * GET /api/reviews/customer/given
 * Get customer reviews given by vendor
 */
router.get("/customer/given", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const givenReviews = await db
            .select({
                id: customerReviews.id,
                rating: customerReviews.rating,
                comment: customerReviews.comment,
                editCount: customerReviews.editCount,
                lastEditedAt: customerReviews.lastEditedAt,
                createdAt: customerReviews.createdAt,
                bookingId: customerReviews.bookingId,
                customer: {
                    id: users.id,
                    email: users.email,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                },
                booking: {
                    bookingNumber: bookingsTable.bookingNumber,
                    serviceId: bookingsTable.serviceId,
                },
            })
            .from(customerReviews)
            .innerJoin(users, eq(customerReviews.customerId, users.id))
            .innerJoin(bookingsTable, eq(customerReviews.bookingId, bookingsTable.id))
            .where(eq(customerReviews.vendorId, userId))
            .orderBy(desc(customerReviews.createdAt));

        // Add service info
        const reviewsWithService = await Promise.all(
            givenReviews.map(async (review) => {
                const [service] = await db
                    .select({ id: services.id, title: services.title })
                    .from(services)
                    .where(eq(services.id, review.booking.serviceId))
                    .limit(1);
                return { ...review, service };
            })
        );

        res.json(reviewsWithService);
    } catch (error) {
        console.error("Error fetching customer reviews given:", error);
        res.status(500).json({ message: "Failed to fetch customer reviews" });
    }
});

/**
 * GET /api/reviews/customer/received
 * Get customer reviews received (as customer)
 */
router.get("/customer/received", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const receivedReviews = await db
            .select({
                id: customerReviews.id,
                rating: customerReviews.rating,
                comment: customerReviews.comment,
                createdAt: customerReviews.createdAt,
                bookingId: customerReviews.bookingId,
                vendor: {
                    id: users.id,
                    email: users.email,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                },
                booking: {
                    bookingNumber: bookingsTable.bookingNumber,
                    serviceId: bookingsTable.serviceId,
                },
            })
            .from(customerReviews)
            .innerJoin(users, eq(customerReviews.vendorId, users.id))
            .innerJoin(bookingsTable, eq(customerReviews.bookingId, bookingsTable.id))
            .where(eq(customerReviews.customerId, userId))
            .orderBy(desc(customerReviews.createdAt));

        // Add service info
        const reviewsWithService = await Promise.all(
            receivedReviews.map(async (review) => {
                const [service] = await db
                    .select({ id: services.id, title: services.title })
                    .from(services)
                    .where(eq(services.id, review.booking.serviceId))
                    .limit(1);
                return { ...review, service };
            })
        );

        res.json(reviewsWithService);
    } catch (error) {
        console.error("Error fetching customer reviews received:", error);
        res.status(500).json({ message: "Failed to fetch customer reviews received" });
    }
});

/**
 * POST /api/reviews/customer/:bookingId
 * Create customer review
 */
router.post("/customer/:bookingId", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const bookingId = req.params.bookingId;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ message: "Comment is required" });
        }

        const [booking] = await db
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, bookingId))
            .limit(1);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.vendorId !== userId) {
            return res.status(403).json({ message: "Only the vendor can review the customer" });
        }

        if (booking.status !== "completed") {
            return res.status(400).json({ message: "Can only review customers from completed bookings" });
        }

        const [existingReview] = await db
            .select()
            .from(customerReviews)
            .where(eq(customerReviews.bookingId, bookingId))
            .limit(1);

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this customer for this booking" });
        }

        const [newReview] = await db.insert(customerReviews).values({
            vendorId: userId,
            customerId: booking.customerId,
            bookingId,
            rating,
            comment: comment.trim(),
        }).returning();

        res.status(201).json(newReview);
    } catch (error) {
        console.error("Error creating customer review:", error);
        res.status(500).json({ message: "Failed to create customer review" });
    }
});

/**
 * PATCH /api/reviews/customer/:reviewId
 * Edit customer review
 */
router.patch("/customer/:reviewId", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const reviewId = req.params.reviewId;
        const { rating, comment } = req.body;

        const [review] = await db
            .select()
            .from(customerReviews)
            .where(eq(customerReviews.id, reviewId))
            .limit(1);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        if (review.vendorId !== userId) {
            return res.status(403).json({ message: "You can only edit your own reviews" });
        }

        if (review.editCount >= 1) {
            return res.status(400).json({ message: "Reviews can only be edited once" });
        }

        const [updatedReview] = await db
            .update(customerReviews)
            .set({
                rating: rating ?? review.rating,
                comment: comment?.trim() ?? review.comment,
                editCount: review.editCount + 1,
                lastEditedAt: new Date(),
            })
            .where(eq(customerReviews.id, reviewId))
            .returning();

        res.json(updatedReview);
    } catch (error) {
        console.error("Error updating customer review:", error);
        res.status(500).json({ message: "Failed to update customer review" });
    }
});

// ===========================================
// BOOKINGS TO REVIEW
// ===========================================

/**
 * GET /api/reviews/bookings-to-review-service
 * Get completed bookings where user can leave a service review (as customer)
 */
router.get("/bookings-to-review-service", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const completedBookings = await db
            .select({
                id: bookingsTable.id,
                bookingNumber: bookingsTable.bookingNumber,
                completedAt: bookingsTable.completedAt,
                serviceId: bookingsTable.serviceId,
                vendor: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                },
            })
            .from(bookingsTable)
            .innerJoin(users, eq(bookingsTable.vendorId, users.id))
            .where(and(
                eq(bookingsTable.customerId, userId),
                eq(bookingsTable.status, "completed")
            ))
            .orderBy(desc(bookingsTable.completedAt));

        const existingReviews = await db
            .select({ bookingId: reviews.bookingId })
            .from(reviews)
            .where(eq(reviews.userId, userId));

        const reviewedBookingIds = new Set(existingReviews.map(r => r.bookingId).filter(Boolean));
        const unreviewedBookings = completedBookings.filter(b => !reviewedBookingIds.has(b.id));

        const bookingsWithService = await Promise.all(
            unreviewedBookings.map(async (booking) => {
                const [service] = await db
                    .select({ id: services.id, title: services.title })
                    .from(services)
                    .where(eq(services.id, booking.serviceId))
                    .limit(1);
                return { ...booking, service };
            })
        );

        res.json(bookingsWithService);
    } catch (error) {
        console.error("Error fetching bookings to review:", error);
        res.status(500).json({ message: "Failed to fetch bookings to review" });
    }
});

/**
 * GET /api/reviews/bookings-to-review
 * Get completed bookings where vendor can review customer
 */
router.get("/bookings-to-review", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;

        const bookingsToReview = await db
            .select({
                id: bookingsTable.id,
                bookingNumber: bookingsTable.bookingNumber,
                completedAt: bookingsTable.completedAt,
                serviceId: bookingsTable.serviceId,
                customer: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profileImageUrl: users.profileImageUrl,
                },
            })
            .from(bookingsTable)
            .innerJoin(users, eq(bookingsTable.customerId, users.id))
            .where(and(
                eq(bookingsTable.vendorId, userId),
                eq(bookingsTable.status, "completed")
            ))
            .orderBy(desc(bookingsTable.completedAt));

        const existingReviews = await db
            .select({ bookingId: customerReviews.bookingId })
            .from(customerReviews)
            .where(eq(customerReviews.vendorId, userId));

        const reviewedBookingIds = new Set(existingReviews.map(r => r.bookingId));
        const unreviewedBookings = bookingsToReview.filter(b => !reviewedBookingIds.has(b.id));

        const bookingsWithService = await Promise.all(
            unreviewedBookings.map(async (booking) => {
                const [service] = await db
                    .select({ id: services.id, title: services.title })
                    .from(services)
                    .where(eq(services.id, booking.serviceId))
                    .limit(1);
                return { ...booking, service };
            })
        );

        res.json(bookingsWithService);
    } catch (error) {
        console.error("Error fetching bookings to review:", error);
        res.status(500).json({ message: "Failed to fetch bookings to review" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as reviewsRouter };

export function registerReviewsRoutes(app: any): void {
    app.use("/api/reviews", router);
}
