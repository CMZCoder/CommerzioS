/**
 * Auto-Archive Service
 * Automatically archives service listings that have been expired for more than 10 days
 */

import { db } from '../db';
import { services } from '@shared/schema';
import { and, lt, ne, eq, sql } from 'drizzle-orm';

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

/**
 * Archives service listings that have been expired for more than 10 days.
 * This prevents old expired listings from cluttering the "To Renew" tab
 * and moves them to the "Archived" tab automatically.
 */
export async function autoArchiveExpiredListings(): Promise<number> {
    const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);

    try {
        // Find and update all services that:
        // 1. Are not already archived
        // 2. Are not drafts
        // 3. Have an expiresAt date older than 10 days ago
        const result = await db
            .update(services)
            .set({
                status: 'archived',
                updatedAt: new Date()
            })
            .where(
                and(
                    ne(services.status, 'archived'),
                    ne(services.status, 'draft'),
                    lt(services.expiresAt, tenDaysAgo)
                )
            )
            .returning({ id: services.id, title: services.title });

        if (result.length > 0) {
            console.log(`[Auto-Archive] Archived ${result.length} expired listings:`,
                result.map(s => s.title || s.id).join(', '));
        }

        return result.length;
    } catch (error) {
        console.error('[Auto-Archive] Error archiving expired listings:', error);
        throw error;
    }
}
