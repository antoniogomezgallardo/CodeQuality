# Definition of Ready (DoR)

## Overview

The Definition of Ready (DoR) is a checklist of criteria that a user story or requirement must meet before it can be brought into a sprint or iteration for development. It ensures that work items are properly prepared, understood, and actionable before the team commits to delivering them.

## Purpose

- **Prevent waste**: Avoid starting work on poorly understood or incomplete requirements
- **Enable planning**: Provide the team with enough information to estimate accurately
- **Reduce delays**: Minimize mid-sprint clarifications and blockers
- **Improve flow**: Ensure smooth handoffs between product and development
- **Set expectations**: Create shared understanding of what "ready" means

## Core DoR Criteria

### 1. Clear and Concise

```markdown
✅ User story follows standard format (As a... I want... So that...)
✅ Story is written in plain language understandable by all team members
✅ Title clearly describes the feature or change
✅ No ambiguous terms or jargon without explanation
```

### 2. Independent

```markdown
✅ Story can be developed without dependencies on other in-progress work
✅ Any dependencies are explicitly documented and resolved
✅ External dependencies have committed delivery dates
✅ Story doesn't block other high-priority work
```

### 3. Value-Driven

```markdown
✅ Business value is clearly articulated
✅ User or business need is evident
✅ Success criteria are defined
✅ Priority is assigned based on value
```

### 4. Estimable

```markdown
✅ Story is small enough to estimate reliably
✅ Team has sufficient knowledge to estimate
✅ Technical approach is understood (spike completed if needed)
✅ Risks and unknowns are identified
```

### 5. Small

```markdown
✅ Story can be completed within a single sprint
✅ Ideally completable in 1-3 days
✅ Large stories are broken down into smaller pieces
✅ Story represents a vertical slice of functionality
```

### 6. Testable

```markdown
✅ Acceptance criteria are defined and measurable
✅ Test scenarios can be written from the criteria
✅ Definition of Done is understood and achievable
✅ Test data requirements are identified
```

## Detailed DoR Checklist

### Requirements Clarity

#### User Story Elements

```markdown
**Required:**

- [ ] User role/persona identified
- [ ] Desired functionality described
- [ ] Business value/benefit stated
- [ ] Priority assigned (MoSCoW, numeric, etc.)

**Supporting Information:**

- [ ] Background/context provided
- [ ] Related user stories linked
- [ ] Screenshots/mockups attached (if UI work)
- [ ] Examples of expected behavior included
```

#### Acceptance Criteria

```gherkin
**Format: Given-When-Then**

Given [precondition/context]
When [action taken]
Then [expected outcome]

**Example:**
Given I am a logged-in user
When I click the "Export Data" button
Then a CSV file downloads containing my transaction history
And the file includes all transactions from the past 12 months
```

```markdown
**Checklist:**

- [ ] At least 3-5 testable acceptance criteria defined
- [ ] Positive and negative scenarios included
- [ ] Edge cases considered
- [ ] Performance expectations stated (if applicable)
- [ ] Security requirements specified (if applicable)
- [ ] Accessibility requirements noted (if applicable)
```

### Technical Readiness

#### Architecture and Design

```markdown
- [ ] Technical approach discussed and agreed upon
- [ ] Architectural concerns addressed
- [ ] API contracts defined (if applicable)
- [ ] Database schema changes identified (if applicable)
- [ ] Integration points documented
- [ ] Performance implications considered
```

#### Dependencies

```markdown
- [ ] External dependencies identified and available
- [ ] Internal dependencies mapped
- [ ] Third-party services/APIs documented
- [ ] Required infrastructure/environments ready
- [ ] Team dependencies coordinated
```

#### Technical Debt

```markdown
- [ ] Known technical debt documented
- [ ] Refactoring needs identified
- [ ] Impact on existing functionality assessed
- [ ] Migration strategy defined (if needed)
```

### Team Understanding

#### Knowledge Transfer

```markdown
- [ ] Product Owner available for questions
- [ ] Domain expert consulted (if needed)
- [ ] Team has necessary skills/knowledge
- [ ] Training completed (if required)
- [ ] Spike results documented (if spike was done)
```

#### Estimation

```markdown
- [ ] Team participated in estimation
- [ ] Story points/hours assigned
- [ ] Estimation confidence is high (>70%)
- [ ] Complexity understood by all team members
```

### Compliance and Quality

#### Non-Functional Requirements

```markdown
- [ ] Performance targets defined
- [ ] Security requirements specified
- [ ] Accessibility standards identified (WCAG 2.1)
- [ ] Localization needs documented (if applicable)
- [ ] Compliance requirements noted (GDPR, HIPAA, etc.)
```

