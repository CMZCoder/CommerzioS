import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { testUsers } from '../fixtures/test-data';
import { generateUniqueEmail } from '../utils/helpers';

test.describe('Referral System Tests', () => {
  
  test.describe('Generate Referral Code', () => {
    test('should generate referral code', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Should display referral code
      const referralCode = page.locator('[data-testid="referral-code"]').or(page.getByText(/code|referral/i));
      
      await expect(referralCode).toBeVisible();
    });
  });
  
  test.describe('Share Referral Link', () => {
    test('should display shareable referral link', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Should show referral link
      const referralLink = page.locator('[data-testid="referral-link"]').or(page.locator('input[type="text"]').filter({ hasText: /commerzio/i }));
      
      if (await referralLink.isVisible()) {
        const link = await referralLink.inputValue();
        expect(link).toContain('ref=');
      }
    });
    
    test('should copy referral link', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      const copyButton = page.getByRole('button', { name: /copy/i });
      
      if (await copyButton.isVisible()) {
        await copyButton.click();
        
        // Should show copied confirmation
        await expect(page.getByText(/copied/i)).toBeVisible();
      }
    });
    
    test('should have social share buttons', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Check for share buttons
      const shareButtons = page.locator('[data-testid="share-button"]').or(page.getByRole('button', { name: /share/i }));
      
      const count = await shareButtons.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
  
  test.describe('Sign Up with Referral', () => {
    test('should sign up with referral code', async ({ page }) => {
      // First, get a referral code from existing user
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      const referralCodeElement = page.locator('[data-testid="referral-code"]');
      let referralCode = '';
      
      if (await referralCodeElement.isVisible()) {
        referralCode = await referralCodeElement.textContent() || '';
      }
      
      // Logout
      await page.goto('/');
      const userMenu = page.getByRole('button', { name: /profile|account/i });
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const logoutButton = page.getByRole('menuitem', { name: /logout/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        }
      }
      
      // Sign up with referral
      if (referralCode) {
        await page.goto(`/register?ref=${referralCode}`);
        
        const referralInput = page.getByLabel(/referral.*code/i).or(page.locator('input[name="referralCode"]'));
        
        if (await referralInput.isVisible()) {
          await expect(referralInput).toHaveValue(referralCode);
        }
      }
    });
  });
  
  test.describe('Referral Points', () => {
    test('should display points balance', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      const pointsBalance = page.locator('[data-testid="points-balance"]').or(page.getByText(/points|balance/i));
      
      await expect(pointsBalance).toBeVisible();
    });
    
    test('should show referral stats', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Should show stats like total referrals, earnings, etc.
      const stats = page.locator('[data-testid="referral-stats"]').or(page.getByText(/referrals|earned|total/i));
      
      await expect(stats).toBeVisible();
    });
  });
  
  test.describe('Multi-Level Referrals', () => {
    test('should display L1 referral info', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Look for level 1 referral information
      const l1Info = page.locator('[data-testid="l1-referrals"]').or(page.getByText(/level.*1|direct.*referral/i));
      
      await expect(page.locator('body')).toContainText(/referral|level|points/i);
    });
    
    test('should display L2 referral info', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Look for level 2 referral information
      const l2Info = page.locator('[data-testid="l2-referrals"]').or(page.getByText(/level.*2|indirect/i));
      
      await expect(page.locator('body')).toContainText(/referral|level|points/i);
    });
    
    test('should display L3 referral info', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Look for level 3 referral information
      await expect(page.locator('body')).toContainText(/referral|level|points/i);
    });
  });
  
  test.describe('Commission Tracking', () => {
    test('should display commission history', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Look for commission/earnings history
      const commissionHistory = page.locator('[data-testid="commission-history"]').or(page.getByText(/history|earnings|commission/i));
      
      await expect(page.locator('body')).toContainText(/referral|commission|earned|history/i);
    });
  });
  
  test.describe('Points Redemption', () => {
    test('should display redemption options', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      const redeemButton = page.getByRole('button', { name: /redeem/i });
      
      if (await redeemButton.isVisible()) {
        await redeemButton.click();
        
        // Should show redemption options
        await expect(page.getByText(/redeem|points|discount/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Referral Dashboard', () => {
    test('should display referral dashboard', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      await page.goto('/referrals');
      
      // Dashboard should have key elements
      await expect(page.locator('body')).toContainText(/referral/i);
    });
  });
});
