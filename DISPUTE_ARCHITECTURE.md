# CommerzioS Dispute Resolution Architecture

## Overview

CommerzioS uses a **3-phase dispute resolution system** designed for speed (max 14 days), fairness (AI-mediated options), and flexibility (external resolution option).

---

## Core Principles

- ✅ **Fast** - Maximum 14 days (7 + 7) before final resolution
- ✅ **Fair** - AI considers full context and proposes balanced options
- ✅ **Flexible** - External resolution option for those who prefer legal process
- ✅ **Final** - AI decisions are binding within platform
- ✅ **Transparent** - Full audit trail and dispute reports available
- ✅ **Commission-Clear** - Commission calculated on final agreed price

---

## Phase 1: Direct Negotiation (Maximum 7 Days)

Parties attempt to resolve issues directly before any formal process.

### How Phase 1 is Initiated

**Trigger Points:**
1. **Customer clicks "Report Issue"** on completed booking page
2. **Vendor clicks "Report Issue"** from their booking management
3. **Must be after** service marked as "completed"
4. **Must be before** escrow auto-release (within 48 hours of completion)

**Initiation Flow:**
```
Service Completed
       ↓
  Escrow Held (48h countdown starts)
       ↓
  [Customer/Vendor clicks "Report Issue"]
       ↓
  Issue Form: 
    - Select reason (quality, no-show, wrong service, etc.)
    - Describe the problem (required)
    - Upload evidence (REQUIRED - minimum 1 file)
       ↓
  Validation: Cannot submit without evidence
       ↓
  Other party notified immediately
       ↓
  Escrow auto-release PAUSED
       ↓
  Phase 1 begins (7-day timer starts)
```

**Issue Reasons (dropdown):**
- `service_not_provided` - Service was not delivered
- `poor_quality` - Service quality was below expectations
- `wrong_service` - Different service than what was booked
- `overcharged` - Charged more than agreed price
- `no_show` - Customer or vendor didn't show up
- `partial_service` - Only part of service was completed
- `damage` - Property damage during service
- `other` - Other issue (requires description)

**What Happens on Initiation:**
1. Dispute record created with status `phase_1`
2. Phase 1 deadline set (7 days from now)
3. Escrow status changed to `disputed` (pauses auto-release)
4. Both parties notified via email + in-app notification
5. Chat thread linked to dispute for easy reference
6. Counter-offer tracking initialized (0/3 for each party)

### Process Flow
1. **Issue Raised** - Customer or vendor flags a problem via chat
2. **Direct Communication** - Both parties discuss and negotiate
3. **Counter-Offers** - Vendor proposes alternatives (time, price, solution)
4. **Acceptance or Rejection** - Customer responds within 48 hours
5. **Resolution or Escalation** - Agreement reached OR escalate to Phase 2

### Counter-Offer Rules
- **Maximum 3 counter-proposals per party** (prevents endless back-and-forth)
- **48-hour response window** per proposal
- **7-day maximum** for entire Phase 1
- **Commission on final price** - If customer accepts discounted offer, commission calculated on that amount

### Counter-Offer Feature (Already in Code)

```typescript
// From bookingService.ts line 726
export async function proposeAlternative(
  bookingId: string,
  vendorId: string,
  alternativeStartTime: Date,
  alternativeEndTime: Date,
  alternativeMessage?: string,  // Can include discount offer
  expiryHours: number = 48
): Promise<Booking>
```

**Needs to be added:**
- Counter limit tracking (max 3 per party)
- Phase 1 deadline tracking (7 days max)
- Auto-escalate to Phase 2 when limits hit

### Outcomes
| Outcome | Action | Commission |
|---------|--------|------------|
| ✅ Agreement | Funds distributed per agreement | On final agreed price |
| ⏭️ No agreement after 7 days | Auto-escalate to Phase 2 | Pending |
| ⏭️ 3 counter-proposals exhausted | Can manually escalate to Phase 2 | Pending |

---

## Phase 2: AI-Mediated Negotiation (Maximum 7 Days)

If direct negotiation fails, AI analyzes all evidence and behavior to propose tailored resolution options.

### Process Flow
1. **Dispute Formalized** - System captures all Phase 1 history
2. **Comprehensive AI Analysis** - OpenAI analyzes everything available:
   
   **Evidence Analysis:**
   - Uploaded photos, screenshots, documents, receipts
   - Quality and clarity of evidence
   - Timestamp verification on evidence
   - Relevance of evidence to claims
   
   **Description Analysis:**
   - Written accounts from both parties
   - Consistency between description and evidence
   - Timeline of events described
   - Specific vs. vague claims
   
   **Behavior Analysis:**
   - Communication tone (professional, hostile, dismissive)
   - Response times during Phase 1
   - Willingness to negotiate in good faith
   - Counter-offer reasonableness
   - Cooperation level
   
   **Context Analysis:**
   - Chat history and message patterns
   - Booking details and original agreement
   - Service description vs. delivery
   - Price paid and value received

