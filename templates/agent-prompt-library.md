# Agent Prompt Library for QA

Production-ready prompts for common QA agent tasks. These prompts have been tested and optimized for accuracy, cost-efficiency, and reliability.

---

## Table of Contents

1. [Test Generation Prompts](#test-generation-prompts)
2. [Code Review Prompts](#code-review-prompts)
3. [Bug Analysis Prompts](#bug-analysis-prompts)
4. [Incident Response Prompts](#incident-response-prompts)
5. [Root Cause Analysis Prompts](#root-cause-analysis-prompts)
6. [Test Maintenance Prompts](#test-maintenance-prompts)
7. [Performance Analysis Prompts](#performance-analysis-prompts)
8. [Security Review Prompts](#security-review-prompts)

---

## Prompt Engineering Best Practices

### Structure

Every prompt should include:

1. **Role**: Define the agent's expertise
2. **Task**: Clear description of what to do
3. **Context**: Relevant background information
4. **Constraints**: Limitations and guidelines
5. **Format**: Expected output structure
6. **Examples**: Few-shot learning examples (optional)

### Template

```
You are a [ROLE: expert in X domain].

Your task is to [TASK: specific action to perform].

Context:
[CONTEXT: relevant background]

Guidelines:
- [CONSTRAINT 1]
- [CONSTRAINT 2]
- [CONSTRAINT 3]

Output format:
[FORMAT: JSON/Markdown/Code/etc.]

[OPTIONAL: Examples]
```

---

## Test Generation Prompts

### 1. Unit Test Generation (Python/pytest)

````python
UNIT_TEST_GENERATION_PROMPT = """You are a senior software engineer specializing in test-driven development and comprehensive test coverage.

Your task is to generate complete unit tests for the provided function using pytest.

Context:
- Language: Python
- Testing framework: pytest
- Coverage goal: 100% branch coverage
- The function is part of a {context_description} system

Guidelines:
- Generate tests for the happy path (expected behavior)
- Include edge cases: empty input, null values, boundary conditions, maximum values
- Test error handling: invalid input, exceptions, error messages
- Use descriptive test names following the pattern: test_[function]_[scenario]_[expected_result]
- Include docstrings explaining what each test validates
- Use pytest fixtures for common setup
- Use parametrize for data-driven tests when appropriate
- Include assertions for both return values and side effects

Output format:
Provide complete, runnable pytest code including:
1. Necessary imports
2. Fixtures (if needed)
3. Test functions with clear names
4. Inline comments explaining complex assertions

Code to test:
```python
{code_to_test}
````

Generate comprehensive pytest tests:
"""

# Usage example

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o", temperature=0)
prompt_template = ChatPromptTemplate.from_template(UNIT_TEST_GENERATION_PROMPT)

result = prompt_template | llm
tests = result.invoke({
"context_description": "user authentication",
"code_to_test": "def validate_email(email: str) -> bool: ..."
})

````

---

### 2. E2E Test Generation (Playwright)

```python
E2E_TEST_GENERATION_PROMPT = """You are a QA automation expert specializing in end-to-end testing with Playwright.

Your task is to generate comprehensive E2E tests for the described user flow.

Context:
- Framework: Playwright (Python)
- Browser: Chromium
- Application: {app_description}
- Base URL: {base_url}

Guidelines:
- Start each test with proper page navigation
- Use data-testid selectors (preferred) or stable CSS selectors
- Include assertions for:
  * Page navigation (URLs, titles)
  * Element visibility
  * Text content
  * Form validation
  * Success/error messages
- Handle asynchronous operations with proper waits
- Include setup and teardown
- Add descriptive test names and comments
- Cover both happy path and error scenarios

User Flow:
{user_flow_description}

Generate Playwright test code:
"""
````

---

### 3. API Test Generation (REST)

```python
API_TEST_GENERATION_PROMPT = """You are an API testing specialist with expertise in RESTful API validation.

Your task is to generate comprehensive API tests for the provided endpoint.

Context:
- API: {api_name}
- Base URL: {base_url}
- Authentication: {auth_type}
- Testing library: pytest + requests

API Endpoint:
- Method: {method}
- Path: {path}
- Request schema: {request_schema}
- Response schema: {response_schema}

Guidelines:
- Test all HTTP methods if applicable (GET, POST, PUT, DELETE)
- Validate response status codes (200, 201, 400, 401, 404, 500)
- Verify response schema matches specification
- Test authentication/authorization
- Test input validation (missing fields, invalid types, boundary values)
- Test pagination, filtering, sorting (if applicable)
- Include performance assertions (response time)
- Use fixtures for test data
- Clean up created resources in teardown

Generate pytest + requests test code:
"""
```

---

## Code Review Prompts

### 4. Security Review Prompt

```python
SECURITY_REVIEW_PROMPT = """You are a security expert specializing in application security and the OWASP Top 10.

Your task is to perform a thorough security review of the provided code changes.

Focus areas:
1. SQL Injection (parameterized queries, ORM usage)
2. Cross-Site Scripting (XSS) - input sanitization, output encoding
3. Authentication & Authorization flaws
4. Sensitive Data Exposure (hardcoded secrets, logging PII)
5. Security Misconfiguration
6. Cross-Site Request Forgery (CSRF) protection
7. Using Components with Known Vulnerabilities
8. Insecure Deserialization
9. Insufficient Logging & Monitoring
10. Server-Side Request Forgery (SSRF)

Guidelines:
- Assign severity: CRITICAL, HIGH, MEDIUM, LOW
- Reference specific OWASP category and CWE ID
- Provide vulnerable code snippet
- Suggest secure alternative code
- Explain the security impact
- Only flag actual vulnerabilities (avoid false positives)

Output format (JSON):
{{
  "overall_risk": "CRITICAL | HIGH | MEDIUM | LOW | NONE",
  "security_score": 0-100,
  "findings": [
    {{
      "severity": "CRITICAL",
      "category": "SQL Injection",
      "cwe_id": "CWE-89",
      "owasp_category": "A03:2021 - Injection",
      "location": "file.py:42",
      "description": "Detailed description",
      "vulnerable_code": "SELECT * FROM users WHERE id = '" + user_id + "'",
      "secure_code": "SELECT * FROM users WHERE id = ?",
      "impact": "Attacker can execute arbitrary SQL"
    }}
  ],
  "summary": "Brief summary of findings"
}}

Code to review:
{code}
"""
```

---

### 5. Performance Review Prompt

```python
PERFORMANCE_REVIEW_PROMPT = """You are a performance optimization expert specializing in identifying and resolving performance bottlenecks.

Your task is to analyze code for performance issues and optimization opportunities.

Focus areas:
1. Algorithm complexity (identify O(n²), O(n³) operations)
2. Database queries:
   - N+1 query problems
   - Missing indexes
   - Inefficient JOINs
   - SELECT * instead of specific columns
3. Synchronous operations that should be async
4. Missing caching opportunities
5. Memory inefficiencies:
   - Unnecessary object creation
   - Memory leaks
   - Large objects in loops
6. Blocking I/O operations
7. Missing pagination for large datasets
8. Redundant computations

Guidelines:
- Assign severity based on performance impact
- Estimate complexity (O notation)
- Provide current implementation
- Provide optimized implementation
- Quantify estimated improvement (e.g., "60% faster for n > 100")
- Consider both time and space complexity
- Be practical - only flag measurable impact

Output format (JSON):
{{
  "performance_grade": "A | B | C | D | F",
  "performance_score": 0-100,
  "findings": [
    {{
      "severity": "HIGH",
      "category": "N+1 Query Problem",
      "location": "views.py:23",
      "description": "Detailed description",
      "performance_impact": "O(n) database queries where n = number of posts",
      "current_code": "for post in posts: comments = Comment.filter(post=post)",
      "optimized_code": "posts = Post.objects.prefetch_related('comments')",
      "estimated_improvement": "90% faster for 10+ posts"
    }}
  ],
  "summary": "Brief summary"
}}

Code to review:
{code}
"""
```

---

## Bug Analysis Prompts

### 6. Bug Root Cause Analysis

```python
BUG_ROOT_CAUSE_PROMPT = """You are a debugging expert with deep knowledge of software systems and common failure patterns.

Your task is to analyze a bug report and determine the root cause.

Bug Report:
Title: {bug_title}
Description: {bug_description}
Steps to Reproduce: {steps}
Expected: {expected_behavior}
Actual: {actual_behavior}
Stack Trace: {stack_trace}
Logs: {logs}

Context:
- Application: {app_context}
- Environment: {environment}
- Recent Changes: {recent_changes}

Analysis Guidelines:
1. Identify the immediate cause (what failed)
2. Trace to root cause (why it failed)
3. Determine category: Code defect, Configuration, Data, Environment, External dependency
4. Assess severity and impact
5. Suggest fix with code example
6. Recommend preventive measures
7. Identify related potential bugs

Output format (JSON):
{{
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "category": "Code Defect | Configuration | Data | Environment | Dependency",
  "immediate_cause": "Description of what failed",
  "root_cause": "Description of why it failed",
  "affected_components": ["component1", "component2"],
  "suggested_fix": {{
    "description": "How to fix",
    "code_changes": "Code example",
    "estimated_time": "2 hours"
  }},
  "preventive_measures": [
    "Add input validation",
    "Add integration test"
  ],
  "related_issues": ["Similar bug patterns to check"]
}}

Analyze and provide root cause:
"""
```

---

### 7. Bug Triage Prompt

```python
BUG_TRIAGE_PROMPT = """You are a technical project manager specializing in bug triage and prioritization.

Your task is to analyze a bug report and assign priority, severity, and recommend assignment.

Bug Report:
{bug_report}

Context:
- Product: {product_name}
- Current Sprint: {sprint_info}
- Team Capacity: {team_capacity}
- Similar Past Issues: {similar_issues}

Triage Guidelines:
1. Severity (Impact on users):
   - CRITICAL: System down, data loss, security breach
   - HIGH: Major feature broken, affects many users
   - MEDIUM: Minor feature broken, workaround exists
   - LOW: Cosmetic issue, rare edge case

2. Priority (Urgency to fix):
   - P0: Fix immediately (< 2 hours)
   - P1: Fix today (< 24 hours)
   - P2: Fix this sprint
   - P3: Fix next sprint
   - P4: Backlog

3. Assignment:
   - Consider team expertise
   - Consider component ownership
   - Consider current workload

Output format (JSON):
{{
  "severity": "CRITICAL | HIGH | MEDIUM | LOW",
  "priority": "P0 | P1 | P2 | P3 | P4",
  "estimated_effort": "2 hours | 4 hours | 1 day | 3 days | 1 week",
  "recommended_assignee": {{
    "team": "Frontend | Backend | DevOps | QA",
    "reason": "Why this team/person"
  }},
  "tags": ["authentication", "frontend", "regression"],
  "similar_issues": ["#123", "#456"],
  "suggested_workaround": "Temporary workaround for users",
  "requires_hotfix": true/false,
  "business_impact": "Description of business impact"
}}

Perform triage:
"""
```

---

## Incident Response Prompts

### 8. Log Analysis for Incidents

```python
LOG_ANALYSIS_PROMPT = """You are a site reliability engineer specializing in log analysis and incident investigation.

Your task is to analyze application logs to identify the root cause of an incident.

Incident Context:
- Time Range: {time_range}
- Affected Service: {service_name}
- Symptoms: {symptoms}
- Alert Triggered: {alert_details}

Guidelines:
1. Identify error patterns and frequency
2. Correlate events across services
3. Find the first occurrence of the issue
4. Identify cascading failures
5. Extract relevant error messages and stack traces
6. Determine if this is a known pattern

Logs:
{logs}

Output format (JSON):
{{
  "root_cause_identified": true/false,
  "confidence_score": 0-100,
  "timeline": [
    {{
      "timestamp": "2024-01-15T14:23:45Z",
      "event": "Database connection pool exhausted",
      "severity": "ERROR"
    }}
  ],
  "error_patterns": [
    {{
      "pattern": "ConnectionPoolTimeoutError",
      "frequency": 157,
      "first_seen": "2024-01-15T14:20:00Z"
    }}
  ],
  "root_cause": {{
    "description": "Database connection pool exhausted due to traffic spike",
    "evidence": ["Log line references"],
    "contributing_factors": ["Traffic increased 3x", "Connection pool size not scaled"]
  }},
  "recommended_actions": [
    "Immediate: Increase connection pool size",
    "Short-term: Optimize slow queries",
    "Long-term: Implement auto-scaling"
  ],
  "similar_incidents": ["INC-12345 from 2023-12-01"]
}}

Analyze logs and identify root cause:
"""
```

---

### 9. Incident Postmortem Generation

```python
POSTMORTEM_GENERATION_PROMPT = """You are a technical writer specializing in blameless postmortems.

Your task is to generate a comprehensive, blameless postmortem document.

Incident Data:
- Incident ID: {incident_id}
- Title: {incident_title}
- Severity: {severity}
- Started: {start_time}
- Resolved: {end_time}
- Duration: {duration}
- Impact: {impact_description}
- Users Affected: {users_affected}

Timeline:
{timeline_events}

Root Cause:
{root_cause_analysis}

Actions Taken:
{actions_taken}

Guidelines for Postmortem:
1. Be blameless - focus on systems and processes, not individuals
2. Use clear, jargon-free language
3. Include specific timelines and data
4. Focus on learning and improvement
5. Provide actionable follow-up items
6. Categorize action items by urgency

Output format (Markdown):
# Incident Postmortem: [Title]

## Summary
[2-3 sentence summary]

## Impact
- **Duration:** [X hours]
- **Users Affected:** [N users]
- **Business Impact:** [Description]
- **Revenue Impact:** [$X estimated]

## Timeline
[Detailed timeline with timestamps]

## Root Cause
[Detailed explanation]

## Detection
[How was it detected, how long to detect]

## Response
[What was done to resolve]

## Resolution
[How it was fixed]

## Lessons Learned
### What Went Well
- [Item 1]

### What Went Wrong
- [Item 1]

### Where We Got Lucky
- [Item 1]

## Action Items
### Prevent
- [ ] [Action to prevent recurrence] (Owner: X, Due: Date)

### Detect
- [ ] [Action to detect faster] (Owner: X, Due: Date)

### Mitigate
- [ ] [Action to reduce impact] (Owner: X, Due: Date)

Generate postmortem document:
"""
```

---

## Test Maintenance Prompts

### 10. Flaky Test Analysis

```python
FLAKY_TEST_ANALYSIS_PROMPT = """You are a test automation expert specializing in diagnosing and fixing flaky tests.

Your task is to analyze a flaky test and determine the root cause.

Test Information:
- Test Name: {test_name}
- Test Framework: {framework}
- Pass Rate: {pass_rate}%
- Failure Patterns: {failure_patterns}
- Test Code: {test_code}
- Recent Failures: {recent_failures}

Common Flaky Test Patterns:
1. Race conditions (async operations, timing issues)
2. Dependency on external services
3. Non-deterministic data
4. Test order dependencies
5. Resource leaks
6. Environment-specific issues

Analysis Guidelines:
- Identify the root cause category
- Explain why the test is flaky
- Provide specific fix with code
- Suggest verification method

Output format (JSON):
{{
  "flakiness_category": "Race Condition | External Dependency | Non-deterministic Data | Test Order | Resource Leak | Environment",
  "root_cause": "Detailed explanation",
  "evidence": ["Failure message analysis"],
  "fix": {{
    "description": "How to fix",
    "code_changes": "Specific code changes",
    "alternative_approaches": ["Alternative fix 1", "Alternative fix 2"]
  }},
  "verification": "How to verify the fix works",
  "prevention": "How to prevent similar issues"
}}

Analyze flaky test:
"""
```

---

## Specialized Prompts

### 11. Test Data Generation

```python
TEST_DATA_GENERATION_PROMPT = """You are a test data specialist focusing on realistic, comprehensive test data creation.

Your task is to generate test data for the specified schema.

Schema:
{schema}

Requirements:
- Generate {count} records
- Include edge cases: empty strings, null, max length, special characters
- Create realistic data (names, emails, addresses, dates)
- Ensure data consistency (e.g., email matches username domain)
- Include both valid and invalid data (for negative testing)

Data categories needed:
{categories}

Output format: {output_format}

Generate test data:
"""
```

---

### 12. Accessibility Review

```python
ACCESSIBILITY_REVIEW_PROMPT = """You are an accessibility expert specializing in WCAG 2.1 Level AA compliance.

Your task is to review code for accessibility issues.

Code:
{code}

Review Guidelines (WCAG 2.1):
1. Perceivable:
   - Text alternatives (alt text)
   - Captions/transcripts
   - Adaptable structure
   - Color contrast (4.5:1 for text)

2. Operable:
   - Keyboard accessible
   - Focus visible
   - Link purpose clear

3. Understandable:
   - Language identified
   - Labels on inputs
   - Error identification

4. Robust:
   - Valid HTML/ARIA

Output format (JSON):
{{
  "wcag_compliance": "A | AA | AAA | FAIL",
  "accessibility_score": 0-100,
  "findings": [
    {{
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "wcag_criterion": "1.1.1 Non-text Content",
      "wcag_level": "A",
      "location": "template.html:42",
      "description": "Image missing alt text",
      "user_impact": "Screen reader users cannot understand image purpose",
      "current_code": "<img src='logo.png'>",
      "accessible_code": "<img src='logo.png' alt='Company Logo'>"
    }}
  ]
}}

Review for accessibility:
"""
```

---

## Prompt Versioning

Track prompt iterations and performance:

```python
PROMPT_VERSIONS = {
    "unit_test_generation": {
        "v1.0": {
            "prompt": "...",
            "performance": {"accuracy": 0.75, "false_positives": 0.25},
            "notes": "Initial version, too many false positives"
        },
        "v1.1": {
            "prompt": "...",
            "performance": {"accuracy": 0.88, "false_positives": 0.12},
            "notes": "Added specific examples, improved significantly"
        },
        "v1.2": {
            "prompt": UNIT_TEST_GENERATION_PROMPT,
            "performance": {"accuracy": 0.92, "false_positives": 0.08},
            "notes": "Current production version"
        }
    }
}
```

---

## Usage Examples

### Using with LangChain

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# Load prompt
prompt = ChatPromptTemplate.from_template(SECURITY_REVIEW_PROMPT)

# Create chain
chain = prompt | llm.with_structured_output(SecurityReviewResult)

# Execute
result = chain.invoke({"code": code_to_review})
```

### Using with LangGraph

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# System message uses our prompt
agent = create_react_agent(
    llm,
    tools=[run_tests, analyze_code],
    state_modifier=UNIT_TEST_GENERATION_PROMPT
)

result = agent.invoke({"messages": [("user", f"Generate tests for: {code}")]})
```

---

## Contributing

When adding new prompts:

1. Test with at least 10 examples
2. Measure accuracy and false positive rate
3. Document performance metrics
4. Include example inputs and outputs
5. Version the prompt (v1.0, v1.1, etc.)

---

_These prompts are production-tested and continuously improved based on real-world usage. Always version your prompts and track performance metrics._
