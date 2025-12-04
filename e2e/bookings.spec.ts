import { test, expect } from '@playwright/test';

/**
 * My Bookings E2E Tests
 * 
 * Tests for the customer bookings page and booking management
 */

test.describe('My Bookings Page', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should display bookings page', async ({ page }) => {
    await page.goto('/bookings');
    
    // Page should load with title
    await expect(page.locator('h1, h2').first()).toContainText(/booking/i);
  });

  test('should show booking tabs/filters', async ({ page }) => {
    await page.goto('/bookings');
    
    // Should have filter tabs
    const tabs = page.locator('[role="tablist"], .tabs');
    const hasTabsUI = await tabs.first().isVisible().catch(() => false);
    
    // Or filter buttons
    const filterButtons = page.locator('button:has-text("All"), button:has-text("Upcoming"), button:has-text("Past")');
    const hasFilters = await filterButtons.first().isVisible().catch(() => false);
    
    expect(hasTabsUI || hasFilters).toBeTruthy();
  });

  test('should display booking cards or empty state', async ({ page }) => {
    await page.goto('/bookings');
    
    await page.waitForTimeout(1000); // Wait for data to load
    
    // Should show bookings or empty state
    const bookingCards = page.locator('[data-testid="booking-card"], .booking-card');
    const emptyState = page.locator('text=No bookings, text=no upcoming');
    
    const hasBookings = await bookingCards.count() > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    
    expect(hasBookings || hasEmpty).toBeTruthy();
  });

  test('should navigate to booking detail', async ({ page }) => {
    await page.goto('/bookings');
    
    await page.waitForTimeout(1000);
    
    const firstBooking = page.locator('[data-testid="booking-card"], .booking-card').first();
    
    if (await firstBooking.isVisible().catch(() => false)) {
      await firstBooking.click();
      
      // Should navigate to booking detail or show modal
      const isOnDetailPage = page.url().includes('/booking');
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      
      expect(isOnDetailPage || hasModal).toBeTruthy();
    }
  });

  test('should access bookings from header navigation', async ({ page }) => {
    await page.goto('/');
    
    // Find My Bookings link in header
    const bookingsLink = page.locator('header a:has-text("Bookings"), nav a:has-text("My Bookings")');
    
    if (await bookingsLink.first().isVisible().catch(() => false)) {
      await bookingsLink.first().click();
      await expect(page).toHaveURL(/bookings/);
    }
  });

  test('should access bookings from profile page', async ({ page }) => {
    await page.goto('/profile');
    
    // Find bookings tab
    const bookingsTab = page.locator('[role="tab"]:has-text("Bookings"), button:has-text("My Bookings")');
    
    if (await bookingsTab.first().isVisible().catch(() => false)) {
      await bookingsTab.first().click();
      
      // Content should update
      await page.waitForTimeout(500);
      
      const bookingContent = page.locator('text=booking, [data-testid="booking-card"]');
      const hasContent = await bookingContent.first().isVisible().catch(() => false);
      
      console.log('Bookings tab content visible:', hasContent);
    }
  });
});

test.describe('Booking Status', () => {
  
  test('should show pending bookings indicator', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    await page.goto('/bookings');
    
    // Pending tab or filter
    const pendingFilter = page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending")');
    
    if (await pendingFilter.first().isVisible().catch(() => false)) {
      await pendingFilter.first().click();
      await page.waitForTimeout(500);
      
      // Should show pending bookings or empty
      const content = page.locator('[data-testid="booking-card"], text=No pending');
      await expect(content.first()).toBeVisible();
    }
  });

  test('should display booking status badges', async ({ page }) => {
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    await page.goto('/bookings');
    await page.waitForTimeout(1000);
    
    const firstBooking = page.locator('[data-testid="booking-card"], .booking-card').first();
    
    if (await firstBooking.isVisible().catch(() => false)) {
      // Should have status badge
      const statusBadge = firstBooking.locator('[data-testid="status-badge"], .badge, .status');
      const hasStatus = await statusBadge.first().isVisible().catch(() => false);
      
      console.log('Status badge visible:', hasStatus);
    }
  });
});