3. **AI Generates Tailored Options** - Up to 3 resolution proposals based on analysis:
   - Options are **specific to this dispute** (not templates)
   - Percentages based on **evidence strength** and **behavior scores**
   - Each option includes **detailed reasoning** explaining why
   - May include non-monetary remedies (service credits, re-do service, etc.)

4. **Parties Review** - Both parties see options with full AI reasoning
5. **Selection or Counter** - Accept an option OR make counter-proposal (max 3 per party)
6. **Matching Check** - If both accept same option → Resolved

### AI Analysis Output Structure

```typescript
// Proposed structure
interface AIDisputeAnalysis {
  // Evidence Assessment
  evidenceAnalysis: {
    customer: {
      evidenceCount: number;
      evidenceTypes: string[];       // ['photo', 'screenshot', 'document']
      evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none';
      evidenceSummary: string;       // "Customer provided 3 photos showing..."
    };
    vendor: {
      evidenceCount: number;
      evidenceTypes: string[];
      evidenceStrength: 'strong' | 'moderate' | 'weak' | 'none';
      evidenceSummary: string;
    };
  };
  
  // Description Assessment
  descriptionAnalysis: {
    customerAccount: string;         // Summary of customer's description
    vendorAccount: string;           // Summary of vendor's description
    consistencyScore: number;        // 0-100, how consistent are accounts
    contradictions: string[];        // List of contradicting claims
    verifiableClaims: string[];      // Claims supported by evidence
  };
  
  // Behavior Assessment
  behaviorAnalysis: {
    customer: {
      responseTime: 'fast' | 'moderate' | 'slow' | 'unresponsive';
      tone: 'professional' | 'neutral' | 'frustrated' | 'hostile';
      goodFaithScore: number;        // 0-100
      cooperationLevel: string;
    };
    vendor: {
      responseTime: 'fast' | 'moderate' | 'slow' | 'unresponsive';
      tone: 'professional' | 'neutral' | 'frustrated' | 'hostile';
      goodFaithScore: number;
      cooperationLevel: string;
    };
  };
  
  // Overall Assessment
  overallAssessment: {
    primaryIssue: string;            // "Service quality below expectations"
    faultAssessment: string;         // "Vendor primarily at fault due to..."
    mitigatingFactors: string[];     // Factors that reduce blame
    aggravatingFactors: string[];    // Factors that increase blame
  };
}

interface AIResolutionOption {
  id: 'A' | 'B' | 'C';
  label: string;                     // e.g., "Evidence-Based Resolution"
  customerRefundPercent: number;     // Calculated from analysis
  vendorPaymentPercent: number;
  reasoning: string;                 // Detailed explanation
  keyFactors: string[];              // "Strong photo evidence", "Vendor unresponsive"
  basedOn: string[];                 // Which evidence/behavior led to this
}

interface AIProposedResolution {
  analysis: AIDisputeAnalysis;
  options: AIResolutionOption[];     // Up to 3, tailored to dispute
  recommendedOption: 'A' | 'B' | 'C'; // AI's recommendation
  deadline: Date;                    // 7 days from proposal
}
```

### Response Options
Each party can:
1. ✅ **Accept Option A, B, or C** - If both pick same, resolved
2. 🔄 **Counter-Propose** - Suggest different split (max 3 per party)
3. ⏭️ **Escalate to Phase 3** - Request AI final decision
4. 🚪 **External Resolution** - Opt out of platform resolution

### Outcomes
| Outcome | Action | Commission |
|---------|--------|------------|
| ✅ Both accept same option | Funds split per option | On transaction amount |
| ✅ Counter-proposal accepted | Funds split per agreement | On transaction amount |
| ⏭️ No agreement after 7 days | Auto-escalate to Phase 3 | Pending |
| ⏭️ Party chooses escalation | Move to Phase 3 | Pending |

---

## Phase 3: AI Final Decision OR External Resolution

If parties cannot agree in Phase 2, they have two paths:

### Path A: AI Final Decision (Binding)

**Process:**
1. **AI Reviews Everything** - Full context from Phase 1 and 2
2. **AI Makes Binding Decision** - Final ruling on fund distribution
3. **Immediate Execution** - Funds distributed automatically
4. **No Appeals** - Decision is final within platform

