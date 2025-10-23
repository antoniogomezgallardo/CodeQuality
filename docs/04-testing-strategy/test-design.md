# Test Design

## Overview

Test design is the process of creating test cases, test scripts, and test data based on requirements and specifications. It transforms test objectives into concrete test conditions and test cases that effectively validate software quality.

## Purpose

- **Systematic coverage**: Ensure all requirements are tested
- **Early defect detection**: Find issues before coding begins
- **Test efficiency**: Maximize defect detection with minimum tests
- **Traceability**: Link tests to requirements
- **Repeatability**: Enable consistent test execution

## Test Design Techniques

### 1. Equivalence Partitioning

Divide input domain into classes where system behaves similarly.

```javascript
// Example: Age validation (0-17: minor, 18-64: adult, 65+: senior)

describe('Age Validation', () => {
  // Invalid partition: < 0
  it('should reject negative age', () => {
    expect(validateAge(-1)).toEqual({
      valid: false,
      error: 'Age must be positive',
    });
  });

  // Valid partition: 0-17 (minor)
  it('should accept minor age', () => {
    expect(validateAge(10)).toEqual({
      valid: true,
      category: 'minor',
    });
  });

  // Valid partition: 18-64 (adult)
  it('should accept adult age', () => {
    expect(validateAge(30)).toEqual({
      valid: true,
      category: 'adult',
    });
  });

  // Valid partition: 65+ (senior)
  it('should accept senior age', () => {
    expect(validateAge(70)).toEqual({
      valid: true,
      category: 'senior',
    });
  });

  // Invalid partition: > 120
  it('should reject unrealistic age', () => {
    expect(validateAge(150)).toEqual({
      valid: false,
      error: 'Age too high',
    });
  });
});
```

### 2. Boundary Value Analysis

Test at the edges of equivalence partitions.

```javascript
// Test boundaries: 0, 17, 18, 64, 65, 120

describe('Age Boundaries', () => {
  // Lower boundary of valid range
  it('should accept age 0', () => {
    expect(validateAge(0)).toEqual({ valid: true, category: 'minor' });
  });

  // Upper boundary of minor
  it('should accept age 17', () => {
    expect(validateAge(17)).toEqual({ valid: true, category: 'minor' });
  });

  // Lower boundary of adult (boundary crossing)
  it('should accept age 18', () => {
    expect(validateAge(18)).toEqual({ valid: true, category: 'adult' });
  });

  // Upper boundary of adult
  it('should accept age 64', () => {
    expect(validateAge(64)).toEqual({ valid: true, category: 'adult' });
  });

  // Lower boundary of senior (boundary crossing)
  it('should accept age 65', () => {
    expect(validateAge(65)).toEqual({ valid: true, category: 'senior' });
  });

  // Upper boundary of valid range
  it('should accept age 120', () => {
    expect(validateAge(120)).toEqual({ valid: true, category: 'senior' });
  });

  // Just beyond boundaries
  it('should reject age -1', () => {
    expect(validateAge(-1)).toEqual({ valid: false });
  });

  it('should reject age 121', () => {
    expect(validateAge(121)).toEqual({ valid: false });
  });
});
```

### 3. Decision Table Testing

Test combinations of conditions and actions.

```javascript
// Discount calculation rules:
// Customer Type | Order Amount | Loyalty Years | Discount
// --------------------------------------------------------
// Premium       | > $100       | > 2           | 20%
// Premium       | > $100       | ≤ 2           | 15%
// Premium       | ≤ $100       | Any           | 10%
// Regular       | > $100       | > 5           | 10%
// Regular       | > $100       | ≤ 5           | 5%
// Regular       | ≤ $100       | Any           | 0%

describe('Discount Calculation', () => {
  const testCases = [
    {
      name: 'Premium, high order, loyal',
      customer: 'premium',
      amount: 150,
      years: 3,
      expected: 0.2,
    },
    {
      name: 'Premium, high order, new',
      customer: 'premium',
      amount: 150,
      years: 1,
      expected: 0.15,
    },
    {
      name: 'Premium, low order',
      customer: 'premium',
      amount: 50,
      years: 5,
      expected: 0.1,
    },
    {
      name: 'Regular, high order, very loyal',
      customer: 'regular',
      amount: 150,
      years: 6,
      expected: 0.1,
    },
    {
      name: 'Regular, high order, new',
      customer: 'regular',
      amount: 150,
      years: 2,
      expected: 0.05,
    },
    {
      name: 'Regular, low order',
      customer: 'regular',
      amount: 50,
      years: 10,
      expected: 0,
    },
  ];

  testCases.forEach(({ name, customer, amount, years, expected }) => {
    it(name, () => {
      const discount = calculateDiscount(customer, amount, years);
      expect(discount).toBe(expected);
    });
  });
});
```

### 4. State Transition Testing

Test sequences of state changes.

