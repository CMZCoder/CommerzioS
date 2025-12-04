# CommerzioS - Service Marketplace Platform

## Project Overview

**CommerzioS** is a comprehensive, full-stack service marketplace platform built with modern technologies. It enables customers to discover and book services from verified vendors, with robust payment processing, dispute resolution, and community features.

The platform is designed for the Swiss market with multi-language support and local payment methods (TWINT, card payments via Stripe). It's built on **TypeScript**, **React**, **Express.js**, and **PostgreSQL**, providing a scalable foundation for a thriving service economy.

---

## Core Features

### 🔐 Authentication & Security

**Local Authentication**
- Email/password registration with strong password requirements (8+ chars, uppercase, number)
- Email verification system to confirm user identity
- Secure password hashing using bcrypt (cost factor 12)
- Password reset via email with time-limited tokens
- Account lockout after 5 failed login attempts (15-minute cooldown)

**Social Login (OAuth 2.0)**
- Google OAuth integration
- Twitter/X OAuth integration
- Facebook Login integration
- Seamless account linking across providers

**Session Management**
- Secure HTTP-only cookies with CSRF protection
- Express session storage in PostgreSQL
- Configurable session expiration
- Rate limiting on authentication endpoints

**Admin Portal**
- Separate admin authentication system
- Admin-specific dashboard and controls
- Default admin provisioning on first startup

---

### 🏪 Service Management

**Service Listings**
- Rich service descriptions with title, description, and detailed information
- Multi-image upload support (configurable max images per plan)
- Service categorization with main categories and subcategories
- Service location management (Swiss address validation)
- Service availability and scheduling

**Service Categories**
- Pre-defined main categories and subcategories
- AI-assisted category validation and suggestions
- User-submitted category requests for platform expansion
- Category popularity tracking

**Pricing Options**
- Multiple pricing tiers per service
- Support for fixed prices and custom pricing
- Currency support (CHF primary)
- Audit logging for all pricing changes
- Idempotency support for safe pricing updates

**Service Lifecycle**
- Draft mode for work-in-progress listings
- Published state for public visibility
- Renewal system with plan-based duration (typically 14 days)
- Service archival and deletion

---

### 📅 Booking System

**Booking Workflow**
1. **Request** - Customer submits booking request for specific date/time
2. **Vendor Response** - Vendor can accept or propose alternative
3. **Confirmation** - Mutual agreement on final date/time/price
4. **Service Delivery** - In-progress status during service
5. **Completion** - Vendor marks service complete, triggers payment

**Calendar Management**
- Vendor availability calendar with custom blocks
- Block by date (full day unavailable)
- Block by hours (specific time ranges)
- Calendar block editing and deletion
- Availability slot calculation

**Booking Lifecycle States**
- `PENDING` - Awaiting vendor response
- `CONFIRMED` - Agreed upon by both parties
- `IN_PROGRESS` - Service actively being provided
- `COMPLETED` - Service finished, payment ready
- `CANCELLED` - User or vendor cancelled

**Counter-Offers**
- Vendor proposes alternative date/time
- Customer can accept, reject, or counter-propose
- Full negotiation trail preserved

---

### 💳 Payment Processing

**Stripe Integration**
- PCI compliance via Stripe payment processing
- Card payment support (all major cards)
- Connect accounts for vendor payouts
- Webhook handling for payment events
- Refund processing

**TWINT Support**
- TWINT payment method (Swiss standard)
- Eligibility checking for vendors
- Special TWINT fee configuration
- QR code generation for TWINT payments

**Pricing & Fees**
- Configurable platform commission (base %)
- Card processing fees (Stripe: % + fixed)
- TWINT processing fees
- Transparent fee breakdown for users
- Automatic fee calculation

**Booking Payments**
- Create payment intent for bookings
- Partial refunds support
- Automatic vendor fund transfers
- Payment status tracking

**Escrow System**
- Funds held until service completion
- Dispute-triggered escrow review
- Automatic release on completion

---

### ⭐ Review & Reputation System

