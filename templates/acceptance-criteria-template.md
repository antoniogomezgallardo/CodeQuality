# Acceptance Criteria Template

## Overview

Acceptance criteria define the conditions that a software product must satisfy to be accepted by a user, customer, or other stakeholder. They are written in a clear, testable format and serve as the foundation for test cases.

---

## Given-When-Then Format (Gherkin/BDD Style)

### Structure

**Given** [Initial context or precondition]
**When** [Event or action occurs]
**Then** [Expected outcome or result]
**And** [Additional expected outcomes]

### Benefits
- Clear and unambiguous
- Easy to convert to automated tests
- Shared language between business and technical teams
- Focuses on behavior rather than implementation

---

## Functional Acceptance Criteria

### Example 1: User Login

#### Scenario 1: Successful Login
**Given** I am a registered user with valid credentials
**When** I enter my email "user@example.com" and password "SecurePass123!"
**And** I click the "Login" button
**Then** I should be redirected to the dashboard page
**And** I should see a welcome message "Welcome back, John"
**And** my session should be active for 24 hours

#### Scenario 2: Failed Login - Invalid Password
**Given** I am a registered user
**When** I enter my email "user@example.com" and incorrect password "wrongpass"
**And** I click the "Login" button
**Then** I should remain on the login page
**And** I should see an error message "Invalid email or password"
**And** the password field should be cleared
**And** my account should not be locked (first attempt)

#### Scenario 3: Account Lockout After Multiple Failed Attempts
**Given** I am a registered user
**And** I have failed to login 4 times in the last 5 minutes
**When** I enter my email "user@example.com" and incorrect password
**And** I click the "Login" button
**Then** I should see an error message "Account locked due to multiple failed login attempts. Please try again in 15 minutes."
**And** my account should be locked for 15 minutes
**And** I should receive an email notification about the account lockout

#### Scenario 4: Password Reset Flow
**Given** I have forgotten my password
**When** I click "Forgot Password?" link
**And** I enter my registered email "user@example.com"
**And** I click "Send Reset Link"
**Then** I should see a confirmation message "Password reset instructions sent to your email"
**And** I should receive an email with a reset link within 2 minutes
**And** the reset link should be valid for 1 hour

---

### Example 2: Shopping Cart

#### Scenario 1: Add Product to Cart
**Given** I am viewing a product page for "Wireless Headphones"
**And** the product is in stock (quantity > 0)
**When** I select quantity "2"
**And** I click "Add to Cart" button
**Then** the product should be added to my cart with quantity 2
**And** the cart icon should show item count "2"
**And** I should see a success notification "2 items added to your cart"
**And** the notification should auto-dismiss after 3 seconds

#### Scenario 2: Update Cart Quantity
**Given** I have "Wireless Headphones" in my cart with quantity 2
**When** I navigate to the cart page
**And** I change the quantity to 5
**Then** the cart should update to show quantity 5
**And** the subtotal should recalculate automatically
**And** the total price should update to reflect 5 items

#### Scenario 3: Remove Item from Cart
**Given** I have multiple items in my cart
**When** I click the "Remove" button next to "Wireless Headphones"
**Then** the item should be removed from my cart
**And** the cart should show remaining items only
**And** the cart total should recalculate
**And** I should see a notification "Item removed from cart"
**And** I should see an "Undo" option for 10 seconds

#### Scenario 4: Cart Persistence Across Sessions
**Given** I have items in my cart as a logged-in user
**When** I log out and log back in
**Then** my cart should contain the same items
**And** the quantities should be unchanged
**And** the prices should be updated to current prices

#### Scenario 5: Out of Stock Handling
**Given** I have "Limited Edition Sneakers" in my cart
**And** the product goes out of stock before checkout
**When** I proceed to checkout
**Then** I should see an error message "Limited Edition Sneakers is no longer available"
**And** the item should be highlighted in red
**And** I should be able to remove it or continue with other items

