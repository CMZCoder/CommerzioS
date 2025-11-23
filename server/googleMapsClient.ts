// Simple Google Maps API key getter
export function getGoogleMapsApiKey(): string {
  return process.env.GOOGLE_MAPS_API_KEY || "";
}

export function isGoogleMapsConfigured(): boolean {
  return !!process.env.GOOGLE_MAPS_API_KEY;
}
