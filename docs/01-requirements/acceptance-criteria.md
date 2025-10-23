# Acceptance Criteria

## Purpose

Comprehensive guide to writing effective acceptance criteria that define when a user story is complete, ensure shared understanding, and enable testable requirements.

## Overview

Acceptance criteria are:

- Conditions of satisfaction
- Definition of "done" for a story
- Testable requirements
- Communication tool
- Quality gate

## What Are Acceptance Criteria?

### Definition

Acceptance criteria are a set of predefined requirements that must be met for a user story to be considered complete and accepted by the product owner.

### Purpose

```
Acceptance Criteria Provide:

Clarity
├── Shared understanding
├── Clear boundaries
└── Unambiguous expectations

Testability
├── Verification path
├── Test case basis
└── Quality assurance

Communication
├── Team alignment
├── Stakeholder agreement
└── Developer guidance
```

### Characteristics of Good Acceptance Criteria

```
INVEST in Acceptance Criteria:

Independent   - Self-contained, no dependencies
Negotiable    - Room for discussion on implementation
Valuable      - Delivers user/business value
Estimable     - Team can size the work
Small         - Fits in a sprint
Testable      - Can be verified objectively
```

## Acceptance Criteria Formats

### 1. Given-When-Then (Gherkin)

**Format:**

```gherkin
Given [initial context]
When [event occurs]
Then [expected outcome]
And [additional outcome]
```

**Example 1: Login**

```gherkin
Scenario: Successful login with valid credentials

Given I am a registered user
And I am on the login page
When I enter correct username "user@example.com"
And I enter correct password "SecurePass123"
And I click the "Login" button
Then I should be redirected to the dashboard
And I should see a welcome message "Welcome back, User!"
And my session should be active
```

**Example 2: Shopping Cart**

```gherkin
Scenario: Add product to empty cart

Given I am viewing product "Wireless Mouse"
And my shopping cart is empty
When I click "Add to Cart"
Then the cart icon should show "1" item
And I should see a confirmation message
And the product should appear in my cart
```

**Example 3: Form Validation**

```gherkin
Scenario: Email format validation

Given I am on the registration form
When I enter email "invalid.email"
And I click "Next"
Then I should see error "Please enter a valid email address"
And the email field should be highlighted in red
And I should remain on the registration form
```

**Advantages:**

- ✅ Structured and consistent
- ✅ Easy to automate with BDD tools
- ✅ Clear cause and effect
- ✅ Supports multiple scenarios

**When to Use:**

- Complex workflows
- Multiple scenarios
- Automation planned
- BDD approach

### 2. Checklist Format

**Format:**

```markdown
User Story: [Story description]

Acceptance Criteria:

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
```

**Example 1: Search Feature**

```markdown
User Story: As a user, I want to search for products so that I can quickly find what I need

Acceptance Criteria:

- [ ] Search bar is visible on all pages
- [ ] Search accepts minimum 2 characters
- [ ] Search returns results within 2 seconds
- [ ] Results show product name, image, and price
- [ ] "No results found" message displays for no matches
- [ ] Search highlights matching terms
- [ ] Search works with partial words
- [ ] Special characters don't break search
```

**Example 2: Profile Update**

```markdown
User Story: As a user, I want to update my profile information

Acceptance Criteria:

- [ ] All fields are pre-populated with current data
- [ ] First name is required (max 50 characters)
- [ ] Last name is required (max 50 characters)
- [ ] Email format is validated
- [ ] Phone number accepts 10-15 digits
- [ ] Save button is disabled until changes made
- [ ] Success message displays on successful save
- [ ] Profile updates reflect immediately
- [ ] Cancel button discards changes
```

**Advantages:**

- ✅ Simple and quick
- ✅ Easy to understand
- ✅ Good for straightforward features
- ✅ Clear yes/no verification

**When to Use:**

- Simple features
- Single scenarios
- Quick verification
- Non-technical stakeholders

### 3. Scenario Outline (Data-Driven)

**Format:**

```gherkin
Scenario Outline: [Template description]

Given [initial context with <parameter>]
When [event with <parameter>]
Then [outcome with <parameter>]

Examples:
| parameter1 | parameter2 | expected_result |
| value1     | value2     | result1         |
| value3     | value4     | result2         |
```

