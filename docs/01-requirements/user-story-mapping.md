# User Story Mapping

## Purpose

A comprehensive guide to user story mapping as a technique for discovering, organizing, and prioritizing user stories to build a shared understanding of the product and plan effective releases.

## Overview

User story mapping is a collaborative activity that helps teams:

- Visualize the user journey
- Identify gaps in functionality
- Prioritize features effectively
- Plan releases incrementally
- Build shared understanding
- Focus on user value

## What is User Story Mapping?

### Definition

User story mapping is a visual exercise that arranges user stories in a two-dimensional map to show the flow of activities users perform and the priority/release of features.

### The Two Dimensions

```
BACKBONE (Horizontal)
User Activities → Workflow Steps → Sequential Order
────────────────────────────────────────────────►

WALKING SKELETON (Vertical)
Story Priority → Release Planning → MVP to Future
        │
        ↓
    Higher Priority
        │
        ↓
    Lower Priority
```

### Basic Structure

```
┌─────────────────────────────────────────────────────┐
│           USER ACTIVITIES / EPICS                    │
├─────────────┬─────────────┬─────────────┬──────────┤
│   Browse    │   Select    │   Purchase  │ Receive  │
│  Products   │  Products   │   Products  │ Products │
├─────────────┼─────────────┼─────────────┼──────────┤
│ • View list │ • Add cart  │ • Checkout  │ • Track  │
│ • Search    │ • Compare   │ • Pay       │ • Notify │
│ • Filter    │ • Save fav  │ • Confirm   │ • Review │
│ • Sort      │ • Share     │ • Receipt   │          │
└─────────────┴─────────────┴─────────────┴──────────┘
        ↑             ↑            ↑            ↑
    Release 1     Release 1    Release 1    Release 2
```

## Building a Story Map

### Step-by-Step Process

#### 1. Frame the Problem

**Define the scope and goals**

```markdown
## Project Framing

**Product Vision**: Online marketplace for handmade crafts

**Target Users**:

- Craft buyers (primary)
- Craft sellers (secondary)

**Business Goals**:

- Enable craft purchases online
- Provide seller platform
- Generate transaction revenue

**Success Metrics**:

- 1000 active buyers in 6 months
- 100 active sellers
- $50K monthly GMV
```

#### 2. Map the Big Picture

**Identify user activities (the backbone)**

```
User Activities (High-Level):
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│  Discover  │→ │   Select   │→ │  Purchase  │→ │  Receive   │
│  Products  │  │  Products  │  │  Products  │  │  Products  │
└────────────┘  └────────────┘  └────────────┘  └────────────┘

Each activity represents a major step in the user journey
```

**Activity Template:**

```markdown
## Activity: [Name]

**User Goal**: What the user wants to achieve

**Context**: When/why this happens

**Value**: Why this matters to the user

**Dependencies**: What must happen first
```

#### 3. Explore the Details

**Break down activities into tasks (user stories)**

```
Activity: Discover Products
├── View product listings
│   ├── As a buyer, I want to see featured products
│   ├── As a buyer, I want to see new arrivals
│   └── As a buyer, I want to see popular items
├── Search for products
│   ├── As a buyer, I want to search by keyword
│   ├── As a buyer, I want to search by category
│   └── As a buyer, I want to see search suggestions
└── Filter products
    ├── As a buyer, I want to filter by price range
    ├── As a buyer, I want to filter by seller location
    └── As a buyer, I want to filter by rating
```

#### 4. Slice Out a Release

**Prioritize vertically to define releases**

```
Release Strategy:

MVP (Release 1) - Walking Skeleton
─────────────────────────────────
[Must Have] Core functionality to validate product-market fit

Release 2 - Enhanced Experience
────────────────────────────────
[Should Have] Features that significantly improve UX

Release 3 - Competitive Advantage
──────────────────────────────────
[Nice to Have] Differentiating features

Future - Innovation
───────────────────
[Won't Have Now] Ideas for later consideration
```

### Complete Story Map Example

