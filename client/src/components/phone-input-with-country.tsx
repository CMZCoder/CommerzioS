/**
 * Phone Input with Country Code Selector
 * 
 * Features:
 * - Country code dropdown with flags
 * - Swiss (+41) preselected
 * - Accepts local format (044, 078...) and auto-formats
 * - Outputs international format for tel: links
 */

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronDown, Check, Phone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Popular European countries with their codes and flags
export const COUNTRY_CODES = [
  { code: "+41", country: "Switzerland", flag: "🇨🇭", localPrefix: "0", pattern: /^(0?\d{2})\s?(\d{3})\s?(\d{2})\s?(\d{2})$/ },
  { code: "+49", country: "Germany", flag: "🇩🇪", localPrefix: "0", pattern: /^(0?\d{2,5})\s?(\d{3,8})$/ },
  { code: "+43", country: "Austria", flag: "🇦🇹", localPrefix: "0", pattern: /^(0?\d{1,4})\s?(\d{3,10})$/ },
  { code: "+33", country: "France", flag: "🇫🇷", localPrefix: "0", pattern: /^(0?\d)\s?(\d{2})\s?(\d{2})\s?(\d{2})\s?(\d{2})$/ },
  { code: "+39", country: "Italy", flag: "🇮🇹", localPrefix: "", pattern: /^\d{6,11}$/ },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", localPrefix: "0", pattern: /^(0?\d{2,5})\s?(\d{3,8})$/ },
  { code: "+31", country: "Netherlands", flag: "🇳🇱", localPrefix: "0", pattern: /^(0?\d{1,3})\s?(\d{6,8})$/ },
  { code: "+32", country: "Belgium", flag: "🇧🇪", localPrefix: "0", pattern: /^(0?\d{1,3})\s?(\d{6,8})$/ },
  { code: "+34", country: "Spain", flag: "🇪🇸", localPrefix: "", pattern: /^\d{9}$/ },
  { code: "+351", country: "Portugal", flag: "🇵🇹", localPrefix: "", pattern: /^\d{9}$/ },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸", localPrefix: "", pattern: /^\d{10}$/ },
] as const;

export type CountryCode = typeof COUNTRY_CODES[number];

interface PhoneInputWithCountryProps {
  value: string; // Can be full international or local format
  onChange: (fullInternational: string, localDisplay: string, countryCode: string) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
  label?: string;
  required?: boolean;
}

/**
 * Parse a phone number and extract country code if present
 */
function parsePhoneNumber(value: string): { countryCode: string; localNumber: string } {
  const cleaned = value.replace(/[\s\-()]/g, "");

  // Check if it starts with a country code
  for (const country of COUNTRY_CODES) {
    if (cleaned.startsWith(country.code)) {
      return {
        countryCode: country.code,
        localNumber: cleaned.substring(country.code.length),
      };
    }
  }

  // Default to Swiss if no country code found
  return {
    countryCode: "+41",
    localNumber: cleaned.replace(/^\+/, ""),
  };
}

/**
 * Format a local number for display (add spaces for readability)
 */
function formatLocalNumber(number: string, countryCode: string): string {
  const digits = number.replace(/\D/g, "");

  // Swiss format: 044 123 45 67 or 078 123 45 67
  if (countryCode === "+41") {
    if (digits.length >= 10) {
      const noLeadingZero = digits.startsWith("0") ? digits.substring(1) : digits;
      return `0${noLeadingZero.substring(0, 2)} ${noLeadingZero.substring(2, 5)} ${noLeadingZero.substring(5, 7)} ${noLeadingZero.substring(7, 9)}`.trim();
    }
    return digits;
  }

  // Default formatting: group by 3s
  return digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
}

/**
 * Convert to international format for tel: links
 * Example: "044 123 45 67" with +41 -> "41441234567"
 */
export function toInternationalFormat(localNumber: string, countryCode: string): string {
  let digits = localNumber.replace(/\D/g, "");

  // Remove leading zero if country uses it
  const country = COUNTRY_CODES.find(c => c.code === countryCode);
  if (country?.localPrefix === "0" && digits.startsWith("0")) {
    digits = digits.substring(1);
  }

  // Return without + for tel: links
  return `${countryCode.replace("+", "")}${digits}`;
}

/**
 * Format for tel: href
 */
export function formatTelHref(localNumber: string, countryCode: string): string {
  return `tel:${toInternationalFormat(localNumber, countryCode)}`;
}

export function PhoneInputWithCountry({
  value,
  onChange,
  id,
  placeholder,
  disabled = false,
  className,
  error,
  label,
  required,
}: PhoneInputWithCountryProps) {
  const [open, setOpen] = useState(false);
  const parsed = parsePhoneNumber(value || "");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    COUNTRY_CODES.find(c => c.code === parsed.countryCode) || COUNTRY_CODES[0]
  );
  const [localNumber, setLocalNumber] = useState(parsed.localNumber);

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = parsePhoneNumber(value || "");
    const country = COUNTRY_CODES.find(c => c.code === parsed.countryCode) || COUNTRY_CODES[0];
    setSelectedCountry(country);
    setLocalNumber(parsed.localNumber);
  }, [value]);

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setOpen(false);

    // Trigger onChange with new country code
    const fullInternational = localNumber ? `${country.code}${localNumber.replace(/^0/, "")}` : "";
    onChange(fullInternational, localNumber, country.code);
  };

  const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Allow digits, spaces, and common separators during input
    newValue = newValue.replace(/[^\d\s-]/g, "");

    setLocalNumber(newValue);

    // Calculate international format
    const digits = newValue.replace(/\D/g, "");
    const normalizedDigits = digits.startsWith("0") && selectedCountry.localPrefix === "0"
      ? digits.substring(1)
      : digits;
    const fullInternational = normalizedDigits ? `${selectedCountry.code}${normalizedDigits}` : "";

    onChange(fullInternational, newValue, selectedCountry.code);
  };

  // Format on blur
  const handleBlur = () => {
    const formatted = formatLocalNumber(localNumber, selectedCountry.code);
    if (formatted !== localNumber) {
      setLocalNumber(formatted);

      const digits = formatted.replace(/\D/g, "");
      const normalizedDigits = digits.startsWith("0") && selectedCountry.localPrefix === "0"
        ? digits.substring(1)
        : digits;
      const fullInternational = normalizedDigits ? `${selectedCountry.code}${normalizedDigits}` : "";

      onChange(fullInternational, formatted, selectedCountry.code);
    }
  };

  const displayPlaceholder = placeholder || (selectedCountry.code === "+41" ? "044 123 45 67" : "Enter number");

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="flex gap-2">
        {/* Country Code Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className="w-[100px] justify-between px-2 font-normal"
              type="button"
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
              </span>
              <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {COUNTRY_CODES.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={`${country.country} ${country.code}`}
                      onSelect={() => handleCountrySelect(country)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedCountry.code === country.code
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="mr-2 text-base">{country.flag}</span>
                      <span className="flex-1">{country.country}</span>
                      <span className="text-muted-foreground text-sm">{country.code}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Phone Number Input */}
        <Input
          id={id}
          type="tel"
          placeholder={displayPlaceholder}
          value={localNumber}
          onChange={handleLocalNumberChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            "flex-1",
            error && "border-red-500 focus-visible:ring-red-500"
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && !localNumber && (
        <p className="text-xs text-muted-foreground">
          Enter number with or without leading zero (e.g., 044 or 44)
        </p>
      )}
    </div>
  );
}

export default PhoneInputWithCountry;