**Example: Login Validation**

```gherkin
Scenario Outline: Login validation with different inputs

Given I am on the login page
When I enter username "<username>"
And I enter password "<password>"
And I click "Login"
Then I should see "<message>"
And I should be on "<page>"

Examples:
| username           | password      | message                 | page      |
| valid@example.com  | ValidPass123  | Welcome back!           | dashboard |
| invalid@example    | ValidPass123  | Invalid email format    | login     |
| valid@example.com  | short         | Password too short      | login     |
| unknown@test.com   | ValidPass123  | Invalid credentials     | login     |
|                    | ValidPass123  | Username required       | login     |
| valid@example.com  |               | Password required       | login     |
```

**Example: Discount Calculation**

```gherkin
Scenario Outline: Apply discount codes

Given I have items worth $<cart_total> in my cart
When I apply discount code "<code>"
Then my discount should be $<discount>
And my final total should be $<final_total>

Examples:
| cart_total | code       | discount | final_total |
| 100        | SAVE10     | 10       | 90          |
| 100        | SAVE20     | 20       | 80          |
| 50         | SAVE10     | 5        | 45          |
| 100        | INVALID    | 0        | 100         |
| 20         | SAVE10     | 0        | 20          |
```

**Advantages:**

- ✅ Covers multiple test cases
- ✅ Reduces duplication
- ✅ Clear data variations
- ✅ Excellent for testing edge cases

**When to Use:**

- Multiple data variations
- Same logic, different inputs
- Boundary testing
- Comprehensive test coverage

### 4. Rule-Based Format

**Format:**

```markdown
Rule: [Business rule description]

Examples:

- Scenario: [Positive case]
- Scenario: [Negative case]
- Scenario: [Edge case]
```

**Example: Password Policy**

```markdown
Rule: Password must meet security requirements

Scenario: Valid password
Given I enter password "SecureP@ss123"
Then password should be accepted

Scenario: Too short
Given I enter password "Pass1!"
Then I should see "Password must be at least 8 characters"

Scenario: No uppercase
Given I enter password "securepass123!"
Then I should see "Password must contain uppercase letter"

Scenario: No number
Given I enter password "SecurePass!"
Then I should see "Password must contain a number"

Scenario: No special character
Given I enter password "SecurePass123"
Then I should see "Password must contain special character"
```

**Example: Shipping Cost Rules**

```markdown
Rule: Shipping cost based on order value and location

Scenario: Free shipping for orders over $50
Given order total is $75
And shipping address is in USA
Then shipping cost should be $0

Scenario: Standard shipping for orders under $50
Given order total is $30
And shipping address is in USA
Then shipping cost should be $5.99

Scenario: International shipping
Given order total is $100
And shipping address is in Canada
Then shipping cost should be $15.99

Scenario: No shipping for digital products
Given order contains only digital items
Then shipping cost should be $0
```

**Advantages:**

- ✅ Focuses on business rules
- ✅ Clear rule boundaries
- ✅ Comprehensive scenarios
- ✅ Easy to extend

**When to Use:**

- Complex business logic
- Multiple conditions
- Regulatory compliance
- Rules engine implementation

## Writing Effective Acceptance Criteria

### Best Practices

#### 1. Be Specific and Unambiguous

```
❌ Bad:
- System should be fast
- User interface should be intuitive
- Error handling should be good

✅ Good:
- Page load time should be under 2 seconds
- Navigation menu should be accessible within 2 clicks from any page
- Error messages should specify the issue and suggest corrective action
```

#### 2. Focus on Outcomes, Not Implementation

```
❌ Bad (Implementation):
- Use React hooks for state management
- Store data in PostgreSQL database
- Implement caching with Redis

✅ Good (Outcome):
- User preferences persist across sessions
- Search results appear within 2 seconds
- System handles 1000 concurrent users
```

#### 3. Include Both Positive and Negative Cases