```
┌──────────────────────────────────────────────────────────────────────┐
│                        E-COMMERCE USER JOURNEY                        │
├───────────────┬──────────────┬──────────────┬──────────────┬─────────┤
│   DISCOVER    │    SELECT    │   PURCHASE   │    FULFILL   │ SUPPORT │
│   PRODUCTS    │   PRODUCTS   │   PRODUCTS   │    ORDER     │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│               │              │              │              │         │
│ MVP           │              │              │              │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│ Browse list   │ View details │ Add to cart  │ View status  │ Contact │
│ Basic search  │ See photos   │ Enter info   │ Email notify │ seller  │
│               │ Add to cart  │ Pay (card)   │              │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│               │              │              │              │         │
│ RELEASE 2     │              │              │              │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│ Filter price  │ Compare items│ Save for     │ Track ship   │ FAQ     │
│ Filter cat    │ View reviews │ later        │ Update addr  │ Chat    │
│ Sort results  │ See similar  │ Apply coupon │              │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│               │              │              │              │         │
│ RELEASE 3     │              │              │              │         │
├───────────────┼──────────────┼──────────────┼──────────────┼─────────┤
│ Recommends    │ Wishlist     │ Multiple     │ Split ship   │ Returns │
│ Personalized  │ Share        │ payment      │ Gift wrap    │ Refunds │
│ Social proof  │ Q&A seller   │ methods      │              │         │
└───────────────┴──────────────┴──────────────┴──────────────┴─────────┘
```

## Story Map Components

### User Activities (Backbone)

**Characteristics:**

- High-level user goals
- Sequential flow
- User-centric (not system-centric)
- Stable over time

**Good Activity Names:**

```
✅ Browse Products
✅ Complete Purchase
✅ Track Order
✅ Manage Account

❌ Database Query (system-centric)
❌ API Call (technical detail)
❌ Submit Form (too specific)
```

### User Tasks (Stories)

**Characteristics:**

- Specific actions
- User perspective
- Testable
- Deliver value

**Story Format:**

```
As a [user role]
I want to [action]
So that [benefit]

Example:
As a buyer
I want to filter products by price range
So that I can find products within my budget
```

### Releases (Slices)

**Horizontal Slices:**

```
❌ Anti-Pattern: Building layer by layer
   Release 1: Database
   Release 2: Backend API
   Release 3: Frontend UI

   Problem: No user value until Release 3
```

**Vertical Slices:**

```
✅ Pattern: Building end-to-end features
   Release 1: Basic browse, select, purchase (MVP)
   Release 2: Enhanced search and filters
   Release 3: Personalization and recommendations

   Benefit: User value in every release
```

### Priority Layers

```
┌─────────────────────────────────────────┐
│          MUST HAVE (MVP)                 │  ← Critical for launch
├─────────────────────────────────────────┤
│          SHOULD HAVE                     │  ← Important but not blocking
├─────────────────────────────────────────┤
│          NICE TO HAVE                    │  ← Enhances experience
├─────────────────────────────────────────┤
│          WON'T HAVE (NOW)                │  ← Future consideration
└─────────────────────────────────────────┘
```

## Story Mapping Workshop

### Pre-Workshop Preparation

**1. Define Objectives**

```markdown
## Workshop Objectives

**Goal**: Create story map for Q1 release

**Participants**:

- Product Owner
- Development Team (4-6 people)
- UX Designer
- Key Stakeholder

**Duration**: 2-3 hours

**Deliverables**:

- Complete story map
- MVP scope defined
- Release plan
- Prioritized backlog
```

**2. Prepare Materials**

```
Physical Workshop:
□ Large wall space or whiteboard
□ Sticky notes (different colors)
□ Markers
□ Painter's tape
□ Camera for documentation

Virtual Workshop:
□ Miro/Mural board
□ Video conferencing
□ Shared document access
□ Breakout room capability
```

**3. Research & Prep**

```markdown
□ User research findings
□ Persona documents
□ Journey maps
□ Existing requirements
□ Technical constraints
□ Business goals
```

### Workshop Agenda

#### Opening (15 minutes)

```
1. Welcome & Introductions
2. Review Workshop Goals
3. Explain Story Mapping
4. Set Ground Rules
   - Everyone participates
   - No idea is bad
   - Focus on users
   - Time-box discussions
```

#### Frame the Problem (20 minutes)

```
1. Review Product Vision
2. Identify Target Users
3. Define Success Criteria
4. Discuss Constraints
```

#### Map User Activities (30 minutes)

```
1. Brainstorm user activities
2. Write on sticky notes
3. Arrange in sequence
4. Discuss and refine
5. Name each activity
```

**Facilitation Tips:**

```
Questions to Ask:
- "What does the user do first?"
- "What happens next?"
- "What's the user's goal here?"
- "Are we missing any steps?"
```

#### Explore User Tasks (45 minutes)

