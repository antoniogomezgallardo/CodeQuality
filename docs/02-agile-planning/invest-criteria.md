# INVEST Criteria for User Stories

## Overview

INVEST is a mnemonic acronym created by Bill Wake that defines the characteristics of well-formed user stories. Each letter represents a quality that makes user stories more effective and valuable in Agile development.

**INVEST stands for:**

- **I**ndependent
- **N**egotiable
- **V**aluable
- **E**stimable
- **S**mall
- **T**estable

## Purpose

- **Quality stories**: Create user stories that are actionable and valuable
- **Better planning**: Enable accurate estimation and sprint planning
- **Reduced dependencies**: Minimize blocking and waiting
- **Faster delivery**: Ship value incrementally and continuously
- **Clear acceptance**: Make success criteria unambiguous

## The INVEST Criteria

### I - Independent

User stories should be self-contained and independent of other stories, allowing them to be developed and delivered in any order.

#### Why Independence Matters

```markdown
**Benefits:**

- Flexible prioritization and sequencing
- Parallel development possible
- Reduced risk of blocking
- Easier estimation
- Simpler sprint planning

**Challenges of Dependent Stories:**

- One story blocked → multiple stories blocked
- Complex coordination required
- Difficult to change priorities
- Integration risks increase
```

#### Achieving Independence

```markdown
**Technique 1: Combine Dependent Stories**
❌ Before (Dependent):

- Story 1: Create user registration API
- Story 2: Create user registration UI

✅ After (Independent):

- Story: Implement user registration (API + UI)

**Technique 2: Reorder Dependencies**
❌ Before:

- Story A requires Story B to be complete first

✅ After:

- Redesign Story A to not require Story B
- Or combine them into one story

**Technique 3: Use Feature Flags**
✅ Enable development of features independently
✅ Deploy incomplete features hidden behind flags
✅ Release when fully ready

**Technique 4: Create Abstractions**
✅ Use interfaces/contracts between components
✅ Develop against contracts, not implementations
✅ Mock dependencies during development
```

#### Example: Making Stories Independent

```markdown
**Scenario:** E-commerce checkout flow

❌ **Dependent Stories:**

1. Create payment processing API
2. Integrate Stripe payment gateway
3. Add payment form UI
4. Implement order confirmation
5. Send order confirmation email

**Problems:**

- Story 3 depends on Story 1
- Story 4 depends on Stories 1-3
- Story 5 depends on Story 4
- Can't parallelize work
- Changes cascade through all stories

✅ **Independent Stories (Vertical Slices):**

1. "Implement checkout with mock payment" (E2E flow with placeholder)
2. "Replace mock payment with Stripe integration"
3. "Add order confirmation email notification"

**Benefits:**

- Story 1 delivers end-to-end value (even if simplified)
- Story 2 enhances existing feature
- Story 3 can be developed anytime
- Each can be tested independently
```

### N - Negotiable

User stories are not detailed contracts. They are placeholders for conversations and collaboration between the team and Product Owner.

#### Why Negotiability Matters

```markdown
**Enables:**

- Collaboration and co-creation
- Flexible solutions
- Innovation and creativity
- Adaptation to new information
- Scope negotiation under constraints

**Avoids:**

- Waterfall-style requirements documents
- Over-specification too early
- Stifling creativity
- Rigid commitments
```

#### Making Stories Negotiable

```markdown
**Write Stories as Conversation Starters:**
❌ Too Detailed (Not Negotiable):
"Create a red button labeled 'Submit' positioned 10px from the right edge,
using hex color #FF0000, 14px font size, with a 5px border radius, that
sends a POST request to /api/submit endpoint with JSON payload containing
userId, timestamp, and data fields."

✅ Negotiable:
"As a user, I want to submit my form data so that it's saved for future reference."

**Acceptance Criteria (Still Negotiable):**

- Form data is persisted when user clicks submit
- User receives confirmation that submission succeeded
- User can continue working after submission

**Discussion Points:**

- What data needs to be submitted?
- What constitutes successful submission?
- What should happen on errors?
- How should we confirm to the user?
```

#### Negotiation Examples