---

### Example 3: Search Functionality

#### Scenario 1: Successful Search with Results
**Given** I am on the homepage
**When** I enter "laptop" in the search box
**And** I press Enter or click the search button
**Then** I should see a list of products containing "laptop"
**And** results should be sorted by relevance
**And** each result should show product image, name, price, and rating
**And** I should see the total number of results (e.g., "Showing 48 results for 'laptop'")

#### Scenario 2: Search with No Results
**Given** I am on the homepage
**When** I enter "xyznonexistentproduct" in the search box
**And** I press Enter
**Then** I should see a message "No results found for 'xyznonexistentproduct'"
**And** I should see search suggestions or popular categories
**And** I should have the option to clear the search

#### Scenario 3: Search with Filters
**Given** I have searched for "laptop"
**And** I see 48 results
**When** I apply filters: Brand "Dell", Price "$500-$1000", Rating "4+ stars"
**Then** I should see only laptops matching all filter criteria
**And** the result count should update (e.g., "Showing 12 results")
**And** applied filters should be displayed with option to remove each

#### Scenario 4: Search Auto-Complete
**Given** I am on the homepage
**When** I start typing "lap" in the search box
**Then** I should see auto-complete suggestions within 300ms
**And** suggestions should include "laptop", "laptop bag", "laptop stand"
**And** I should be able to select a suggestion with keyboard or mouse
**And** selecting a suggestion should perform the search immediately

---

## Non-Functional Acceptance Criteria

### Performance Criteria

#### Example: Page Load Performance
**Given** I am accessing the application on a desktop with broadband internet
**When** I navigate to any page
**Then** the page should load completely within 2 seconds
**And** the First Contentful Paint (FCP) should occur within 1 second
**And** the Time to Interactive (TTI) should be under 3 seconds
**And** the Cumulative Layout Shift (CLS) should be less than 0.1

#### Example: API Response Time
**Given** the system is under normal load (< 1000 concurrent users)
**When** I make any API request
**Then** the response time should be less than 500ms for 95% of requests (p95)
**And** the response time should be less than 1000ms for 99% of requests (p99)
**And** no request should take more than 5 seconds (timeout)

#### Example: Database Query Performance
**Given** the database contains production-level data (> 1 million records)
**When** any database query is executed
**Then** queries should complete within 100ms for 95% of requests
**And** no query should take more than 2 seconds
**And** queries should be optimized with appropriate indexes

---

### Security Criteria

#### Example: Authentication Security
**Given** I am implementing user authentication
**When** a user logs in
**Then** passwords must be hashed using bcrypt with salt rounds >= 10
**And** session tokens must be cryptographically secure (128 bits minimum)
**And** all authentication endpoints must use HTTPS only
**And** sensitive data must never be logged or exposed in error messages
**And** account lockout must trigger after 5 failed attempts
**And** Multi-factor authentication must be supported for high-value accounts

#### Example: Data Protection
**Given** the application handles personal data
**When** data is stored or transmitted
**Then** all data in transit must use TLS 1.2 or higher
**And** all data at rest must be encrypted using AES-256
**And** personally identifiable information (PII) must be stored separately
**And** credit card data must never be stored (use tokenization)
**And** data access must be logged for audit purposes

#### Example: Input Validation
**Given** the application accepts user input
**When** any form is submitted or API receives data
**Then** all input must be validated on the server side
**And** SQL injection must be prevented using parameterized queries
**And** XSS attacks must be prevented using output encoding
**And** file uploads must be validated for type and size
**And** maximum request size must be enforced (< 10 MB)

---

### Accessibility Criteria (WCAG 2.1 Level AA)

#### Example: Keyboard Navigation
**Given** I am using the application without a mouse
**When** I navigate using only keyboard (Tab, Enter, Arrow keys)
**Then** all interactive elements must be keyboard accessible
**And** focus indicator must be clearly visible on all elements
**And** tab order must follow logical reading order
**And** keyboard shortcuts must not conflict with screen reader shortcuts
**And** I should be able to complete all tasks using keyboard only

