/**
 * Route Module Index
 * Aggregates all route modules and registers them with the Express app.
 * 
 * NOTE: This file is prepared for incremental migration from routes.ts
 * Currently, routes.ts is still the active entry point.
 */

import { Express } from "express";
import { registerHealthRoutes } from "./health.routes";

/**
 * Register all modular routes with the Express app
 * Call this function from your main app setup
 */
export function registerRoutes(app: Express): void {
    // Register route modules
    registerHealthRoutes(app);

    // Future modules will be registered here:
    // registerUsersRoutes(app);
    // registerServicesRoutes(app);
    // registerBookingsRoutes(app);
    // etc.
}
