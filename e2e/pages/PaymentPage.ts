import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Payment Page Object Model
 */
export class PaymentPage extends BasePage {
  // Payment method selection
  readonly paymentMethodSelector: Locator;
  readonly cardPaymentOption: Locator;
  readonly twintPaymentOption: Locator;
  readonly cashPaymentOption: Locator;
  
  // Card payment elements
  readonly cardNumberInput: Locator;
  readonly cardExpiryInput: Locator;
  readonly cardCvcInput: Locator;
  readonly cardZipInput: Locator;
  readonly cardHolderInput: Locator;
  
  // Payment summary
  readonly paymentAmount: Locator;
  readonly serviceFee: Locator;
  readonly totalAmount: Locator;
  
  // Action buttons
  readonly payButton: Locator;
  readonly cancelButton: Locator;
  
  // Status and messages
  readonly paymentStatus: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  
  // Escrow elements
  readonly releaseButton: Locator;
  readonly confirmCompletionButton: Locator;
  readonly requestRefundButton: Locator;
  readonly disputeButton: Locator;
  
  // TWINT specific
  readonly twintEligibilityMessage: Locator;
  readonly twintInstructions: Locator;
  readonly twintQrCode: Locator;
  
  // 3D Secure frame selector (not a Locator)
  readonly threeDSecureFrameSelector: string;

