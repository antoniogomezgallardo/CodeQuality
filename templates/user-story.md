# User Story Template

## Story Format

**As a** [type of user]
**I want** [goal/desire]
**So that** [benefit/value]

## Example

**As a** registered customer
**I want** to view my order history
**So that** I can track my purchases and reorder items easily

## Acceptance Criteria

Use the Given-When-Then format:

### Scenario 1: [Scenario Name]

**Given** [initial context]
**When** [action taken]
**Then** [expected outcome]

### Example Acceptance Criteria

#### Scenario 1: Successful order history retrieval

**Given** I am a logged-in customer with previous orders
**When** I navigate to my order history page
**Then** I should see a list of my past orders sorted by date (newest first)
**And** each order should display order number, date, total amount, and status

#### Scenario 2: Empty order history

**Given** I am a logged-in customer with no previous orders
**When** I navigate to my order history page
**Then** I should see a message "You haven't placed any orders yet"
**And** I should see a "Start Shopping" button

#### Scenario 3: Order details view

**Given** I am viewing my order history
**When** I click on a specific order
**Then** I should see detailed information including items purchased, quantities, and delivery address

## Additional Information

### Priority

- [ ] Must Have (Critical)
- [ ] Should Have (Important)
- [ ] Could Have (Nice to have)
- [ ] Won't Have (Out of scope)

### Estimation

- **Story Points:** [Fibonacci: 1, 2, 3, 5, 8, 13]
- **Estimated Hours:** [Optional]

### Dependencies

- [ ] [List any dependent stories or external dependencies]

### Notes

[Any additional context, assumptions, or clarifications]

### Definition of Done Checklist

- [ ] Code implemented and reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Acceptance criteria verified
- [ ] Documentation updated
- [ ] No critical bugs
- [ ] Security review completed (if applicable)
- [ ] Performance requirements met
- [ ] Deployed to staging environment

## INVEST Criteria Check

- [ ] **Independent** - Can be developed independently
- [ ] **Negotiable** - Details can be discussed and refined
- [ ] **Valuable** - Provides clear business or user value
- [ ] **Estimable** - Team can estimate the effort required
- [ ] **Small** - Can be completed within a sprint
- [ ] **Testable** - Clear criteria for determining completion