```javascript
// Order states: created → paid → shipped → delivered → completed

describe('Order State Transitions', () => {
  let order;

  beforeEach(() => {
    order = new Order();
  });

  it('should transition from created to paid', () => {
    expect(order.state).toBe('created');
    order.pay();
    expect(order.state).toBe('paid');
  });

  it('should transition from paid to shipped', () => {
    order.pay();
    order.ship();
    expect(order.state).toBe('shipped');
  });

  it('should not ship before payment', () => {
    expect(() => order.ship()).toThrow('Cannot ship unpaid order');
    expect(order.state).toBe('created');
  });

  it('should transition through full lifecycle', () => {
    order.pay();
    order.ship();
    order.deliver();
    order.complete();
    expect(order.state).toBe('completed');
  });

  it('should not allow payment of completed order', () => {
    order.pay();
    order.ship();
    order.deliver();
    order.complete();
    expect(() => order.pay()).toThrow('Order already completed');
  });
});
```

### 5. Use Case Testing

Test complete user scenarios.

```javascript
// Use Case: User purchases product

describe('Purchase Product Use Case', () => {
  it('should complete purchase successfully', async () => {
    // 1. User browses products
    const products = await getProducts();
    expect(products).toHaveLength(greaterThan(0));

    // 2. User selects product
    const product = products[0];
    expect(product.available).toBe(true);

    // 3. User adds to cart
    await addToCart(product.id);
    const cart = await getCart();
    expect(cart.items).toContainEqual(expect.objectContaining({ productId: product.id }));

    // 4. User proceeds to checkout
    const checkout = await initiateCheckout();
    expect(checkout.total).toBe(product.price);

    // 5. User enters payment details
    const payment = await submitPayment({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvv: '123',
    });
    expect(payment.status).toBe('success');

    // 6. Order is created
    const order = await getOrder(payment.orderId);
    expect(order.status).toBe('confirmed');
    expect(order.items).toContainEqual(expect.objectContaining({ productId: product.id }));

    // 7. User receives confirmation
    const confirmation = await getOrderConfirmation(order.id);
    expect(confirmation.sent).toBe(true);
  });

  it('should handle payment failure', async () => {
    await addToCart(productId);
    await initiateCheckout();

    const payment = await submitPayment({
      cardNumber: '4000000000000002', // Declined card
    });

    expect(payment.status).toBe('failed');
    expect(payment.error).toBeDefined();

    const cart = await getCart();
    expect(cart.items).not.toHaveLength(0); // Items still in cart
  });
});
```

### 6. Error Guessing

Test based on experience with common errors.

```javascript
// Common error scenarios

describe('Error Guessing', () => {
  describe('Null/Undefined Handling', () => {
    it('should handle null input', () => {
      expect(() => processUser(null)).not.toThrow();
    });

    it('should handle undefined input', () => {
      expect(() => processUser(undefined)).not.toThrow();
    });
  });

  describe('Boundary Issues', () => {
    it('should handle empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should handle very long string', () => {
      const longString = 'a'.repeat(10000);
      expect(() => processText(longString)).not.toThrow();
    });

    it('should handle maximum integer', () => {
      expect(() => processNumber(Number.MAX_SAFE_INTEGER)).not.toThrow();
    });
  });

  describe('Special Characters', () => {
    const specialChars = ['<', '>', '&', '"', "'", '/', '\\'];

    specialChars.forEach(char => {
      it(`should handle special character: ${char}`, () => {
        expect(() => sanitizeInput(char)).not.toThrow();
      });
    });
  });

  describe('Timing Issues', () => {
    it('should handle rapid sequential calls', async () => {
      const promises = Array(100)
        .fill()
        .map(() => apiCall());
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle timeout', async () => {
      await expect(fetchWithTimeout('https://example.com', { timeout: 1 })).rejects.toThrow(
        'Timeout'
      );
    });
  });
});
```

## Test Case Design

### Test Case Template

```markdown
**Test Case ID:** TC_LOGIN_001
**Test Case Name:** Successful login with valid credentials
**Priority:** High
**Type:** Functional

**Preconditions:**

- User account exists
- User is not already logged in

**Test Steps:**

1. Navigate to login page
2. Enter valid email: test@example.com
3. Enter valid password: SecurePass123
4. Click "Login" button

**Expected Results:**

- User is redirected to dashboard
- Welcome message displays user name
- Session cookie is set
- Login timestamp is recorded

**Postconditions:**

- User session is active
- User can access protected pages

**Test Data:**

- Email: test@example.com
- Password: SecurePass123

**Environment:** Staging
**Browser:** Chrome 120+
**Created by:** QA Team
**Created date:** 2024-01-15
```

### Gherkin BDD Format

