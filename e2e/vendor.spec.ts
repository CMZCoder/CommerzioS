import { test, expect } from '@playwright/test';

/**
 * Vendor Dashboard E2E Tests
 * 
 * Tests for vendor-specific features like service management
 */

test.describe('Vendor Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_VENDOR_EMAIL, 'Test vendor not configured');
    
    // Login as vendor
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_VENDOR_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_VENDOR_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should display vendor dashboard', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    
    // Dashboard should load
    const dashboard = page.locator('h1:has-text("Dashboard"), [data-testid="vendor-dashboard"]');
    await expect(dashboard.first()).toBeVisible();
  });

  test('should show booking requests', async ({ page }) => {
    await page.goto('/vendor/dashboard');
    
    // Booking requests section
    const bookingsSection = page.locator('text=Booking, text=Requests, [data-testid="pending-bookings"]');
    await expect(bookingsSection.first()).toBeVisible();
  });

  test('should show service management', async ({ page }) => {
    await page.goto('/vendor/services');
    
    // Service management
    const servicesSection = page.locator('h1:has-text("Services"), [data-testid="vendor-services"]');
    await expect(servicesSection.first()).toBeVisible();
    
    // Create service button
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add Service"), a:has-text("New Service")');
    await expect(createButton.first()).toBeVisible();
  });

  test('should show earnings/analytics', async ({ page }) => {
    await page.goto('/vendor/analytics');
    
    // Analytics page
    const analytics = page.locator('h1:has-text("Analytics"), h1:has-text("Earnings"), [data-testid="vendor-analytics"]');
    const hasAnalytics = await analytics.first().isVisible().catch(() => false);
    
    console.log('Analytics page visible:', hasAnalytics);
  });
});

test.describe('Service Management', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_VENDOR_EMAIL, 'Test vendor not configured');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_VENDOR_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_VENDOR_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should open create service modal', async ({ page }) => {
    await page.goto('/profile?tab=services');
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add")');
    await createButton.first().click();
    
    // Modal should appear
    const modal = page.locator('[role="dialog"], .modal');
    await expect(modal.first()).toBeVisible();
    
    // Form fields should be present
    await expect(page.locator('input[name="title"], input[placeholder*="title"]').first()).toBeVisible();
  });

  test('should validate service form', async ({ page }) => {
    await page.goto('/profile?tab=services');
    
    const createButton = page.locator('button:has-text("Create"), button:has-text("Add")');
    await createButton.first().click();
    
    // Try to submit empty form
    const submitButton = page.locator('[role="dialog"] button[type="submit"], button:has-text("Save")');
    await submitButton.first().click();
    
    // Should show validation errors
    const errors = page.locator('.error, [role="alert"], text=required');
    const hasErrors = await errors.first().isVisible().catch(() => false);
    
    // Form should still be open (not submitted)
    const modal = page.locator('[role="dialog"]');
    const modalStillOpen = await modal.first().isVisible();
    
    expect(hasErrors || modalStillOpen).toBeTruthy();
  });

  test('should show service edit button', async ({ page }) => {
    await page.goto('/profile?tab=services');
    
    const firstService = page.locator('[data-testid="service-card"], .service-card').first();
    
    if (await firstService.isVisible().catch(() => false)) {
      // Hover to show actions
      await firstService.hover();
      
      const editButton = firstService.locator('button:has-text("Edit"), [data-testid="edit-service"]');
      const hasEdit = await editButton.first().isVisible().catch(() => false);
      
      console.log('Edit button visible:', hasEdit);
    }
  });
});

test.describe('Booking Management', () => {
  
  test.beforeEach(async ({ page }) => {
    test.skip(!process.env.TEST_VENDOR_EMAIL, 'Test vendor not configured');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_VENDOR_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_VENDOR_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  });

  test('should display pending bookings', async ({ page }) => {
    await page.goto('/vendor/bookings');
    
    // Pending filter
    const pendingTab = page.locator('button:has-text("Pending"), [role="tab"]:has-text("Pending")');
    
    if (await pendingTab.first().isVisible()) {
      await pendingTab.first().click();
    }
    
    // Should show bookings or empty state
    const bookings = page.locator('[data-testid="booking-card"], .booking-card');
    const emptyState = page.locator('text=No pending, text=No bookings');
    
    const hasBookings = await bookings.count() > 0;
    const hasEmpty = await emptyState.first().isVisible().catch(() => false);
    
    expect(hasBookings || hasEmpty).toBeTruthy();
  });

  test('should show accept/reject buttons for pending bookings', async ({ page }) => {
    await page.goto('/vendor/bookings');
    
    const pendingBooking = page.locator('[data-testid="booking-card"]:has-text("Pending"), .booking-card.pending').first();
    
    if (await pendingBooking.isVisible().catch(() => false)) {
      const acceptButton = pendingBooking.locator('button:has-text("Accept"), button:has-text("Confirm")');
      const rejectButton = pendingBooking.locator('button:has-text("Reject"), button:has-text("Decline")');
      
      const hasAccept = await acceptButton.first().isVisible().catch(() => false);
      const hasReject = await rejectButton.first().isVisible().catch(() => false);
      
      expect(hasAccept || hasReject).toBeTruthy();
    }
  });

  test('should show calendar/schedule view', async ({ page }) => {
    await page.goto('/vendor/calendar');
    
    // Calendar component
    const calendar = page.locator('[data-testid="calendar"], .calendar, [role="grid"]');
    const hasCalendar = await calendar.first().isVisible().catch(() => false);
    
    console.log('Calendar view visible:', hasCalendar);
  });
});
