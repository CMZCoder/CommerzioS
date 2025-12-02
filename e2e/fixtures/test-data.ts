/**
 * Test data for E2E tests
 * Contains test users, services, bookings, and payment data
 */

// Test user credentials
export const testUsers = {
  customer: {
    email: 'test-customer@commerzio.test',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Customer',
    phone: '+41791234567',
  },
  vendor: {
    email: 'test-vendor@commerzio.test',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'Vendor',
    phone: '+41791234568',
    businessName: 'Test Vendor Services',
  },
  admin: {
    email: 'admin@commerzio.test',
    password: 'AdminPassword123!',
    firstName: 'Admin',
    lastName: 'User',
  },
  newUser: {
    email: `new-user-${Date.now()}@commerzio.test`,
    password: 'NewUserPassword123!',
    firstName: 'New',
    lastName: 'User',
    phone: '+41791234569',
  },
};

// Test service data
export const testService = {
  title: 'Test Cleaning Service',
  description: 'Professional cleaning service for homes and offices. We provide thorough cleaning with eco-friendly products.',
  category: 'Home Services',
  subcategory: 'Cleaning',
  pricing: {
    fixed: {
      type: 'fixed' as const,
      price: 50,
      currency: 'CHF',
    },
    priceList: {
      type: 'price_list' as const,
      options: [
        { name: 'Basic Cleaning', price: 50, duration: 60 },
        { name: 'Deep Cleaning', price: 100, duration: 120 },
        { name: 'Move-out Cleaning', price: 200, duration: 240 },
      ],
    },
    text: {
      type: 'text' as const,
      priceText: 'Starting from 50 CHF/hour',
    },
  },
  location: {
    address: 'Bahnhofstrasse 1',
    city: 'Zurich',
    postalCode: '8001',
    country: 'Switzerland',
    lat: 47.3667,
    lng: 8.5500,
  },
};

// Test booking data
export const testBooking = {
  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
  time: '10:00',
  duration: 60,
  message: 'Looking forward to the service!',
  pricingOption: 'Basic Cleaning',
};

// Stripe test card numbers
// @see https://stripe.com/docs/testing#cards
export const stripeTestCards = {
  // Successful payment
  success: {
    number: '4242424242424242',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
  // Card declined
  declined: {
    number: '4000000000000002',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
  // Requires 3D Secure authentication
  threeDSecure: {
    number: '4000002500003155',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
  // Insufficient funds
  insufficientFunds: {
    number: '4000000000009995',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
  // Expired card
  expired: {
    number: '4000000000000069',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
  // Processing error
  processingError: {
    number: '4000000000000119',
    exp: '12/30',
    cvc: '123',
    zip: '8001',
  },
};

// Chat test messages
export const testMessages = {
  normal: 'Hello, I have a question about your service.',
  withProfanity: {
    english: 'This is a damn message',
    german: 'Das ist eine Scheisse Nachricht',
    french: 'C\'est un message merde',
    italian: 'Questo è un messaggio cazzo',
  },
  withContactInfo: {
    phone: 'Call me at +41791234567',
    email: 'Email me at test@example.com',
  },
};

// Review test data
export const testReview = {
  rating: 5,
  comment: 'Excellent service! The cleaning was thorough and professional. Highly recommended!',
  editedComment: 'Updated: Excellent service! Very professional and on time.',
};

// Referral test data
export const testReferral = {
  referrerEmail: 'referrer@commerzio.test',
  refereeEmail: `referee-${Date.now()}@commerzio.test`,
};

// Notification test preferences
export const testNotificationPreferences = {
  bookingNotifications: true,
  paymentNotifications: true,
  messageNotifications: true,
  marketingNotifications: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

// Calendar test data
export const testCalendarSettings = {
  workingHours: {
    monday: { start: '09:00', end: '17:00', enabled: true },
    tuesday: { start: '09:00', end: '17:00', enabled: true },
    wednesday: { start: '09:00', end: '17:00', enabled: true },
    thursday: { start: '09:00', end: '17:00', enabled: true },
    friday: { start: '09:00', end: '17:00', enabled: true },
    saturday: { start: '10:00', end: '14:00', enabled: true },
    sunday: { start: '00:00', end: '00:00', enabled: false },
  },
  minBookingNotice: 24, // hours
  maxAdvanceBooking: 30, // days
  bufferBetweenBookings: 15, // minutes
  slotDuration: 60, // minutes
};

// Dispute test data
export const testDispute = {
  reasons: [
    'service_not_provided',
    'poor_quality',
    'wrong_service',
    'overcharged',
    'no_show',
    'other',
  ] as const,
  description: 'The service was not provided as described. The vendor did not show up at the scheduled time.',
  evidence: 'I waited for 2 hours but no one came. I have attached screenshots of our conversation.',
};

// Admin test data
export const testAdminActions = {
  userWarningReason: 'Violation of terms of service - inappropriate content',
  userSuspensionReason: 'Multiple violations of community guidelines',
  userBanReason: 'Repeated fraudulent activity',
  serviceRejectionReason: 'Service description contains prohibited content',
};
