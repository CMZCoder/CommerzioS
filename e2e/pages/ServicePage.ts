import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Service Page Object Model
 * Handles service detail view and service management
 */
export class ServicePage extends BasePage {
  // Service detail elements
  readonly serviceTitle: Locator;
  readonly serviceDescription: Locator;
  readonly servicePrice: Locator;
  readonly serviceCategory: Locator;
  readonly serviceImages: Locator;
  readonly serviceLocation: Locator;
  readonly serviceRating: Locator;
  readonly bookButton: Locator;
  readonly favoriteButton: Locator;
  readonly shareButton: Locator;
  readonly messageVendorButton: Locator;
  readonly vendorProfile: Locator;
  readonly reviewsSection: Locator;
  readonly getDirectionsButton: Locator;
  
  // Service list elements
  readonly serviceCards: Locator;
  readonly categoryFilter: Locator;
  readonly priceFilter: Locator;
  readonly locationFilter: Locator;
  readonly sortDropdown: Locator;
  readonly searchInput: Locator;
  readonly pagination: Locator;
  readonly mapToggle: Locator;

  constructor(page: Page) {
    super(page);
    // Detail page elements
    this.serviceTitle = page.locator('h1').or(page.locator('[data-testid="service-title"]'));
    this.serviceDescription = page.locator('[data-testid="service-description"]').or(page.locator('.service-description'));
    this.servicePrice = page.locator('[data-testid="service-price"]').or(page.locator('.service-price'));
    this.serviceCategory = page.locator('[data-testid="service-category"]').or(page.locator('.service-category'));
    this.serviceImages = page.locator('[data-testid="service-images"]').or(page.locator('.service-images img'));
    this.serviceLocation = page.locator('[data-testid="service-location"]').or(page.locator('.service-location'));
    this.serviceRating = page.locator('[data-testid="service-rating"]').or(page.locator('.service-rating'));
    this.bookButton = page.getByRole('button', { name: /book|request/i });
    this.favoriteButton = page.getByRole('button', { name: /favorite|save|heart/i }).or(page.locator('[data-testid="favorite-button"]'));
    this.shareButton = page.getByRole('button', { name: /share/i });
    this.messageVendorButton = page.getByRole('button', { name: /message|contact.*vendor/i });
    this.vendorProfile = page.locator('[data-testid="vendor-profile"]').or(page.locator('.vendor-profile'));
    this.reviewsSection = page.locator('[data-testid="reviews-section"]').or(page.locator('.reviews-section'));
    this.getDirectionsButton = page.getByRole('button', { name: /directions|get.*directions/i }).or(page.getByRole('link', { name: /directions/i }));
    
    // List elements
    this.serviceCards = page.locator('[data-testid="service-card"]').or(page.locator('.service-card'));
    this.categoryFilter = page.locator('[data-testid="category-filter"]').or(page.getByLabel(/category/i));
    this.priceFilter = page.locator('[data-testid="price-filter"]').or(page.getByLabel(/price/i));
    this.locationFilter = page.locator('[data-testid="location-filter"]').or(page.getByPlaceholder(/location/i));
    this.sortDropdown = page.locator('[data-testid="sort-dropdown"]').or(page.getByLabel(/sort/i));
    this.searchInput = page.getByPlaceholder(/search/i).or(page.locator('[data-testid="search-input"]'));
    this.pagination = page.locator('[data-testid="pagination"]').or(page.locator('.pagination'));
    this.mapToggle = page.locator('[data-testid="map-toggle"]').or(page.getByRole('button', { name: /map/i }));
  }

  /**
   * Navigate to service detail page
   */
  async navigateToService(serviceId: number): Promise<void> {
    await this.goto(`/services/${serviceId}`);
  }

  /**
   * Navigate to services list
   */
  async navigateToList(): Promise<void> {
    await this.goto('/');
  }

  /**
   * Get service title text
   */
  async getServiceTitle(): Promise<string> {
    const content = await this.serviceTitle.textContent();
    return content || '';
  }

