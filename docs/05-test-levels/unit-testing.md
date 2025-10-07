# Unit Testing

## Purpose
Comprehensive guide to unit testing—testing individual components in isolation to ensure correctness, maintainability, and reliability at the smallest testable level.

## Overview
Unit testing is:
- Testing individual functions, methods, or classes
- The foundation of the testing pyramid
- Fast, isolated, and repeatable
- Essential for refactoring confidence
- The first line of defense against bugs

## What is Unit Testing?

### Definition
A unit test verifies that a single unit of code (function, method, class) works correctly in isolation from the rest of the system.

### Characteristics

```
Unit Tests Are:

Fast
├── Execute in milliseconds
├── No I/O operations
├── No network calls
└── No database access

Isolated
├── Test one thing at a time
├── Dependencies mocked/stubbed
├── No side effects
└── Order-independent

Repeatable
├── Same input → Same output
├── No random data
├── No time dependencies
└── Deterministic

Self-Validating
├── Pass or fail clearly
├── No manual verification
├── Clear assertions
└── Informative failures
```

### The Testing Pyramid

```
         ╱╲
        ╱  ╲         E2E/UI Tests (Few)
       ╱────╲        5% - Slow, Brittle
      ╱      ╲
     ╱ Integ  ╲      Integration Tests
    ╱  Tests  ╲      15% - Medium Speed
   ╱────────────╲
  ╱              ╲
 ╱  Unit Tests   ╲   Unit Tests
╱                ╲   80% - Fast, Stable
└──────────────────┘

Unit Tests = Foundation
Most tests should be unit tests
```

## Unit Testing Frameworks

### JavaScript/TypeScript

**Jest**
```javascript
// __tests__/calculator.test.js
describe('Calculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(calculator.add(0, 5)).toBe(5);
    });
  });
});
```

**Vitest**
```typescript
// calculator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  it('should multiply two numbers', () => {
    expect(calculator.multiply(4, 5)).toBe(20);
  });

  it('should divide two numbers', () => {
    expect(calculator.divide(10, 2)).toBe(5);
  });

  it('should throw error when dividing by zero', () => {
    expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
  });
});
```

### Python

**pytest**
```python
# test_calculator.py
import pytest
from calculator import Calculator

class TestCalculator:
    @pytest.fixture
    def calculator(self):
        return Calculator()

    def test_add_positive_numbers(self, calculator):
        result = calculator.add(2, 3)
        assert result == 5

    def test_add_negative_numbers(self, calculator):
        result = calculator.add(-2, -3)
        assert result == -5

    def test_divide_by_zero_raises_error(self, calculator):
        with pytest.raises(ValueError, match="Cannot divide by zero"):
            calculator.divide(10, 0)
```

**unittest**
```python
# test_calculator.py
import unittest
from calculator import Calculator

class TestCalculator(unittest.TestCase):
    def setUp(self):
        self.calculator = Calculator()

    def test_add(self):
        result = self.calculator.add(2, 3)
        self.assertEqual(result, 5)

    def test_subtract(self):
        result = self.calculator.subtract(5, 3)
        self.assertEqual(result, 2)

    def tearDown(self):
        self.calculator = None

if __name__ == '__main__':
    unittest.main()
```

### Java

**JUnit 5**
```java
// CalculatorTest.java
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    private Calculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new Calculator();
    }

    @Test
    @DisplayName("Should add two positive numbers correctly")
    void shouldAddPositiveNumbers() {
        int result = calculator.add(2, 3);
        assertEquals(5, result);
    }

    @Test
    void shouldThrowExceptionWhenDividingByZero() {
        assertThrows(ArithmeticException.class, () -> {
            calculator.divide(10, 0);
        });
    }

    @ParameterizedTest
    @CsvSource({
        "2, 3, 5",
        "10, 20, 30",
        "-5, 5, 0"
    })
    void shouldAddNumbersCorrectly(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }
}
```

### C#

**xUnit**
```csharp
// CalculatorTests.cs
using Xunit;

public class CalculatorTests
{
    private readonly Calculator _calculator;

    public CalculatorTests()
    {
        _calculator = new Calculator();
    }

    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsSum()
    {
        // Arrange
        int a = 2;
        int b = 3;

        // Act
        int result = _calculator.Add(a, b);

        // Assert
        Assert.Equal(5, result);
    }

    [Theory]
    [InlineData(2, 3, 5)]
    [InlineData(-2, -3, -5)]
    [InlineData(0, 5, 5)]
    public void Add_VariousInputs_ReturnsCorrectSum(int a, int b, int expected)
    {
        int result = _calculator.Add(a, b);
        Assert.Equal(expected, result);
    }
}
```