```
1. For each activity, brainstorm tasks
2. Write stories on sticky notes
3. Place under corresponding activity
4. Group similar stories
5. Identify gaps
```

**Story Writing Format:**

```
┌─────────────────────────────┐
│ As a [role]                 │
│ I want to [action]          │
│ So that [benefit]           │
│                             │
│ Acceptance Criteria:        │
│ • [criterion 1]             │
│ • [criterion 2]             │
└─────────────────────────────┘
```

#### Slice Releases (40 minutes)

```
1. Draw horizontal line for MVP
2. Select stories above line
3. Validate MVP completeness
4. Draw additional release lines
5. Assign stories to releases
```

**MVP Validation Questions:**

```
- Can users accomplish their core goal?
- Does it deliver measurable value?
- Is it the smallest testable product?
- What assumptions are we testing?
```

#### Wrap-Up (20 minutes)

```
1. Review complete map
2. Capture photos/screenshots
3. Identify action items
4. Schedule follow-ups
5. Gather feedback
```

### Post-Workshop Activities

**1. Document the Map**

```markdown
## Story Map Documentation

### Map Overview

[Photo/screenshot of complete map]

### User Activities

1. [Activity 1]: [Description]
2. [Activity 2]: [Description]
   ...

### Release Plan

**MVP (Release 1)**
Target: [Date]
Stories: [Count]
User Value: [Description]

**Release 2**
Target: [Date]
Stories: [Count]
User Value: [Description]

### Parking Lot Items

- [Idea not yet prioritized]
- [Question to research]
- [Dependency to resolve]
```

**2. Create Backlog**

```
Transform map into backlog:
1. Transfer stories to project management tool
2. Add details to each story
3. Assign story points
4. Link dependencies
5. Tag with release
```

**3. Maintain the Map**

```
Keep map alive:
□ Update as scope changes
□ Review during sprint planning
□ Revisit during retrospectives
□ Use for onboarding new team members
□ Update with learnings
```

## Advanced Techniques

### Story Map + Personas

```
┌────────────────────────────────────────────────────┐
│ PRIMARY PERSONA: Sarah (Frequent Buyer)            │
├────────────┬───────────┬──────────┬───────────────┤
│  Discover  │  Select   │ Purchase │    Receive    │
├────────────┼───────────┼──────────┼───────────────┤
│ Quick      │ Compare   │ Fast     │ Track         │
│ search     │ options   │ checkout │ delivery      │
│ Filters    │ Reviews   │ Saved    │ Notifications │
│            │           │ payment  │               │
└────────────┴───────────┴──────────┴───────────────┘

┌────────────────────────────────────────────────────┐
│ SECONDARY PERSONA: Mike (First-time Buyer)        │
├────────────┬───────────┬──────────┬───────────────┤
│  Discover  │  Select   │ Purchase │    Receive    │
├────────────┼───────────┼──────────┼───────────────┤
│ Browse     │ Detailed  │ Help &   │ Clear         │
│ featured   │ product   │ guidance │ instructions  │
│ Clear      │ info      │ Trust    │ Support       │
│ navigation │ Photos    │ signals  │ contact       │
└────────────┴───────────┴──────────┴───────────────┘
```

### Story Map + Journey Stages

```
AWARENESS → CONSIDERATION → DECISION → RETENTION
    ↓            ↓             ↓           ↓
  Browse →    Select    →  Purchase  → Re-order
  Search      Compare      Checkout    Referral
  Filter      Review       Payment     Support
```

### Impact Mapping Integration

```
GOAL: Increase monthly revenue by 30%

WHO (Actors)
├── Frequent Buyers
│   ├── IMPACT: Increase purchase frequency
│   │   └── DELIVERABLES:
│   │       ├── Personalized recommendations
│   │       ├── Reorder feature
│   │       └── Loyalty program
│   └── IMPACT: Increase average order value
│       └── DELIVERABLES:
│           ├── Bundle suggestions
│           └── Free shipping threshold
│
└── First-time Buyers
    └── IMPACT: Improve conversion rate
        └── DELIVERABLES:
            ├── Simplified checkout
            ├── Guest checkout
            └── Trust signals
```

### Story Map + OKRs

