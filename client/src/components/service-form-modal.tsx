import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, type ServiceWithDetails, type CategoryWithTemporary } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePageContextActions } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, AlertCircle, Sparkles, Hash, Mail, Camera, MapPin, DollarSign, CheckCircle2, Loader2, Phone, ChevronRight, ChevronLeft, Undo2, Wand2, Save, Trash2, CreditCard, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Service, PlatformSettings, ServiceContact } from "@shared/schema";
import { ImageManager } from "@/components/image-manager";
import { ContactInput, type Contact } from "@/components/contact-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { CategorySubcategorySelector } from "@/components/category-subcategory-selector";

interface ServiceFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuggestCategory?: () => void;
  onCategoryCreated?: (categoryId: string) => void;
  preselectedCategoryId?: string | null;
  service?: Service & { category: any; owner: any } | null;
}

type PricingType = "fixed" | "list" | "text";

interface PriceItem {
  description: string;
  price: string;
  unit: string;
}

interface ImageMetadata {
  rotation?: number;
  crop?: { x: number; y: number; width: number; height: number };
  [key: string]: any;
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string | null;
  priceType: PricingType;
  price: string;
  priceText: string;
  priceList: PriceItem[];
  priceUnit: string;
  locations: string[];
  contacts: Contact[];
  images: string[];
  imageMetadata: ImageMetadata[];
  mainImageIndex: number;
  hashtags: string[];
  selectedPromotionalPackage?: string | null;
  acceptedPaymentMethods: string[];
  // New Vercel Design fields
  minBookingHours: number;
  whatsIncluded: string[];
}