**Customer Reviews**
- 1-5 star rating system
- Written review with optional comments
- Review creation after booking completion
- Review editing (change rating/text)
- Review visibility to public

**Review Notifications**
- Vendor notified when new review received
- Vendor notified on rating changes
- Platform notified of very low ratings (support)

**Review Removal System**
- Vendor can request review removal
- Admin review and approval workflow
- Options to approve/reject removal requests
- Audit trail of all removal decisions

**Vendor Reputation**
- Average rating calculation
- Total review count
- Public profile with reviews section

---

### 💰 Tipping System

**Tip Creation**
- Cash tips after service completion
- Optional anonymous tipping
- Tip eligibility checking
- Multiple tip amounts or custom

**Tip Management**
- Customer can create and view tips given
- Vendor receives tip notifications
- Vendor views tip statistics
- Tip history and analytics

**Tip Eligibility**
- Only for completed bookings
- Customer-vendor relationship verification
- One tip per booking to prevent abuse

---

### 💬 Communication & Messaging

**Chat System**
- Direct messaging between customers and vendors
- Conversation threads per booking/service
- Message history preservation
- Message timestamps and read receipts

**Message Features**
- Send/receive messages in real-time via WebSocket
- Edit messages after sending
- Delete messages (from sender view)
- Message moderation capabilities
- System messages for booking updates

**Conversation Management**
- Create conversations automatically on booking
- Block conversations (mute notifications)
- Block users (prevent all communication)
- Unblock users and conversations
- Manage multiple conversations

**Notification Integration**
- Unread message count
- Message notifications (in-app, email, push)
- "Flagged" conversations for priority
- Auto-clear flags when read

---

### 🔔 Notification System

**Notification Types**
- **Messages** - Chat messages from other users
- **Bookings** - Booking requests, confirmations, reminders
- **Referrals** - Referral rewards and sign-ups
- **Services** - Service approvals and status updates
- **Payments** - Payment receipts and payouts
- **System** - Platform announcements
- **Reviews** - New reviews and rating changes
- **Promotions** - Special offers and deals

**Delivery Channels**
- In-app notifications (notification bell/sidebar)
- Email notifications (customizable per type)
- Web push notifications (browser/device)
- Smart notification batching

**Notification Management**
- Mark as read / unread
- Mark all as read
- Dismiss individual notifications
- Clear all notifications
- Per-type notification preferences

**Push Notifications**
- Web Push via VAPID protocol
- Browser permission handling
- Service worker integration
- Subscription management
- Unsubscribe support

**AI-Powered Prioritization**
- OpenAI-based notification ranking
- Financial impact weighting (payments prioritized)
- Time-sensitivity scoring (deadlines prioritized)
- User engagement pattern analysis
- Fallback to rule-based if AI unavailable

---

### 👥 Referral System

**Referral Mechanics**
- Generate unique referral codes per user
- Share referral links with others
- Track referrals and sign-ups
- Award points for successful referrals
- Multi-level commission structure

**Referral Rewards**
- Points awarded on referred user's first booking
- Configurable commission per level
- Direct referral vs. chain referral tracking
- Leaderboard for top referrers

**Points System**
- Accumulate points from referrals
- Redeem points for discounts
- Points balance and history
- Points expiration rules (configurable)
- Discount value calculation

**Admin Controls**
- Adjust user points manually
- Configure referral rewards
- View system-wide referral stats
- Top referrer analytics

---

### 🎯 Dispute Resolution

CommerzioS uses a structured 3-phase dispute resolution system designed for speed, fairness, and transparency.

---

#### **Phase 1: Direct Negotiation (Maximum 7 Days)**

Parties attempt to resolve issues directly before any formal process.

**How Phase 1 is Initiated:**
- **Customer initiates**: Clicks "Report Issue" on a completed booking (before escrow auto-release)
- **Vendor initiates**: Clicks "Report Issue" if there's a problem (customer no-show, payment concern)
- **Timing**: Can only be initiated after service is marked "completed" and before escrow auto-releases (48 hours)
- **Evidence Required**: Must upload at least one piece of evidence (photo, screenshot, document)
- **Notification**: Other party is immediately notified that an issue has been raised
- **Escrow Paused**: Auto-release is paused while dispute is active

