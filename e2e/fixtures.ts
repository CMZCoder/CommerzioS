/**
 * E2E Test Fixtures
 * 
 * Provides authentication state and common test utilities
 * Uses dedicated test user accounts for E2E testing
 */

import { test as base, expect, Page } from '@playwright/test';

// Dedicated test user credentials (created by testUserService.ts)
// These accounts operate in "ghost mode" - their data is hidden from regular users
export const TEST_USER = {
  id: 'test-user-customer',
  email: 'test-customer@commerzio.test',
  password: 'TestCustomer123',
  firstName: 'Test',
  lastName: 'Customer',
};

export const TEST_VENDOR = {
  id: 'test-user-vendor',
  email: 'test-vendor@commerzio.test',
  password: 'TestVendor123',
  firstName: 'Test',
  lastName: 'Vendor',
};

export const TEST_ADMIN = {
  id: 'test-admin-e2e',
  email: 'test-admin@commerzio.test',
  password: 'TestAdmin123Secure',
  firstName: 'Test',
  lastName: 'Admin',
};

// Extended test fixture with authentication helpers
export const test = base.extend<{
  authenticatedPage: Page;
  vendorPage: Page;
}>({
  // Page authenticated as regular user
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page, TEST_USER.email, TEST_USER.password);
    await use(page);
  },
  
  // Page authenticated as vendor
  vendorPage: async ({ page }, use) => {
    await loginAsUser(page, TEST_VENDOR.email, TEST_VENDOR.password);
    await use(page);
  },
});

/**
 * Login helper function
 */
export async function loginAsUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"], input[type="email"]', email);
  await page.fill('[data-testid="password-input"], input[type="password"]', password);
  await page.click('[data-testid="login-button"], button[type="submit"]');
  
  // Wait for redirect or dashboard
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

/**
 * Register a new user
 */
export async function registerUser(page: Page, user: typeof TEST_USER) {
  await page.goto('/register');
  await page.fill('input[name="firstName"]', user.firstName);
  await page.fill('input[name="lastName"]', user.lastName);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  // Click user menu and logout
  await page.click('[data-testid="user-menu"], [data-testid="profile-dropdown"]');
  await page.click('[data-testid="logout-button"], text=Logout, text=Sign out');
  await page.waitForURL('/');
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text?: string) {
  const toastSelector = '[data-sonner-toast], [role="status"]';
  await page.waitForSelector(toastSelector, { timeout: 5000 });
  
  if (text) {
    await expect(page.locator(toastSelector)).toContainText(text);
  }
}

/**
 * Navigate to a service and start booking
 */
export async function navigateToBookService(page: Page, serviceId: string) {
  await page.goto(`/service/${serviceId}/book`);
  await page.waitForSelector('[data-testid="booking-step"], .booking-step, h1');
}

export { expect };
