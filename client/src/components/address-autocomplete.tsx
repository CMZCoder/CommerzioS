import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useGeocoding } from "@/hooks/useGeocoding";
import type { GeocodingSuggestion } from "@/lib/geocoding";

interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  canton: string;
  fullAddress: string;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData | null) => void;
  initialValue?: string;
  label?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  onAddressSelect,
  initialValue = "",
  label = "Search Address",
  required = false,
}: AddressAutocompleteProps) {
  const { toast } = useToast();
  const { query, setQuery, suggestions, isLoading, error, clearSuggestions } = useGeocoding({
    minQueryLength: 2,
    debounceMs: 300,
    limit: 10,
    autoSearch: true,
  });
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize query with initial value if provided
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue);
    }
  }, [initialValue, setQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when suggestions are available
  useEffect(() => {
    if (suggestions.length > 0 && query.length >= 2) {
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [suggestions, query]);

  // Show error toast if geocoding fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Address search error",
        description: "Failed to search addresses. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const selectAddress = (suggestion: GeocodingSuggestion) => {
    const addressData: AddressData = {
      street: suggestion.street || "",
      city: suggestion.city || "",
      postalCode: suggestion.postcode || "",
      canton: "", // Canton is typically extracted from state field in address
      fullAddress: suggestion.display_name,
    };
    
    setSelectedAddress(addressData);
    setQuery("");
    onAddressSelect(addressData);
    
    setIsOpen(false);
    clearSuggestions();
    setSelectedIndex(-1);
  };

  const clearAddress = () => {
    setSelectedAddress(null);
    setQuery("");
    onAddressSelect(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectAddress(suggestions[selectedIndex]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address-search">
        {label} {required && '*'}
      </Label>
      
      {selectedAddress ? (
        <div className="border rounded-lg p-4 bg-accent/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <Badge variant="secondary" className="text-xs">
                  Validated Swiss Address
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-sm">{selectedAddress.fullAddress}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedAddress.postalCode} {selectedAddress.city}
                  {selectedAddress.canton && `, ${selectedAddress.canton}`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAddress}
              data-testid="button-clear-address"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div ref={autocompleteRef} className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="address-search"
              type="text"
              placeholder="Search Swiss address, city, or postcode..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) setIsOpen(true);
              }}
              className="pl-10 pr-10"
              data-testid="input-address-search"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {isOpen && suggestions.length > 0 && (
            <div 
              className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
              data-testid="address-suggestions-dropdown"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.lat}-${suggestion.lon}-${index}`}
                  type="button"
                  onClick={() => selectAddress(suggestion)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-3 ${
                    selectedIndex === index ? 'bg-accent' : ''
                  }`}
                  data-testid={`address-suggestion-${index}`}
                >
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {suggestion.display_name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {suggestion.postcode} {suggestion.city}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            You must select a validated Swiss address from the suggestions
          </p>
        </div>
      )}
    </div>
  );
}