```
User Story: Password reset

✅ Good - Covers Both:
Positive Cases:
- [ ] Valid email receives reset link within 1 minute
- [ ] Reset link expires after 1 hour
- [ ] New password can be set successfully

Negative Cases:
- [ ] Invalid email shows "Email not found"
- [ ] Expired link shows "Link expired, request new one"
- [ ] Weak password shows specific requirements
```

#### 4. Make Criteria Testable

```
❌ Not Testable:
- Search should work well
- Users should be happy with the feature
- Performance should be acceptable

✅ Testable:
- Search returns results in <2 seconds for 95% of queries
- User satisfaction score ≥ 4.0/5.0 in post-release survey
- P95 response time ≤ 500ms under normal load
```

#### 5. Define Clear Boundaries

```
User Story: Product search

✅ Good - Clear Boundaries:
In Scope:
- [ ] Search by product name
- [ ] Search by category
- [ ] Basic text matching

Out of Scope:
- [ ] Voice search (future)
- [ ] Image search (future)
- [ ] Advanced filters (next release)
```

### Common Mistakes to Avoid

#### 1. Too Vague

```
❌ Problem:
- System should handle errors gracefully
- UI should be user-friendly
- Performance should be good

✅ Solution:
- System displays user-friendly error messages with recovery options
- Users complete checkout in ≤3 clicks from cart
- 95th percentile page load time ≤ 2 seconds
```

#### 2. Too Technical

```
❌ Problem:
- JWT token should expire in 3600 seconds
- Use bcrypt with cost factor 12 for passwords
- Implement REST API with HTTP/2

✅ Solution:
- User session expires after 1 hour of inactivity
- User passwords are securely encrypted
- API responds to requests within 200ms
```

#### 3. Too Many Criteria

```
❌ Problem:
Single story with 25 acceptance criteria
Result: Story is too large, hard to test

✅ Solution:
Split into multiple stories:
Story 1: Basic search (5 criteria)
Story 2: Search filters (5 criteria)
Story 3: Search results display (4 criteria)
```

#### 4. Missing Edge Cases

```
❌ Incomplete:
- [ ] User can upload profile picture

✅ Complete:
- [ ] User can upload profile picture (JPG, PNG, max 5MB)
- [ ] Image is resized to 300x300px
- [ ] Error shown for unsupported formats
- [ ] Error shown for files >5MB
- [ ] Default avatar shown if no upload
```

## Acceptance Criteria Templates

### Template 1: CRUD Operations

```markdown
## Create [Entity]

Acceptance Criteria:

- [ ] All required fields have validation
- [ ] Optional fields are clearly marked
- [ ] Success message displays after creation
- [ ] New [entity] appears in list immediately
- [ ] Form clears after successful creation
- [ ] Validation errors prevent submission
- [ ] User is redirected to [appropriate page]

## Read [Entity]

Acceptance Criteria:

- [ ] All [entity] fields display correctly
- [ ] Related data loads properly
- [ ] Loading state shows while fetching
- [ ] Error message for not found [entity]
- [ ] Timestamps display in user's timezone
- [ ] User has permission to view [entity]

## Update [Entity]

Acceptance Criteria:

- [ ] Form pre-populates with current values
- [ ] Only changed fields are saved
- [ ] Success message displays after update
- [ ] Changes reflect immediately in UI
- [ ] Validation prevents invalid updates
- [ ] Concurrent edit detection works
- [ ] User has permission to update

## Delete [Entity]

Acceptance Criteria:

- [ ] Confirmation dialog displays before delete
- [ ] Success message displays after deletion
- [ ] [Entity] removed from lists immediately
- [ ] Related data handled appropriately
- [ ] Soft delete preserves data (if applicable)
- [ ] User has permission to delete
- [ ] Undo option available (if applicable)
```

### Template 2: Form Validation

```markdown
## [Form Name] Validation

Field-Level Validation:

- [ ] [Field 1]: [Validation rule]
- [ ] [Field 2]: [Validation rule]
- [ ] [Field 3]: [Validation rule]

Form-Level Validation:

- [ ] At least one [required combination] provided
- [ ] [Cross-field validation rule]
- [ ] [Business rule validation]

User Experience:

- [ ] Validation triggers on blur
- [ ] Error messages display near field
- [ ] Error messages are specific and helpful
- [ ] Submit button disabled until valid
- [ ] Required fields marked with asterisk
- [ ] Field requirements stated upfront

Error Handling:

- [ ] Invalid field highlighted
- [ ] Focus moves to first error
- [ ] Multiple errors shown together
- [ ] Errors clear when corrected
```

