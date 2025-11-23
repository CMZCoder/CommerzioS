import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";

export interface PageContext {
  currentPage: string;
  currentRoute: string;
  currentAction: "browsing" | "creating_service" | "editing_service" | "viewing_service" | "none";
  formData: {
    hasTitle?: boolean;
    hasDescription?: boolean;
    hasCategory?: boolean;
    hasImages?: boolean;
    hasLocation?: boolean;
    hasContact?: boolean;
    hasPrice?: boolean;
    imageCount?: number;
  };
  metadata: {
    timeOnPage?: number;
    lastInteraction?: number;
    modalOpenTime?: number;
  };
}

export interface PageContextActions {
  setModalOpen: (modal: "create_service" | "edit_service" | null) => void;
  updateFormProgress: (field: string, value: boolean | number) => void;
  recordInteraction: () => void;
  resetContext: () => void;
}

const getPageName = (route: string): string => {
  if (route === "/") return "home";
  if (route.startsWith("/service/")) return "service_detail";
  if (route === "/dashboard") return "dashboard";
  if (route === "/help-center") return "help_center";
  return "other";
};

export function usePageContext(): [PageContext, PageContextActions] {
  const [location] = useLocation();
  const [currentModal, setCurrentModal] = useState<"create_service" | "edit_service" | null>(null);
  const [formData, setFormData] = useState<PageContext["formData"]>({});
  const [timeOnPage, setTimeOnPage] = useState(0);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [modalOpenTime, setModalOpenTime] = useState<number | undefined>(undefined);

  // Track time on page
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnPage((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset time on page when location changes
  useEffect(() => {
    setTimeOnPage(0);
    setLastInteraction(Date.now());
  }, [location]);

  // Memoize context to prevent unnecessary re-renders
  const context: PageContext = useMemo(() => ({
    currentPage: getPageName(location),
    currentRoute: location,
    currentAction: currentModal 
      ? (currentModal === "create_service" ? "creating_service" : "editing_service")
      : location.startsWith("/service/")
      ? "viewing_service"
      : location === "/"
      ? "browsing"
      : "none",
    formData,
    metadata: {
      timeOnPage,
      lastInteraction,
      modalOpenTime,
    },
  }), [location, currentModal, formData, timeOnPage, lastInteraction, modalOpenTime]);

  // Memoize actions to prevent unnecessary re-renders
  const actions: PageContextActions = useMemo(() => ({
    setModalOpen: (modal: "create_service" | "edit_service" | null) => {
      setCurrentModal(modal);
      if (modal) {
        setModalOpenTime(Date.now());
        setFormData({}); // Reset form data when opening modal
      } else {
        setModalOpenTime(undefined);
        setFormData({});
      }
    },

    updateFormProgress: (field: string, value: boolean | number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setLastInteraction(Date.now());
    },

    recordInteraction: () => {
      setLastInteraction(Date.now());
    },

    resetContext: () => {
      setCurrentModal(null);
      setFormData({});
      setModalOpenTime(undefined);
    },
  }), []);

  return [context, actions];
}