```markdown
**Scenario:** Performance requirement

**Initial Story:**
"As a user, I want search results in under 100ms"

**Negotiation:**
PO: "We need instant search"
Dev: "100ms is very challenging for our data volume"
PO: "What's realistic?"
Dev: "We can do 500ms consistently, 300ms with caching"
PO: "Would 300ms feel instant to users?"
UX: "Yes, anything under 400ms feels immediate"

**Negotiated Story:**
"As a user, I want search results within 300ms so that the experience feels instant"

---

**Scenario:** Scope under time pressure

**Initial Story:**
"As an admin, I want a dashboard showing all key metrics"

**Negotiation:**
PO: "We need this for the demo in 3 days"
Dev: "Full dashboard would take a week"
PO: "What's the minimum valuable version?"
Dev: "We could show top 3 metrics in 2 days"
PO: "Which 3 metrics matter most?"
Business: "Revenue, active users, error rate"

**Negotiated Story:**
"As an admin, I want to see revenue, active users, and error rate at a glance
so I can monitor system health"
```

### V - Valuable

Every user story must deliver value to the end user, customer, or business. If a story doesn't provide clear value, it shouldn't be in the backlog.

#### Why Value Matters

```markdown
**Ensures:**

- Business alignment
- User focus
- ROI justification
- Prioritization clarity
- Stakeholder buy-in

**Prevents:**

- Technical work without business value
- Gold plating
- Speculative features
- YAGNI violations (You Aren't Gonna Need It)
```

#### Expressing Value

```markdown
**Value Statement Template:**
"So that [business/user value]"

**Examples:**

✅ **User Value:**
"As a mobile user, I want to save my shopping cart
so that I don't lose my items if the app crashes"

✅ **Business Value:**
"As a business, I want to track abandoned carts
so that we can recover lost sales through email campaigns"

✅ **Both:**
"As a registered user, I want one-click checkout
so that I can complete purchases faster [user value]
which increases conversion rates [business value]"

❌ **No Clear Value:**
"As a developer, I want to refactor the payment module"
(This is technical work, not user-facing value)

✅ **Reframed with Value:**
"As a developer, I want to refactor the payment module
so that we can add new payment methods 50% faster,
enabling us to support customer requests for Apple Pay and Google Pay"
```

#### Measuring Value

```markdown
**Quantitative Value:**

- Increase conversion rate by 5%
- Reduce support tickets by 20%
- Save users 30 seconds per transaction
- Reduce infrastructure costs by $500/month

**Qualitative Value:**

- Improve user satisfaction (measured by NPS)
- Enhance brand perception
- Increase customer trust
- Reduce user frustration

**Value Validation:**
Before accepting a story, ask:

1. Who benefits from this?
2. How will they benefit?
3. How will we measure the benefit?
4. What happens if we don't build this?
```

### E - Estimable

The team must be able to estimate the size or effort required for a user story. If a story can't be estimated, it's too vague, too complex, or the team lacks knowledge.

#### Why Estimability Matters

```markdown
**Enables:**

- Sprint planning
- Velocity calculation
- Predictable delivery
- Commitment with confidence
- Risk identification

**Requires:**

- Sufficient understanding
- Appropriate size
- Required knowledge/skills
- Clarity of acceptance criteria
```

#### Barriers to Estimation

```markdown
**Barrier 1: Lack of Clarity**
❌ "Improve system performance"
❓ What system? How much improvement? Which metrics?

✅ "Reduce product search response time from 2s to <500ms"
✅ Specific, measurable, estimable

**Barrier 2: Too Large**
❌ "Build mobile app" (Epic, not a story)
❓ Too big to estimate accurately

✅ Break into smaller stories:

- "Implement user login on mobile"
- "Display product catalog on mobile"
- "Add shopping cart to mobile app"

**Barrier 3: Too Much Uncertainty**
❌ "Integrate with third-party API" (when API is undocumented)
❓ Unknown complexity, unknown issues

✅ Create a spike first:

- "Spike: Research and document third-party API integration approach"
- After spike, create estimable implementation story

**Barrier 4: Missing Knowledge**
❌ "Implement blockchain payment processing"
❓ Team has no blockchain experience

✅ Solutions:

- Time-boxed spike to gain knowledge
- Training/research time
- Bring in expert for estimation
- Conservative estimate with buffer
```

#### Making Stories Estimable

```markdown
**Technique 1: Use Spikes**
When uncertainty is high:

- Time-box research (1-3 days)
- Goal: Answer specific questions
- Output: Information to estimate real story

**Technique 2: Break Down Large Stories**
Epic → Features → Stories → Tasks

**Technique 3: Define Acceptance Criteria**
Clear criteria → Better understanding → Better estimates

**Technique 4: Reference Similar Stories**
"This is similar to the user registration we built last sprint"

**Technique 5: Use T-Shirt Sizing First**
XS, S, M, L, XL → refine to story points later
```

#### Estimation Techniques Example