### Template 3: API Integration

```markdown
## [API Name] Integration

Request:

- [ ] Correct endpoint called
- [ ] Required headers included
- [ ] Request body properly formatted
- [ ] Authentication token included
- [ ] Timeout set to [X] seconds

Response Handling:

- [ ] Success (2xx): [Expected behavior]
- [ ] Client Error (4xx): [Error handling]
- [ ] Server Error (5xx): [Error handling]
- [ ] Timeout: [Fallback behavior]
- [ ] Network Error: [Fallback behavior]

Data Processing:

- [ ] Response data validated
- [ ] Data transformed correctly
- [ ] State updated appropriately
- [ ] UI reflects changes
- [ ] Loading states shown

Error Display:

- [ ] User-friendly error messages
- [ ] Retry option available
- [ ] Error logged for debugging
- [ ] Fallback content shown
```

### Template 4: Accessibility

```markdown
## Accessibility Requirements

Keyboard Navigation:

- [ ] All interactive elements keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators clearly visible
- [ ] Keyboard shortcuts don't conflict
- [ ] Skip navigation links provided

Screen Reader Support:

- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] ARIA labels for custom controls
- [ ] Status messages announced
- [ ] Page title describes content

Visual Design:

- [ ] Color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Color contrast ratio ≥ 3:1 (large text)
- [ ] Information not conveyed by color alone
- [ ] Text resizable to 200% without loss
- [ ] Touch targets ≥ 44x44 pixels

WCAG Compliance:

- [ ] Level A compliance achieved
- [ ] Level AA compliance achieved
- [ ] Automated tests pass
- [ ] Manual testing completed
```

## Examples by Feature Type

### E-commerce: Product Page

```markdown
User Story: As a shopper, I want to view product details so I can make informed purchase decisions

Acceptance Criteria:

Product Information:

- [ ] Product name displays prominently
- [ ] Price shows with currency symbol
- [ ] Availability status is clear (In Stock/Out of Stock)
- [ ] Product description is complete and formatted
- [ ] Specifications display in organized table
- [ ] SKU and model number shown

Product Images:

- [ ] Main product image displays (800x800px minimum)
- [ ] 4-6 alternate images available
- [ ] Click image to open full-screen view
- [ ] Zoom available on hover (desktop)
- [ ] Pinch to zoom works (mobile)
- [ ] Image thumbnails show below main image

Product Options:

- [ ] All variants shown (size, color, etc.)
- [ ] Selected variant highlights
- [ ] Out of stock variants disabled
- [ ] Price updates when variant selected
- [ ] Availability updates when variant selected

Actions:

- [ ] Add to Cart button prominent and functional
- [ ] Quantity selector (min 1, max available stock)
- [ ] Add to Wishlist option available
- [ ] Share buttons for social media
- [ ] "Notify when available" for out of stock

Additional Information:

- [ ] Customer reviews display (rating + count)
- [ ] Shipping information shown
- [ ] Return policy linked
- [ ] Related products suggested
- [ ] Recently viewed items shown
```

### SaaS: User Dashboard

```markdown
User Story: As a user, I want a personalized dashboard to see my account overview

Acceptance Criteria:

Header Section:

- [ ] User name and avatar display
- [ ] Last login time shown
- [ ] Quick actions accessible (Settings, Help, Logout)
- [ ] Notifications icon with unread count

Key Metrics (Widget):

- [ ] Current usage vs plan limit
- [ ] Usage percentage visualized
- [ ] Upgrade prompt if >80% usage
- [ ] Metrics update in real-time

Recent Activity (Widget):

- [ ] Last 10 activities listed
- [ ] Activity type, timestamp, and details shown
- [ ] Click activity to see details
- [ ] "View all" link to full activity log
- [ ] Empty state if no activity

Quick Access (Widget):

- [ ] Most frequently used features shown
- [ ] Custom shortcuts can be added
- [ ] Reorder shortcuts via drag-drop
- [ ] Icons and labels clear

Performance (Widget):

- [ ] Key performance indicators shown
- [ ] Trend arrows (up/down/stable)
- [ ] Click for detailed analytics
- [ ] Data refreshes every 5 minutes

Customization:

- [ ] Widgets can be shown/hidden
- [ ] Widget order can be changed
- [ ] Layout persists across sessions
- [ ] Reset to default layout option
```

