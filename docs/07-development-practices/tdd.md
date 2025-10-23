# Test-Driven Development (TDD)

## Overview

Test-Driven Development (TDD) is a software development practice where tests are written before the production code. The approach follows a simple cycle: write a failing test, write minimal code to pass the test, then refactor.

## Purpose

- **Design driver**: Tests guide API and interface design
- **Quality assurance**: Catch bugs before they exist
- **Documentation**: Tests serve as executable specifications
- **Confidence**: Enable fearless refactoring
- **Maintainability**: Produce cleaner, more modular code

## The TDD Cycle: Red-Green-Refactor

### Red: Write a Failing Test

```javascript
// Step 1: Write a test for functionality that doesn't exist yet
describe('Calculator', () => {
  it('should add two numbers correctly', () => {
    const calculator = new Calculator();
    const result = calculator.add(2, 3);
    expect(result).toBe(5);
  });
});

// Running this test will FAIL (RED) because Calculator doesn't exist
```

### Green: Write Minimal Code to Pass

```javascript
// Step 2: Write just enough code to make the test pass
class Calculator {
  add(a, b) {
    return a + b; // Simplest implementation
  }
}

// Test now PASSES (GREEN)
```

### Refactor: Improve Code Quality

```javascript
// Step 3: Refactor while keeping tests green
class Calculator {
  add(a, b) {
    // Validate inputs
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Arguments must be numbers');
    }
    return a + b;
  }
}

// Tests still pass after refactoring
```

## TDD Workflow

```markdown
**Complete TDD Cycle:**

1. 🔴 RED: Write a failing test
   - Write test for next small feature
   - Run test and see it fail
   - Verify failure message is correct

2. 🟢 GREEN: Make it pass
   - Write simplest code to pass test
   - Don't worry about perfection
   - Just make it work

3. 🔵 REFACTOR: Clean up
   - Remove duplication
   - Improve naming
   - Optimize structure
   - Ensure tests still pass

4. ↩️ REPEAT: Next feature
   - Move to next small requirement
   - Start cycle again
```

## TDD Example: Complete Feature

### Feature: User Registration Validator

**Requirement:** Validate user registration data

```javascript
// ============================================
// TEST FILE: userValidator.test.js
// ============================================

describe('UserValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new UserValidator();
  });

  // RED: Test 1
  describe('email validation', () => {
    it('should accept valid email addresses', () => {
      const result = validator.validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
    });

    // RED: Test 2
    it('should reject emails without @', () => {
      const result = validator.validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    // RED: Test 3
    it('should reject empty emails', () => {
      const result = validator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Email is required');
    });
  });

  // RED: Test 4
  describe('password validation', () => {
    it('should accept passwords with 8+ characters', () => {
      const result = validator.validatePassword('SecurePass123');
      expect(result.isValid).toBe(true);
    });

    // RED: Test 5
    it('should reject passwords shorter than 8 characters', () => {
      const result = validator.validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters');
    });

    // RED: Test 6
    it('should require at least one number', () => {
      const result = validator.validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must contain at least one number');
    });
  });

  // RED: Test 7
  describe('username validation', () => {
    it('should accept alphanumeric usernames 3-20 chars', () => {
      const result = validator.validateUsername('john_doe123');
      expect(result.isValid).toBe(true);
    });

    // RED: Test 8
    it('should reject usernames shorter than 3 characters', () => {
      const result = validator.validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Username must be 3-20 characters');
    });
  });
});

// ============================================
// IMPLEMENTATION FILE: userValidator.js
// ============================================

class UserValidator {
  validateEmail(email) {
    // GREEN: Make tests pass
    if (!email || email.trim() === '') {
      return { isValid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    return { isValid: true };
  }

  validatePassword(password) {
    // GREEN: Make tests pass
    if (password.length < 8) {
      return {
        isValid: false,
        error: 'Password must be at least 8 characters',
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number',
      };
    }

    return { isValid: true };
  }

  validateUsername(username) {
    // GREEN: Make tests pass
    if (username.length < 3 || username.length > 20) {
      return {
        isValid: false,
        error: 'Username must be 3-20 characters',
      };
    }

    return { isValid: true };
  }

  // REFACTOR: Add comprehensive validation method
  validate(userData) {
    const errors = [];

    const emailResult = this.validateEmail(userData.email);
    if (!emailResult.isValid) errors.push(emailResult.error);

    const passwordResult = this.validatePassword(userData.password);
    if (!passwordResult.isValid) errors.push(passwordResult.error);

    const usernameResult = this.validateUsername(userData.username);
    if (!usernameResult.isValid) errors.push(usernameResult.error);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = UserValidator;
```