## Test Structure

### AAA Pattern (Arrange-Act-Assert)

```javascript
describe('UserService', () => {
  it('should create user with valid data', () => {
    // ARRANGE - Set up test conditions
    const userService = new UserService(mockRepository);
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    // ACT - Execute the code under test
    const result = userService.createUser(userData);

    // ASSERT - Verify the outcome
    expect(result.id).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
  });
});
```

### Given-When-Then Pattern

```javascript
describe('Shopping Cart', () => {
  it('should apply discount when total exceeds threshold', () => {
    // GIVEN a shopping cart with items totaling $150
    const cart = new ShoppingCart();
    cart.addItem({ name: 'Item 1', price: 100 });
    cart.addItem({ name: 'Item 2', price: 50 });

    // WHEN discount code is applied
    cart.applyDiscount('SAVE10');

    // THEN total should be reduced by 10%
    expect(cart.getTotal()).toBe(135); // $150 - 10%
  });
});
```

## Test Naming Conventions

### Descriptive Names

```javascript
// ❌ Bad: Vague names
it('should work')
it('test1')
it('should return true')

// ✅ Good: Descriptive names
it('should return true when user has admin role')
it('should throw error when email is invalid')
it('should calculate total including tax and shipping')
```

### Naming Patterns

**Pattern 1: should_[expected]_when_[condition]**
```javascript
it('should_return_null_when_user_not_found')
it('should_throw_error_when_password_too_short')
it('should_send_email_when_order_confirmed')
```

**Pattern 2: [method]_[scenario]_[expected]**
```javascript
it('calculateTotal_withDiscount_returnsReducedAmount')
it('validateEmail_withInvalidFormat_throwsError')
it('findUser_withValidId_returnsUser')
```

**Pattern 3: Given_[precondition]_When_[action]_Then_[outcome]**
```javascript
it('Given_emptyCart_When_addItem_Then_cartHasOneItem')
it('Given_existingUser_When_updateEmail_Then_emailChanged')
```

## Mocking and Stubbing

### Test Doubles

```
Test Double Types:

Dummy
├── Passed but never used
└── Fills parameter lists

Stub
├── Provides predetermined responses
└── State verification

Spy
├── Records interactions
└── Behavior verification

Mock
├── Pre-programmed with expectations
└── Verifies calls made

Fake
├── Working implementation
└── Simplified for testing
```

### Mocking Examples

**Jest Mocks**
```javascript
// userService.test.js
import { UserService } from './userService';
import { UserRepository } from './userRepository';
import { EmailService } from './emailService';

jest.mock('./userRepository');
jest.mock('./emailService');

describe('UserService', () => {
  let userService;
  let mockRepository;
  let mockEmailService;

  beforeEach(() => {
    mockRepository = new UserRepository();
    mockEmailService = new EmailService();
    userService = new UserService(mockRepository, mockEmailService);
  });

  it('should create user and send welcome email', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };
    const savedUser = { id: 1, ...userData };

    mockRepository.save.mockResolvedValue(savedUser);
    mockEmailService.sendWelcome.mockResolvedValue(true);

    // Act
    const result = await userService.createUser(userData);

    // Assert
    expect(mockRepository.save).toHaveBeenCalledWith(userData);
    expect(mockEmailService.sendWelcome).toHaveBeenCalledWith(savedUser);
    expect(result).toEqual(savedUser);
  });

  it('should not send email if save fails', async () => {
    // Arrange
    mockRepository.save.mockRejectedValue(new Error('DB Error'));

    // Act & Assert
    await expect(userService.createUser({}))
      .rejects.toThrow('DB Error');
    expect(mockEmailService.sendWelcome).not.toHaveBeenCalled();
  });
});
```

**Manual Mocks**
```javascript
// Manual mock implementation
class MockUserRepository {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  async save(user) {
    const id = this.nextId++;
    const savedUser = { id, ...user };
    this.users.set(id, savedUser);
    return savedUser;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findAll() {
    return Array.from(this.users.values());
  }

  clear() {
    this.users.clear();
    this.nextId = 1;
  }
}

// Usage in tests
describe('UserService', () => {
  let mockRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
  });

  afterEach(() => {
    mockRepository.clear();
  });

  it('should save and retrieve user', async () => {
    const user = { name: 'John' };
    const saved = await mockRepository.save(user);
    const retrieved = await mockRepository.findById(saved.id);

    expect(retrieved).toEqual(saved);
  });
});
```