**Process:**
1. **Issue Raised** - Party describes the problem and uploads required evidence (minimum 1 file)
2. **Direct Communication** - Both parties discuss and negotiate via chat
3. **Counter-Offer Proposals** - Vendor can propose alternative times, discounts, or solutions
4. **Maximum 3 Negotiation Attempts** - Each party can make up to 3 counter-proposals
5. **48-Hour Response Window** - Each proposal expires after 48 hours if no response
6. **7-Day Maximum** - Phase 1 ends automatically after 7 days if unresolved

**Counter-Offer Features:**
- Vendor can propose alternative date/time for booking
- Vendor can propose alternative pricing (discounts)
- Vendor can include custom message with proposal
- **Commission calculated on final accepted price** (if customer accepts discounted offer)
- Maximum 3 counter-proposals per party to prevent endless back-and-forth
- Full negotiation trail preserved for AI analysis if escalated

**Outcomes:**
- ✅ **Resolved** - Parties agree on solution → Commission charged on final agreed price
- ⏭️ **Escalate** - No agreement after 7 days or 3 attempts → Moves to Phase 2

---

#### **Phase 2: AI-Mediated Negotiation (Maximum 7 Days)**

If direct negotiation fails, AI analyzes all available information and proposes tailored resolution options.

**Process:**
1. **Evidence & Context Analysis** - AI thoroughly analyzes:
   - **Uploaded Evidence** - Photos, screenshots, documents, receipts from both parties
   - **Event Descriptions** - Written accounts of what happened from each party
   - **Behavior Analysis** - Communication tone, response times, good faith indicators
   - **Chat History** - Full conversation record from Phase 1
   - **Counter-Offer Timeline** - Who proposed what and when
   - **Booking Details** - Original service agreement, pricing, dates
2. **AI Generates Tailored Options** - Based on analysis, AI proposes up to 3 resolution options:
   - Options are **specific to the dispute** (not generic templates)
   - Each option includes **AI's reasoning** based on evidence
   - Options may include partial refunds, service credits, or specific remedies
   - Percentages/amounts are calculated based on **evidence strength**
3. **Parties Respond** - Both parties have 7 days to accept one option or counter-propose
4. **Matching** - If both parties accept the same option, dispute is resolved
5. **Counter-Proposals** - If parties don't match, they can counter-propose (max 3 per party)

**What AI Considers When Generating Options:**
- **Evidence Quality** - Clear photos/documents vs. vague claims
- **Description Consistency** - Do the accounts match the evidence?
- **Behavior Patterns** - Responsive vs. unresponsive, cooperative vs. hostile
- **Good Faith Indicators** - Did parties genuinely try to resolve in Phase 1?
- **Service Delivery** - Was the service provided as described?
- **Proportionality** - Is the complaint proportional to the issue?

**Outcomes:**
- ✅ **Resolved** - Parties agree on an AI option or counter-proposal → Funds distributed accordingly
- ⏭️ **Escalate** - No agreement after 7 days → Moves to Phase 3 (AI Final Decision)

---

#### **Phase 3: AI Final Decision or External Resolution (Immediate)**

If parties cannot agree in Phase 2, they have two options:

**Option A: AI Final Decision (Binding)**
- AI makes autonomous binding decision based on all evidence
- Decision is FINAL and executed immediately
- Funds distributed per AI decision (full refund / full payment / split)
- No appeals within the platform
- Users accept this when agreeing to Terms of Service

**Option B: External Resolution**
- Either party can choose: **"I will resolve this outside the platform"**
- Dispute marked as **"externally_resolved"** (or "outsourced")
- System generates **Dispute Report** for both parties containing:
  - Full chat history
  - All counter-offers and responses
  - AI's proposed options from Phase 2
  - Booking details and evidence
  - Timeline of negotiation attempts
