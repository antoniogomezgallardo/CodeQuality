# Vertical Slicing

## Purpose

Comprehensive guide to vertical slicing—breaking down features into thin, deployable increments that deliver end-to-end value and enable continuous delivery.

## Overview

Vertical slicing enables:

- Faster time to value
- Reduced risk
- Better feedback loops
- Continuous deployment
- Incremental validation

## What is Vertical Slicing?

### Definition

Vertical slicing is the practice of breaking down features into thin, end-to-end slices that cross all architectural layers and deliver working functionality that provides value to users.

### Vertical vs Horizontal Slicing

```
HORIZONTAL SLICING (Anti-Pattern)
─────────────────────────────────

Sprint 1: Database Schema
┌──────────────────────────┐
│       Database           │  ← No user value yet
└──────────────────────────┘

Sprint 2: Backend API
┌──────────────────────────┐
│       Database           │
├──────────────────────────┤
│       API Layer          │  ← No user value yet
└──────────────────────────┘

Sprint 3: Frontend
┌──────────────────────────┐
│       Database           │
├──────────────────────────┤
│       API Layer          │
├──────────────────────────┤
│       Frontend           │  ← Value only in Sprint 3
└──────────────────────────┘

Problems:
❌ No value until all layers complete
❌ Late integration issues
❌ No early feedback
❌ High risk


VERTICAL SLICING (Best Practice)
────────────────────────────────

Sprint 1: Basic Login
┌────┬────┬────┐
│ DB │API │ UI │  ← Delivers value
└────┴────┴────┘
Login with email/password

Sprint 2: Social Login
┌────┬────┬────┐
│ DB │API │ UI │  ← Delivers value
└────┴────┴────┘
Login with Google

Sprint 3: Multi-Factor
┌────┬────┬────┐
│ DB │API │ UI │  ← Delivers value
└────┴────┴────┘
2FA via SMS

Benefits:
✅ Value delivered each sprint
✅ Early integration
✅ Continuous feedback
✅ Lower risk
```

### Characteristics of Good Vertical Slices

```
A good vertical slice:

End-to-End
├── Crosses all layers
├── Database to UI
├── Complete functionality
└── Independently deployable

Valuable
├── Delivers user value
├── Testable
├── Demonstrable
└── Usable

Small
├── Fits in one sprint
├── 2-5 days of work
├── Single developer/pair
└── Minimal dependencies

Complete
├── All acceptance criteria met
├── Tested
├── Documented
└── Production-ready
```

## Why Vertical Slicing?

### Benefits

**1. Faster Feedback**

```
Traditional Approach:
Requirements → Design → Build → Test → Deploy
                                        ↑
                            Feedback after 3 months

Vertical Slicing:
Slice 1 → Deploy → Feedback (Week 1)
Slice 2 → Deploy → Feedback (Week 2)
Slice 3 → Deploy → Feedback (Week 3)
          ↑
    Continuous learning
```

**2. Reduced Risk**

```
Risk Distribution:

Horizontal:
[████████████████████████] 100% risk at end

Vertical:
[████] Sprint 1: 25% risk
[████] Sprint 2: 25% risk
[████] Sprint 3: 25% risk
[████] Sprint 4: 25% risk
       ↑ Risk spread over time
```

**3. Continuous Value Delivery**

```
Value Accumulation:

Horizontal:
Release: ──────────────────────[100%] ← All value at end

Vertical:
Release: [25%]──[50%]──[75%]──[100%] ← Incremental value
         Week1  Week2  Week3  Week4
```

**4. Better Estimation**

```
Estimation Accuracy:

Large Feature (3 months): ±100% variance
Small Slice (3 days): ±25% variance
                      ↑ More predictable
```

## How to Slice Vertically

### Slicing Strategies

#### 1. By User Journey Steps

**Example: E-commerce Checkout**

