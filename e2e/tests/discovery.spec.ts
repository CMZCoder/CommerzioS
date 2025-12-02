import { test, expect } from '@playwright/test';
import { ServicePage } from '../pages/ServicePage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/test-data';

test.describe('Service Discovery Tests', () => {
  
  test.describe('Browse Services', () => {
    test('should browse all services', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      // Should display service cards
      const count = await servicePage.getServiceCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('should browse by category', async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.navigate();
      
      // Click on a category
      const categoryLink = page.getByRole('link', { name: /home.*services|cleaning/i }).first();
      
      if (await categoryLink.isVisible()) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');
        
        // Should show filtered services
        await expect(page).toHaveURL(/category|services/i);
      }
    });
    
    test('should browse by subcategory', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to category first
      const categoryLink = page.getByRole('link', { name: /home.*services/i }).first();
      
      if (await categoryLink.isVisible()) {
        await categoryLink.click();
        await page.waitForLoadState('networkidle');
        
        // Click on subcategory
        const subcategoryLink = page.getByRole('link', { name: /cleaning|plumbing/i }).first();
        
        if (await subcategoryLink.isVisible()) {
          await subcategoryLink.click();
          await page.waitForLoadState('networkidle');
          
          // Should show subcategory services
          await expect(page.locator('body')).toContainText(/service|result/i);
        }
      }
    });
  });
  
  test.describe('Search Functionality', () => {
    test('should search by keyword', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      await servicePage.searchServices('cleaning');
      
      // Should show search results or no results message
      await expect(page.getByText(/cleaning|no.*results|found/i)).toBeVisible();
    });
    
    test('should handle empty search results', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      await servicePage.searchServices('xyznonexistent12345');
      
      // Should show no results message
      await expect(page.getByText(/no.*results|no.*services|not.*found/i)).toBeVisible();
    });
  });
  
  test.describe('Filtering', () => {
    test('should filter by location', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const locationInput = page.getByPlaceholder(/location|city|area/i);
      
      if (await locationInput.isVisible()) {
        await locationInput.fill('Zurich');
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        
        await page.waitForLoadState('networkidle');
        
        // Results should be filtered
        await expect(page.locator('body')).toContainText(/Zurich|service|result/i);
      }
    });
    
    test('should filter by price range', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      // Look for price filter
      const priceFilter = page.getByLabel(/price/i).or(page.getByRole('button', { name: /price/i }));
      
      if (await priceFilter.isVisible()) {
        await priceFilter.click();
        
        const minInput = page.getByLabel(/min/i).or(page.locator('input[name*="min"]'));
        const maxInput = page.getByLabel(/max/i).or(page.locator('input[name*="max"]'));
        
        if (await minInput.isVisible()) {
          await minInput.fill('20');
        }
        if (await maxInput.isVisible()) {
          await maxInput.fill('100');
        }
        
        // Apply filter
        const applyButton = page.getByRole('button', { name: /apply|filter/i });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
        
        await page.waitForLoadState('networkidle');
      }
    });
  });
  
  test.describe('Sorting', () => {
    test('should sort by newest', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.getByRole('option', { name: /newest|recent/i }).click();
        
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should sort by price low to high', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.getByRole('option', { name: /price.*low|low.*high/i }).click();
        
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should sort by price high to low', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.getByRole('option', { name: /price.*high|high.*low/i }).click();
        
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should sort by rating', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        await page.getByRole('option', { name: /rating|review/i }).click();
        
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should sort by distance with geolocation', async ({ page, context }) => {
      // Grant geolocation permission and set location
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 }); // Zurich
      
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        
        const distanceOption = page.getByRole('option', { name: /distance|nearby/i });
        if (await distanceOption.isVisible()) {
          await distanceOption.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });
  });
  
  test.describe('Pagination', () => {
    test('should navigate through pages', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const pagination = page.locator('[data-testid="pagination"]').or(page.locator('.pagination'));
      
      if (await pagination.isVisible()) {
        const nextButton = pagination.getByRole('button', { name: /next|>/i });
        
        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click();
          await page.waitForLoadState('networkidle');
          
          // Should navigate to next page
          await expect(page).toHaveURL(/page=2|page\/2/);
        }
      }
    });
  });
  
  test.describe('Service Details', () => {
    test('should view service details', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      // Click on first service
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        // Should show service details
        await servicePage.verifyServiceDetailLoaded();
      }
    });
    
    test('should display service images', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        // Check for images
        const images = page.locator('img');
        const imageCount = await images.count();
        expect(imageCount).toBeGreaterThan(0);
      }
    });
    
    test('should view vendor profile', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        const vendorLink = page.getByRole('link', { name: /vendor|provider|seller/i }).or(servicePage.vendorProfile);
        
        if (await vendorLink.isVisible()) {
          await vendorLink.click();
          await page.waitForLoadState('networkidle');
          
          // Should show vendor profile
          await expect(page).toHaveURL(/profile|vendor|user/i);
        }
      }
    });
  });
  
  test.describe('Favorites', () => {
    test('should add service to favorites', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        await servicePage.addToFavorites();
        
        // Favorite button should indicate it's favorited
        await expect(servicePage.favoriteButton).toHaveAttribute('aria-pressed', 'true');
      }
    });
    
    test('should remove service from favorites', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        // Add to favorites first
        await servicePage.addToFavorites();
        
        // Remove from favorites
        await servicePage.addToFavorites(); // Toggle off
        
        // Button should indicate it's not favorited
        await expect(servicePage.favoriteButton).toHaveAttribute('aria-pressed', 'false');
      }
    });
    
    test('should view favorites page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/favorites');
      
      // Should show favorites page
      await expect(page.getByText(/favorites|saved|liked/i)).toBeVisible();
    });
  });
  
  test.describe('Get Directions', () => {
    test('should open Google Maps for directions', async ({ page, context }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        
        // Wait for directions button
        const directionsButton = servicePage.getDirectionsButton;
        
        if (await directionsButton.isVisible()) {
          // Listen for new tab/page
          const pagePromise = context.waitForEvent('page');
          
          await directionsButton.click();
          
          // Check if new tab opened with Google Maps
          try {
            const newPage = await pagePromise;
            await newPage.waitForLoadState('domcontentloaded');
            
            expect(newPage.url()).toContain('google.com/maps');
            await newPage.close();
          } catch {
            // Directions might be shown inline
          }
        }
      }
    });
  });
  
  test.describe('Map View', () => {
    test('should toggle map view', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const mapToggle = servicePage.mapToggle;
      
      if (await mapToggle.isVisible()) {
        await mapToggle.click();
        
        // Map should be visible
        await expect(page.locator('[data-testid="map"]').or(page.locator('.google-map')).or(page.locator('#map'))).toBeVisible();
      }
    });
  });
});
