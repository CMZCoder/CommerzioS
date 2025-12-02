import { Page, FrameLocator } from '@playwright/test';
import { stripeTestCards } from '../fixtures/test-data';

/**
 * Stripe mock utilities for E2E tests
 * Helps with testing Stripe payment flows in test mode
 */

/**
 * Fill Stripe Elements card form
 * Handles different versions of Stripe Elements
 */
export async function fillStripeCard(
  page: Page,
  card: typeof stripeTestCards.success
): Promise<void> {
  // Try to find the Stripe iframe
  const stripeFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
  
  // Check if it's a unified card element or split elements
  try {
    // Try unified card element first
    const unifiedInput = stripeFrame.locator('input[name="cardnumber"]');
    
    if (await unifiedInput.isVisible({ timeout: 3000 })) {
      // Type card number
      await unifiedInput.type(card.number, { delay: 50 });
      
      // Type expiry
      const expiryInput = stripeFrame.locator('input[name="exp-date"]');
      await expiryInput.type(card.exp.replace('/', ''), { delay: 50 });
      
      // Type CVC
      const cvcInput = stripeFrame.locator('input[name="cvc"]');
      await cvcInput.type(card.cvc, { delay: 50 });
    }
  } catch {
    // Try split elements approach
    await fillStripeSplitElements(page, card);
  }
}

/**
 * Fill Stripe split elements (separate iframes for each field)
 */
async function fillStripeSplitElements(
  page: Page,
  card: typeof stripeTestCards.success
): Promise<void> {
  // Card number iframe
  const cardNumberFrame = page.frameLocator('iframe[title*="card number"]');
  const cardNumberInput = cardNumberFrame.locator('input[name="cardnumber"]');
  await cardNumberInput.type(card.number, { delay: 50 });
  
  // Expiry iframe
  const expiryFrame = page.frameLocator('iframe[title*="expiration"]');
  const expiryInput = expiryFrame.locator('input');
  await expiryInput.type(card.exp.replace('/', ''), { delay: 50 });
  
  // CVC iframe
  const cvcFrame = page.frameLocator('iframe[title*="CVC"]');
  const cvcInput = cvcFrame.locator('input');
  await cvcInput.type(card.cvc, { delay: 50 });
}

/**
 * Fill Stripe payment element (newer unified element)
 */
export async function fillStripePaymentElement(
  page: Page,
  card: typeof stripeTestCards.success
): Promise<void> {
  // Wait for Stripe Payment Element to load
  const paymentFrame = page.frameLocator('iframe[title*="Secure payment input frame"]');
  
  // Select card payment method if not already selected
  const cardOption = paymentFrame.getByText(/Card/i);
  if (await cardOption.isVisible()) {
    await cardOption.click();
  }
  
  // Fill card details
  const cardNumberInput = paymentFrame.locator('input[name="number"]');
  await cardNumberInput.type(card.number, { delay: 50 });
  
  const expiryInput = paymentFrame.locator('input[name="expiry"]');
  await expiryInput.type(card.exp.replace('/', ''), { delay: 50 });
  
  const cvcInput = paymentFrame.locator('input[name="cvc"]');
  await cvcInput.type(card.cvc, { delay: 50 });
  
  // Fill postal code if visible
  const zipInput = paymentFrame.locator('input[name="postal"]');
  if (await zipInput.isVisible() && card.zip) {
    await zipInput.type(card.zip, { delay: 50 });
  }
}

/**
 * Handle 3D Secure authentication challenge
 */
