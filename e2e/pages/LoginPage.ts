import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Login Page Object Model
 */
export class LoginPage extends BasePage {
  // Page elements
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;
  readonly googleLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    this.loginButton = page.getByRole('button', { name: /log in|sign in/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });
    this.registerLink = page.getByRole('link', { name: /sign up|register|create.*account/i });
    this.googleLoginButton = page.getByRole('button', { name: /google/i }).or(page.locator('[data-testid="google-login"]'));
    this.errorMessage = page.locator('[data-testid="error-message"]').or(page.locator('.error-message')).or(page.getByRole('alert'));
    this.rememberMeCheckbox = page.getByLabel(/remember me/i).or(page.locator('input[name="rememberMe"]'));
  }

  /**
   * Navigate to login page
   */
  async navigate(): Promise<void> {
    await this.goto('/login');
  }

  /**
   * Fill login form
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submitLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Perform complete login
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.submitLogin();
    await this.page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  }

  /**
   * Attempt login (may fail)
   */
  async attemptLogin(email: string, password: string): Promise<void> {
    await this.fillLoginForm(email, password);
    await this.submitLogin();
    await this.waitForLoadingComplete();
  }

  /**
   * Check if login was successful
   */
  async isLoginSuccessful(): Promise<boolean> {
    const url = this.page.url();
    return !url.includes('/login');
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
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Click register link
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Click Google login button
   */
  async clickGoogleLogin(): Promise<void> {
    await this.googleLoginButton.click();
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.click();
  }

  /**
   * Verify login page loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Clear login form
   */
  async clearForm(): Promise<void> {
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }
}
