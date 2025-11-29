/**
 * Coordinate handling utilities for the service marketplace
 */

interface ServiceWithCoordinates {
  locationLat?: string | null;
  locationLng?: string | null;
  owner?: {
    locationLat?: number | null;
    locationLng?: number | null;
  } | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Resolves the best available coordinates for a service.
 * Prioritizes service-specific coordinates over owner coordinates.
 *
 * @param service - The service object with optional coordinates
 * @returns Coordinates object or null if no coordinates available
 */
export function resolveServiceCoordinates(
  service: ServiceWithCoordinates | null | undefined
): Coordinates | null {
  if (!service) {
    return null;
  }

  // First priority: service's own coordinates
  if (service.locationLat && service.locationLng) {
    const lat = parseFloat(service.locationLat);
    const lng = parseFloat(service.locationLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }

  // Second priority: owner's coordinates
  if (service.owner?.locationLat != null && service.owner?.locationLng != null) {
    return {
      lat: service.owner.locationLat,
      lng: service.owner.locationLng,
    };
  }

  return null;
}

/**
 * Calculates the distance between two points using the Haversine formula.
 *
 * @param lat1 - Latitude of the first point
 * @param lng1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lng2 - Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Builds a Google Maps directions URL with coordinates priority.
 * Uses coordinates if available, otherwise falls back to text address.
 *
 * @param destination - Destination coordinates (optional)
 * @param fallbackAddress - Fallback address string if no coordinates
 * @param origin - Origin coordinates (optional)
 * @returns Google Maps URL string
 */
export function buildDirectionsUrl(
  destination: Coordinates | null,
  fallbackAddress?: string,
  origin?: Coordinates | null
): string {
  const baseUrl = "https://www.google.com/maps/dir/";

  let destinationParam: string;
  if (destination) {
    destinationParam = `${destination.lat},${destination.lng}`;
  } else if (fallbackAddress) {
    destinationParam = encodeURIComponent(fallbackAddress);
  } else {
    return baseUrl;
  }

  if (origin) {
    const originParam = `${origin.lat},${origin.lng}`;
    return `${baseUrl}${originParam}/${destinationParam}`;
  }

  return `${baseUrl}/${destinationParam}`;
}
