/**
 * Analytics Service
 * 
 * Handles service analytics tracking including:
 * - View count tracking
 * - Favorites counting
 * - Vendor analytics summary
 */

import { db } from './db';
import { sql, eq, inArray } from 'drizzle-orm';
import { services, favorites } from '../shared/schema';

/**
 * Track a view on a service
 */
export async function trackServiceView(
  serviceId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Increment view count on service
  await db.update(services)
    .set({ 
      viewCount: sql`COALESCE(view_count, 0) + 1` 
    })
    .where(eq(services.id, serviceId));
}

/**
 * Get analytics for a specific service
 */
export async function getServiceAnalytics(
  serviceId: string,
  days: number = 30
): Promise<{ views: number; favorites: number; contactClicks: number }> {
  const [service] = await db.select({
    views: services.viewCount,
  }).from(services).where(eq(services.id, serviceId));

  const [favCount] = await db.select({
    count: sql<number>`count(*)`,
  }).from(favorites).where(eq(favorites.serviceId, serviceId));

  return {
    views: service?.views || 0,
    favorites: Number(favCount?.count) || 0,
    contactClicks: 0, // Would need separate tracking table
  };
}

/**
 * Get analytics summary for a vendor
 */
export async function getVendorAnalyticsSummary(vendorId: string): Promise<{
  totalViews: number;
  totalFavorites: number;
  totalServices: number;
}> {
  // Get vendor's services stats
  const [stats] = await db.select({
    totalViews: sql<number>`COALESCE(SUM(view_count), 0)`,
    totalServices: sql<number>`count(*)`,
  }).from(services).where(eq(services.ownerId, vendorId));

  // Get vendor's service IDs
  const vendorServices = await db.select({ id: services.id })
    .from(services)
    .where(eq(services.ownerId, vendorId));
  
  const serviceIds = vendorServices.map(s => s.id);
  
  // Count favorites across all vendor services
  let totalFavorites = 0;
  if (serviceIds.length > 0) {
    const [favStats] = await db.select({
      count: sql<number>`count(*)`,
    }).from(favorites).where(inArray(favorites.serviceId, serviceIds));
    totalFavorites = Number(favStats?.count) || 0;
  }

  return {
    totalViews: Number(stats?.totalViews) || 0,
    totalFavorites,
    totalServices: Number(stats?.totalServices) || 0,
  };
}
