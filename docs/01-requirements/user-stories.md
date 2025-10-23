# User Stories

## Overview

A user story is a short, simple description of a feature or requirement told from the perspective of the person who needs it, typically a user or customer. User stories are the fundamental building blocks of Agile requirements management.

## Purpose

- **User-centric**: Keep focus on user needs and value
- **Conversation starter**: Promote collaboration and discussion
- **Planning tool**: Enable estimation and sprint planning
- **Incremental delivery**: Break large features into deliverable pieces
- **Documentation**: Serve as lightweight requirement artifacts

## User Story Format

### Standard Template

```
As a [user role/persona]
I want [goal/desire]
So that [benefit/value]
```

### Components

```markdown
**Role:** Who wants this feature?

- End user
- Administrator
- System
- External API consumer

**Goal:** What do they want to do?

- Specific action or capability
- Clear and actionable
- Single responsibility

**Benefit:** Why do they want it?

- Business value
- User value
- Problem being solved
```

## Examples

### Example 1: E-Commerce

```markdown
**User Story:**
As a returning customer
I want to save items to my wishlist
So that I can purchase them later without searching again

**Value:** Increases customer retention and conversion

**Acceptance Criteria:**

- User can add items from product page to wishlist
- User can view all wishlist items in one place
- User can move items from wishlist to cart
- Wishlist persists across sessions
- User receives notification when wishlist item goes on sale
```

### Example 2: Admin Dashboard

```markdown
**User Story:**
As a system administrator
I want to see real-time error rates on the dashboard
So that I can quickly detect and respond to system issues

**Value:** Reduces mean time to detection (MTTD)

**Acceptance Criteria:**

- Dashboard displays error rate per minute
- Errors are categorized by severity (critical, warning, info)
- Dashboard updates every 30 seconds
- Historical error trends shown for past 24 hours
- Alert triggered when error rate exceeds threshold
```

### Example 3: API Consumer

```markdown
**User Story:**
As an API consumer
I want paginated responses for large datasets
So that my application doesn't timeout waiting for data

**Value:** Improves API performance and reliability

**Acceptance Criteria:**

- Endpoints return max 100 items per page by default
- Response includes pagination metadata (page, totalPages, totalItems)
- Client can specify page size (max 500 items)
- Response includes links to next/previous pages
- Performance: Response time <500ms for any page size
```

## Story Writing Best Practices

### 1. Focus on the "Why"

```markdown
❌ **Bad:** "Add a sort button to the table"
(What, no why)

✅ **Good:** "As a user, I want to sort the product table
so that I can find items by price more quickly"
(What + Why)
```

### 2. Keep It Simple

```markdown
❌ **Too Complex:**
"As a user, I want a comprehensive dashboard with real-time analytics,
historical trends, customizable widgets, export functionality,
and drill-down capabilities..."

✅ **Simplified (Split into Multiple Stories):**

1. "As a user, I want to see key metrics at a glance"
2. "As a user, I want to view historical trends"
3. "As a user, I want to export dashboard data"
```

### 3. Make It Independent (INVEST)

```markdown
❌ **Dependent:**

- Story A: "Build user authentication API"
- Story B: "Build user authentication UI"

✅ **Independent:**

- "As a user, I want to log in with email/password
  so I can access my account" (includes both API and UI)
```

### 4. Include Acceptance Criteria

```markdown
**Every story should have:**

- 3-5 testable acceptance criteria
- Clear definition of "done"
- Edge cases considered
- Non-functional requirements (performance, security)

**Format:** Given-When-Then

Given [context]
When [action]
Then [outcome]
```

### 5. Size Appropriately

```markdown
**Right Size:**

- Completable in 1-3 days
- 1-8 story points
- Fits in a single sprint
- Deliverable working functionality

**Too Large?** Split using:

- Workflow steps
- CRUD operations
- Business rules
- User roles
- Platforms
```

## Story Types

### Feature Stories

```markdown
**Purpose:** New functionality that delivers user value

**Example:**
As a mobile app user
I want to receive push notifications for order updates
So that I stay informed without checking the app constantly

**Characteristics:**

- User-facing
- Adds new capability
- Delivers direct value
- Typically 3-8 points
```

### Technical Stories