### Mobile App: Onboarding

```markdown
User Story: As a new user, I want guided onboarding to learn key features

Acceptance Criteria:

Onboarding Flow:

- [ ] Welcome screen shows app value proposition
- [ ] 3-5 screens highlighting key features
- [ ] Simple, clear visuals for each feature
- [ ] Skip option available on all screens
- [ ] Progress indicator shows (e.g., 1/4, 2/4)

Screen Content:

- [ ] One main message per screen
- [ ] Supporting image/animation
- [ ] 2-3 sentences maximum per screen
- [ ] Clear benefit statement
- [ ] Next/Previous navigation

User Interaction:

- [ ] Swipe left/right to navigate (mobile)
- [ ] Click arrows to navigate (desktop)
- [ ] "Get Started" on final screen
- [ ] Can restart onboarding from settings
- [ ] Onboarding shown only once

Completion:

- [ ] Marked as complete in user profile
- [ ] User taken to main app screen
- [ ] Optional account setup prompt
- [ ] Welcome email sent
- [ ] Analytics event tracked
```

### Analytics: Report Generation

```markdown
User Story: As an analyst, I want to generate custom reports

Acceptance Criteria:

Report Configuration:

- [ ] Date range selector (predefined + custom)
- [ ] Metric selection (multi-select dropdown)
- [ ] Dimension selection (group by options)
- [ ] Filter options for segmentation
- [ ] Comparison toggle (vs previous period)

Report Preview:

- [ ] Preview generates in <5 seconds
- [ ] Data displays in table format
- [ ] Sortable columns
- [ ] Visual chart shows key metrics
- [ ] Summary statistics at top

Data Validation:

- [ ] Date range validated (max 365 days)
- [ ] At least one metric required
- [ ] Invalid combinations prevented
- [ ] Warning for large data sets
- [ ] Estimated processing time shown

Export Options:

- [ ] Export to CSV format
- [ ] Export to PDF format
- [ ] Export to Excel format
- [ ] Email report option
- [ ] Schedule recurring report

Performance:

- [ ] Small reports (<1000 rows) load in <3 seconds
- [ ] Large reports show progress indicator
- [ ] Timeout at 60 seconds with error message
- [ ] Export handles up to 100,000 rows
```

## Acceptance Criteria Review

### Review Checklist

```markdown
Before Finalizing Acceptance Criteria:

Completeness:

- [ ] All functional requirements covered
- [ ] Non-functional requirements included
- [ ] Happy path defined
- [ ] Error cases specified
- [ ] Edge cases identified
- [ ] Boundary conditions tested

Clarity:

- [ ] No ambiguous terms
- [ ] Consistent terminology
- [ ] No assumptions
- [ ] Clear expected behavior
- [ ] Measurable outcomes

Testability:

- [ ] Each criterion verifiable
- [ ] Clear pass/fail conditions
- [ ] Test data identifiable
- [ ] Test scenarios obvious
- [ ] Automation possible

Stakeholder Agreement:

- [ ] Product Owner approved
- [ ] Development team understood
- [ ] QA team can test
- [ ] UX/UI aligned
- [ ] Technical feasibility confirmed
```

### Refinement Questions

```
During Refinement, Ask:

Understanding:
- What exactly does this mean?
- Can you give me an example?
- What happens if...?
- Is this always true?

Scope:
- What's included/excluded?
- What are the limits?
- What about edge case X?
- Any exceptions to this rule?

Testability:
- How will we verify this?
- What does success look like?
- What test data is needed?
- Can we automate this check?

Dependencies:
- What must be done first?
- What data do we need?
- Which systems are involved?
- Any external dependencies?
```

## Measuring Effectiveness

### Quality Metrics