#### Example: Screen Reader Support
**Given** I am using a screen reader (NVDA, JAWS, VoiceOver)
**When** I navigate through the page
**Then** all images must have descriptive alt text
**And** all form fields must have associated labels
**And** all buttons must have descriptive text or aria-labels
**And** page structure must use semantic HTML (header, nav, main, footer)
**And** dynamic content changes must be announced

#### Example: Color and Contrast
**Given** I am viewing the application
**When** I see any text or UI element
**Then** text must have contrast ratio of at least 4.5:1 (normal text)
**And** large text must have contrast ratio of at least 3:1
**And** information must not be conveyed by color alone
**And** UI components must have contrast ratio of at least 3:1

#### Example: Responsive Design
**Given** I am using different devices and orientations
**When** I view the application
**Then** content must be readable without horizontal scrolling
**And** touch targets must be at least 44x44 pixels
**And** text must be resizable up to 200% without loss of content
**And** layout must adapt to viewport width (320px to 1920px+)

---

### Usability Criteria

#### Example: Form Usability
**Given** I am filling out a registration form
**When** I interact with form fields
**Then** form fields must have clear, descriptive labels
**And** required fields must be clearly marked with an asterisk (*)
**And** field format requirements must be shown (e.g., "MM/DD/YYYY")
**And** validation errors must be shown inline, next to the field
**And** error messages must be specific and helpful
**And** I should be able to submit the form by pressing Enter

#### Example: Error Handling
**Given** an error occurs in the application
**When** the error is displayed to the user
**Then** error messages must be clear and non-technical
**And** error messages must suggest how to resolve the issue
**And** sensitive technical details must not be exposed
**And** the user should have a clear path to recovery
**And** errors should be logged for debugging purposes

---

## Edge Cases and Error Scenarios

### Example: Payment Processing

#### Scenario 1: Network Timeout During Payment
**Given** I am completing a purchase
**When** I submit payment and the network times out
**Then** I should see a message "Payment processing... Please wait"
**And** the system should retry the payment request up to 3 times
**And** if all retries fail, I should see "Payment could not be processed. Your card was not charged."
**And** I should have the option to retry or use a different payment method

#### Scenario 2: Insufficient Funds
**Given** I am completing a purchase
**When** my payment is declined due to insufficient funds
**Then** I should see a message "Payment declined: Insufficient funds"
**And** I should be able to try a different payment method
**And** my cart should remain intact
**And** the order should not be created

#### Scenario 3: Duplicate Payment Prevention
**Given** I have just submitted a payment
**When** I click the "Pay Now" button multiple times rapidly
**Then** only one payment should be processed
**And** the button should be disabled after first click
**And** I should see a loading indicator
**And** subsequent clicks should be ignored

#### Scenario 4: Session Expiry During Checkout
**Given** I am in the middle of checkout
**When** my session expires (after 30 minutes of inactivity)
**Then** I should be redirected to the login page
**And** I should see a message "Your session has expired. Please log in to continue."
**And** after logging in, I should return to checkout with my cart intact

---

## Cross-Browser and Device Criteria

### Example: Browser Compatibility
**Given** I am using the application
**When** I access it from different browsers
**Then** the application must work correctly on:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
**And** feature detection must be used instead of browser detection
**And** graceful degradation must be provided for unsupported features

### Example: Mobile Responsiveness
**Given** I am using the application on mobile devices
**When** I view any page
**Then** the layout must adapt to screen sizes from 320px to 768px
**And** all content must be accessible without horizontal scrolling
**And** touch targets must be appropriately sized (minimum 44x44px)
**And** text must be readable without zooming (minimum 16px font size)
**And** mobile-specific features (camera, GPS) should be supported where applicable