```
Epic: Complete Purchase Flow

Horizontal (Wrong):
├── Sprint 1: Database tables
├── Sprint 2: Payment API
├── Sprint 3: Frontend forms
└── Sprint 4: Integration

Vertical (Right):
├── Slice 1: Guest checkout (happy path only)
│   ├── Add to cart
│   ├── Enter shipping info
│   ├── Enter payment (credit card only)
│   └── Confirm order
│
├── Slice 2: Account checkout
│   ├── Login/register
│   ├── Saved addresses
│   ├── Saved payment methods
│   └── Order history
│
├── Slice 3: Alternative payments
│   ├── PayPal integration
│   ├── Apple Pay
│   └── Google Pay
│
└── Slice 4: Advanced features
    ├── Gift cards
    ├── Promo codes
    └── Split payment
```

#### 2. By Simplicity/Complexity

**Example: Search Feature**

```
Epic: Product Search

Slice 1: Basic Search (1 week)
├── Search by product name
├── Exact match only
├── Display results in simple list
└── Max 20 results

Slice 2: Enhanced Search (1 week)
├── Partial word matching
├── Search by category
├── Pagination
└── Sort by relevance

Slice 3: Advanced Search (1 week)
├── Fuzzy matching
├── Auto-suggestions
├── Search filters (price, brand)
└── Sort by multiple fields

Slice 4: Smart Search (2 weeks)
├── Synonym support
├── Spell correction
├── Personalized results
└── Search analytics
```

#### 3. By Data Variations

**Example: File Upload**

```
Epic: Document Upload

Slice 1: Single image upload
├── Accept JPG only
├── Max size 1MB
├── Display preview
└── Basic validation

Slice 2: Multiple image formats
├── Accept JPG, PNG, GIF
├── Max size 5MB
├── Thumbnail generation
└── Format validation

Slice 3: Document files
├── Accept PDF, DOC, DOCX
├── Max size 10MB
├── File type detection
└── Virus scanning

Slice 4: Batch upload
├── Multiple files at once
├── Drag and drop
├── Progress indicator
└── Error handling
```

#### 4. By User Roles/Personas

**Example: Dashboard**

```
Epic: Analytics Dashboard

Slice 1: Basic User Dashboard
├── View own data only
├── 3 key metrics
├── Last 30 days
└── Simple charts

Slice 2: Manager Dashboard
├── View team data
├── 10 key metrics
├── Date range selector
└── Export to PDF

Slice 3: Admin Dashboard
├── View all data
├── Custom metrics
├── Real-time updates
└── Advanced filters

Slice 4: Executive Dashboard
├── High-level summaries
├── Comparative analysis
├── Trend predictions
└── Custom reports
```

#### 5. By Platform/Device

**Example: Responsive Design**

```
Epic: Product Listing

Slice 1: Desktop Experience
├── Grid layout (4 columns)
├── Hover effects
├── Sidebar filters
└── Pagination

Slice 2: Tablet Experience
├── Grid layout (2 columns)
├── Touch-friendly
├── Collapsible filters
└── Infinite scroll

Slice 3: Mobile Experience
├── List layout (1 column)
├── Bottom sheet filters
├── Swipe actions
└── Pull to refresh

Slice 4: Progressive Enhancement
├── Offline support
├── App-like experience
├── Push notifications
└── Home screen install
```

#### 6. By Business Rules

**Example: Pricing Engine**

```
Epic: Dynamic Pricing

Slice 1: Base Pricing
├── List price only
├── No discounts
├── Single currency (USD)
└── Tax included

Slice 2: Simple Discounts
├── Percentage discount
├── Flat amount discount
├── Single discount per order
└── Manual codes only

Slice 3: Advanced Discounts
├── Volume discounts
├── Customer segment pricing
├── Multiple discount stacking
└── Automatic discounts

Slice 4: Dynamic Pricing
├── Time-based pricing
├── Inventory-based pricing
├── Competitor pricing
└── A/B price testing
```