```
Acceptance Criteria Quality:

Clarity Score:
= Questions asked during development / Total criteria
Target: <0.2 (less than 1 question per 5 criteria)

Completeness Score:
= Criteria added after sprint start / Total criteria
Target: <0.1 (less than 10% additions)

Defect Prevention:
= Defects found after release / Total defects
Target: <0.2 (catch 80% before release)

Rework Rate:
= Stories not accepted first time / Total stories
Target: <0.15 (acceptance rate >85%)
```

### Feedback Loop

```
Retrospective Questions:

What worked well:
- Which criteria prevented defects?
- Which format was most useful?
- What made testing easier?

What needs improvement:
- Which criteria were ambiguous?
- What was missing?
- What caused rework?

Actions:
- Update templates
- Refine process
- Improve collaboration
- Additional training needed
```

## Tools and Automation

### BDD Frameworks

```javascript
// Cucumber (JavaScript)
Given('I am on the login page', function () {
  return this.visit('/login');
});

When('I enter username {string}', function (username) {
  return this.fillIn('#username', username);
});

When('I enter password {string}', function (password) {
  return this.fillIn('#password', password);
});

When('I click {string}', function (buttonText) {
  return this.click(`button:contains('${buttonText}')`);
});

Then('I should see {string}', function (message) {
  return this.see(message);
});
```

```python
# Behave (Python)
@given('I am on the login page')
def step_impl(context):
    context.browser.get('http://example.com/login')

@when('I enter username "{username}"')
def step_impl(context, username):
    context.browser.find_element_by_id('username').send_keys(username)

@then('I should be redirected to the dashboard')
def step_impl(context):
    assert context.browser.current_url.endswith('/dashboard')
```

### Acceptance Test Tracking

```markdown
## Test Execution Tracking

Story: [Story ID]

Acceptance Criteria Status:
✅ Criterion 1: Passed
✅ Criterion 2: Passed
❌ Criterion 3: Failed - [Bug ID]
⏳ Criterion 4: In Progress
⏸️ Criterion 5: Blocked by [Dependency]

Test Results:

- Manual Tests: 12/15 passed
- Automated Tests: 45/45 passed
- Exploratory: 3 issues found

Acceptance Decision:

- [ ] Accepted
- [ ] Accepted with known issues
- [ ] Rejected - needs rework
```

## Checklist

### Acceptance Criteria Checklist

**Writing Phase:**

- [ ] Derived from user story
- [ ] Format selected (Given-When-Then, Checklist, etc.)
- [ ] Positive scenarios included
- [ ] Negative scenarios included
- [ ] Edge cases identified
- [ ] Non-functional requirements included
- [ ] All criteria testable
- [ ] No implementation details

**Review Phase:**

- [ ] Product Owner reviewed
- [ ] Development team understands
- [ ] QA can test
- [ ] Clear and unambiguous
- [ ] Measurable and specific
- [ ] Complete set of criteria

**Testing Phase:**

- [ ] Test cases written
- [ ] Test data prepared
- [ ] Tests executed
- [ ] All criteria verified
- [ ] Defects tracked
- [ ] Acceptance decision made

## References

### Books

- "Specification by Example" - Gojko Adzic
- "User Story Mapping" - Jeff Patton
- "The BDD Books: Discovery" - Gáspár Nagy & Seb Rose

### Articles

- [Writing Great Acceptance Criteria](https://www.atlassian.com/agile/project-management/user-stories) - Atlassian
- [Acceptance Criteria Guide](https://www.productplan.com/glossary/acceptance-criteria/) - ProductPlan

### Tools

- [Cucumber](https://cucumber.io/) - BDD framework
- [SpecFlow](https://specflow.org/) - .NET BDD
- [Behave](https://behave.readthedocs.io/) - Python BDD
- [JBehave](https://jbehave.org/) - Java BDD

## Related Topics

- [User Stories](user-stories.md)
- [Definition of Done](definition-of-done.md)
- [Behavior-Driven Development](../07-development-practices/bdd.md)
- [Test Design](../04-testing-strategy/test-design.md)
- [Requirements Validation](requirements-validation.md)

---

_Part of: [Requirements Engineering](README.md)_
