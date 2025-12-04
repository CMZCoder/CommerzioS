# CTO Implementation Summary

## Overview

This document summarizes the implementation of the **Service Requests (Demand-Led Bidding)** and **Enhanced 3-Phase Dispute Resolution** systems as specified by the Project Strategist blueprint.

## Files Created/Modified

### 1. Schema Files (Database)

#### `shared/schema-service-requests.ts` (NEW)
Implements the demand-led bidding system with:

| Table | Purpose |
|-------|---------|
| `service_requests` | Customer posts describing what they need, with fuzzy PostGIS location |
| `proposals` | Vendor bids with structured pricing, payment method, and timing |
| `vendor_payment_methods` | Stripe Customer storage for commission charging |
| `platform_debts` | Failed charges tracking for retry/collection |

**Key Features:**
- PostGIS-ready location fields (public fuzzy circle, private exact address)
- Payment method enum: `card`, `twint`, `cash`
- Payment timing enum: `upfront`, `on_completion`
- Commission tracking fields on proposals
- 48-hour proposal expiry

#### `shared/schema-disputes.ts` (NEW)
Extends the existing `escrowDisputes` table with 3-phase system:

| Table | Purpose |
|-------|---------|
| `dispute_phases` | Tracks current phase, deadlines, counter-offer counts |
| `dispute_ai_analysis` | Stores AI's evidence/description/behavior analysis |
| `dispute_ai_options` | The 3 AI-proposed resolution options (A, B, C) |
| `dispute_responses` | Party responses to options (accept/counter/escalate/external) |
| `dispute_ai_decisions` | Final AI binding decision in Phase 3 |
| `dispute_reports` | Comprehensive JSON reports for external resolution |
| `dispute_fee_charges` | 25 CHF fee tracking for external resolution |

**Key Features:**
- Phase enums: `phase_1`, `phase_2`, `phase_3_pending`, `phase_3_ai`, `phase_3_external`
- External resolution initiator tracking
- Detailed AI analysis JSONB columns
- PDF report generation support

### 2. Backend Services

#### `server/vendorChargeService.ts` (NEW)
Handles all vendor charging operations:

**Functions:**
- `createVendorSetupIntent()` - Creates Stripe SetupIntent for adding payment method
- `saveVendorPaymentMethod()` - Saves validated card details after setup
- `validateVendorPaymentMethod()` - Checks if vendor has valid billing card
- `chargeVendorCommission()` - Charges 5% on Cash/TWINT booking acceptance
- `chargeDisputeFee()` - Charges 25 CHF for external resolution choice
- `hasOutstandingDebts()` - Checks if user has pending debts (blocks new bookings)
- `retryFailedCharges()` - Cron job function for debt collection

**Configuration:**
- `PLATFORM_COMMISSION_RATE`: 5%
- `DISPUTE_FEE_CHF`: 25.00
- `MAX_CHARGE_ATTEMPTS`: 3
- `RETRY_DELAY_HOURS`: [1, 24, 72]

### 3. Frontend Components

#### `client/src/components/proposals/ProposalActionHeader.tsx` (NEW)
Sticky action bar for proposal interactions:

**Features:**
- Customer view: Accept/Reject/Counter buttons
- Vendor view: Status badge, Withdraw option
- 48-hour countdown timer with urgency indicator
- Off-platform payment warning (Cash/TWINT on completion)
- Confirmation dialogs for destructive actions

---

## Game Theory Implementation

### Issue #1: "Griefing Vendor" Attack
**Problem:** Vendor opts external just to deny customer refund
**Solution:** If vendor chooses external → Customer gets 100% refund immediately

### Issue #2: "Chicken Game" in Phase 3
**Problem:** Both parties hold out hoping other accepts first
**Solution:** AI decision is FINAL. No re-negotiation allowed in Phase 3.

### Issue #3: "Collusion Attack" (Cash)
**Problem:** Customer/vendor collude on fake high-value cash bookings
**Solution:**
- Minimum booking value requirement
- Rate limiting on cash proposals per vendor
- AI pattern detection flagging

### Issue #4: "Strategic Default" (Card Decline)
**Problem:** Vendor's stored card intentionally declines
**Solution:**
- Validate payment method before allowing cash proposals
- Debt tracking with account suspension after 3 failures
- Block new proposals until debt cleared

---

## Stripe Architecture

### Dual Account Structure per Vendor
| Account Type | Purpose | Existing Field |
|--------------|---------|----------------|
| Stripe Connect | Receive payouts | `users.stripeConnectAccountId` |
| Stripe Customer | Pay fees/commission | `vendor_payment_methods.stripeCustomerId` |

### Off-Session Charging Flow
1. Vendor adds card via `SetupIntent` (PSD2/SCA compliant)
2. Platform stores `paymentMethodId` with `usage: 'off_session'`
3. On Cash booking acceptance → `PaymentIntent.create()` with saved method
4. On failure → Create debt record → Retry with exponential backoff

---

## Integration Notes

### To Enable Service Requests

1. Run Drizzle migration for new tables
2. Add routes in `server/routes.ts`:
   - `POST /api/service-requests` - Create request
   - `GET /api/service-requests` - List requests (with PostGIS filtering)
   - `POST /api/proposals` - Submit proposal
   - `PATCH /api/proposals/:id/accept` - Accept proposal
   - `POST /api/vendors/payment-method/setup` - Setup billing card

3. Add cron job for:
   - Proposal expiry (48h)
   - Service request expiry
   - Failed charge retry (`retryFailedCharges()`)

### To Enable Enhanced Disputes

1. Run Drizzle migration for new tables
2. Extend `server/disputeService.ts` (or create new):
   - Phase transition logic
   - AI analysis integration
   - External resolution flow
3. Add PDF generation for dispute reports
4. Add routes for:
   - `POST /api/disputes/:id/respond` - Submit response/counter
   - `POST /api/disputes/:id/external` - Choose external resolution
   - `GET /api/disputes/:id/report` - Download dispute report

---

## Pending Implementation

| Item | Priority | Notes |
|------|----------|-------|
| ProposalCard component | High | Card view for proposal in list |
| ProposalForm component | High | Vendor form to submit proposal |
| ServiceRequestCard component | High | Card view for request |
| CounterOfferModal component | Medium | Modal for counter-proposals |
| disputeResolutionService.ts | High | Backend logic for 3-phase flow |
| AI prompt engineering | High | Evidence analysis prompts |
| PDF generation service | Medium | For dispute reports |
| Cron job setup | High | Expiry + retry jobs |
| PostGIS setup | High | For fuzzy location circles |

---

## Documentation Updated

- `PROJECT_DESCRIPTION.md` - Corrected dispute system description
- `DISPUTE_ARCHITECTURE.md` - Full technical reference
- `client/src/pages/trust-safety.tsx` - User-facing 3-phase explanation

---

*Implementation Date: Session in Progress*
*Lead: AI Assistant acting as CTO*