**What AI Considers:**
- All chat history and tone analysis
- Counter-offer attempts in both phases
- Responses to AI-proposed options in Phase 2
- Good faith negotiation indicators
- Evidence strength and relevance
- Service quality indicators
- Platform guidelines and precedent

### Path B: External Resolution

**Process:**
1. **Party Chooses "External Resolution"** - Either party can opt out
2. **Dispute Report Generated** - Comprehensive PDF for both parties:
   - Full chat history
   - All counter-offers with timestamps
   - AI's proposed options from Phase 2
   - Booking details and evidence
   - Timeline of all negotiation attempts
   - Platform assessment (non-binding)
3. **Funds Distributed Per Rules** (see below)
4. **Dispute Closed** - Marked as "externally_resolved"
5. **Report Available** - Both parties can download for legal use

### Commission Handling for External Resolution

| Who Chooses External | Commission | Funds | Rationale |
|---------------------|------------|-------|-----------|
| **Customer** | Charged on original amount | Released to vendor | Customer opting out = service deemed delivered |
| **Vendor** | NOT charged | Full refund to customer | Vendor opting out = service deemed inadequate |
| **Both simultaneously** | Split 50% | 50% each | Mutual agreement to exit |

**Rationale:**
- Prevents gaming the system to avoid commission
- Party opting out bears cost/risk of external process
- Encourages using platform resolution
- Clear rules prevent disputes about disputes

### Dispute Report Contents

```typescript
interface DisputeReport {
  reportId: string;
  generatedAt: Date;
  
  // Parties
  customer: { name, email, phone };
  vendor: { name, email, phone, businessName };
  
  // Booking
  booking: {
    id, bookingNumber, service,
    originalPrice, finalPrice (if discounted),
    dates, description
  };
  
  // Phase 1 Summary
  phase1: {
    startDate, endDate,
    counterOffersCount: { customer, vendor },
    counterOffers: Array<{
      from, to, proposedAmount, message, timestamp, response
    }>,
    chatHistory: Message[],
    outcome: 'resolved' | 'escalated'
  };
  
  // Phase 2 Summary
  phase2: {
    startDate, endDate,
    aiProposedOptions: AIResolutionOption[],
    partyResponses: {
      customer: { selectedOption, counterProposals },
      vendor: { selectedOption, counterProposals }
    },
    outcome: 'resolved' | 'escalated' | 'externally_resolved'
  };
  
  // Evidence
  evidence: {
    customer: string[],  // URLs
    vendor: string[]
  };
  
  // Platform Assessment (non-binding, for external use)
  platformAssessment: {
    summary: string,
    recommendedResolution: string,
    goodFaithIndicators: { customer, vendor },
    disclaimer: string  // "This is informational only..."
  };
}
```

---

## Timeline Summary

```
Day 0: Issue raised
│
├── Phase 1: Direct Negotiation (Days 0-7)
│   ├── Max 3 counter-proposals per party
│   ├── 48-hour response windows
│   └── Auto-escalate if no resolution by Day 7
│
├── Phase 2: AI-Mediated Negotiation (Days 7-14)
│   ├── AI proposes 3 options immediately
│   ├── Max 3 counter-proposals per party
│   ├── Parties can accept matching option anytime
│   └── Auto-escalate if no resolution by Day 14
│
└── Phase 3: Final Resolution (Day 14+)
    ├── Path A: AI Final Decision (immediate, binding)
    └── Path B: External Resolution (immediate, report generated)
```

---

## Database Schema Updates Needed

```sql
-- Add dispute phases tracking
ALTER TABLE escrow_disputes ADD COLUMN phase VARCHAR(20) DEFAULT 'phase_1';
-- 'phase_1', 'phase_2', 'phase_3_ai', 'phase_3_external'

ALTER TABLE escrow_disputes ADD COLUMN phase_1_deadline TIMESTAMP;
ALTER TABLE escrow_disputes ADD COLUMN phase_2_deadline TIMESTAMP;
ALTER TABLE escrow_disputes ADD COLUMN counter_offers_customer INT DEFAULT 0;
ALTER TABLE escrow_disputes ADD COLUMN counter_offers_vendor INT DEFAULT 0;

-- Add AI options for Phase 2
CREATE TABLE dispute_ai_options (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES escrow_disputes(id),
  option_label VARCHAR(1),  -- 'A', 'B', 'C'
  customer_refund_percent INT,
  vendor_payment_percent INT,
  reasoning TEXT,
  factors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add party responses to AI options
CREATE TABLE dispute_responses (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES escrow_disputes(id),
  user_id UUID REFERENCES users(id),
  response_type VARCHAR(20),  -- 'accept_option', 'counter_propose', 'escalate', 'external'
  selected_option VARCHAR(1),  -- 'A', 'B', 'C' or NULL
  counter_amount INT,  -- If counter-proposing
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add dispute reports
CREATE TABLE dispute_reports (
  id UUID PRIMARY KEY,
  dispute_id UUID REFERENCES escrow_disputes(id),
  report_data JSONB,
  generated_at TIMESTAMP DEFAULT NOW(),
  downloaded_by_customer BOOLEAN DEFAULT FALSE,
  downloaded_by_vendor BOOLEAN DEFAULT FALSE
);
```