```markdown
**Story:** "Add password reset functionality"

**Planning Poker Estimates:**
Developer A: 5 points (thinks it's straightforward)
Developer B: 13 points (concerned about email delivery)
Developer C: 8 points (moderate complexity)

**Discussion:**

- What's causing the difference?
- Have we done email delivery before?
- Do we have email templates ready?
- What about rate limiting?

**Refined Story with Clarifications:**

- Use existing email service (already integrated)
- Email template designed (part of DoR)
- Rate limiting: 3 reset requests per hour
- Token expiry: 1 hour

**Re-estimate:** Team consensus at 5 points
```

### S - Small

User stories should be small enough to complete within a single sprint (typically 1-3 days of work).

#### Why Small Stories Matter

```markdown
**Benefits:**

- Faster feedback
- Easier estimation
- Reduced risk
- More frequent value delivery
- Better flow
- Easier to test
- Less likely to be blocked

**Drawbacks of Large Stories:**

- Uncertainty increases
- Estimation accuracy decreases
- Risk of not completing in sprint
- Delayed feedback
- Integration challenges
```

#### Story Sizing Guidelines

```markdown
**Ideal Size:**

- 1-3 days of development work
- 1-8 story points (depending on team's scale)
- Completable within sprint
- Small enough to demo a tangible outcome

**Size Thresholds:**

- 🟢 **Perfect:** 1-5 points
- 🟡 **Acceptable:** 5-8 points (but consider splitting)
- 🔴 **Too Large:** 8-13 points (must split)
- ⛔ **Epic:** 13+ points (definitely split)

**Rule of Thumb:**
If a story takes more than half a sprint to complete, it's too large.
```

#### Splitting Large Stories

```markdown
**Pattern 1: Split by User Journey Steps**
Epic: "User can book a hotel room"

Split into:

1. "Search for available hotels"
2. "View hotel details and room options"
3. "Select room and enter booking details"
4. "Process payment and confirm booking"

**Pattern 2: Split by CRUD Operations**
Epic: "Manage product inventory"

Split into:

1. "Create new product"
2. "View product list"
3. "Update product details"
4. "Delete product"

**Pattern 3: Split by Business Rules**
Epic: "Calculate shipping costs"

Split into:

1. "Calculate domestic shipping"
2. "Calculate international shipping"
3. "Apply shipping discounts"

**Pattern 4: Split by Simple/Complex**
Epic: "User authentication"

Split into:

1. "Email/password login (simple)"
2. "OAuth social login (complex)"
3. "Two-factor authentication (complex)"

**Pattern 5: Split by Priority**
Epic: "Analytics dashboard"

Split into:

1. "Show top 3 key metrics (MVP)"
2. "Add detailed charts and graphs"
3. "Enable custom dashboard configuration"

**Pattern 6: Split by Platform**
Epic: "Mobile app push notifications"

Split into:

1. "iOS push notifications"
2. "Android push notifications"

**Pattern 7: Split by Test Scenarios**
Epic: "Payment processing"

Split into:

1. "Process successful payment"
2. "Handle payment failures"
3. "Process refunds"
```

### T - Testable

User stories must have clear, testable acceptance criteria. If you can't test whether a story is complete, it's not well-defined.

#### Why Testability Matters

```markdown
**Enables:**

- Clear definition of "done"
- Automated testing
- Objective acceptance
- Quality assurance
- Continuous integration

**Requires:**

- Measurable criteria
- Observable outcomes
- Specific behaviors
- Defined inputs/outputs
```

#### Making Stories Testable

```markdown
**Use Given-When-Then Format:**

**Story:** "As a user, I want to reset my password"

**Testable Acceptance Criteria:**

✅ **Scenario 1: Valid password reset**
Given I am on the login page
When I click "Forgot Password" and enter my email
Then I receive a password reset email within 2 minutes
And the email contains a valid reset link

✅ **Scenario 2: Reset with valid token**
Given I have a valid password reset token
When I create a new password meeting requirements
Then my password is updated
And I can log in with the new password

✅ **Scenario 3: Expired token**
Given I have a password reset token older than 1 hour
When I try to reset my password
Then I see an error "Reset link expired"
And I can request a new reset link

❌ **Non-Testable (Avoid):**

- "Password reset works well"
- "User experience is good"
- "System is secure"

✅ **Testable (Specific):**

- "Password reset email arrives within 2 minutes"
- "User can complete reset in 3 clicks"
- "Reset tokens expire after 1 hour"
```

#### Testability Checklist

