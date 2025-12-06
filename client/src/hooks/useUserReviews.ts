/**
 * useUserReviews Hook
 * 
 * Hook for managing user reviews (received and given).
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface Review {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    service?: { id: string; title: string };
    reviewer?: { firstName: string; lastName: string };
    customer?: { firstName: string; lastName: string };
}

export function useUserReviews() {
    // Reviews received by the user
    const receivedQuery = useQuery<Review[]>({
        queryKey: ["/api/users/me/reviews-received"],
        queryFn: () => apiRequest("/api/users/me/reviews-received"),
    });

    // Reviews given by the user
    const givenQuery = useQuery<Review[]>({
        queryKey: ["/api/users/me/reviews-given"],
        queryFn: () => apiRequest("/api/users/me/reviews-given"),
    });

    return {
        receivedReviews: receivedQuery.data ?? [],
        givenReviews: givenQuery.data ?? [],
        isLoadingReceived: receivedQuery.isLoading,
        isLoadingGiven: givenQuery.isLoading,
    };
}
