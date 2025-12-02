/**
 * Pricing Validator
 * 
 * Comprehensive validation for pricing-related operations:
 * - Price bounds validation (CHF 0.50 - 100,000)
 * - Currency validation (CHF only for Swiss marketplace)
 * - Zod schemas for all pricing fields
 */

import { z } from 'zod';

// ===========================================
// CONSTANTS
// ===========================================

// Price bounds in CHF (in cents for precision)
export const PRICE_BOUNDS = {
  MIN_CENTS: 50,           // CHF 0.50
  MAX_CENTS: 10000000,     // CHF 100,000
  MIN_CHF: 0.50,
  MAX_CHF: 100000,
};

// Allowed currency (Swiss marketplace)
export const ALLOWED_CURRENCY = 'CHF';

// ===========================================
// HELPER SCHEMAS
// ===========================================

/**
 * Price validation schema (validates number in CHF)
 */
export const priceSchema = z.number()
  .min(PRICE_BOUNDS.MIN_CHF, `Price must be at least CHF ${PRICE_BOUNDS.MIN_CHF}`)
  .max(PRICE_BOUNDS.MAX_CHF, `Price cannot exceed CHF ${PRICE_BOUNDS.MAX_CHF.toLocaleString()}`);

/**
 * Price string validation (for form inputs that submit strings)
 */
export const priceStringSchema = z.string()
  .refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= PRICE_BOUNDS.MIN_CHF && num <= PRICE_BOUNDS.MAX_CHF;
  }, {
    message: `Price must be between CHF ${PRICE_BOUNDS.MIN_CHF} and CHF ${PRICE_BOUNDS.MAX_CHF.toLocaleString()}`,
  });

/**
 * Currency validation (CHF only)
 */
export const currencySchema = z.literal('CHF').default('CHF');

/**
 * Billing interval validation
 */
export const billingIntervalSchema = z.enum([
  'one_time',
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
]);

// ===========================================
// INCLUDED UNITS SCHEMA
// ===========================================

/**
 * Unit multiplier schema
 * Example: { type: "pet", label: "dogs", quantity: 2, extraPrice: 1000, maxAllowed: 5 }
 */
export const includedUnitSchema = z.object({
  type: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  quantity: z.number().int().min(0).max(100),
  extraPrice: z.number().min(0).max(PRICE_BOUNDS.MAX_CENTS), // Price in cents
  maxAllowed: z.number().int().min(1).max(100),
});

export const includedUnitsSchema = z.array(includedUnitSchema).max(10);

// ===========================================
// TIERS SCHEMA
// ===========================================

/**
 * Tier option schema
 * Example: { label: "Small", priceAdjustment: 0 }
 */
export const tierOptionSchema = z.object({
  label: z.string().min(1).max(100),
  priceAdjustment: z.number()
    .min(-PRICE_BOUNDS.MAX_CENTS)
    .max(PRICE_BOUNDS.MAX_CENTS), // Can be negative for discounts
});

/**
 * Tier schema
 * Example: { type: "pet_size", options: [...] }
 */
export const tierSchema = z.object({
  type: z.string().min(1).max(50),
  options: z.array(tierOptionSchema).min(1).max(20),
});

export const tiersSchema = z.array(tierSchema).max(5);

// ===========================================
// MODIFIERS SCHEMA
// ===========================================

/**
 * Percentage-based surcharge
 */
export const percentageSurchargeSchema = z.object({
  type: z.literal('percentage'),
  value: z.number().min(0).max(100), // Percentage (0-100)
});

/**
 * Fixed amount surcharge
 */
export const fixedSurchargeSchema = z.object({
  type: z.literal('fixed'),
  value: z.number().min(0).max(PRICE_BOUNDS.MAX_CENTS), // Amount in cents
});

/**
 * Time-based surcharge (e.g., evening surcharge after 18:00)
 */
export const timeSurchargeSchema = z.object({
  afterHour: z.number().int().min(0).max(23),
  beforeHour: z.number().int().min(0).max(23).optional(),
  value: z.number().min(0).max(PRICE_BOUNDS.MAX_CENTS), // Amount in cents
  type: z.enum(['fixed', 'percentage']).default('fixed'),
});

/**
 * Modifiers schema
 */
export const modifiersSchema = z.object({
  weekendSurcharge: z.union([percentageSurchargeSchema, fixedSurchargeSchema]).optional(),
  eveningSurcharge: timeSurchargeSchema.optional(),
  holidaySurcharge: z.union([percentageSurchargeSchema, fixedSurchargeSchema]).optional(),
  expressSurcharge: z.union([percentageSurchargeSchema, fixedSurchargeSchema]).optional(), // Same-day booking
  travelFee: z.object({
    baseFee: z.number().min(0).max(PRICE_BOUNDS.MAX_CENTS),
    perKmFee: z.number().min(0).max(10000), // Per km fee in cents
    freeKm: z.number().min(0).max(100), // Free kilometers included
  }).optional(),
}).strict();

// ===========================================
// PRICING OPTION SCHEMAS
// ===========================================

/**
 * Create pricing option schema
 */