### Example: Progressive Web App (PWA)
**Given** the application is a PWA
**When** I install it on my device
**Then** the app must work offline for previously visited pages
**And** the app must have a valid manifest.json
**And** the app must have a service worker for caching
**And** the app must display a custom install prompt
**And** the app must show an offline page when network is unavailable

---

## Data Validation Criteria

### Example: Email Validation
**Given** I am entering an email address in a form
**When** I submit the form
**Then** the email must match the format: local@domain.tld
**And** the email must be no longer than 254 characters
**And** special characters in local part must be properly handled
**And** the domain must have a valid TLD
**And** the email must be case-insensitive

**Valid Examples:**
- user@example.com
- user.name@example.com
- user+tag@example.co.uk
- user123@sub.example.com

**Invalid Examples:**
- userexample.com (missing @)
- @example.com (missing local part)
- user@.com (invalid domain)
- user @example.com (space not allowed)

---

### Example: Password Validation
**Given** I am creating a new password
**When** I enter a password in the registration form
**Then** the password must be at least 8 characters long
**And** the password must contain at least one uppercase letter
**And** the password must contain at least one lowercase letter
**And** the password must contain at least one number
**And** the password must contain at least one special character (!@#$%^&*)
**And** the password must not contain the user's email or username
**And** password strength indicator should show in real-time

**Valid Examples:**
- SecureP@ss123
- MyP@ssw0rd!
- C0mplex!Password

**Invalid Examples:**
- password (no uppercase, number, or special char)
- PASSWORD123 (no lowercase or special char)
- Pass1! (too short, less than 8 chars)

---

### Example: Phone Number Validation
**Given** I am entering a phone number
**When** I submit the form
**Then** the phone number must be in a valid format
**And** country code must be supported (US, UK, CA, etc.)
**And** the system should accept various formats:
  - (555) 123-4567
  - 555-123-4567
  - 555.123.4567
  - +1-555-123-4567
**And** the system should store in normalized format: +15551234567
**And** the system should provide format hints or auto-formatting

---

### Example: Date Validation
**Given** I am entering a date (birth date, start date, etc.)
**When** I submit the form
**Then** the date must be in format MM/DD/YYYY or YYYY-MM-DD
**And** the date must be valid (no Feb 31, etc.)
**And** birth date must be in the past
**And** user must be at least 13 years old (if applicable)
**And** date must be no more than 150 years ago (birth date)
**And** the system should provide a date picker for easier input

---

### Example: File Upload Validation
**Given** I am uploading a file
**When** I select a file and submit
**Then** the file must be of allowed type (jpg, png, pdf, etc.)
**And** the file size must not exceed 5 MB
**And** the file name must not contain special characters (/, \, :, *, etc.)
**And** the system must scan for malware/viruses
**And** the uploaded file must be stored securely
**And** I should see upload progress indicator
**And** I should be able to cancel upload in progress

---

## Internationalization (i18n) Criteria

### Example: Multi-Language Support
**Given** the application supports multiple languages
**When** I select a language preference
**Then** all UI text must be translated to the selected language
**And** date formats must follow locale conventions
**And** number formats must follow locale conventions (1,000.00 vs 1.000,00)
**And** currency symbols must be appropriate for locale
**And** text direction must be correct (LTR vs RTL for Arabic/Hebrew)
**And** language preference must persist across sessions

---

## Compliance Criteria

### Example: GDPR Compliance
**Given** the application processes EU user data
**When** a user interacts with the system
**Then** cookie consent must be obtained before setting non-essential cookies
**And** users must be able to access their personal data (data export)
**And** users must be able to delete their account and data
**And** privacy policy must be clear and accessible
**And** data breach notification must occur within 72 hours
**And** data processing must have legal basis (consent, contract, etc.)

---

## Testing Criteria

### Example: Test Coverage
**Given** new functionality is developed
**When** the code is ready for review
**Then** unit test coverage must be at least 80%
**And** all critical paths must have integration tests
**And** E2E tests must cover main user journeys
**And** all edge cases must have corresponding tests
**And** regression tests must pass 100%

---

## Acceptance Criteria Checklist

When writing acceptance criteria, ensure:

- [ ] **Specific:** Criteria are precise and unambiguous
- [ ] **Measurable:** Success can be objectively verified
- [ ] **Testable:** Can be converted to test cases
- [ ] **Complete:** All scenarios are covered (happy path, error cases, edge cases)
- [ ] **Realistic:** Criteria are achievable within constraints
- [ ] **Independent:** Not dependent on other features (where possible)
- [ ] **Negotiable:** Open to discussion and refinement
- [ ] **Documented:** Written in clear, shared language

---

## Common Acceptance Criteria Patterns

### Pattern 1: CRUD Operations

**Create:**
- Valid data creates new record
- Invalid data shows validation errors
- Duplicate detection works
- Success confirmation is shown

**Read:**
- Record displays correctly
- Empty state is handled
- Pagination works (if applicable)
- Search/filter works (if applicable)

**Update:**
- Changes are saved correctly
- Validation prevents invalid updates
- Concurrent updates are handled
- Update history is maintained (if required)

**Delete:**
- Confirmation is required
- Soft delete vs hard delete is clear
- Related data is handled appropriately
- Undo option is available (if applicable)

---

### Pattern 2: Form Submission

- [ ] All fields are validated
- [ ] Required fields are enforced
- [ ] Validation errors are clear and helpful
- [ ] Submit button is disabled during submission
- [ ] Success message is displayed
- [ ] User is redirected appropriately
- [ ] Form data is cleared or retained as appropriate
- [ ] Double submission is prevented

---

### Pattern 3: List/Table Display

- [ ] Data loads correctly
- [ ] Empty state is handled gracefully
- [ ] Pagination works if dataset is large
- [ ] Sorting works on appropriate columns
- [ ] Filtering works correctly
- [ ] Search functionality works
- [ ] Loading states are shown
- [ ] Error states are handled

---

## Tips for Writing Effective Acceptance Criteria

### Do:
- ✅ Write from the user's perspective
- ✅ Use clear, simple language
- ✅ Focus on what, not how
- ✅ Include both positive and negative scenarios
- ✅ Make criteria testable and measurable
- ✅ Collaborate with stakeholders
- ✅ Review and refine before development

### Don't:
- ❌ Write technical implementation details
- ❌ Make assumptions without clarification
- ❌ Use vague terms like "user-friendly" or "fast"
- ❌ Forget edge cases and error scenarios
- ❌ Write criteria that can't be tested
- ❌ Include unrelated requirements
- ❌ Skip non-functional requirements

---

## Template for New Feature

```
### Feature: [Feature Name]

#### Scenario 1: [Primary Happy Path]
**Given** [initial context]
**When** [action occurs]
**Then** [expected outcome]
**And** [additional outcome]

#### Scenario 2: [Alternative Path]
**Given** [initial context]
**When** [action occurs]
**Then** [expected outcome]

#### Scenario 3: [Error Case]
**Given** [initial context]
**When** [error condition]
**Then** [error handling]
**And** [recovery option]

#### Scenario 4: [Edge Case]
**Given** [edge condition]
**When** [action occurs]
**Then** [expected handling]

### Non-Functional Requirements:
- Performance: [specific metrics]
- Security: [security requirements]
- Accessibility: [WCAG criteria]
- Browser/Device: [compatibility requirements]

### Acceptance:
- [ ] All scenarios pass testing
- [ ] Non-functional requirements met
- [ ] Documentation updated
- [ ] Stakeholder approval received
```

---

*This template follows BDD (Behavior-Driven Development) principles and is compatible with testing frameworks like Cucumber, SpecFlow, and Behave.*

**Document Version:** 1.0
**Last Updated:** YYYY-MM-DD
