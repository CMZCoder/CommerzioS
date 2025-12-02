import { test as base, expect, Page, BrowserContext } from '@playwright/test';
import { testUsers } from './test-data';

/**
 * Authentication fixtures for E2E tests
 * Provides authenticated contexts for different user types
 */

// Extended test type with authentication fixtures
export type AuthFixtures = {
  authenticatedPage: Page;
  customerPage: Page;
  vendorPage: Page;
  adminPage: Page;
};

/**
 * Helper function to perform login
 */
async function performLogin(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  
  // Click login button
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  
  // Wait for navigation to complete
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
}

/**
 * Helper function to create authenticated context
 */
async function createAuthenticatedContext(
  browser: BrowserContext,
  email: string,
  password: string
): Promise<Page> {
  const page = await browser.newPage();
  await performLogin(page, email, password);
  return page;
}

/**
 * Extended test fixture with authentication support
 */
export const test = base.extend<AuthFixtures>({
  // Generic authenticated page - uses customer credentials
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await performLogin(page, testUsers.customer.email, testUsers.customer.password);
      await use(page);
    } finally {
      await context.close();
    }
  },

  // Customer authenticated page
  customerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await performLogin(page, testUsers.customer.email, testUsers.customer.password);
      await use(page);
    } finally {
      await context.close();
    }
  },

  // Vendor authenticated page
  vendorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await performLogin(page, testUsers.vendor.email, testUsers.vendor.password);
      await use(page);
    } finally {
      await context.close();
    }
  },

  // Admin authenticated page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await performLogin(page, testUsers.admin.email, testUsers.admin.password);
      await use(page);
    } finally {
      await context.close();
    }
  },
});

// Re-export expect for convenience
export { expect };

/**
 * Utility function to save authentication state
 * Can be used to speed up tests by reusing auth state
 */
export async function saveAuthState(page: Page, path: string): Promise<void> {
  await page.context().storageState({ path });
}

/**
 * Utility function to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check for common authenticated elements
    const userMenu = page.getByRole('button', { name: /profile|account|user/i });
    await userMenu.waitFor({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Utility function to logout
 */
export async function logout(page: Page): Promise<void> {
  // Click on user menu
  const userMenu = page.getByRole('button', { name: /profile|account|user/i });
  await userMenu.click();
  
  // Click logout
  const logoutButton = page.getByRole('menuitem', { name: /log out|sign out/i });
  await logoutButton.click();
  
  // Wait for redirect to home or login page
  await page.waitForURL(url => 
    url.toString().includes('/') || url.toString().includes('/login')
  );
}
