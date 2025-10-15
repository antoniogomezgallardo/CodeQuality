# AI Test Generation Prompt Templates

## Overview
This document provides proven prompt templates for generating high-quality tests using AI tools like ChatGPT, Claude, GitHub Copilot, or custom LLM integrations.

## General Principles

**Good prompts include:**
1. **Role** - Define the AI's expertise
2. **Context** - Provide relevant background
3. **Task** - Clearly state what you want
4. **Format** - Specify output structure
5. **Constraints** - Add requirements and limitations
6. **Examples** - Show desired patterns (optional)

---

## Template 1: Unit Test Generation (Basic)

```markdown
You are an expert QA engineer specializing in [LANGUAGE/FRAMEWORK].

Task: Generate comprehensive unit tests for the following code.

Code to test:
```[LANGUAGE]
[PASTE_CODE_HERE]
```

Requirements:
- Use [TESTING_FRAMEWORK] framework
- Follow AAA (Arrange, Act, Assert) pattern
- Include happy path tests
- Include edge cases
- Include error handling tests
- Use descriptive test names
- Add comments explaining complex test logic

Output: Complete, runnable test file with all necessary imports.
```

**Example Usage:**
```
You are an expert QA engineer specializing in Python.

Task: Generate comprehensive unit tests for the following code.

Code to test:
```python
def calculate_discount(price, discount_percent):
    if price < 0:
        raise ValueError("Price cannot be negative")
    if discount_percent < 0 or discount_percent > 100:
        raise ValueError("Discount must be between 0 and 100")
    return price * (1 - discount_percent / 100)
```

Requirements:
- Use pytest framework
- Follow AAA (Arrange, Act, Assert) pattern
- Include happy path tests
- Include edge cases
- Include error handling tests
- Use descriptive test names
- Add comments explaining complex test logic

Output: Complete, runnable test file with all necessary imports.
```

---

## Template 2: Unit Test Generation (Advanced)

```markdown
You are a senior QA engineer with expertise in [LANGUAGE] and [TESTING_FRAMEWORK].

Context:
- Project: [PROJECT_DESCRIPTION]
- Code Style: [STYLE_GUIDE_LINK or key points]
- Existing Patterns: [EXAMPLES of existing test patterns in codebase]

Task: Generate production-quality unit tests for the function below.

Function to test:
```[LANGUAGE]
[PASTE_CODE_HERE]
```

Test Requirements:
1. Testing Framework: [FRAMEWORK]
2. Coverage Goals: [PERCENTAGE]% line coverage
3. Test Types Required:
   - Happy path scenarios (main functionality)
   - Edge cases and boundary conditions
   - Error handling (all exception paths)
   - Null/undefined/empty input handling
   - Type validation (if applicable)

4. Code Quality:
   - Use descriptive test names that explain what is tested
   - Follow [PATTERN] pattern (AAA/BDD/Given-When-Then)
   - Add setup/teardown if needed
   - Group related tests using describe/context blocks
   - Add comments for complex assertions

5. Mocking Strategy:
   - Mock external dependencies: [LIST]
   - Use [MOCKING_LIBRARY]
   - Verify mock interactions where appropriate

6. Test Data:
   - Use realistic test data
   - Avoid hardcoded magic numbers
   - Extract test data to constants when reused

Constraints:
- Maximum test file length: [NUMBER] lines
- Each test should be independent
- Tests must be deterministic (no random values)
- Use [ASSERTION_LIBRARY] for assertions

Output Format:
```[LANGUAGE]
// Full, runnable test file
// Include all imports
// Include setup/teardown
// Include helper functions if needed
```
```

---

## Template 3: Integration Test Generation

```markdown
You are an expert in integration testing for [TECHNOLOGY_STACK].

Context:
- Application: [APP_DESCRIPTION]
- Tech Stack: [FRONTEND_TECH], [BACKEND_TECH], [DATABASE]
- Testing Environment: [ENVIRONMENT_DETAILS]

Task: Generate integration tests for the following API endpoint/component interaction.

Component/Endpoint Details:
[PASTE_DETAILS_HERE]

Test Scenarios to Cover:
1. Successful request/response
2. Invalid input validation
3. Authentication/Authorization
4. Error handling
5. Database interactions
6. External service integration
7. Performance under load (basic)

Requirements:
- Framework: [INTEGRATION_TEST_FRAMEWORK]
- Database: Use [TEST_DB_STRATEGY] (fixtures/seeds/mocks)
- Authentication: [AUTH_STRATEGY]
- HTTP Client: [HTTP_CLIENT_LIBRARY]

Test Structure:
- Setup: Initialize test database, auth tokens, etc.
- Teardown: Clean up test data
- Assertions: Verify status codes, response structure, database state

Output: Complete integration test suite with setup/teardown.
```

