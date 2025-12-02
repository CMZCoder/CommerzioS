/**
 * Re-authentication Middleware
 * 
 * Requires recent password verification for sensitive operations like pricing changes.
 * Users must have authenticated within the last 5 minutes to perform the operation.
 */

import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Re-authentication window in milliseconds (5 minutes)
const REAUTH_WINDOW_MS = 5 * 60 * 1000;

// Store for tracking recent authentications (keyed by user ID)
interface ReauthRecord {
  timestamp: number;
  verified: boolean;
}

const reauthStore: Map<string, ReauthRecord> = new Map();

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [userId, record] of reauthStore) {
    if (now - record.timestamp > REAUTH_WINDOW_MS) {
      reauthStore.delete(userId);
    }
  }
}, 60000);

/**
 * Middleware that requires recent password verification
 * Returns 401 if user needs to re-authenticate
 */
export function requireRecentAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      requiresReauth: true,
    });
  }
  
  const record = reauthStore.get(userId);
  const now = Date.now();
  
  // Check if user has verified their password recently
  if (record && record.verified && (now - record.timestamp) < REAUTH_WINDOW_MS) {
    return next();
  }
  
  // User needs to re-authenticate
  return res.status(401).json({
    success: false,
    error: 'Please verify your password to continue',
    requiresReauth: true,
    reauthEndpoint: '/api/auth/reauth',
  });
}

/**
 * Verify password and mark user as recently authenticated
 * This should be called from the /api/auth/reauth endpoint
 */
export async function verifyReauthPassword(userId: string, password: string): Promise<boolean> {
  try {
    // Get user from database
    const [user] = await db.select({
      id: users.id,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
    if (!user || !user.passwordHash) {
      return false;
    }
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isValid) {
      // Mark as recently authenticated
      reauthStore.set(userId, {
        timestamp: Date.now(),
        verified: true,
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Re-authentication error:', error);
    return false;
  }
}

/**
 * Clear re-authentication for a user (e.g., on logout)
 */
export function clearReauth(userId: string): void {
  reauthStore.delete(userId);
}

/**
 * Check if user has recent authentication without blocking
 * Returns true if authenticated within window, false otherwise
 */
export function hasRecentAuth(userId: string): boolean {
  const record = reauthStore.get(userId);
  if (!record) return false;
  
  const now = Date.now();
  return record.verified && (now - record.timestamp) < REAUTH_WINDOW_MS;
}

/**
 * Get remaining time until re-auth expires (in seconds)
 * Returns 0 if not authenticated or expired
 */
export function getReauthTimeRemaining(userId: string): number {
  const record = reauthStore.get(userId);
  if (!record || !record.verified) return 0;
  
  const elapsed = Date.now() - record.timestamp;
  const remaining = REAUTH_WINDOW_MS - elapsed;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export default {
  requireRecentAuth,
  verifyReauthPassword,
  clearReauth,
  hasRecentAuth,
  getReauthTimeRemaining,
};
