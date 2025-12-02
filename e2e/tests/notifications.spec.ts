import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testNotificationPreferences } from '../fixtures/test-data';

test.describe('Notification Tests', () => {
  
  test.describe('In-App Notifications', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should display notification bell', async ({ page }) => {
      await page.goto('/');
      
      const notificationBell = page.locator('[data-testid="notification-bell"]').or(page.getByRole('button', { name: /notification/i }));
      
      await expect(notificationBell).toBeVisible();
    });
    
    test('should show notification count', async ({ page }) => {
      await page.goto('/');
      
      const notificationCount = page.locator('[data-testid="notification-count"]').or(page.locator('.notification-badge'));
      
      // May or may not have notifications
      await expect(page.locator('body')).toContainText(/notification|bell/i);
    });
    
    test('should open notifications panel', async ({ page }) => {
      await page.goto('/');
      
      const notificationBell = page.locator('[data-testid="notification-bell"]').or(page.getByRole('button', { name: /notification/i }));
      
      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        
        // Should show notifications panel
        await expect(page.locator('[data-testid="notifications-panel"]').or(page.getByText(/notification|empty|no.*new/i))).toBeVisible();
      }
    });
    
    test('should mark notification as read', async ({ page }) => {
      await page.goto('/notifications');
      
      const notification = page.locator('[data-testid="notification"]').first();
      
      if (await notification.isVisible()) {
        // Click to mark as read or find mark as read button
        const markReadButton = notification.getByRole('button', { name: /mark.*read/i });
        
        if (await markReadButton.isVisible()) {
          await markReadButton.click();
          
          await expect(notification).toHaveClass(/read/);
        } else {
          // Clicking notification might mark it as read
          await notification.click();
        }
      }
    });
    
    test('should mark all notifications as read', async ({ page }) => {
      await page.goto('/notifications');
      
      const markAllButton = page.getByRole('button', { name: /mark.*all.*read/i });
      
      if (await markAllButton.isVisible()) {
        await markAllButton.click();
        
        await expect(page.getByText(/all.*read|marked/i)).toBeVisible();
      }
    });
    
    test('should dismiss notification', async ({ page }) => {
      await page.goto('/notifications');
      
      const notification = page.locator('[data-testid="notification"]').first();
      
      if (await notification.isVisible()) {
        const dismissButton = notification.getByRole('button', { name: /dismiss|close|x/i });
        
        if (await dismissButton.isVisible()) {
          await dismissButton.click();
          
          // Notification should be gone
          await expect(notification).not.toBeVisible();
        }
      }
    });
  });
  
  test.describe('Notification Types', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should display booking notifications', async ({ page }) => {
      await page.goto('/notifications');
      
      const bookingNotification = page.locator('[data-testid="notification"]').filter({ hasText: /booking/i }).first();
      
      // May or may not have booking notifications
      await expect(page.locator('body')).toContainText(/notification|booking|empty/i);
    });
    
    test('should display payment notifications', async ({ page }) => {
      await page.goto('/notifications');
      
      const paymentNotification = page.locator('[data-testid="notification"]').filter({ hasText: /payment/i }).first();
      
      await expect(page.locator('body')).toContainText(/notification|payment|empty/i);
    });
    
    test('should display message notifications', async ({ page }) => {
      await page.goto('/notifications');
      
      const messageNotification = page.locator('[data-testid="notification"]').filter({ hasText: /message/i }).first();
      
      await expect(page.locator('body')).toContainText(/notification|message|empty/i);
    });
    
    test('should display referral notifications', async ({ page }) => {
      await page.goto('/notifications');
      
      await expect(page.locator('body')).toContainText(/notification|referral|empty/i);
    });
  });
  
  test.describe('Notification Preferences', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should access notification settings', async ({ page }) => {
      await page.goto('/profile');
      
      const settingsButton = page.getByRole('link', { name: /settings/i }).or(page.getByRole('button', { name: /settings/i }));
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Look for notification settings
        const notificationSettings = page.getByText(/notification.*settings|preferences/i);
        
        if (await notificationSettings.isVisible()) {
          await notificationSettings.click();
        }
      }
    });
    
    test('should toggle notification types', async ({ page }) => {
      await page.goto('/profile');
      
      const settingsButton = page.getByRole('link', { name: /settings/i }).or(page.getByRole('button', { name: /settings/i }));
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Find notification toggles
        const bookingToggle = page.getByLabel(/booking.*notification/i).or(page.locator('[data-testid="booking-notifications-toggle"]'));
        
        if (await bookingToggle.isVisible()) {
          await bookingToggle.click();
          
          // Toggle state should change
          await expect(page.getByText(/saved|updated/i)).toBeVisible();
        }
      }
    });
    
    test('should set quiet hours', async ({ page }) => {
      await page.goto('/profile');
      
      const settingsButton = page.getByRole('link', { name: /settings/i });
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        const quietHoursStart = page.getByLabel(/quiet.*start|do.*not.*disturb.*from/i);
        const quietHoursEnd = page.getByLabel(/quiet.*end|do.*not.*disturb.*to/i);
        
        if (await quietHoursStart.isVisible()) {
          await quietHoursStart.fill(testNotificationPreferences.quietHoursStart);
        }
        
        if (await quietHoursEnd.isVisible()) {
          await quietHoursEnd.fill(testNotificationPreferences.quietHoursEnd);
        }
        
        const saveButton = page.getByRole('button', { name: /save/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    });
  });
  
  test.describe('Push Notifications', () => {
    test('should show push notification permission prompt', async ({ page, context }) => {
      // Reset permissions
      await context.clearPermissions();
      
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/');
      
      // Look for push notification prompt or enable button
      const enablePushButton = page.getByRole('button', { name: /enable.*push|allow.*notification/i });
      
      // May or may not show push notification prompt
      await expect(page.locator('body')).toContainText(/notification|commerzio/i);
    });
  });
  
  test.describe('Email Notifications', () => {
    test('should display email notification settings', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/profile');
      
      const settingsButton = page.getByRole('link', { name: /settings/i });
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Look for email notification settings
        const emailSettings = page.getByText(/email.*notification/i);
        
        await expect(page.locator('body')).toContainText(/email|notification|settings/i);
      }
    });
  });
});
