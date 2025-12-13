/**
 * Categories Routes
 * 
 * Modular endpoints for category management:
 * - Categories listing and creation
 * - Subcategories
 * - Category suggestions
 * - New service counts per category
 */

import { Router, Response } from "express";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { insertCategorySchema, insertSubmittedCategorySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const router = Router();

// ===========================================
// CATEGORIES
// ===========================================

/**
 * GET /api/categories
 * Get all categories (permanent + temporary for authenticated users)
 */
router.get("/", async (req: any, res: Response) => {
    try {
        const categories = await storage.getCategories();

        // Include temporary categories for authenticated users
        if (req.isAuthenticated && req.isAuthenticated()) {
            const userId = req.user!.id;
            const tempCategories = await storage.getTemporaryCategories(userId);

            // Format temporary categories to match category structure
            const formattedTempCategories = tempCategories.map(tc => ({
                id: tc.id,
                name: tc.name,
                slug: tc.slug,
                icon: tc.icon,
                createdAt: tc.createdAt,
                isTemporary: true,
                expiresAt: tc.expiresAt,
            }));

            // Combine permanent and temporary categories
            const allCategories = [...categories, ...formattedTempCategories];
            res.json(allCategories);
        } else {
            res.json(categories);
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
});

/**
 * POST /api/categories
 * Create a new category (admin)
 */
router.post("/", isAuthenticated, async (req: any, res: Response) => {
    try {
        const validated = insertCategorySchema.parse(req.body);
        const category = await storage.createCategory(validated);
        res.status(201).json(category);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Failed to create category" });
    }
});

/**
 * POST /api/categories/suggest
 * Submit a category suggestion
 */
router.post("/suggest", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const validated = insertSubmittedCategorySchema.parse({
            ...req.body,
            userId,
        });
        const submittedCategory = await storage.submitCategory(validated);
        res.status(201).json(submittedCategory);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return res.status(400).json({ message: fromZodError(error).message });
        }
        console.error("Error submitting category suggestion:", error);
        res.status(500).json({ message: "Failed to submit category suggestion" });
    }
});

/**
 * GET /api/categories/new-service-counts
 * Get count of new services per category since last visit
 */
router.get("/new-service-counts", isAuthenticated, async (req: any, res: Response) => {
    try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        // Capture timestamp BEFORE querying to avoid race conditions
        const currentVisitTime = new Date();

        // Get counts using the OLD timestamp (user.lastHomeVisitAt)
        const counts = await storage.getNewServiceCountsSince(
            userId,
            user?.lastHomeVisitAt || null
        );

        // Update to the CAPTURED timestamp (not new Date()!)
        await storage.updateUserLastHomeVisit(userId, currentVisitTime);

        res.json(counts);
    } catch (error) {
        console.error("Error fetching new service counts:", error);
        res.status(500).json({ message: "Failed to fetch new service counts" });
    }
});

// ===========================================
// SUBCATEGORIES
// ===========================================

/**
 * GET /api/categories/:categoryId/subcategories
 * Get subcategories for a category
 */
router.get("/:categoryId/subcategories", async (req: any, res: Response) => {
    try {
        const subcategories = await storage.getSubcategoriesByCategoryId(req.params.categoryId);
        res.json(subcategories);
    } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ message: "Failed to fetch subcategories" });
    }
});

// ===========================================
// EXPORTS
// ===========================================

export { router as categoriesRouter };

export function registerCategoriesRoutes(app: any): void {
    app.use("/api/categories", router);

    // Also register the subcategories route at /api/subcategories
    app.get("/api/subcategories", async (req: any, res: Response) => {
        try {
            const subcategories = await storage.getSubcategories();
            res.json(subcategories);
        } catch (error) {
            console.error("Error fetching all subcategories:", error);
            res.status(500).json({ message: "Failed to fetch subcategories" });
        }
    });
}
