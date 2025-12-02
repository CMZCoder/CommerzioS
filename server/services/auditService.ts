/**
 * Audit Service
 * 
 * Logs all pricing changes with comprehensive tracking information:
 * - userId: Who made the change
 * - action: What type of change (create, update, delete, etc.)
 * - previousValue: The value before the change
 * - newValue: The value after the change
 * - IP address and user agent for security
 */

import { db } from '../db';
import { pricingAuditLog, InsertPricingAuditLog } from '../../shared/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { Request } from 'express';

// ===========================================
// TYPES
// ===========================================

export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
export type AuditEntityType = 'service' | 'pricing_option';

export interface AuditLogEntry {
  userId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryOptions {
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Extract IP address from request
 */
function getIpAddress(req?: Request): string | undefined {
  if (!req) return undefined;
  
  // Check X-Forwarded-For header (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }
  
  // Fall back to direct IP
  return req.ip || req.socket?.remoteAddress;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req?: Request): string | undefined {
  if (!req) return undefined;
  return req.headers['user-agent'];
}

// ===========================================
// MAIN AUDIT FUNCTIONS
// ===========================================

/**
 * Log a pricing-related change
 */
export async function logPricingChange(
  entry: AuditLogEntry,
  req?: Request
): Promise<void> {
  try {
    const auditEntry: InsertPricingAuditLog = {
      userId: entry.userId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      previousValue: entry.previousValue as object | undefined,
      newValue: entry.newValue as object | undefined,
      ipAddress: entry.ipAddress || getIpAddress(req),
      userAgent: entry.userAgent || getUserAgent(req),
    };

    await db.insert(pricingAuditLog).values(auditEntry);
    
    console.log(`[Audit] ${entry.action} on ${entry.entityType}:${entry.entityId} by user ${entry.userId}`);
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Log a pricing option creation
 */
export async function logPricingOptionCreate(
  userId: string,
  pricingOptionId: string,
  newValue: unknown,
  req?: Request
): Promise<void> {
  await logPricingChange({
    userId,
    entityType: 'pricing_option',
    entityId: pricingOptionId,
    action: 'create',
    newValue,
  }, req);
}

/**
 * Log a pricing option update
 */
export async function logPricingOptionUpdate(
  userId: string,
  pricingOptionId: string,
  previousValue: unknown,
  newValue: unknown,
  req?: Request
): Promise<void> {
  await logPricingChange({
    userId,
    entityType: 'pricing_option',
    entityId: pricingOptionId,
    action: 'update',
    previousValue,
    newValue,
  }, req);
}

/**
 * Log a pricing option deletion
 */
export async function logPricingOptionDelete(
  userId: string,
  pricingOptionId: string,
  previousValue: unknown,
  req?: Request
): Promise<void> {
  await logPricingChange({
    userId,
    entityType: 'pricing_option',
    entityId: pricingOptionId,
    action: 'delete',
    previousValue,
  }, req);
}

/**
 * Log a service price update
 */
export async function logServicePriceUpdate(
  userId: string,
  serviceId: string,
  previousValue: unknown,
  newValue: unknown,
  req?: Request
): Promise<void> {
  await logPricingChange({
    userId,
    entityType: 'service',
    entityId: serviceId,
    action: 'update',
    previousValue,
    newValue,
  }, req);
}

// ===========================================
// QUERY FUNCTIONS
// ===========================================

/**
 * Get audit log entries with optional filtering
 */
export async function getAuditLogs(options: AuditQueryOptions = {}): Promise<typeof pricingAuditLog.$inferSelect[]> {
  const {
    userId,
    entityType,
    entityId,
    action,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = options;

  const conditions = [];

  if (userId) {
    conditions.push(eq(pricingAuditLog.userId, userId));
  }
  if (entityType) {
    conditions.push(eq(pricingAuditLog.entityType, entityType));
  }
  if (entityId) {
    conditions.push(eq(pricingAuditLog.entityId, entityId));
  }
  if (action) {
    conditions.push(eq(pricingAuditLog.action, action));
  }
  if (startDate) {
    conditions.push(gte(pricingAuditLog.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(pricingAuditLog.createdAt, endDate));
  }

  const query = db.select()
    .from(pricingAuditLog)
    .orderBy(desc(pricingAuditLog.createdAt))
    .limit(limit)
    .offset(offset);

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }

  return query;
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLog(
  entityType: AuditEntityType,
  entityId: string,
  limit: number = 20
): Promise<typeof pricingAuditLog.$inferSelect[]> {
  return getAuditLogs({
    entityType,
    entityId,
    limit,
  });
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLog(
  userId: string,
  limit: number = 50
): Promise<typeof pricingAuditLog.$inferSelect[]> {
  return getAuditLogs({
    userId,
    limit,
  });
}

/**
 * Get recent pricing changes (for admin monitoring)
 */
export async function getRecentPricingChanges(
  hours: number = 24
): Promise<typeof pricingAuditLog.$inferSelect[]> {
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
  return getAuditLogs({
    startDate,
    limit: 100,
  });
}

/**
 * Count pricing changes by user in time window (for rate limiting checks)
 */
export async function countUserPricingChanges(
  userId: string,
  windowMs: number
): Promise<number> {
  const startDate = new Date(Date.now() - windowMs);
  
  const logs = await getAuditLogs({
    userId,
    startDate,
    limit: 1000,
  });
  
  return logs.length;
}

export default {
  logPricingChange,
  logPricingOptionCreate,
  logPricingOptionUpdate,
  logPricingOptionDelete,
  logServicePriceUpdate,
  getAuditLogs,
  getEntityAuditLog,
  getUserAuditLog,
  getRecentPricingChanges,
  countUserPricingChanges,
};
