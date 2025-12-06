/**
 * Custom Hooks Index
 * 
 * Central export for all reusable hooks.
 */

// Profile and user data hooks
export { useProfileStats } from "./useProfileStats";
export { useUserAddresses } from "./useUserAddresses";
export { useUserServices } from "./useUserServices";
export { useUserReviews } from "./useUserReviews";
export { useUserBookings } from "./useUserBookings";

// Existing hooks (re-exports for convenience)
export { useAuth } from "./useAuth";
export { useToast } from "./use-toast";