export async function handle3DSecureChallenge(
  page: Page,
  action: 'complete' | 'fail' | 'cancel' = 'complete'
): Promise<void> {
  // Wait for 3DS frame to appear
  await page.waitForTimeout(2000);
  
  // Try to find the 3DS challenge frame
  const challengeFrame = page.frameLocator('iframe[name*="stripe-challenge"]');
  
  try {
    switch (action) {
      case 'complete':
        // Click the "Complete authentication" button in Stripe test mode
        const completeButton = challengeFrame.getByRole('button', { name: /complete|authorize|continue/i });
        await completeButton.click({ timeout: 10000 });
        break;
        
      case 'fail':
        // Click the "Fail authentication" button in Stripe test mode
        const failButton = challengeFrame.getByRole('button', { name: /fail/i });
        await failButton.click({ timeout: 10000 });
        break;
        
      case 'cancel':
        // Click cancel or close the frame
        const cancelButton = challengeFrame.getByRole('button', { name: /cancel|close/i });
        await cancelButton.click({ timeout: 10000 });
        break;
    }
  } catch {
    // If we can't find buttons, the test mode might auto-complete
    console.log('3DS challenge frame not found or auto-completed');
  }
  
  // Wait for the challenge to complete
  await page.waitForTimeout(1000);
}

/**
 * Wait for Stripe Elements to load
 */
export async function waitForStripeElements(page: Page, timeout: number = 10000): Promise<void> {
  await page.waitForSelector('iframe[name*="__stripe"]', { timeout });
}

/**
 * Check if payment requires 3D Secure
 */
export async function requires3DSecure(page: Page): Promise<boolean> {
  try {
    const challengeFrame = page.frameLocator('iframe[name*="stripe-challenge"]');
    await challengeFrame.locator('body').waitFor({ timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get payment status from page
 */
export async function getPaymentStatus(page: Page): Promise<'success' | 'failed' | 'pending'> {
  // Check for success indicators
  const successIndicators = [
    page.locator('[data-testid="payment-success"]'),
    page.getByText(/payment.*successful|payment.*complete/i),
    page.locator('.payment-success'),
  ];
  
  for (const indicator of successIndicators) {
    if (await indicator.isVisible({ timeout: 1000 })) {
      return 'success';
    }
  }
  
  // Check for failure indicators
  const failureIndicators = [
    page.locator('[data-testid="payment-error"]'),
    page.getByText(/payment.*failed|declined|error/i),
    page.locator('.payment-error'),
  ];
  
  for (const indicator of failureIndicators) {
    if (await indicator.isVisible({ timeout: 1000 })) {
      return 'failed';
    }
  }
  
  return 'pending';
}

/**
 * Mock Stripe webhook event (for backend testing)
 */
export async function mockStripeWebhook(
  page: Page,
  eventType: string,
  data: object
): Promise<void> {
  await page.request.post('/api/test/stripe-webhook', {
    data: {
      type: eventType,
      data,
    },
  });
}

/**
 * Get test card by type
 */
export function getTestCard(type: keyof typeof stripeTestCards): typeof stripeTestCards.success {
  return stripeTestCards[type];
}

/**
 * Simulate successful payment flow
 */
export async function simulateSuccessfulPayment(page: Page): Promise<void> {
  await fillStripeCard(page, stripeTestCards.success);
  
  const payButton = page.getByRole('button', { name: /pay|confirm/i });
  await payButton.click();
  
  // Wait for payment processing
  await page.waitForTimeout(3000);
}

/**
 * Simulate declined payment
 */
export async function simulateDeclinedPayment(page: Page): Promise<void> {
  await fillStripeCard(page, stripeTestCards.declined);
  
  const payButton = page.getByRole('button', { name: /pay|confirm/i });
  await payButton.click();
  
  // Wait for payment to be declined
  await page.waitForTimeout(3000);
}

/**
 * Simulate 3D Secure payment
 */
export async function simulate3DSecurePayment(
  page: Page,
  complete: boolean = true
): Promise<void> {
  await fillStripeCard(page, stripeTestCards.threeDSecure);
  
  const payButton = page.getByRole('button', { name: /pay|confirm/i });
  await payButton.click();
  
  // Handle 3DS challenge
  await handle3DSecureChallenge(page, complete ? 'complete' : 'fail');
}

/**
 * Clear Stripe input fields
 */
export async function clearStripeInputs(page: Page): Promise<void> {
  const stripeFrame = page.frameLocator('iframe[name*="__stripe"]').first();
  
  const inputs = stripeFrame.locator('input');
  const count = await inputs.count();
  
  for (let i = 0; i < count; i++) {
    await inputs.nth(i).clear();
  }
}
