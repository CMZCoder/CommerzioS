import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Admin Page Object Model
 */
export class AdminPage extends BasePage {
  // Navigation
  readonly sidebar: Locator;
  readonly usersNav: Locator;
  readonly servicesNav: Locator;
  readonly bookingsNav: Locator;
  readonly disputesNav: Locator;
  readonly escrowNav: Locator;
  readonly categoriesNav: Locator;
  readonly analyticsNav: Locator;
  readonly referralsNav: Locator;
  
  // Users management
  readonly usersTable: Locator;
  readonly userSearchInput: Locator;
  readonly userStatusFilter: Locator;
  readonly warnUserButton: Locator;
  readonly suspendUserButton: Locator;
  readonly banUserButton: Locator;
  readonly kickUserButton: Locator;
  readonly reactivateUserButton: Locator;
  
  // Services management
  readonly servicesTable: Locator;
  readonly approveServiceButton: Locator;
  readonly rejectServiceButton: Locator;
  readonly featureServiceButton: Locator;
  
  // Disputes management
  readonly disputesTable: Locator;
  readonly disputeDetails: Locator;
  readonly markUnderReviewButton: Locator;
  readonly resolveDisputeButton: Locator;
  readonly refundFullButton: Locator;
  readonly releaseFullButton: Locator;
  readonly splitButton: Locator;
  
  // Escrow management
  readonly escrowTable: Locator;
  readonly manualReleaseButton: Locator;
  readonly manualRefundButton: Locator;
  
  // Categories management
  readonly categoriesTable: Locator;
  readonly addCategoryButton: Locator;
  readonly editCategoryButton: Locator;
  readonly deleteCategoryButton: Locator;
  
  // Analytics
  readonly analyticsCharts: Locator;
  readonly dateRangeSelector: Locator;
  
  // Points management
  readonly adjustPointsButton: Locator;
  readonly pointsInput: Locator;

  constructor(page: Page) {
    super(page);
    // Navigation
    this.sidebar = page.locator('[data-testid="admin-sidebar"]').or(page.locator('.admin-sidebar'));
    this.usersNav = page.getByRole('link', { name: /users/i }).or(page.locator('[data-testid="nav-users"]'));
    this.servicesNav = page.getByRole('link', { name: /services/i }).or(page.locator('[data-testid="nav-services"]'));
    this.bookingsNav = page.getByRole('link', { name: /bookings/i }).or(page.locator('[data-testid="nav-bookings"]'));
    this.disputesNav = page.getByRole('link', { name: /disputes/i }).or(page.locator('[data-testid="nav-disputes"]'));
    this.escrowNav = page.getByRole('link', { name: /escrow/i }).or(page.locator('[data-testid="nav-escrow"]'));
    this.categoriesNav = page.getByRole('link', { name: /categories/i }).or(page.locator('[data-testid="nav-categories"]'));
    this.analyticsNav = page.getByRole('link', { name: /analytics/i }).or(page.locator('[data-testid="nav-analytics"]'));
    this.referralsNav = page.getByRole('link', { name: /referrals/i }).or(page.locator('[data-testid="nav-referrals"]'));
    
    // Users
    this.usersTable = page.locator('[data-testid="users-table"]').or(page.locator('.users-table'));
    this.userSearchInput = page.getByPlaceholder(/search.*user/i).or(page.locator('[data-testid="user-search"]'));
    this.userStatusFilter = page.getByLabel(/status/i).or(page.locator('[data-testid="user-status-filter"]'));
    this.warnUserButton = page.getByRole('button', { name: /warn/i });
    this.suspendUserButton = page.getByRole('button', { name: /suspend/i });
    this.banUserButton = page.getByRole('button', { name: /ban/i });
    this.kickUserButton = page.getByRole('button', { name: /kick/i });
    this.reactivateUserButton = page.getByRole('button', { name: /reactivate|restore/i });
    
    // Services
    this.servicesTable = page.locator('[data-testid="services-table"]').or(page.locator('.services-table'));
    this.approveServiceButton = page.getByRole('button', { name: /approve/i });
    this.rejectServiceButton = page.getByRole('button', { name: /reject/i });
    this.featureServiceButton = page.getByRole('button', { name: /feature/i });
    
    // Disputes
    this.disputesTable = page.locator('[data-testid="disputes-table"]').or(page.locator('.disputes-table'));
    this.disputeDetails = page.locator('[data-testid="dispute-details"]').or(page.locator('.dispute-details'));
    this.markUnderReviewButton = page.getByRole('button', { name: /under.*review|review/i });
    this.resolveDisputeButton = page.getByRole('button', { name: /resolve/i });
    this.refundFullButton = page.getByRole('button', { name: /full.*refund/i });
    this.releaseFullButton = page.getByRole('button', { name: /full.*release/i });
    this.splitButton = page.getByRole('button', { name: /split/i });
    
    // Escrow
    this.escrowTable = page.locator('[data-testid="escrow-table"]').or(page.locator('.escrow-table'));
    this.manualReleaseButton = page.getByRole('button', { name: /manual.*release/i });
    this.manualRefundButton = page.getByRole('button', { name: /manual.*refund/i });
    
    // Categories
    this.categoriesTable = page.locator('[data-testid="categories-table"]').or(page.locator('.categories-table'));
    this.addCategoryButton = page.getByRole('button', { name: /add.*category/i });
    this.editCategoryButton = page.getByRole('button', { name: /edit/i });
    this.deleteCategoryButton = page.getByRole('button', { name: /delete/i });
    
    // Analytics
    this.analyticsCharts = page.locator('[data-testid="analytics-charts"]').or(page.locator('.analytics-charts'));
    this.dateRangeSelector = page.locator('[data-testid="date-range"]').or(page.getByLabel(/date.*range/i));
    
    // Points
    this.adjustPointsButton = page.getByRole('button', { name: /adjust.*points/i });
    this.pointsInput = page.getByLabel(/points/i).or(page.locator('input[name="points"]'));
  }