export const createPricingOptionSchema = z.object({
  serviceId: z.string().uuid(),
  label: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  price: priceStringSchema,
  currency: currencySchema,
  billingInterval: billingIntervalSchema,
  durationMinutes: z.number().int().min(1).max(10080).optional(), // Max 1 week
  includedUnits: includedUnitsSchema.optional(),
  tiers: tiersSchema.optional(),
  modifiers: modifiersSchema.optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Update pricing option schema
 */
export const updatePricingOptionSchema = createPricingOptionSchema.partial().omit({
  serviceId: true,
});

// ===========================================
// VALIDATION FUNCTIONS
// ===========================================

/**
 * Validate price is within bounds
 */
export function validatePrice(price: number): { valid: boolean; error?: string } {
  if (isNaN(price)) {
    return { valid: false, error: 'Price must be a valid number' };
  }
  
  if (price < PRICE_BOUNDS.MIN_CHF) {
    return { valid: false, error: `Price must be at least CHF ${PRICE_BOUNDS.MIN_CHF}` };
  }
  
  if (price > PRICE_BOUNDS.MAX_CHF) {
    return { valid: false, error: `Price cannot exceed CHF ${PRICE_BOUNDS.MAX_CHF.toLocaleString()}` };
  }
  
  return { valid: true };
}

/**
 * Validate currency is CHF
 */
export function validateCurrency(currency: string): { valid: boolean; error?: string } {
  if (currency.toUpperCase() !== ALLOWED_CURRENCY) {
    return { valid: false, error: `Currency must be ${ALLOWED_CURRENCY} for Swiss marketplace` };
  }
  
  return { valid: true };
}

/**
 * Validate complete pricing option
 */
export function validatePricingOption(data: unknown): { 
  valid: boolean; 
  data?: z.infer<typeof createPricingOptionSchema>; 
  error?: string;
} {
  const result = createPricingOptionSchema.safeParse(data);
  
  if (!result.success) {
    return { 
      valid: false, 
      error: result.error.errors.map(e => e.message).join(', '),
    };
  }
  
  return { valid: true, data: result.data };
}

/**
 * Calculate total price with all modifiers applied
 */
export function calculatePriceWithModifiers(
  basePrice: number,
  modifiers: z.infer<typeof modifiersSchema>,
  context: {
    isWeekend?: boolean;
    isEvening?: boolean;
    isHoliday?: boolean;
    isExpress?: boolean;
    travelDistanceKm?: number;
  }
): { total: number; breakdown: Array<{ label: string; amount: number }> } {
  let total = basePrice;
  const breakdown: Array<{ label: string; amount: number }> = [
    { label: 'Base Price', amount: basePrice },
  ];
  
  // Weekend surcharge
  // Note: percentage value is 0-100 (e.g., 20 for 20%), fixed value is in cents
  if (context.isWeekend && modifiers.weekendSurcharge) {
    const surcharge = modifiers.weekendSurcharge.type === 'percentage'
      ? basePrice * (modifiers.weekendSurcharge.value / 100) // e.g., 100 * (20/100) = 20 CHF
      : modifiers.weekendSurcharge.value / 100; // Convert cents to CHF (e.g., 2000 cents = 20 CHF)
    total += surcharge;
    breakdown.push({ label: 'Weekend Surcharge', amount: surcharge });
  }
  
  // Evening surcharge
  if (context.isEvening && modifiers.eveningSurcharge) {
    const surchargeType = modifiers.eveningSurcharge.type || 'fixed';
    const surcharge = surchargeType === 'percentage'
      ? basePrice * (modifiers.eveningSurcharge.value / 100)
      : modifiers.eveningSurcharge.value / 100; // Convert cents to CHF
    total += surcharge;
    breakdown.push({ label: 'Evening Surcharge', amount: surcharge });
  }
  
  // Holiday surcharge
  if (context.isHoliday && modifiers.holidaySurcharge) {
    const surcharge = modifiers.holidaySurcharge.type === 'percentage'
      ? basePrice * (modifiers.holidaySurcharge.value / 100)
      : modifiers.holidaySurcharge.value / 100; // Convert cents to CHF
    total += surcharge;
    breakdown.push({ label: 'Holiday Surcharge', amount: surcharge });
  }
  
  // Express surcharge (same-day)
  if (context.isExpress && modifiers.expressSurcharge) {
    const surcharge = modifiers.expressSurcharge.type === 'percentage'
      ? basePrice * (modifiers.expressSurcharge.value / 100)
      : modifiers.expressSurcharge.value / 100; // Convert cents to CHF
    total += surcharge;
    breakdown.push({ label: 'Express Booking', amount: surcharge });
  }
  
  // Travel fee
  if (context.travelDistanceKm && modifiers.travelFee) {
    const chargeableKm = Math.max(0, context.travelDistanceKm - modifiers.travelFee.freeKm);
    const travelFee = (modifiers.travelFee.baseFee + chargeableKm * modifiers.travelFee.perKmFee) / 100; // Convert cents to CHF
    if (travelFee > 0) {
      total += travelFee;
      breakdown.push({ label: 'Travel Fee', amount: travelFee });
    }
  }
  
  return { total, breakdown };
}

export default {
  PRICE_BOUNDS,
  ALLOWED_CURRENCY,
  priceSchema,
  priceStringSchema,
  currencySchema,
  billingIntervalSchema,
  includedUnitsSchema,
  tiersSchema,
  modifiersSchema,
  createPricingOptionSchema,
  updatePricingOptionSchema,
  validatePrice,
  validateCurrency,
  validatePricingOption,
  calculatePriceWithModifiers,
};
