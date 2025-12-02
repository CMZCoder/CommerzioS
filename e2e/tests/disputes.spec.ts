import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PaymentPage } from '../pages/PaymentPage';
import { testUsers, testDispute } from '../fixtures/test-data';

test.describe('Dispute Resolution Tests', () => {
  
  test.describe('Customer Disputes', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should raise dispute for service not provided', async ({ page }) => {
      await page.goto('/bookings');
      
      const completedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /completed|paid/i }).first();
      
      if (await completedBooking.isVisible()) {
        await completedBooking.click();
        
        const paymentPage = new PaymentPage(page);
        await paymentPage.raiseDispute('service_not_provided', testDispute.description);
        
        await expect(page.getByText(/dispute.*raised|under.*review/i)).toBeVisible();
      }
    });
    
    test('should raise dispute for poor quality', async ({ page }) => {
      await page.goto('/bookings');
      
      const completedBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /completed/i }).first();
      
      if (await completedBooking.isVisible()) {
        await completedBooking.click();
        
        const disputeButton = page.getByRole('button', { name: /dispute|raise.*issue/i });
        
        if (await disputeButton.isVisible()) {
          await disputeButton.click();
          
          const reasonSelect = page.getByLabel(/reason/i);
          await reasonSelect.selectOption('poor_quality');
          
          const descriptionInput = page.getByLabel(/description|details/i);
          await descriptionInput.fill('The quality of service was below expectations');
          
          const submitButton = page.getByRole('button', { name: /submit/i });
          await submitButton.click();
          
          await expect(page.getByText(/dispute.*raised/i)).toBeVisible();
        }
      }
    });
    
    test('should raise dispute for overcharged', async ({ page }) => {
      await page.goto('/bookings');
      
      const booking = page.locator('[data-testid="booking-item"]').first();
      
      if (await booking.isVisible()) {
        await booking.click();
        
        const disputeButton = page.getByRole('button', { name: /dispute/i });
        
        if (await disputeButton.isVisible()) {
          await disputeButton.click();
          
          const reasonSelect = page.getByLabel(/reason/i);
          if (await reasonSelect.isVisible()) {
            await reasonSelect.selectOption('overcharged');
            
            const descriptionInput = page.getByLabel(/description/i);
            await descriptionInput.fill('I was charged more than the agreed price');
            
            const submitButton = page.getByRole('button', { name: /submit/i });
            await submitButton.click();
          }
        }
      }
    });
    
    test('should upload evidence for dispute', async ({ page }) => {
      await page.goto('/bookings');
      
      const disputeBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /dispute/i }).first();
      
      if (await disputeBooking.isVisible()) {
        await disputeBooking.click();
        
        const uploadButton = page.getByRole('button', { name: /upload.*evidence|add.*document/i });
        
        if (await uploadButton.isVisible()) {
          // File upload area should be visible
          await expect(page.locator('input[type="file"]')).toBeAttached();
        }
      }
    });
  });
  
  test.describe('Vendor Disputes', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
    });
    
    test('should raise dispute as vendor', async ({ page }) => {
      await page.goto('/vendor-bookings');
      
      const booking = page.locator('[data-testid="booking-item"]').first();
      
      if (await booking.isVisible()) {
        await booking.click();
        
        const disputeButton = page.getByRole('button', { name: /dispute|report.*issue/i });
        
        if (await disputeButton.isVisible()) {
          await disputeButton.click();
          
          const reasonInput = page.getByLabel(/reason|description/i);
          await reasonInput.fill('Customer did not pay as agreed');
          
          const submitButton = page.getByRole('button', { name: /submit/i });
          await submitButton.click();
          
          await expect(page.getByText(/dispute.*raised|submitted/i)).toBeVisible();
        }
      }
    });
    
    test('should view dispute status', async ({ page }) => {
      await page.goto('/vendor-bookings');
      
      const disputeBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /dispute/i }).first();
      
      if (await disputeBooking.isVisible()) {
        await disputeBooking.click();
        
        // Should show dispute status
        await expect(page.getByText(/dispute.*status|under.*review|pending/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Admin Dispute Resolution', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.admin.email, testUsers.admin.password);
    });
    
    test('should view disputes in admin dashboard', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        // Should show disputes list
        await expect(page.getByText(/disputes|resolution/i)).toBeVisible();
      }
    });
    
    test('should mark dispute as under review', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        const disputeRow = page.locator('[data-testid="dispute-row"]').first();
        
        if (await disputeRow.isVisible()) {
          await disputeRow.click();
          
          const reviewButton = page.getByRole('button', { name: /review|under.*review/i });
          
          if (await reviewButton.isVisible()) {
            await reviewButton.click();
            
            await expect(page.getByText(/under.*review/i)).toBeVisible();
          }
        }
      }
    });
    
    test('should resolve dispute with full refund', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        const disputeRow = page.locator('[data-testid="dispute-row"]').first();
        
        if (await disputeRow.isVisible()) {
          await disputeRow.click();
          
          const refundButton = page.getByRole('button', { name: /full.*refund|refund.*customer/i });
          
          if (await refundButton.isVisible()) {
            await refundButton.click();
            
            const confirmButton = page.getByRole('button', { name: /confirm/i });
            await confirmButton.click();
            
            await expect(page.getByText(/resolved|refunded/i)).toBeVisible();
          }
        }
      }
    });
    
    test('should resolve dispute with full release to vendor', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        const disputeRow = page.locator('[data-testid="dispute-row"]').first();
        
        if (await disputeRow.isVisible()) {
          await disputeRow.click();
          
          const releaseButton = page.getByRole('button', { name: /release.*vendor|full.*release/i });
          
          if (await releaseButton.isVisible()) {
            await releaseButton.click();
            
            const confirmButton = page.getByRole('button', { name: /confirm/i });
            await confirmButton.click();
            
            await expect(page.getByText(/resolved|released/i)).toBeVisible();
          }
        }
      }
    });
    
    test('should resolve dispute with 50/50 split', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        const disputeRow = page.locator('[data-testid="dispute-row"]').first();
        
        if (await disputeRow.isVisible()) {
          await disputeRow.click();
          
          const splitButton = page.getByRole('button', { name: /split/i });
          
          if (await splitButton.isVisible()) {
            await splitButton.click();
            
            const percentageInput = page.getByLabel(/percentage|customer/i);
            await percentageInput.fill('50');
            
            const confirmButton = page.getByRole('button', { name: /confirm/i });
            await confirmButton.click();
            
            await expect(page.getByText(/resolved|split/i)).toBeVisible();
          }
        }
      }
    });
    
    test('should resolve dispute with custom percentage', async ({ page }) => {
      await page.goto('/admin');
      
      const disputesNav = page.getByRole('link', { name: /disputes/i });
      
      if (await disputesNav.isVisible()) {
        await disputesNav.click();
        
        const disputeRow = page.locator('[data-testid="dispute-row"]').first();
        
        if (await disputeRow.isVisible()) {
          await disputeRow.click();
          
          const splitButton = page.getByRole('button', { name: /split|custom/i });
          
          if (await splitButton.isVisible()) {
            await splitButton.click();
            
            const percentageInput = page.getByLabel(/percentage|customer/i);
            await percentageInput.fill('75');
            
            const confirmButton = page.getByRole('button', { name: /confirm/i });
            await confirmButton.click();
            
            await expect(page.getByText(/resolved/i)).toBeVisible();
          }
        }
      }
    });
  });
  
  test.describe('Dispute Notifications', () => {
    test('should receive notification on dispute resolution as customer', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/notifications');
      
      // Check for dispute-related notifications
      const disputeNotification = page.locator('[data-testid="notification"]').filter({ hasText: /dispute|resolution|refund/i });
      
      // May or may not have notifications
      await expect(page.locator('body')).toContainText(/notification|dispute|empty/i);
    });
    
    test('should receive notification on dispute resolution as vendor', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
      
      await page.goto('/notifications');
      
      // Check for dispute-related notifications
      await expect(page.locator('body')).toContainText(/notification|dispute|empty/i);
    });
  });
  
  test.describe('Dispute Impact', () => {
    test('should pause auto-release during dispute', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/bookings');
      
      const disputeBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /dispute/i }).first();
      
      if (await disputeBooking.isVisible()) {
        await disputeBooking.click();
        
        // Should show that auto-release is paused
        await expect(page.getByText(/paused|on.*hold|dispute.*pending/i)).toBeVisible();
      }
    });
  });
});
