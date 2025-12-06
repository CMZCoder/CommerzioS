/**
 * Shared Frontend Types
 * 
 * Common types used across multiple components.
 */

// API response wrapper
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Pagination types
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

// User types
export interface UserBasic {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
}

// Service types
export interface ServiceBasic {
    id: string;
    title: string;
    description: string;
    price: number;
    status: "active" | "paused" | "draft" | "expired";
}

// Booking types
export interface BookingBasic {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    totalPrice: number;
}

// Review types
export interface ReviewBasic {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
}

// Filter and sort options
export type SortDirection = "asc" | "desc";

export interface FilterOptions {
    search?: string;
    status?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
}