#### 7. By Happy/Sad Paths

**Example: Payment Processing**

```
Epic: Payment Handling

Slice 1: Happy Path
├── Valid card accepted
├── Sufficient funds
├── Successful authorization
└── Order confirmed

Slice 2: Basic Error Handling
├── Invalid card number
├── Expired card
├── Insufficient funds
└── Display error message

Slice 3: Advanced Error Handling
├── Network timeout
├── Gateway errors
├── Retry logic
└── Alternative payment

Slice 4: Edge Cases
├── Concurrent transactions
├── Partial authorization
├── Currency mismatch
└── Fraud detection
```

### Practical Slicing Techniques

#### SPIDR Framework

```
SPIDR Slicing Technique:

S - Spike/Simple
├── Start with simplest version
├── Technical spike if needed
└── Proof of concept

P - Paths
├── Split by user paths
├── Happy path first
└── Error paths later

I - Interfaces
├── Split by interface type
├── Web before mobile
└── API before UI

D - Data
├── Split by data variations
├── One data type first
└── Edge cases later

R - Rules
├── Split by business rules
├── Simple rules first
└── Complex rules later
```

**Example: User Registration**

```
Using SPIDR:

S - Simple:
├── Slice 1: Email + password only
└── No validation

P - Paths:
├── Slice 2: Happy path (valid data)
└── Slice 3: Error path (invalid data)

I - Interfaces:
├── Slice 4: Web interface
└── Slice 5: Mobile interface

D - Data:
├── Slice 6: Additional fields (name, phone)
└── Slice 7: Optional fields (bio, avatar)

R - Rules:
├── Slice 8: Password strength rules
├── Slice 9: Email verification
└── Slice 10: Social signup
```

#### Hamburger Method

```
Think of a feature like a hamburger:

┌─────────────────┐
│   Top Bun       │ ← UI Layer
├─────────────────┤
│   Lettuce       │ ← Validation
├─────────────────┤
│   Tomato        │ ← Business Logic
├─────────────────┤
│   Patty         │ ← Core Functionality
├─────────────────┤
│   Cheese        │ ← Data Access
├─────────────────┤
│   Bottom Bun    │ ← Persistence
└─────────────────┘

Vertical Slice = One bite through ALL layers
Each slice includes:
- UI
- Validation
- Business Logic
- Data Access
- Persistence
```

**Example: Product Catalog**

```
Slice 1: View Single Product (Basic Hamburger)
┌─────────────────────────────────┐
│ UI: Product detail page         │
│ Validation: Product ID valid    │
│ Logic: Fetch product info       │
│ Data: Query product table       │
│ DB: Products table              │
└─────────────────────────────────┘

Slice 2: View Product List (Add Lettuce)
┌─────────────────────────────────┐
│ UI: Product grid                │
│ Validation: Pagination params   │
│ Logic: Fetch product list       │
│ Data: Query with pagination     │
│ DB: Products table + indexing   │
└─────────────────────────────────┘

Slice 3: Search Products (Add Tomato)
┌─────────────────────────────────┐
│ UI: Search bar + results        │
│ Validation: Search query        │
│ Logic: Search algorithm         │
│ Data: Full-text search          │
│ DB: Search index                │
└─────────────────────────────────┘
```

## Slicing Workshop

### Workshop Format

**Duration:** 2 hours

**Participants:**

- Product Owner
- Development Team
- UX Designer (optional)
- QA Engineer (optional)

**Materials:**

- Whiteboard or digital board
- Sticky notes
- Markers
- User stories/features to slice

### Workshop Agenda

#### 1. Introduction (10 minutes)

```
□ Review vertical slicing concept
□ Explain benefits
□ Show examples
□ Set expectations
```

#### 2. Select Feature to Slice (10 minutes)

```
□ Choose one feature/epic
□ Review requirements
□ Understand user value
□ Identify constraints
```

#### 3. Brainstorm Slices (30 minutes)

