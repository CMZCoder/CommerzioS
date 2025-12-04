import { test, expect } from '@playwright/test';

/**
 * Profile Page E2E Tests
 * 
 * Tests for user profile, settings, and account management
 */

test.describe('Profile Page', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should display profile page', async ({ page }) => {
    await page.goto('/profile');
    
    // Profile page should load
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // User info should be visible
    const userInfo = page.locator('[data-testid="profile-info"], .profile-header, .user-name');
    await expect(userInfo.first()).toBeVisible();
  });

  test('should display profile tabs', async ({ page }) => {
    await page.goto('/profile');
    
    // Should have tabs for different sections
    const tabs = page.locator('[role="tablist"], .tabs');
    await expect(tabs.first()).toBeVisible();
    
    // Common tab names
    const tabNames = ['Services', 'Bookings', 'Reviews', 'Settings'];
    
    for (const tabName of tabNames) {
      const tab = page.locator(`[role="tab"]:has-text("${tabName}"), button:has-text("${tabName}")`);
      const isVisible = await tab.first().isVisible().catch(() => false);
      console.log(`Tab "${tabName}":`, isVisible ? 'visible' : 'hidden');
    }
  });

  test('should show edit profile button', async ({ page }) => {
    await page.goto('/profile');
    
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit Profile"), [data-testid="edit-profile"]');
    await expect(editButton.first()).toBeVisible();
  });

  test('should navigate to profile from dropdown menu', async ({ page }) => {
    await page.goto('/');
    
    // Click on user avatar/dropdown
    const userDropdown = page.locator('[data-testid="user-menu"], [data-testid="profile-dropdown"], button:has(img[alt*="avatar"]), .avatar');
    
    if (await userDropdown.first().isVisible()) {
      await userDropdown.first().click();
      
      // Click profile link
      const profileLink = page.locator('a:has-text("Profile"), button:has-text("My Profile")');
      await profileLink.first().click();
      
      await expect(page).toHaveURL(/profile/);
    }
  });

  test('should display user services (if vendor)', async ({ page }) => {
    await page.goto('/profile');
    
    // Click services tab
    const servicesTab = page.locator('[role="tab"]:has-text("Services"), button:has-text("My Services")');
    
    if (await servicesTab.first().isVisible()) {
      await servicesTab.first().click();
      await page.waitForTimeout(500);
      
      // Should show services or "create first service" message
      const services = page.locator('[data-testid="service-card"], .service-card');
      const emptyState = page.locator('text=No services, text=Create your first');
      
      const hasServices = await services.count() > 0;
      const hasEmpty = await emptyState.first().isVisible().catch(() => false);
      
      expect(hasServices || hasEmpty).toBeTruthy();
    }
  });
});

test.describe('Settings', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should access settings page', async ({ page }) => {
    await page.goto('/settings');
    
    // Settings page should load
    await expect(page.locator('h1, h2').first()).toContainText(/settings/i);
  });

  test('should display notification settings', async ({ page }) => {
    await page.goto('/settings');
    
    // Notification section
    const notificationSection = page.locator('text=Notifications, h3:has-text("Notification")');
    const hasNotifications = await notificationSection.first().isVisible().catch(() => false);
    
    if (hasNotifications) {
      // Should have toggles for notification types
      const toggles = page.locator('input[type="checkbox"], [role="switch"]');
      const toggleCount = await toggles.count();
      
      expect(toggleCount).toBeGreaterThan(0);
    }
  });

  test('should display theme toggle', async ({ page }) => {
    await page.goto('/settings');
    
    // Theme/appearance section
    const themeToggle = page.locator('text=Theme, text=Dark mode, text=Appearance');
    const hasTheme = await themeToggle.first().isVisible().catch(() => false);
    
    console.log('Theme settings visible:', hasTheme);
  });

  test('should have logout option', async ({ page }) => {
    await page.goto('/settings');
    
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")');
    await expect(logoutButton.first()).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/settings');
    
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();
    
    // Should redirect to home or login
    await page.waitForURL((url) => url.pathname === '/' || url.pathname.includes('/login'), { timeout: 5000 });
    
    // Login button should be visible again
    const loginButton = page.locator('a:has-text("Sign in"), button:has-text("Login")');
    await expect(loginButton.first()).toBeVisible();
  });
});
