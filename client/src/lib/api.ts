import type { Service, Review, Category, User, Favorite, Subcategory } from "@shared/schema";
import { getApiUrl } from "./config";

// Extended Category type to handle temporary categories with additional fields
export interface CategoryWithTemporary extends Category {
  isTemporary?: boolean;
  expiresAt?: Date;
}

export interface ServiceWithDetails extends Service {
  locationLat: string | null;
  locationLng: string | null;
  preferredLocationName: string | null;
  owner: User;
  category: Category;
  subcategory?: Subcategory | null;
  rating: number;
  reviewCount: number;
}

export interface ReviewWithUser extends Review {
  user: User;
}

export interface FavoriteWithService extends Favorite {
  service: ServiceWithDetails;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Use getApiUrl for /api paths to support split architecture
  const url = endpoint.startsWith('/api') ? getApiUrl(endpoint) : endpoint;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies for cross-domain auth
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || response.statusText;
    } catch {
      errorMessage = errorText || response.statusText;
    }
    throw new Error(`${response.status}: ${errorMessage}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
