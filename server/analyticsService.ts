/**
 * Analytics Service
 * 
 * Tracks and analyzes service performance metrics including:
 * - Page views
 * - Contact clicks
 * - Favorites
 * - Shares
 * 
 * Provides aggregated analytics for vendors and admin dashboards.
 */

import { db } from './db';
import { sql, eq, and, gte, desc } from 'drizzle-orm';
import { services, favorites } from '@shared/schema';

// ===========================================
// TYPES
// ===========================================

export interface ServiceAnalytics {
  serviceId: string;
  views: number;
  contactClicks: number;
  favorites: number;
  shares: number;
  viewsByDay: Array<{ date: string; count: number }>;
}

export interface VendorAnalyticsSummary {
  vendorId: string;
  totalViews: number;
  totalContactClicks: number;
  totalFavorites: number;
  totalShares: number;
  topServices: Array<{
    serviceId: string;
    title: string;
    views: number;
  }>;
  recentActivity: Array<{
    date: string;
    views: number;
    contactClicks: number;
  }>;
}

// ===========================================
// SERVICE EVENT TRACKING
// ===========================================

/**
 * Track a service event
 * Note: For MVP, we're using the existing viewCount field for views.
 * Contact clicks, favorites, and shares would need additional tracking tables.
 */
export async function trackServiceEvent(
  serviceId: string,
  eventType: 'view' | 'contact_click' | 'favorite' | 'share',
  _userId?: string,
  _metadata?: Record<string, unknown>
): Promise<void> {
  try {
    switch (eventType) {
      case 'view':
        // Use existing viewCount increment
        await db.update(services)
          .set({
            viewCount: sql`${services.viewCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(services.id, serviceId));
        break;
      case 'contact_click':
        // For now, log the event - future: store in service_events table
        console.log(`Contact click tracked for service ${serviceId}`);
        break;
      case 'favorite':
        // Already tracked via favorites table
        console.log(`Favorite tracked for service ${serviceId}`);
        break;
      case 'share':
        // For now, log the event - future: store in service_events table
        console.log(`Share tracked for service ${serviceId}`);
        break;
    }
  } catch (error) {
    console.error('Failed to track service event:', error);
  }
}

// ===========================================
// ANALYTICS QUERIES
// ===========================================

/**
 * Get analytics for a specific service
 */
export async function getServiceAnalytics(
  serviceId: string,
  days: number = 30
): Promise<ServiceAnalytics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get current service data
  const [service] = await db.select({
    viewCount: services.viewCount,
  })
  .from(services)
  .where(eq(services.id, serviceId))
  .limit(1);

  // Get favorites count
  const [favoritesCount] = await db.select({
    count: sql<number>`count(*)::int`,
  })
  .from(favorites)
  .where(eq(favorites.serviceId, serviceId));

  return {
    serviceId,
    views: service?.viewCount || 0,
    contactClicks: 0, // Would need separate tracking table
    favorites: favoritesCount?.count || 0,
    shares: 0, // Would need separate tracking table
    viewsByDay: [], // Would need time-series tracking
  };
}

/**
 * Get aggregated analytics summary for a vendor
 */
export async function getVendorAnalyticsSummary(
  vendorId: string
): Promise<VendorAnalyticsSummary> {
  // Get all services for vendor
  const vendorServices = await db.select({
    id: services.id,
    title: services.title,
    viewCount: services.viewCount,
  })
  .from(services)
  .where(eq(services.ownerId, vendorId))
  .orderBy(desc(services.viewCount))
  .limit(10);

  // Calculate totals
  const totalViews = vendorServices.reduce((sum, s) => sum + s.viewCount, 0);

  // Get total favorites across all services
  const [totalFavoritesResult] = await db.select({
    count: sql<number>`count(*)::int`,
  })
  .from(favorites)
  .innerJoin(services, eq(favorites.serviceId, services.id))
  .where(eq(services.ownerId, vendorId));

  return {
    vendorId,
    totalViews,
    totalContactClicks: 0, // Would need separate tracking
    totalFavorites: totalFavoritesResult?.count || 0,
    totalShares: 0, // Would need separate tracking
    topServices: vendorServices.map(s => ({
      serviceId: s.id,
      title: s.title,
      views: s.viewCount,
    })),
    recentActivity: [], // Would need time-series tracking
  };
}

/**
 * Track service view (convenience function)
 */
export async function trackServiceView(serviceId: string, userId?: string): Promise<void> {
  await trackServiceEvent(serviceId, 'view', userId);
}

/**
 * Track contact click
 */
export async function trackContactClick(serviceId: string, userId?: string): Promise<void> {
  await trackServiceEvent(serviceId, 'contact_click', userId);
}
