# Test Case Template

## IEEE 829 Standard Test Case Format

### Test Case Header

| Field | Description |
|-------|-------------|
| **Test Case ID** | TC-[Project]-[Module]-[Number] (e.g., TC-ECOM-AUTH-001) |
| **Test Case Title** | Clear, descriptive title of what is being tested |
| **Created By** | Test case author name |
| **Creation Date** | YYYY-MM-DD |
| **Last Modified** | YYYY-MM-DD |
| **Version** | Version number (e.g., 1.0, 1.1) |

### Test Information

| Field | Description |
|-------|-------------|
| **Priority** | Critical / High / Medium / Low |
| **Test Type** | Functional / Integration / System / Regression / Smoke |
| **Test Level** | Unit / Integration / System / Acceptance |
| **Automation Status** | Automated / Manual / To be Automated |
| **Requirements ID** | REQ-001, REQ-002 (traceability to requirements) |
| **Related User Story** | US-123: User login functionality |
| **Test Environment** | Development / Staging / Production |

---

## Manual Test Case Format

### Test Case ID: TC-[Project]-[Module]-[Number]

**Title:** [Descriptive test case title]

**Description:**
[Brief description of what this test case validates]

**Priority:** [Critical / High / Medium / Low]

**Test Type:** [Functional / Integration / System / Regression]

**Requirements Traceability:**
- REQ-001: [Requirement description]
- REQ-002: [Requirement description]

### Preconditions
- [ ] User account exists with username "testuser@example.com"
- [ ] Application is accessible at https://staging.example.com
- [ ] Test data is loaded in the database
- [ ] Browser cache is cleared

### Test Data
| Field | Value |
|-------|-------|
| Username | testuser@example.com |
| Password | Test@123 |
| Expected Role | Standard User |

### Test Steps

| Step # | Action | Expected Result | Actual Result | Status |
|--------|--------|-----------------|---------------|--------|
| 1 | Navigate to login page | Login page displays with username and password fields | | |
| 2 | Enter valid username "testuser@example.com" | Username is entered in the field | | |
| 3 | Enter valid password "Test@123" | Password is masked with dots | | |
| 4 | Click "Login" button | User is redirected to dashboard page | | |
| 5 | Verify welcome message | "Welcome, Test User" displays at top right | | |
| 6 | Verify user role | User role "Standard User" is displayed | | |

### Expected Results Summary
- User successfully logs in with valid credentials
- Dashboard page loads within 2 seconds
- User session is created and stored
- Last login timestamp is updated

### Actual Results
[To be filled during test execution]

### Status
- [ ] Pass
- [ ] Fail
- [ ] Blocked
- [ ] Not Executed

### Defects Found
| Defect ID | Description | Severity |
|-----------|-------------|----------|
| BUG-456 | Login takes 5 seconds instead of 2 | Medium |

### Test Evidence
- [ ] Screenshots attached
- [ ] Log files saved
- [ ] Video recording captured
- [ ] Network traffic captured

### Notes
[Any additional observations, comments, or special conditions]

### Postconditions
- [ ] User session is active
- [ ] Logout functionality verified
- [ ] Test data cleaned up

---

## Automated Test Case Format

### Test Case ID: TC-AUTO-[Module]-[Number]

**Title:** [Descriptive test case title]

**Test Framework:** Jest / Cypress / Selenium / Playwright / Postman

**Test File Location:** `tests/e2e/login.spec.js`

**Requirements Traceability:**
- REQ-001: User authentication functionality
- REQ-002: Session management

### Test Code Structure

```javascript
describe('User Login Functionality', () => {

  // Test Setup
  beforeEach(() => {
    // Preconditions
    cy.visit('https://staging.example.com/login');
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // Test Case: TC-AUTO-AUTH-001
  it('should allow user to login with valid credentials', () => {
    // Test Data
    const testUser = {
      email: 'testuser@example.com',
      password: 'Test@123'
    };

    // Test Steps
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();

    // Assertions (Expected Results)
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="welcome-message"]')
      .should('contain', 'Welcome, Test User');
    cy.get('[data-testid="user-role"]')
      .should('contain', 'Standard User');

    // Performance Assertion
    cy.window().then((win) => {
      const performanceEntries = win.performance.getEntriesByType('navigation');
      const loadTime = performanceEntries[0].loadEventEnd - performanceEntries[0].fetchStart;
      expect(loadTime).to.be.lessThan(2000); // 2 seconds max
    });
  });

  // Test Cleanup
  afterEach(() => {
    // Postconditions
    cy.logout();
  });
});
```

