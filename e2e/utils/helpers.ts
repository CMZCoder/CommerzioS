import { Page, expect } from '@playwright/test';

/**
 * Helper utilities for E2E tests
 */

/**
 * Generate a unique email for testing
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@commerzio.test`;
}

/**
 * Generate a unique phone number for testing
 */
export function generateUniquePhone(): string {
  const randomDigits = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
  return `+4179${randomDigits}`;
}

/**
 * Wait for a specific amount of time (use sparingly)
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an action until it succeeds or max retries reached
 */
export async function retry<T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await action();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await wait(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Get a date string for N days from now
 */
export function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Get a date string for N days in the past
 */
export function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'CHF'): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for element to be stable (no animations)
 */
export async function waitForElementStable(page: Page, selector: string, timeout: number = 5000): Promise<void> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  
  // Wait for any animations to complete
  await page.evaluate((sel) => {
    return new Promise<void>((resolve) => {
      const el = document.querySelector(sel);
      if (!el) {
        resolve();
        return;
      }
      
      const checkStable = () => {
        const animations = el.getAnimations();
        if (animations.length === 0) {
          resolve();
        } else {
          Promise.all(animations.map(a => a.finished)).then(() => resolve());
        }
      };
      
      checkStable();
    });
  }, selector);
}

/**
 * Scroll element into view and wait
 */
export async function scrollToAndWait(page: Page, selector: string): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  await wait(300); // Allow time for any lazy loading
}

/**
 * Check if element exists without throwing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'attached', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all text content from a list of elements
 */
export async function getAllTextContent(page: Page, selector: string): Promise<string[]> {
  const elements = page.locator(selector);
  return elements.allTextContents();
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Clear session storage
 */
export async function clearSessionStorage(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.clear());
}

/**
 * Clear all storage
 */
export async function clearAllStorage(page: Page): Promise<void> {
  await clearLocalStorage(page);
  await clearSessionStorage(page);
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value]);
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Mock geolocation
 */
export async function mockGeolocation(page: Page, latitude: number, longitude: number): Promise<void> {
  await page.context().setGeolocation({ latitude, longitude });
}

/**
 * Grant geolocation permission
 */
export async function grantGeolocationPermission(page: Page): Promise<void> {
  await page.context().grantPermissions(['geolocation']);
}

/**
 * Take a full page screenshot
 */
export async function takeFullPageScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * Compare two dates (ignoring time)
 */
export function isSameDate(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number {
  const cleanedString = priceString.replace(/[^0-9.,]/g, '').replace(',', '.');
  return parseFloat(cleanedString);
}

/**
 * Wait for toast notification to appear and optionally verify text
 */
export async function waitForToast(page: Page, text?: string | RegExp): Promise<void> {
  const toast = page.locator('[data-sonner-toaster]').or(page.locator('.toast'));
  await toast.waitFor({ state: 'visible', timeout: 10000 });
  
  if (text) {
    await expect(toast).toContainText(text);
  }
}

/**
 * Dismiss toast notification
 */
export async function dismissToast(page: Page): Promise<void> {
  const closeButton = page.locator('[data-sonner-toaster] button[aria-label="Close"]').or(page.locator('.toast-close'));
  
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

/**
 * Wait for modal to appear
 */
export async function waitForModal(page: Page): Promise<void> {
  const modal = page.getByRole('dialog').or(page.locator('[data-state="open"]'));
  await modal.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Close modal
 */
export async function closeModal(page: Page): Promise<void> {
  const closeButton = page.getByRole('button', { name: /close/i }).or(page.locator('[aria-label="Close"]'));
  
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Try clicking outside the modal or pressing Escape
    await page.keyboard.press('Escape');
  }
}

/**
 * Verify URL contains path
 */
export async function verifyUrlContains(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Verify URL equals exact path
 */
export async function verifyUrlEquals(page: Page, path: string): Promise<void> {
  await expect(page).toHaveURL(path);
}

/**
 * Get query parameter from current URL
 */
export function getQueryParam(page: Page, param: string): string | null {
  const url = new URL(page.url());
  return url.searchParams.get(param);
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Generate random integer between min and max
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if page has specific text
 */
export async function pageHasText(page: Page, text: string | RegExp): Promise<boolean> {
  try {
    await expect(page.locator('body')).toContainText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for page to have specific title
 */
export async function waitForTitle(page: Page, title: string | RegExp): Promise<void> {
  await expect(page).toHaveTitle(title);
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('de-CH');
}

/**
 * Format time for display
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}
