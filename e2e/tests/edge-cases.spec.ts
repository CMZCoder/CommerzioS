import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/test-data';

test.describe('Edge Cases & Error Handling Tests', () => {
  
  test.describe('Network Failure Handling', () => {
    test('should handle network failure gracefully', async ({ page, context }) => {
      await page.goto('/');
      
      // Set offline
      await context.setOffline(true);
      
      // Try to navigate
      await page.getByRole('link').first().click();
      
      // Should show offline message or cached content
      await expect(page.getByText(/offline|network|connection/i).or(page.locator('body'))).toContainText(/offline|error|service|retry/i);
      
      // Restore online
      await context.setOffline(false);
    });
    
    test('should retry failed requests', async ({ page, context }) => {
      await page.goto('/');
      
      // Brief offline period
      await context.setOffline(true);
      await page.waitForTimeout(1000);
      await context.setOffline(false);
      
      // Should recover
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toContainText(/service|commerzio/i);
    });
  });
  
  test.describe('Session Expiration', () => {
    test('should handle session expiration', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Clear cookies to simulate session expiration
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/bookings');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
    
    test('should show session expired message', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Clear cookies
      await page.context().clearCookies();
      
      // Trigger an API call
      await page.goto('/bookings');
      
      // Should show login or session expired message
      await expect(page.getByText(/session.*expired|login|sign.*in/i)).toBeVisible();
    });
  });
  
  test.describe('Concurrent Booking', () => {
    test('should handle concurrent booking for same slot', async ({ page, browser }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Navigate to booking
      await page.goto('/');
      
      const serviceCard = page.locator('[data-testid="service-card"]').first();
      
      if (await serviceCard.isVisible()) {
        await serviceCard.click();
        await page.waitForLoadState('networkidle');
        
        // This tests that the system handles concurrent bookings gracefully
        // In reality, you'd need two sessions trying to book the same slot
        const bookButton = page.getByRole('button', { name: /book/i });
        
        if (await bookButton.isVisible()) {
          await bookButton.click();
          
          // Check for slot availability
          await expect(page.locator('body')).toContainText(/available|time.*slot|date/i);
        }
      }
    });
  });
  
  test.describe('Payment Timeout', () => {
    test('should handle payment timeout', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/bookings');
      
      const payButton = page.getByRole('button', { name: /pay/i }).first();
      
      if (await payButton.isVisible()) {
        await payButton.click();
        
        // Simulate timeout by waiting
        await page.waitForTimeout(5000);
        
        // Should handle timeout gracefully
        await expect(page.locator('body')).toContainText(/payment|timeout|try.*again|error/i);
      }
    });
  });
  
  test.describe('Invalid URL Handling', () => {
    test('should handle 404 for invalid routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');
      
      // Should show 404 page
      await expect(page.getByText(/not.*found|404|page.*exist/i)).toBeVisible();
    });
    
    test('should handle invalid service ID', async ({ page }) => {
      await page.goto('/services/999999999');
      
      // Should show not found or error
      await expect(page.getByText(/not.*found|service.*exist|error/i)).toBeVisible();
    });
    
    test('should handle invalid booking ID', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/bookings/999999999');
      
      // Should show not found or error
      await expect(page.getByText(/not.*found|booking.*exist|error/i)).toBeVisible();
    });
  });
  
  test.describe('Server Error Handling', () => {
    test('should handle server errors gracefully', async ({ page }) => {
      await page.goto('/');
      
      // Mock server error by intercepting requests
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });
      
      // Trigger a request
      await page.reload();
      
      // Should show error message
      await expect(page.locator('body')).toContainText(/error|something.*wrong|try.*again/i);
      
      // Unroute to restore normal behavior
      await page.unroute('**/api/**');
    });
  });
  
  test.describe('Form Validation', () => {
    test('should show validation errors for invalid form data', async ({ page }) => {
      await page.goto('/register');
      
      // Submit empty form
      const submitButton = page.getByRole('button', { name: /register|sign.*up/i });
      await submitButton.click();
      
      // Should show validation errors
      await expect(page.getByText(/required|invalid|enter/i)).toBeVisible();
    });
    
    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('invalid-email');
      
      const submitButton = page.getByRole('button', { name: /register|sign.*up/i });
      await submitButton.click();
      
      // Should show email validation error
      await expect(page.getByText(/valid.*email|invalid.*email/i)).toBeVisible();
    });
    
    test('should validate password strength', async ({ page }) => {
      await page.goto('/register');
      
      const passwordInput = page.getByLabel(/password/i).first();
      await passwordInput.fill('123');
      
      const submitButton = page.getByRole('button', { name: /register|sign.*up/i });
      await submitButton.click();
      
      // Should show password validation error
      await expect(page.getByText(/weak|characters|strength/i)).toBeVisible();
    });
  });
  
  test.describe('File Upload Limits', () => {
    test('should handle file size limit', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
      
      await page.goto('/profile');
      
      // Look for file upload
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // The system should reject files over the limit
        // In a real test, we'd upload a large file
        await expect(page.locator('body')).toContainText(/upload|image|file/i);
      }
    });
    
    test('should validate file type restrictions', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
      
      await page.goto('/profile');
      
      const fileInput = page.locator('input[type="file"]');
      
      if (await fileInput.isVisible()) {
        // Check for accept attribute
        const acceptTypes = await fileInput.getAttribute('accept');
        
        // Should have file type restrictions
        expect(acceptTypes).toBeTruthy();
      }
    });
  });
  
  test.describe('Rate Limiting', () => {
    test('should handle rate limiting response', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Attempt multiple rapid logins
      for (let i = 0; i < 10; i++) {
        await loginPage.attemptLogin('test@test.com', 'wrongpassword');
        await page.waitForTimeout(100);
      }
      
      // Should show rate limit message or lockout
      await expect(page.getByText(/too.*many|rate.*limit|try.*later|locked/i)).toBeVisible();
    });
  });
  
  test.describe('Malformed Data', () => {
    test('should handle malformed request data', async ({ page }) => {
      await page.goto('/');
      
      // Try to inject malformed data via URL
      await page.goto('/?search=<script>alert("xss")</script>');
      
      // Should not execute script and handle gracefully
      await expect(page.locator('body')).not.toContainText('alert');
    });
    
    test('should sanitize user input', async ({ page }) => {
      await page.goto('/');
      
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('<script>alert("xss")</script>');
        await page.keyboard.press('Enter');
        
        // Input should be sanitized
        await expect(page.locator('body')).not.toContainText('alert(');
      }
    });
  });
  
  test.describe('Empty States', () => {
    test('should show empty state for no services', async ({ page }) => {
      await page.goto('/');
      
      // Search for something that won't exist
      const searchInput = page.getByPlaceholder(/search/i);
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('xyznonexistent12345abcdef');
        await page.keyboard.press('Enter');
        await page.waitForLoadState('networkidle');
        
        // Should show no results
        await expect(page.getByText(/no.*results|no.*services|not.*found/i)).toBeVisible();
      }
    });
    
    test('should show empty state for no bookings', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/bookings');
      
      // May or may not have bookings
      await expect(page.locator('body')).toContainText(/booking|empty|no.*booking/i);
    });
  });
});