### Dependency Injection for Testability

```typescript
// ❌ Hard to test - tight coupling
class OrderService {
  private repository = new OrderRepository();
  private emailService = new EmailService();

  async createOrder(data: OrderData) {
    const order = await this.repository.save(data);
    await this.emailService.send(order);
    return order;
  }
}

// ✅ Easy to test - dependency injection
class OrderService {
  constructor(
    private repository: OrderRepository,
    private emailService: EmailService
  ) {}

  async createOrder(data: OrderData) {
    const order = await this.repository.save(data);
    await this.emailService.send(order);
    return order;
  }
}

// Test with mocks
const mockRepo = mock<OrderRepository>();
const mockEmail = mock<EmailService>();
const service = new OrderService(mockRepo, mockEmail);
```

## Test Coverage

### Coverage Metrics

```
Coverage Types:

Line Coverage
├── % of lines executed
└── Basic metric

Branch Coverage
├── % of decision branches taken
└── Better than line coverage

Function Coverage
├── % of functions called
└── Ensures all functions tested

Statement Coverage
├── % of statements executed
└── Similar to line coverage
```

### Coverage Goals

```
Coverage Targets:

Critical Code: 100%
├── Payment processing
├── Security functions
├── Data validation
└── Core business logic

Business Logic: 80-90%
├── Services
├── Controllers
├── Utilities
└── Helpers

UI Components: 60-80%
├── React/Vue components
├── Templates
└── Presentational logic

Infrastructure: 50-70%
├── Configuration
├── Setup/initialization
└── Glue code
```

### Measuring Coverage

```bash
# Jest
npm test -- --coverage

# Coverage report
----------------|---------|----------|---------|---------|
File            | % Stmts | % Branch | % Funcs | % Lines |
----------------|---------|----------|---------|---------|
calculator.js   |     100 |      100 |     100 |     100 |
userService.js  |    87.5 |     75.0 |     100 |    87.5 |
----------------|---------|----------|---------|---------|
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

```
1. RED - Write failing test
   ↓
2. GREEN - Make test pass (minimal code)
   ↓
3. REFACTOR - Improve code quality
   ↓
Repeat
```

### TDD Example

```javascript
// Step 1: RED - Write failing test
describe('StringCalculator', () => {
  it('should return 0 for empty string', () => {
    const calc = new StringCalculator();
    expect(calc.add('')).toBe(0);
  });
});

// Run test → FAILS (StringCalculator doesn't exist)

// Step 2: GREEN - Minimal code to pass
class StringCalculator {
  add(numbers) {
    return 0;
  }
}

// Run test → PASSES

// Step 3: RED - Add another test
it('should return number for single number', () => {
  const calc = new StringCalculator();
  expect(calc.add('5')).toBe(5);
});

// Run test → FAILS

// Step 4: GREEN - Make it pass
class StringCalculator {
  add(numbers) {
    if (numbers === '') return 0;
    return parseInt(numbers);
  }
}

// Run test → PASSES

// Step 5: RED - Add test for two numbers
it('should return sum for two numbers', () => {
  const calc = new StringCalculator();
  expect(calc.add('1,2')).toBe(3);
});

// Step 6: GREEN - Implement
class StringCalculator {
  add(numbers) {
    if (numbers === '') return 0;
    const nums = numbers.split(',').map(n => parseInt(n));
    return nums.reduce((sum, n) => sum + n, 0);
  }
}

// Step 7: REFACTOR - Clean up
class StringCalculator {
  add(numbers) {
    if (!numbers) return 0;

    return numbers
      .split(',')
      .map(Number)
      .reduce((sum, num) => sum + num, 0);
  }
}
```

### TDD Benefits

```
TDD Advantages:

Design
├── Forces thinking about API first
├── Encourages loose coupling
├── Promotes single responsibility
└── Better interfaces

Quality
├── High test coverage by default
├── Regression suite grows naturally
├── Refactoring confidence
└── Catches bugs early

Documentation
├── Tests show how to use code
├── Examples for all scenarios
├── Living documentation
└── Updated with code
```

## Testing Best Practices

### FIRST Principles

```
F - Fast
├── Run in milliseconds
├── No I/O operations
└── Quick feedback

