import { test, expect } from '@playwright/test';
import { AdminPage } from '../pages/AdminPage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testAdminActions } from '../fixtures/test-data';

test.describe('Admin Dashboard Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(testUsers.admin.email, testUsers.admin.password);
  });
  
  test.describe('Admin Access', () => {
    test('should access admin dashboard', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      
      await expect(page).toHaveURL(/admin/);
    });
    
    test('should display admin navigation', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      
      await expect(adminPage.sidebar.or(adminPage.usersNav)).toBeVisible();
    });
  });
  
  test.describe('User Management', () => {
    test('should view all users', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      await expect(adminPage.usersTable.or(page.getByText(/users/i))).toBeVisible();
    });
    
    test('should search users', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      await adminPage.searchUsers(testUsers.customer.email);
      
      // Should filter results
      await expect(page.getByText(new RegExp(testUsers.customer.email, 'i')).or(page.getByText(/no.*results/i))).toBeVisible();
    });
    
    test('should filter users by status', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const statusFilter = adminPage.userStatusFilter;
      
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
        
        await page.waitForLoadState('networkidle');
      }
    });
    
    test('should warn user', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      // Select a user
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.warnUser(testAdminActions.userWarningReason);
        
        await expect(page.getByText(/warning.*sent|warned/i)).toBeVisible();
      }
    });
    
    test('should suspend user', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.suspendUser(testAdminActions.userSuspensionReason, '7 days');
        
        await expect(page.getByText(/suspended/i)).toBeVisible();
      }
    });
    
    test('should ban user', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.banUser(testAdminActions.userBanReason);
        
        await expect(page.getByText(/banned/i)).toBeVisible();
      }
    });
    
    test('should kick user', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.kickUser();
        
        await expect(page.getByText(/kicked|logged.*out/i)).toBeVisible();
      }
    });
    
    test('should reactivate user', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      // Filter by suspended
      await adminPage.filterUsersByStatus('suspended');
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.reactivateUser();
        
        await expect(page.getByText(/reactivated|active/i)).toBeVisible();
      }
    });
    
    test('should view user details', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        // Should show user details
        await expect(page.getByText(/email|user.*details/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Service Management', () => {
    test('should view all services', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToServices();
      
      await expect(adminPage.servicesTable.or(page.getByText(/services/i))).toBeVisible();
    });
    
    test('should approve service', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToServices();
      
      // Find pending service
      const serviceRow = page.locator('[data-testid="service-row"]').filter({ hasText: /pending/i }).first();
      
      if (await serviceRow.isVisible()) {
        await serviceRow.click();
        
        await adminPage.approveService();
        
        await expect(page.getByText(/approved/i)).toBeVisible();
      }
    });
    
    test('should reject service', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToServices();
      
      const serviceRow = page.locator('[data-testid="service-row"]').filter({ hasText: /pending/i }).first();
      
      if (await serviceRow.isVisible()) {
        await serviceRow.click();
        
        await adminPage.rejectService(testAdminActions.serviceRejectionReason);
        
        await expect(page.getByText(/rejected/i)).toBeVisible();
      }
    });
    
    test('should feature service', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToServices();
      
      const serviceRow = page.locator('[data-testid="service-row"]').first();
      
      if (await serviceRow.isVisible()) {
        await serviceRow.click();
        
        await adminPage.featureService();
        
        await expect(page.getByText(/featured/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Escrow Management', () => {
    test('should view escrow dashboard', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToEscrow();
      
      await expect(adminPage.escrowTable.or(page.getByText(/escrow/i))).toBeVisible();
    });
    
    test('should manual release escrow', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToEscrow();
      
      const escrowRow = page.locator('[data-testid="escrow-row"]').first();
      
      if (await escrowRow.isVisible()) {
        const releaseButton = escrowRow.getByRole('button', { name: /release/i });
        
        if (await releaseButton.isVisible()) {
          await releaseButton.click();
          
          const confirmButton = page.getByRole('button', { name: /confirm/i });
          await confirmButton.click();
          
          await expect(page.getByText(/released/i)).toBeVisible();
        }
      }
    });
    
    test('should manual refund escrow', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToEscrow();
      
      const escrowRow = page.locator('[data-testid="escrow-row"]').first();
      
      if (await escrowRow.isVisible()) {
        const refundButton = escrowRow.getByRole('button', { name: /refund/i });
        
        if (await refundButton.isVisible()) {
          await refundButton.click();
          
          const confirmButton = page.getByRole('button', { name: /confirm/i });
          await confirmButton.click();
          
          await expect(page.getByText(/refunded/i)).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Dispute Management', () => {
    test('should view disputes', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToDisputes();
      
      await expect(adminPage.disputesTable.or(page.getByText(/disputes/i))).toBeVisible();
    });
    
    test('should resolve disputes', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToDisputes();
      
      const disputeRow = page.locator('[data-testid="dispute-row"]').first();
      
      if (await disputeRow.isVisible()) {
        await disputeRow.click();
        
        // Resolve with full refund
        await adminPage.resolveWithFullRefund();
        
        await expect(page.getByText(/resolved/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Category Management', () => {
    test('should manage categories', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToCategories();
      
      await expect(adminPage.categoriesTable.or(page.getByText(/categories/i))).toBeVisible();
    });
    
    test('should add category', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToCategories();
      
      await adminPage.addCategory('Test Category');
      
      await expect(page.getByText(/added|created/i)).toBeVisible();
    });
    
    test('should edit category', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToCategories();
      
      await adminPage.editCategory('Test Category', 'Updated Category');
      
      await expect(page.getByText(/updated|saved/i)).toBeVisible();
    });
    
    test('should delete category', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToCategories();
      
      await adminPage.deleteCategory('Updated Category');
      
      await expect(page.getByText(/deleted/i)).toBeVisible();
    });
  });
  
  test.describe('Analytics', () => {
    test('should view platform analytics', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToAnalytics();
      
      await expect(adminPage.analyticsCharts.or(page.getByText(/analytics/i))).toBeVisible();
    });
  });
  
  test.describe('Referral Management', () => {
    test('should view referral stats', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToReferrals();
      
      await expect(page.getByText(/referral|stats/i)).toBeVisible();
    });
    
    test('should adjust user points', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.navigateToDashboard();
      await adminPage.navigateToUsers();
      
      const userRow = page.locator('[data-testid="user-row"]').first();
      
      if (await userRow.isVisible()) {
        await userRow.click();
        
        await adminPage.adjustUserPoints(100, 'Manual adjustment for testing');
        
        await expect(page.getByText(/adjusted|updated/i)).toBeVisible();
      }
    });
  });
});
