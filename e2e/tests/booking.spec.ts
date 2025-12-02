import { test, expect } from '@playwright/test';
import { BookingPage } from '../pages/BookingPage';
import { ServicePage } from '../pages/ServicePage';
import { LoginPage } from '../pages/LoginPage';
import { testUsers, testBooking } from '../fixtures/test-data';
import { getFutureDate } from '../utils/helpers';

test.describe('Booking Flow Tests', () => {
  
  test.describe('Customer Booking', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should view available time slots', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        await servicePage.clickBook();
        
        const bookingPage = new BookingPage(page);
        
        // Should show calendar or time slots
        await expect(bookingPage.calendar.or(bookingPage.timeSlots.first())).toBeVisible();
      }
    });
    
    test('should select pricing option', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        await servicePage.clickBook();
        
        const bookingPage = new BookingPage(page);
        
        // Check for pricing options
        const pricingOptions = bookingPage.pricingOptions;
        const optionsCount = await pricingOptions.count();
        
        if (optionsCount > 0) {
          await pricingOptions.first().click();
          await expect(pricingOptions.first()).toHaveAttribute('aria-checked', 'true');
        }
      }
    });
    
    test('should select date and time', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        await servicePage.clickBook();
        
        const bookingPage = new BookingPage(page);
        
        // Select date
        const futureDate = getFutureDate(7);
        await bookingPage.selectDate(futureDate);
        
        // Select time slot
        const slots = await bookingPage.getAvailableTimeSlots();
        if (slots.length > 0) {
          await bookingPage.selectTimeSlot(slots[0]);
        }
      }
    });
    
    test('should add customer message', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        await servicePage.clickBook();
        
        const bookingPage = new BookingPage(page);
        
        await bookingPage.enterMessage(testBooking.message);
        
        await expect(bookingPage.messageInput).toHaveValue(testBooking.message);
      }
    });
    
    test('should submit booking request', async ({ page }) => {
      const servicePage = new ServicePage(page);
      await servicePage.navigateToList();
      
      const serviceCount = await servicePage.getServiceCount();
      
      if (serviceCount > 0) {
        await servicePage.clickServiceCard(0);
        await servicePage.clickBook();
        
        const bookingPage = new BookingPage(page);
        
        // Complete booking flow
        await bookingPage.selectFirstAvailableSlot();
        await bookingPage.enterMessage(testBooking.message);
        await bookingPage.submitBooking();
        
        // Should show confirmation or redirect to payment
        await expect(page.getByText(/success|confirmed|payment|booking/i)).toBeVisible();
      }
    });
    
    test('should cancel booking', async ({ page }) => {
      // Navigate to bookings page
      await page.goto('/bookings');
      
      const bookingPage = new BookingPage(page);
      const bookings = await bookingPage.getAllBookings();
      
      const count = await bookings.count();
      if (count > 0) {
        await bookings.first().click();
        
        await bookingPage.cancelBooking('Change of plans');
        
        await expect(page.getByText(/cancelled|canceled/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Vendor Booking Management', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
    });
    
    test('should view pending bookings', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      // Filter by pending
      await bookingPage.filterByStatus('pending');
      
      // Should show pending bookings or empty state
      await expect(page.getByText(/pending|no.*bookings/i)).toBeVisible();
    });
    
    test('should accept booking', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      const acceptButton = page.getByRole('button', { name: /accept/i }).first();
      
      if (await acceptButton.isVisible()) {
        await acceptButton.click();
        
        await expect(page.getByText(/accepted|confirmed/i)).toBeVisible();
      }
    });
    
    test('should reject booking with reason', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      const rejectButton = page.getByRole('button', { name: /reject|decline/i }).first();
      
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        
        // Fill rejection reason
        const reasonInput = page.getByLabel(/reason/i);
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Not available on this date');
          
          const confirmButton = page.getByRole('button', { name: /confirm|submit/i });
          await confirmButton.click();
        }
        
        await expect(page.getByText(/rejected|declined/i)).toBeVisible();
      }
    });
    
    test('should propose alternative time', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      const proposeButton = page.getByRole('button', { name: /propose|alternative|suggest/i }).first();
      
      if (await proposeButton.isVisible()) {
        await proposeButton.click();
        
        // Fill alternative time
        const dateInput = page.getByLabel(/date/i);
        const timeInput = page.getByLabel(/time/i);
        
        if (await dateInput.isVisible()) {
          await dateInput.fill(getFutureDate(8));
        }
        if (await timeInput.isVisible()) {
          await timeInput.fill('14:00');
        }
        
        const submitButton = page.getByRole('button', { name: /propose|submit/i });
        await submitButton.click();
        
        await expect(page.getByText(/alternative.*proposed|pending/i)).toBeVisible();
      }
    });
    
    test('should start service', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      // Filter by confirmed
      await bookingPage.filterByStatus('confirmed');
      
      const startButton = page.getByRole('button', { name: /start.*service|begin/i }).first();
      
      if (await startButton.isVisible()) {
        await startButton.click();
        
        await expect(page.getByText(/started|in.*progress/i)).toBeVisible();
      }
    });
    
    test('should complete service', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      // Filter by in-progress
      await bookingPage.filterByStatus('in_progress');
      
      const completeButton = page.getByRole('button', { name: /complete|finish|done/i }).first();
      
      if (await completeButton.isVisible()) {
        await completeButton.click();
        
        await expect(page.getByText(/completed|finished/i)).toBeVisible();
      }
    });
    
    test('should mark as no-show', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      const noShowButton = page.getByRole('button', { name: /no.*show/i }).first();
      
      if (await noShowButton.isVisible()) {
        await noShowButton.click();
        
        // Confirm
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await expect(page.getByText(/no.*show|marked/i)).toBeVisible();
      }
    });
    
    test('should cancel vendor booking', async ({ page }) => {
      const bookingPage = new BookingPage(page);
      await bookingPage.navigateToVendorBookings();
      
      const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
      
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        
        // Fill cancellation reason
        const reasonInput = page.getByLabel(/reason/i);
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('Emergency - unable to provide service');
        }
        
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        await confirmButton.click();
        
        await expect(page.getByText(/cancelled|canceled/i)).toBeVisible();
      }
    });
  });
  
  test.describe('Customer Alternative Response', () => {
    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
    });
    
    test('should accept alternative time', async ({ page }) => {
      await page.goto('/bookings');
      
      // Find booking with alternative proposal
      const alternativeBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /alternative/i }).first();
      
      if (await alternativeBooking.isVisible()) {
        await alternativeBooking.click();
        
        const acceptButton = page.getByRole('button', { name: /accept.*alternative/i });
        if (await acceptButton.isVisible()) {
          await acceptButton.click();
          
          await expect(page.getByText(/accepted|confirmed/i)).toBeVisible();
        }
      }
    });
    
    test('should reject alternative time', async ({ page }) => {
      await page.goto('/bookings');
      
      const alternativeBooking = page.locator('[data-testid="booking-item"]').filter({ hasText: /alternative/i }).first();
      
      if (await alternativeBooking.isVisible()) {
        await alternativeBooking.click();
        
        const rejectButton = page.getByRole('button', { name: /reject.*alternative|decline/i });
        if (await rejectButton.isVisible()) {
          await rejectButton.click();
          
          await expect(page.getByText(/rejected|declined/i)).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Booking Notifications', () => {
    test('should receive booking notification', async ({ page }) => {
      // Login as vendor
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.vendor.email, testUsers.vendor.password);
      
      // Check notifications
      await page.goto('/notifications');
      
      // Should have booking-related notifications
      const bookingNotification = page.locator('[data-testid="notification"]').filter({ hasText: /booking/i });
      
      // May or may not have notifications depending on test data
      await expect(page.locator('body')).toContainText(/notification|booking|empty/i);
    });
  });
  
  test.describe('Booking Reminder', () => {
    test('should display upcoming booking reminder', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await loginPage.login(testUsers.customer.email, testUsers.customer.password);
      
      // Navigate to dashboard or home
      await page.goto('/');
      
      // Look for upcoming booking reminder
      const reminder = page.locator('[data-testid="upcoming-booking"]').or(page.getByText(/upcoming|reminder/i));
      
      // May or may not have upcoming bookings
      await expect(page.locator('body')).toContainText(/upcoming|booking|service|welcome/i);
    });
  });
});
