import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2, AlertCircle, Phone, Mail, User, Briefcase } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PhoneInputWithCountry, toInternationalFormat } from "@/components/phone-input-with-country";

export interface Contact {
  id?: string;
  phone?: string; // Stored in international format: +41441234567
  phoneCountryCode?: string; // e.g., "+41"
  phoneLocal?: string; // Local display format: 044 123 45 67
  email?: string;
  name?: string;
  role?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
  // Legacy support - keep for compatibility
  contactType?: "phone" | "email";
  value?: string;
}

interface ContactInputProps {
  contact: Contact;
  index: number;
  canRemove: boolean;
  verificationEnabled: boolean;
  showVerification: boolean;
  onUpdate: (index: number, field: keyof Contact, value: any) => void;
  onRemove: (index: number) => void;
}

export function ContactInput({
  contact,
  index,
  canRemove,
  verificationEnabled,
  showVerification,
  onUpdate,
  onRemove,
}: ContactInputProps) {
  const { toast } = useToast();
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(!!(contact.name || contact.role));

  const handleSendVerificationCode = async () => {
    if (!contact.id) {
      toast({
        title: "Error",
        description: "Contact must be saved before verification",
        variant: "destructive",
      });
      return;
    }

    setSendingCode(true);
    try {
      await apiRequest(`/api/contacts/${contact.id}/send-verification`, {
        method: "POST",
      });
      setShowVerificationInput(true);
      toast({
        title: "Verification Code Sent",
        description: "A verification code has been sent",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyContact = async () => {
    if (!contact.id || !verificationCode) return;

    setVerifying(true);
    try {
      const result = await apiRequest(`/api/contacts/${contact.id}/verify`, {
        method: "POST",
        body: JSON.stringify({ code: verificationCode }),
      });

      if (result.success) {
        onUpdate(index, "isVerified", true);
        setShowVerificationInput(false);
        setVerificationCode("");
        toast({
          title: "Contact Verified",
          description: "Contact has been successfully verified",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const validatePhone = (value: string): { isValid: boolean; message: string } => {
    if (!value) return { isValid: true, message: "" }; // Empty is valid (optional)
    // International phone validation - at least 8 digits after country code
    const digits = value.replace(/\D/g, '');
    const isValid = digits.length >= 8 && digits.length <= 15;
    return {
      isValid,
      message: isValid ? "" : "Please enter a valid phone number"
    };
  };

  const validateEmail = (value: string): { isValid: boolean; message: string } => {
    if (!value) return { isValid: true, message: "" }; // Empty is valid (optional)
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return {
      isValid,
      message: isValid ? "" : "Please enter a valid email address"
    };
  };

  // Handle phone change from the country code input
  const handlePhoneChange = (fullInternational: string, localDisplay: string, countryCode: string) => {
    onUpdate(index, "phone", fullInternational);
    onUpdate(index, "phoneCountryCode", countryCode);
    onUpdate(index, "phoneLocal", localDisplay);
  };

  const phoneValidation = validatePhone(contact.phone || "");
  const emailValidation = validateEmail(contact.email || "");

  // Check if at least one contact method is filled
  const hasContactMethod = !!(contact.phone || contact.email);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4" data-testid={`contact-input-${index}`}>
      {/* Header with badges and remove button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Contact {index + 1}
          </span>
          {contact.isPrimary && (
            <Badge variant="default" className="text-xs" data-testid={`badge-primary-${index}`}>
              Primary
            </Badge>
          )}
          {showVerification && contact.isVerified && (
            <Badge variant="default" className="bg-green-600 text-xs" data-testid={`badge-verified-${index}`}>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {showVerification && !contact.isVerified && hasContactMethod && (
            <Badge variant="secondary" className="text-xs" data-testid={`badge-unverified-${index}`}>
              <AlertCircle className="w-3 h-3 mr-1" />
              Unverified
            </Badge>
          )}
        </div>
        {canRemove && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(index)}
            data-testid={`button-remove-contact-${index}`}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Phone and Email side by side - NO TABS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone Number with Country Code */}
        <PhoneInputWithCountry
          id={`contact-phone-${index}`}
          value={contact.phone || ""}
          onChange={handlePhoneChange}
          label="Phone Number"
          error={!phoneValidation.isValid && contact.phone ? phoneValidation.message : undefined}
        />

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor={`contact-email-${index}`} className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
            Email Address
          </Label>
          <Input
            id={`contact-email-${index}`}
            type="email"
            placeholder="contact@example.com"
            value={contact.email || ""}
            onChange={(e) => onUpdate(index, "email", e.target.value)}
            className={cn(
              !emailValidation.isValid && contact.email ? "border-red-500 focus-visible:ring-red-500" : ""
            )}
            data-testid={`input-contact-email-${index}`}
          />
          {!emailValidation.isValid && contact.email && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {emailValidation.message}
            </p>
          )}
        </div>
      </div>

      {/* Hint about filling at least one */}
      {!hasContactMethod && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Please fill in at least a phone number or email address
        </p>
      )}

      {/* Optional Fields Toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowOptionalFields(!showOptionalFields)}
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          {showOptionalFields ? "Hide" : "Add"} optional details
          <span className="text-xs text-muted-foreground">(name, role)</span>
        </button>
      </div>

      {/* Optional Fields */}
      {showOptionalFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
          <div className="space-y-2">
            <Label htmlFor={`contact-name-${index}`} className="text-sm flex items-center gap-1">
              <User className="w-3 h-3" />
              Contact Name
            </Label>
            <Input
              id={`contact-name-${index}`}
              placeholder="e.g., Mr. Müller"
              value={contact.name || ""}
              onChange={(e) => onUpdate(index, "name", e.target.value)}
              className="h-9"
              data-testid={`input-contact-name-${index}`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`contact-role-${index}`} className="text-sm flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              Role/Purpose
            </Label>
            <Input
              id={`contact-role-${index}`}
              placeholder="e.g., For quotes"
              value={contact.role || ""}
              onChange={(e) => onUpdate(index, "role", e.target.value)}
              className="h-9"
              data-testid={`input-contact-role-${index}`}
            />
          </div>
        </div>
      )}

      {/* Verification Section */}
      {showVerification && verificationEnabled && !contact.isVerified && hasContactMethod && (
        <div className="pt-3 border-t space-y-3">
          {!showVerificationInput ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendVerificationCode}
              disabled={sendingCode || (!phoneValidation.isValid && !emailValidation.isValid)}
              data-testid={`button-send-verification-${index}`}
            >
              {sendingCode ? "Sending..." : "Send Verification Code"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                data-testid={`input-verification-code-${index}`}
              />
              <Button
                type="button"
                onClick={handleVerifyContact}
                disabled={verifying || !verificationCode}
                data-testid={`button-verify-${index}`}
              >
                {verifying ? "Verifying..." : "Verify"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