export function ServiceFormModal({ open, onOpenChange, onSuggestCategory, onCategoryCreated, preselectedCategoryId, service }: ServiceFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const contextActions = usePageContextActions();
  const initializedRef = useRef(false);
  const isEditMode = !!service;

  const [formData, setFormData] = useState<FormData | null>(isEditMode ? null : {
    title: "",
    description: "",
    categoryId: "",
    subcategoryId: null,
    priceType: "fixed" as PricingType,
    price: "",
    priceText: "",
    priceList: [] as PriceItem[],
    priceUnit: "hour",
    locations: [] as string[],
    contacts: [] as Contact[],
    images: [] as string[],
    imageMetadata: [] as ImageMetadata[],
    mainImageIndex: 0,
    hashtags: [] as string[],
    selectedPromotionalPackage: null,
    acceptedPaymentMethods: ["card", "twint", "cash"] as string[],
    // New Vercel Design fields
    minBookingHours: 1,
    whatsIncluded: [] as string[],
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const [validatingAddresses, setValidatingAddresses] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [showAccountPlans, setShowAccountPlans] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; subcategoryId: string | null } | null>(null);
  const [isAiCategoryLoading, setIsAiCategoryLoading] = useState(false);
  const [isAiSuggestingAll, setIsAiSuggestingAll] = useState(false);
  const [previousFormState, setPreviousFormState] = useState<{
    title: string;
    description: string;
    categoryId: string;
    subcategoryId: string | null;
    hashtags: string[];
  } | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const aiSuggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("main");

  // Refs for scrolling to error fields
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const maxImages = user?.plan?.maxImages || 4;

  const { data: categories = [] } = useQuery<CategoryWithTemporary[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("/api/settings"),
  });

  // Check if contacts are enabled/required
  const contactsEnabled = settings?.enableServiceContacts !== false;
  const contactsRequired = settings?.requireServiceContacts === true;

  // Calculate form completion progress
  const formProgress = useMemo(() => {
    if (!formData) return { percentage: 0, steps: [], isComplete: false };

    const steps = [
      { id: 'images', label: 'Photos', done: formData.images.length > 0, icon: Camera },
      { id: 'title', label: 'Title', done: !!formData.title?.trim(), icon: Sparkles },
      { id: 'description', label: 'Description', done: !!formData.description?.trim(), icon: Sparkles },
      { id: 'category', label: 'Category', done: !!formData.categoryId, icon: Hash },
      { id: 'location', label: 'Location', done: formData.locations.some((l: string) => l?.trim()), icon: MapPin },
      // Only include contact step if contacts are enabled AND required
      ...(contactsEnabled && contactsRequired ? [
        { id: 'contact', label: 'Contact', done: formData.contacts.some((c: Contact) => c.phone?.trim() || c.email?.trim()), icon: Mail }
      ] : []),
      { id: 'pricing', label: 'Pricing', done: formData.priceType === 'fixed' ? !!formData.price : formData.priceType === 'list' ? formData.priceList.length > 0 : !!formData.priceText, icon: DollarSign },
    ];

    const completed = steps.filter(s => s.done).length;
    const percentage = Math.round((completed / steps.length) * 100);
    const isComplete = completed === steps.length;

    return { percentage, steps, completed, total: steps.length, isComplete };
  }, [formData, contactsEnabled, contactsRequired]);

  // Tab navigation helpers
  const tabs = ["main", "location", "pricing"] as const;
  const currentTabIndex = tabs.indexOf(activeTab as typeof tabs[number]);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  // Validate current step - returns errors for the current tab
  // Note: Empty fields are OK, only invalid data is blocked
  const validateCurrentStep = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (activeTab === "main") {
      // Check hashtag limit
      if (formData && formData.hashtags.length > 5) {
        errors.push("Maximum 5 hashtags allowed");
      }
      // Title length if filled
      if (formData && formData.title.trim() && formData.title.length > 200) {
        errors.push("Title must be 200 characters or less");
      }
      // Description length if filled
      if (formData && formData.description.trim() && formData.description.length < 20 && formData.description.length > 0) {
        errors.push("Description must be at least 20 characters");
      }
    }

    if (activeTab === "pricing") {
      // Validate price format if filled
      if (formData && formData.priceType === "fixed" && formData.price) {
        const priceNum = parseFloat(formData.price);
        if (isNaN(priceNum) || priceNum < 0) {
          errors.push("Price must be a valid positive number");
        }
      }
      // Price list validation
      if (formData && formData.priceType === "list" && formData.priceList.length > 0) {
        const invalidItems = formData.priceList.filter(item => {
          if (!item.price) return false; // Empty is OK
          const num = parseFloat(item.price);
          return isNaN(num) || num < 0;
        });
        if (invalidItems.length > 0) {
          errors.push("All prices must be valid positive numbers");
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const goToNextTab = () => {
    if (!isLastTab) {
      const validation = validateCurrentStep();
      if (!validation.isValid) {
        toast({
          title: "Please fix errors before continuing",
          description: validation.errors.join(". "),
          variant: "destructive",
        });
        return;
      }
      setActiveTab(tabs[currentTabIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  const { data: existingContacts = [] } = useQuery<ServiceContact[]>({
    queryKey: [`/api/services/${service?.id}/contacts`],
    queryFn: () => apiRequest(`/api/services/${service?.id}/contacts`),
    enabled: !!service?.id && open && isEditMode,
  });

  const { data: userAddresses = [] } = useQuery({
    queryKey: ["/api/users/me/addresses"],
    queryFn: () => apiRequest("/api/users/me/addresses"),
    enabled: !isEditMode && open,
  });

  // Track modal open/close state (only in create mode)
  useEffect(() => {
    if (!isEditMode) {
      if (open) {
        contextActions.setModalOpen("create_service");
      } else {
        contextActions.setModalOpen(null);
      }
    }
  }, [open, isEditMode]);

  // Track form progress (only in create mode)
  useEffect(() => {
    if (!open || isEditMode || !formData) return;

    contextActions.updateFormProgress("hasTitle", !!formData.title?.trim());
    contextActions.updateFormProgress("hasDescription", !!formData.description?.trim());
    contextActions.updateFormProgress("hasCategory", !!formData.categoryId);
    contextActions.updateFormProgress("hasImages", formData.images?.length > 0);
    contextActions.updateFormProgress("imageCount", formData.images?.length || 0);
    contextActions.updateFormProgress("hasLocation", formData.locations?.some((l: string) => l.trim()));
    contextActions.updateFormProgress("hasContact", formData.contacts?.some((c: Contact) => c.phone?.trim() || c.email?.trim()));

    const hasPrice = formData.priceType === "fixed"
      ? !!formData.price
      : formData.priceType === "text"
        ? !!formData.priceText?.trim()
        : formData.priceList?.length > 0;
    contextActions.updateFormProgress("hasPrice", hasPrice);
  }, [formData, open, isEditMode]);

  // Initialize form data immediately from service prop (Bug Fix #2)
  useEffect(() => {
    if (isEditMode && service && open && !initializedRef.current) {
      // Initialize with fallback contacts from service data immediately
      // New structure: each contact has both phone and email fields
      const fallbackContacts: Contact[] = [];

      if (service.contactPhone || service.contactEmail) {
        fallbackContacts.push({
          phone: service.contactPhone || "",
          email: service.contactEmail || "",
          isPrimary: true,
        });
      }

      setFormData({
        title: service.title,
        description: service.description,
        categoryId: service.categoryId,
        subcategoryId: service.subcategoryId || null,
        priceType: service.priceType || "fixed",
        price: service.price || "",
        priceText: service.priceText || "",
        priceList: Array.isArray(service.priceList) ? service.priceList : [],
        priceUnit: service.priceUnit,
        locations: service.locations || [],
        contacts: fallbackContacts.length > 0 ? fallbackContacts : [{ phone: "", email: "", isPrimary: true }],
        images: service.images || [],
        imageMetadata: Array.isArray(service.imageMetadata) ? service.imageMetadata : [],
        mainImageIndex: service.mainImageIndex || 0,
        hashtags: service.hashtags || [],
        selectedPromotionalPackage: null,
        acceptedPaymentMethods: (service as any).acceptedPaymentMethods || ["card", "twint", "cash"],
        minBookingHours: (service as any).minBookingHours || 1,
        whatsIncluded: (service as any).whatsIncluded || [],
      });

      initializedRef.current = true;
    }

    if (!open) {
      initializedRef.current = false;
    }
  }, [service, open, isEditMode]);

  // Enrich contacts with fetched data when available (Bug Fix #2)
  useEffect(() => {
    if (isEditMode && service && open && existingContacts.length > 0 && formData) {
      const mappedContacts: Contact[] = existingContacts.map(c => ({
        id: c.id,
        contactType: c.contactType,
        value: c.value,
        name: c.name || undefined,
        role: c.role || undefined,
        isPrimary: c.isPrimary,
        isVerified: c.isVerified,
      }));

      setFormData((prev: FormData | null) => ({
        ...prev!,
        contacts: mappedContacts,
      }));
    }
  }, [existingContacts, isEditMode, service, open, formData]);

  // Initialize contacts and locations with user's profile data (only in create mode)
  // This runs only ONCE when the form opens, not on every render
  const initializedContactsRef = useRef(false);

  useEffect(() => {
    if (isEditMode || !user || !open || !formData) return;
    if (initializedContactsRef.current) return; // Only initialize once

    let hasChanges = false;
    const updates: Partial<FormData> = {};

    // Initialize locations with user's main address
    if (formData.locations.length === 0 && userAddresses.length > 0) {
      const mainAddress = userAddresses.find((a: any) => a.isMain) || userAddresses[0];
      if (mainAddress) {
        const fullAddress = mainAddress.fullAddress ||
          `${mainAddress.street}, ${mainAddress.postalCode} ${mainAddress.city}`;
        if (fullAddress?.trim()) {
          updates.locations = [fullAddress];
          hasChanges = true;
        }
      }
    }

    // Initialize contacts - create ONE contact with both phone and email fields
    if (formData.contacts.length === 0) {
      const userName = `${user.firstName} ${user.lastName}`.trim();

      // Create a single contact with both phone and email (new structure)
      const singleContact: Contact = {
        phone: user.phoneNumber || "",
        email: user.email || "",
        name: userName || undefined,
        isPrimary: true,
        isVerified: user.phoneVerified || user.emailVerified,
      };

      updates.contacts = [singleContact];
      hasChanges = true;
    }

    if (hasChanges) {
      setFormData((prev: FormData | null) => ({ ...prev!, ...updates }));
      initializedContactsRef.current = true;
    }
  }, [user, open, formData, isEditMode, userAddresses]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!open) {
      initializedContactsRef.current = false;
    }
  }, [open]);

  const createServiceMutation = useMutation({
    mutationFn: async ({ data, status }: { data: typeof formData; status: "draft" | "active" }) => {
      if (!data) {
        throw new Error('Form data is required');
      }
      const serviceData = await apiRequest("/api/services", {
        method: "POST",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || undefined,
          priceType: data.priceType,
          price: data.priceType === "fixed" ? data.price : undefined,
          priceText: data.priceType === "text" ? data.priceText : undefined,
          priceList: data.priceType === "list" ? data.priceList : undefined,
          priceUnit: data.priceUnit,
          locations: data.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim()),
          images: data.images,
          imageMetadata: data.imageMetadata,
          mainImageIndex: data.mainImageIndex,
          status: status,
          hashtags: data.hashtags,
          acceptedPaymentMethods: data.acceptedPaymentMethods,
          // Vercel Design features
          minBookingHours: data.minBookingHours,
          whatsIncluded: data.whatsIncluded,
          // Extract first phone and email from contacts (new structure)
          contactPhone: data.contacts.find((c: Contact) => c.phone?.trim())?.phone || "",
          contactEmail: data.contacts.find((c: Contact) => c.email?.trim())?.email || "",
        }),
      });

      // Save individual contacts
      for (const contact of data.contacts) {
        if (contact.phone?.trim() || contact.email?.trim()) {
          await apiRequest(`/api/services/${serviceData.id}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              phone: contact.phone || undefined,
              email: contact.email || undefined,
              name: contact.name || undefined,
              role: contact.role || undefined,
              isPrimary: contact.isPrimary || false,
            }),
          });
        }
      }

      return { service: serviceData, status };
    },
    onSuccess: ({ status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      toast({
        title: status === "draft" ? "Draft Saved!" : "Service Posted!",
        description: status === "draft" ? "Your service has been saved as a draft." : "Your service has been posted successfully.",
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const updatedService = await apiRequest(`/api/services/${service?.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          categoryId: data.categoryId,
          subcategoryId: data.subcategoryId || undefined,
          priceType: data.priceType,
          price: data.priceType === "fixed" ? data.price : undefined,
          priceText: data.priceType === "text" ? data.priceText : undefined,
          priceList: data.priceType === "list" ? data.priceList : undefined,
          priceUnit: data.priceUnit,
          locations: data.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim()),
          images: data.images,
          imageMetadata: data.imageMetadata,
          mainImageIndex: data.mainImageIndex,
          hashtags: data.hashtags,
          acceptedPaymentMethods: data.acceptedPaymentMethods,
          // Vercel Design features
          minBookingHours: data.minBookingHours,
          whatsIncluded: data.whatsIncluded,
          // Extract first phone and email from contacts (new structure)
          contactPhone: data.contacts.find((c: Contact) => c.phone?.trim())?.phone || "",
          contactEmail: data.contacts.find((c: Contact) => c.email?.trim())?.email || "",
        }),
      });

      const existingContactIds = existingContacts.map(c => c.id);
      const currentContactIds = data.contacts.filter((c: Contact) => c.id).map((c: Contact) => c.id);

      for (const existingId of existingContactIds) {
        if (!currentContactIds.includes(existingId)) {
          await apiRequest(`/api/contacts/${existingId}`, {
            method: "DELETE",
          });
        }
      }

      // Save new contacts
      for (const contact of data.contacts) {
        if (!contact.id && (contact.phone?.trim() || contact.email?.trim())) {
          await apiRequest(`/api/services/${service?.id}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              phone: contact.phone || undefined,
              email: contact.email || undefined,
              name: contact.name || undefined,
              role: contact.role || undefined,
              isPrimary: contact.isPrimary || false,
            }),
          });
        }
      }

      return updatedService;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      queryClient.invalidateQueries({ queryKey: [`/api/services/${service?.id}/contacts`] });
      toast({
        title: "Service Updated!",
        description: "Your service has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      subcategoryId: null,
      priceType: "fixed",
      price: "",
      priceText: "",
      priceList: [],
      priceUnit: "hour",
      locations: [],
      contacts: [],
      images: [],
      imageMetadata: [],
      mainImageIndex: 0,
      hashtags: [],
      acceptedPaymentMethods: ["card", "twint", "cash"],
      minBookingHours: 1,
      whatsIncluded: [],
    });
    setDraftSaved(false);
    setAddressErrors([]);
    setHashtagInput("");
    setSuggestedHashtags([]);
    setShowHashtagSuggestions(false);
    setIsManualOverride(false);
    setAiSuggestion(null);
    setIsAiCategoryLoading(false);
    setActiveTab("main"); // Reset to first tab
    setFieldErrors({});
    setTouchedFields({});
    initializedContactsRef.current = false; // Allow re-initialization on next open
  };


  const addPriceItem = () => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      priceList: [...prev!.priceList, { description: "", price: "", unit: "" }],
    }));
  };

  const updatePriceItem = (index: number, field: string, value: string) => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      priceList: prev!.priceList.map((item: PriceItem, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removePriceItem = (index: number) => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      priceList: prev!.priceList.filter((_: PriceItem, i: number) => i !== index),
    }));
  };

  const addContact = () => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      contacts: [...prev!.contacts, { phone: "", email: "", isPrimary: false }],
    }));
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    setFormData((prev: FormData | null) => {
      if (!prev) return prev;

      return {
        ...prev,
        contacts: prev.contacts.map((contact: Contact, i: number) => {
          if (i !== index) return contact;
          return { ...contact, [field]: value };
        }),
      };
    });
  };

  const removeContact = (index: number) => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      contacts: prev!.contacts.filter((_: Contact, i: number) => i !== index),
    }));
  };

  const addHashtag = (tag: string) => {
    const cleaned = tag.replace(/^#/, '').trim().toLowerCase();
    if (cleaned && cleaned.length > 0 && formData!.hashtags.length < 5 && !formData!.hashtags.includes(cleaned)) {
      setFormData((prev: FormData | null) => ({
        ...prev!,
        hashtags: [...prev!.hashtags, cleaned],
      }));
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setFormData((prev: FormData | null) => ({
      ...prev!,
      hashtags: prev!.hashtags.filter((t: string) => t !== tag),
    }));
  };

  // Auto-select category when it's provided from parent (after CategorySuggestionModal creates one)
  useEffect(() => {
    if (preselectedCategoryId && formData && !isEditMode && !formData.categoryId) {
      setFormData((prev: FormData | null) => ({
        ...prev!,
        categoryId: preselectedCategoryId,
      }));
      if (onCategoryCreated) {
        onCategoryCreated(preselectedCategoryId);
      }
    }
  }, [preselectedCategoryId, isEditMode]);

  // Debounced AI category/subcategory suggestion
  useEffect(() => {
    if (!formData || isEditMode || isManualOverride || !formData.title.trim()) {
      return;
    }

    if (aiSuggestionTimeoutRef.current) {
      clearTimeout(aiSuggestionTimeoutRef.current);
    }

    aiSuggestionTimeoutRef.current = setTimeout(async () => {
      setIsAiCategoryLoading(true);
      try {
        const response = await apiRequest("/api/ai/suggest-category-subcategory", {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || "",
            imageUrls: formData.images,
          }),
        });

        setAiSuggestion({
          categoryId: response.categoryId,
          subcategoryId: response.subcategoryId,
        });

        setFormData((prev: FormData | null) => ({
          ...prev!,
          categoryId: response.categoryId,
          subcategoryId: response.subcategoryId,
        }));
      } catch (error) {
        console.error("AI category suggestion failed:", error);
      } finally {
        setIsAiCategoryLoading(false);
      }
    }, 500);

    return () => {
      if (aiSuggestionTimeoutRef.current) {
        clearTimeout(aiSuggestionTimeoutRef.current);
      }
    };
  }, [formData?.title, formData?.description, formData?.images, isEditMode, isManualOverride]);

  const handleCategoryChange = (categoryId: string) => {
    setIsManualOverride(true);
    setFormData((prev: FormData | null) => {
      const newSubcategoryId = prev!.subcategoryId;
      return {
        ...prev!,
        categoryId,
        subcategoryId: newSubcategoryId,
      };
    });
  };

  const handleSubcategoryChange = (subcategoryId: string | null) => {
    setIsManualOverride(true);
    const finalSubcategoryId = subcategoryId === "none" ? null : subcategoryId;
    setFormData((prev: FormData | null) => ({
      ...prev!,
      subcategoryId: finalSubcategoryId,
    }));
  };

  const handleResetToAI = () => {
    setIsManualOverride(false);
    if (aiSuggestion) {
      setFormData((prev: FormData | null) => ({
        ...prev!,
        categoryId: aiSuggestion.categoryId,
        subcategoryId: aiSuggestion.subcategoryId,
      }));
    }
  };

  const selectSuggestedHashtag = (tag: string) => {
    addHashtag(tag);
  };

  // AI Suggest All - unified call for title, description, category, subcategory, and hashtags
  const handleAISuggestAll = async () => {
    if (!formData) return;

    if (formData.images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image to use AI suggestions",
        variant: "destructive",
      });
      return;
    }

    const validImages = formData.images.filter((img: string) =>
      typeof img === 'string' && (
        img.startsWith('/objects/') ||
        img.startsWith('http://') ||
        img.startsWith('https://')
      )
    );

    if (validImages.length === 0) {
      toast({
        title: "Images Not Ready",
        description: "Please wait for all images to finish uploading before using AI suggestions",
        variant: "destructive",
      });
      return;
    }

    // Save current state for undo
    setPreviousFormState({
      title: formData.title,
      description: formData.description,
      categoryId: formData.categoryId,
      subcategoryId: formData.subcategoryId,
      hashtags: [...formData.hashtags],
    });

    setIsAiSuggestingAll(true);
    try {
      const response = await apiRequest("/api/ai/suggest-all", {
        method: "POST",
        body: JSON.stringify({
          imageUrls: validImages,
          currentTitle: formData.title || undefined,
        }),
      });

      // Invalidate and refetch subcategories FIRST to ensure new subcategory appears in dropdown
      // before we try to select it
      await queryClient.invalidateQueries({ queryKey: ["/api/subcategories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/subcategories"] });

      // Apply all suggestions at once - NOW the subcategory will be in the dropdown
      setFormData((prev: FormData | null) => ({
        ...prev!,
        title: response.title || prev!.title,
        description: response.description || prev!.description,
        categoryId: response.categoryId || prev!.categoryId,
        subcategoryId: response.subcategoryId || null,
        hashtags: response.hashtags?.length > 0 ? response.hashtags : prev!.hashtags,
      }));

      // Update AI category suggestion state for consistency
      if (response.categoryId) {
        setAiSuggestion({
          categoryId: response.categoryId,
          subcategoryId: response.subcategoryId,
        });
      }

      toast({
        title: "AI Suggestions Applied!",
        description: "Title, description, category, and hashtags have been generated. Feel free to edit them!",
      });
    } catch (error: any) {
      console.error("AI suggest all error:", error);
      // Clear saved state on failure
      setPreviousFormState(null);
      toast({
        title: "AI Suggestions Failed",
        description: error.message || "Couldn't generate suggestions. Please fill in the fields manually.",
        variant: "destructive",
      });
    } finally {
      setIsAiSuggestingAll(false);
    }
  };

  // Undo AI suggestions
  const handleUndoAI = () => {
    if (!previousFormState) return;

    setFormData((prev: FormData | null) => ({
      ...prev!,
      title: previousFormState.title,
      description: previousFormState.description,
      categoryId: previousFormState.categoryId,
      subcategoryId: previousFormState.subcategoryId,
      hashtags: previousFormState.hashtags,
    }));

    setPreviousFormState(null);
    setIsManualOverride(true);

    toast({
      title: "Changes Reverted",
      description: "AI suggestions have been undone.",
    });
  };

  const validateAddresses = async (): Promise<boolean> => {
    const validLocations = formData!.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim());
    if (validLocations.length === 0) return false;

    setValidatingAddresses(true);
    setAddressErrors([]);
    const errors: string[] = [];

    try {
      for (const location of validLocations) {
        try {
          const result = await apiRequest("/api/validate-address", {
            method: "POST",
            body: JSON.stringify({ address: location }),
          });

          if (!result.isValid) {
            errors.push(`"${location}" is not a valid Swiss address. Please ensure it includes a Swiss postal code or city.`);
          }
        } catch (error) {
          errors.push(`Failed to validate "${location}"`);
        }
      }

      setAddressErrors(errors);
      return errors.length === 0;
    } finally {
      setValidatingAddresses(false);
    }
  };

  // Field validation helper
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'title':
        if (!value || value.trim().length === 0) return 'Title is required';
        if (value.trim().length < 5) return 'Title must be at least 5 characters';
        if (value.trim().length > 100) return 'Title must be less than 100 characters';
        return '';
      case 'description':
        if (!value || value.trim().length === 0) return 'Description is required';
        if (value.trim().length < 20) return 'Description must be at least 20 characters';
        return '';
      case 'categoryId':
        if (!value) return 'Please select a category';
        return '';
      case 'subcategoryId':
        if (!value) return 'Please select a subcategory';
        return '';
      case 'price':
        if (formData?.priceType === 'fixed' && (!value || parseFloat(value) <= 0)) {
          return 'Please enter a valid price';
        }
        return '';
      default:
        return '';
    }
  };

  // Handle field blur - validate and show error
  const handleFieldBlur = (field: string) => {
    if (!formData) return;
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const value = (formData as any)[field];
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  // Scroll to first error field
  const scrollToFirstError = (errors: { field: string; message: string }[]) => {
    if (errors.length === 0) return;

    const firstError = errors[0];
    const fieldRefs: Record<string, React.RefObject<any>> = {
      title: titleRef,
      description: descriptionRef,
      category: categoryRef,
      categoryId: categoryRef,
      subcategoryId: categoryRef,
      location: locationRef,
      contact: contactRef,
      price: priceRef,
    };

    // Switch to the correct tab first
    const tabMapping: Record<string, string> = {
      title: 'main',
      description: 'main',
      category: 'main',
      categoryId: 'main',
      subcategoryId: 'main',
      location: 'location',
      contact: 'location',
      price: 'pricing',
    };

    const targetTab = tabMapping[firstError.field] || 'main';
    if (activeTab !== targetTab) {
      setActiveTab(targetTab);
    }

    // Scroll after a short delay to allow tab switch
    setTimeout(() => {
      const ref = fieldRefs[firstError.field];
      if (ref?.current) {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ref.current.focus?.();
      }
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    const validLocations = formData.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim());
    // New structure: contact is valid if it has phone OR email
    const validContacts = formData.contacts.filter((c: Contact) => c.phone?.trim() || c.email?.trim());

    if (settings?.enableSwissAddressValidation) {
      const addressesValid = await validateAddresses();
      if (!addressesValid) {
        toast({
          title: "Address Issue",
          description: "Check the Location & Contacts tab for address errors",
          variant: "destructive",
        });
        return;
      }
    }

    if (isEditMode) {
      if (validLocations.length === 0) {
        toast({
          title: "Missing Location",
          description: "Go to Location & Contacts tab and add at least one service location",
          variant: "destructive",
        });
        return;
      }

      if (validContacts.length === 0) {
        toast({
          title: "Missing Contact",
          description: "Go to Location & Contacts tab and add at least one contact method",
          variant: "destructive",
        });
        return;
      }

      updateServiceMutation.mutate({
        ...formData,
        locations: validLocations,
      });
    } else {
      // Collect all validation errors
      const errors: { field: string; message: string }[] = [];

      // Validate title with minimum length
      if (!formData.title) {
        errors.push({ field: "title", message: "Service title is required" });
      } else if (formData.title.trim().length < 5) {
        errors.push({ field: "title", message: "Title must be at least 5 characters" });
      }

      // Validate description with minimum length
      if (!formData.description) {
        errors.push({ field: "description", message: "Service description is required" });
      } else if (formData.description.trim().length < 20) {
        errors.push({ field: "description", message: "Description must be at least 20 characters" });
      }

      if (!formData.categoryId) errors.push({ field: "category", message: "Category selection is required" });
      if (!formData.subcategoryId) errors.push({ field: "subcategoryId", message: "Subcategory selection is required" });
      if (validLocations.length === 0) errors.push({ field: "location", message: "Add at least one service location" });
      if (contactsRequired && validContacts.length === 0) errors.push({ field: "contact", message: "Add at least one contact method" });

      // Price validation based on type
      if (formData.priceType === 'fixed' && (!formData.price || parseFloat(formData.price) <= 0)) {
        errors.push({ field: "price", message: "Please enter a valid price" });
      }

      if (errors.length > 0) {
        // Mark all error fields as touched
        const touchedUpdate: Record<string, boolean> = {};
        const errorUpdate: Record<string, string> = {};
        errors.forEach(err => {
          touchedUpdate[err.field] = true;
          errorUpdate[err.field] = err.message;
        });
        setTouchedFields(prev => ({ ...prev, ...touchedUpdate }));
        setFieldErrors(prev => ({ ...prev, ...errorUpdate }));

        // Scroll to first error field
        scrollToFirstError(errors);

        const fieldName = errors[0].field;
        const fieldLabels: Record<string, string> = {
          title: "Main Info",
          description: "Main Info",
          category: "Main Info",
          subcategoryId: "Main Info",
          location: "Location & Contacts",
          contact: "Location & Contacts",
          price: "Pricing",
        };
        toast({
          title: `Check ${fieldLabels[fieldName] || 'Main Info'} tab`,
          description: errors[0].message,
          variant: "destructive",
        });
        return;
      }

      createServiceMutation.mutate({ data: { ...formData, locations: validLocations }, status: "active" });
    }
  };

  const handleSaveDraft = async () => {
    if (!formData) {
      toast({
        title: "Error",
        description: "Form data is missing",
        variant: "destructive",
      });
      return;
    }
    const validLocations = formData.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim());
    // New structure: contact is valid if it has phone OR email
    const validContacts = formData.contacts.filter((c: Contact) => c.phone?.trim() || c.email?.trim());

    // Relaxed validation for draft - require at least 1 filled field
    const hasAnyField =
      formData.title?.trim() ||
      formData.description?.trim() ||
      formData.images.length > 0 ||
      (formData.priceType === 'fixed' && formData.price) ||
      (formData.priceType === 'text' && formData.priceText?.trim()) ||
      (formData.priceType === 'list' && formData.priceList.length > 0) ||
      validLocations.length > 0 ||
      validContacts.length > 0 ||
      formData.categoryId;

    if (!hasAnyField) {
      toast({
        title: "Cannot Save Draft",
        description: "Please fill in at least one field (title, description, images, price, or location)",
        variant: "destructive",
      });
      return;
    }

    createServiceMutation.mutate({ data: { ...formData, locations: validLocations }, status: "draft" });
  };

  const verificationEnabled = settings?.requireEmailVerification || settings?.requirePhoneVerification;

  // Compute submit button disabled state
  const isMutationPending = isEditMode ? updateServiceMutation.isPending : createServiceMutation.isPending;
  const isEmailNotVerified = !isEditMode && user && !user.emailVerified;
  const isSubmitDisabled = isMutationPending || validatingAddresses || isEmailNotVerified;

  if (!formData) return null;

  // Unsaved changes detection - only count actual user-entered content
  // Don't count auto-populated contacts/locations from user profile
  const hasUnsavedChanges = useMemo(() => {
    if (!formData || isEditMode) return false;
    // Only consider content the user has actually typed/uploaded
    // Title, description, images, category are definitely user-entered
    const hasUserContent =
      formData.title.trim() !== '' ||
      formData.description.trim() !== '' ||
      formData.images.length > 0 ||
      formData.categoryId !== '';
    return hasUserContent;
  }, [formData, isEditMode]);

  // Handle modal close with unsaved changes prompt
  const handleOpenChange = (open: boolean) => {
    if (!open && hasUnsavedChanges && !draftSaved) {
      setShowUnsavedChangesDialog(true);
      return; // Don't close yet, show the dialog
    }
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  // Handle unsaved changes dialog actions
  const handleSaveAndClose = () => {
    setShowUnsavedChangesDialog(false);
    handleSaveDraft();
  };

  const handleDiscardAndClose = () => {
    setShowUnsavedChangesDialog(false);
    resetForm();
    onOpenChange(false);
  };

  // Handle beforeunload for page navigation
  useEffect(() => {
    if (!open || !hasUnsavedChanges || draftSaved) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [open, hasUnsavedChanges, draftSaved]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!w-[98vw] !max-w-none max-h-[95vh] overflow-hidden flex flex-col bg-background border-border p-0">
        {/* Split View Container */}
        <div className="flex flex-1 min-h-0">
          {/* Left Side - Main Content */}
          <div className="flex-1 flex flex-col min-w-0 p-6">
            {/* Header */}
            <DialogHeader className="space-y-1 pb-4 border-b mb-4">
              <DialogTitle className="text-2xl font-bold">
                {isEditMode ? "Edit Service" : "Create Your Listing"}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {isEditMode
                  ? "Update your service details below"
                  : "Fill in the details to publish your service"
                }
              </DialogDescription>
            </DialogHeader>

            {/* Email verification warning for new services */}
            {!isEditMode && user && !user.emailVerified && (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Email Not Verified</AlertTitle>
                <AlertDescription className="mt-2">
                  <p>You need to verify your email address before you can create services.</p>
                  <Link href="/profile?tab=profile" className="underline font-medium mt-1 inline-block">
                    Go to Profile → Account Information to resend verification email
                  </Link>
                </AlertDescription>
              </Alert>
            )}

            <form id="service-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-6 py-4 min-h-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="main" className="flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">Main Info</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="hidden sm:inline">Location & Contacts</span>
                    <span className="sm:hidden">Location</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Pricing & Plans</span>
                    <span className="sm:hidden">Pricing</span>
                  </TabsTrigger>
                </TabsList>

                {/* Main Info Tab - Images + Basic Info */}
                <TabsContent value="main" className="space-y-6 mt-0">
                  {/* Images Section with visual card */}
                  <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-white p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Service Images</h3>
                        <p className="text-sm text-muted-foreground">Add up to {maxImages} photos to showcase your service</p>
                      </div>
                    </div>
                    <ImageManager
                      images={formData.images}
                      imageMetadata={(formData.imageMetadata || []).map(m => ({ ...m, rotation: m.rotation ?? 0 }))}
                      mainImageIndex={formData.mainImageIndex}
                      maxImages={maxImages}
                      onImagesChange={(images: string[]) => setFormData((prev: FormData | null) => ({ ...prev!, images }))}
                      onMetadataChange={(metadata: ImageMetadata[]) => setFormData((prev: FormData | null) => ({ ...prev!, imageMetadata: metadata }))}
                      onMainImageChange={(index: number) => setFormData((prev: FormData | null) => ({ ...prev!, mainImageIndex: index }))}
                    />
                  </div>

                  {/* AI Suggest All Banner */}
                  <div className="rounded-xl border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                          <Wand2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-900">AI Auto-Fill</h3>
                          <p className="text-sm text-purple-700">
                            Generate title, description, category & hashtags in one click
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {previousFormState && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleUndoAI}
                            className="gap-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                            data-testid="button-undo-ai"
                          >
                            <Undo2 className="w-4 h-4 text-orange-600" />
                            Undo
                          </Button>
                        )}
                        <Button
                          type="button"
                          onClick={handleAISuggestAll}
                          disabled={formData.images.length === 0 || isAiSuggestingAll}
                          className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                          data-testid="button-ai-suggest-all"
                        >
                          {isAiSuggestingAll ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Autocomplete with AI
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    {formData.images.length === 0 && (
                      <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        Upload at least one image to use AI auto-fill
                      </p>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="rounded-xl border p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Title & Description</h3>
                        <p className="text-sm text-muted-foreground">Describe your service</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Service Title * <span className="text-xs text-muted-foreground">(min. 5 characters)</span></Label>
                      <Input
                        id="title"
                        ref={titleRef}
                        placeholder="e.g., Professional House Cleaning"
                        value={formData.title}
                        onChange={(e) => {
                          setFormData({ ...formData, title: e.target.value });
                          // Clear error when typing
                          if (touchedFields.title && e.target.value.trim().length >= 5) {
                            setFieldErrors(prev => ({ ...prev, title: '' }));
                          }
                        }}
                        onBlur={() => handleFieldBlur('title')}
                        className={`text-lg ${touchedFields.title && fieldErrors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        data-testid="input-service-title"
                      />
                      {touchedFields.title && fieldErrors.title && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {fieldErrors.title}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description * <span className="text-xs text-muted-foreground">(min. 20 characters)</span></Label>
                      <Textarea
                        id="description"
                        ref={descriptionRef}
                        placeholder="Describe your service in detail..."
                        rows={5}
                        value={formData.description}
                        onChange={(e) => {
                          setFormData({ ...formData, description: e.target.value });
                          // Clear error when typing
                          if (touchedFields.description && e.target.value.trim().length >= 20) {
                            setFieldErrors(prev => ({ ...prev, description: '' }));
                          }
                        }}
                        onBlur={() => handleFieldBlur('description')}
                        className={touchedFields.description && fieldErrors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        data-testid="textarea-service-description"
                      />
                      {touchedFields.description && fieldErrors.description && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {fieldErrors.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div ref={categoryRef}>
                    <CategorySubcategorySelector
                      categoryId={formData.categoryId}
                      subcategoryId={formData.subcategoryId}
                      onCategoryChange={handleCategoryChange}
                      onSubcategoryChange={handleSubcategoryChange}
                      isManualOverride={isManualOverride}
                      aiSuggestion={aiSuggestion}
                      onResetToAI={handleResetToAI}
                      isAiLoading={isAiCategoryLoading}
                    />
                    {onSuggestCategory && !isEditMode && (
                      <p className="text-sm text-muted-foreground">
                        Can't find the right category?{" "}
                        <button
                          type="button"
                          onClick={onSuggestCategory}
                          className="text-primary hover:underline font-medium"
                          data-testid="button-suggest-category-inline"
                        >
                          Suggest a new one
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Hashtags Section */}
                  <div className="space-y-4">
                    <div>
                      <Label>Hashtags (Optional)</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add up to 3 hashtags to help users discover your service
                      </p>
                    </div>

                    {/* Current Hashtags */}
                    {formData.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2" data-testid="hashtags-container">
                        {formData.hashtags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="pl-3 pr-2 py-1.5 text-sm flex items-center gap-1"
                            data-testid={`hashtag-badge-${tag}`}
                          >
                            <Hash className="w-3 h-3" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeHashtag(tag)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`button-remove-hashtag-${tag}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Hashtag Input */}
                    {formData.hashtags.length < 5 && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a hashtag and press Enter"
                          value={hashtagInput}
                          onChange={(e) => setHashtagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addHashtag(hashtagInput);
                            }
                          }}
                          data-testid="input-hashtag"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addHashtag(hashtagInput)}
                          disabled={!hashtagInput.trim()}
                          data-testid="button-add-hashtag"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Location & Contacts Tab */}
                <TabsContent value="location" className="space-y-6 mt-0">
                  {/* Locations Section */}
                  <div ref={locationRef} className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-white p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Service Locations</h3>
                        <p className="text-sm text-muted-foreground">Where do you offer this service?</p>
                      </div>
                    </div>

                    {/* Quick select from user's saved addresses (i) */}
                    {!isEditMode && userAddresses.length > 1 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quick Select from Your Addresses</Label>
                        <div className="flex flex-wrap gap-2">
                          {userAddresses.map((addr: any, idx: number) => {
                            const fullAddr = addr.fullAddress || `${addr.street}, ${addr.postalCode} ${addr.city}`;
                            const isSelected = formData.locations.includes(fullAddr);
                            return (
                              <Button
                                key={idx}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormData((prev: FormData | null) => ({
                                      ...prev!,
                                      locations: prev!.locations.filter(l => l !== fullAddr)
                                    }));
                                  } else {
                                    setFormData((prev: FormData | null) => ({
                                      ...prev!,
                                      locations: [...prev!.locations, fullAddr]
                                    }));
                                  }
                                }}
                                className="text-xs gap-1.5"
                                data-testid={`select-address-${idx}`}
                              >
                                <MapPin className="w-3 h-3" />
                                {addr.label || `${addr.city} ${addr.postalCode}`}
                                {addr.isMain && <Badge variant="secondary" className="ml-1 text-[10px] px-1">Main</Badge>}
                              </Button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">Click to add/remove addresses, or search for new ones below</p>
                      </div>
                    )}

                    {addressErrors.length > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4">
                            {addressErrors.map((error: string, idx: number) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    <LocationAutocomplete
                      locations={formData.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim())}
                      onLocationsChange={(locations: string[]) => setFormData((prev: FormData | null) => ({ ...prev!, locations }))}
                      maxLocations={10}
                      label=""
                      required={true}
                      testIdPrefix="service-location"
                    />
                    {settings?.enableSwissAddressValidation && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        Addresses will be validated for Switzerland
                      </p>
                    )}
                  </div>

                  {/* Contacts Section - Only show if enabled */}
                  {contactsEnabled && (
                    <div ref={contactRef} className="rounded-xl border p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              Contact Information
                              {!contactsRequired && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
                            </h3>
                            <p className="text-sm text-muted-foreground">How can customers reach you? Add phone and/or email.</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addContact}
                          disabled={formData.contacts.length >= 3}
                          className="gap-1.5"
                          data-testid="button-add-contact"
                        >
                          <Plus className="w-4 h-4" /> Add Contact
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {formData.contacts.map((contact: Contact, idx: number) => (
                          <ContactInput
                            key={idx}
                            contact={contact}
                            index={idx}
                            canRemove={formData.contacts.length > 1 || !contactsRequired}
                            verificationEnabled={!!verificationEnabled}
                            showVerification={false}
                            onUpdate={updateContact}
                            onRemove={removeContact}
                          />
                        ))}

                        {formData.contacts.length === 0 && contactsRequired && (
                          <div className="text-center py-6 text-muted-foreground">
                            <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Please add at least one contact method</p>
                          </div>
                        )}

                        {formData.contacts.length === 0 && !contactsRequired && (
                          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                            <p className="text-sm">No contact info added yet</p>
                            <p className="text-xs mt-1">Customers will contact you through the platform</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Pricing & Plans Tab */}
                <TabsContent value="pricing" className="space-y-6 mt-0">
                  {/* Pricing Type Section */}
                  <div className="rounded-xl border bg-gradient-to-br from-amber-50/50 to-white p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Pricing Strategy</h3>
                        <p className="text-sm text-muted-foreground">How would you like to price your service?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {(["fixed", "list", "text"] as PricingType[]).map((type) => (
                        <label
                          key={type}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.priceType === type
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`}
                        >
                          <input
                            type="radio"
                            name="priceType"
                            value={type}
                            checked={formData.priceType === type}
                            onChange={(e) => setFormData({ ...formData, priceType: e.target.value as PricingType })}
                            className="sr-only"
                            data-testid={`radio-price-type-${type}`}
                          />
                          <span className="text-2xl">
                            {type === "fixed" ? "💰" : type === "list" ? "📋" : "✍️"}
                          </span>
                          <span className="font-medium text-sm text-center">
                            {type === "list" ? "Price List" : type === "text" ? "Text-based" : "Fixed Price"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Fixed Pricing */}
                  {formData.priceType === "fixed" && (
                    <div className="rounded-xl border p-6 space-y-4">
                      <h4 className="font-medium">Set Your Price</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Price (CHF) *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="text-lg"
                            data-testid="input-service-price"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priceUnit">Per *</Label>
                          <select
                            id="priceUnit"
                            value={formData.priceUnit}
                            onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background h-10"
                            data-testid="select-service-price-unit"
                          >
                            <option value="hour">Hour</option>
                            <option value="job">Job</option>
                            <option value="consultation">Consultation</option>
                            <option value="day">Day</option>
                            <option value="month">Month</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price List */}
                  {formData.priceType === "list" && (
                    <div className="rounded-xl border p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Price List Items</h4>
                        <Button type="button" size="sm" variant="outline" onClick={addPriceItem} className="gap-1.5" data-testid="button-add-price-item">
                          <Plus className="w-4 h-4" /> Add Item
                        </Button>
                      </div>
                      {formData.priceList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <span className="text-4xl block mb-2">📋</span>
                          <p className="text-sm">Click "Add Item" to create your price list</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.priceList.map((item: PriceItem, idx: number) => (
                            <div key={idx} className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg">
                              <Input
                                placeholder="Description (e.g., Basic)"
                                value={item.description}
                                onChange={(e) => updatePriceItem(idx, "description", e.target.value)}
                                data-testid={`input-price-item-description-${idx}`}
                              />
                              <Input
                                placeholder="Price"
                                type="number"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => updatePriceItem(idx, "price", e.target.value)}
                                data-testid={`input-price-item-price-${idx}`}
                              />
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Unit (e.g., hour)"
                                  value={item.unit}
                                  onChange={(e) => updatePriceItem(idx, "unit", e.target.value)}
                                  data-testid={`input-price-item-unit-${idx}`}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removePriceItem(idx)}
                                  data-testid={`button-remove-price-item-${idx}`}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Text-based Pricing */}
                  {formData.priceType === "text" && (
                    <div className="rounded-xl border p-6 space-y-4">
                      <h4 className="font-medium">Price Description</h4>
                      <Textarea
                        id="priceText"
                        placeholder="e.g., Flexible pricing based on project scope. Contact for quote."
                        rows={4}
                        value={formData.priceText}
                        onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
                        data-testid="textarea-price-text"
                      />
                    </div>
                  )}

                  {/* Accepted Payment Methods Section */}
                  <div className="rounded-xl border bg-gradient-to-br from-green-50/50 to-white p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Accepted Payment Methods *</h3>
                        <p className="text-sm text-muted-foreground">How would you like to get paid for this service?</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card Payment */}
                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.acceptedPaymentMethods.includes("card")
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <Checkbox
                          checked={formData.acceptedPaymentMethods.includes("card")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, acceptedPaymentMethods: [...formData.acceptedPaymentMethods, "card"] });
                            } else {
                              setFormData({ ...formData, acceptedPaymentMethods: formData.acceptedPaymentMethods.filter(m => m !== "card") });
                            }
                          }}
                          data-testid="checkbox-payment-card"
                        />
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                          <div>
                            <span className="font-medium">Card</span>
                            <p className="text-xs text-muted-foreground">Credit/Debit via Stripe</p>
                          </div>
                        </div>
                      </label>

                      {/* TWINT Payment */}
                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.acceptedPaymentMethods.includes("twint")
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <Checkbox
                          checked={formData.acceptedPaymentMethods.includes("twint")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, acceptedPaymentMethods: [...formData.acceptedPaymentMethods, "twint"] });
                            } else {
                              setFormData({ ...formData, acceptedPaymentMethods: formData.acceptedPaymentMethods.filter(m => m !== "twint") });
                            }
                          }}
                          data-testid="checkbox-payment-twint"
                        />
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-[#00AAFF] rounded flex items-center justify-center text-white text-[10px] font-bold">T</div>
                          <div>
                            <span className="font-medium">TWINT</span>
                            <p className="text-xs text-muted-foreground">Swiss mobile payment</p>
                          </div>
                        </div>
                      </label>

                      {/* Cash Payment */}
                      <label
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.acceptedPaymentMethods.includes("cash")
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <Checkbox
                          checked={formData.acceptedPaymentMethods.includes("cash")}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, acceptedPaymentMethods: [...formData.acceptedPaymentMethods, "cash"] });
                            } else {
                              setFormData({ ...formData, acceptedPaymentMethods: formData.acceptedPaymentMethods.filter(m => m !== "cash") });
                            }
                          }}
                          data-testid="checkbox-payment-cash"
                        />
                        <div className="flex items-center gap-2">
                          <Banknote className="w-5 h-5 text-green-600" />
                          <div>
                            <span className="font-medium">Cash</span>
                            <p className="text-xs text-muted-foreground">Pay in person</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {formData.acceptedPaymentMethods.length === 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please select at least one payment method
                      </p>
                    )}
                  </div>

                  {/* Promotional Packages Section */}
                  <div className="space-y-4 mt-8 pt-8 border-t">
                    <div>
                      <Label>Boost Your Service (Optional)</Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-4">
                        Select a promotional package to increase visibility
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Standard - Free */}
                      <div
                        onClick={() => setFormData({ ...formData, selectedPromotionalPackage: null })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.selectedPromotionalPackage === null
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                        data-testid="package-standard"
                      >
                        <div className="font-semibold">Standard Listing</div>
                        <div className="text-2xl font-bold text-primary mt-2">Free</div>
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                          <li>✓ Regular listing</li>
                          <li>✓ Basic visibility</li>
                          <li>✓ Customer reviews</li>
                        </ul>
                      </div>

                      {/* Featured Service */}
                      <div
                        onClick={() => setFormData({ ...formData, selectedPromotionalPackage: "featured" })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${formData.selectedPromotionalPackage === "featured"
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                        data-testid="package-featured"
                      >
                        <div className="absolute -top-2 left-4 bg-primary text-white text-xs px-2 py-1 rounded-full">Popular</div>
                        <div className="font-semibold">Featured Service</div>
                        <div className="text-2xl font-bold text-primary mt-2">CHF 9.99</div>
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                          <li>✓ Everything in Standard</li>
                          <li>✓ Featured badge</li>
                          <li>✓ Higher in search</li>
                        </ul>
                      </div>

                      {/* Premium Service */}
                      <div
                        onClick={() => setFormData({ ...formData, selectedPromotionalPackage: "premium" })}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.selectedPromotionalPackage === "premium"
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                        data-testid="package-premium"
                      >
                        <div className="font-semibold">Premium Service</div>
                        <div className="text-2xl font-bold text-primary mt-2">CHF 19.99</div>
                        <ul className="text-sm text-muted-foreground mt-3 space-y-1">
                          <li>✓ Everything in Featured</li>
                          <li>✓ Premium badge</li>
                          <li>✓ Gallery boost (8 images)</li>
                        </ul>
                      </div>
                    </div>

                    {/* Account Plans Info - Collapsible */}
                    <div className="mt-6 pt-6 border-t">
                      <button
                        type="button"
                        onClick={() => setShowAccountPlans(!showAccountPlans)}
                        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                        data-testid="button-toggle-account-plans"
                      >
                        <span>{showAccountPlans ? "▼" : "▶"}</span>
                        💡 Account-wide Packages (See more)
                      </button>

                      {showAccountPlans && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Professional Badge */}
                            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
                              <div className="font-semibold text-amber-900 dark:text-amber-100">Professional Badge</div>
                              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">CHF 5/mo</div>
                              <ul className="text-sm text-amber-800 dark:text-amber-200 mt-3 space-y-1">
                                <li>✓ Badge on all services</li>
                                <li>✓ Build trust & credibility</li>
                                <li>✓ Higher customer confidence</li>
                                <li>✓ Account-wide visibility boost</li>
                              </ul>
                            </div>

                            {/* Pro Account */}
                            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
                              <div className="font-semibold text-purple-900 dark:text-purple-100">Pro Account</div>
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">CHF 29/mo</div>
                              <ul className="text-sm text-purple-800 dark:text-purple-200 mt-3 space-y-1">
                                <li>✓ Everything in Professional</li>
                                <li>✓ Featured in category</li>
                                <li>✓ Priority customer support</li>
                                <li>✓ Advanced analytics (coming soon)</li>
                              </ul>
                            </div>
                          </div>
                          {/* CTA Button to Plans Page */}
                          <div className="text-center pt-2">
                            <Link href="/plans">
                              <Button
                                type="button"
                                variant="outline"
                                className="gap-2"
                                data-testid="button-view-all-plans"
                              >
                                <Sparkles className="w-4 h-4" />
                                View All Plans & Subscribe
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </form>

            {/* Fixed Footer with Navigation - Outside form, uses form attribute */}
            <div className="flex items-center justify-between pt-4 pb-2 border-t bg-background flex-shrink-0">
              {/* Left side - Back button and Save Draft */}
              <div className="flex gap-2">
                {!isFirstTab && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goToPreviousTab}
                    data-testid="button-previous-step"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                {/* Save Draft button - always visible in create mode (h) */}
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={!formData.title.trim() || createServiceMutation.isPending}
                    data-testid="button-save-draft"
                    className={draftSaved ? "border-green-500 text-green-600" : ""}
                  >
                    {createServiceMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : draftSaved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        Draft Saved
                      </>
                    ) : "Save Draft"}
                  </Button>
                )}
              </div>

              {/* Right side - Cancel and Next/Publish */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-service"
                >
                  Cancel
                </Button>

                {/* Show Next button if not on last tab, otherwise show Publish/Update */}
                {!isLastTab ? (
                  <Button
                    type="button"
                    onClick={goToNextTab}
                    className="min-w-[100px]"
                    data-testid="button-next-step"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    form="service-form"
                    disabled={isSubmitDisabled || !formProgress.isComplete}
                    className="min-w-[140px] bg-gradient-to-r from-primary to-primary/90"
                    data-testid="button-submit-service"
                  >
                    {validatingAddresses ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Validating...
                      </>
                    ) : isEditMode ? (
                      updateServiceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Update Service
                        </>
                      )
                    ) : (
                      createServiceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Publishing...
                        </>
                      ) : formProgress.isComplete ? (
                        "Publish Service"
                      ) : (
                        <>
                          <span className="hidden sm:inline">
                            Missing: {formProgress.steps.filter(s => !s.done).map(s => s.label).join(', ')}
                          </span>
                          <span className="sm:hidden">
                            {formProgress.steps.filter(s => !s.done).length} steps left
                          </span>
                        </>
                      )
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Progress Sidebar (Desktop Only) */}
          {!isEditMode && formData && (
            <div className="hidden lg:flex flex-col w-80 border-l bg-muted/30 p-6">
              <h3 className="text-lg font-semibold mb-4">Your Progress</h3>

              {/* Progress percentage */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-bold text-2xl text-primary">{formProgress.percentage}%</span>
                </div>
                <Progress value={formProgress.percentage} className="h-3" />
              </div>

              {/* Step list */}
              <div className="space-y-3 flex-1">
                {formProgress.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${step.done
                      ? 'bg-primary/10 text-primary'
                      : 'bg-background text-muted-foreground'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.done
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                      }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${step.done ? 'text-primary' : ''}`}>{step.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.done ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tips section */}
              <div className="mt-6 p-4 bg-background rounded-lg border">
                <h4 className="font-medium text-sm mb-2">💡 Tips</h4>
                <p className="text-xs text-muted-foreground">
                  Complete all steps for better visibility. Services with photos get 3x more views!
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* AI Hashtag Suggestions Dialog */}
      <Dialog open={showHashtagSuggestions} onOpenChange={setShowHashtagSuggestions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Hashtag Suggestions</DialogTitle>
            <DialogDescription>
              Select hashtags to add to your service (max 3 total)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {suggestedHashtags.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {suggestedHashtags.map((tag: string) => {
                    const isAdded = formData.hashtags.includes(tag);
                    const canAdd = formData.hashtags.length < 5;

                    return (
                      <Badge
                        key={tag}
                        variant={isAdded ? "default" : "outline"}
                        className={`cursor-pointer ${!canAdd && !isAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isAdded && canAdd) {
                            selectSuggestedHashtag(tag);
                          }
                        }}
                        data-testid={`suggested-hashtag-${tag}`}
                      >
                        <Hash className="w-3 h-3 mr-1" />
                        {tag}
                        {isAdded && <span className="ml-1">✓</span>}
                      </Badge>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formData.hashtags.length}/5 hashtags selected
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hashtag suggestions available
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowHashtagSuggestions(false)}
                data-testid="button-close-suggestions"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Would you like to save as a draft before closing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel onClick={handleDiscardAndClose} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Discard
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveAndClose} className="gap-2">
              <Save className="w-4 h-4" />
              Save as Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