- Report can be used with lawyers, mediation services, arbitration, or Swiss courts
- Dispute is closed within the platform

**Commission Handling for External Resolution:**
- **If customer chooses external**: Platform commission is charged on original booking amount, funds released to vendor
- **If vendor chooses external**: Platform commission is NOT charged, full refund to customer
- **Rationale**: The party opting out of AI resolution bears the cost/risk of external process
- This prevents gaming the system to avoid commission

---

**Key Principles:**
- ⚠️ **AI decisions are FINAL** - No appeals process within the platform (Phase 3A)
- ⚠️ **External option available** - Users can always choose legal/external resolution (Phase 3B)
- ⚠️ **Commission clarity** - Commission calculated on final agreed price or per external resolution rules
- ⚠️ **Speed** - Maximum 14 days (7 + 7) before final resolution, AI decides in minutes
- ⚠️ **Transparency** - Full audit trail and dispute reports available

**Dispute Management:**
- Maximum 3 counter-proposals per party in each phase
- 48-hour response windows to maintain momentum
- AI analyzes full negotiation history and good faith efforts
- Automatic logging and comprehensive audit trail
- Dispute reports generated on demand for external resolution

**Escrow Coordination:**
- Funds held throughout dispute process
- Automatic release per AI decision or agreed resolution
- Clear commission handling for each resolution type

---

### 📊 Admin Dashboard

**Analytics & Monitoring**
- View platform metrics and KPIs
- Monitor user activity trends
- Track platform revenue
- Service listing statistics
- Booking completion rates

**Autonomous System Oversight**
- Monitor AI dispute resolutions
- Review dispute decision logs
- Monitor review removal AI decisions
- Track AI performance metrics
- View audit trails for all automated actions

**User Management**
- View all users and profiles
- See user booking history
- Track user activity
- Manual user blocking if needed

**Service Management**
- Browse all service listings
- Monitor service activity
- Manual moderation if AI flags something
- Manage service categories

**Financial Oversight**
- View all transactions
- Monitor escrow accounts
- Track platform revenue splits
- Referral commission monitoring
- Payout analytics

**Manual Override Capability**
- Manually override AI decisions if necessary
- Issue manual refunds/adjustments
- Handle edge cases and special requests
- System pause/resume controls

---

### 🎨 AI-Powered Features

**AI Service Categorization**
- Analyze service descriptions
- Suggest appropriate categories
- Validate category assignments
- Learn from corrections

**AI Content Generation**
- Generate service titles from descriptions
- Create service descriptions from details
- Suggest hashtags from images
- Estimate pricing based on market data

**AI Category Validation**
- Validate category names
- Suggest similar/alternative categories
- Prevent misspellings
- Standardize category naming

**AI Admin Assistance**
- Monitor AI dispute resolutions
- Review decision explanations and audit trails
- Analyze conversation patterns
- Provide moderation suggestions

**AI User Support**
- Answer common user questions
- Troubleshoot booking issues
- Guide new vendors
- Explain platform features

---

### 🌍 Location & Address Features

**Swiss Address Validation**
- Validate Swiss addresses during registration
- Service location address validation
- Postal code verification
- Automatic address formatting

**Google Maps Integration**
- Interactive map for service search
- Service location display
- Distance calculation
- Map-based browsing

**Service Location Management**
- Specify service delivery location
- Multiple service locations per vendor
- Travel distance considerations
- Location-based filtering

---

### 📱 Mobile & UX Features

**Responsive Design**
- Mobile-optimized interface
- Touch-friendly components
- Adaptive layout for all screen sizes
- Mobile-specific navigation

**Search & Discovery**
- Full-text service search
- Category and subcategory filtering
- Location-based search
- Hashtag-based results
- Service card UI with key info

**User Profiles**
- Customer profile page
- Vendor profile showcase
- Profile image and bio
- Service listing and reviews
- Contact information display

**Favorites System**
- Save favorite services
- Quick access to bookmarks
- Persistent storage
- Organize by category

