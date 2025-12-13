import { Switch, Route, Redirect, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FloatingChatWidget } from "@/components/floating-chat-widget";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConfirmDialogProvider } from "@/hooks/useConfirmDialog";
import { usePageContext } from "@/hooks/use-page-context";
import { ThemeProvider } from "@/components/theme-provider";
import { createContext, useContext, useEffect } from "react";
import type { PageContextActions } from "@/hooks/use-page-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ServiceDetail from "@/pages/service-detail";
import Profile from "@/pages/profile";
import Favorites from "@/pages/favorites";
import HowItWorks from "@/pages/how-it-works";
import HelpCenter from "@/pages/help-center";
import TrustSafety from "@/pages/trust-safety";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import { AdminPage } from "@/pages/admin";
import EscrowManagementPage from "@/pages/admin/escrow-management";
import HashtagResults from "@/pages/hashtag-results";
import SearchResults from "@/pages/search";
import UserProfile from "@/pages/user-profile";
import PlansPage from "@/pages/plans";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import VerifyEmailPage from "@/pages/verify-email";
import ReferralsPage from "@/pages/referrals";
import RewardsPage from "@/pages/rewards";
import ChatPage from "@/pages/chat";
import VendorBookingsPage from "@/pages/vendor-bookings";
import MyBookingsPage from "@/pages/my-bookings";
import BookServicePage from "@/pages/book-service";
import BookingSuccessPage from "@/pages/booking-success";
import NotificationsPage from "@/pages/notifications";
import CustomerBookingsPage from "@/pages/bookings";
import DisputesPage from "@/pages/disputes";
import ServiceRequestsPage from "@/pages/service-requests";
import { useLocation } from "wouter";

// Redirect component for old /services/:id URLs to /service/:id
function ServiceRedirect() {
  const [match, params] = useRoute("/services/:id");
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (match && params?.id) {
      // Preserve hash and search params when redirecting
      const hash = window.location.hash;
      const search = window.location.search;
      // Convert old hash format (#questions-{id}) to query param (?question={id})
      let newSearch = search;
      if (hash.startsWith('#questions-')) {
        const questionId = hash.replace('#questions-', '');
        newSearch = search ? `${search}&question=${questionId}` : `?question=${questionId}`;
      }
      setLocation(`/service/${params.id}${newSearch}${hash.startsWith('#questions-') ? '' : hash}`);
    }
  }, [match, params?.id, setLocation]);

  return null;
}

// Create a context for the page context actions
export const PageContextActionsContext = createContext<PageContextActions | null>(null);

// Hook to access context actions from any component
export function usePageContextActions() {
  const context = useContext(PageContextActionsContext);
  if (!context) {
    throw new Error("usePageContextActions must be used within PageContextActionsProvider");
  }
  return context;
}

import { CookieConsent } from "@/components/cookie-consent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Redirect from old /services/:id URL format to /service/:id */}
      <Route path="/services/:id" component={ServiceRedirect} />
      <Route path="/service/:id" component={ServiceDetail} />
      <Route path="/service/:id/book" component={BookServicePage} />
      <Route path="/users/:userId" component={UserProfile} />
      <Route path="/hashtags/:hashtag" component={HashtagResults} />
      <Route path="/search" component={SearchResults} />
      <Route path="/profile" component={Profile} />
      <Route path="/dashboard" component={Profile} />
      <Route path="/settings" component={Profile} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/saved" component={Favorites} />
      <Route path="/categories" component={Home} />
      <Route path="/post-service" component={Profile} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/trust-safety" component={TrustSafety} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/admin/escrow" component={EscrowManagementPage} />
      <Route path="/admin/:tab/:id" component={AdminPage} />
      <Route path="/admin/:tab" component={AdminPage} />
      <Route path="/admin" component={AdminPage} />
      {/* Authentication routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      {/* Referral routes */}
      <Route path="/referrals" component={ReferralsPage} />
      <Route path="/invite" component={ReferralsPage} />
      {/* COM Points Rewards */}
      <Route path="/rewards" component={RewardsPage} />
      {/* Chat routes */}
      <Route path="/chat" component={ChatPage} />
      <Route path="/messages" component={ChatPage} />
      {/* Notification routes */}
      <Route path="/notifications" component={NotificationsPage} />
      {/* Booking routes */}
      <Route path="/bookings" component={CustomerBookingsPage} />
      <Route path="/booking-success" component={BookingSuccessPage} />
      {/* Dispute routes */}
      <Route path="/disputes" component={DisputesPage} />
      {/* Service Request routes */}
      <Route path="/service-requests" component={ServiceRequestsPage} />
      <Route path="/request-service" component={ServiceRequestsPage} />
      {/* Vendor routes */}
      <Route path="/vendor/bookings" component={VendorBookingsPage} />
      <Route path="/my-bookings" component={MyBookingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [pageContext, contextActions] = usePageContext();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ConfirmDialogProvider>
              <PageContextActionsContext.Provider value={contextActions}>
                <Toaster />
                <Router />
                <FloatingChatWidget pageContext={pageContext} />
                <CookieConsent />
              </PageContextActionsContext.Provider>
            </ConfirmDialogProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