  constructor(page: Page) {
    super(page);
    // Payment method selection
    this.paymentMethodSelector = page.locator('[data-testid="payment-method-selector"]').or(page.locator('.payment-methods'));
    this.cardPaymentOption = page.getByRole('radio', { name: /card|credit.*card/i }).or(page.locator('[data-testid="card-payment"]'));
    this.twintPaymentOption = page.getByRole('radio', { name: /twint/i }).or(page.locator('[data-testid="twint-payment"]'));
    this.cashPaymentOption = page.getByRole('radio', { name: /cash/i }).or(page.locator('[data-testid="cash-payment"]'));
    
    // Card inputs - Stripe Elements
    this.cardNumberInput = page.locator('[data-testid="card-number"]');
    this.cardExpiryInput = page.locator('[data-testid="card-expiry"]');
    this.cardCvcInput = page.locator('[data-testid="card-cvc"]');
    this.cardZipInput = page.locator('[data-testid="card-zip"]').or(page.locator('input[name="postal"]'));
    this.cardHolderInput = page.locator('[data-testid="card-holder"]').or(page.locator('input[name="cardHolder"]'));
    
    // Summary
    this.paymentAmount = page.locator('[data-testid="payment-amount"]').or(page.locator('.payment-amount'));
    this.serviceFee = page.locator('[data-testid="service-fee"]').or(page.locator('.service-fee'));
    this.totalAmount = page.locator('[data-testid="total-amount"]').or(page.locator('.total-amount'));
    
    // Buttons
    this.payButton = page.getByRole('button', { name: /pay|confirm.*payment/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    
    // Status
    this.paymentStatus = page.locator('[data-testid="payment-status"]').or(page.locator('.payment-status'));
    this.errorMessage = page.locator('[data-testid="payment-error"]').or(page.getByRole('alert'));
    this.successMessage = page.locator('[data-testid="payment-success"]').or(page.locator('.payment-success'));
    
    // Escrow
    this.releaseButton = page.getByRole('button', { name: /release.*funds|release.*payment/i });
    this.confirmCompletionButton = page.getByRole('button', { name: /confirm.*completion|service.*complete/i });
    this.requestRefundButton = page.getByRole('button', { name: /request.*refund|refund/i });
    this.disputeButton = page.getByRole('button', { name: /dispute|raise.*dispute/i });
    
    // TWINT
    this.twintEligibilityMessage = page.locator('[data-testid="twint-eligibility"]').or(page.locator('.twint-eligibility'));
    this.twintInstructions = page.locator('[data-testid="twint-instructions"]').or(page.locator('.twint-instructions'));
    this.twintQrCode = page.locator('[data-testid="twint-qr"]').or(page.locator('.twint-qr img'));
    
    // 3D Secure frame selector
    this.threeDSecureFrameSelector = 'iframe[name*="stripe"], iframe[src*="stripe"]';
  }

  /**
   * Navigate to payment page
   */
  async navigateToPayment(bookingId: number): Promise<void> {
    await this.goto(`/payment?bookingId=${bookingId}`);
  }

  /**
   * Select card payment
   */
  async selectCardPayment(): Promise<void> {
    await this.cardPaymentOption.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Select TWINT payment
   */
  async selectTwintPayment(): Promise<void> {
    await this.twintPaymentOption.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Select cash payment
   */
  async selectCashPayment(): Promise<void> {
    await this.cashPaymentOption.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Fill card details for Stripe Elements
   */
  async fillCardDetails(card: {
    number: string;
    exp: string;
    cvc: string;
    zip?: string;
  }): Promise<void> {
    // Try to find and fill Stripe Elements
    const stripeFrame = this.page.frameLocator('iframe[name*="__privateStripe"]').first();
    
    try {
      // For Stripe Elements, we need to type into the iframe
      const cardInput = stripeFrame.locator('input[name="cardnumber"]');
      if (await cardInput.isVisible()) {
        await cardInput.fill(card.number);
      }
      
      const expInput = stripeFrame.locator('input[name="exp-date"]');
      if (await expInput.isVisible()) {
        await expInput.fill(card.exp);
      }
      
      const cvcInput = stripeFrame.locator('input[name="cvc"]');
      if (await cvcInput.isVisible()) {
        await cvcInput.fill(card.cvc);
      }
    } catch {
      // Fallback for different Stripe Element implementations
      // Try using the unified card input
      const unifiedCardFrame = this.page.frameLocator('iframe[title*="Secure card"]').first();
      const unifiedInput = unifiedCardFrame.locator('input');
      
      if (await unifiedInput.first().isVisible()) {
        await unifiedInput.first().fill(`${card.number}${card.exp}${card.cvc}`);
      }
    }
    
    // Fill postal code if outside stripe frame
    if (card.zip && await this.cardZipInput.isVisible()) {
      await this.cardZipInput.fill(card.zip);
    }
  }

  /**
   * Submit payment
   */
  async submitPayment(): Promise<void> {
    await this.payButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Complete card payment
   */
  async payWithCard(card: {
    number: string;
    exp: string;
    cvc: string;
    zip?: string;
  }): Promise<void> {
    await this.selectCardPayment();
    await this.fillCardDetails(card);
    await this.submitPayment();
  }

  /**
   * Handle 3D Secure authentication
   */
  async handle3DSecure(action: 'complete' | 'fail'): Promise<void> {
    // Wait for 3DS frame to appear
    const frame = this.page.frameLocator('iframe[name*="stripe-challenge"]');
    
    if (action === 'complete') {
      // Click complete/authorize button in 3DS frame
      const completeButton = frame.getByRole('button', { name: /complete|authorize|continue/i });
      await completeButton.click();
    } else {
      // Click fail/cancel button
      const failButton = frame.getByRole('button', { name: /fail|cancel/i });
      await failButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Check TWINT eligibility
   */
  async isTwintEligible(): Promise<boolean> {
    await this.selectTwintPayment();
    
    // Check if TWINT option is enabled or eligibility message shows eligible
    const isDisabled = await this.twintPaymentOption.isDisabled();
    if (isDisabled) return false;
    
    // Check for eligibility message
    const eligibilityText = await this.twintEligibilityMessage.textContent();
    return !eligibilityText?.toLowerCase().includes('not eligible');
  }

  /**
   * Get TWINT eligibility reasons
   */
  async getTwintEligibilityReasons(): Promise<string[]> {
    const reasons: string[] = [];
    const reasonElements = this.page.locator('[data-testid="twint-reason"]').or(this.page.locator('.twint-reason'));
    
    const count = await reasonElements.count();
    for (let i = 0; i < count; i++) {
      const text = await reasonElements.nth(i).textContent();
      if (text) reasons.push(text);
    }
    
    return reasons;
  }

  /**
   * Complete cash payment
   */
  async payWithCash(): Promise<void> {
    await this.selectCashPayment();
    await this.submitPayment();
  }

  /**
   * Confirm service completion (releases escrow)
   */
  async confirmServiceCompletion(): Promise<void> {
    await this.confirmCompletionButton.click();
    
    // Confirm dialog if present
    const confirmDialog = this.page.getByRole('dialog');
    if (await confirmDialog.isVisible()) {
      await confirmDialog.getByRole('button', { name: /confirm|yes/i }).click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Request refund
   */
  async requestRefund(reason: string): Promise<void> {
    await this.requestRefundButton.click();
    
    // Fill refund reason
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const submitButton = this.page.getByRole('button', { name: /submit|request/i });
    await submitButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Raise dispute
   */
  async raiseDispute(reason: string, description: string): Promise<void> {
    await this.disputeButton.click();
    
    // Fill dispute form
    const reasonSelect = this.page.getByLabel(/reason/i);
    await reasonSelect.selectOption(reason);
    
    const descriptionInput = this.page.getByLabel(/description|details/i);
    await descriptionInput.fill(description);
    
    const submitButton = this.page.getByRole('button', { name: /submit|raise/i });
    await submitButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(): Promise<string> {
    const content = await this.paymentStatus.textContent();
    return content || '';
  }

  /**
   * Check if payment was successful
   */
  async isPaymentSuccessful(): Promise<boolean> {
    return this.isVisible(this.successMessage);
  }

  /**
   * Check if there's a payment error
   */
  async hasPaymentError(): Promise<boolean> {
    return this.isVisible(this.errorMessage);
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      const content = await this.errorMessage.textContent();
      return content || '';
    }
    return '';
  }

  /**
   * Get total amount
   */
  async getTotalAmount(): Promise<string> {
    const content = await this.totalAmount.textContent();
    return content || '';
  }

  /**
   * Cancel payment
   */
  async cancelPayment(): Promise<void> {
    await this.cancelButton.click();
    
    // Confirm cancellation if dialog appears
    const confirmButton = this.page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    await this.waitForLoadingComplete();
  }

  /**
   * Wait for payment processing
   */
  async waitForPaymentProcessing(): Promise<void> {
    // Wait for loading indicator
    await this.page.waitForSelector('[data-testid="payment-processing"]', { state: 'hidden', timeout: 30000 });
  }

  /**
   * Verify payment success
   */
  async verifyPaymentSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  /**
   * Approve refund (vendor action)
   */
  async approveRefund(): Promise<void> {
    const approveButton = this.page.getByRole('button', { name: /approve.*refund/i });
    await approveButton.click();
    await this.waitForLoadingComplete();
  }

  /**
   * Reject refund (vendor action)
   */
  async rejectRefund(reason: string): Promise<void> {
    const rejectButton = this.page.getByRole('button', { name: /reject.*refund/i });
    await rejectButton.click();
    
    const reasonInput = this.page.getByLabel(/reason/i);
    await reasonInput.fill(reason);
    
    const confirmButton = this.page.getByRole('button', { name: /confirm|submit/i });
    await confirmButton.click();
    
    await this.waitForLoadingComplete();
  }

  /**
   * Confirm cash received (vendor action)
   */
  async confirmCashReceived(): Promise<void> {
    const confirmButton = this.page.getByRole('button', { name: /confirm.*cash|received.*cash/i });
    await confirmButton.click();
    await this.waitForLoadingComplete();
  }
}
