/**
 * Saved Search Service
 * 
 * Allows users to save their search criteria for quick access
 * and optional notifications when new matching services are posted.
 */

import { db } from './db';
import { savedSearches, InsertSavedSearch, SavedSearch } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';

// ===========================================
// SAVED SEARCH OPERATIONS
// ===========================================

/**
 * Get all saved searches for a user
 */
export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  return db.select()
    .from(savedSearches)
    .where(eq(savedSearches.userId, userId))
    .orderBy(desc(savedSearches.createdAt));
}

/**
 * Get a specific saved search by ID
 */
export async function getSavedSearchById(
  id: string, 
  userId: string
): Promise<SavedSearch | null> {
  const [search] = await db.select()
    .from(savedSearches)
    .where(eq(savedSearches.id, id))
    .limit(1);

  if (!search || search.userId !== userId) {
    return null;
  }

  return search;
}

/**
 * Create a new saved search
 */
export async function createSavedSearch(
  userId: string,
  data: Omit<InsertSavedSearch, 'userId' | 'id' | 'createdAt'>
): Promise<SavedSearch> {
  const [created] = await db.insert(savedSearches)
    .values({
      userId,
      ...data,
    })
    .returning();

  return created;
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  id: string,
  userId: string,
  data: Partial<Omit<InsertSavedSearch, 'userId' | 'id' | 'createdAt'>>
): Promise<SavedSearch | null> {
  const [updated] = await db.update(savedSearches)
    .set(data)
    .where(eq(savedSearches.id, id))
    .returning();

  if (!updated || updated.userId !== userId) {
    return null;
  }

  return updated;
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(
  id: string,
  userId: string
): Promise<boolean> {
  const [search] = await db.select()
    .from(savedSearches)
    .where(eq(savedSearches.id, id))
    .limit(1);

  if (!search || search.userId !== userId) {
    return false;
  }

  await db.delete(savedSearches)
    .where(eq(savedSearches.id, id));

  return true;
}

/**
 * Get saved searches that have notification enabled
 * Used for sending alerts when new matching services are posted
 */
export async function getSavedSearchesWithNotifications(): Promise<SavedSearch[]> {
  return db.select()
    .from(savedSearches)
    .where(eq(savedSearches.notifyOnNew, true));
}