---

## Template 4: E2E Test Generation from User Story

```markdown
You are an E2E testing expert using [E2E_FRAMEWORK].

User Story:
"""
[PASTE_USER_STORY_HERE]
"""

Acceptance Criteria:
1. [CRITERION_1]
2. [CRITERION_2]
3. [CRITERION_3]

Task: Generate comprehensive E2E tests that validate this user story.

Requirements:
1. Framework: [PLAYWRIGHT/CYPRESS/SELENIUM]
2. Pattern: Use Page Object Model
3. Test Data: Use fixtures
4. Selectors: Prefer data-testid attributes
5. Waits: Use explicit waits, no hard-coded sleeps
6. Assertions: Check both UI state and API responses where applicable

Test Scenarios:
- Happy path (user completes flow successfully)
- Alternative paths (user takes different route)
- Error scenarios (invalid inputs, network errors)
- Edge cases (boundary values, special characters)

Output:
1. Page Object classes for each page/component
2. Test file with all scenarios
3. Fixture file with test data
4. Configuration if needed
```

---

## Template 5: Test Data Generation

```markdown
You are a test data specialist.

Task: Generate realistic, diverse test data for the following schema/interface.

Schema:
```[FORMAT]
[PASTE_SCHEMA_HERE]
```

Requirements:
- Generate [NUMBER] test data samples
- Data Type: [VALID/INVALID/EDGE_CASE]
- Diversity: Include various demographics, locales, formats
- Realism: Use realistic values (real names, valid emails, etc.)
- Format: Output as [JSON/CSV/SQL/OTHER]

For VALID data:
- Follow all validation rules
- Ensure referential integrity
- Use realistic values

For INVALID data:
- Violate specific validation rules systematically
- Include boundary violations
- Include type mismatches
- Include SQL injection attempts (if testing security)

For EDGE CASE data:
- Minimum/maximum values
- Empty strings, nulls, undefined
- Special characters, Unicode
- Very long strings
- Unusual but valid formats

Output: [FORMAT] with [NUMBER] samples
```

---

## Template 6: Refactor Tests with AI

```markdown
You are a test refactoring expert.

Task: Refactor the following test code to improve quality and maintainability.

Current Test Code:
```[LANGUAGE]
[PASTE_CURRENT_TESTS]
```

Improvements Needed:
- [ ] Remove code duplication
- [ ] Extract common setup to fixtures/beforeEach
- [ ] Improve test names and descriptions
- [ ] Add missing edge cases
- [ ] Improve assertions (more specific)
- [ ] Extract magic numbers to constants
- [ ] Add parameterized tests where applicable
- [ ] Improve readability and structure
- [ ] Add comments for complex logic
- [ ] Follow [STYLE_GUIDE]

Constraints:
- Maintain 100% test coverage
- Do not change test behavior (tests must still pass)
- Keep existing test names if they're good

Output: Refactored test code with explanatory comments highlighting changes.
```

---

## Template 7: Generate Missing Tests

```markdown
You are a QA analyst specializing in test coverage analysis.

Context:
- Current test coverage: [PERCENTAGE]%
- Target coverage: [PERCENTAGE]%

Task: Analyze the code and existing tests, then generate tests for uncovered code paths.

Source Code:
```[LANGUAGE]
[PASTE_SOURCE_CODE]
```

Existing Tests:
```[LANGUAGE]
[PASTE_EXISTING_TESTS]
```

Coverage Report (uncovered lines):
[PASTE_COVERAGE_REPORT or LIST_UNCOVERED_LINES]

Requirements:
1. Analyze which code paths are not covered
2. Generate tests specifically for uncovered lines
3. Prioritize:
   - Error handling paths
   - Edge cases
   - Conditional branches
4. Match style of existing tests
5. Do not duplicate existing test scenarios

Output:
- List of uncovered scenarios (bullet points)
- New test cases to add to existing test file
- Explanation of what each new test covers
```

---

## Template 8: Security-Focused Test Generation

```markdown
You are a security testing expert.

Task: Generate security-focused tests for the following code/endpoint.

Code/Endpoint:
[PASTE_CODE_OR_API_SPEC]

Security Test Categories:
1. **Input Validation**
   - SQL injection attempts
   - XSS payloads
   - Command injection
   - Path traversal
   - XML/JSON bomb attacks

2. **Authentication & Authorization**
   - Missing authentication
   - Invalid tokens
   - Expired tokens
   - Role-based access violations

3. **Data Exposure**
   - Sensitive data in responses
   - PII leakage
   - Stack traces exposed

4. **Rate Limiting & DoS**
   - Excessive requests
   - Large payloads
   - Resource exhaustion

5. **Cryptography**
   - Weak encryption
   - Insecure random values
   - Certificate validation

Requirements:
- Use [SECURITY_TESTING_FRAMEWORK]
- Follow OWASP Top 10 guidelines
- Include both positive (should block) and negative (should allow) tests
- Document expected security behavior in comments

Output: Security test suite with explanatory comments.
```