```
Process:
1. Silent brainstorming (5 min)
   - Write slice ideas on sticky notes
   - One idea per note

2. Share and cluster (10 min)
   - Post all notes
   - Group similar ideas
   - Discuss variations

3. Refine slices (15 min)
   - Ensure each is vertical
   - Check completeness
   - Validate value delivery
```

#### 4. Prioritize Slices (20 minutes)

```
Prioritization Criteria:
- User value (high/medium/low)
- Technical risk (high/medium/low)
- Dependencies
- Learning value

Techniques:
- MoSCoW (Must/Should/Could/Won't)
- Value vs Effort matrix
- Weighted scoring
```

#### 5. Validate Slices (30 minutes)

```
For each slice, check:
□ Crosses all layers?
□ Delivers user value?
□ Independently deployable?
□ Fits in 2-5 days?
□ Testable?
□ Clear acceptance criteria?
```

#### 6. Estimate and Plan (15 minutes)

```
□ Size each slice (story points/hours)
□ Identify dependencies
□ Order slices
□ Assign to sprints
□ Flag risks
```

#### 7. Document and Close (5 minutes)

```
□ Capture photos/notes
□ Create stories in backlog
□ Schedule follow-up
□ Gather feedback
```

### Workshop Example

**Feature:** Customer Order History

**Initial Requirements:**

- View past orders
- See order details
- Track shipments
- Download invoices
- Re-order items
- Review products

**Brainstormed Slices:**

```
Slice 1: Basic Order List (Must Have)
├── View list of past orders
├── Show order date, number, total
├── Most recent first
├── Last 10 orders only
└── Estimate: 3 points

Slice 2: Order Details (Must Have)
├── Click order to see details
├── Show items, prices, status
├── Show shipping address
├── Show payment method
└── Estimate: 3 points

Slice 3: Search Orders (Should Have)
├── Search by order number
├── Search by date range
├── Filter by status
└── Estimate: 5 points

Slice 4: Track Shipment (Should Have)
├── View tracking number
├── See shipment status
├── Carrier integration
└── Estimate: 5 points

Slice 5: Download Invoice (Could Have)
├── PDF generation
├── Email invoice
├── Tax details
└── Estimate: 3 points

Slice 6: Quick Re-order (Could Have)
├── Add items to cart
├── Update quantities
├── Apply discounts
└── Estimate: 5 points

Slice 7: Pagination (Could Have)
├── Load more orders
├── Infinite scroll
├── Performance optimization
└── Estimate: 2 points

Slice 8: Product Reviews (Won't Have Now)
├── Review purchased items
├── Upload photos
├── See other reviews
└── Estimate: 8 points (deferred)
```

**Sprint Plan:**

```
Sprint 1:
- Slice 1: Basic Order List
- Slice 2: Order Details

Sprint 2:
- Slice 3: Search Orders
- Slice 7: Pagination

Sprint 3:
- Slice 4: Track Shipment
- Slice 5: Download Invoice

Future:
- Slice 6: Quick Re-order
- Slice 8: Product Reviews
```

## Common Challenges

### Challenge 1: "We can't slice this!"

**Problem:** Team believes feature can't be sliced smaller

**Solution:**

```
Ask probing questions:
- What's the absolute minimum?
- What if we had only 1 day?
- Can we reduce scope?
- Can we fake/stub parts?
- What's the core value?

Example: "Email Notification System"

Seems atomic, but can be sliced:

Slice 1: Send welcome email (template only)
Slice 2: Send order confirmation
Slice 3: Add personalization
Slice 4: Email scheduling
Slice 5: Email templates editor
Slice 6: Analytics and tracking
```

### Challenge 2: Shared Components

**Problem:** Multiple features need same component

**Solution:**