#### Quality Standards

```markdown
- [ ] Test strategy defined
- [ ] Code review process understood
- [ ] Documentation requirements clear
- [ ] Deployment process identified
```

## DoR Implementation

### For Product Owners

```markdown
**Before Refinement:**

1. Write user story with clear value proposition
2. Gather supporting materials (mockups, examples, data)
3. Define initial acceptance criteria
4. Identify known dependencies
5. Assess priority and value

**During Refinement:**

1. Present story context and rationale
2. Walk through acceptance criteria
3. Answer team questions
4. Collaborate on criteria refinement
5. Document decisions and clarifications

**After Refinement:**

1. Update story with agreed changes
2. Ensure all DoR criteria are met
3. Mark story as "Ready" in backlog
4. Order story appropriately in backlog
```

### For Development Team

```markdown
**During Refinement:**

1. Ask clarifying questions
2. Identify technical concerns early
3. Propose technical approaches
4. Estimate story size
5. Suggest splitting if too large

**Before Sprint Planning:**

1. Review ready stories
2. Identify any new questions
3. Flag stories missing DoR criteria
4. Prepare technical questions for planning
```

### For Scrum Master

```markdown
**Facilitate DoR Process:**

1. Ensure DoR is documented and visible
2. Coach team on DoR criteria
3. Facilitate refinement sessions
4. Help resolve blockers to readiness
5. Track DoR metrics (% stories meeting DoR)

**Continuous Improvement:**

1. Review DoR effectiveness in retrospectives
2. Update criteria based on team feedback
3. Address recurring DoR gaps
4. Share DoR best practices across teams
```

## DoR Examples

### Example 1: E-commerce Feature

```markdown
**User Story:**
As a returning customer
I want to save items to my wishlist
So that I can purchase them later without searching again

**Value:** Increases customer retention and repeat purchases

**Priority:** High (P1)

**Acceptance Criteria:**

1. Given I'm logged in
   When I click "Add to Wishlist" on a product page
   Then the item is saved to my wishlist
   And I see a confirmation message

2. Given I have items in my wishlist
   When I navigate to "My Wishlist" page
   Then I see all saved items with images, names, and current prices

3. Given an item in my wishlist is out of stock
   When I view my wishlist
   Then the item shows "Out of Stock" status
   And I can choose to be notified when it's available

**Technical Notes:**

- Use existing user_items table with new item_type='wishlist'
- Implement Redis caching for wishlist counts (header badge)
- Max 100 items per wishlist

**DoR Status:** ✅ Ready

- Clear user value and business need
- All acceptance criteria testable
- Technical approach agreed (discussed in refinement)
- No blocking dependencies
- Estimated at 5 story points
- Can be completed in one sprint
```

### Example 2: API Enhancement

```markdown
**User Story:**
As an API consumer
I want paginated responses for large datasets
So that I don't experience timeouts or performance issues

**Value:** Improves API performance and user experience for clients

**Priority:** Medium (P2)

**Acceptance Criteria:**

1. Given I request a collection endpoint (e.g., /api/v1/users)
   When the response contains >100 items
   Then the response is paginated with 100 items per page

2. Given a paginated response
   When I receive the response
   Then the response includes metadata: total_count, page, page_size, total_pages

3. Given I want to navigate pages
   When I provide ?page=2&page_size=50 parameters
   Then I receive the second page with 50 items

4. Given I request an invalid page number
   When the page doesn't exist
   Then I receive a 404 error with helpful message

**Technical Notes:**

- Implement cursor-based pagination for user-facing endpoints
- Offset pagination acceptable for admin endpoints
- Default page_size=100, max page_size=500
- Add pagination to: /users, /products, /orders, /transactions

**Dependencies:**

- Database indexes on common sort fields (completed)
- API versioning strategy in place (v1)

**DoR Status:** ✅ Ready

- Technical spike completed
- Database performance tested with 10M records
- All affected endpoints identified
- Estimated at 8 story points
- API contract reviewed with consumers
```

### Example 3: Bug Fix