```gherkin
Feature: User Login
  As a registered user
  I want to log in to my account
  So that I can access my personalized content

  Background:
    Given the user "john@example.com" exists with password "SecurePass123"
    And the user is not logged in

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "john@example.com"
    And I enter password "SecurePass123"
    And I click the "Login" button
    Then I should be redirected to the dashboard
    And I should see "Welcome, John"
    And my session should be active

  Scenario: Failed login with invalid password
    Given I am on the login page
    When I enter email "john@example.com"
    And I enter password "WrongPassword"
    And I click the "Login" button
    Then I should remain on the login page
    And I should see error "Invalid credentials"
    And my session should not be active

  Scenario Outline: Login validation
    Given I am on the login page
    When I enter email "<email>"
    And I enter password "<password>"
    And I click the "Login" button
    Then I should see "<result>"

    Examples:
      | email              | password      | result                    |
      |                    | SecurePass123 | Email is required         |
      | john@example.com   |               | Password is required      |
      | invalid-email      | SecurePass123 | Invalid email format      |
      | john@example.com   | short         | Password too short        |
```

## Test Coverage

### Requirements Traceability Matrix

```markdown
| Requirement ID | Requirement Description | Test Case IDs                            | Coverage |
| -------------- | ----------------------- | ---------------------------------------- | -------- |
| REQ-001        | User can log in         | TC_LOGIN_001, TC_LOGIN_002, TC_LOGIN_003 | 100%     |
| REQ-002        | Password reset          | TC_RESET_001, TC_RESET_002               | 100%     |
| REQ-003        | Profile update          | TC_PROFILE_001                           | 50%      |
| REQ-004        | Payment processing      | TC_PAY_001, TC_PAY_002, TC_PAY_003       | 100%     |
```

### Code Coverage Metrics

```javascript
const coverageMetrics = {
  statements: 85, // % of statements executed
  branches: 78, // % of branches taken
  functions: 92, // % of functions called
  lines: 85, // % of lines executed

  uncovered: {
    statements: 450,
    branches: 89,
    functions: 12,
    lines: 423,
  },
};
```

## Test Data Management

### Test Data Generation

```javascript
// Faker.js for realistic test data
import { faker } from '@faker-js/faker';

function generateUser() {
  return {
    id: faker.string.uuid(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    password: faker.internet.password({ length: 12 }),
    birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
    createdAt: faker.date.past(),
  };
}

// Generate multiple users
const testUsers = faker.helpers.multiple(generateUser, { count: 100 });
```

### Test Data Builder Pattern

```javascript
class UserBuilder {
  constructor() {
    this.user = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
    };
  }

  withEmail(email) {
    this.user.email = email;
    return this;
  }

  withRole(role) {
    this.user.role = role;
    return this;
  }

  asAdmin() {
    this.user.role = 'admin';
    return this;
  }

  build() {
    return { ...this.user };
  }
}

// Usage
const regularUser = new UserBuilder().build();
const adminUser = new UserBuilder().asAdmin().build();
const customUser = new UserBuilder().withEmail('custom@example.com').withRole('moderator').build();
```

## Test Prioritization

### Risk-Based Testing

```javascript
const testPriority = {
  critical: ['User authentication', 'Payment processing', 'Data security'],
  high: ['Order creation', 'Product search', 'Checkout flow'],
  medium: ['Profile editing', 'Wishlist management', 'Email notifications'],
  low: ['UI animations', 'Color themes', 'Footer links'],
};

// Prioritization formula
function calculateTestPriority(test) {
  const priority =
    test.businessImpact * 0.4 +
    test.failureProbability * 0.3 +
    test.technicalComplexity * 0.2 +
    test.regulatoryRequirement * 0.1;

  return priority;
}
```

## Test Automation Design

### Page Object Model

```javascript
// LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = '#email';
    this.passwordInput = '#password';
    this.loginButton = 'button[type="submit"]';
    this.errorMessage = '.error-message';
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.page.fill(this.emailInput, email);
    await this.page.fill(this.passwordInput, password);
    await this.page.click(this.loginButton);
  }

  async getErrorMessage() {
    return await this.page.textContent(this.errorMessage);
  }
}

// Usage in test
test('login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('test@example.com', 'password123');
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Metrics

```javascript
const testMetrics = {
  // Test coverage
  requirementsCoverage: 95, // % of requirements tested
  codeCoverage: 85, // % of code tested
  branchCoverage: 78, // % of branches tested

  // Test effectiveness
  defectDetectionRate: 87, // % of defects found by tests
  falsePositiveRate: 3, // % of test failures that aren't bugs
  testExecutionRate: 92, // % of planned tests executed

  // Test efficiency
  automationRate: 75, // % of tests automated
  avgTestExecutionTime: 45, // minutes
  testsPerDefect: 12, // tests needed to find one defect

  // Test maintenance
  flakyTestRate: 4, // % of unstable tests
  avgFixTime: 30, // minutes to fix failing test
  testMaintenanceCost: 15, // % of test time spent on maintenance
};
```

## Related Resources

- [Testing Strategy](04-README.md)
- [Test Levels](../05-test-levels/README.md)
- [TDD](../07-development-practices/tdd.md)
- [BDD](../07-development-practices/bdd.md)

## References

- ISTQB - Test Design Techniques
- IEEE 829 - Test Documentation
- ISO/IEC 25010 - Quality Testing
- OWASP - Security Testing Guide

---

_Part of: [Testing Strategy](README.md)_
