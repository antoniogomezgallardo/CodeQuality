# Requirements Prioritization

## Overview

Requirements prioritization is the process of ranking and ordering requirements, features, and user stories based on business value, urgency, dependencies, and strategic alignment. Effective prioritization ensures teams work on the most valuable items first.

## Purpose

- **Maximize value**: Deliver highest-value features first
- **Resource optimization**: Focus limited capacity on what matters most
- **Risk management**: Address critical items early
- **Stakeholder alignment**: Create shared understanding of priorities
- **Adaptability**: Enable quick pivots based on feedback

## Prioritization Frameworks

### 1. MoSCoW Method

```markdown
**M - Must Have**

- Critical for release
- Without it, solution doesn't work
- Legal/regulatory requirement
- Core business functionality

**S - Should Have**

- Important but not critical
- Significant value, but workarounds exist
- High priority for users

**C - Could Have**

- Desirable but not necessary
- Nice-to-have features
- Minimal impact if excluded

**W - Won't Have (This Time)**

- Out of scope for current release
- Future consideration
- Explicitly deferred

**Example:**
Release 1.0 - Shopping Cart

**Must Have:**

- Browse products
- Add items to cart
- Checkout and payment
- Order confirmation

**Should Have:**

- Product search
- Filter by category
- Save cart for later

**Could Have:**

- Product recommendations
- Wishlist
- Product comparison

**Won't Have:**

- Subscription service
- Loyalty program
- AR product preview
```

### 2. Value vs. Effort Matrix

```markdown
**Quadrants:**

High Value, Low Effort (Quick Wins) → Do First
High Value, High Effort (Major Projects) → Plan & Execute
Low Value, Low Effort (Fill-Ins) → Do When Capacity Available
Low Value, High Effort (Money Pits) → Avoid

**Example Matrix:**

Quick Wins (High Value, Low Effort):

- Password reset
- Export to CSV
- Email notifications

Major Projects (High Value, High Effort):

- Multi-currency support
- Advanced analytics dashboard
- Mobile app

Fill-Ins (Low Value, Low Effort):

- UI color theme
- Keyboard shortcuts
- Tooltips

Money Pits (Low Value, High Effort):

- Custom report builder
- Video chat integration
- Blockchain integration
```

### 3. RICE Scoring

**Formula:** `RICE Score = (Reach × Impact × Confidence) / Effort`

```javascript
const riceScore = {
  // Reach: How many users affected per quarter
  reach: 1000, // users/quarter

  // Impact: How much it impacts each user (0.25, 0.5, 1, 2, 3)
  impact: 2, // Massive impact

  // Confidence: How sure are we (0-100%)
  confidence: 0.8, // 80% confident

  // Effort: Person-months needed
  effort: 2, // 2 person-months

  // Calculate RICE Score
  score: function () {
    return (this.reach * this.impact * this.confidence) / this.effort;
    // = (1000 × 2 × 0.8) / 2
    // = 1600 / 2
    // = 800
  },
};

// Higher scores = higher priority
```

**Example:**

| Feature         | Reach | Impact | Confidence | Effort | RICE | Priority |
| --------------- | ----- | ------ | ---------- | ------ | ---- | -------- |
| Password reset  | 500   | 3      | 100%       | 0.5    | 3000 | 1        |
| Social login    | 1000  | 1      | 80%        | 1      | 800  | 2        |
| Advanced search | 300   | 2      | 70%        | 2      | 210  | 3        |
| Dark mode       | 800   | 0.5    | 90%        | 1      | 360  | 4        |

### 4. Kano Model

```markdown
**Categories:**

**Basic (Must-Be):**

- Expected features (users assume they exist)
- Absence causes dissatisfaction
- Presence doesn't increase satisfaction
- Example: Login, logout, data security

**Performance (One-Dimensional):**

- More is better
- Linear satisfaction curve
- Example: Speed, accuracy, capacity

**Excitement (Delighters):**

- Unexpected features
- Absence doesn't cause dissatisfaction
- Presence creates delight
- Example: AI recommendations, gamification

**Indifferent:**

- Users don't care either way
- Low priority
- Example: Logo animation, unused features

**Reverse:**

- More feature = less satisfaction
- Avoid or make optional
- Example: Intrusive notifications, complex UIs
```

### 5. Weighted Shortest Job First (WSJF)

**Formula:** `WSJF = Cost of Delay / Job Duration`

```markdown
**Cost of Delay = Business Value + Time Criticality + Risk/Opportunity**

**Example:**

Feature: Real-time notifications

**Business Value:** 8/10 (high revenue impact)
**Time Criticality:** 7/10 (competitor just launched this)
**Risk/Opportunity:** 6/10 (enables future features)
**Cost of Delay:** 8 + 7 + 6 = 21

**Job Duration:** 3 weeks

**WSJF:** 21 / 3 = 7

Compare across features:

- Feature A: WSJF = 7 (priority 1)
- Feature B: WSJF = 4.5 (priority 3)
- Feature C: WSJF = 5.2 (priority 2)
```