---

## API Endpoints Needed

```typescript
// Phase 1 - Already partially exists
POST /api/bookings/:id/counter-offer          // Propose alternative
POST /api/bookings/:id/counter-offer/accept   // Accept proposal
POST /api/bookings/:id/counter-offer/reject   // Reject proposal
POST /api/bookings/:id/escalate               // Move to Phase 2

// Phase 2
GET  /api/disputes/:id/ai-options             // Get AI-generated options
POST /api/disputes/:id/select-option          // Select A, B, or C
POST /api/disputes/:id/counter-propose        // Counter-propose split
POST /api/disputes/:id/escalate               // Move to Phase 3

// Phase 3
POST /api/disputes/:id/request-ai-decision    // Request binding AI decision
POST /api/disputes/:id/external-resolution    // Opt for external resolution
GET  /api/disputes/:id/report                 // Download dispute report

// Admin/Monitoring
GET  /api/admin/disputes                      // List all disputes
GET  /api/admin/disputes/:id                  // Dispute details
GET  /api/admin/disputes/analytics            // Resolution stats
```

---

## Implementation Status

### ✅ Already Built
- Direct chat communication
- Basic counter-offer feature (proposeAlternative)
- 48-hour proposal expiry
- Escrow transaction system
- Dispute creation framework
- Basic dispute tracking

### ⏳ Needs Implementation
- **Phase 1 Enhancements**
  - Counter-offer limit tracking (max 3)
  - 7-day deadline enforcement
  - Auto-escalation to Phase 2
  - Commission on final price calculation

- **Phase 2 (New)**
  - OpenAI integration for option generation
  - AI option display UI
  - Party response tracking
  - Matching algorithm
  - Counter-proposal in Phase 2

- **Phase 3 (New)**
  - External resolution option
  - Dispute report generation (PDF)
  - Commission handling per opt-out rules
  - AI final decision execution

- **General**
  - Database schema updates
  - New API endpoints
  - UI for phase display
  - Notification system for deadlines
  - Analytics dashboard

---

## Terms & Conditions Additions

The following should be added to T&C:

```
DISPUTE RESOLUTION

1. DISPUTE PROCESS
   a. Phase 1 (Direct Negotiation): Maximum 7 days, 3 counter-proposals per party
   b. Phase 2 (AI-Mediated): Maximum 7 days, AI proposes 3 options
   c. Phase 3: AI final decision OR external resolution

2. COMMISSION ON DISPUTES
   a. Commission calculated on final agreed price (if discounted during negotiation)
   b. External Resolution by Customer: Commission charged, funds to vendor
   c. External Resolution by Vendor: No commission, full refund to customer
   d. External Resolution by Both: 50% split, 50% commission

3. AI DECISIONS
   a. AI decisions in Phase 3 are FINAL and BINDING
   b. No appeals process within the platform
   c. Users accept AI resolution authority by using the platform

4. EXTERNAL RESOLUTION
   a. Either party may opt for external resolution at Phase 3
   b. Dispute report provided to both parties
   c. Platform has no further involvement after external resolution
   d. Funds distributed per commission rules above
   e. External resolution includes: mediation, arbitration, Swiss courts

5. DEADLINES
   a. 48-hour response window for each proposal
   b. Failure to respond = proposal expires
   c. Phase deadlines are strictly enforced
   d. Auto-escalation occurs at deadline
```

---

## Summary

The new 3-phase system provides:

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Phase 1 Duration** | 30 days | 7 days max |
| **Counter-Offers** | Unlimited | Max 3 per party |
| **AI Involvement** | Final decision only | Phase 2 mediation + Phase 3 decision |
| **External Option** | Not formalized | Clear opt-out with report |
| **Commission Clarity** | Not specified | Clear rules per resolution type |
| **Total Duration** | 30+ days | 14 days max |

This creates a faster, fairer, and more flexible dispute resolution system that respects both parties' needs while maintaining platform integrity.
