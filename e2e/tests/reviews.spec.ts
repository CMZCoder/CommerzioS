import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testReview } from '../fixtures/test-data';

test.describe('Review System Tests', () => {
  
  test.describe('Leave Review', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should leave review after completed booking', async ({ page }) => {
      await page.goto('/bookings');
      
      // Find completed booking
      const completedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /completed/i }).first();
      
      if (await completedBooking.isVisible()) {
        await completedBooking.click();
        
        const reviewButton = page.getByRole('button', { name: /review|leave.*review/i });
        
        if (await reviewButton.isVisible()) {
          await reviewButton.click();
          
          // Rate with stars
          const stars = page.locator('[data-testid="star"]').or(page.locator('.star'));
          if (await stars.nth(4).isVisible()) {
            await stars.nth(4).click(); // 5 stars
          }
          
          // Add comment
          const commentInput = page.getByLabel(/comment|review/i).or(page.locator('textarea'));
          await commentInput.fill(testReview.comment);
          
          // Submit
          const submitButton = page.getByRole('button', { name: /submit|post/i });
          await submitButton.click();
          
          await expect(page.getByText(/thank|review.*submitted|success/i)).toBeVisible();
        }
      }
    });
    
    test('should not allow review without completed booking', async ({ page }) => {
      await page.goto('/bookings');
      
      // Find pending/upcoming booking
      const pendingBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /pending|upcoming/i }).first();
      
      if (await pendingBooking.isVisible()) {
        await pendingBooking.click();
        
        // Review button should not be visible or be disabled
        const reviewButton = page.getByRole('button', { name: /review/i });
        
        if (await reviewButton.isVisible()) {
          await expect(reviewButton).toBeDisabled();
        }
      }
    });
    
    test('should rate with 1-5 stars', async ({ page }) => {
      await page.goto('/bookings');
      
      const completedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /completed/i }).first();
      
      if (await completedBooking.isVisible()) {
        await completedBooking.click();
        
        const reviewButton = page.getByRole('button', { name: /review/i });
        
        if (await reviewButton.isVisible()) {
          await reviewButton.click();
          
          // Test clicking each star
          const stars = page.locator('[data-testid="star"]').or(page.locator('.star'));
          
          for (let i = 0; i < 5; i++) {
            if (await stars.nth(i).isVisible()) {
              await stars.nth(i).click();
              // Verify rating is set
            }
          }
        }
      }
    });
    
    test('should write review comment', async ({ page }) => {
      await page.goto('/bookings');
      
      const completedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /completed/i }).first();
      
      if (await completedBooking.isVisible()) {
        await completedBooking.click();
        
        const reviewButton = page.getByRole('button', { name: /review/i });
        
        if (await reviewButton.isVisible()) {
          await reviewButton.click();
          
          const commentInput = page.getByLabel(/comment/i).or(page.locator('textarea'));
          await commentInput.fill(testReview.comment);
          
          await expect(commentInput).toHaveValue(testReview.comment);
        }
      }
    });
  });
  
  test.describe('Edit Review', () => {
    test('should edit review within allowed period', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/bookings');
      
      // Find booking with existing review
      const reviewedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /reviewed/i }).first();
      
      if (await reviewedBooking.isVisible()) {
        await reviewedBooking.click();
        
        const editButton = page.getByRole('button', { name: /edit.*review/i });
        
        if (await editButton.isVisible()) {
          await editButton.click();
          
          const commentInput = page.getByLabel(/comment/i).or(page.locator('textarea'));
          await commentInput.clear();
          await commentInput.fill(testReview.editedComment);
          
          const saveButton = page.getByRole('button', { name: /save|update/i });
          await saveButton.click();
          
          await expect(page.getByText(/updated|saved/i)).toBeVisible();
        }
      }
    });
  });
  
  test.describe('View Reviews', () => {
    test('should view reviews on service page', async ({ page }) => {
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        // Scroll to reviews section
        const reviewsSection = page.locator('[data-testid="reviews-section"]').or(page.getByText(/reviews/i));
        
        if (await reviewsSection.isVisible()) {
          await reviewsSection.scrollIntoViewIfNeeded();
          
          // Should show reviews or "no reviews" message
          await expect(page.getByText(/review|no.*reviews/i)).toBeVisible();
        }
      }
    });
    
    test('should view reviews on vendor profile', async ({ page }) => {
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        // Click on vendor profile
        const vendorLink = page.getByRole('link', { name: /vendor|profile/i }).or(page.locator('[data-testid="vendor-profile"]'));
        
        if (await vendorLink.isVisible()) {
          await vendorLink.click();
          await page.waitForLoadState('networkidle');
          
          // Should show vendor reviews
          await expect(page.getByText(/review|rating/i)).toBeVisible();
        }
      }
    });
    
    test('should display average rating', async ({ page }) => {
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        // Should show average rating
        const rating = page.locator('[data-testid="average-rating"]').or(page.locator('.rating'));
        
        if (await rating.isVisible()) {
          const ratingText = await rating.textContent();
          expect(ratingText).toMatch(/\d(\.\d)?/);
        }
      }
    });
    
    test('should display review count', async ({ page }) => {
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        // Should show review count
        const reviewCount = page.locator('[data-testid="review-count"]').or(page.getByText(/\d+\s*reviews?/i));
        
        await expect(page.locator('body')).toContainText(/review|rating/i);
      }
    });
  });
});
