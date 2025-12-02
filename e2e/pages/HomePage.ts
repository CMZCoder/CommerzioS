import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object Model
 */
export class HomePage extends BasePage {
  // Page elements
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly categoryCards: Locator;
  readonly featuredServices: Locator;
  readonly locationFilter: Locator;
  readonly heroSection: Locator;
  readonly ctaButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/search|find/i).or(page.locator('[data-testid="search-input"]'));
    this.searchButton = page.getByRole('button', { name: /search/i });
    this.categoryCards = page.locator('[data-testid="category-card"]').or(page.locator('.category-card'));
    this.featuredServices = page.locator('[data-testid="featured-service"]').or(page.locator('.service-card'));
    this.locationFilter = page.getByPlaceholder(/location/i).or(page.locator('[data-testid="location-filter"]'));
    this.heroSection = page.locator('[data-testid="hero"]').or(page.locator('.hero'));
    this.ctaButton = page.getByRole('link', { name: /get started|browse services/i });
  }

  /**
   * Navigate to home page
   */
  async navigate(): Promise<void> {
    await this.goto('/');
  }

  /**
   * Search for services
   */
  async searchServices(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Click on a category
   */
  async clickCategory(categoryName: string): Promise<void> {
    const category = this.page.getByRole('link', { name: new RegExp(categoryName, 'i') })
      .or(this.categoryCards.filter({ hasText: categoryName }));
    await category.first().click();
    await this.waitForPageLoad();
  }

  /**
   * Set location filter
   */
  async setLocation(location: string): Promise<void> {
    await this.locationFilter.fill(location);
    // Wait for autocomplete suggestions
    await this.page.waitForTimeout(500);
    // Select first suggestion
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
  }

  /**
   * Click on featured service
   */
  async clickFeaturedService(index: number = 0): Promise<void> {
    await this.featuredServices.nth(index).click();
    await this.waitForPageLoad();
  }

  /**
   * Get count of featured services
   */
  async getFeaturedServicesCount(): Promise<number> {
    return this.featuredServices.count();
  }

  /**
   * Get count of categories
   */
  async getCategoryCount(): Promise<number> {
    return this.categoryCards.count();
  }

  /**
   * Click on CTA button
   */
  async clickCTA(): Promise<void> {
    await this.ctaButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Verify home page loaded correctly
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL('/');
    // Check for essential home page elements
    await expect(this.searchInput.or(this.categoryCards.first())).toBeVisible();
  }
}