  /**
   * Click book button
   */
  async clickBook(): Promise<void> {
    await this.bookButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Add to favorites
   */
  async addToFavorites(): Promise<void> {
    await this.favoriteButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Click share button
   */
  async clickShare(): Promise<void> {
    await this.shareButton.click();
  }

  /**
   * Message vendor
   */
  async messageVendor(): Promise<void> {
    await this.messageVendorButton.click();
    await this.waitForPageLoad();
  }

  /**
   * Click vendor profile
   */
  async clickVendorProfile(): Promise<void> {
    await this.vendorProfile.click();
    await this.waitForPageLoad();
  }

  /**
   * Get directions
   */
  async getDirections(): Promise<void> {
    await this.getDirectionsButton.click();
  }

  /**
   * Search for services
   */
  async searchServices(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string): Promise<void> {
    await this.categoryFilter.click();
    await this.page.getByRole('option', { name: new RegExp(category, 'i') }).click();
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by price range
   */
  async filterByPriceRange(min: number, max: number): Promise<void> {
    await this.priceFilter.click();
    // Fill price range inputs if available
    const minInput = this.page.getByLabel(/min/i).or(this.page.locator('input[name="minPrice"]'));
    const maxInput = this.page.getByLabel(/max/i).or(this.page.locator('input[name="maxPrice"]'));
    
    if (await minInput.isVisible()) {
      await minInput.fill(min.toString());
    }
    if (await maxInput.isVisible()) {
      await maxInput.fill(max.toString());
    }
    
    // Apply filter
    const applyButton = this.page.getByRole('button', { name: /apply/i });
    if (await applyButton.isVisible()) {
      await applyButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Filter by location
   */
  async filterByLocation(location: string): Promise<void> {
    await this.locationFilter.fill(location);
    await this.page.waitForTimeout(500); // Wait for autocomplete
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingComplete();
  }

  /**
   * Sort services
   */
  async sortBy(sortOption: 'newest' | 'price-low' | 'price-high' | 'rating' | 'distance'): Promise<void> {
    await this.sortDropdown.click();
    
    const optionMap: Record<string, RegExp> = {
      'newest': /newest|recent/i,
      'price-low': /price.*low|low.*high/i,
      'price-high': /price.*high|high.*low/i,
      'rating': /rating|review/i,
      'distance': /distance|nearby/i,
    };
    
    await this.page.getByRole('option', { name: optionMap[sortOption] }).click();
    await this.waitForLoadingComplete();
  }

  /**
   * Toggle map view
   */
  async toggleMapView(): Promise<void> {
    await this.mapToggle.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Get service cards count
   */
  async getServiceCount(): Promise<number> {
    return this.serviceCards.count();
  }

  /**
   * Click on service card
   */
  async clickServiceCard(index: number = 0): Promise<void> {
    await this.serviceCards.nth(index).click();
    await this.waitForPageLoad();
  }

  /**
   * Go to next page
   */
  async goToNextPage(): Promise<void> {
    const nextButton = this.pagination.getByRole('button', { name: /next/i });
    await nextButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Go to specific page
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageButton = this.pagination.getByRole('button', { name: pageNumber.toString() });
    await pageButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Verify service detail page loaded
   */
  async verifyServiceDetailLoaded(): Promise<void> {
    await expect(this.serviceTitle).toBeVisible();
    await expect(this.bookButton).toBeVisible();
  }

  /**
   * Check if service is in favorites
   */
  async isFavorite(): Promise<boolean> {
    const ariaPressed = await this.favoriteButton.getAttribute('aria-pressed');
    const hasActiveClass = await this.favoriteButton.evaluate(el => 
      el.classList.contains('active') || el.classList.contains('favorited')
    );
    return ariaPressed === 'true' || hasActiveClass;
  }

  /**
   * Get service images count
   */
  async getImagesCount(): Promise<number> {
    return this.serviceImages.count();
  }

  /**
   * Get reviews count
   */
  async getReviewsCount(): Promise<number> {
    const reviewsCount = this.page.locator('[data-testid="reviews-count"]');
    const text = await reviewsCount.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Get average rating
   */
  async getAverageRating(): Promise<number> {
    const ratingText = await this.serviceRating.textContent();
    return parseFloat(ratingText || '0');
  }
}