## TDD Best Practices

### 1. Write Small, Focused Tests

```javascript
// ✅ GOOD: One assertion per test
it('should return sum of two positive numbers', () => {
  expect(add(2, 3)).toBe(5);
});

it('should return sum of two negative numbers', () => {
  expect(add(-2, -3)).toBe(-5);
});

// ❌ BAD: Multiple unrelated assertions
it('should perform all math operations', () => {
  expect(add(2, 3)).toBe(5);
  expect(subtract(5, 3)).toBe(2);
  expect(multiply(2, 3)).toBe(6);
  expect(divide(6, 3)).toBe(2);
});
```

### 2. Test Behavior, Not Implementation

```javascript
// ✅ GOOD: Test the outcome
it('should retrieve user by ID', async () => {
  const user = await userService.getUser(123);
  expect(user.id).toBe(123);
  expect(user.name).toBeDefined();
});

// ❌ BAD: Test internal implementation
it('should call database.query with correct SQL', async () => {
  const spy = jest.spyOn(database, 'query');
  await userService.getUser(123);
  expect(spy).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [123]);
});
```

### 3. Follow AAA Pattern

```javascript
// Arrange-Act-Assert

it('should calculate total price with tax', () => {
  // Arrange: Set up test data and dependencies
  const cart = new ShoppingCart();
  cart.addItem({ price: 100, quantity: 2 });
  const taxRate = 0.1;

  // Act: Perform the action being tested
  const total = cart.calculateTotal(taxRate);

  // Assert: Verify the outcome
  expect(total).toBe(220); // 200 + 10% tax
});
```

### 4. Keep Tests Independent

```javascript
// ✅ GOOD: Each test is independent
describe('User Service', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
  });

  it('should create user', () => {
    const user = userService.create({ name: 'John' });
    expect(user.name).toBe('John');
  });

  it('should find user by id', () => {
    const created = userService.create({ name: 'John' });
    const found = userService.find(created.id);
    expect(found.name).toBe('John');
  });
});

// ❌ BAD: Tests depend on each other
describe('User Service', () => {
  let userService = new UserService();
  let userId;

  it('should create user', () => {
    const user = userService.create({ name: 'John' });
    userId = user.id; // Sharing state
    expect(user.name).toBe('John');
  });

  it('should find user by id', () => {
    const found = userService.find(userId); // Depends on previous test
    expect(found.name).toBe('John');
  });
});
```

### 5. Use Descriptive Test Names

```javascript
// ✅ GOOD: Clear, descriptive names
describe('Password Validator', () => {
  it('should reject passwords shorter than 8 characters', () => {});
  it('should reject passwords without numbers', () => {});
  it('should reject passwords without special characters', () => {});
  it('should accept passwords meeting all criteria', () => {});
});

// ❌ BAD: Vague names
describe('Password Validator', () => {
  it('test1', () => {});
  it('should work', () => {});
  it('should validate', () => {});
});
```

## Advanced TDD Techniques

### 1. Triangulation

```javascript
// Start with specific case
it('should return 0 for empty array', () => {
  expect(sum([])).toBe(0);
});

// Add another case to drive generalization
it('should return 5 for [5]', () => {
  expect(sum([5])).toBe(5);
});

// Triangulate to general solution
it('should return 15 for [5, 10]', () => {
  expect(sum([5, 10])).toBe(15);
});

// Now implement general solution
function sum(numbers) {
  return numbers.reduce((acc, num) => acc + num, 0);
}
```

### 2. Test Doubles (Mocks, Stubs, Spies)

```javascript
// Using test doubles for dependencies

class EmailService {
  async sendEmail(to, subject, body) {
    // Real implementation would call email API
  }
}

class UserRegistration {
  constructor(emailService) {
    this.emailService = emailService;
  }

  async register(userData) {
    // ... validation logic ...
    await this.emailService.sendEmail(userData.email, 'Welcome!', 'Thanks for registering');
    return { success: true };
  }
}

// Test with mock
describe('User Registration', () => {
  it('should send welcome email after registration', async () => {
    // Arrange: Create mock email service
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };
    const registration = new UserRegistration(mockEmailService);

    // Act
    await registration.register({
      email: 'user@example.com',
      name: 'John',
    });

    // Assert: Verify email was sent
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Welcome!',
      'Thanks for registering'
    );
  });
});
```