I - Isolated
├── Independent tests
├── No shared state
└── Any order execution

R - Repeatable
├── Same results every time
├── No randomness
└── Deterministic

S - Self-Validating
├── Pass or fail clearly
├── No manual checks
└── Automated verification

T - Timely
├── Written with code
├── Not after the fact
└── TDD approach
```

### One Assert Per Test

```javascript
// ❌ Multiple asserts (harder to debug)
it('should create valid user', () => {
  const user = createUser(data);
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBe(30);
  expect(user.role).toBe('user');
});

// ✅ Single logical assertion
describe('createUser', () => {
  it('should set name correctly', () => {
    const user = createUser(data);
    expect(user.name).toBe('John');
  });

  it('should set email correctly', () => {
    const user = createUser(data);
    expect(user.email).toBe('john@example.com');
  });

  it('should set default role', () => {
    const user = createUser(data);
    expect(user.role).toBe('user');
  });
});

// ✅ Or test complete object
it('should create user with correct properties', () => {
  const user = createUser(data);
  expect(user).toEqual({
    name: 'John',
    email: 'john@example.com',
    age: 30,
    role: 'user'
  });
});
```

### Test Independence

```javascript
// ❌ Tests depend on each other
describe('UserService', () => {
  let userId;

  it('should create user', () => {
    userId = userService.create({ name: 'John' });
    expect(userId).toBeDefined();
  });

  it('should find user by id', () => {
    // Depends on previous test!
    const user = userService.findById(userId);
    expect(user.name).toBe('John');
  });
});

// ✅ Independent tests
describe('UserService', () => {
  beforeEach(() => {
    // Set up fresh state for each test
    userService.clear();
  });

  it('should create user', () => {
    const userId = userService.create({ name: 'John' });
    expect(userId).toBeDefined();
  });

  it('should find user by id', () => {
    // Create own test data
    const userId = userService.create({ name: 'Jane' });
    const user = userService.findById(userId);
    expect(user.name).toBe('Jane');
  });
});
```

### Avoid Test Logic

```javascript
// ❌ Logic in tests
it('should calculate total correctly', () => {
  const items = [10, 20, 30];
  let expected = 0;
  for (let i = 0; i < items.length; i++) {
    expected += items[i];
  }
  expect(calculateTotal(items)).toBe(expected);
});

// ✅ No logic, clear expectations
it('should calculate total of multiple items', () => {
  const items = [10, 20, 30];
  expect(calculateTotal(items)).toBe(60);
});
```

## Testing Patterns

### Test Fixtures

```javascript
// Reusable test data
const fixtures = {
  validUser: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  },

  invalidUser: {
    name: '',
    email: 'invalid-email',
    age: -5
  },

  adminUser: {
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin'
  }
};

// Usage
it('should create user with valid data', () => {
  const user = createUser(fixtures.validUser);
  expect(user).toBeDefined();
});
```

### Test Builders

```javascript
// Builder pattern for test data
class UserBuilder {
  constructor() {
    this.user = {
      name: 'Default Name',
      email: 'default@example.com',
      age: 25,
      role: 'user'
    };
  }

  withName(name) {
    this.user.name = name;
    return this;
  }

