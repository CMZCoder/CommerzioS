import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, AlertCircle } from "lucide-react";
import type { Service, PlatformSettings, ServiceContact } from "@shared/schema";
import { ImageManager } from "@/components/image-manager";
import { ContactInput, type Contact } from "@/components/contact-input";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service & { category: any; owner: any } | null;
}

type PricingType = "fixed" | "list" | "text";

export function EditServiceModal({ open, onOpenChange, service }: EditServiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState<any>(null);
  const [validatingAddresses, setValidatingAddresses] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);

  const maxImages = user?.plan?.maxImages || 4;

  const { data: settings } = useQuery<PlatformSettings>({
    queryKey: ["/api/settings"],
    queryFn: () => apiRequest("/api/settings"),
  });

  const { data: existingContacts = [] } = useQuery<ServiceContact[]>({
    queryKey: [`/api/services/${service?.id}/contacts`],
    queryFn: () => apiRequest(`/api/services/${service?.id}/contacts`),
    enabled: !!service?.id && open,
  });

  useEffect(() => {
    if (service && open) {
      // Map existing contacts to Contact format
      const mappedContacts: Contact[] = existingContacts.map(c => ({
        id: c.id,
        contactType: c.contactType,
        value: c.value,
        name: c.name || undefined,
        role: c.role || undefined,
        isPrimary: c.isPrimary,
        isVerified: c.isVerified,
      }));

      // If no contacts exist, add default ones from service
      if (mappedContacts.length === 0) {
        if (service.contactPhone) {
          mappedContacts.push({
            contactType: "phone",
            value: service.contactPhone,
            isPrimary: true,
          });
        }
        if (service.contactEmail) {
          mappedContacts.push({
            contactType: "email",
            value: service.contactEmail,
            isPrimary: mappedContacts.length === 0,
          });
        }
      }

      setFormData({
        title: service.title,
        description: service.description,
        priceType: service.priceType || "fixed",
        price: service.price || "",
        priceText: service.priceText || "",
        priceList: service.priceList || [],
        priceUnit: service.priceUnit,
        locations: service.locations || [""],
        contacts: mappedContacts.length > 0 ? mappedContacts : [{ contactType: "email", value: "", isPrimary: true }],
        images: service.images || [],
        imageMetadata: service.imageMetadata || [],
        mainImageIndex: service.mainImageIndex || 0,
      });
    }
  }, [service, open, existingContacts]);

  const updateServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      // Update the service
      const updatedService = await apiRequest(`/api/services/${service?.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          priceType: data.priceType,
          price: data.priceType === "fixed" ? data.price : undefined,
          priceText: data.priceType === "text" ? data.priceText : undefined,
          priceList: data.priceType === "list" ? data.priceList : undefined,
          priceUnit: data.priceUnit,
          locations: data.locations.filter((l: string) => l.trim()),
          images: data.images,
          imageMetadata: data.imageMetadata,
          mainImageIndex: data.mainImageIndex,
          contactPhone: data.contacts.find((c: Contact) => c.contactType === "phone")?.value || "",
          contactEmail: data.contacts.find((c: Contact) => c.contactType === "email")?.value || "",
        }),
      });

      // Handle contacts: delete removed, update existing, create new
      const existingContactIds = existingContacts.map(c => c.id);
      const currentContactIds = data.contacts.filter((c: Contact) => c.id).map((c: Contact) => c.id);

      // Delete removed contacts
      for (const existingId of existingContactIds) {
        if (!currentContactIds.includes(existingId)) {
          await apiRequest(`/api/contacts/${existingId}`, {
            method: "DELETE",
          });
        }
      }

      // Create new contacts (those without id)
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

  if (!formData) return null;

  const addLocation = () => {
    setFormData((prev: any) => ({
      ...prev,
      locations: [...prev.locations, ""],
    }));
  };

  const updateLocation = (index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      locations: prev.locations.map((loc: string, i: number) => (i === index ? value : loc)),
    }));
  };

  const removeLocation = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      locations: prev.locations.filter((_: any, i: number) => i !== index),
    }));
  };

  const addPriceItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      priceList: [...prev.priceList, { description: "", price: "", unit: "" }],
    }));
  };

  const updatePriceItem = (index: number, field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      priceList: prev.priceList.map((item: any, i: number) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removePriceItem = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      priceList: prev.priceList.filter((_: any, i: number) => i !== index),
    }));
  };

  const addContact = () => {
    setFormData((prev: any) => ({
      ...prev,
      contacts: [...prev.contacts, { contactType: "email", value: "", isPrimary: false }],
    }));
  };

  const updateContact = (index: number, field: keyof Contact, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      contacts: prev.contacts.map((contact: Contact, i: number) =>
        i === index ? { ...contact, [field]: value } : contact
      ),
    }));
  };

  const removeContact = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      contacts: prev.contacts.filter((_: any, i: number) => i !== index),
    }));
  };

  const validateAddresses = async (): Promise<boolean> => {
    const validLocations = formData.locations.filter((l: string) => l.trim());
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

          if (!result.isSwiss) {
            errors.push(`"${location}" is not a valid Swiss address. ${result.suggestion || ""}`);
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
    
    const validLocations = formData.locations.filter((l: string) => l.trim());
    const validContacts = formData.contacts.filter((c: Contact) => c.value.trim());

    // Validate addresses FIRST if enabled (before any other checks)
    if (settings?.enableSwissAddressValidation) {
      const addressesValid = await validateAddresses();
      if (!addressesValid) {
        toast({
          title: "Address Validation Failed",
          description: "Please correct the address errors below",
          variant: "destructive",
        });
        return;
      }
    }

    // Then validate other required fields
    if (validLocations.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one location",
        variant: "destructive",
      });
      return;
    }

    if (validContacts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide at least one contact",
        variant: "destructive",
      });
      return;
    }

    updateServiceMutation.mutate({
      ...formData,
      locations: validLocations,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
          <DialogDescription>Update your service details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing & Location</TabsTrigger>
              <TabsTrigger value="media">Images & Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Service Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-edit-service-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="textarea-edit-service-description"
                />
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-6">
              <div className="space-y-2">
                <Label>Pricing Type</Label>
                <div className="flex gap-4">
                  {(["fixed", "list", "text"] as PricingType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        value={type}
                        checked={formData.priceType === type}
                        onChange={(e) => setFormData({ ...formData, priceType: e.target.value })}
                        data-testid={`radio-edit-price-type-${type}`}
                      />
                      <span className="capitalize">{type === "list" ? "Price List" : type === "text" ? "Text-based" : "Fixed Price"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.priceType === "fixed" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (CHF)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      data-testid="input-edit-service-price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priceUnit">Per</Label>
                    <select
                      id="priceUnit"
                      value={formData.priceUnit}
                      onChange={(e) => setFormData({ ...formData, priceUnit: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    >
                      <option value="hour">Hour</option>
                      <option value="job">Job</option>
                      <option value="consultation">Consultation</option>
                      <option value="day">Day</option>
                      <option value="month">Month</option>
                    </select>
                  </div>
                </div>
              )}

              {formData.priceType === "list" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Price List Items</Label>
                    <Button type="button" size="sm" variant="outline" onClick={addPriceItem}>
                      <Plus className="w-4 h-4 mr-1" /> Add Item
                    </Button>
                  </div>
                  {formData.priceList.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 border p-3 rounded">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updatePriceItem(idx, "description", e.target.value)}
                      />
                      <Input placeholder="Price" type="number" step="0.01" value={item.price} onChange={(e) => updatePriceItem(idx, "price", e.target.value)} />
                      <div className="flex gap-2">
                        <Input placeholder="Unit" value={item.unit} onChange={(e) => updatePriceItem(idx, "unit", e.target.value)} />
                        <Button type="button" size="sm" variant="destructive" onClick={() => removePriceItem(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.priceType === "text" && (
                <div className="space-y-2">
                  <Label htmlFor="priceText">Price Description</Label>
                  <Textarea
                    id="priceText"
                    value={formData.priceText}
                    onChange={(e) => setFormData({ ...formData, priceText: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Service Locations</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addLocation}>
                    <Plus className="w-4 h-4 mr-1" /> Add Location
                  </Button>
                </div>
                {addressErrors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc pl-4">
                        {addressErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                {formData.locations.map((location: string, idx: number) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={location} onChange={(e) => updateLocation(idx, e.target.value)} />
                    {formData.locations.length > 1 && (
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeLocation(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {settings?.enableSwissAddressValidation && (
                  <p className="text-sm text-muted-foreground">
                    Addresses will be validated to ensure they are in Switzerland
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              <ImageManager
                images={formData.images}
                imageMetadata={formData.imageMetadata}
                mainImageIndex={formData.mainImageIndex}
                maxImages={maxImages}
                onImagesChange={(images) => setFormData((prev: any) => ({ ...prev, images }))}
                onMetadataChange={(metadata) => setFormData((prev: any) => ({ ...prev, imageMetadata: metadata }))}
                onMainImageChange={(index) => setFormData((prev: any) => ({ ...prev, mainImageIndex: index }))}
              />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Contact Information *</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addContact}
                    data-testid="button-add-contact"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Another Contact
                  </Button>
                </div>
                
                {formData.contacts.map((contact: Contact, idx: number) => (
                  <ContactInput
                    key={idx}
                    contact={contact}
                    index={idx}
                    canRemove={formData.contacts.length > 1}
                    verificationEnabled={!!settings?.requireEmailVerification || !!settings?.requirePhoneVerification}
                    showVerification={!!contact.id}
                    onUpdate={updateContact}
                    onRemove={removeContact}
                  />
                ))}

                {formData.contacts.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Please add at least one contact method
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button type="submit" disabled={updateServiceMutation.isPending || validatingAddresses} data-testid="button-submit-edit">
              {validatingAddresses ? "Validating..." : updateServiceMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
