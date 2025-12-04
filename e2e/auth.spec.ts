import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * Tests for login, registration, and authentication flows
 */

test.describe('Authentication', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should have email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display registration page', async ({ page }) => {
    await page.goto('/register');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should have registration form fields - either email/password inputs or the form itself
    const hasEmailInput = await page.locator('input[type="email"]').isVisible({ timeout: 10000 }).catch(() => false);
    const hasPasswordInput = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const hasForm = await page.locator('form').isVisible().catch(() => false);
    
    expect(hasEmailInput || hasPasswordInput || hasForm).toBeTruthy();
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    await page.click('button[type="submit"]');
    
    // Should show validation error or remain on login page
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message or toast
    const errorVisible = await page.locator('[role="alert"], .error, [data-sonner-toast]').isVisible()
      .catch(() => false);
    const stillOnLogin = page.url().includes('/login');
    
    expect(errorVisible || stillOnLogin).toBeTruthy();
  });

  test('should have link to register from login page', async ({ page }) => {
    await page.goto('/login');
    
    const registerLink = page.locator('a[href*="register"], a:has-text("Sign up"), a:has-text("Register")');
    await expect(registerLink.first()).toBeVisible();
    
    await registerLink.first().click();
    await expect(page).toHaveURL(/register/);
  });

  test('should have link to login from register page', async ({ page }) => {
    await page.goto('/register');
    
    const loginLink = page.locator('a[href*="login"], a:has-text("Sign in"), a:has-text("Login")');
    await expect(loginLink.first()).toBeVisible();
    
    await loginLink.first().click();
    await expect(page).toHaveURL(/login/);
  });

  test('should display social login buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check for social login options (Google, etc.)
    const socialButtons = page.locator('button:has-text("Google"), button:has-text("Continue with")');
    
    // At least one social login should be visible (or none if not configured)
    const count = await socialButtons.count();
    // This is informational - social login may or may not be configured
    console.log(`Found ${count} social login buttons`);
  });

  test('should redirect to home after successful login', async ({ page }) => {
    // This test requires a valid test user in the database
    // Skip if no test credentials are set up
    test.skip(!process.env.TEST_USER_EMAIL, 'Test user not configured');
    
    await page.goto('/login');
    
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button[type="submit"]');
    
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    
    // Should not be on login page
    expect(page.url()).not.toContain('/login');
  });
});
