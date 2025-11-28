/**
 * Email Service
 * 
 * Handles sending verification emails, password reset emails, and other
 * transactional emails using SMTP (Nodemailer).
 * 
 * Configuration via environment variables:
 * - SMTP_HOST: SMTP server hostname
 * - SMTP_PORT: SMTP server port (465 for SSL, 587 for TLS)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password
 * - EMAIL_FROM: From address for emails
 * - APP_URL: Application URL for links in emails
 */

import nodemailer from "nodemailer";

// Email configuration from environment
const smtpConfig = {
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: parseInt(process.env.SMTP_PORT || "465", 10) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

const emailFrom = process.env.EMAIL_FROM || "noreply@example.com";
const appUrl = process.env.APP_URL || "http://localhost:5000";
const appName = "ServeMkt";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create the email transporter
 */
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn("Email service not configured. Set SMTP_* environment variables.");
      // Return a mock transporter that logs emails
      return {
        sendMail: async (options: nodemailer.SendMailOptions) => {
          console.log("📧 Email would be sent (SMTP not configured):");
          console.log(`  To: ${options.to}`);
          console.log(`  Subject: ${options.subject}`);
          console.log(`  Preview: ${options.text?.toString().substring(0, 100)}...`);
          return { messageId: "mock-" + Date.now() };
        },
      } as nodemailer.Transporter;
    }
    
    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

/**
 * Send an email (generic function for notification emails, etc.)
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${appName}" <${emailFrom}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });
    console.log(`📧 Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Generate email template wrapper
 */
function wrapEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; color: #6b7280; font-size: 12px; }
    .footer a { color: #6366f1; text-decoration: none; }
    .code { background: #f3f4f6; padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; margin: 20px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    p { margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${appName}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  
  const content = `
    <h2>Welcome to ${appName}!</h2>
    <p>Hi ${firstName},</p>
    <p>Thanks for signing up! Please verify your email address to get started.</p>
    <p style="text-align: center;">
      <a href="${verifyUrl}" class="button">Verify Email Address</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${verifyUrl}</p>
    <div class="warning">
      <strong>Note:</strong> This link will expire in 24 hours.
    </div>
    <p>If you didn't create an account with ${appName}, please ignore this email.</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `Verify your email for ${appName}`,
    html: wrapEmailTemplate(content),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your password. Click the button below to choose a new password:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
    <div class="warning">
      <strong>Important:</strong> This link will expire in 1 hour for security reasons.
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `Reset your ${appName} password`,
    html: wrapEmailTemplate(content),
  });
}

/**
 * Send welcome email after email verification
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const content = `
    <h2>Welcome to ${appName}! 🎉</h2>
    <p>Hi ${firstName},</p>
    <p>Your email has been verified and your account is now fully active!</p>
    <p>Here's what you can do next:</p>
    <ul>
      <li><strong>Browse Services:</strong> Discover talented professionals in your area</li>
      <li><strong>Post a Service:</strong> Offer your skills and start earning</li>
      <li><strong>Complete Your Profile:</strong> Add a photo and details to build trust</li>
    </ul>
    <p style="text-align: center;">
      <a href="${appUrl}" class="button">Get Started</a>
    </p>
    <p>If you have any questions, our support team is here to help!</p>
  `;
  
  return sendEmail({
    to: email,
    subject: `Welcome to ${appName}!`,
    html: wrapEmailTemplate(content),
  });
}

/**
 * Send password changed notification
 */
export async function sendPasswordChangedEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const content = `
    <h2>Password Changed</h2>
    <p>Hi ${firstName},</p>
    <p>This email confirms that your ${appName} password has been successfully changed.</p>
    <div class="warning">
      <strong>Wasn't you?</strong> If you didn't change your password, please <a href="${appUrl}/forgot-password">reset it immediately</a> and contact our support team.
    </div>
    <p>For your security, you may want to:</p>
    <ul>
      <li>Review your recent account activity</li>
      <li>Make sure your email account is secure</li>
      <li>Enable two-factor authentication if available</li>
    </ul>
  `;
  
  return sendEmail({
    to: email,
    subject: `Your ${appName} password was changed`,
    html: wrapEmailTemplate(content),
  });
}

/**
 * Verify SMTP connection on startup
 */
export async function verifyEmailConnection(): Promise<boolean> {
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.log("📧 Email service not configured (SMTP credentials missing)");
    return false;
  }
  
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("📧 Email service connected successfully");
    return true;
  } catch (error) {
    console.error("📧 Email service connection failed:", error);
    return false;
  }
}