```
Build Just-In-Time:

Option 1: Build with first feature
├── Create component for Feature A
└── Reuse for Feature B later

Option 2: Build minimal version
├── Feature A: Basic component
└── Feature B: Enhanced component

Option 3: Fake it first
├── Feature A: Hardcoded values
├── Feature B: Configuration file
└── Later: Shared component

Example: Authentication
Slice 1: Hardcoded test user
Slice 2: Database lookup
Slice 3: OAuth integration
Slice 4: SSO integration
```

### Challenge 3: Technical Dependencies

**Problem:** Infrastructure needed before feature work

**Solution:**

```
Approaches:

1. Spike First (time-boxed)
├── 1-2 days setup
├── Prove feasibility
└── Then slice features

2. Fake It
├── Mock/stub dependencies
├── Deliver feature value
└── Replace later

3. Vertical Infrastructure
├── Build only what's needed
├── For this specific slice
└── Expand incrementally

Example: New database
Instead of:
❌ Sprint 1: Setup entire database
✅ Sprint 1: One table for Slice 1
✅ Sprint 2: Add tables for Slice 2
```

### Challenge 4: UI/UX Consistency

**Problem:** Incremental delivery creates inconsistent UX

**Solution:**

```
Strategies:

1. Design Ahead (but not too far)
├── Design next 2-3 slices
├── Build design system incrementally
└── Refactor as you learn

2. Vertical UI Components
├── Build component for slice
├── Extract to library
└── Reuse in next slice

3. Progressive Enhancement
├── Slice 1: Basic functionality
├── Slice 2: Polish and consistency
└── Slice 3: Advanced features

Example: Form Design
Slice 1: Basic form (native controls)
Slice 2: Custom styled inputs
Slice 3: Validation UI
Slice 4: Accessibility enhancements
```

## Best Practices

### 1. Start with Walking Skeleton

```
Walking Skeleton:
The thinnest possible slice that exercises the entire system

Example: E-commerce Site

Walking Skeleton (Week 1):
┌──────────────────────────────────┐
│ Frontend: One product page       │
│ Backend: One API endpoint        │
│ Database: One products table     │
│ Deploy: Manual to staging        │
└──────────────────────────────────┘

Value: Proves end-to-end flow works

Then Build On It:
Week 2: Add shopping cart
Week 3: Add checkout
Week 4: Add user accounts
...
```

### 2. Defer Optimization

```
Premature Optimization is Evil:

Slice 1: Make it work
├── Hardcode values
├── N+1 queries OK
├── Inline styles
└── Manual steps

Slice 2: Make it right
├── Extract variables
├── Optimize queries
├── Refactor code
└── Add tests

Slice 3: Make it fast
├── Caching
├── Indexing
├── Performance tuning
└── Monitoring

Slice 4: Make it scale
├── Load balancing
├── Database sharding
├── CDN
└── Auto-scaling
```

### 3. Use Feature Flags

```
Feature Flags Enable:
- Deploy incomplete features
- Test in production
- Gradual rollout
- Easy rollback

Example: New Checkout Flow

Week 1: Deploy behind flag (OFF)
├── Code in production
├── Flag disabled
└── Testing in prod

Week 2: Internal testing (5% users)
├── Enable for internal users
├── Gather feedback
└── Fix issues

Week 3: Beta rollout (20% users)
├── Enable for beta group
├── Monitor metrics
└── Iterate

Week 4: Full rollout (100% users)
├── Enable for everyone
├── Remove old code
└── Archive flag
```

### 4. Embrace Technical Debt

```
Intentional Technical Debt:

OK for early slices:
✅ Hardcoded values
✅ Duplicate code
✅ Missing edge cases
✅ Manual processes
✅ Basic error handling

Must pay back when:
□ Pattern repeats 3+ times
□ Changes become difficult
□ Performance issues arise
□ User experience suffers
□ Security risks exist

Example: Configuration
Slice 1: Hardcode settings
Slice 2: Config file
Slice 3: Database config
Slice 4: Admin UI for config
```

### 5. Validate Early and Often