```
OBJECTIVE: Become the preferred marketplace for handmade crafts

KEY RESULT 1: 70% repeat purchase rate
├── Stories supporting this KR:
│   ├── Personalized recommendations
│   ├── Saved favorites
│   ├── Reorder feature
│   └── Email reminders

KEY RESULT 2: 4.5+ star average rating
├── Stories supporting this KR:
│   ├── Order tracking
│   ├── Easy returns
│   ├── Responsive support
│   └── Quality photos

KEY RESULT 3: 50% mobile conversion rate
├── Stories supporting this KR:
│   ├── Mobile-optimized search
│   ├── Mobile payment options
│   ├── Touch-optimized UI
│   └── Fast loading times
```

## Story Splitting Strategies

### 1. Workflow Steps

```
Epic: User Registration

Split by workflow:
├── Story 1: Enter email and password
├── Story 2: Verify email address
├── Story 3: Complete profile information
└── Story 4: Set preferences
```

### 2. Business Rules

```
Epic: Apply Discount Code

Split by rules:
├── Story 1: Apply percentage discount
├── Story 2: Apply fixed amount discount
├── Story 3: Apply free shipping discount
└── Story 4: Handle expired/invalid codes
```

### 3. Data Variations

```
Epic: Search Products

Split by data types:
├── Story 1: Search by product name
├── Story 2: Search by category
├── Story 3: Search by seller
└── Story 4: Search by tags
```

### 4. Operations (CRUD)

```
Epic: Manage Addresses

Split by operation:
├── Story 1: Add new address
├── Story 2: View saved addresses
├── Story 3: Edit existing address
└── Story 4: Delete address
```

### 5. Happy/Sad Paths

```
Epic: Process Payment

Split by scenarios:
├── Story 1: Successful payment
├── Story 2: Insufficient funds
├── Story 3: Invalid card details
└── Story 4: Payment gateway timeout
```

### 6. Simple/Complex

```
Epic: Product Search

Split by complexity:
├── Story 1: Basic keyword search
├── Story 2: Search with single filter
└── Story 3: Advanced search with multiple filters
```

## Common Pitfalls

### 1. Activity vs Feature Confusion

```
❌ Wrong (Feature-focused):
   User Registration → Product Catalog → Shopping Cart

✅ Right (Activity-focused):
   Discover Products → Select Products → Purchase Products
```

### 2. Too Many Stories in MVP

```
❌ Problem: MVP with 100 stories
   Result: Delays release, doesn't validate quickly

✅ Solution: Ruthless prioritization
   MVP: 15-25 stories (2-4 week development)
   Focus on learning, not perfection
```

### 3. Missing the User Journey

```
❌ Problem: Activities not in user sequence
   Payment → Browse → Checkout → Search

✅ Solution: Follow natural user flow
   Browse → Search → Select → Checkout → Payment
```

### 4. Technical Stories in Map

```
❌ Wrong:
   "Set up database"
   "Create API endpoints"
   "Configure Redis cache"

✅ Right:
   "View product details"
   "Search by category"
   "Filter by price"

Note: Technical stories go in backlog, not map
```

### 5. No Clear MVP

```
❌ Problem: Everything is high priority
   Result: Can't make trade-off decisions

✅ Solution: Define success criteria
   "What's the minimum to test our hypothesis?"
```

## Story Map Maintenance

### When to Update

**Regular Reviews:**

```
Sprint Planning: Review upcoming stories
Sprint Review: Update based on learnings
Quarterly: Review overall strategy
Major Pivots: Rebuild sections as needed
```

**Trigger Events:**

```
□ New user research insights
□ Significant scope changes
□ Shift in business priorities
□ Technical constraints discovered
□ Competitive landscape changes
```

### Version Control

```
Story Map Evolution:

v1.0 - Initial Workshop
├── Baseline map created
└── MVP defined

v1.1 - Post-MVP Review
├── Learnings incorporated
├── Release 2 refined
└── New stories added

v2.0 - Strategic Pivot
├── New user segment added
├── Activities reorganized
└── Priorities adjusted
```

### Digital Tools

**Recommended Tools:**

```
Collaborative Mapping:
- Miro (visual, flexible)
- Mural (structured templates)
- StoriesOnBoard (purpose-built)
- Jira with mapping plugin
- Azure DevOps with extensions

Simple Options:
- Google Sheets
- Trello
- Physical board (photo documentation)
```

## Metrics and Success

### Story Map Quality Indicators

```
Good Story Map Characteristics:
□ Activities represent user journey
□ Stories are vertical slices
□ MVP is clearly defined
□ Releases build incrementally
□ Everyone understands the map
□ Map drives conversations
□ Gaps are visible
□ Priorities are clear
```