  withEmail(email) {
    this.user.email = email;
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
describe('UserService', () => {
  it('should create admin user', () => {
    const adminData = new UserBuilder()
      .withName('Admin User')
      .asAdmin()
      .build();

    const user = userService.create(adminData);
    expect(user.role).toBe('admin');
  });
});
```

### Parameterized Tests

```javascript
// Jest - test.each
describe('Calculator.add', () => {
  test.each([
    [1, 1, 2],
    [2, 3, 5],
    [-1, 1, 0],
    [0, 0, 0]
  ])('add(%i, %i) should return %i', (a, b, expected) => {
    expect(calculator.add(a, b)).toBe(expected);
  });
});

// Or with objects
test.each([
  { a: 1, b: 1, expected: 2 },
  { a: 2, b: 3, expected: 5 },
  { a: -1, b: 1, expected: 0 }
])('add($a, $b) should return $expected', ({ a, b, expected }) => {
  expect(calculator.add(a, b)).toBe(expected);
});
```

## Testing Edge Cases

### Common Edge Cases

```javascript
describe('String manipulation', () => {
  // Empty inputs
  it('should handle empty string', () => {
    expect(reverse('')).toBe('');
  });

  // Null/undefined
  it('should handle null', () => {
    expect(reverse(null)).toBe('');
  });

  // Boundary values
  it('should handle single character', () => {
    expect(reverse('a')).toBe('a');
  });

  // Large inputs
  it('should handle very long strings', () => {
    const longString = 'a'.repeat(10000);
    expect(reverse(longString)).toHaveLength(10000);
  });

  // Special characters
  it('should handle special characters', () => {
    expect(reverse('hello@#$')).toBe('$#@olleh');
  });
});

describe('Number operations', () => {
  // Zero
  it('should handle zero', () => {
    expect(factorial(0)).toBe(1);
  });

  // Negative numbers
  it('should throw for negative numbers', () => {
    expect(() => factorial(-1)).toThrow();
  });

  // Large numbers
  it('should handle large numbers', () => {
    expect(factorial(20)).toBeGreaterThan(0);
  });

  // Decimal numbers
  it('should round decimal inputs', () => {
    expect(factorial(5.7)).toBe(factorial(6));
  });
});
```

## Common Pitfalls

### Anti-Patterns to Avoid

```javascript
// ❌ Testing implementation details
it('should call internal method', () => {
  const spy = jest.spyOn(service, '_internalMethod');
  service.publicMethod();
  expect(spy).toHaveBeenCalled();
});

// ✅ Test behavior, not implementation
it('should return correct result', () => {
  const result = service.publicMethod();
  expect(result).toEqual(expectedOutput);
});

// ❌ Fragile tests (too specific)
it('should format date', () => {
  const result = formatDate(new Date('2024-01-01'));
  expect(result).toBe('Monday, January 1, 2024 at 12:00:00 AM PST');
});

// ✅ Robust tests
it('should format date correctly', () => {
  const result = formatDate(new Date('2024-01-01'));
  expect(result).toMatch(/January 1, 2024/);
});

// ❌ Testing too much
it('should do everything', () => {
  // 100 lines of test code
  // Testing multiple scenarios
  // Multiple assertions
});

// ✅ Focused tests
it('should create user', () => {
  const user = createUser(data);
  expect(user.id).toBeDefined();
});

it('should send welcome email', () => {
  createUser(data);
  expect(emailService.send).toHaveBeenCalled();
});
```

## Performance Testing

### Benchmarking

```javascript
// Measure execution time
describe('Performance', () => {
  it('should execute quickly', () => {
    const start = performance.now();

    // Run operation
    for (let i = 0; i < 1000; i++) {
      processData(largeDataset);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete in 100ms
  });
});
```

## Checklist

### Unit Test Quality Checklist

**Test Design:**
- [ ] Tests are independent
- [ ] Tests are fast (< 100ms each)
- [ ] Each test has single responsibility
- [ ] Test names are descriptive
- [ ] AAA pattern followed

**Coverage:**
- [ ] Happy path tested
- [ ] Error cases tested
- [ ] Edge cases tested
- [ ] Boundary values tested
- [ ] Coverage targets met

**Code Quality:**
- [ ] No test logic
- [ ] No duplicate code
- [ ] Clear assertions
- [ ] Proper mocking
- [ ] No implementation details tested

**Maintainability:**
- [ ] Easy to understand
- [ ] Easy to modify
- [ ] Tests fail for right reasons
- [ ] Clear failure messages
- [ ] Minimal test data

## References

### Books
- "Test Driven Development: By Example" - Kent Beck
- "The Art of Unit Testing" - Roy Osherove
- "Growing Object-Oriented Software, Guided by Tests" - Freeman & Pryce
- "xUnit Test Patterns" - Gerard Meszaros

### Online Resources
- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
- [Martin Fowler - Unit Testing](https://martinfowler.com/bliki/UnitTest.html)

### Tools
- **JavaScript**: Jest, Vitest, Mocha, Jasmine
- **Python**: pytest, unittest, nose2
- **Java**: JUnit, TestNG, Mockito
- **C#**: xUnit, NUnit, MSTest
- **.NET**: Moq, NSubstitute

## Related Topics

- [Integration Testing](integration-testing.md)
- [Test-Driven Development](../07-development-practices/tdd.md)
- [Code Coverage](../09-metrics-monitoring/code-coverage.md)
- [Testing Strategy](../04-testing-strategy/README.md)

---

*Part of: [Test Levels](README.md)*