### Test Configuration

```yaml
test:
  browser: chrome
  viewport: 1280x720
  timeout: 10000
  retries: 2
  screenshots: true
  video: true
  baseUrl: https://staging.example.com
```

### Assertions Checklist
- [ ] UI elements are visible and enabled
- [ ] Navigation occurs correctly
- [ ] Data is displayed accurately
- [ ] Performance meets requirements
- [ ] Error handling works as expected
- [ ] Session management is correct

---

## Test Case Examples

### Example 1: Positive Test Case

**Test Case ID:** TC-ECOM-CART-001

**Title:** Add product to shopping cart successfully

**Priority:** High

**Type:** Functional

**Requirements:** REQ-CART-001

**Preconditions:**
- User is logged in
- Product "Laptop Dell XPS 15" is in stock
- Shopping cart is empty

**Test Steps:**
1. Navigate to product page
2. Select quantity: 2
3. Click "Add to Cart" button
4. Navigate to cart page

**Expected Results:**
- Product appears in cart
- Quantity shows 2
- Total price calculates correctly
- Cart icon shows item count (2)

---

### Example 2: Negative Test Case

**Test Case ID:** TC-ECOM-CART-002

**Title:** Verify error when adding out-of-stock product

**Priority:** High

**Type:** Functional - Negative

**Requirements:** REQ-CART-002

**Preconditions:**
- User is logged in
- Product "Headphones Sony XM5" is out of stock

**Test Steps:**
1. Navigate to out-of-stock product page
2. Attempt to click "Add to Cart" button

**Expected Results:**
- "Add to Cart" button is disabled
- Message displays: "Out of Stock"
- User cannot add item to cart
- Alternative products are suggested

---

### Example 3: Boundary Value Test Case

**Test Case ID:** TC-ECOM-CART-003

**Title:** Verify cart quantity boundary values

**Priority:** Medium

**Type:** Functional - Boundary

**Requirements:** REQ-CART-003

**Test Data:**
- Minimum quantity: 1
- Maximum quantity: 10
- Below minimum: 0
- Above maximum: 11

**Test Cases:**
| Input | Expected Result |
|-------|-----------------|
| 0 | Error: "Quantity must be at least 1" |
| 1 | Success: Item added with quantity 1 |
| 5 | Success: Item added with quantity 5 |
| 10 | Success: Item added with quantity 10 |
| 11 | Error: "Maximum quantity is 10" |

---

### Example 4: Integration Test Case

**Test Case ID:** TC-INT-PAYMENT-001

**Title:** Verify payment gateway integration for successful transaction

**Priority:** Critical

**Type:** Integration

**Requirements:** REQ-PAY-001, REQ-INT-003

**Preconditions:**
- Test payment gateway environment configured
- Test credit card data available
- Order total is $50.00

**Test Steps:**
1. Proceed to checkout with items in cart
2. Enter shipping information
3. Select payment method: Credit Card
4. Enter test card: 4111 1111 1111 1111
5. Enter expiry: 12/25, CVV: 123
6. Click "Place Order"

**Expected Results:**
- Payment gateway API is called
- Transaction is processed successfully
- Order status updates to "Paid"
- Confirmation email is sent
- Payment reference ID is saved
- Inventory is decremented

**Integration Points:**
- Payment Gateway API
- Email Service
- Inventory Management System

---

## Edge Cases Test Template

**Test Case ID:** TC-EDGE-[Module]-[Number]

**Title:** [Edge case scenario]

**Edge Cases to Consider:**
- [ ] Empty input
- [ ] Null values
- [ ] Special characters
- [ ] Maximum length strings
- [ ] Minimum/Maximum numeric values
- [ ] Concurrent operations
- [ ] Network timeout
- [ ] Database unavailability
- [ ] Invalid data types
- [ ] Unicode characters