### 6. Stack Ranking

```markdown
**Process:**

1. List all items
2. Force-rank from 1 to N (no ties)
3. Must choose between any two items

**Example:**

| Rank | Feature             | Justification           |
| ---- | ------------------- | ----------------------- |
| 1    | User authentication | Can't launch without it |
| 2    | Product catalog     | Core functionality      |
| 3    | Shopping cart       | Revenue-generating      |
| 4    | Search              | Usability critical      |
| 5    | Filters             | Nice-to-have            |
| 6    | Wishlist            | Future enhancement      |

**Benefits:**

- Forces hard decisions
- No ambiguity
- Clear priority order

**Drawbacks:**

- Time-consuming for large backlogs
- Can be contentious
- Doesn't account for dependencies
```

## Prioritization Factors

### Business Value

```markdown
**Revenue Impact:**

- Direct revenue generation
- Cost reduction
- Customer acquisition
- Customer retention

**Strategic Alignment:**

- Company goals
- Product vision
- Market positioning

**Customer Value:**

- Solves pain points
- Improves user experience
- Competitive advantage
```

### Risk and Opportunity

```markdown
**Technical Risk:**

- Complexity
- Unknowns
- Dependencies
- Technical debt

**Business Risk:**

- Regulatory compliance
- Security vulnerabilities
- Competitive threats
- Market windows

**Learning Opportunity:**

- Validate assumptions
- Gather user feedback
- Prove/disprove hypothesis
```

### Dependencies

```markdown
**Technical Dependencies:**

- Infrastructure requirements
- Platform constraints
- Integration points

**Business Dependencies:**

- Legal/compliance
- Marketing campaigns
- Partner agreements
- Seasonal events
```

### Urgency

```markdown
**Time-Sensitive:**

- Regulatory deadlines
- Contractual commitments
- Market windows
- Event-driven (Black Friday, holidays)

**Cost of Delay:**

- Revenue loss per week/month
- Customer churn risk
- Competitive disadvantage
```

## Prioritization Process

### Step 1: Gather Input

```markdown
**Stakeholders:**

- Product Owner/Manager
- Customers/Users
- Development Team
- Business Leadership
- Sales/Support Teams

**Data Sources:**

- User feedback
- Analytics data
- Market research
- Competitive analysis
- Technical assessments
```

### Step 2: Apply Framework

```markdown
**Choose appropriate framework:**

- MoSCoW for releases
- RICE for feature backlogs
- WSJF for flow-based teams
- Value/Effort for quick decisions
```

### Step 3: Validate and Refine

```markdown
**Validation Questions:**

- Does this align with strategy?
- Are dependencies considered?
- Is sequencing logical?
- Are quick wins identified?
- Is stakeholder buy-in achieved?
```

### Step 4: Communicate and Commit

```markdown
**Communication:**

- Share rationale for priorities
- Explain trade-offs made
- Set expectations on timing
- Document decisions

**Commit:**

- Lock priorities for sprint/release
- Resist mid-sprint changes
- Review and adjust regularly
```

## Common Prioritization Challenges

### Challenge 1: Everything is Priority 1

```markdown
❌ **Problem:** All features marked as "critical"

✅ **Solution:**

- Force-rank (only one #1)
- Use objective frameworks (RICE, WSJF)
- Educate on cost of context switching
- Show capacity vs. demand
```

### Challenge 2: HiPPO (Highest Paid Person's Opinion)

```markdown
❌ **Problem:** Executive overrides data-driven priorities

✅ **Solution:**

- Use data to support decisions
- Show impact analysis
- Propose experiments/pilots
- Escalate trade-offs explicitly
```

### Challenge 3: Shiny Object Syndrome

```markdown
❌ **Problem:** Constantly chasing new ideas

✅ **Solution:**

- Time-box new idea evaluation
- Add to backlog, prioritize later
- Finish in-progress work first
- Regular backlog grooming
```

### Challenge 4: Ignoring Technical Debt

```markdown
❌ **Problem:** Only prioritizing features, never refactoring

✅ **Solution:**

- Reserve 20% capacity for technical work
- Quantify debt impact (speed, quality)
- Make technical work visible
- Include in Definition of Done
```

## Related Resources

- [User Story Mapping](user-story-mapping.md)
- [Vertical Slicing](vertical-slicing.md)
- [Definition of Ready](../02-agile-planning/definition-of-ready.md)
- [INVEST Criteria](../02-agile-planning/invest-criteria.md)

## References

- Jeff Patton - User Story Mapping
- SAFe - WSJF Prioritization
- Intercom - RICE Scoring
- Noriaki Kano - Kano Model
- Mike Cohn - Agile Estimating and Planning

---

_Part of: [Requirements Engineering](README.md)_