  /**
   * Navigate to admin dashboard
   */
  async navigateToDashboard(): Promise<void> {
    await this.goto('/admin');
  }

  /**
   * Navigate to users management
   */
  async navigateToUsers(): Promise<void> {
    await this.usersNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to services management
   */
  async navigateToServices(): Promise<void> {
    await this.servicesNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to disputes
   */
  async navigateToDisputes(): Promise<void> {
    await this.disputesNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to escrow dashboard
   */
  async navigateToEscrow(): Promise<void> {
    await this.escrowNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to categories
   */
  async navigateToCategories(): Promise<void> {
    await this.categoriesNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to analytics
   */
  async navigateToAnalytics(): Promise<void> {
    await this.analyticsNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Navigate to referrals
   */
  async navigateToReferrals(): Promise<void> {
    await this.referralsNav.click();
    await this.waitForPageLoad();
  }

  /**
   * Search users
   */
  async searchUsers(query: string): Promise<void> {
    await this.userSearchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoadingComplete();
  }

  /**
   * Filter users by status
   */
  async filterUsersByStatus(status: string): Promise<void> {
    await this.userStatusFilter.selectOption(status);
    await this.waitForLoadingComplete();
  }

  /**
   * Select user from table
   */
  async selectUser(email: string): Promise<void> {
    const userRow = this.usersTable.locator('tr').filter({ hasText: email });
    await userRow.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Warn user
   */
  async warnUser(reason: string): Promise<void> {
    await this.warnUserButton.click();
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|send/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Suspend user
   */
  async suspendUser(reason: string, duration?: string): Promise<void> {
    await this.suspendUserButton.click();
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    if (duration) {
      const durationInput = this.page.getByLabel(/duration/i);
      await durationInput.fill(duration);
    }
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|suspend/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Ban user
   */
  async banUser(reason: string): Promise<void> {
    await this.banUserButton.click();
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|ban/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Kick user (force logout)
   */
  async kickUser(): Promise<void> {
    await this.kickUserButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Reactivate user
   */
  async reactivateUser(): Promise<void> {
    await this.reactivateUserButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Approve service
   */
  async approveService(): Promise<void> {
    await this.approveServiceButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Reject service
   */
  async rejectService(reason: string): Promise<void> {
    await this.rejectServiceButton.click();
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|reject/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Feature service
   */
  async featureService(): Promise<void> {
    await this.featureServiceButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * View dispute details
   */
  async viewDispute(disputeId: number): Promise<void> {
    const disputeRow = this.disputesTable.locator('tr').filter({ hasText: disputeId.toString() });
    await disputeRow.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Mark dispute as under review
   */
  async markDisputeUnderReview(): Promise<void> {
    await this.markUnderReviewButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Resolve dispute with full refund
   */
  async resolveWithFullRefund(): Promise<void> {
    await this.refundFullButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Resolve dispute with full release
   */
  async resolveWithFullRelease(): Promise<void> {
    await this.releaseFullButton.click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Resolve dispute with split
   */
  async resolveWithSplit(customerPercentage: number): Promise<void> {
    await this.splitButton.click();
    
    const percentageInput = this.page.getByLabel(/percentage|customer/i);
    await percentageInput.fill(customerPercentage.toString());
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|resolve/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Manual escrow release
   */
  async manualEscrowRelease(escrowId: number): Promise<void> {
    const escrowRow = this.escrowTable.locator('tr').filter({ hasText: escrowId.toString() });
    await escrowRow.locator('[data-testid="release-button"]').or(this.manualReleaseButton).click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Manual escrow refund
   */
  async manualEscrowRefund(escrowId: number): Promise<void> {
    const escrowRow = this.escrowTable.locator('tr').filter({ hasText: escrowId.toString() });
    await escrowRow.locator('[data-testid="refund-button"]').or(this.manualRefundButton).click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Add new category
   */
  async addCategory(name: string, parentCategory?: string): Promise<void> {
    await this.addCategoryButton.click();
    
    const nameInput = this.page.getByLabel(/name/i);
    await nameInput.fill(name);
    
    if (parentCategory) {
      const parentSelect = this.page.getByLabel(/parent/i);
      await parentSelect.selectOption(parentCategory);
    }
    
    const saveButton = this.page.getByRole('button', { name: /save|create/i });
    await saveButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Edit category
   */
  async editCategory(oldName: string, newName: string): Promise<void> {
    const categoryRow = this.categoriesTable.locator('tr').filter({ hasText: oldName });
    await categoryRow.locator('[data-testid="edit-button"]').or(this.editCategoryButton).click();
    
    const nameInput = this.page.getByLabel(/name/i);
    await nameInput.fill(newName);
    
    const saveButton = this.page.getByRole('button', { name: /save|update/i });
    await saveButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Delete category
   */
  async deleteCategory(name: string): Promise<void> {
    const categoryRow = this.categoriesTable.locator('tr').filter({ hasText: name });
    await categoryRow.locator('[data-testid="delete-button"]').or(this.deleteCategoryButton).click();
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Adjust user points
   */
  async adjustUserPoints(amount: number, reason: string): Promise<void> {
    await this.adjustPointsButton.click();
    
    await this.pointsInput.fill(amount.toString());
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|adjust/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Set analytics date range
   */
  async setDateRange(start: string, end: string): Promise<void> {
    await this.dateRangeSelector.click();
    
    const startInput = this.page.getByLabel(/start/i);
    const endInput = this.page.getByLabel(/end/i);
    
    await startInput.fill(start);
    await endInput.fill(end);
    
    const applyButton = this.page.getByRole('button', { name: /apply/i });
    await applyButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Get analytics summary data
   */
  async getAnalyticsSummary(): Promise<{ [key: string]: string }> {
    const summary: { [key: string]: string } = {};
    
    const statsCards = this.page.locator('[data-testid="stats-card"]').or(this.page.locator('.stats-card'));
    const count = await statsCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = statsCards.nth(i);
      const label = await card.locator('.label').textContent();
      const value = await card.locator('.value').textContent();
      
      if (label && value) {
        summary[label] = value;
      }
    }
    
    return summary;
  }
}