**Plans & Pricing**
- View available vendor plans
- Compare features and pricing
- Monthly and yearly options
- Feature highlights per plan

---

## Architecture & Technology Stack

### Frontend
- **React 19** - UI library with hooks
- **TypeScript** - Type safety
- **Vite** - Fast build tooling
- **React Router (Wouter)** - Client-side routing
- **React Hook Form** - Form management
- **TanStack React Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Animation library
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend
- **Express.js** - Web framework
- **Node.js 20+** - Runtime
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Neon Serverless** - Optional cloud database
- **Passport.js** - Authentication middleware
- **Express Session** - Session management
- **Nodemailer** - Email sending
- **bcrypt** - Password hashing
- **Stripe SDK** - Payment processing
- **OpenAI SDK** - AI features
- **Web Push** - Push notification sending
- **Google Auth Library** - OAuth
- **OpenID Client** - OAuth provider support
- **Node Cron** - Scheduled tasks
- **WebSocket (ws)** - Real-time chat

### Infrastructure
- **PostgreSQL** - Primary data store
- **Google Cloud Storage / AWS S3** - Image/file storage
- **Stripe** - Payment processor
- **SendGrid / SMTP** - Email delivery
- **OpenAI API** - AI/NLP features
- **Google Maps API** - Location services
- **Twilio** (optional) - SMS capabilities
- **Web Push** - Browser notifications

### Testing
- **Playwright** - E2E testing
- **Vitest** - Unit testing
- **Testing Library** - React component testing
- **Supertest** - API testing

---

## Current Development Status

### ✅ Completed Features
- Core booking system (request → accept → complete)
- Multi-vendor service listings with categories
- Authentication (local + OAuth)
- Payment processing (Stripe + TWINT)
- Review system with removal requests
- Notification system (in-app, email, push)
- Referral and points system
- Tip system
- Chat and messaging
- Calendar availability management
- Admin dashboard
- AI-assisted features
- Swiss address validation
- E2E test suite (29/36 tests passing)

### 🚧 In Progress / Known Issues
- Service ownership validation for certain operations
- Escrow transaction requirements for dispute creation
- Availability endpoint refinement
- Review removal flow (service ownership check)

### 📋 Planned Features
- **Payment Details Storage** - Save and manage credit cards on user profile for faster checkout
- Advanced analytics dashboard (vendor-specific)
- Service image editing and optimization
- Video support for service demonstrations
- Service bundles and packages
- Subscription-based services
- Advanced filtering and search
- Multi-language support enhancement
- Mobile app (React Native)
- Enhanced dispute evidence handling
- Service recommendations engine

---

## Key Business Logic

### Commission Structure
- **Platform Commission**: 5% base fee (configurable)
- **Card Processing**: 2.90% + CHF 0.30 (Stripe standard)
- **TWINT Processing**: 1.30%
- **Vendor Payout**: Remaining after fees

### Pricing Rules
- Prices in CHF (Swiss Francs)
- Support for fixed pricing per service
- Pricing options per service (e.g., basic/premium)
- Custom pricing proposals via counter-offers

### Booking Rules
- Customer must specify date and time
- Vendor can accept or propose alternative
- Both parties must agree before booking confirmed
- Service completed within 30 days of booking
- Reviews can only be left after completion