---

## Template 9: Performance Test Scenarios

```markdown
You are a performance testing expert.

Task: Generate performance test scenarios for the following system/endpoint.

System Under Test:
[DESCRIBE_SYSTEM]

Performance Requirements:
- Response Time: [P50/P95/P99 targets]
- Throughput: [RPS target]
- Concurrent Users: [NUMBER]
- Test Duration: [DURATION]

Test Tool: [K6/JMETER/GATLING/LOCUST]

Scenarios to Generate:
1. **Baseline Test**
   - Single user
   - Verify functionality under no load

2. **Load Test**
   - Gradual ramp-up to [NUMBER] users
   - Sustained load for [DURATION]
   - Verify performance within SLA

3. **Stress Test**
   - Push beyond normal capacity
   - Find breaking point
   - Verify graceful degradation

4. **Spike Test**
   - Sudden traffic increase
   - Verify system handles spike

5. **Soak/Endurance Test**
   - Moderate load for extended period
   - Detect memory leaks, resource exhaustion

Output:
- Performance test scripts
- Configuration for each scenario
- Success criteria/thresholds
- Monitoring metrics to track
```

---

## Template 10: Test from Bug Report

```markdown
You are a QA engineer creating regression tests.

Task: Generate a test that reproduces and validates the fix for the following bug.

Bug Report:
```
Title: [BUG_TITLE]
Description: [BUG_DESCRIPTION]
Steps to Reproduce:
1. [STEP_1]
2. [STEP_2]
3. [STEP_3]

Expected: [EXPECTED_BEHAVIOR]
Actual: [ACTUAL_BEHAVIOR]

Environment: [ENVIRONMENT_DETAILS]
```

Fix Applied:
```[LANGUAGE]
[PASTE_FIX_CODE or DESCRIBE_FIX]
```

Requirements:
1. Test must reproduce the original bug scenario
2. Test must fail with old code, pass with fixed code
3. Test must be specific enough to catch regression
4. Include descriptive test name referencing bug ID
5. Add comment explaining what bug this prevents

Output:
- Regression test that validates the fix
- Test name: test_[bug_id]_[brief_description]
- Comment with bug ID and link
```

---

## Prompt Optimization Tips

### Make Prompts More Specific
❌ **Bad:** "Generate tests for this code"
✅ **Good:** "Generate pytest unit tests following AAA pattern for this Python function, including edge cases for negative inputs and boundary conditions"

### Provide Examples
```markdown
Generate tests similar to this existing test:

```python
def test_valid_email():
    # Arrange
    email = "user@example.com"

    # Act
    result = validate_email(email)

    # Assert
    assert result is True
```

Now generate tests for the validate_phone() function following the same pattern.
```

### Iterate and Refine
1. Start with basic prompt
2. Review output
3. Add constraints/requirements based on gaps
4. Regenerate with improved prompt
5. Repeat until quality is acceptable

### Use Chain-of-Thought
```markdown
Before generating tests, first:
1. List all the code paths in the function
2. Identify edge cases and boundary conditions
3. List potential error scenarios
4. Then generate comprehensive tests covering all items above
```

---

## Prompt Variables Reference

Replace these placeholders in templates:

```yaml
[LANGUAGE]: JavaScript, Python, Java, TypeScript, Go, etc.
[FRAMEWORK]: React, Django, Spring Boot, Express, etc.
[TESTING_FRAMEWORK]: Jest, pytest, JUnit, RSpec, etc.
[PATTERN]: AAA, BDD, Given-When-Then
[MOCKING_LIBRARY]: Jest, Sinon, Mockito, unittest.mock
[ASSERTION_LIBRARY]: expect, assert, should, Chai
[E2E_FRAMEWORK]: Playwright, Cypress, Selenium
[HTTP_CLIENT_LIBRARY]: axios, supertest, RestAssured
[SECURITY_TESTING_FRAMEWORK]: OWASP ZAP, Burp Suite
[PERFORMANCE_TOOL]: k6, JMeter, Gatling, Locust
```

---

## Version Control

**Template Version:** 1.0
**Last Updated:** October 2024
**Maintained By:** QA Team
**Feedback:** Submit improvements via [PROCESS]