### Outcome Metrics

```
Process Metrics:
- Time to create initial map: 2-3 hours
- Team alignment score: >80%
- Stories refined per session: 15-25

Delivery Metrics:
- MVP time-to-market: 4-8 weeks
- Release frequency: Every 4-6 weeks
- Scope creep: <10%

Value Metrics:
- Feature adoption rate: >60%
- User satisfaction: >4/5
- Business impact: Measurable improvement
```

## Templates and Examples

### Story Mapping Template

```markdown
# [Product Name] Story Map

## Vision

[Product vision statement]

## Users

- [Primary persona]
- [Secondary persona]

## Goals

- [Business goal 1]
- [Business goal 2]

## Story Map

### Activity 1: [Name]

**MVP**

- [ ] Story 1.1: [Description]
- [ ] Story 1.2: [Description]

**Release 2**

- [ ] Story 1.3: [Description]
- [ ] Story 1.4: [Description]

**Future**

- [ ] Story 1.5: [Description]

### Activity 2: [Name]

[Repeat structure]

## Release Plan

### MVP - [Target Date]

**Goal**: [What we're learning/validating]
**Scope**: [X stories]
**Success Criteria**:

- [Metric 1]
- [Metric 2]

### Release 2 - [Target Date]

**Goal**: [What we're improving]
**Scope**: [X stories]
**Success Criteria**:

- [Metric 1]
- [Metric 2]
```

### Real-World Example: Food Delivery App

```
┌────────────────────────────────────────────────────────────────┐
│                    FOOD DELIVERY USER JOURNEY                   │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│   DISCOVER   │    ORDER     │   PAYMENT    │     RECEIVE      │
│   FOOD       │    FOOD      │              │     ORDER        │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ MVP          │              │              │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ View nearby  │ Select items │ Enter card   │ See status       │
│ restaurants  │ Add to cart  │ Confirm      │ Track driver     │
│ See menu     │ Review order │ payment      │ Get notification │
│ Basic search │              │              │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ RELEASE 2    │              │              │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ Filter       │ Modify items │ Save payment │ Contact driver   │
│ cuisine      │ Add special  │ Apply promo  │ Rate order       │
│ Sort by      │ instructions │ Split bill   │ Tip driver       │
│ rating/price │ Schedule     │              │                  │
│ See reviews  │ order        │              │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ RELEASE 3    │              │              │                  │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ Personalized │ Reorder      │ Multiple     │ Order history    │
│ recommends   │ favorites    │ payments     │ Refund request   │
│ Dietary      │ Group order  │ Loyalty pts  │ Support chat     │
│ preferences  │              │              │                  │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

## Checklist

### Story Mapping Workshop Checklist

**Preparation:**

- [ ] Workshop scheduled with right participants
- [ ] Objectives defined
- [ ] User research available
- [ ] Materials prepared (physical/digital)
- [ ] Agenda shared with participants

**During Workshop:**

- [ ] Product vision reviewed
- [ ] User activities identified
- [ ] Activities arranged in sequence
- [ ] User stories written
- [ ] Stories organized under activities
- [ ] MVP defined
- [ ] Release lines drawn
- [ ] Map photographed/saved

**Follow-up:**

- [ ] Map documented
- [ ] Stories transferred to backlog
- [ ] Acceptance criteria added
- [ ] Dependencies identified
- [ ] Team alignment confirmed
- [ ] Next steps scheduled

## References

### Books

- "User Story Mapping" - Jeff Patton
- "Impact Mapping" - Gojko Adzic
- "User Stories Applied" - Mike Cohn

### Articles

- [The New User Story Backlog is a Map](https://www.jpattonassociates.com/the-new-backlog/) - Jeff Patton
- [Story Mapping Guide](https://www.atlassian.com/agile/project-management/user-story-mapping) - Atlassian

### Tools

- [Miro](https://miro.com) - Visual collaboration
- [StoriesOnBoard](https://storiesonboard.com) - Purpose-built tool
- [Mural](https://mural.co) - Digital workspace

## Related Topics

- [User Stories](user-stories.md)
- [Acceptance Criteria](acceptance-criteria.md)
- [Vertical Slicing](vertical-slicing.md)
- [Requirements Prioritization](requirements-prioritization.md)
- [Definition of Ready](../02-design/README.md)

---

_Part of: [Requirements Engineering](README.md)_
