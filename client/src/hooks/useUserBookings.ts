/**
 * useUserBookings Hook
 * 
 * Hook for fetching user's bookings.
 */

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface Booking {
    id: string;
    status: string;
    scheduledDate: string;
    scheduledTime: string;
    service: { id: string; title: string };
    customer?: { firstName: string; lastName: string };
    vendor?: { firstName: string; lastName: string };
}

export function useUserBookings() {
    // Bookings as customer
    const asCustomerQuery = useQuery<Booking[]>({
        queryKey: ["/api/users/me/bookings"],
        queryFn: () => apiRequest("/api/users/me/bookings"),
    });

    // Bookings as vendor
    const asVendorQuery = useQuery<Booking[]>({
        queryKey: ["/api/users/me/bookings-as-vendor"],
        queryFn: () => apiRequest("/api/users/me/bookings-as-vendor"),
    });

    return {
        bookingsAsCustomer: asCustomerQuery.data ?? [],
        bookingsAsVendor: asVendorQuery.data ?? [],
        isLoadingAsCustomer: asCustomerQuery.isLoading,
        isLoadingAsVendor: asVendorQuery.isLoading,
    };
}
