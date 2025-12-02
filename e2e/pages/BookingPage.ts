import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Booking Page Object Model
 */
export class BookingPage extends BasePage {
  // Booking form elements
  readonly dateInput: Locator;
  readonly timeSlots: Locator;
  readonly pricingOptions: Locator;
  readonly messageInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  
  // Calendar elements
  readonly calendar: Locator;
  readonly nextMonthButton: Locator;
  readonly prevMonthButton: Locator;
  readonly availableDates: Locator;
  readonly unavailableDates: Locator;
  
  // Booking details
  readonly bookingId: Locator;
  readonly bookingStatus: Locator;
  readonly bookingService: Locator;
  readonly bookingDate: Locator;
  readonly bookingPrice: Locator;
  readonly bookingVendor: Locator;
  
  // Booking actions
  readonly acceptButton: Locator;
  readonly rejectButton: Locator;
  readonly proposeAlternativeButton: Locator;
  readonly cancelBookingButton: Locator;
  readonly startServiceButton: Locator;
  readonly completeServiceButton: Locator;
  readonly markNoShowButton: Locator;

  constructor(page: Page) {
    super(page);
    // Form elements
    this.dateInput = page.getByLabel(/date/i).or(page.locator('input[type="date"]'));
    this.timeSlots = page.locator('[data-testid="time-slot"]').or(page.locator('.time-slot'));
    this.pricingOptions = page.locator('[data-testid="pricing-option"]').or(page.locator('.pricing-option'));
    this.messageInput = page.getByLabel(/message|note/i).or(page.locator('textarea[name="message"]'));
    this.submitButton = page.getByRole('button', { name: /book|submit|confirm/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    
    // Calendar
    this.calendar = page.locator('[data-testid="calendar"]').or(page.locator('.calendar'));
    this.nextMonthButton = page.getByRole('button', { name: /next.*month|>/i });
    this.prevMonthButton = page.getByRole('button', { name: /prev.*month|</i });
    this.availableDates = page.locator('[data-testid="available-date"]').or(page.locator('.available-date'));
    this.unavailableDates = page.locator('[data-testid="unavailable-date"]').or(page.locator('.unavailable-date'));
    
    // Booking details
    this.bookingId = page.locator('[data-testid="booking-id"]');
    this.bookingStatus = page.locator('[data-testid="booking-status"]').or(page.locator('.booking-status'));
    this.bookingService = page.locator('[data-testid="booking-service"]');
    this.bookingDate = page.locator('[data-testid="booking-date"]');
    this.bookingPrice = page.locator('[data-testid="booking-price"]');
    this.bookingVendor = page.locator('[data-testid="booking-vendor"]');
    
    // Actions
    this.acceptButton = page.getByRole('button', { name: /accept/i });
    this.rejectButton = page.getByRole('button', { name: /reject|decline/i });
    this.proposeAlternativeButton = page.getByRole('button', { name: /propose.*alternative|suggest.*time/i });
    this.cancelBookingButton = page.getByRole('button', { name: /cancel.*booking/i });
    this.startServiceButton = page.getByRole('button', { name: /start.*service/i });
    this.completeServiceButton = page.getByRole('button', { name: /complete|mark.*complete/i });
    this.markNoShowButton = page.getByRole('button', { name: /no.*show/i });
  }

  /**
   * Navigate to booking page
   */
  async navigateToBooking(serviceId: number): Promise<void> {
    await this.goto(`/book-service?serviceId=${serviceId}`);
  }

  /**
   * Navigate to my bookings
   */
  async navigateToMyBookings(): Promise<void> {
    await this.goto('/bookings');
  }

  /**
   * Navigate to vendor bookings
   */
  async navigateToVendorBookings(): Promise<void> {
    await this.goto('/vendor-bookings');
  }

  /**
   * Navigate to specific booking detail
   */
  async navigateToBookingDetail(bookingId: number): Promise<void> {
    await this.goto(`/bookings/${bookingId}`);
  }

  /**
   * Select date
   */
  async selectDate(date: string): Promise<void> {
    // Click on date input
    await this.dateInput.click();
    
    // Select the date from calendar
    const [year, month, day] = date.split('-');
    const dayButton = this.page.getByRole('button', { name: new RegExp(`^${parseInt(day)}$`) });
    
    // Navigate to correct month if needed
    // For simplicity, we'll just click on the day if visible
    await dayButton.first().click();
  }

  /**
   * Select time slot
   */
  async selectTimeSlot(time: string): Promise<void> {
    const slot = this.timeSlots.filter({ hasText: time });
    await slot.first().click();
  }

  /**
   * Select first available time slot
   */
  async selectFirstAvailableSlot(): Promise<void> {
    await this.timeSlots.first().click();
  }

  /**
   * Select pricing option
   */
  async selectPricingOption(optionName: string): Promise<void> {
    const option = this.pricingOptions.filter({ hasText: optionName });
    await option.click();
  }

  /**
   * Enter message
   */
  async enterMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
  }

  /**
   * Submit booking
   */
  async submitBooking(): Promise<void> {
    await this.submitButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Create complete booking
   */
  async createBooking(options: {
    date: string;
    time?: string;
    pricingOption?: string;
    message?: string;
  }): Promise<void> {
    await this.selectDate(options.date);
    
    if (options.time) {
      await this.selectTimeSlot(options.time);
    } else {
      await this.selectFirstAvailableSlot();
    }
    
    if (options.pricingOption) {
      await this.selectPricingOption(options.pricingOption);
    }
    
    if (options.message) {
      await this.enterMessage(options.message);
    }
    
    await this.submitBooking();
  }

  /**
   * Get booking status
   */
  async getBookingStatus(): Promise<string> {
    const content = await this.bookingStatus.textContent();
    return content || '';
  }

  /**
   * Accept booking (vendor action)
   */
  async acceptBooking(): Promise<void> {
    await this.acceptButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Reject booking (vendor action)
   */
  async rejectBooking(reason?: string): Promise<void> {
    await this.rejectButton.click();
    
    // If a reason modal appears, fill it
    const reasonInput = this.page.getByLabel(/reason/i);
    if (await reasonInput.isVisible()) {
      await reasonInput.fill(reason || 'Not available');
      const confirmButton = this.page.getByRole('button', { name: /confirm|submit/i });
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Propose alternative time
   */
  async proposeAlternative(date: string, time: string): Promise<void> {
    await this.proposeAlternativeButton.click();
    
    // Fill alternative time form
    const altDateInput = this.page.getByLabel(/date/i);
    const altTimeInput = this.page.getByLabel(/time/i);
    
    await altDateInput.fill(date);
    await altTimeInput.fill(time);
    
    const confirmButton = this.page.getByRole('button', { name: /propose|confirm/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Cancel booking
   */
  async cancelBooking(reason?: string): Promise<void> {
    await this.cancelBookingButton.click();
    
    // Confirm cancellation if dialog appears
    const confirmDialog = this.page.getByRole('dialog');
    if (await confirmDialog.isVisible()) {
      const reasonInput = this.page.getByLabel(/reason/i);
      if (await reasonInput.isVisible() && reason) {
        await reasonInput.fill(reason);
      }
      
      const confirmButton = confirmDialog.getByRole('button', { name: /confirm|yes/i });
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Start service
   */
  async startService(): Promise<void> {
    await this.startServiceButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Complete service
   */
  async completeService(): Promise<void> {
    await this.completeServiceButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Mark as no show
   */
  async markNoShow(): Promise<void> {
    await this.markNoShowButton.click();
    
    // Confirm action
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Get available time slots
   */
  async getAvailableTimeSlots(): Promise<string[]> {
    const slots = await this.timeSlots.allTextContents();
    return slots;
  }

  /**
   * Get available dates count
   */
  async getAvailableDatesCount(): Promise<number> {
    return this.availableDates.count();
  }

  /**
   * Navigate to next month
   */
  async goToNextMonth(): Promise<void> {
    await this.nextMonthButton.click();
  }

  /**
   * Navigate to previous month
   */
  async goToPreviousMonth(): Promise<void> {
    await this.prevMonthButton.click();
  }

  /**
   * Verify booking confirmation
   */
  async verifyBookingConfirmed(): Promise<void> {
    // Check for confirmation message or booking ID
    await expect(this.bookingId.or(this.page.getByText(/booking.*confirmed|success/i))).toBeVisible();
  }

  /**
   * Get all bookings
   */
  async getAllBookings(): Promise<Locator> {
    return this.page.locator('[data-testid="booking-item"]').or(this.page.locator('.booking-item'));
  }

  /**
   * Filter bookings by status
   */
  async filterByStatus(status: string): Promise<void> {
    const statusFilter = this.page.getByLabel(/status/i).or(this.page.locator('[data-testid="status-filter"]'));
    await statusFilter.click();
    await this.page.getByRole('option', { name: new RegExp(status, 'i') }).click();
    await this.waitForLoadingComplete();
  }
}
