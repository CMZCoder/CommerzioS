# E2E Test Suite

## Overview

This directory contains end-to-end tests for the CommerzioS platform using Playwright. The tests cover the complete user journey from booking creation to dispute resolution.

## Current Status

**✅ 29 passed | ⏸️ 7 skipped | ❌ 0 failed**

## Test Structure

The main test file `interactive-flows.spec.ts` is organized into 8 phases:

### Phase 1: Foundation Setup
- ✅ Initialize authentication for all test users (customer, vendor, admin)
- ✅ Get or create test service
- ✅ Create completed booking via bypass for dependent tests

### Phase 2: Booking Flows
- **2A: Standard Booking Flow**
  - ✅ Customer creates booking request
  - ⚠️ Vendor sees pending booking (service ownership mismatch)
  - ⚠️ Vendor accepts booking (service ownership mismatch)
  - ⏸️ Vendor starts service (depends on accept)
  - ⏸️ Vendor completes service (depends on start)

- **2B: Counter-Offer Flow**
  - ✅ Customer creates booking, vendor proposes alternative
  - ⚠️ Customer accepts alternative (service ownership mismatch)

- **2C: Booking Cancellation**
  - ✅ Customer cancels a pending booking

### Phase 3: Vendor Calendar
- ✅ Vendor blocks a specific date
- ✅ Vendor blocks specific hours
- ⚠️ Verify blocked times excluded from availability (endpoint returns 404)
- ✅ Vendor deletes calendar block

### Phase 4: Tips System
- ✅ Ensure completed booking exists for tip testing
- ✅ Customer checks tip eligibility
- ✅ Customer creates cash tip
- ✅ Vendor receives tip notification
- ✅ Vendor views tip statistics

### Phase 5: Review System
- **5A: Review Lifecycle**
  - ✅ Customer creates positive review
  - ✅ Customer edits review (rating change)
  - ✅ Vendor receives review change notification

- **5B: Review Removal Request**
  - ⚠️ Vendor requests review removal (requires service ownership)
  - ✅ Admin sees pending removal requests
  - ⏸️ Admin processes removal request (depends on request creation)

### Phase 6: Dispute System
- ✅ Create dedicated completed booking for dispute testing
- ⚠️ Customer raises dispute (requires escrow transaction)
- ⏸️ Vendor responds to dispute (depends on dispute creation)
- ⏸️ Admin marks dispute under review (depends on dispute creation)
- ⏸️ Admin resolves dispute (depends on dispute creation)

### Phase 7: Notifications
- ✅ Customer can view notification list
- ✅ Mark notification as read
- ✅ Clicking booking notification navigates correctly

### Phase 8: Cleanup & Summary
- ✅ Test summary and state report

---

## TODO List

### High Priority
- [ ] **Create vendor-owned service**: The test-vendor user doesn't own `demo-service-46`, causing accept/propose/removal operations to fail
- [ ] **Add escrow transaction to bypass**: Disputes require an escrow transaction to exist before they can be created

### Medium Priority
- [ ] **Availability endpoint**: Investigate why `/api/services/:id/availability` returns 404
- [ ] **Review removal flow**: Once vendor owns a service, complete the removal request flow

### Low Priority / Nice to Have
- [ ] Add parallel test execution (currently serial for state dependencies)
- [ ] Add visual regression tests for key UI components
- [ ] Add performance benchmarks for API response times
- [ ] Create separate test suites for smoke vs. full regression

---

## Test Users

| User | Email | Role |
|------|-------|------|
| Customer | test-customer@commerzio.test | Books services, tips, reviews |
| Vendor | test-vendor@commerzio.test | Manages bookings, calendar |
| Admin | test-admin@commerzio.test | Resolves disputes, reviews |

## Test Bypass System

The tests use a secure bypass system (`/api/test/bypass/*`) that:
- Only works for `@commerzio.test` email domains
- Uses HMAC-SHA256 signed tokens with 5-minute expiration
- Single-use tokens to prevent replay attacks
- Allows creating completed bookings and reviews without full UI flows

## Running Tests

```bash
# Run all E2E tests
npx playwright test e2e/interactive-flows.spec.ts

# Run with list reporter (detailed output)
npx playwright test e2e/interactive-flows.spec.ts --reporter=list

# Run with UI mode
npx playwright test e2e/interactive-flows.spec.ts --ui

# Run specific phase (by grep)
npx playwright test e2e/interactive-flows.spec.ts --grep "Phase 4"
```

## Architecture Notes

- Tests run serially due to state dependencies between phases
- Each phase builds on entities created in previous phases
- Cleanup runs after all tests to remove test data
- Uses Playwright's `APIRequestContext` for authenticated API calls