```markdown
**User Story:**
As a user
I need the date picker to work correctly
So that I can select dates without the calendar closing unexpectedly

**Value:** Fixes critical UX issue affecting 15% of users

**Priority:** Critical (P0)

**Acceptance Criteria:**

1. Given I open the date picker
   When I select a date
   Then the calendar remains open until I click outside or press Escape

2. Given I'm navigating months in the date picker
   When I click the next/previous month arrows
   Then the calendar stays open and shows the new month

3. Given the date picker is open
   When I click on the input field again
   Then the calendar doesn't close and reopen (no flicker)

**Steps to Reproduce:**

1. Navigate to any page with date picker
2. Click on date input field
3. Click on any date
4. Result: Calendar closes immediately
5. Expected: Calendar should stay open for further selection

**Technical Notes:**

- Issue is in DatePicker.tsx line 145
- Event propagation preventing default behavior
- Fix requires updating onClick handler and adding stopPropagation
- Regression test needed to prevent future breaks

**DoR Status:** ✅ Ready

- Root cause identified
- Fix approach validated
- Test scenario documented
- Estimated at 2 story points
- Can be completed in 1 day
```

## Common DoR Anti-Patterns

### 1. Waterfall DoR

```markdown
❌ **Problem:** DoR requires detailed design docs before development

✅ **Solution:** Keep DoR lightweight; detailed design can emerge during development
```

### 2. Analysis Paralysis

```markdown
❌ **Problem:** Team endlessly refines stories trying to answer every question

✅ **Solution:** Accept some uncertainty; use time-boxing for refinement
```

### 3. One-Size-Fits-All

```markdown
❌ **Problem:** Same DoR criteria for bugs, features, spikes, and technical stories

✅ **Solution:** Adapt DoR criteria based on work item type
```

### 4. DoR as Gate

```markdown
❌ **Problem:** DoR used to reject work or blame Product Owner

✅ **Solution:** DoR is a collaboration tool; team works together to make stories ready
```

### 5. Rigid Checklist

```markdown
❌ **Problem:** DoR checklist rigidly enforced regardless of context

✅ **Solution:** DoR is a guideline; apply pragmatically based on story complexity
```

## Metrics and Tracking

### DoR Effectiveness Metrics

```javascript
// Track DoR compliance
const dorMetrics = {
  // Stories marked ready vs. actual readiness
  falseReadyRate: (storiesReopened / storiesMarkedReady) * 100,

  // Stories pulled back from sprint due to lack of clarity
  pullbackRate: (storiesPulledBack / storiesCommitted) * 100,

  // Time spent in refinement per story
  refinementEfficiency: totalRefinementHours / storiesRefined,

  // Stories meeting DoR on first refinement
  firstTimeReadyRate: (storiesReadyFirstTime / totalStories) * 100,
};

// Target metrics
// - False Ready Rate: <10%
// - Pullback Rate: <5%
// - Refinement Efficiency: 0.5-1 hour per story
// - First Time Ready Rate: >60%
```

### Monitoring DoR Health

```markdown
**Indicators of Healthy DoR:**

- ✅ 90%+ of stories meet DoR before sprint planning
- ✅ <5% of stories pulled back from sprint due to lack of clarity
- ✅ Minimal mid-sprint requirements changes
- ✅ Team can estimate confidently
- ✅ Sprint goals consistently achieved

**Warning Signs:**

- ⚠️ Frequent mid-sprint clarifications needed
- ⚠️ Stories regularly carry over sprints
- ⚠️ Team hesitant to commit to stories
- ⚠️ Wide variance in estimates
- ⚠️ Product Owner unavailable during sprint
```

## DoR Variants by Work Type

### Feature Stories

```markdown
✅ User value clearly stated
✅ Acceptance criteria defined (3-5 criteria)
✅ UI/UX mockups provided (if applicable)
✅ Technical approach discussed
✅ Size: 1-8 story points
```

### Technical Stories

```markdown
✅ Technical justification provided
✅ Business impact explained
✅ Success criteria measurable
✅ Risk mitigation strategy defined
✅ Size: 2-13 story points
```

### Bug Fixes

```markdown
✅ Steps to reproduce documented
✅ Expected vs. actual behavior clear
✅ Root cause identified (if possible)
✅ Impact/severity assessed
✅ Size: 1-5 story points
```

### Spikes

```markdown
✅ Research question clearly stated
✅ Time-boxed (usually 1-3 days)
✅ Expected outcomes defined
✅ Success criteria for spike results
✅ Not estimated in story points
```

## Related Resources

- [Definition of Done](definition-of-done.md)
- [INVEST Criteria](invest-criteria.md)
- [Estimation Techniques](estimation-techniques.md)
- [User Story Mapping](../01-requirements/user-story-mapping.md)
- [Acceptance Criteria](../01-requirements/acceptance-criteria.md)

## References

- Scrum Guide - Product Backlog Management
- SAFe: Definition of Ready
- ISTQB: Requirements Engineering Best Practices

---

_Part of: [Agile Planning](README.md)_
