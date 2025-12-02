import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HomePage } from '../pages/HomePage';
import { testUsers } from '../fixtures/test-data';
import { generateUniqueEmail } from '../utils/helpers';

test.describe('Authentication Flow Tests', () => {
  
  test.describe('User Registration', () => {
    test('should register a new user with valid data', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      await registerPage.verifyPageLoaded();
      
      const newUser = {
        firstName: 'New',
        lastName: 'TestUser',
        email: generateUniqueEmail('newuser'),
        password: 'SecurePassword123!',
      };
      
      await registerPage.registerCustomer(newUser);
      
      // Should redirect away from register page after successful registration
      await expect(page).not.toHaveURL(/\/register$/);
    });
    
    test('should show validation errors for invalid registration data', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      
      // Submit empty form
      await registerPage.submitRegistration();
      
      // Should show validation errors
      await expect(registerPage.errorMessage.or(page.getByText(/required|invalid/i))).toBeVisible();
    });
    
    test('should show error for existing email registration', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      
      // Try to register with existing test user email
      await registerPage.registerCustomer({
        firstName: 'Duplicate',
        lastName: 'User',
        email: testUsers.customer.email,
        password: 'TestPassword123!',
      });
      
      // Should show error about existing email
      await expect(registerPage.errorMessage.or(page.getByText(/already.*exist|email.*taken|already.*registered/i))).toBeVisible();
    });
    
    test('should validate password requirements', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      
      await registerPage.fillCustomerForm({
        firstName: 'Test',
        lastName: 'User',
        email: generateUniqueEmail(),
        password: '123', // Too weak
      });
      
      await registerPage.submitRegistration();
      
      // Should show password validation error
      await expect(page.getByText(/password.*weak|password.*requirements|password.*characters/i)).toBeVisible();
    });
  });
  
  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.verifyPageLoaded();
      
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Should be redirected after successful login
      expect(loginPage.getCurrentUrl()).not.toContain('/login');
    });
    
    test('should show error for invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await loginPage.attemptLogin(testUsers.customer.email, 'wrongpassword');
      
      // Should show error message
      await expect(loginPage.errorMessage.or(page.getByText(/invalid|incorrect|wrong/i))).toBeVisible();
    });
    
    test('should show error for non-existent user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await loginPage.attemptLogin('nonexistent@example.com', 'anypassword');
      
      // Should show error message
      await expect(loginPage.errorMessage.or(page.getByText(/invalid|not.*found|incorrect/i))).toBeVisible();
    });
    
    test('should lockout after 5 failed login attempts', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Attempt to login with wrong password multiple times
      for (let i = 0; i < 5; i++) {
        await loginPage.attemptLogin(testUsers.customer.email, 'wrongpassword' + i);
        await loginPage.clearForm();
      }
      
      // Attempt one more login
      await loginPage.attemptLogin(testUsers.customer.email, 'wrongpassword6');
      
      // Should show lockout message
      await expect(page.getByText(/locked|too.*many.*attempts|try.*later/i)).toBeVisible();
    });
    
    test('should navigate to forgot password page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await loginPage.clickForgotPassword();
      
      await expect(page).toHaveURL(/forgot.*password/i);
    });
    
    test('should navigate to registration page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await loginPage.clickRegister();
      
      await expect(page).toHaveURL(/register/i);
    });
  });
  
  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.clickForgotPassword();
      
      // Fill email for reset
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill(testUsers.customer.email);
      
      const submitButton = page.getByRole('button', { name: /send|reset|submit/i });
      await submitButton.click();
      
      // Should show success message
      await expect(page.getByText(/email.*sent|check.*inbox|reset.*link/i)).toBeVisible();
    });
    
    test('should show error for non-existent email in password reset', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.clickForgotPassword();
      
      const emailInput = page.getByLabel(/email/i);
      await emailInput.fill('nonexistent@example.com');
      
      const submitButton = page.getByRole('button', { name: /send|reset|submit/i });
      await submitButton.click();
      
      // Could show error or success (for security, some apps don't reveal if email exists)
      await expect(page.getByText(/email.*sent|not.*found|check.*inbox/i)).toBeVisible();
    });
  });
  
  test.describe('OAuth Login', () => {
    test('should display Google OAuth button', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      await expect(loginPage.googleLoginButton).toBeVisible();
    });
    
    test('should initiate Google OAuth flow when clicked', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Store current URL
      const currentUrl = page.url();
      
      // Click Google login - will redirect to Google
      await loginPage.clickGoogleLogin();
      
      // Should navigate away from login page
      await page.waitForTimeout(1000);
      const newUrl = page.url();
      
      // URL should change (either to Google or OAuth callback)
      expect(newUrl).not.toBe(currentUrl);
    });
  });
  
  test.describe('Session Management', () => {
    test('should persist session across page refresh', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Login
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Verify logged in
      const homePage = new HomePage(page);
      await expect(homePage.userMenuButton).toBeVisible();
      
      // Refresh page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be logged in
      await expect(homePage.userMenuButton).toBeVisible();
    });
    
    test('should logout successfully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      
      // Login first
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      const homePage = new HomePage(page);
      
      // Open user menu and logout
      await homePage.openUserMenu();
      const logoutButton = page.getByRole('menuitem', { name: /log.*out|sign.*out/i });
      await logoutButton.click();
      
      // Should be logged out - redirect to home or login
      await expect(page).toHaveURL(/\/$|\/login/);
    });
    
    test('should redirect protected routes when not authenticated', async ({ page }) => {
      // Try to access a protected route without being logged in
      await page.goto('/bookings');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });
    
    test('should redirect to original page after login', async ({ page }) => {
      // Try to access protected route
      await page.goto('/bookings');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
      
      const loginPage = new LoginPage(page);
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Should redirect back to bookings after login
      await expect(page).toHaveURL(/bookings/);
    });
  });
  
  test.describe('Email Verification', () => {
    test('should show email verification prompt after registration', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.navigate();
      
      const newUser = {
        firstName: 'Verify',
        lastName: 'Email',
        email: generateUniqueEmail('verify'),
        password: 'SecurePassword123!',
      };
      
      await registerPage.registerCustomer(newUser);
      
      // Should show verification message or redirect to verification page
      await expect(page.getByText(/verify.*email|confirmation.*sent|check.*email/i)).toBeVisible();
    });
    
    test('should navigate to email verification page', async ({ page }) => {
      // This test simulates visiting the verification page
      await page.goto('/verify-email?token=test-token');
      
      // Should show some verification content (either success, error, or loading)
      await expect(page.locator('body')).toContainText(/verify|email|confirm|invalid|expired/i);
    });
  });
});
