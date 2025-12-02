/**
 * Rate Limiter Middleware
 * 
 * Provides rate limiting for various API endpoints to prevent abuse:
 * - apiLimiter: 1000 req/hour for general API endpoints
 * - pricingLimiter: 10 changes/hour for pricing modifications
 * - authLimiter: 5 attempts/15min for authentication
 */

import { Request, Response, NextFunction } from 'express';

// In-memory store for rate limiting (for production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const stores: { [limiterName: string]: RateLimitStore } = {};

interface RateLimiterConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
  message: string;       // Error message when limit exceeded
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Create a rate limiter middleware
 */
function createRateLimiter(name: string, config: RateLimiterConfig) {
  // Initialize store for this limiter
  if (!stores[name]) {
    stores[name] = {};
  }
  
  const store = stores[name];
  
  // Cleanup old entries periodically (every minute)
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    }
  }, 60000);
  
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key (default: IP + authenticated user ID)
      const key = config.keyGenerator 
        ? config.keyGenerator(req) 
        : getDefaultKey(req);
      
      const now = Date.now();
      
      // Get or create entry
      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + config.windowMs,
        };
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', config.maxRequests - 1);
        res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
        
        return next();
      }
      
      // Increment count
      store[key].count++;
      
      // Calculate remaining
      const remaining = Math.max(0, config.maxRequests - store[key].count);
      
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(store[key].resetTime / 1000));
      
      // Check if limit exceeded
      if (store[key].count > config.maxRequests) {
        const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        
        return res.status(429).json({
          success: false,
          error: config.message,
          retryAfter,
        });
      }
      
      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request to proceed
      next();
    }
  };
}

/**
 * Get default rate limiting key (IP + user ID if authenticated)
 */
function getDefaultKey(req: Request): string {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const userId = (req as any).user?.id || 'anonymous';
  return `${ip}:${userId}`;
}

/**
 * Get IP-only key (for auth endpoints where user isn't authenticated yet)
 */
function getIpKey(req: Request): string {
  return req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
}

/**
 * General API rate limiter
 * 1000 requests per hour
 */
export const apiLimiter = createRateLimiter('api', {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 1000,
  message: 'Too many requests. Please try again later.',
});

/**
 * Pricing changes rate limiter
 * 10 changes per hour (sensitive operation)
 */
export const pricingLimiter = createRateLimiter('pricing', {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many pricing changes. Please wait before making more changes.',
});

/**
 * Authentication rate limiter
 * 5 attempts per 15 minutes (prevents brute force)
 */
export const authLimiter = createRateLimiter('auth', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
  keyGenerator: getIpKey,
});

/**
 * Strict rate limiter for highly sensitive operations
 * 3 attempts per hour
 */
export const strictLimiter = createRateLimiter('strict', {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'This action is rate limited. Please try again later.',
});

export default {
  apiLimiter,
  pricingLimiter,
  authLimiter,
  strictLimiter,
};
