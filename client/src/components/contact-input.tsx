import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2, AlertCircle, Phone, Mail, User, Briefcase } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface Contact {
  id?: string;
  contactType: "phone" | "email";
  value: string;
  name?: string;
  role?: string;
  isPrimary?: boolean;
  isVerified?: boolean;
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
        description: `A verification code has been sent to ${contact.value}`,
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

  const validateValue = (type: "phone" | "email", value: string): boolean | { isValid: boolean; message: string } => {
    if (!value) return false;
    if (type === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    // Swiss phone number validation: must start with +41 and have 9-13 digits after
    // Formats: +41 44 123 4567, +41441234567, +41 79 123 45 67
    const swissPhoneRegex = /^\+41\s?(\d{2}\s?\d{3}\s?\d{2}\s?\d{2}|\d{9,11})$/;
    const cleanedValue = value.replace(/\s/g, '');
    const isValid = swissPhoneRegex.test(cleanedValue);
    return {
      isValid,
      message: isValid ? "" : "Phone must be in format: +41 44 123 4567 or +41441234567"
    };
  };

  const validationResult = validateValue(contact.contactType, contact.value);
  const isValueValid = typeof validationResult === 'boolean' ? validationResult : validationResult.isValid;
  const validationMessage = typeof validationResult === 'object' ? validationResult.message : "";

  return (
    <div className="rounded-xl border bg-white p-4 space-y-4" data-testid={`contact-input-${index}`}>
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
          {showVerification && !contact.isVerified && (
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

      {/* Contact Type Selection - Visual Cards */}
      <div className="space-y-2">
        <Label className="text-sm">Contact Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdate(index, "contactType", "phone")}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
              contact.contactType === "phone"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            data-testid={`button-type-phone-${index}`}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              contact.contactType === "phone" ? "bg-primary/10" : "bg-muted"
            )}>
              <Phone className={cn(
                "w-5 h-5",
                contact.contactType === "phone" ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="font-medium text-sm">Phone</div>
              <div className="text-xs text-muted-foreground">Swiss number</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdate(index, "contactType", "email")}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
              contact.contactType === "email"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            data-testid={`button-type-email-${index}`}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              contact.contactType === "email" ? "bg-primary/10" : "bg-muted"
            )}>
              <Mail className={cn(
                "w-5 h-5",
                contact.contactType === "email" ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="font-medium text-sm">Email</div>
              <div className="text-xs text-muted-foreground">Email address</div>
            </div>
          </button>
        </div>
      </div>

      {/* Value Input - Changes based on type */}
      <div className="space-y-2">
        <Label htmlFor={`contact-value-${index}`}>
          {contact.contactType === "phone" ? "Phone Number" : "Email Address"} *
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {contact.contactType === "phone" ? (
              <Phone className="w-4 h-4" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
          </div>
          <Input
            id={`contact-value-${index}`}
            type={contact.contactType === "email" ? "email" : "tel"}
            placeholder={contact.contactType === "phone" ? "+41 44 123 4567" : "contact@example.com"}
            value={contact.value}
            onChange={(e) => onUpdate(index, "value", e.target.value)}
            className={cn(
              "pl-10",
              !isValueValid && contact.value ? "border-red-500 focus-visible:ring-red-500" : ""
            )}
            data-testid={`input-contact-value-${index}`}
          />
        </div>
        {!isValueValid && contact.value && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {validationMessage || `Please enter a valid ${contact.contactType === "phone" ? "phone number" : "email address"}`}
          </p>
        )}
        {contact.contactType === "phone" && !contact.value && (
          <p className="text-xs text-muted-foreground">
            Enter your Swiss phone number starting with +41
          </p>
        )}
      </div>

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
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
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
      {showVerification && verificationEnabled && !contact.isVerified && (
        <div className="pt-3 border-t space-y-3">
          {!showVerificationInput ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSendVerificationCode}
              disabled={sendingCode || !isValueValid}
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