```markdown
**Purpose:** Technical work that enables future features or improves quality

**Example:**
As a development team
I want to implement database connection pooling
So that we can handle 10x more concurrent users

**Characteristics:**

- Not directly user-facing
- Enables other work
- Infrastructure/architecture
- Requires business value justification
```

### Bug Fix Stories

```markdown
**Purpose:** Fix defects in existing functionality

**Example:**
As a user
I need the date picker to work correctly
So that I can select dates without the calendar closing unexpectedly

**Characteristics:**

- Restores expected behavior
- Regression from working state
- Often higher priority
- Typically 1-5 points
```

### Spike Stories

```markdown
**Purpose:** Research, investigation, or proof-of-concept

**Example:**
As a development team
I want to research GraphQL integration options
So that we can make an informed decision on API architecture

**Characteristics:**

- Time-boxed (1-3 days)
- Outcome is information, not production code
- Not estimated in points (use hours)
- Results inform future stories
```

### Enabler Stories

```markdown
**Purpose:** Enable future functionality or improve system

**Example:**
As a system
I need automated database backups every 6 hours
So that we can recover from data loss with minimal impact

**Characteristics:**

- Infrastructure work
- Security improvements
- Compliance requirements
- Performance optimizations
```

## Story Decomposition Techniques

### 1. Workflow Steps

```markdown
**Epic:** User can complete online checkout

**Decomposed Stories:**

1. User can add items to cart
2. User can view and edit cart
3. User can enter shipping address
4. User can select shipping method
5. User can enter payment information
6. User can review and confirm order
7. User receives order confirmation
```

### 2. CRUD Operations

```markdown
**Epic:** Manage product catalog

**Decomposed Stories:**

1. Create new product
2. View product list
3. View product details
4. Update product information
5. Delete product
6. Search products
7. Filter products by category
```

### 3. Business Rules

```markdown
**Epic:** Calculate shipping costs

**Decomposed Stories:**

1. Calculate domestic standard shipping
2. Calculate domestic express shipping
3. Calculate international shipping
4. Apply free shipping promotion
5. Calculate shipping for oversized items
```

### 4. Simple/Complex Split

```markdown
**Epic:** User authentication

**Decomposed Stories:**

1. Email/password login (simple)
2. Password reset (medium)
3. OAuth social login (complex)
4. Two-factor authentication (complex)
5. Biometric login (complex)
```

### 5. Happy Path / Edge Cases

```markdown
**Epic:** Payment processing

**Decomposed Stories:**

1. Process successful credit card payment
2. Handle declined card
3. Process refund
4. Handle expired card
5. Process partial refund
```

## Story Mapping

### Backbone and Walking Skeleton

```markdown
**Backbone (User Journey):**
Browse → Select → Checkout → Pay → Confirm

**Walking Skeleton (MVP - First Row):**

- Basic product list
- Add to cart
- Simple checkout form
- Payment stub (manual processing)
- Email confirmation

**Subsequent Releases (More Rows):**
Row 2:

- Product search
- Cart editing
- Address validation
- Real payment gateway
- Order tracking

Row 3:

- Advanced filters
- Wishlist
- Guest checkout
- Multiple payment methods
- Order history
```

### Prioritization

```markdown
**Priority Levels:**

- **Must Have:** Core functionality, MVP
- **Should Have:** Important but not critical
- **Could Have:** Nice to have, future enhancement
- **Won't Have:** Out of scope for now

**MoSCoW Example:**

**Must:**

- User can browse products
- User can add items to cart
- User can checkout and pay

**Should:**

- User can search products
- User can filter by category
- User can save cart

**Could:**

- User can compare products
- User can share product links
- User can create wishlist

**Won't (This Release):**

- Subscription service
- Loyalty program
- AR product preview
```

## Acceptance Criteria

### Given-When-Then Format

```gherkin
Scenario: User adds item to cart

Given I am on a product detail page
And the product is in stock
When I click "Add to Cart"
Then the item is added to my cart
And the cart count increases by 1
And I see a confirmation message

Scenario: User adds out-of-stock item

Given I am on a product detail page
And the product is out of stock
When I view the page
Then the "Add to Cart" button is disabled
And I see "Out of Stock" message
And I can click "Notify When Available"
```

### Checklist Format