---

## Regression Test Case

**Test Case ID:** TC-REG-[Module]-[Number]

**Title:** [Regression test scenario]

**Original Defect:** BUG-789

**Fix Version:** v2.1.0

**Regression Check:**
- [ ] Original issue is resolved
- [ ] No new issues introduced
- [ ] Related functionality still works
- [ ] Performance not degraded

---

## Accessibility Test Case (WCAG 2.1)

**Test Case ID:** TC-A11Y-[Module]-[Number]

**Title:** [Accessibility test scenario]

**WCAG Level:** A / AA / AAA

**Success Criterion:** 1.1.1 Non-text Content

**Test Steps:**
1. Enable screen reader (NVDA / JAWS)
2. Navigate through the page using keyboard only
3. Verify all images have alt text
4. Check form labels are associated with inputs

**Expected Results:**
- All non-text content has text alternative
- Keyboard navigation works correctly
- Screen reader announces elements properly
- Color contrast meets WCAG requirements

---

## Performance Test Case

**Test Case ID:** TC-PERF-[Module]-[Number]

**Title:** [Performance test scenario]

**Performance Requirements:**
- Page load time: < 2 seconds
- API response time: < 500ms
- Time to interactive: < 3 seconds

**Load Conditions:**
- 100 concurrent users
- Network: 3G throttling
- Device: Mobile (mid-tier)

**Metrics to Capture:**
- [ ] Response time
- [ ] Throughput
- [ ] Error rate
- [ ] Resource utilization

---

## Security Test Case

**Test Case ID:** TC-SEC-[Module]-[Number]

**Title:** [Security test scenario]

**Security Category:** Authentication / Authorization / Input Validation / Encryption

**OWASP Top 10:** A01:2021 - Broken Access Control

**Test Steps:**
1. Attempt to access admin page as regular user
2. Verify authorization check
3. Check for proper error handling

**Expected Results:**
- Access is denied
- 403 Forbidden status returned
- No sensitive data in error message
- Security event is logged

---

## Test Case Review Checklist

### Before Execution
- [ ] Test case is clear and unambiguous
- [ ] Prerequisites are documented
- [ ] Test data is prepared
- [ ] Expected results are specific and measurable
- [ ] Traceability to requirements exists

### After Execution
- [ ] Actual results are documented
- [ ] Status is updated (Pass/Fail)
- [ ] Defects are logged and linked
- [ ] Evidence is attached
- [ ] Retesting criteria is defined

---

## Test Case Maintenance

### When to Update Test Cases
- Requirements change
- Defects are found and fixed
- Application UI/functionality changes
- Test environment changes
- Test data becomes invalid

### Version Control
- Use version numbers (1.0, 1.1, 2.0)
- Document change history
- Archive obsolete test cases
- Review test cases quarterly

---

## Traceability Matrix Example

| Test Case ID | Requirement ID | User Story | Priority | Status |
|--------------|----------------|------------|----------|--------|
| TC-001 | REQ-001 | US-101 | High | Pass |
| TC-002 | REQ-001 | US-101 | High | Pass |
| TC-003 | REQ-002 | US-102 | Medium | Fail |
| TC-004 | REQ-003 | US-103 | Low | Not Run |

---

## Best Practices

### Writing Effective Test Cases
1. **Be Specific:** Use exact values and clear descriptions
2. **Be Independent:** Test cases should not depend on each other
3. **Be Reusable:** Write for multiple test cycles
4. **Be Maintainable:** Easy to update when requirements change
5. **Be Traceable:** Link to requirements and user stories

### Common Mistakes to Avoid
- ❌ Vague expected results ("should work correctly")
- ❌ Missing preconditions
- ❌ Too many scenarios in one test case
- ❌ No test data specified
- ❌ Lack of traceability to requirements

### Test Case Quality Metrics
- **Coverage:** % of requirements covered by test cases
- **Traceability:** % of test cases linked to requirements
- **Execution Rate:** % of test cases executed
- **Pass Rate:** % of test cases passing
- **Defect Detection:** Number of defects found per test case

---

*This template follows IEEE 829 standards for software test documentation and ISTQB best practices.*