```markdown
**For Each Story, Verify:**

- [ ] Acceptance criteria are specific and measurable
- [ ] Success conditions are clearly defined
- [ ] Failure scenarios are identified
- [ ] Edge cases are considered
- [ ] Test data requirements are known
- [ ] Manual test steps can be written
- [ ] Automated tests can be created
- [ ] Demo scenario is clear
```

## INVEST in Practice

### INVEST Scorecard

Use this scorecard to evaluate user stories:

```markdown
**Story:** [Write story here]

| Criterion   | Score (1-5) | Notes                                                  |
| ----------- | ----------- | ------------------------------------------------------ |
| Independent | [ ]         | Can it be developed without waiting for other stories? |
| Negotiable  | [ ]         | Is it open to discussion and refinement?               |
| Valuable    | [ ]         | Does it deliver clear user/business value?             |
| Estimable   | [ ]         | Can the team estimate the effort?                      |
| Small       | [ ]         | Can it be completed in 1-3 days?                       |
| Testable    | [ ]         | Are acceptance criteria clear and measurable?          |
| **Total**   | [ ] / 30    | Target: 25+ for ready stories                          |

**Action Items:**

- Score <20: Needs significant refinement
- Score 20-24: Needs some improvement
- Score 25+: Ready for sprint
```

### Example: INVEST Analysis

```markdown
**Story:**
"As a user, I want the app to be faster"

**INVEST Analysis:**

| Criterion   | Score     | Issues                     |
| ----------- | --------- | -------------------------- |
| Independent | 5/5       | ✅ No dependencies         |
| Negotiable  | 5/5       | ✅ Open to discussion      |
| Valuable    | 5/5       | ✅ Clear user value        |
| Estimable   | 1/5       | ❌ "Faster" is too vague   |
| Small       | 1/5       | ❌ Too large and undefined |
| Testable    | 1/5       | ❌ No measurable criteria  |
| **Total**   | **18/30** | ⚠️ **Needs Refinement**    |

**Refinement:**

"As a user, I want the search results page to load in under 1 second
so that I can find products quickly without frustration"

**Acceptance Criteria:**

- Search API responds in <500ms for 95% of requests
- Page renders search results in <800ms total
- Tested with 10,000 products in catalog
- Works on 3G mobile connections

**Re-scored:**

| Criterion   | Score     | Improvement                    |
| ----------- | --------- | ------------------------------ |
| Independent | 5/5       | ✅ Still independent           |
| Negotiable  | 5/5       | ✅ Can discuss thresholds      |
| Valuable    | 5/5       | ✅ Clear user benefit          |
| Estimable   | 5/5       | ✅ Now specific and clear      |
| Small       | 4/5       | ✅ Focused on one page/action  |
| Testable    | 5/5       | ✅ Measurable criteria defined |
| **Total**   | **29/30** | ✅ **Ready for Sprint**        |
```

## Common Anti-Patterns

### Anti-Pattern 1: Technical Task Stories

```markdown
❌ **Problem:**
"As a developer, I want to upgrade React to v18"

**Why it fails INVEST:**

- Not valuable to end user
- Not negotiable (technical necessity)
- Not small if it affects many components

✅ **Solution:**
Tie to user value or make it a task within a story:
"As a user, I want faster page transitions [React 18 concurrent rendering enables this]"

Or: Make it a technical story with business justification:
"Upgrade to React 18 to enable 30% faster rendering, improving user experience"
```

### Anti-Pattern 2: Component Stories

```markdown
❌ **Problem:**
"Build the shopping cart API"
"Build the shopping cart UI"

**Why it fails INVEST:**

- Not independent (UI depends on API)
- Doesn't deliver end-to-end value alone

✅ **Solution:**
Vertical slice:
"As a user, I want to add items to my shopping cart and see the total"
(Includes both API and UI for complete feature)
```

### Anti-Pattern 3: Spec Documents as Stories

```markdown
❌ **Problem:**
Attaching a 20-page detailed specification to a story

**Why it fails INVEST:**

- Not negotiable (too detailed too early)
- Stifles conversation
- Waterfall approach

✅ **Solution:**
Story + lightweight acceptance criteria + conversation
```

## Related Resources

- [Definition of Ready](definition-of-ready.md)
- [Definition of Done](definition-of-done.md)
- [Estimation Techniques](estimation-techniques.md)
- [User Story Mapping](../01-requirements/user-story-mapping.md)
- [Vertical Slicing](../01-requirements/vertical-slicing.md)

## References

- Bill Wake - INVEST in Good Stories
- Mike Cohn - User Stories Applied
- Scrum Guide - Product Backlog
- SAFe - Story Writing Workshop
- ISTQB - Requirements Engineering

---

_Part of: [Agile Planning](README.md)_