```markdown
**Acceptance Criteria:**

- [ ] User can click "Add to Cart" button
- [ ] Item appears in cart immediately
- [ ] Cart count badge updates
- [ ] Confirmation toast notification shows
- [ ] Cart persists across page refreshes
- [ ] Out of stock items cannot be added
- [ ] Maximum quantity limit enforced (99 per item)
- [ ] Add to cart works on mobile devices
```

## Story Refinement

### Refinement Checklist

```markdown
**Before Refinement:**

- [ ] Story has title and description
- [ ] User role identified
- [ ] Value/benefit stated

**During Refinement:**

- [ ] Team understands the goal
- [ ] Questions answered by Product Owner
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Technical approach discussed
- [ ] Story estimated
- [ ] Story meets INVEST criteria

**After Refinement:**

- [ ] Story meets Definition of Ready
- [ ] Story sized appropriately (1-8 points)
- [ ] No blocking dependencies
- [ ] Ready for sprint planning
```

### Refinement Anti-Patterns

```markdown
❌ **Waterfall Refinement:**
Creating detailed specifications before development

✅ **Agile Refinement:**
Just enough detail to estimate and start work

❌ **Solo Refinement:**
Product Owner refines alone, team sees story first time in planning

✅ **Team Refinement:**
Whole team participates in understanding and shaping

❌ **Analysis Paralysis:**
Spending hours trying to answer every possible question

✅ **Time-boxed:**
15-30 minutes per story, park unknowns for spikes
```

## Story Templates

### Feature Story Template

```markdown
**Title:** [Concise feature name]

**As a** [user role]
**I want** [goal/feature]
**So that** [business value]

**Description:**
[Additional context, background, or requirements]

**Acceptance Criteria:**

1. [Testable criterion 1]
2. [Testable criterion 2]
3. [Testable criterion 3]

**Technical Notes:**

- [Implementation considerations]
- [Dependencies]
- [Risks or concerns]

**Definition of Done:**

- [ ] Code complete and reviewed
- [ ] Tests passing (unit, integration, E2E)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product Owner accepted

**Story Points:** [Estimate]
**Priority:** [High/Medium/Low]
**Sprint:** [Sprint number or backlog]
```

### Bug Fix Template

```markdown
**Title:** [Brief bug description]

**As a** [affected user]
**I need** [correct behavior]
**So that** [impact if not fixed]

**Current Behavior:**
[What's happening now]

**Expected Behavior:**
[What should happen]

**Steps to Reproduce:**

1. [Step 1]
2. [Step 2]
3. [Observe incorrect behavior]

**Acceptance Criteria:**

1. Bug no longer occurs
2. No regression in related functionality
3. Test added to prevent recurrence

**Severity:** [Critical/High/Medium/Low]
**Story Points:** [Estimate]
```

## Metrics and Tracking

### Story Metrics

```javascript
const storyMetrics = {
  // Average time from created to started
  timeToStart: stories => {
    const times = stories.map(s => s.startedAt - s.createdAt);
    return times.reduce((a, b) => a + b) / times.length;
  },

  // Average time from started to done
  cycleTime: stories => {
    const times = stories.map(s => s.completedAt - s.startedAt);
    return times.reduce((a, b) => a + b) / times.length;
  },

  // Stories completed vs. committed
  commitmentReliability: (planned, completed) => {
    return (completed / planned) * 100; // Target: >85%
  },

  // Estimation accuracy
  estimationAccuracy: stories => {
    const variances = stories.map(s => Math.abs(s.estimated - s.actual) / s.estimated);
    return 1 - variances.reduce((a, b) => a + b) / variances.length;
    // Target: >75%
  },
};
```

## Related Resources

- [User Story Mapping](user-story-mapping.md)
- [Acceptance Criteria](acceptance-criteria.md)
- [Vertical Slicing](vertical-slicing.md)
- [INVEST Criteria](../02-agile-planning/invest-criteria.md)
- [Definition of Ready](../02-agile-planning/definition-of-ready.md)
- [Definition of Done](../02-agile-planning/definition-of-done.md)

## References

- Mike Cohn - User Stories Applied
- Jeff Patton - User Story Mapping
- Scrum Guide - Product Backlog
- SAFe - Stories
- ISTQB - Requirements Engineering

---

_Part of: [Requirements Engineering](README.md)_
