# Exploratory Testing Session Charter Templates

## 📝 Basic Charter Template

### Session Information
**Session ID:** ET-2024-001
**Tester:** [Tester Name]
**Date:** [Date]
**Duration:** [Start Time] - [End Time] (Target: 90 minutes)
**Application:** [Application Name and Version]
**Environment:** [Test Environment]

### Charter Statement
**Explore** [target area]
**With** [resources/tools/techniques]
**To discover** [information/risks/problems]

### Example Charter
**Explore** the user registration workflow
**With** various input combinations and browser tools
**To discover** validation issues, usability problems, and security vulnerabilities

---

## 🎯 Focused Charter Templates

### 1. Feature-Focused Charter

#### Session Charter: User Authentication
**Mission:** Explore user login and authentication mechanisms to identify security and usability issues

**Areas to Explore:**
- Login form validation
- Password strength requirements
- Account lockout mechanisms
- Remember me functionality
- Password reset flow
- Two-factor authentication
- Session management

**Test Ideas:**
- Try various password combinations
- Test with invalid email formats
- Attempt SQL injection in login fields
- Test concurrent login sessions
- Verify session timeout behavior
- Test password reset with invalid emails
- Check for password visibility toggles

**Resources:**
- Multiple browsers (Chrome, Firefox, Safari)
- Developer tools for network inspection
- Password managers for testing autofill
- VPN for testing from different locations

**Success Criteria:**
- All critical security issues identified
- Usability problems documented
- Edge cases explored thoroughly
- At least 3 improvement suggestions provided

---

### 2. Data-Focused Charter

#### Session Charter: Data Input Handling
**Mission:** Explore how the application handles various data inputs across different form fields

**Focus Areas:**
- Form field validation
- Special character handling
- File upload functionality
- Data persistence
- Input sanitization
- Error message clarity

**Test Data Categories:**
- **Boundary Values:** Min/max lengths, numerical limits
- **Special Characters:** Unicode, emojis, symbols
- **Invalid Formats:** Malformed emails, phone numbers
- **Large Datasets:** Long text strings, large files
- **Empty/Null Values:** Missing required fields
- **Script Injection:** XSS and injection attempts

**Exploration Techniques:**
- Copy-paste from external sources
- Browser autofill and autocomplete
- Keyboard shortcuts and hotkeys
- Right-click context menus
- Drag and drop operations

---

### 3. Workflow-Focused Charter

#### Session Charter: E-commerce Checkout Process
**Mission:** Explore the end-to-end checkout process to ensure smooth user experience

**User Journey:**
1. Product selection and cart management
2. Guest vs. registered user checkout
3. Shipping information entry
4. Payment method selection
5. Order review and confirmation
6. Post-purchase experience

**Scenarios to Test:**
- **Happy Path:** Complete purchase successfully
- **Interrupted Flow:** Browser refresh, back button
- **Payment Issues:** Declined cards, network errors
- **Address Validation:** Invalid addresses, international shipping
- **Promo Codes:** Valid/invalid/expired codes
- **Inventory Changes:** Out of stock during checkout

**Tools and Techniques:**
- Multiple payment methods (credit cards, PayPal, etc.)
- Different shipping addresses
- Various discount codes
- Network throttling for slow connections
- Multiple browser tabs/windows

---

### 4. Performance-Focused Charter

#### Session Charter: Application Performance Under Load
**Mission:** Explore application behavior under various performance conditions

**Performance Aspects:**
- Page load times
- Image and asset loading
- Form submission responsiveness
- Search functionality speed
- Navigation smoothness
- Memory usage patterns

**Testing Conditions:**
- **Network Speeds:** Fast broadband, 3G, slow connections
- **Device Types:** Desktop, tablet, mobile
- **Browser Load:** Multiple tabs, extensions, background apps
- **Time of Day:** Peak vs. off-peak usage simulation
- **Geographic Location:** Different server regions

**Observation Points:**
- Loading indicators and feedback
- Progressive loading behavior
- Error handling during timeouts
- User experience during delays
- Performance degradation patterns

---

### 5. Security-Focused Charter

#### Session Charter: Security Vulnerability Assessment
**Mission:** Explore potential security vulnerabilities through user interface interactions

**Security Areas:**
- Input validation and sanitization
- Authentication and authorization
- Session management
- Data exposure
- URL manipulation
- File upload security

**Attack Vectors to Explore:**
- **Cross-Site Scripting (XSS):** Script injection in input fields
- **SQL Injection:** Database query manipulation
- **CSRF:** Cross-site request forgery attempts
- **Directory Traversal:** File system access attempts
- **Broken Authentication:** Session hijacking, privilege escalation
- **Sensitive Data Exposure:** Information leakage

**Testing Techniques:**
- Browser developer tools for inspection
- URL parameter manipulation
- Cookie and session storage examination
- Network traffic analysis
- Source code inspection (if accessible)

