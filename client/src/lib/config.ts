/**
 * Application configuration
 * 
 * For split architecture (frontend on Vercel, backend on Railway):
 * - Set VITE_API_URL to your Railway backend URL (e.g., https://api.commerzio.online)
 * - Set VITE_CDN_URL to your R2 CDN URL (e.g., https://cdn.commerzio.online)
 * - In development, leave them empty to use same-origin requests
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const CDN_URL = import.meta.env.VITE_CDN_URL || '';

/**
 * Build full API URL from a path
 * @param path - API path starting with /api (e.g., /api/users)
 * @returns Full URL with base if configured
 */
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Convert an image path to a CDN URL
 * Handles /objects/uploads/... paths and converts them to CDN URLs
 * @param path - Image path (e.g., /objects/uploads/uuid or https://cdn...)
 * @returns Full CDN URL or original path if already a full URL
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '';
  
  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Convert /objects/uploads/... to CDN URL
  if (path.startsWith('/objects/')) {
    const objectPath = path.replace('/objects/', '');
    return CDN_URL ? `${CDN_URL}/${objectPath}` : `${API_BASE_URL}${path}`;
  }
  
  // For other relative paths, use API
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`;
  }
  
  return path;
}

/**
 * Fetch wrapper that automatically prepends API_BASE_URL for /api paths
 * Use this instead of raw fetch() for API calls
 * 
 * @param input - URL or Request object
 * @param init - Fetch options
 * @returns Promise<Response>
 */
export function fetchApi(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Handle string URLs
  if (typeof input === 'string') {
    const url = input.startsWith('/api') ? getApiUrl(input) : input;
    return fetch(url, {
      ...init,
      credentials: init?.credentials ?? 'include', // Default to include for cross-domain auth
    });
  }
  
  // Handle Request objects
  if (input instanceof Request) {
    const url = input.url.startsWith('/api') ? getApiUrl(input.url) : input.url;
    return fetch(new Request(url, input), init);
  }
  
  // Handle URL objects
  const urlStr = input.toString();
  const fullUrl = urlStr.startsWith('/api') ? getApiUrl(urlStr) : urlStr;
  return fetch(fullUrl, {
    ...init,
    credentials: init?.credentials ?? 'include',
  });
}
