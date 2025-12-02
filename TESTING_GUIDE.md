# CommerzioS E2E Testing Guide

This document provides comprehensive documentation for the end-to-end (E2E) test suite built with Playwright for the CommerzioS service marketplace platform.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Test Scenarios](#test-scenarios)
5. [Page Object Models](#page-object-models)
6. [Test Data](#test-data)
7. [Configuration](#configuration)
8. [CI/CD Integration](#cicd-integration)
9. [Debugging](#debugging)
10. [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm 9 or higher

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Quick Start

Run all tests:
```bash
npm run test:e2e
```

Run tests with UI:
```bash
npm run test:e2e:ui
```

## Running Tests

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Open Playwright UI for interactive testing |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:headed` | Run tests in headed browser mode |
| `npm run test:e2e:report` | View the HTML test report |
| `npm run test:e2e:codegen` | Generate tests using Playwright codegen |

### Running Specific Tests

Run tests by file:
```bash
npx playwright test e2e/tests/auth.spec.ts --config=e2e/playwright.config.ts
```

Run tests by name pattern:
```bash
npx playwright test -g "should login" --config=e2e/playwright.config.ts
```

Run tests in specific browser:
```bash
npx playwright test --project=chromium --config=e2e/playwright.config.ts
npx playwright test --project=firefox --config=e2e/playwright.config.ts
npx playwright test --project=webkit --config=e2e/playwright.config.ts
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Application base URL | `http://localhost:5000` |
| `CI` | Set to `true` in CI environment | - |

## Test Structure

```
e2e/
├── playwright.config.ts    # Playwright configuration
├── global-setup.ts         # Global setup script
├── fixtures/               # Test fixtures and data
│   ├── test-data.ts       # Test user, service, booking data
│   ├── auth.fixture.ts    # Authentication fixtures
│   └── db.fixture.ts      # Database utilities
├── pages/                  # Page Object Models
│   ├── BasePage.ts        # Base page with common functionality
│   ├── HomePage.ts        # Home page
│   ├── LoginPage.ts       # Login page
│   ├── RegisterPage.ts    # Registration page
│   ├── ServicePage.ts     # Service listing and detail
│   ├── BookingPage.ts     # Booking flow
│   ├── PaymentPage.ts     # Payment flow
│   ├── ChatPage.ts        # Chat/messaging
│   └── AdminPage.ts       # Admin dashboard
├── tests/                  # Test specifications
│   ├── auth.spec.ts       # Authentication tests
│   ├── services.spec.ts   # Service management tests
│   ├── discovery.spec.ts  # Service discovery tests
│   ├── booking.spec.ts    # Booking flow tests
│   ├── payment.spec.ts    # Payment tests
│   ├── disputes.spec.ts   # Dispute resolution tests
│   ├── chat.spec.ts       # Chat system tests
│   ├── reviews.spec.ts    # Review system tests
│   ├── referral.spec.ts   # Referral system tests
│   ├── notifications.spec.ts  # Notification tests
│   ├── calendar.spec.ts   # Vendor calendar tests
│   ├── admin.spec.ts      # Admin dashboard tests
│   ├── maps.spec.ts       # Map & location tests
│   ├── edge-cases.spec.ts # Edge case tests
│   └── performance.spec.ts # Performance tests
└── utils/                  # Utility functions
    ├── helpers.ts         # General helper functions
    ├── api.ts             # API helper for direct calls
    └── stripe-mock.ts     # Stripe testing utilities
```

## Test Scenarios

### Authentication (`auth.spec.ts`)
- ✅ User registration with valid data
- ✅ User registration with invalid data (validation errors)
- ✅ User registration with existing email (error handling)
- ✅ Email verification flow
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Login lockout after failed attempts
- ✅ Password reset request
- ✅ Password reset completion
- ✅ Google OAuth login flow
- ✅ Logout
- ✅ Session persistence across page refresh
- ✅ Protected route redirect when not authenticated

### Service Management (`services.spec.ts`)
- ✅ Create service with fixed pricing
- ✅ Create service with price list
- ✅ Create service with text pricing
- ✅ Upload images
- ✅ Image cropping functionality
- ✅ Edit service details
- ✅ Change service category
- ✅ Add/remove locations
- ✅ Pause service
- ✅ Activate service
- ✅ Delete service
- ✅ Contact verification (phone/email)

### Service Discovery (`discovery.spec.ts`)
- ✅ Browse all services
- ✅ Browse by category/subcategory
- ✅ Search by keyword
- ✅ Filter by location
- ✅ Filter by price range
- ✅ Sort by newest, price, rating, distance
- ✅ Pagination
- ✅ View service details
- ✅ Add/remove favorites
- ✅ View vendor profile
- ✅ Get directions

### Booking Flow (`booking.spec.ts`)
- ✅ View available time slots
- ✅ Select pricing option
- ✅ Select date and time
- ✅ Add customer message
- ✅ Submit booking request
- ✅ Vendor accepts/rejects booking
- ✅ Vendor proposes alternative time
- ✅ Customer accepts/rejects alternative
- ✅ Customer/vendor cancels booking
- ✅ Vendor starts/completes service
- ✅ No-show handling

### Payment Flow (`payment.spec.ts`)
- ✅ Payment method selection (card, TWINT, cash)
- ✅ Card payment with success
- ✅ Card payment failure handling
- ✅ 3D Secure authentication
- ✅ TWINT eligibility check
- ✅ Cash payment flow
- ✅ Escrow management
- ✅ Refund request and approval/rejection

### Dispute Resolution (`disputes.spec.ts`)
- ✅ Customer raises dispute (various reasons)
- ✅ Vendor raises dispute
- ✅ Upload evidence
- ✅ Admin views and resolves disputes
- ✅ Resolution options (full refund, release, split)
- ✅ Notification on resolution

### Chat System (`chat.spec.ts`)
- ✅ Start conversation from booking/service
- ✅ Send/receive text messages
- ✅ Message timestamps and unread count
- ✅ Profanity filter (multiple languages)
- ✅ Contact info blocking
- ✅ Block and report user
- ✅ Conversation history

### Review System (`reviews.spec.ts`)
- ✅ Leave review after completed booking
- ✅ Rate 1-5 stars
- ✅ Write review comment
- ✅ Edit review
- ✅ View reviews on service/vendor profile
- ✅ Average rating and review count

### Referral System (`referral.spec.ts`)
- ✅ Generate referral code
- ✅ Share referral link
- ✅ Sign up with referral code
- ✅ Multi-level referral tracking (L1, L2, L3)
- ✅ Points balance and redemption
- ✅ Referral dashboard stats

### Notifications (`notifications.spec.ts`)
- ✅ In-app notifications display
- ✅ Notification bell and count
- ✅ Mark as read/mark all as read
- ✅ Dismiss notification
- ✅ Notification preferences
- ✅ Various notification types

### Vendor Calendar (`calendar.spec.ts`)
- ✅ Set working hours per day
- ✅ Disable specific days
- ✅ Block time (single day, date range, recurring)
- ✅ Edit/delete calendar blocks
- ✅ Booking settings (min notice, max advance, buffer, slot duration)

### Admin Dashboard (`admin.spec.ts`)
- ✅ Admin access and navigation
- ✅ User management (view, search, filter, warn, suspend, ban, kick, reactivate)
- ✅ Service management (view, approve, reject, feature)
- ✅ Escrow management (view, manual release/refund)
- ✅ Dispute management
- ✅ Category management (add, edit, delete)
- ✅ Analytics and referral stats

### Map & Location (`maps.spec.ts`)
- ✅ Map display and markers
- ✅ Info window on marker click
- ✅ Get directions
- ✅ Distance calculation
- ✅ Location search/autocomplete
- ✅ User location and geolocation
- ✅ Sort by distance
- ✅ Location-based filtering

### Edge Cases (`edge-cases.spec.ts`)
- ✅ Network failure handling
- ✅ Session expiration
- ✅ Concurrent booking handling
- ✅ Payment timeout
- ✅ Invalid URL handling (404)
- ✅ Server error handling (500)
- ✅ Form validation errors
- ✅ File upload restrictions
- ✅ Rate limiting
- ✅ XSS prevention
- ✅ Empty states

### Performance & Accessibility (`performance.spec.ts`)
- ✅ Page load time < 3s
- ✅ Time to interactive < 5s
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ Heading structure
- ✅ Landmark regions
- ✅ Alt text on images
- ✅ Keyboard navigation
- ✅ Focus indicators
- ✅ Form labels
- ✅ Mobile responsive design

## Page Object Models

Page Object Models (POMs) encapsulate page elements and actions for maintainability.

### Example Usage

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password');
  
  expect(loginPage.getCurrentUrl()).not.toContain('/login');
});
```

## Test Data

Test data is centralized in `e2e/fixtures/test-data.ts`:

- **testUsers**: Customer, vendor, and admin credentials
- **testService**: Sample service data
- **testBooking**: Sample booking data
- **stripeTestCards**: Stripe test card numbers
- **testMessages**: Chat test messages
- **testReview**: Review test data
- **testCalendarSettings**: Calendar configuration

### Stripe Test Cards

| Card Type | Number |
|-----------|--------|
| Success | 4242424242424242 |
| Declined | 4000000000000002 |
| 3D Secure | 4000002500003155 |
| Insufficient Funds | 4000000000009995 |

## Configuration

The Playwright configuration (`e2e/playwright.config.ts`) includes:

- Multi-browser support (Chromium, Firefox, WebKit)
- Mobile viewport testing
- Screenshot on failure
- Video recording on retry
- Trace collection for debugging
- Parallel test execution
- Retry logic (2 retries in CI)
- HTML report generation

## CI/CD Integration

E2E tests run automatically via GitHub Actions (`.github/workflows/e2e.yml`):

- Triggered on push/PR to main/master
- Installs dependencies and browsers
- Builds the application
- Runs tests on Chromium
- Uploads test report and results as artifacts

## Debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector for step-by-step debugging.

### Headed Mode

```bash
npm run test:e2e:headed
```

Watch tests run in a visible browser.

### Trace Viewer

Traces are collected on first retry. View them:

```bash
npx playwright show-trace e2e/test-results/trace.zip
```

### Screenshots and Videos

On failure, screenshots are saved to `e2e/test-results/`.

## Best Practices

### Writing Tests

1. **Use Page Objects**: Encapsulate selectors and actions in POMs
2. **No hardcoded waits**: Use Playwright's built-in waiting mechanisms
3. **Independent tests**: Each test should be able to run in isolation
4. **Meaningful assertions**: Use descriptive assertions with `expect`
5. **Clean test data**: Don't rely on existing data; create what you need

### Selectors

Priority order for selectors:
1. `getByRole` - Most resilient to UI changes
2. `getByLabel` - For form elements
3. `getByText` - For visible text
4. `data-testid` - When other options aren't suitable
5. CSS selectors - Last resort

### Example

```typescript
// Good - semantic and resilient
await page.getByRole('button', { name: /submit/i }).click();

// Avoid - fragile CSS selector
await page.locator('button.submit-btn').click();
```

## Troubleshooting

### Common Issues

1. **Flaky tests**: Add proper waiting strategies
2. **Element not found**: Check if element is in iframe or shadow DOM
3. **Timeouts**: Increase timeout or check for slow APIs
4. **Different results locally vs CI**: Check environment variables

### Getting Help

1. Check the [Playwright documentation](https://playwright.dev/docs/intro)
2. Review test output and traces
3. Open an issue in the repository
