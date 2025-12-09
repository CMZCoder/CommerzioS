/**
 * Application Constants
 * 
 * Centralized constants for the frontend application.
 */

// API configuration
export const API_BASE_URL = "/api";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Date formats
export const DATE_FORMAT = "dd.MM.yyyy";
export const TIME_FORMAT = "HH:mm";
export const DATETIME_FORMAT = "dd.MM.yyyy HH:mm";

// Status colors for badges
export const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
    paused: "bg-gray-100 text-gray-800",
    draft: "bg-gray-100 text-gray-800",
    expired: "bg-red-100 text-red-800",
};

// Swiss cantons
export const SWISS_CANTONS = [
    "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR",
    "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG",
    "TI", "UR", "VD", "VS", "ZG", "ZH",
];

// File upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGES_PER_SERVICE = 10;
