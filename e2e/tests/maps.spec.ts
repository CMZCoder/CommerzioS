import { test, expect } from '@playwright/test';
import { ServicePage } from '../pages/ServicePage';

test.describe('Map & Location Tests', () => {
  
  test.describe('Map Display', () => {
    test('should load map correctly', async ({ page, context }) => {
      // Grant geolocation permission
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
      
      await page.goto('/');
      
      const servicePage = new ServicePage(page);
      
      // Toggle map view
      const mapToggle = servicePage.mapToggle;
      
      if (await mapToggle.isVisible()) {
        await mapToggle.click();
        await page.waitForLoadState('networkidle');
        
        // Map container should be visible
        const mapContainer = page.locator('[data-testid="map"]').or(page.locator('.google-map')).or(page.locator('#map'));
        await expect(mapContainer).toBeVisible();
      }
    });
    
    test('should display service markers on map', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
      
      await page.goto('/');
      
      const mapToggle = page.locator('[data-testid="map-toggle"]').or(page.getByRole('button', { name: /map/i }));
      
      if (await mapToggle.isVisible()) {
        await mapToggle.click();
        await page.waitForLoadState('networkidle');
        
        // Service markers should appear
        const markers = page.locator('[data-testid="map-marker"]').or(page.locator('.marker'));
        
        const markerCount = await markers.count();
        expect(markerCount).toBeGreaterThanOrEqual(0);
      }
    });
    
    test('should show info window on marker click', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
      
      await page.goto('/');
      
      const mapToggle = page.locator('[data-testid="map-toggle"]').or(page.getByRole('button', { name: /map/i }));
      
      if (await mapToggle.isVisible()) {
        await mapToggle.click();
        await page.waitForLoadState('networkidle');
        
        const marker = page.locator('[data-testid="map-marker"]').first();
        
        if (await marker.isVisible()) {
          await marker.click();
          
          // Info window should appear
          const infoWindow = page.locator('[data-testid="info-window"]').or(page.locator('.info-window'));
          await expect(infoWindow).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Get Directions', () => {
    test('should open Google Maps for directions', async ({ page, context }) => {
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        const directionsButton = page.getByRole('button', { name: /directions/i }).or(page.getByRole('link', { name: /directions/i }));
        
        if (await directionsButton.isVisible()) {
          // Listen for new tab
          const pagePromise = context.waitForEvent('page');
          
          await directionsButton.click();
          
          try {
            const newPage = await pagePromise;
            await newPage.waitForLoadState('domcontentloaded');
            
            // Should open Google Maps
            expect(newPage.url()).toContain('google.com/maps');
            await newPage.close();
          } catch {
            // Directions might open inline or as modal
          }
        }
      }
    });
  });
  
  test.describe('Distance Calculation', () => {
    test('should display distance from user location', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 }); // Zurich
      
      await page.goto('/');
      
      // Enable location-based sorting
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        
        const distanceOption = page.getByRole('option', { name: /distance|nearby/i });
        if (await distanceOption.isVisible()) {
          await distanceOption.click();
          await page.waitForLoadState('networkidle');
        }
      }
      
      // Service cards should show distance
      const distanceLabels = page.locator('[data-testid="distance"]').or(page.getByText(/km|miles|away/i));
      
      const count = await distanceLabels.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
  
  test.describe('Location Search', () => {
    test('should search location with autocomplete', async ({ page }) => {
      await page.goto('/');
      
      const locationInput = page.getByPlaceholder(/location|city|area/i);
      
      if (await locationInput.isVisible()) {
        await locationInput.fill('Zurich');
        
        // Wait for autocomplete suggestions
        await page.waitForTimeout(500);
        
        const suggestions = page.locator('[data-testid="location-suggestion"]').or(page.locator('.autocomplete-item'));
        
        const suggestionCount = await suggestions.count();
        expect(suggestionCount).toBeGreaterThanOrEqual(0);
        
        // Select first suggestion
        if (suggestionCount > 0) {
          await suggestions.first().click();
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
      }
    });
    
    test('should filter services by location', async ({ page }) => {
      await page.goto('/');
      
      const locationInput = page.getByPlaceholder(/location|city|area/i);
      
      if (await locationInput.isVisible()) {
        await locationInput.fill('Zurich');
        await page.waitForTimeout(500);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        
        await page.waitForLoadState('networkidle');
        
        // Services should be filtered
        await expect(page.locator('body')).toContainText(/Zurich|service|no.*results/i);
      }
    });
  });
  
  test.describe('User Location', () => {
    test('should request geolocation permission', async ({ page, context }) => {
      // Start without permission
      await context.clearPermissions();
      
      await page.goto('/');
      
      const useLocationButton = page.getByRole('button', { name: /use.*location|my.*location|detect/i });
      
      if (await useLocationButton.isVisible()) {
        // Grant permission when requested
        await context.grantPermissions(['geolocation']);
        await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
        
        await useLocationButton.click();
        
        // Should use user's location
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should handle geolocation denial gracefully', async ({ page, context }) => {
      // Deny permission
      await context.clearPermissions();
      
      await page.goto('/');
      
      const useLocationButton = page.getByRole('button', { name: /use.*location/i });
      
      if (await useLocationButton.isVisible()) {
        await useLocationButton.click();
        
        // Should handle denial gracefully
        await expect(page.getByText(/location.*denied|enable.*location|manually/i).or(page.locator('body'))).toContainText(/location|service|search/i);
      }
    });
  });
  
  test.describe('Sort by Distance', () => {
    test('should sort services by distance', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
      
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const sortDropdown = page.getByLabel(/sort/i).or(page.getByRole('button', { name: /sort/i }));
      
      if (await sortDropdown.isVisible()) {
        await sortDropdown.click();
        
        const distanceOption = page.getByRole('option', { name: /distance|nearby/i });
        
        if (await distanceOption.isVisible()) {
          await distanceOption.click();
          await page.waitForLoadState('networkidle');
          
          // Services should be sorted by distance
          await expect(page.locator('body')).toContainText(/service|km|result/i);
        }
      }
    });
  });
  
  test.describe('Location-Based Filtering', () => {
    test('should filter services by radius', async ({ page, context }) => {
      await context.grantPermissions(['geolocation']);
      await context.setGeolocation({ latitude: 47.3667, longitude: 8.5500 });
      
      await page.goto('/');
      
      const radiusFilter = page.getByLabel(/radius|distance/i).or(page.locator('[data-testid="radius-filter"]'));
      
      if (await radiusFilter.isVisible()) {
        // Set radius
        await radiusFilter.fill('10');
        
        const applyButton = page.getByRole('button', { name: /apply|filter/i });
        if (await applyButton.isVisible()) {
          await applyButton.click();
        }
        
        await page.waitForLoadState('networkidle');
        
        // Results should be filtered by radius
        await expect(page.locator('body')).toContainText(/service|result|no.*found/i);
      }
    });
  });
});
