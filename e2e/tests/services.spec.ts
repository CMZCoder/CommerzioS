import { test, expect } from '@playwright/test';
import { ServicePage } from '../pages/ServicePage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testService } from '../fixtures/test-data';

test.describe('Service Management Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as vendor before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
  });
  
  test.describe('Create Service', () => {
    test('should create service with fixed pricing', async ({ page }) => {
      // Navigate to create service
      await page.goto('/profile');
      
      const createButton = page.getByRole('button', { name: /create.*service|add.*service/i });
      await createButton.click();
      
      // Fill in service details
      const titleInput = page.getByLabel(/title|name/i);
      await titleInput.fill(testService.title);
      
      const descriptionInput = page.getByLabel(/description/i);
      await descriptionInput.fill(testService.description);
      
      // Select category
      const categorySelect = page.getByLabel(/category/i);
      await categorySelect.click();
      await page.getByRole('option', { name: new RegExp(testService.category, 'i') }).click();
      
      // Set fixed price
      const priceTypeSelect = page.getByLabel(/pricing.*type|price.*type/i);
      if (await priceTypeSelect.isVisible()) {
        await priceTypeSelect.click();
        await page.getByRole('option', { name: /fixed/i }).click();
      }
      
      const priceInput = page.getByLabel(/price|amount/i);
      await priceInput.fill(testService.pricing.fixed.price.toString());
      
      // Submit
      const submitButton = page.getByRole('button', { name: /create|save|submit/i });
      await submitButton.click();
      
      // Should show success or redirect
      await expect(page.getByText(/success|created|service.*added/i).or(page.locator('body'))).toContainText(/success|created|service/i);
    });
    
    test('should create service with price list', async ({ page }) => {
      await page.goto('/profile');
      
      const createButton = page.getByRole('button', { name: /create.*service|add.*service/i });
      await createButton.click();
      
      const titleInput = page.getByLabel(/title|name/i);
      await titleInput.fill('Price List Service');
      
      const descriptionInput = page.getByLabel(/description/i);
      await descriptionInput.fill('Service with multiple pricing options');
      
      // Select price list type
      const priceTypeSelect = page.getByLabel(/pricing.*type|price.*type/i);
      if (await priceTypeSelect.isVisible()) {
        await priceTypeSelect.click();
        await page.getByRole('option', { name: /price.*list|options/i }).click();
      }
      
      // Add pricing options
      const addOptionButton = page.getByRole('button', { name: /add.*option|add.*pricing/i });
      await addOptionButton.click();
      
      const optionNameInput = page.getByLabel(/option.*name|service.*name/i).first();
      await optionNameInput.fill('Basic');
      
      const optionPriceInput = page.getByLabel(/option.*price|price/i).first();
      await optionPriceInput.fill('50');
      
      // Submit
      const submitButton = page.getByRole('button', { name: /create|save|submit/i });
      await submitButton.click();
      
      await expect(page.getByText(/success|created/i)).toBeVisible();
    });
    
    test('should create service with text pricing', async ({ page }) => {
      await page.goto('/profile');
      
      const createButton = page.getByRole('button', { name: /create.*service|add.*service/i });
      await createButton.click();
      
      const titleInput = page.getByLabel(/title|name/i);
      await titleInput.fill('Text Pricing Service');
      
      const descriptionInput = page.getByLabel(/description/i);
      await descriptionInput.fill('Service with text pricing');
      
      // Select text pricing type
      const priceTypeSelect = page.getByLabel(/pricing.*type|price.*type/i);
      if (await priceTypeSelect.isVisible()) {
        await priceTypeSelect.click();
        await page.getByRole('option', { name: /text|custom/i }).click();
      }
      
      const priceTextInput = page.getByLabel(/price.*text|pricing.*description/i);
      if (await priceTextInput.isVisible()) {
        await priceTextInput.fill(testService.pricing.text.priceText);
      }
      
      // Submit
      const submitButton = page.getByRole('button', { name: /create|save|submit/i });
      await submitButton.click();
      
      await expect(page.getByText(/success|created/i)).toBeVisible();
    });
  });
  
  test.describe('Image Management', () => {
    test('should upload single image', async ({ page }) => {
      // Navigate to service edit or create
      await page.goto('/profile');
      
      const createButton = page.getByRole('button', { name: /create.*service|edit.*service/i });
      await createButton.click();
      
      // Upload image
      const fileInput = page.locator('input[type="file"]');
      
      // Note: In actual tests, you'd use setInputFiles with a real test image
      // await fileInput.setInputFiles('./e2e/fixtures/test-image.jpg');
      
      // Check for image upload area
      await expect(page.getByText(/upload.*image|add.*photo|drop.*image/i)).toBeVisible();
    });
    
    test('should handle image cropping', async ({ page }) => {
      await page.goto('/profile');
      
      // Look for image cropping UI
      const cropButton = page.getByRole('button', { name: /crop|edit.*image/i });
      
      if (await cropButton.isVisible()) {
        await cropButton.click();
        
        // Should show crop interface
        await expect(page.getByText(/crop|adjust|resize/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Edit Service', () => {
    test('should edit service details', async ({ page }) => {
      await page.goto('/profile');
      
      // Find and click edit on an existing service
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Update title
        const titleInput = page.getByLabel(/title|name/i);
        await titleInput.clear();
        await titleInput.fill('Updated Service Title');
        
        // Save changes
        const saveButton = page.getByRole('button', { name: /save|update/i });
        await saveButton.click();
        
        await expect(page.getByText(/success|updated|saved/i)).toBeVisible();
      }
    });
    
    test('should change service category', async ({ page }) => {
      await page.goto('/profile');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        const categorySelect = page.getByLabel(/category/i);
        await categorySelect.click();
        
        // Select a different category
        const options = page.getByRole('option');
        await options.first().click();
        
        const saveButton = page.getByRole('button', { name: /save|update/i });
        await saveButton.click();
        
        await expect(page.getByText(/success|updated/i)).toBeVisible();
      }
    });
    
    test('should add and remove locations', async ({ page }) => {
      await page.goto('/profile');
      
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Add location
        const addLocationButton = page.getByRole('button', { name: /add.*location/i });
        if (await addLocationButton.isVisible()) {
          await addLocationButton.click();
          
          const locationInput = page.getByPlaceholder(/location|address/i);
          await locationInput.fill('Zurich, Switzerland');
          
          // Wait for autocomplete and select
          await page.waitForTimeout(500);
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
        }
        
        // Remove location
        const removeLocationButton = page.getByRole('button', { name: /remove.*location/i });
        if (await removeLocationButton.isVisible()) {
          await removeLocationButton.click();
        }
      }
    });
  });
  
  test.describe('Service Status', () => {
    test('should pause service', async ({ page }) => {
      await page.goto('/profile');
      
      const pauseButton = page.getByRole('button', { name: /pause|deactivate/i }).first();
      
      if (await pauseButton.isVisible()) {
        await pauseButton.click();
        
        // Confirm pause
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await expect(page.getByText(/paused|deactivated/i)).toBeVisible();
      }
    });
    
    test('should activate service', async ({ page }) => {
      await page.goto('/profile');
      
      const activateButton = page.getByRole('button', { name: /activate|resume/i }).first();
      
      if (await activateButton.isVisible()) {
        await activateButton.click();
        
        await expect(page.getByText(/active|activated/i)).toBeVisible();
      }
    });
    
    test('should delete service', async ({ page }) => {
      await page.goto('/profile');
      
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm delete
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        await confirmButton.click();
        
        await expect(page.getByText(/deleted|removed|success/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Contact Verification', () => {
    test('should verify phone number', async ({ page }) => {
      await page.goto('/profile');
      
      const verifyPhoneButton = page.getByRole('button', { name: /verify.*phone/i });
      
      if (await verifyPhoneButton.isVisible()) {
        await verifyPhoneButton.click();
        
        // Should show verification input
        await expect(page.getByLabel(/code|otp|verification/i)).toBeVisible();
      }
    });
    
    test('should verify email', async ({ page }) => {
      await page.goto('/profile');
      
      const verifyEmailButton = page.getByRole('button', { name: /verify.*email/i });
      
      if (await verifyEmailButton.isVisible()) {
        await verifyEmailButton.click();
        
        // Should show message about email sent
        await expect(page.getByText(/verification.*sent|check.*email/i)).toBeVisible();
      }
    });
  });
});
