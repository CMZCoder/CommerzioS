/**
 * Service Analytics Service
 * 
 * Tracks and provides analytics for services including:
 * - Service views
 * - Contact clicks
 * - Favorite events
 * - Analytics summaries for service owners
 */

import { db } from './db';
import { services, favorites, users } from '@shared/schema';
import { eq, sql, and, gte, desc, count } from 'drizzle-orm';

// ===========================================
// VIEW TRACKING
// ===========================================

/**
 * Increment view count for a service
 */
export async function trackServiceView(serviceId: string): Promise<void> {
  try {
    await db.update(services)
      .set({
        viewCount: sql`${services.viewCount} + 1`,
      })
      .where(eq(services.id, serviceId));
  } catch (error) {
    console.error('Failed to track service view:', error);
  }
}

/**
 * Get view count for a service
 */
export async function getServiceViewCount(serviceId: string): Promise<number> {
  const [service] = await db.select({ viewCount: services.viewCount })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  
  return service?.viewCount || 0;
}

// ===========================================
// ANALYTICS SUMMARY
// ===========================================

interface ServiceAnalytics {
  serviceId: string;
  title: string;
  viewCount: number;
  favoriteCount: number;
  createdAt: Date;
  status: string;
}

interface OwnerAnalyticsSummary {
  totalServices: number;
  activeServices: number;
  totalViews: number;
  totalFavorites: number;
  services: ServiceAnalytics[];
}

/**
 * Get analytics summary for a service owner
 */
export async function getOwnerAnalyticsSummary(ownerId: string): Promise<OwnerAnalyticsSummary> {
  // Get all services for the owner
  const ownerServices = await db.select({
    id: services.id,
    title: services.title,
    viewCount: services.viewCount,
    createdAt: services.createdAt,
    status: services.status,
  })
    .from(services)
    .where(eq(services.ownerId, ownerId))
    .orderBy(desc(services.viewCount));
  
  // Get favorite counts for each service
  const serviceIds = ownerServices.map(s => s.id);
  const favoriteCounts = await Promise.all(
    serviceIds.map(async (serviceId) => {
      const [result] = await db.select({ count: count() })
        .from(favorites)
        .where(eq(favorites.serviceId, serviceId));
      return { serviceId, count: result?.count || 0 };
    })
  );
  
  const favoriteMap = new Map(favoriteCounts.map(f => [f.serviceId, f.count]));
  
  // Build analytics for each service
  const serviceAnalytics: ServiceAnalytics[] = ownerServices.map(service => ({
    serviceId: service.id,
    title: service.title,
    viewCount: service.viewCount,
    favoriteCount: favoriteMap.get(service.id) || 0,
    createdAt: service.createdAt,
    status: service.status,
  }));
  
  // Calculate totals
  const totalViews = serviceAnalytics.reduce((sum, s) => sum + s.viewCount, 0);
  const totalFavorites = serviceAnalytics.reduce((sum, s) => sum + s.favoriteCount, 0);
  const activeServices = serviceAnalytics.filter(s => s.status === 'active').length;
  
  return {
    totalServices: ownerServices.length,
    activeServices,
    totalViews,
    totalFavorites,
    services: serviceAnalytics,
  };
}

/**
 * Get analytics for a specific service
 */
export async function getServiceAnalytics(serviceId: string, ownerId: string): Promise<ServiceAnalytics | null> {
  const [service] = await db.select({
    id: services.id,
    title: services.title,
    viewCount: services.viewCount,
    createdAt: services.createdAt,
    status: services.status,
    ownerId: services.ownerId,
  })
    .from(services)
    .where(and(
      eq(services.id, serviceId),
      eq(services.ownerId, ownerId)
    ))
    .limit(1);
  
  if (!service) {
    return null;
  }
  
  // Get favorite count
  const [favoriteResult] = await db.select({ count: count() })
    .from(favorites)
    .where(eq(favorites.serviceId, serviceId));
  
  return {
    serviceId: service.id,
    title: service.title,
    viewCount: service.viewCount,
    favoriteCount: favoriteResult?.count || 0,
    createdAt: service.createdAt,
    status: service.status,
  };
}

// ===========================================
// TRENDING SERVICES
// ===========================================

/**
 * Get trending services based on recent activity
 */
export async function getTrendingServices(limit: number = 10): Promise<Array<{
  id: string;
  title: string;
  viewCount: number;
  categoryId: string;
}>> {
  const trending = await db.select({
    id: services.id,
    title: services.title,
    viewCount: services.viewCount,
    categoryId: services.categoryId,
  })
    .from(services)
    .where(eq(services.status, 'active'))
    .orderBy(desc(services.viewCount))
    .limit(limit);
  
  return trending;
}