### 3. Parameterized Tests

```javascript
// Test multiple scenarios with same test logic
describe('Math operations', () => {
  const testCases = [
    { a: 2, b: 3, expected: 5 },
    { a: -1, b: 1, expected: 0 },
    { a: 0, b: 0, expected: 0 },
    { a: 100, b: -50, expected: 50 },
  ];

  testCases.forEach(({ a, b, expected }) => {
    it(`should return ${expected} for add(${a}, ${b})`, () => {
      expect(add(a, b)).toBe(expected);
    });
  });
});
```

## TDD Anti-Patterns

### 1. Testing Implementation Details

```javascript
// ❌ BAD: Brittle test tied to implementation
it('should call processPayment method', () => {
  const spy = jest.spyOn(orderService, 'processPayment');
  orderService.checkout(cart);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD: Test the behavior/outcome
it('should mark order as paid after checkout', () => {
  const order = orderService.checkout(cart);
  expect(order.status).toBe('paid');
});
```

### 2. Excessive Mocking

```javascript
// ❌ BAD: Mocking everything
it('should process order', () => {
  const mockValidator = { validate: jest.fn(() => true) };
  const mockPayment = { process: jest.fn(() => ({ success: true })) };
  const mockEmail = { send: jest.fn() };
  const mockDb = { save: jest.fn() };
  const mockLogger = { log: jest.fn() };

  // Test becomes meaningless
  const service = new OrderService(mockValidator, mockPayment, mockEmail, mockDb, mockLogger);
});

// ✅ GOOD: Mock only external dependencies
it('should process order', () => {
  const mockPayment = { process: jest.fn(() => ({ success: true })) };
  const service = new OrderService(mockPayment);

  const result = service.processOrder(validOrder);
  expect(result.success).toBe(true);
});
```

### 3. Slow Tests

```javascript
// ❌ BAD: Tests take too long
it('should cache user data', async () => {
  await sleep(5000); // Waiting unnecessarily
  const user = await userService.getUser(123);
  expect(cache.has('user_123')).toBe(true);
});

// ✅ GOOD: Fast, focused tests
it('should cache user data', async () => {
  // Use fake timers or mocks
  jest.useFakeTimers();
  const user = await userService.getUser(123);
  expect(cache.has('user_123')).toBe(true);
});
```

## TDD Metrics

```javascript
const tddMetrics = {
  // Test coverage
  codeCoverage: {
    statements: 95,
    branches: 90,
    functions: 100,
    lines: 95,
  },

  // Tests written before code (ideal: 100%)
  testFirstPercentage: 85,

  // Average test execution time (target: <5ms per test)
  avgTestTime: 3,

  // Test to code ratio (target: 1:1 to 1:2)
  testCodeRatio: 1.5,

  // Defects caught by tests vs. production (target: >90%)
  defectCatchRate: 92,
};
```

## TDD Benefits

```markdown
**Code Quality:**

- Fewer bugs (40-80% reduction)
- Better design (SOLID principles naturally emerge)
- Higher maintainability
- Self-documenting code

**Development Speed:**

- Faster debugging (tests pinpoint issues)
- Faster refactoring (tests provide safety net)
- Reduced rework (catch issues early)
- Less time in debugger

**Team Collaboration:**

- Clear requirements (tests as specification)
- Easier code reviews (tests explain intent)
- Confident refactoring (team can change code safely)
- Knowledge sharing (tests show how to use code)
```

## Related Resources

- [Unit Testing](../05-test-levels/unit-testing.md)
- [Behavior-Driven Development](bdd.md)
- [Clean Code Principles](clean-code-principles.md)
- [Refactoring](refactoring.md)
- [Testing Strategy](../04-testing-strategy/README.md)

## References

- Kent Beck - Test-Driven Development by Example
- Robert C. Martin - Clean Code
- Martin Fowler - Refactoring
- Gerard Meszaros - xUnit Test Patterns
- ISTQB - Test-Driven Development Guidelines

---

_Part of: [Development Practices](README.md)_