---

### 6. Usability-Focused Charter

#### Session Charter: User Experience Evaluation
**Mission:** Explore the application from a user experience perspective to identify usability issues

**UX Dimensions:**
- **Learnability:** How easy is it for new users?
- **Efficiency:** How quickly can tasks be completed?
- **Memorability:** Can users remember how to use it?
- **Error Recovery:** How well does it handle user mistakes?
- **Satisfaction:** How pleasant is the experience?

**User Personas to Consider:**
- First-time users
- Power users
- Mobile-only users
- Users with disabilities
- Non-technical users
- International users

**Exploration Focus:**
- Navigation patterns and wayfinding
- Visual hierarchy and information architecture
- Error messages and help text
- Mobile responsiveness and touch interactions
- Accessibility features and keyboard navigation

---

### 7. Compatibility-Focused Charter

#### Session Charter: Cross-Platform Compatibility
**Mission:** Explore application behavior across different platforms and configurations

**Compatibility Matrix:**
- **Browsers:** Chrome, Firefox, Safari, Edge
- **Operating Systems:** Windows, macOS, Linux, iOS, Android
- **Devices:** Desktop, laptop, tablet, smartphone
- **Screen Sizes:** Various resolutions and orientations
- **Assistive Technologies:** Screen readers, magnifiers

**Areas to Test:**
- Feature parity across platforms
- Visual consistency and layout
- Performance differences
- Input method variations
- Platform-specific behaviors

**Testing Approach:**
- Side-by-side comparison testing
- Feature availability mapping
- Performance benchmarking
- Visual regression checking
- Accessibility compliance verification

---

## 📊 Session Documentation Template

### Pre-Session Setup
**Test Environment:** [URL/Version]
**Test Data:** [Accounts/Credentials needed]
**Tools Required:** [Browser, extensions, etc.]
**Preconditions:** [Setup steps completed]

### Session Execution Log

| Time | Activity | Observation | Issue/Question |
|------|----------|-------------|----------------|
| 10:00 | Started login exploration | Login form loads correctly | Password field should show strength indicator |
| 10:15 | Tested invalid credentials | Clear error message displayed | Consider rate limiting after multiple failures |
| 10:30 | Explored password reset | Email sent successfully | Reset link expires too quickly (5 min) |

### Findings Summary

#### Bugs Found
1. **Bug #001:** Password reset link expires in 5 minutes
   - **Severity:** Medium
   - **Steps:** Request password reset, wait 6 minutes, click link
   - **Expected:** Link should work for at least 1 hour
   - **Actual:** "Link expired" error message

2. **Bug #002:** No visual feedback during login
   - **Severity:** Low
   - **Description:** No loading indicator during authentication
   - **Impact:** Users might click multiple times

#### Improvement Opportunities
- Add password strength indicator
- Implement progressive form validation
- Consider social login options
- Improve error message specificity

#### Questions for Development Team
1. What is the intended session timeout duration?
2. Should there be CAPTCHA after failed login attempts?
3. Is two-factor authentication planned for future releases?

#### Test Coverage Assessment
- ✅ Basic login functionality
- ✅ Password reset flow
- ✅ Invalid input handling
- ❌ Two-factor authentication (not implemented)
- ❌ Social login options (not available)
- ⚠️ Account lockout mechanism (partially tested)

### Post-Session Analysis

#### What Went Well
- Comprehensive coverage of login scenarios
- Good documentation of findings
- Identified multiple improvement opportunities

#### What Could Be Improved
- Need more time for security testing
- Should test with different user roles
- Could explore mobile browser behavior

#### Next Session Recommendations
- Focus on mobile login experience
- Explore administrative user management
- Test integration with password managers

### Session Metrics
- **Total Time:** 90 minutes
- **Bugs Found:** 2
- **Areas Explored:** 5
- **Test Ideas Generated:** 12
- **Questions Raised:** 3

---

## 🎯 Charter Creation Guidelines

### Good Charter Characteristics
- **Specific:** Clear scope and boundaries
- **Testable:** Actionable exploration areas
- **Time-boxed:** Realistic duration estimates
- **Valuable:** Addresses important risks or questions
- **Achievable:** Feasible with available resources

### Charter Development Process
1. **Identify Risk Areas:** What could go wrong?
2. **Define Learning Goals:** What do we need to know?
3. **Set Boundaries:** What's in scope vs. out of scope?
4. **Choose Techniques:** How will we explore?
5. **Plan Documentation:** How will we capture findings?

### Charter Review Checklist
- [ ] Mission statement is clear and focused
- [ ] Scope is appropriate for time allocated
- [ ] Success criteria are defined
- [ ] Required resources are identified
- [ ] Documentation approach is planned
- [ ] Stakeholder expectations are set

---

*Well-crafted charters provide direction and focus for exploratory testing sessions while maintaining the flexibility that makes this approach so valuable.*