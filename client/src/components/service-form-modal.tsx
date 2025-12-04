import { useState, useEffect, useRef, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, type ServiceWithDetails, type CategoryWithTemporary } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePageContextActions } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, AlertCircle, Sparkles, Hash, Mail, Camera, MapPin, DollarSign, CheckCircle2, Loader2, Phone, ChevronRight, ChevronLeft } from "lucide-react";
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
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const [validatingAddresses, setValidatingAddresses] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [loadingHashtags, setLoadingHashtags] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState(false);
  const [showAccountPlans, setShowAccountPlans] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ categoryId: string; subcategoryId: string | null } | null>(null);
  const [isAiCategoryLoading, setIsAiCategoryLoading] = useState(false);
  const aiSuggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("main");

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
        { id: 'contact', label: 'Contact', done: formData.contacts.some((c: Contact) => c.value?.trim()), icon: Mail }
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
  
  const goToNextTab = () => {
    if (!isLastTab) {
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
    contextActions.updateFormProgress("hasContact", formData.contacts?.some((c: Contact) => c.value.trim()));
    
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
      const fallbackContacts: Contact[] = [];
      
      if (service.contactPhone) {
        fallbackContacts.push({
          contactType: "phone",
          value: service.contactPhone,
          isPrimary: true,
        });
      }
      if (service.contactEmail) {
        fallbackContacts.push({
          contactType: "email",
          value: service.contactEmail,
          isPrimary: fallbackContacts.length === 0,
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
        contacts: fallbackContacts.length > 0 ? fallbackContacts : [{ contactType: "email", value: "", isPrimary: true }],
        images: service.images || [],
        imageMetadata: Array.isArray(service.imageMetadata) ? service.imageMetadata : [],
        mainImageIndex: service.mainImageIndex || 0,
        hashtags: service.hashtags || [],
        selectedPromotionalPackage: null,
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
  useEffect(() => {
    if (isEditMode || !user || !open || !formData) return;
    
    let hasChanges = false;
    const updates: Partial<FormData> = {};
    
    // Initialize locations with user's main address
    if (formData.locations.length === 0 && userAddresses.length > 0) {
      const mainAddress = userAddresses.find((a: any) => a.isMain) || userAddresses[0];
      if (mainAddress) {
        // Construct full address from components
        const fullAddress = mainAddress.fullAddress || 
          `${mainAddress.street}, ${mainAddress.postalCode} ${mainAddress.city}`;
        if (fullAddress?.trim()) {
          updates.locations = [fullAddress];
          hasChanges = true;
        }
      }
    }
    
    // Initialize contacts with user's profile data
    if (formData.contacts.length === 0) {
      const initialContacts: Contact[] = [];
      const userName = `${user.firstName} ${user.lastName}`.trim();
      
      if (user.phoneNumber) {
        initialContacts.push({
          contactType: "phone",
          value: user.phoneNumber,
          name: userName || undefined,
          isPrimary: true,
          isVerified: user.phoneVerified,
        });
      }
      
      if (user.email) {
        initialContacts.push({
          contactType: "email",
          value: user.email,
          name: userName || undefined,
          isPrimary: initialContacts.length === 0,
          isVerified: user.emailVerified,
        });
      }
      
      if (initialContacts.length === 0) {
        initialContacts.push({
          contactType: "email",
          value: "",
          name: userName || undefined,
          isPrimary: true,
        });
      }
      
      updates.contacts = initialContacts;
      hasChanges = true;
    }
    
    if (hasChanges) {
      setFormData((prev: FormData | null) => ({ ...prev!, ...updates }));
    }
  }, [user, open, formData, isEditMode, userAddresses]);

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
          contactPhone: data.contacts.find((c: Contact) => c.contactType === "phone")?.value || "",
          contactEmail: data.contacts.find((c: Contact) => c.contactType === "email")?.value || "",
        }),
      });

      for (const contact of data.contacts) {
        if (contact.value.trim()) {
          await apiRequest(`/api/services/${serviceData.id}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              contactType: contact.contactType,
              value: contact.value,
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
          contactPhone: data.contacts.find((c: Contact) => c.contactType === "phone")?.value || "",
          contactEmail: data.contacts.find((c: Contact) => c.contactType === "email")?.value || "",
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

      for (const contact of data.contacts) {
        if (!contact.id && contact.value.trim()) {
          await apiRequest(`/api/services/${service?.id}/contacts`, {
            method: "POST",
            body: JSON.stringify({
              contactType: contact.contactType,
              value: contact.value,
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
    });
    setDraftSaved(false);
    setAddressErrors([]);
    setHashtagInput("");
    setSuggestedHashtags([]);
    setShowHashtagSuggestions(false);
    setIsManualOverride(false);
    setAiSuggestion(null);
    setIsAiCategoryLoading(false);
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
      contacts: [...prev!.contacts, { contactType: "email", value: "", isPrimary: false }],
    }));
  };

  const updateContact = (index: number, field: keyof Contact, value: string | boolean) => {
    setFormData((prev: FormData | null) => {
      if (!prev) return prev;
      
      return {
        ...prev,
        contacts: prev.contacts.map((contact: Contact, i: number) => {
          if (i !== index) return contact;
          
          // When switching contact type, clear the value since the format is different
          if (field === 'contactType' && typeof value === 'string' && contact.contactType !== value) {
            return { 
              ...contact, 
              contactType: value as "phone" | "email", 
              value: '' 
            };
          }
          
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
    if (cleaned && cleaned.length > 0 && formData!.hashtags.length < 3 && !formData!.hashtags.includes(cleaned)) {
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

  const handleAISuggestHashtags = async () => {
    if (!formData) return;
    if (formData.images.length === 0) {
      toast({
        title: "No Images",
        description: "Please upload at least one image to get hashtag suggestions",
        variant: "destructive",
      });
      return;
    }

    setLoadingHashtags(true);
    try {
      // Filter valid uploaded images (object paths or HTTP URLs)
      const validImages = formData.images.filter(img => 
        typeof img === 'string' && (
          img.startsWith('/objects/') || 
          img.startsWith('http://') || 
          img.startsWith('https://')
        )
      );
      
      if (validImages.length === 0) {
        toast({
          title: "Images Not Ready",
          description: "Please wait for all images to finish uploading before requesting AI hashtags",
          variant: "destructive",
        });
        setLoadingHashtags(false);
        return;
      }

      const response = await apiRequest("/api/ai/suggest-hashtags", {
        method: "POST",
        body: JSON.stringify({ imageUrls: validImages }),
      });
      
      if (response.hashtags && response.hashtags.length > 0) {
        setSuggestedHashtags(response.hashtags);
        setShowHashtagSuggestions(true);
        toast({
          title: "Hashtags Suggested!",
          description: `AI suggested ${response.hashtags.length} hashtags: ${response.hashtags.slice(0, 3).join(', ')}...`,
        });
      } else {
        toast({
          title: "No Suggestions",
          description: "AI couldn't generate hashtag suggestions from your images. Try adding them manually.",
        });
      }
    } catch (error: any) {
      console.error("Hashtag suggestion error:", error);
      toast({
        title: "Suggestion Failed",
        description: "We couldn't generate hashtag suggestions right now. You can add hashtags manually instead.",
      });
    } finally {
      setLoadingHashtags(false);
    }
  };

  const selectSuggestedHashtag = (tag: string) => {
    addHashtag(tag);
  };

  const handleGenerateTitle = async () => {
    if (!formData) return;
    if (formData.images.length === 0) {
      toast({
        title: "Images Required",
        description: "Please upload at least one image to generate a title suggestion",
        variant: "destructive",
      });
      return;
    }

    setGeneratingTitle(true);
    try {
      const validImages = formData.images.filter(img => 
        typeof img === 'string' && (
          img.startsWith('/objects/') || 
          img.startsWith('http://') || 
          img.startsWith('https://')
        )
      );

      if (validImages.length === 0) {
        toast({
          title: "Images Not Ready",
          description: "Please wait for all images to finish uploading before generating a title",
          variant: "destructive",
        });
        setGeneratingTitle(false);
        return;
      }

      const response = await apiRequest("/api/ai/generate-title", {
        method: "POST",
        body: JSON.stringify({ 
          imageUrls: validImages,
          currentTitle: formData.title || undefined
        }),
      });

      if (response.title) {
        setFormData((prev: FormData | null) => prev ? { ...prev, title: response.title } : prev);
        toast({
          title: "Title Generated!",
          description: "AI has suggested a title based on your images",
        });
      }
    } catch (error: any) {
      console.error("Title generation error:", error);
      toast({
        title: "Generation Failed",
        description: "Couldn't generate a title. Try entering one manually.",
        variant: "destructive",
      });
    } finally {
      setGeneratingTitle(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData) return;
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a service title first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const categoryName = categories.find(c => c.id === formData.categoryId)?.name;
      const response = await apiRequest("/api/ai/generate-description-simple", {
        method: "POST",
        body: JSON.stringify({ 
          title: formData.title,
          categoryName
        }),
      });
      
      if (response.description) {
        setFormData((prev: FormData | null) => ({ ...prev!, description: response.description }));
        toast({
          title: "Description Generated",
          description: "AI has generated a description based on your title. Feel free to edit it!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Couldn't generate description. Please write it manually.",
        variant: "destructive",
      });
    } finally {
      setGeneratingDescription(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData) return;
    
    const validLocations = formData.locations.filter((l: string | undefined) => l && typeof l === 'string' && l.trim());
    const validContacts = formData.contacts.filter((c: Contact) => c.value.trim());

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
      
      if (!formData.title) errors.push({ field: "title", message: "Service title is required" });
      if (!formData.description) errors.push({ field: "description", message: "Service description is required" });
      if (!formData.categoryId) errors.push({ field: "category", message: "Category selection is required" });
      if (validLocations.length === 0) errors.push({ field: "location", message: "Add at least one service location" });
      if (validContacts.length === 0) errors.push({ field: "contact", message: "Add at least one contact method" });
      
      if (errors.length > 0) {
        const fieldName = errors[0].field;
        const fieldLabels: Record<string, string> = {
          title: "Main Info",
          description: "Main Info",
          category: "Main Info",
          location: "Location & Contacts",
          contact: "Location & Contacts",
        };
        toast({
          title: `Check ${fieldLabels[fieldName]} tab`,
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
    const validContacts = formData.contacts.filter((c: Contact) => c.value.trim());

    // Basic validation for draft - only require title
    if (!formData.title) {
      toast({
        title: "Validation Error",
        description: "Please provide at least a title for your draft",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modern Header with Progress */}
        <div className="space-y-4 pb-4 border-b">
          <DialogHeader className="space-y-1">
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
          
          {/* Progress Bar - only show in create mode */}
          {!isEditMode && formData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {formProgress.completed} of {formProgress.total} steps completed
                </span>
                <span className="font-medium text-primary">{formProgress.percentage}%</span>
              </div>
              <Progress value={formProgress.percentage} className="h-2" />
              
              {/* Step indicators */}
              <div className="flex items-center justify-between pt-2">
                {formProgress.steps.map((step) => (
                  <div 
                    key={step.id} 
                    className={`flex flex-col items-center gap-1 ${step.done ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.done 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[10px] font-medium hidden sm:block">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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

              {/* Title & Description with AI */}
              <div className="rounded-xl border p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Title & Description</h3>
                    <p className="text-sm text-muted-foreground">Use AI to generate compelling content</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="title">Service Title *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTitle}
                      disabled={formData.images.length === 0 || generatingTitle}
                      className="gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300"
                      data-testid="button-ai-generate-title"
                    >
                      {generatingTitle ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      {generatingTitle ? "Generating..." : "AI Suggest"}
                    </Button>
                  </div>
                  <Input
                    id="title"
                    placeholder="e.g., Professional House Cleaning"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="text-lg"
                    data-testid="input-service-title"
                  />
                  {formData.images.length === 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      Upload images first to enable AI title generation
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="description">Description *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={!formData.title.trim() || generatingDescription}
                      className="gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:border-purple-300"
                      data-testid="button-ai-generate-description"
                    >
                      {generatingDescription ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      {generatingDescription ? "Generating..." : "AI Generate"}
                    </Button>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe your service in detail... or click 'AI Generate' for suggestions"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    data-testid="textarea-service-description"
                  />
                  {!formData.title.trim() && (
                    <p className="text-xs text-muted-foreground">
                      Enter a title first to generate AI description
                    </p>
                  )}
                </div>
              </div>

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
                {formData.hashtags.length < 3 && (
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

                {/* AI Suggest Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAISuggestHashtags}
                  disabled={formData.images.length === 0 || loadingHashtags}
                  className="w-full"
                  data-testid="button-ai-suggest-hashtags"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loadingHashtags ? "Analyzing Images..." : "AI Suggest Hashtags"}
                </Button>
                {formData.images.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Upload images first to get AI hashtag suggestions
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Location & Contacts Tab */}
            <TabsContent value="location" className="space-y-6 mt-0">
              {/* Locations Section */}
              <div className="rounded-xl border bg-gradient-to-br from-blue-50/50 to-white p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Service Locations</h3>
                    <p className="text-sm text-muted-foreground">Where do you offer this service?</p>
                  </div>
                </div>
                
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
                <div className="rounded-xl border p-6 space-y-4">
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
                        <p className="text-sm text-muted-foreground">How can customers reach you?</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addContact}
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
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.priceType === type
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedPromotionalPackage === null
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all relative ${
                      formData.selectedPromotionalPackage === "featured"
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
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedPromotionalPackage === "premium"
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
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>

        {/* Fixed Footer with Navigation - Outside form, uses form attribute */}
        <div className="flex items-center justify-between pt-4 pb-2 border-t bg-background flex-shrink-0">
          {/* Left side - Back button or Save Draft */}
          <div className="flex gap-2">
            {!isFirstTab ? (
              <Button
                type="button"
                variant="ghost"
                onClick={goToPreviousTab}
                data-testid="button-previous-step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            ) : !isEditMode ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                data-testid="button-save-draft"
                className={draftSaved ? "border-green-500 text-green-600" : ""}
              >
                {draftSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Draft Saved
                  </>
                ) : "Save Draft"}
              </Button>
            ) : null}
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
                    `Complete ${(formProgress.total || 0) - (formProgress.completed || 0)} more steps`
                  )
                )}
              </Button>
            )}
          </div>
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
                    const canAdd = formData.hashtags.length < 3;
                    
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
                  {formData.hashtags.length}/3 hashtags selected
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
    </Dialog>
  );
}
