/**
 * useUserAddresses Hook
 * 
 * Hook for managing user addresses with CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { SelectAddress } from "@shared/schema";

interface AddressFormData {
    label?: string;
    street: string;
    city: string;
    postalCode: string;
    canton?: string;
    country: string;
    isPrimary: boolean;
}

export function useUserAddresses() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch addresses
    const addressesQuery = useQuery<SelectAddress[]>({
        queryKey: ["/api/users/me/addresses"],
        queryFn: () => apiRequest("/api/users/me/addresses"),
    });

    // Create address
    const createMutation = useMutation({
        mutationFn: (data: AddressFormData) =>
            apiRequest("/api/users/me/addresses", {
                method: "POST",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
            toast({ title: "Address added", description: "Your address has been saved." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to add address.", variant: "destructive" });
        },
    });

    // Update address
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
            apiRequest(`/api/users/me/addresses/${id}`, {
                method: "PATCH",
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
            toast({ title: "Address updated", description: "Your address has been updated." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update address.", variant: "destructive" });
        },
    });

    // Delete address
    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            apiRequest(`/api/users/me/addresses/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
            toast({ title: "Address removed", description: "Your address has been deleted." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete address.", variant: "destructive" });
        },
    });

    return {
        addresses: addressesQuery.data ?? [],
        isLoading: addressesQuery.isLoading,
        createAddress: createMutation.mutate,
        updateAddress: updateMutation.mutate,
        deleteAddress: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
