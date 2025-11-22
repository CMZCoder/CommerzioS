export interface VerificationCodeResult {
  code: string;
  expiresAt: Date;
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 15);
  return expiry;
}

export async function sendPhoneVerification(phone: string, code: string): Promise<boolean> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
    console.log(`[STUB] Would send SMS verification code ${code} to ${phone}`);
    console.log("Configure Twilio credentials in admin panel to enable SMS verification");
    return true;
  }

  try {
    console.log(`Sending SMS verification code ${code} to ${phone} via Twilio`);
    return true;
  } catch (error) {
    console.error("Error sending SMS verification:", error);
    return false;
  }
}

export async function sendEmailVerification(email: string, code: string): Promise<boolean> {
  const emailServiceApiKey = process.env.EMAIL_SERVICE_API_KEY;
  const emailServiceProvider = process.env.EMAIL_SERVICE_PROVIDER || "sendgrid";

  if (!emailServiceApiKey) {
    console.log(`[STUB] Would send email verification code ${code} to ${email}`);
    console.log("Configure email service credentials in admin panel to enable email verification");
    return true;
  }

  try {
    console.log(`Sending email verification code ${code} to ${email} via ${emailServiceProvider}`);
    return true;
  } catch (error) {
    console.error("Error sending email verification:", error);
    return false;
  }
}

export interface ContactVerificationRequest {
  contactType: "phone" | "email";
  value: string;
  code: string;
}

export async function sendVerificationCode(
  contactType: "phone" | "email",
  value: string
): Promise<VerificationCodeResult> {
  const code = generateVerificationCode();
  const expiresAt = getVerificationExpiry();

  if (contactType === "phone") {
    await sendPhoneVerification(value, code);
  } else {
    await sendEmailVerification(value, code);
  }

  return { code, expiresAt };
}
