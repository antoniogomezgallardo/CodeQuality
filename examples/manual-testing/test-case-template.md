# Manual Test Case Template

## Test Case Information

**Test Case ID:** TC-001
**Test Case Title:** User Login with Valid Credentials
**Module:** Authentication
**Priority:** High
**Severity:** Critical
**Test Type:** Functional
**Author:** [Tester Name]
**Creation Date:** [Date]
**Last Modified:** [Date]
**Version:** 1.0

## Test Objective

Verify that users can successfully log into the application using valid credentials.

## Pre-conditions

1. User account exists in the system
2. Application is accessible
3. Database is running and accessible
4. Test environment is set up correctly

## Test Data

| Field            | Value                | Notes                 |
| ---------------- | -------------------- | --------------------- |
| Username         | testuser@example.com | Valid registered user |
| Password         | Test123!             | Valid password        |
| Invalid Username | invalid@example.com  | Non-existent user     |
| Invalid Password | wrongpassword        | Incorrect password    |

## Test Steps

| Step | Action                                 | Expected Result                                               |
| ---- | -------------------------------------- | ------------------------------------------------------------- |
| 1    | Navigate to application URL            | Login page displays correctly                                 |
| 2    | Verify login form elements are present | Username field, password field, login button visible          |
| 3    | Enter valid username in username field | Username is entered correctly                                 |
| 4    | Enter valid password in password field | Password is masked with asterisks                             |
| 5    | Click "Login" button                   | User is redirected to dashboard                               |
| 6    | Verify successful login indicators     | Welcome message, user name displayed, logout option available |

## Negative Test Scenarios

### Scenario 1: Invalid Username

| Step | Action                            | Expected Result                               |
| ---- | --------------------------------- | --------------------------------------------- |
| 1    | Enter invalid username            | Field accepts input                           |
| 2    | Enter valid password              | Field accepts input                           |
| 3    | Click "Login" button              | Error message: "Invalid username or password" |
| 4    | Verify user remains on login page | Login form is still visible                   |

### Scenario 2: Invalid Password

| Step | Action                            | Expected Result                               |
| ---- | --------------------------------- | --------------------------------------------- |
| 1    | Enter valid username              | Field accepts input                           |
| 2    | Enter invalid password            | Field accepts input                           |
| 3    | Click "Login" button              | Error message: "Invalid username or password" |
| 4    | Verify user remains on login page | Login form is still visible                   |

### Scenario 3: Empty Fields

| Step | Action                     | Expected Result                                                   |
| ---- | -------------------------- | ----------------------------------------------------------------- |
| 1    | Leave username field empty | Field remains empty                                               |
| 2    | Leave password field empty | Field remains empty                                               |
| 3    | Click "Login" button       | Validation errors: "Username is required", "Password is required" |

## Post-conditions

1. User is logged in successfully (for positive test)
2. User session is established
3. User can access protected pages
4. Logout functionality is available

## Test Environment

- **Browser:** Chrome 118+, Firefox 119+, Safari 17+
- **Operating System:** Windows 11, macOS 14, Ubuntu 22.04
- **Screen Resolution:** 1920x1080, 1366x768
- **Device:** Desktop, Tablet, Mobile

## Pass/Fail Criteria

**Pass Criteria:**

- All test steps execute successfully
- Expected results match actual results
- No critical or high-severity defects found
- User can complete login workflow without issues

**Fail Criteria:**

- Any test step fails
- Actual results don't match expected results
- Critical or high-severity defects found
- User cannot complete login workflow

## Test Execution

**Executed By:** [Tester Name]
**Execution Date:** [Date]
**Execution Time:** [Start Time] - [End Time]
**Build Version:** [Version Number]
**Status:** [Pass/Fail/Blocked]

## Actual Results

| Step | Actual Result                  | Status | Comments               |
| ---- | ------------------------------ | ------ | ---------------------- |
| 1    | Login page loaded in 2 seconds | Pass   | Page loads correctly   |
| 2    | All form elements visible      | Pass   | UI elements present    |
| 3    | Username entered successfully  | Pass   | No issues              |
| 4    | Password masked correctly      | Pass   | Security working       |
| 5    | Redirected to dashboard        | Pass   | Login successful       |
| 6    | Welcome message displayed      | Pass   | All indicators present |

## Defects Found

**Defect ID:** [If any defects found]
**Defect Summary:** [Brief description]
**Defect Description:** [Detailed description]
**Steps to Reproduce:** [Steps]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [High/Medium/Low]
**Status:** [Open/In Progress/Resolved]

## Additional Notes

- Test executed on multiple browsers successfully
- No performance issues observed
- All accessibility requirements met
- Consider adding two-factor authentication testing in future iterations

## Attachments

- Screenshots of test execution
- Video recording of test flow
- Error logs (if applicable)
- Network traffic analysis (if applicable)

---

**Reviewer:** [Reviewer Name]
**Review Date:** [Date]
**Review Comments:** [Comments]
**Approval Status:** [Approved/Rejected/Needs Revision]

---

## Test Case Variations

### Mobile Testing Variation

**Additional Considerations for Mobile:**

- Touch interactions instead of mouse clicks
- Screen orientation changes (portrait/landscape)
- Keyboard behavior on mobile devices
- Touch target size and accessibility
- Network connectivity variations

### Accessibility Testing Variation

**Additional Steps for Accessibility:**

1. Navigate using keyboard only (Tab, Enter, Escape)
2. Test with screen reader (NVDA, JAWS, VoiceOver)
3. Verify color contrast meets WCAG guidelines
4. Test with browser zoom at 200%
5. Verify all interactive elements have proper labels

### Performance Testing Variation

**Additional Measurements:**

- Page load time under 3 seconds
- Login response time under 1 second
- Memory usage within acceptable limits
- Network requests optimized
- No JavaScript errors in console

### Security Testing Variation

**Additional Security Checks:**

1. Verify password is not visible in network requests
2. Check for SQL injection vulnerabilities
3. Verify session handling and timeout
4. Test account lockout after failed attempts
5. Verify HTTPS enforcement
