# Code Coverage

## Overview

Code coverage is a metric that measures the percentage of code executed by automated tests. It helps identify untested code and assess test suite completeness.

## Purpose

- **Identify gaps**: Find untested code paths
- **Quality indicator**: Measure test suite thoroughness  
- **Risk assessment**: Highlight high-risk untested areas
- **Refactoring confidence**: Ensure changes are covered by tests
- **Trend tracking**: Monitor test coverage over time

## Coverage Types

### 1. Line Coverage

Percentage of executed lines.

```javascript
function calculateDiscount(price, customerType) {
  if (customerType === 'premium') {  // Line 2: Covered
    return price * 0.8;               // Line 3: Covered
  }
  return price;                       // Line 5: Not covered
}

// Test
test('premium discount', () => {
  expect(calculateDiscount(100, 'premium')).toBe(80);
});

// Line Coverage: 75% (3/4 lines)
```

### 2. Branch Coverage

Percentage of decision branches executed.

```javascript
function validate(age, hasLicense) {
  if (age >= 18 && hasLicense) {  // 4 branches: TT, TF, FT, FF
    return 'valid';
  }
  return 'invalid';
}

// Tests
test('valid: adult with license', () => {
  expect(validate(20, true)).toBe('valid');  // Branch: TT
});

test('invalid: adult without license', () => {
  expect(validate(20, false)).toBe('invalid');  // Branch: TF
});

// Branch Coverage: 50% (2/4 branches tested)
```

### 3. Function Coverage

Percentage of functions called.

### 4. Statement Coverage

Percentage of statements executed.

## Coverage Tools

### Jest with Istanbul

```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/index.{js,ts}'
  ]
};
```

### Running Coverage

```bash
# Generate coverage report
npm test -- --coverage

# Coverage summary output:
# ------------------|---------|----------|---------|---------|
# File              | % Stmts | % Branch | % Funcs | % Lines |
# ------------------|---------|----------|---------|---------|
# All files         |   85.23 |    78.45 |   90.12 |   85.67 |
#  utils/           |   92.11 |    85.33 |   95.00 |   92.50 |
#   validation.js   |   88.24 |    75.00 |   100.0 |   88.89 |
#   formatting.js   |   95.45 |    90.00 |   90.00 |   96.00 |
# ------------------|---------|----------|---------|---------|
```

## Coverage Best Practices

### 1. Set Realistic Thresholds

```javascript
// Don't aim for 100% coverage blindly
coverageThreshold: {
  global: {
    statements: 80,  // Realistic: 70-85%
    branches: 75,     // Hardest to achieve
    functions: 85,    // Easier to achieve
    lines: 80
  },
  './src/critical/': {
    statements: 95,   // Critical code: higher threshold
    branches: 90
  }
}
```

### 2. Focus on Critical Paths

```javascript
// Prioritize testing critical business logic
// Over testing trivial code

// ✅ HIGH PRIORITY: Business logic
function calculateTax(amount, state) {
  // Complex tax calculation
  // Needs thorough testing
}

// ⚠️ LOW PRIORITY: Simple getter
function getUsername() {
  return this.username;
}
```

### 3. Don't Test Implementation

```javascript
// ❌ BAD: Testing private implementation
test('calls internal helper', () => {
  const spy = jest.spyOn(obj, '_privateHelper');
  obj.publicMethod();
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Test public behavior
test('publicMethod returns correct result', () => {
  expect(obj.publicMethod()).toBe(expectedResult);
});
```

## Coverage Limitations

### 100% Coverage != Bug-Free

```javascript
// 100% coverage but still has bugs
function divide(a, b) {
  return a / b;  // Line covered
}

test('divide numbers', () => {
  expect(divide(10, 2)).toBe(5);  // ✅ Passes, 100% coverage
});

// BUG: Division by zero not tested!
// divide(10, 0) returns Infinity
```

### Coverage Doesn't Measure Test Quality

```javascript
// Poor test with 100% coverage
function complexBusinessLogic(data) {
  // 50 lines of complex code
  return result;
}

test('runs without error', () => {
  complexBusinessLogic(mockData);  // No assertions!
  expect(true).toBe(true);         // Meaningless assertion
});

// 100% coverage but tests nothing meaningful
```

## Coverage in CI/CD

```yaml
# GitHub Actions - Enforce coverage
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test -- --coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% below 80% threshold"
            exit 1
          fi

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Coverage Metrics

```javascript
const coverageMetrics = {
  // Current coverage
  statementCoverage: 85,  // %
  branchCoverage: 78,     // %
  functionCoverage: 90,   // %
  lineCoverage: 85,       // %

  // Coverage trends
  coverageTrend: '+2.3%',  // Increasing
  uncoveredLines: 324,
  uncoveredFunctions: 28,

  // Quality metrics
  testToCodeRatio: 1.2,  // 1.2 test lines per code line
  testsPerFunction: 2.5   // Average tests per function
};
```

## Related Resources

- [Unit Testing](../05-test-levels/unit-testing.md)
- [Testing Strategy](../04-testing-strategy/README.md)
- [Continuous Integration](../08-cicd-pipeline/continuous-integration.md)

## References

- Martin Fowler - Test Coverage
- Google Testing Blog
- ISTQB - Code Coverage Techniques

---

*Part of: [Metrics & Monitoring](README.md)*