```
Validation Checkpoints:

After each slice:
□ Demo to stakeholders
□ Gather user feedback
□ Check metrics
□ Validate assumptions
□ Adjust course if needed

Don't wait until the end!

Example: Search Feature
Slice 1: Basic search
└→ Validate: Is search useful?
     YES → Continue
     NO → Pivot to filters

Slice 2: Auto-suggest
└→ Validate: Do users use it?
     YES → Enhance
     NO → Try different approach
```

## Metrics and Success

### Slice Quality Metrics

```
Good Vertical Slice Indicators:

Size:
- Story points: 1-5
- Days to complete: 1-3
- Commits: 5-20
- Files changed: 5-30

Independence:
- Dependencies: 0-2
- Blockers: 0
- Waiting time: <10%

Value:
- User-facing: Yes
- Demonstrable: Yes
- Deployable: Yes
- Provides feedback: Yes
```

### Team Metrics

```
Slicing Effectiveness:

Lead Time:
= Time from start to production
Target: <1 week per slice

Deployment Frequency:
= Deployments per week
Target: ≥2 per week

Batch Size:
= Story points per deployment
Target: ≤5 points

Work in Progress:
= Concurrent slices
Target: ≤ team size
```

### Business Metrics

```
Value Delivery:

Time to Value:
= Days to first user benefit
Target: <2 weeks

Feature Adoption:
= % users using feature per slice
Target: >50%

Customer Satisfaction:
= Feedback score per slice
Target: ≥4/5

Learning Velocity:
= Validated hypotheses per sprint
Target: ≥2
```

## Examples by Domain

### SaaS Application: Subscription Management

```
Epic: Subscription Plans

Slice 1: View Current Plan (Day 1-2)
├── Display plan name and price
├── Show billing cycle
├── List included features
└── Simple layout

Slice 2: View Available Plans (Day 3-4)
├── List all plans
├── Show price comparison
├── Highlight differences
└── "Contact Sales" CTA

Slice 3: Upgrade Plan (Day 5-7)
├── Select new plan
├── Calculate prorated amount
├── Process payment
└── Activate new plan

Slice 4: Downgrade Plan (Day 8-10)
├── Select lower plan
├── Show feature loss warning
├── Schedule downgrade
└── Send confirmation

Slice 5: Cancel Subscription (Day 11-12)
├── Cancellation flow
├── Reason survey
├── Retention offer
└── Process cancellation

Slice 6: Billing History (Day 13-14)
├── List past invoices
├── Download PDFs
├── Payment method used
└── Transaction status
```

### Mobile App: Social Feed

```
Epic: Activity Feed

Slice 1: Static Feed (Week 1)
├── Display hardcoded posts
├── Show avatar, name, timestamp
├── Basic layout
└── Scrollable list

Slice 2: Dynamic Feed (Week 2)
├── Fetch from API
├── Loading state
├── Error handling
└── Pull to refresh

Slice 3: Like Posts (Week 3)
├── Like button
├── Like count
├── Optimistic update
└── Unlike functionality

Slice 4: Comments (Week 4)
├── View comments
├── Add comment
├── Comment count
└── Basic threading

Slice 5: Share Posts (Week 5)
├── Share button
├── Native share sheet
├── Copy link
└── Track shares

Slice 6: Media Posts (Week 6)
├── Display images
├── Image gallery
├── Video playback
└── Media carousel
```

### Enterprise: Reporting System

```
Epic: Custom Reports

Slice 1: Predefined Report (Sprint 1)
├── Select from 3 report types
├── Date range picker
├── Generate report
└── Display in table

Slice 2: Export Report (Sprint 1)
├── Export to CSV
├── Download file
└── Email report

Slice 3: Custom Metrics (Sprint 2)
├── Select metrics (checkboxes)
├── Max 5 metrics
├── Update report
└── Save selection

Slice 4: Filters (Sprint 2)
├── Add 1 filter
├── Dropdown options
├── Apply filter
└── Clear filter

Slice 5: Visualizations (Sprint 3)
├── Bar chart
├── Line chart
├── Toggle view
└── Export chart

Slice 6: Scheduling (Sprint 3)
├── Schedule frequency
├── Email recipients
├── Run automatically
└── View scheduled reports

Slice 7: Templates (Sprint 4)
├── Save report config
├── Load template
├── Share template
└── Template library
```

