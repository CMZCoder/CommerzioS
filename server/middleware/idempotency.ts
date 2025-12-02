/**
 * Idempotency Middleware
 * 
 * Caches responses by x-idempotency-key header for 5 minutes.
 * Prevents duplicate requests from causing unintended side effects.
 * 
 * NOTE: Uses in-memory cache which is suitable for single-instance deployments.
 * For production multi-instance environments, replace with Redis-backed storage.
 */

import { Request, Response, NextFunction } from 'express';

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
  timestamp: number;
}

// In-memory cache for responses
// NOTE: For production multi-instance deployments, use Redis or similar distributed store
const responseCache: Map<string, CachedResponse> = new Map();

// Cleanup expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of responseCache) {
    if (now - cached.timestamp > CACHE_TTL_MS) {
      responseCache.delete(key);
    }
  }
}, 60000);

/**
 * Generate cache key from idempotency key and user context
 */
function generateCacheKey(req: Request): string | null {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;
  
  if (!idempotencyKey) {
    return null;
  }
  
  // Include user ID if authenticated to prevent cross-user cache issues
  const userId = (req as any).user?.id || 'anonymous';
  
  return `${userId}:${idempotencyKey}`;
}

/**
 * Idempotency middleware
 * 
 * Usage:
 * - Client sends x-idempotency-key header with a unique value (e.g., UUID)
 * - First request is processed normally, response is cached
 * - Subsequent requests with same key return cached response
 * - Cache expires after 5 minutes
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only apply to modifying methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }
  
  const cacheKey = generateCacheKey(req);
  
  // If no idempotency key provided, proceed without caching
  if (!cacheKey) {
    return next();
  }
  
  // Check for cached response
  const cached = responseCache.get(cacheKey);
  
  if (cached) {
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cached.timestamp < CACHE_TTL_MS) {
      // Return cached response
      res.setHeader('X-Idempotent-Replayed', 'true');
      
      // Set cached headers
      for (const [key, value] of Object.entries(cached.headers)) {
        res.setHeader(key, value);
      }
      
      return res.status(cached.statusCode).json(cached.body);
    }
    
    // Cache expired, remove it
    responseCache.delete(cacheKey);
  }
  
  // Capture the original json method
  const originalJson = res.json.bind(res);
  
  // Override json to capture response
  res.json = function(body: unknown) {
    // Cache the response
    const headersToCache: Record<string, string> = {};
    const headerNames = ['content-type', 'x-request-id', 'x-correlation-id'];
    
    for (const name of headerNames) {
      const value = res.getHeader(name);
      if (value) {
        headersToCache[name] = String(value);
      }
    }
    
    responseCache.set(cacheKey, {
      statusCode: res.statusCode,
      headers: headersToCache,
      body,
      timestamp: Date.now(),
    });
    
    // Set idempotency header
    res.setHeader('X-Idempotent-Replayed', 'false');
    
    // Call original json method
    return originalJson(body);
  };
  
  next();
}

/**
 * Clear idempotency cache for a specific key
 */
export function clearIdempotencyCache(idempotencyKey: string, userId?: string): void {
  const cacheKey = `${userId || 'anonymous'}:${idempotencyKey}`;
  responseCache.delete(cacheKey);
}

/**
 * Clear all idempotency cache entries for a user
 */
export function clearUserIdempotencyCache(userId: string): void {
  for (const key of responseCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      responseCache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getIdempotencyCacheStats(): { size: number; oldestEntry: number | null } {
  let oldestTimestamp: number | null = null;
  
  for (const cached of responseCache.values()) {
    if (oldestTimestamp === null || cached.timestamp < oldestTimestamp) {
      oldestTimestamp = cached.timestamp;
    }
  }
  
  return {
    size: responseCache.size,
    oldestEntry: oldestTimestamp,
  };
}

export default {
  idempotencyMiddleware,
  clearIdempotencyCache,
  clearUserIdempotencyCache,
  getIdempotencyCacheStats,
};
