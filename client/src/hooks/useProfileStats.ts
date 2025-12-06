/**
 * useProfileStats Hook
 * 
 * Simple hook to fetch user profile statistics.
 * Extracted to reduce profile page complexity.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface ProfileStats {
    bookings: number;
    reviews: number;
    favorites: number;
    services: number;
}

export function useProfileStats() {
    return useQuery<ProfileStats>({
        queryKey: ["/api/users/me/stats"],
        queryFn: () => apiRequest("/api/users/me/stats"),
    });
}
