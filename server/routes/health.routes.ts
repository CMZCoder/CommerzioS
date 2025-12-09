/**
 * Health Check Routes
 * Simple health check endpoint for monitoring
 */

import { Express } from "express";

export function registerHealthRoutes(app: Express): void {
    // Health check endpoint
    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok", timestamp: new Date().toISOString() });
    });
}
