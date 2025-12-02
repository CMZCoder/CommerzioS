import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Register Page Object Model
 */
export class RegisterPage extends BasePage {
  // Page elements
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly phoneInput: Locator;
  readonly termsCheckbox: Locator;
  readonly registerButton: Locator;
  readonly loginLink: Locator;
  readonly googleSignupButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly vendorToggle: Locator;
  readonly businessNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByLabel(/first.*name/i).or(page.locator('input[name="firstName"]'));
    this.lastNameInput = page.getByLabel(/last.*name/i).or(page.locator('input[name="lastName"]'));
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/^password$/i).or(page.locator('input[name="password"]'));
    this.confirmPasswordInput = page.getByLabel(/confirm.*password/i).or(page.locator('input[name="confirmPassword"]'));
    this.phoneInput = page.getByLabel(/phone/i).or(page.locator('input[type="tel"]'));
    this.termsCheckbox = page.getByLabel(/terms|agree/i).or(page.locator('input[name="terms"]'));
    this.registerButton = page.getByRole('button', { name: /sign up|register|create.*account/i });
    this.loginLink = page.getByRole('link', { name: /log in|sign in|already.*account/i });
    this.googleSignupButton = page.getByRole('button', { name: /google/i }).or(page.locator('[data-testid="google-signup"]'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error-message')).or(page.getByRole('alert'));
    this.successMessage = page.locator('[data-testid="success-message"]').or(page.locator('.success-message'));
    this.vendorToggle = page.getByLabel(/vendor|service.*provider/i).or(page.locator('[data-testid="vendor-toggle"]'));
    this.businessNameInput = page.getByLabel(/business.*name/i).or(page.locator('input[name="businessName"]'));
  }

  /**
   * Navigate to register page
   */
  async navigate(): Promise<void> {
    await this.goto('/register');
  }

  /**
   * Fill registration form for customer
   */
  async fillCustomerForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    
    // Fill confirm password if visible
    if (await this.confirmPasswordInput.isVisible()) {
      await this.confirmPasswordInput.fill(data.password);
    }
    
    if (data.phone) {
      await this.phoneInput.fill(data.phone);
    }
  }

  /**
   * Fill registration form for vendor
   */
  async fillVendorForm(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    businessName: string;
  }): Promise<void> {
    // Toggle vendor mode if available
    if (await this.vendorToggle.isVisible()) {
      await this.vendorToggle.click();
    }
    
    await this.fillCustomerForm(data);
    
    if (await this.businessNameInput.isVisible()) {
      await this.businessNameInput.fill(data.businessName);
    }
  }

  /**
   * Accept terms and conditions
   */
  async acceptTerms(): Promise<void> {
    if (await this.termsCheckbox.isVisible()) {
      await this.termsCheckbox.check();
    }
  }

  /**
   * Submit registration form
   */
  async submitRegistration(): Promise<void> {
    await this.registerButton.click();
  }

  /**
   * Complete customer registration
   */
  async registerCustomer(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<void> {
    await this.fillCustomerForm(data);
    await this.acceptTerms();
    await this.submitRegistration();
    await this.waitForLoadingComplete();
  }

  /**
   * Complete vendor registration
   */
  async registerVendor(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    businessName: string;
  }): Promise<void> {
    await this.fillVendorForm(data);
    await this.acceptTerms();
    await this.submitRegistration();
    await this.waitForLoadingComplete();
  }

  /**
   * Check if registration was successful
   */
  async isRegistrationSuccessful(): Promise<boolean> {
    // Check for success message or redirect away from register page
    const hasSuccessMessage = await this.isVisible(this.successMessage);
    const redirected = !this.page.url().includes('/register');
    return hasSuccessMessage || redirected;
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    const content = await this.errorMessage.textContent();
    return content || '';
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  /**
   * Click login link
   */
  async clickLogin(): Promise<void> {
    await this.loginLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Click Google signup button
   */
  async clickGoogleSignup(): Promise<void> {
    await this.googleSignupButton.click();
  }

  /**
   * Verify register page loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/register/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * Get validation error for specific field
   */
  async getFieldError(fieldName: string): Promise<string> {
    const fieldError = this.page.locator(`[data-testid="${fieldName}-error"]`)
      .or(this.page.locator(`input[name="${fieldName}"] ~ .error`));
    
    if (await fieldError.isVisible()) {
      const content = await fieldError.textContent();
      return content || '';
    }
    return '';
  }
}
