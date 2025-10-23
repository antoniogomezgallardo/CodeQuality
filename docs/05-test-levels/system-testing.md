# System Testing

## Purpose

Comprehensive guide to system testing—validating the complete, integrated system against specified requirements to ensure it meets business and technical objectives.

## Overview

System testing:

- Tests the entire application
- Validates end-to-end workflows
- Verifies system behavior
- Tests non-functional requirements
- Performed in production-like environment

## What is System Testing?

### Definition

System testing validates the complete and fully integrated software system to verify that it meets specified requirements and works as expected in a production-like environment.

### Characteristics

```
System Tests:

Scope
├── Complete application
├── All integrated components
├── Real environment
└── End-to-end workflows

Focus
├── Business requirements
├── User scenarios
├── Non-functional requirements
└── System behavior

Environment
├── Production-like setup
├── Real databases
├── External services
└── Complete infrastructure
```

## Types of System Testing

### 1. Functional System Testing

**Example Test Scenario:**

```gherkin
Feature: Order Processing System

Scenario: Complete order fulfillment
  Given a customer with valid account
  And items in inventory
  When customer places order
  And payment is processed
  And order is confirmed
  Then inventory is updated
  And shipping is scheduled
  And customer receives confirmation
  And order appears in history
```

### 2. Performance Testing

```javascript
// Load Testing with k6
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/products');
  check(res, {
    'status is 200': r => r.status === 200,
    'response time < 500ms': r => r.timings.duration < 500,
  });
  sleep(1);
}
```

### 3. Security Testing

```gherkin
Scenario: Unauthorized access prevention
  Given an unauthenticated user
  When user tries to access protected endpoint
  Then system returns 401 Unauthorized
  And no sensitive data is exposed
```

### 4. Compatibility Testing

```
Test Across:
├── Browsers (Chrome, Firefox, Safari, Edge)
├── Devices (Desktop, Tablet, Mobile)
└── Operating Systems (Windows, macOS, iOS, Android)
```

## Best Practices

- Use production-like environment
- Test complete business workflows
- Validate non-functional requirements
- Use realistic test data
- Document all test results

## Checklist

**Preparation:**

- [ ] Test environment configured
- [ ] Test data prepared
- [ ] Test cases documented

**Execution:**

- [ ] Functional testing complete
- [ ] Performance tested
- [ ] Security validated
- [ ] Compatibility verified

## References

- ISO/IEC 25010 - System Quality Models
- IEEE 829 - Test Documentation
- ISTQB - System Test Level

## Related Topics

- [Integration Testing](integration-testing.md)
- [E2E Testing](e2e-testing.md)
- [Performance Testing](../06-quality-attributes/performance-testing.md)

---

_Part of: [Test Levels](README.md)_