## Tools and Templates

### Slice Template

```markdown
# Vertical Slice: [Name]

## User Value

[What value does this deliver?]

## Scope

[What's included in this slice?]

### Included:

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3

### Excluded (Future Slices):

- [ ] Item 4
- [ ] Item 5

## Technical Approach

### Frontend:

- Component: [Name]
- Pages: [List]
- API calls: [Endpoints]

### Backend:

- Endpoints: [List]
- Services: [List]
- Database: [Tables/changes]

### Infrastructure:

- Deployment: [Where]
- Config: [What]
- Feature flag: [Name]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Testing

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual test cases

## Deployment

- [ ] Feature flag configured
- [ ] Monitoring in place
- [ ] Rollback plan ready
- [ ] Documentation updated

## Estimation

- Complexity: [Low/Medium/High]
- Story Points: [Number]
- Days: [Number]
- Dependencies: [List]
```

### Slicing Checklist

```markdown
## Vertical Slice Checklist

### Characteristics:

- [ ] Crosses all layers (UI → DB)
- [ ] Delivers user value
- [ ] Independently deployable
- [ ] 2-5 days of work
- [ ] No external dependencies
- [ ] Testable end-to-end

### Quality:

- [ ] Clear acceptance criteria
- [ ] Edge cases identified
- [ ] Error handling included
- [ ] Security considered
- [ ] Performance acceptable

### Documentation:

- [ ] User story written
- [ ] Technical design noted
- [ ] Test cases defined
- [ ] Deployment steps documented

### Team Alignment:

- [ ] Product Owner understands
- [ ] Development team sized it
- [ ] QA can test it
- [ ] Ready to start
```

## Checklist

### Slicing Workshop Checklist

**Preparation:**

- [ ] Feature/epic selected
- [ ] Requirements understood
- [ ] Team assembled
- [ ] Time allocated (2 hours)
- [ ] Materials ready

**During Workshop:**

- [ ] Slicing strategies reviewed
- [ ] Ideas brainstormed
- [ ] Slices identified
- [ ] Each slice validated
- [ ] Priorities assigned
- [ ] Estimates provided

**After Workshop:**

- [ ] Slices documented
- [ ] Stories created in backlog
- [ ] Dependencies identified
- [ ] Sprint plan updated
- [ ] Team aligned

## References

### Books

- "User Story Mapping" - Jeff Patton
- "Impact Mapping" - Gojko Adzic
- "Lean Software Development" - Mary & Tom Poppendieck
- "Continuous Delivery" - Jez Humble & David Farley

### Articles

- [Patterns for Splitting User Stories](https://agileforall.com/patterns-for-splitting-user-stories/) - Richard Lawrence
- [Vertical Slices](https://www.visual-paradigm.com/scrum/theme-epic-user-story-task/) - Visual Paradigm
- [SPIDR Framework](https://www.agilesocks.com/spidr-a-framework-for-splitting-user-stories/) - Agile Socks

### Videos

- "Feature Slicing" - Agile Alliance
- "Vertical Slices: small things, safely" - Dan North

## Related Topics

- [User Story Mapping](user-story-mapping.md)
- [Acceptance Criteria](acceptance-criteria.md)
- [Requirements Prioritization](requirements-prioritization.md)
- [Continuous Delivery](../08-cicd-pipeline/continuous-delivery.md)
- [Feature Flags](../07-development-practices/feature-flags.md)

---

_Part of: [Requirements Engineering](README.md)_