### Dispute Rules
- **Phase 1 (7 days max)**: Direct negotiation with maximum 3 counter-proposals per party
- **Phase 2 (7 days max)**: AI-mediated negotiation with 3 proposed options
- **Phase 3**: AI final decision OR external resolution option
- Maximum 14 days total before AI final decision (if parties don't agree earlier)
- Requires escrow transaction to exist
- AI decisions: full refund to customer, full release to vendor, or percentage split
- Commission calculated on final agreed price (if discounted during negotiation)
- **External Resolution Option**: Parties can opt for external legal process
  - Customer opts out → Commission charged, funds to vendor
  - Vendor opts out → No commission, full refund to customer
- **AI decisions are FINAL** - no appeals process within platform
- Dispute reports available for external resolution use
- Users who choose external resolution must handle outside platform (mediation, arbitration, Swiss courts)

### Referral Rules
- Points awarded on referred user's first booking
- Multi-level tracking (direct referrals + chain)
- Points can be redeemed for discounts
- Leaderboard resets yearly

---

## Security Considerations

### Authentication
- Passwords never logged or transmitted in plaintext
- Bcrypt hashing with cost factor 12
- Email verification for registration (optional)
- Account lockout on failed attempts
- Secure session storage in database

### Payment Security
- PCI compliance via Stripe
- No card details stored locally
- Webhook validation for payment events
- Idempotency support for safe retries
- TWINT QR codes generated server-side

### Data Protection
- HTTPS-only in production
- CORS properly configured
- Rate limiting on sensitive endpoints
- SQL injection prevention via ORM
- XSS protection via React/escaping

### Access Control
- Authentication required for user endpoints
- Email verification for sensitive operations
- Admin-only endpoints properly protected
- Vendor data isolation (can't access other vendors' data)
- Customer data isolation

---

## Development Commands

```bash
# Setup & Installation
npm install                    # Install dependencies
npm run db:push              # Create database schema
npm run db:studio            # Open Drizzle Studio (DB GUI)

# Development
npm run dev                  # Start dev server (backend + frontend)
npm run dev:client           # Frontend only (Vite)

# Testing
npm run test                 # Run unit tests
npm test:watch              # Unit tests in watch mode
npm run test:e2e            # Run E2E tests
npm run test:e2e:ui         # E2E with UI mode
npm run test:e2e:debug      # E2E with debugger

# Production
npm run build               # Build for production
npm run start               # Start production server

# Code Quality
npm run lint                # Check for linting issues
npm run lint:fix            # Auto-fix linting issues
npm run check               # TypeScript type checking

# Database
npm run db:reset            # Reset database and reseed
```

---

## Environment Configuration

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session encryption
- `PORT` - Server port (default: 5000)
- `APP_URL` - Application base URL

### Optional Variables
- `OPENAI_API_KEY` - For AI features
- `GOOGLE_MAPS_API_KEY` - For maps integration
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` - Payment processing
- `SMTP_*` - Email sending configuration
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth
- `TWITTER_CLIENT_ID/SECRET` - Twitter OAuth
- `FACEBOOK_APP_ID/SECRET` - Facebook Login
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` - Push notifications
- `TWILIO_*` - SMS capabilities (optional)
- `AWS_*` or `GCS_*` - Cloud storage configuration

---

## Testing

### Test Coverage
- **E2E Tests**: 29 passing, 7 skipped
- **Unit Tests**: Vitest-based
- **Component Tests**: React Testing Library

### Test Bypass System
- Secure HMAC-SHA256 token-based system
- 5-minute token expiration
- Single-use tokens to prevent replay attacks
- Restricted to `@commerzio.test` email domain
- Allows rapid E2E test setup

### Test Users
- `test-customer@commerzio.test` - Customer role
- `test-vendor@commerzio.test` - Vendor role
- `test-admin@commerzio.test` - Admin role

---

## Monitoring & Maintenance

### Automated Tasks
- Session cleanup (Express session)
- Email verification token expiration
- Password reset token cleanup
- Notification cleanup
- Booking reminders (scheduled)

### Manual Maintenance
- Database backups (depends on hosting)
- Log monitoring
- Error tracking
- Performance monitoring
- Security updates

---

## Future Roadmap

1. **Phase 1 (Q1)** - Fix escrow/service ownership issues, complete E2E tests
2. **Phase 2 (Q2)** - Advanced analytics, vendor dashboard enhancements
3. **Phase 3 (Q3)** - Mobile app, video support, service recommendations
4. **Phase 4 (Q4)** - Subscription services, advanced filtering

---

## Contact & Support

This is a comprehensive service marketplace platform built for the Swiss market. For questions about specific features or development, refer to the respective service files in `/server` and component files in `/client/src/pages` and `/client/src/components`.
