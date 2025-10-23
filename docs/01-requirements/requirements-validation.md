# Requirements Validation

## Overview

Requirements validation ensures that requirements are correct, complete, consistent, and aligned with stakeholder needs before development begins. It verifies that we're building the right product.

## Purpose

- **Prevent rework**: Catch requirement errors early when they're cheap to fix
- **Stakeholder alignment**: Ensure shared understanding among all parties
- **Quality assurance**: Verify requirements meet quality standards
- **Risk mitigation**: Identify gaps, conflicts, and ambiguities
- **Cost reduction**: Fix issues before coding (10-100x cheaper)

## Validation Techniques

### 1. Reviews and Walkthroughs

**Peer Review:**

```markdown
- Requirements reviewed by team members
- Focus on clarity, testability, completeness
- Identify ambiguities and conflicts
- Typically 30-60 minutes per session
```

**Stakeholder Walkthrough:**

```markdown
- Present requirements to business stakeholders
- Verify alignment with business needs
- Gather feedback and clarifications
- Confirm priorities and scope
```

### 2. Prototyping

**Benefit:** Visualize requirements before full implementation

**Types:**

- UI mockups and wireframes
- Interactive prototypes (Figma, InVision)
- Paper prototypes for user testing
- Clickable demos for stakeholder validation

**Example:** E-commerce checkout flow prototype validates user journey before development

### 3. Acceptance Criteria Validation

**Given-When-Then Format:**

```gherkin
Given I am a logged-in user
When I add an item to cart
Then the cart count increases by 1
And the item appears in my cart
```

**Validation Questions:**

- Can we test this criterion?
- Is it specific and measurable?
- Does it cover edge cases?
- Is it achievable in one sprint?

### 4. Traceability Matrix

**Purpose:** Ensure all requirements link to business needs and tests

| Requirement ID | User Story     | Business Need | Test Case      | Status    |
| -------------- | -------------- | ------------- | -------------- | --------- |
| REQ-001        | User login     | Security      | TC-001, TC-002 | Validated |
| REQ-002        | Password reset | User support  | TC-003         | In Review |

## Validation Checklist

### Completeness

```markdown
- [ ] All user roles identified
- [ ] All user scenarios covered
- [ ] All inputs and outputs defined
- [ ] All business rules documented
- [ ] All error conditions specified
- [ ] All non-functional requirements included
- [ ] All dependencies identified
- [ ] All assumptions documented
```

### Correctness

```markdown
- [ ] Requirements align with business goals
- [ ] Requirements are technically feasible
- [ ] Requirements reflect actual user needs
- [ ] No contradictions between requirements
- [ ] Terminology is consistent throughout
- [ ] References to external docs are accurate
```

### Consistency

```markdown
- [ ] No conflicting requirements
- [ ] Terminology used consistently
- [ ] Acceptance criteria align with stories
- [ ] Non-functional requirements don't contradict
- [ ] Requirements don't violate constraints
```

### Clarity

```markdown
- [ ] Requirements are unambiguous
- [ ] No vague terms (e.g., "fast", "user-friendly")
- [ ] Specific metrics defined
- [ ] Examples provided where helpful
- [ ] One interpretation possible
```

### Testability

```markdown
- [ ] Each requirement can be verified
- [ ] Success criteria are measurable
- [ ] Test scenarios can be written
- [ ] Expected outcomes are defined
- [ ] Test data requirements identified
```

### Priority

```markdown
- [ ] Each requirement has priority (Must/Should/Could)
- [ ] Critical requirements identified
- [ ] Dependencies considered in priority
- [ ] Business value clearly stated
```

## Related Resources

- [Acceptance Criteria](acceptance-criteria.md)
- [User Story Mapping](user-story-mapping.md)
- [Requirements Prioritization](requirements-prioritization.md)
- [Definition of Ready](../02-agile-planning/definition-of-ready.md)

## References

- ISTQB - Requirements Engineering
- IEEE 829 - Test Documentation
- ISO/IEC 25010 - Quality Requirements

---

_Part of: [Requirements Engineering](README.md)_
