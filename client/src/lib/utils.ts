import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a fuzzy/region-only location from a full address.
 * This hides street names to prevent pinpointing vendors outside the platform.
 * 
 * Examples:
 * - "Farman-Strasse 41, 8152 Glattbrugg" → "Glattbrugg"
 * - "Bahnhofstrasse 1, 8001 Zürich" → "Zürich"
 * - "Glattpark" → "Glattpark"
 * - "8152 Glattbrugg" → "Glattbrugg"
 */
export function getFuzzyLocation(location: string | undefined | null): string | null {
  if (!location) return null;
  
  const trimmed = location.trim();
  
  // If it's already a simple region name (no numbers, no comma), return as-is
  if (!trimmed.includes(",") && !/\d/.test(trimmed)) {
    return trimmed;
  }
  
  // Swiss address format: "Street Number, PostalCode City" or "PostalCode City"
  // Split by comma and take the last part (usually "PostalCode City")
  const parts = trimmed.split(",");
  const lastPart = parts[parts.length - 1].trim();
  
  // Extract city name from "PostalCode City" format (e.g., "8152 Glattbrugg" → "Glattbrugg")
  const postalMatch = lastPart.match(/^\d{4}\s+(.+)$/);
  if (postalMatch) {
    return postalMatch[1].trim();
  }
  
  // If the last part is just a postal code + city without street, return the city
  // Handle case like "8152 Glattbrugg"
  const directMatch = trimmed.match(/^\d{4}\s+(.+)$/);
  if (directMatch) {
    return directMatch[1].trim();
  }
  
  // If there's a comma, return everything after the last comma (likely the city)
  if (parts.length > 1) {
    const cityPart = parts[parts.length - 1].trim();
    // Remove postal code if present
    const withoutPostal = cityPart.replace(/^\d{4}\s+/, "");
    return withoutPostal || cityPart;
  }
  
  // Fallback: return as-is but truncate if too long (might be a long address)
  return trimmed.length > 20 ? trimmed.substring(0, 20) + "..." : trimmed;
}
