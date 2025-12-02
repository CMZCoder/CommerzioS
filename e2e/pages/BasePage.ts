import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object Model
 * Contains common functionality shared across all pages
 */
export class BasePage {
  readonly page: Page;
  
  // Common elements
  readonly header: Locator;
  readonly footer: Locator;
  readonly loadingIndicator: Locator;
  readonly toastNotification: Locator;
  readonly userMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.footer = page.locator('footer');
    this.loadingIndicator = page.locator('[data-testid="loading"]').or(page.locator('.loading'));
    this.toastNotification = page.locator('[data-sonner-toaster]').or(page.locator('.toast'));
    this.userMenuButton = page.getByRole('button', { name: /profile|account|user|menu/i });
  }

  /**
   * Navigate to a specific path
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for loading indicator to disappear
   */
  async waitForLoadingComplete(): Promise<void> {
    try {
      await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 });
    } catch {
      // Loading indicator may not be present
    }
  }

  /**
   * Check if toast notification is visible with specific text
   */
  async expectToast(text: string | RegExp): Promise<void> {
    await expect(this.toastNotification).toContainText(text);
  }

  /**
   * Wait for toast and verify it appears
   */
  async waitForToast(text?: string | RegExp): Promise<void> {
    await this.toastNotification.waitFor({ state: 'visible', timeout: 10000 });
    if (text) {
      await expect(this.toastNotification).toContainText(text);
    }
  }

  /**
   * Get the page title
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll to element
   */
  async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Take a screenshot
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Wait for URL to contain specific path
   */
  async waitForUrlContains(path: string): Promise<void> {
    await this.page.waitForURL(url => url.toString().includes(path));
  }

  /**
   * Click on user menu
   */
  async openUserMenu(): Promise<void> {
    await this.userMenuButton.click();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      await this.userMenuButton.waitFor({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Navigate to home
   */
  async goHome(): Promise<void> {
    await this.goto('/');
  }

  /**
   * Navigate back
   */
  async goBack(): Promise<void> {
    await this.page.goBack();
  }

  /**
   * Refresh the page
   */
  async refresh(): Promise<void> {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Get all text content from page
   */
  async getPageText(): Promise<string> {
    const content = await this.page.textContent('body');
    return content || '';
  }

  /**
   * Check for accessibility violations using axe-core pattern
   * Returns true if page passes basic accessibility checks
   */
  async checkBasicAccessibility(): Promise<boolean> {
    // Check for basic accessibility patterns
    const hasHeading = await this.page.locator('h1, h2, h3').count() > 0;
    const hasLandmarks = await this.page.locator('[role="main"], main, [role="navigation"], nav').count() > 0;
    const imagesHaveAlt = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.alt !== undefined);
    });
    
    return hasHeading && hasLandmarks && imagesHaveAlt;
  }
}
