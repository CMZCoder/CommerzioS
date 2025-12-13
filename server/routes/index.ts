/**
 * Route Module Index
 * Aggregates all route modules and registers them with the Express app.
 * 
 * Complete modules are fully migrated from routes.ts and functional.
 * Stub modules are prepared placeholders for future migration.
 */

import { Express } from "express";

// Complete route modules (fully migrated)
import { registerHealthRoutes } from "./health.routes";
import { registerCreditsRoutes } from "./credits.routes";
import { registerBookingAvailabilityRoutes } from "./bookingAvailability.routes";
import { registerBookingFlowRoutes } from "./bookingFlow.routes";
import { registerComPointsRoutes } from "./comPoints.routes";
import { registerDisputesRoutes } from "./disputes.routes";

// Stub route modules (prepared for migration)
import { registerUsersRoutes } from "./users.routes";
import { registerServicesRoutes } from "./services.routes";
import { registerBookingsRoutes } from "./bookings.routes";
import { registerPaymentsRoutes } from "./payments.routes";
import { registerAdminRoutes } from "./admin.routes";
import { registerChatRoutes } from "./chat.routes";
import { registerCategoriesRoutes } from "./categories.routes";
import { registerNotificationsRoutes } from "./notifications.routes";
import { registerReviewsRoutes } from "./reviews.routes";
import { registerReferralsRoutes } from "./referrals.routes";

/**
 * Register all modular routes with the Express app
 * Call this function from your main app setup after routes.ts
 */
export function registerModularRoutes(app: Express): void {
    // === COMPLETE MODULES ===
    registerHealthRoutes(app);
    registerCreditsRoutes(app);
    registerBookingAvailabilityRoutes(app);
    registerBookingFlowRoutes(app);
    registerComPointsRoutes(app);
    registerDisputesRoutes(app);

    // === STUB MODULES (prepared for migration) ===
    // These are empty placeholders that will be populated
    // as endpoints are migrated from the monolithic routes.ts
    registerUsersRoutes(app);
    registerServicesRoutes(app);
    registerBookingsRoutes(app);
    registerPaymentsRoutes(app);
    registerAdminRoutes(app);
    registerChatRoutes(app);
    registerCategoriesRoutes(app);
    registerNotificationsRoutes(app);
    registerReviewsRoutes(app);
    registerReferralsRoutes(app);

    console.log("✓ All modular routes registered (6 complete, 10 stubs)");
}

// Re-export for backward compatibility
export { registerModularRoutes as registerRoutes };
