/**
 * useUserServices Hook
 * 
 * Hook for managing user's services with CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, type ServiceWithDetails } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useUserServices() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch user's services
    const servicesQuery = useQuery<ServiceWithDetails[]>({
        queryKey: ["/api/users/me/services"],
        queryFn: () => apiRequest("/api/users/me/services"),
    });

    // Delete service
    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            apiRequest(`/api/services/${id}`, { method: "DELETE" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/services"] });
            toast({ title: "Service deleted", description: "Your service has been removed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
        },
    });

    // Pause/unpause service
    const togglePauseMutation = useMutation({
        mutationFn: ({ id, paused }: { id: string; paused: boolean }) =>
            apiRequest(`/api/services/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: paused ? "paused" : "active" }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/services"] });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
        },
    });

    // Renew service
    const renewMutation = useMutation({
        mutationFn: (id: string) =>
            apiRequest(`/api/services/${id}/renew`, { method: "POST" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/users/me/services"] });
            toast({ title: "Service renewed", description: "Your service has been renewed." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to renew service.", variant: "destructive" });
        },
    });

    return {
        services: servicesQuery.data ?? [],
        isLoading: servicesQuery.isLoading,
        deleteService: deleteMutation.mutate,
        togglePause: togglePauseMutation.mutate,
        renewService: renewMutation.mutate,
        isDeleting: deleteMutation.isPending,
        isUpdating: togglePauseMutation.isPending,
        isRenewing: renewMutation.isPending,
    };
}
