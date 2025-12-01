/**
 * Saved Searches Service
 * 
 * Allows users to save search criteria and optionally
 * receive notifications when new matching services are posted.
 */

import { db } from './db';
import { sql, eq, and, desc } from 'drizzle-orm';
import { pgTable, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createNotification } from './notificationService';

// ===========================================
// SAVED SEARCH TYPES
// ===========================================

export interface SavedSearchCriteria {
  query?: string;
  categoryId?: string;
  subcategoryId?: string;
  locations?: string[];
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  criteria: SavedSearchCriteria;
  notifyOnMatch: boolean;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Note: In a full implementation, you would add a savedSearches table to the schema.
// For now, we'll use an in-memory store as a demonstration.
// To properly implement, add this table to shared/schema.ts:
/*
export const savedSearches = pgTable("saved_searches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  criteria: jsonb("criteria").notNull(),
  notifyOnMatch: boolean("notify_on_match").default(false).notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
*/

// Temporary in-memory store (replace with database in production)
const savedSearchesStore: Map<string, SavedSearch> = new Map();

// ===========================================
// SAVED SEARCH OPERATIONS
// ===========================================

/**
 * Create a new saved search
 */
export async function createSavedSearch(params: {
  userId: string;
  name: string;
  criteria: SavedSearchCriteria;
  notifyOnMatch?: boolean;
}): Promise<SavedSearch> {
  const { userId, name, criteria, notifyOnMatch = false } = params;
  
  const id = `ss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const savedSearch: SavedSearch = {
    id,
    userId,
    name,
    criteria,
    notifyOnMatch,
    lastNotifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  savedSearchesStore.set(id, savedSearch);
  
  return savedSearch;
}

/**
 * Get saved searches for a user
 */
export async function getUserSavedSearches(userId: string): Promise<SavedSearch[]> {
  const searches: SavedSearch[] = [];
  
  savedSearchesStore.forEach((search) => {
    if (search.userId === userId) {
      searches.push(search);
    }
  });
  
  return searches.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Get a single saved search
 */
export async function getSavedSearch(id: string, userId: string): Promise<SavedSearch | null> {
  const search = savedSearchesStore.get(id);
  
  if (!search || search.userId !== userId) {
    return null;
  }
  
  return search;
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  id: string,
  userId: string,
  updates: Partial<Pick<SavedSearch, 'name' | 'criteria' | 'notifyOnMatch'>>
): Promise<SavedSearch | null> {
  const search = savedSearchesStore.get(id);
  
  if (!search || search.userId !== userId) {
    return null;
  }
  
  const updated = {
    ...search,
    ...updates,
    updatedAt: new Date(),
  };
  
  savedSearchesStore.set(id, updated);
  
  return updated;
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(id: string, userId: string): Promise<boolean> {
  const search = savedSearchesStore.get(id);
  
  if (!search || search.userId !== userId) {
    return false;
  }
  
  savedSearchesStore.delete(id);
  return true;
}

/**
 * Check if a new service matches any saved searches with notifications enabled
 * Call this when a new service is created
 */
export async function checkForMatchingSearches(service: {
  id: string;
  title: string;
  categoryId: string;
  subcategoryId?: string;
  locations: string[];
  price?: number;
  tags: string[];
}): Promise<void> {
  const matchedUsers: Set<string> = new Set();
  
  savedSearchesStore.forEach((search) => {
    if (!search.notifyOnMatch) return;
    
    const criteria = search.criteria;
    let matches = true;
    
    // Check category match
    if (criteria.categoryId && criteria.categoryId !== service.categoryId) {
      matches = false;
    }
    
    // Check subcategory match
    if (criteria.subcategoryId && criteria.subcategoryId !== service.subcategoryId) {
      matches = false;
    }
    
    // Check location match (at least one location should match)
    if (criteria.locations && criteria.locations.length > 0) {
      const hasLocationMatch = criteria.locations.some(loc => 
        service.locations.some(sLoc => 
          sLoc.toLowerCase().includes(loc.toLowerCase())
        )
      );
      if (!hasLocationMatch) {
        matches = false;
      }
    }
    
    // Check price range
    if (service.price !== undefined) {
      if (criteria.priceMin !== undefined && service.price < criteria.priceMin) {
        matches = false;
      }
      if (criteria.priceMax !== undefined && service.price > criteria.priceMax) {
        matches = false;
      }
    }
    
    // Check query match in title
    if (criteria.query && !service.title.toLowerCase().includes(criteria.query.toLowerCase())) {
      matches = false;
    }
    
    if (matches && !matchedUsers.has(search.userId)) {
      matchedUsers.add(search.userId);
      
      // Send notification
      createNotification({
        userId: search.userId,
        type: 'service',
        title: 'New Service Matches Your Search',
        message: `A new service "${service.title}" matches your saved search "${search.name}"`,
        actionUrl: `/service/${service.id}`,
        relatedEntityType: 'service',
        relatedEntityId: service.id,
      }).catch(err => console.error('Failed to send saved search notification:', err));
      
      // Update last notified time
      search.lastNotifiedAt = new Date();
      savedSearchesStore.set(search.id, search);
    }
  });
}
