/**
 * Mutation Testing Example
 * Demonstrates how mutation testing validates the quality of unit tests
 *
 * Mutation testing introduces small changes (mutations) to the source code
 * to verify that tests can detect these changes and fail appropriately.
 */

// Example source code to be tested with mutations
class Calculator {
  add(a, b) {
    return a + b;  // Potential mutations: -, *, /, a - b, a * b, etc.
  }

  subtract(a, b) {
    return a - b;  // Potential mutations: +, *, /, a + b, a * b, etc.
  }

  multiply(a, b) {
    return a * b;  // Potential mutations: +, -, /, a + b, a - b, etc.
  }

  divide(a, b) {
    if (b === 0) {  // Potential mutations: b !== 0, b == 0, b > 0, b < 0
      throw new Error('Division by zero');
    }
    return a / b;  // Potential mutations: *, +, -, a * b, a + b, etc.
  }

  power(base, exponent) {
    if (exponent === 0) {  // Potential mutations: !==, >, <, >=, <=
      return 1;  // Potential mutations: 0, base, exponent
    }
    if (exponent === 1) {  // Potential mutations: 0, 2, >, <
      return base;  // Potential mutations: 1, exponent, 0
    }
    return Math.pow(base, exponent);  // Potential mutations: base * exponent, base + exponent
  }

  factorial(n) {
    if (n < 0) {  // Potential mutations: >, <=, >=, ===
      throw new Error('Factorial of negative number');
    }
    if (n === 0 || n === 1) {  // Potential mutations: &&, n > 0, n < 1
      return 1;  // Potential mutations: 0, n
    }
    return n * this.factorial(n - 1);  // Potential mutations: +, n + 1, n * 1
  }

  isEven(n) {
    return n % 2 === 0;  // Potential mutations: !==, n % 3, n % 1, n / 2
  }

  max(a, b) {
    return a > b ? a : b;  // Potential mutations: <, >=, <=, a < b ? a : b
  }

  min(a, b) {
    return a < b ? a : b;  // Potential mutations: >, <=, >=, a > b ? a : b
  }

  absoluteValue(n) {
    return n < 0 ? -n : n;  // Potential mutations: >, <=, >=, n > 0 ? -n : n
  }

  isPrime(n) {
    if (n <= 1) return false;  // Potential mutations: <, >=, true, n < 1
    if (n <= 3) return true;   // Potential mutations: <, >=, false, n < 3
    if (n % 2 === 0 || n % 3 === 0) return false;  // Potential mutations: &&, !==

    for (let i = 5; i * i <= n; i += 6) {  // Potential mutations: <, >, i + 6, i - 6
      if (n % i === 0 || n % (i + 2) === 0) {  // Potential mutations: &&, !==, i - 2
        return false;  // Potential mutations: true
      }
    }
    return true;  // Potential mutations: false
  }
}

// User management class for more complex mutation testing
class UserManager {
  constructor() {
    this.users = [];
    this.nextId = 1;
  }

  createUser(userData) {
    if (!userData || !userData.email) {  // Potential mutations: ||, userData.email
      throw new Error('Email is required');
    }

    if (!this.isValidEmail(userData.email)) {  // Potential mutations: remove !
      throw new Error('Invalid email format');
    }

    if (this.findUserByEmail(userData.email)) {  // Potential mutations: !this.findUserByEmail
      throw new Error('User already exists');
    }

    const user = {
      id: this.nextId++,  // Potential mutations: this.nextId--, ++this.nextId
      email: userData.email,
      name: userData.name || 'Unknown',  // Potential mutations: &&, userData.name ?? 'Unknown'
      isActive: userData.isActive !== false,  // Potential mutations: ===, true
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(user);  // Potential mutations: unshift, pop, shift
    return user;
  }

  findUserById(id) {
    return this.users.find(user => user.id === id);  // Potential mutations: !==, filter, user.id == id
  }

  findUserByEmail(email) {
    return this.users.find(user => user.email === email);  // Potential mutations: !==, user.email == email
  }

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) {  // Potential mutations: user
      throw new Error('User not found');
    }

    if (updates.email && updates.email !== user.email) {  // Potential mutations: ||, ===
      if (!this.isValidEmail(updates.email)) {  // Potential mutations: remove !
        throw new Error('Invalid email format');
      }
      if (this.findUserByEmail(updates.email)) {  // Potential mutations: !this.findUserByEmail
        throw new Error('Email already in use');
      }
    }

    Object.assign(user, updates, { updatedAt: new Date() });  // Potential mutations: user, updates order
    return user;
  }

  deleteUser(id) {
    const index = this.users.findIndex(user => user.id === id);  // Potential mutations: find, user.id !== id
    if (index === -1) {  // Potential mutations: !==, index < 0, index > -1
      throw new Error('User not found');
    }
    return this.users.splice(index, 1)[0];  // Potential mutations: slice, index + 1, 1 + 1
  }

  getActiveUsers() {
    return this.users.filter(user => user.isActive);  // Potential mutations: !user.isActive
  }

  getUserCount() {
    return this.users.length;  // Potential mutations: this.users.size
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // Potential mutations: different regex patterns
    return emailRegex.test(email);  // Potential mutations: !emailRegex.test
  }

  deactivateUser(id) {
    const user = this.findUserById(id);
    if (!user) {  // Potential mutations: user
      throw new Error('User not found');
    }
    user.isActive = false;  // Potential mutations: true
    user.updatedAt = new Date();
    return user;
  }

  activateUser(id) {
    const user = this.findUserById(id);
    if (!user) {  // Potential mutations: user
      throw new Error('User not found');
    }
    user.isActive = true;  // Potential mutations: false
    user.updatedAt = new Date();
    return user;
  }
}

// Comprehensive test suite designed to catch mutations
describe('Calculator Mutation Testing', () => {
  let calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('Addition', () => {
    test('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    test('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    test('should add zero', () => {
      expect(calculator.add(5, 0)).toBe(5);
      expect(calculator.add(0, 5)).toBe(5);
    });

    test('should add decimals', () => {
      expect(calculator.add(1.5, 2.5)).toBe(4);
    });
  });

  describe('Subtraction', () => {
    test('should subtract positive numbers', () => {
      expect(calculator.subtract(5, 3)).toBe(2);
    });

    test('should subtract negative numbers', () => {
      expect(calculator.subtract(-2, -3)).toBe(1);
    });

    test('should handle zero subtraction', () => {
      expect(calculator.subtract(5, 0)).toBe(5);
      expect(calculator.subtract(0, 5)).toBe(-5);
    });

    test('should subtract decimals', () => {
      expect(calculator.subtract(5.5, 2.5)).toBe(3);
    });
  });

  describe('Multiplication', () => {
    test('should multiply positive numbers', () => {
      expect(calculator.multiply(3, 4)).toBe(12);
    });

    test('should multiply by zero', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
      expect(calculator.multiply(0, 5)).toBe(0);
    });

    test('should multiply negative numbers', () => {
      expect(calculator.multiply(-2, 3)).toBe(-6);
      expect(calculator.multiply(-2, -3)).toBe(6);
    });

    test('should multiply decimals', () => {
      expect(calculator.multiply(2.5, 4)).toBe(10);
    });
  });

  describe('Division', () => {
    test('should divide positive numbers', () => {
      expect(calculator.divide(12, 3)).toBe(4);
    });

    test('should divide negative numbers', () => {
      expect(calculator.divide(-12, 3)).toBe(-4);
      expect(calculator.divide(-12, -3)).toBe(4);
    });

    test('should throw error for division by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Division by zero');
    });

    test('should divide decimals', () => {
      expect(calculator.divide(7.5, 2.5)).toBe(3);
    });

    test('should handle zero dividend', () => {
      expect(calculator.divide(0, 5)).toBe(0);
    });
  });

  describe('Power', () => {
    test('should calculate power of positive numbers', () => {
      expect(calculator.power(2, 3)).toBe(8);
      expect(calculator.power(5, 2)).toBe(25);
    });

    test('should handle exponent of zero', () => {
      expect(calculator.power(5, 0)).toBe(1);
      expect(calculator.power(0, 0)).toBe(1);
    });

    test('should handle exponent of one', () => {
      expect(calculator.power(5, 1)).toBe(5);
      expect(calculator.power(0, 1)).toBe(0);
    });

    test('should handle negative base', () => {
      expect(calculator.power(-2, 2)).toBe(4);
      expect(calculator.power(-2, 3)).toBe(-8);
    });

    test('should handle negative exponent', () => {
      expect(calculator.power(2, -2)).toBe(0.25);
    });
  });

  describe('Factorial', () => {
    test('should calculate factorial of positive numbers', () => {
      expect(calculator.factorial(5)).toBe(120);
      expect(calculator.factorial(3)).toBe(6);
    });

    test('should handle base cases', () => {
      expect(calculator.factorial(0)).toBe(1);
      expect(calculator.factorial(1)).toBe(1);
    });

    test('should throw error for negative numbers', () => {
      expect(() => calculator.factorial(-1)).toThrow('Factorial of negative number');
      expect(() => calculator.factorial(-5)).toThrow('Factorial of negative number');
    });

    test('should handle large numbers', () => {
      expect(calculator.factorial(6)).toBe(720);
    });
  });

  describe('Even Number Check', () => {
    test('should identify even numbers', () => {
      expect(calculator.isEven(2)).toBe(true);
      expect(calculator.isEven(4)).toBe(true);
      expect(calculator.isEven(0)).toBe(true);
      expect(calculator.isEven(-2)).toBe(true);
    });

    test('should identify odd numbers', () => {
      expect(calculator.isEven(1)).toBe(false);
      expect(calculator.isEven(3)).toBe(false);
      expect(calculator.isEven(-1)).toBe(false);
      expect(calculator.isEven(-3)).toBe(false);
    });
  });

  describe('Maximum Value', () => {
    test('should return maximum of two numbers', () => {
      expect(calculator.max(5, 3)).toBe(5);
      expect(calculator.max(3, 5)).toBe(5);
    });

    test('should handle equal values', () => {
      expect(calculator.max(5, 5)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(calculator.max(-2, -5)).toBe(-2);
      expect(calculator.max(-2, 3)).toBe(3);
    });

    test('should handle zero', () => {
      expect(calculator.max(0, -1)).toBe(0);
      expect(calculator.max(0, 1)).toBe(1);
    });
  });

  describe('Minimum Value', () => {
    test('should return minimum of two numbers', () => {
      expect(calculator.min(5, 3)).toBe(3);
      expect(calculator.min(3, 5)).toBe(3);
    });

    test('should handle equal values', () => {
      expect(calculator.min(5, 5)).toBe(5);
    });

    test('should handle negative numbers', () => {
      expect(calculator.min(-2, -5)).toBe(-5);
      expect(calculator.min(-2, 3)).toBe(-2);
    });

    test('should handle zero', () => {
      expect(calculator.min(0, -1)).toBe(-1);
      expect(calculator.min(0, 1)).toBe(0);
    });
  });

  describe('Absolute Value', () => {
    test('should return absolute value of positive numbers', () => {
      expect(calculator.absoluteValue(5)).toBe(5);
      expect(calculator.absoluteValue(0)).toBe(0);
    });

    test('should return absolute value of negative numbers', () => {
      expect(calculator.absoluteValue(-5)).toBe(5);
      expect(calculator.absoluteValue(-0)).toBe(0);
    });

    test('should handle decimals', () => {
      expect(calculator.absoluteValue(-3.5)).toBe(3.5);
      expect(calculator.absoluteValue(3.5)).toBe(3.5);
    });
  });

  describe('Prime Number Check', () => {
    test('should identify prime numbers', () => {
      expect(calculator.isPrime(2)).toBe(true);
      expect(calculator.isPrime(3)).toBe(true);
      expect(calculator.isPrime(5)).toBe(true);
      expect(calculator.isPrime(7)).toBe(true);
      expect(calculator.isPrime(11)).toBe(true);
      expect(calculator.isPrime(13)).toBe(true);
      expect(calculator.isPrime(17)).toBe(true);
      expect(calculator.isPrime(19)).toBe(true);
    });

    test('should identify non-prime numbers', () => {
      expect(calculator.isPrime(1)).toBe(false);
      expect(calculator.isPrime(4)).toBe(false);
      expect(calculator.isPrime(6)).toBe(false);
      expect(calculator.isPrime(8)).toBe(false);
      expect(calculator.isPrime(9)).toBe(false);
      expect(calculator.isPrime(10)).toBe(false);
      expect(calculator.isPrime(12)).toBe(false);
      expect(calculator.isPrime(15)).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(calculator.isPrime(0)).toBe(false);
      expect(calculator.isPrime(-1)).toBe(false);
      expect(calculator.isPrime(-5)).toBe(false);
    });

    test('should handle larger primes', () => {
      expect(calculator.isPrime(23)).toBe(true);
      expect(calculator.isPrime(29)).toBe(true);
      expect(calculator.isPrime(25)).toBe(false); // 5 * 5
      expect(calculator.isPrime(27)).toBe(false); // 3 * 9
    });
  });
});

describe('UserManager Mutation Testing', () => {
  let userManager;

  beforeEach(() => {
    userManager = new UserManager();
  });

  describe('User Creation', () => {
    test('should create user with valid data', () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        isActive: true
      };

      const user = userManager.createUser(userData);

      expect(user).toMatchObject({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        isActive: true
      });
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    test('should create user with minimal data', () => {
      const userData = { email: 'test@example.com' };
      const user = userManager.createUser(userData);

      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Unknown');
      expect(user.isActive).toBe(true);
    });

    test('should throw error for missing email', () => {
      expect(() => userManager.createUser({})).toThrow('Email is required');
      expect(() => userManager.createUser({ name: 'Test' })).toThrow('Email is required');
      expect(() => userManager.createUser(null)).toThrow('Email is required');
    });

    test('should throw error for invalid email format', () => {
      expect(() => userManager.createUser({ email: 'invalid-email' })).toThrow('Invalid email format');
      expect(() => userManager.createUser({ email: '@example.com' })).toThrow('Invalid email format');
      expect(() => userManager.createUser({ email: 'test@' })).toThrow('Invalid email format');
    });

    test('should throw error for duplicate email', () => {
      userManager.createUser({ email: 'test@example.com' });
      expect(() => userManager.createUser({ email: 'test@example.com' })).toThrow('User already exists');
    });

    test('should handle isActive flag correctly', () => {
      const activeUser = userManager.createUser({ email: 'active@example.com', isActive: true });
      const inactiveUser = userManager.createUser({ email: 'inactive@example.com', isActive: false });
      const defaultUser = userManager.createUser({ email: 'default@example.com' });

      expect(activeUser.isActive).toBe(true);
      expect(inactiveUser.isActive).toBe(false);
      expect(defaultUser.isActive).toBe(true);
    });
  });

  describe('User Retrieval', () => {
    beforeEach(() => {
      userManager.createUser({ email: 'user1@example.com', name: 'User 1' });
      userManager.createUser({ email: 'user2@example.com', name: 'User 2' });
    });

    test('should find user by ID', () => {
      const user = userManager.findUserById(1);
      expect(user.email).toBe('user1@example.com');
      expect(user.name).toBe('User 1');
    });

    test('should return undefined for non-existent ID', () => {
      expect(userManager.findUserById(999)).toBeUndefined();
      expect(userManager.findUserById(-1)).toBeUndefined();
    });

    test('should find user by email', () => {
      const user = userManager.findUserByEmail('user2@example.com');
      expect(user.id).toBe(2);
      expect(user.name).toBe('User 2');
    });

    test('should return undefined for non-existent email', () => {
      expect(userManager.findUserByEmail('nonexistent@example.com')).toBeUndefined();
    });
  });

  describe('User Updates', () => {
    beforeEach(() => {
      userManager.createUser({ email: 'test@example.com', name: 'Test User' });
    });

    test('should update user successfully', () => {
      const originalUpdatedAt = userManager.findUserById(1).updatedAt;

      // Wait a bit to ensure different timestamp
      setTimeout(() => {
        const updatedUser = userManager.updateUser(1, { name: 'Updated User' });

        expect(updatedUser.name).toBe('Updated User');
        expect(updatedUser.email).toBe('test@example.com');
        expect(updatedUser.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });

    test('should throw error for non-existent user', () => {
      expect(() => userManager.updateUser(999, { name: 'New Name' })).toThrow('User not found');
    });

    test('should validate email when updating', () => {
      expect(() => userManager.updateUser(1, { email: 'invalid-email' })).toThrow('Invalid email format');
    });

    test('should prevent duplicate email when updating', () => {
      userManager.createUser({ email: 'another@example.com', name: 'Another User' });
      expect(() => userManager.updateUser(1, { email: 'another@example.com' })).toThrow('Email already in use');
    });

    test('should allow updating email to same email', () => {
      const user = userManager.updateUser(1, { email: 'test@example.com', name: 'Same Email' });
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Same Email');
    });
  });

  describe('User Deletion', () => {
    beforeEach(() => {
      userManager.createUser({ email: 'user1@example.com' });
      userManager.createUser({ email: 'user2@example.com' });
    });

    test('should delete user successfully', () => {
      const deletedUser = userManager.deleteUser(1);

      expect(deletedUser.email).toBe('user1@example.com');
      expect(userManager.findUserById(1)).toBeUndefined();
      expect(userManager.getUserCount()).toBe(1);
    });

    test('should throw error for non-existent user', () => {
      expect(() => userManager.deleteUser(999)).toThrow('User not found');
    });

    test('should maintain correct user count after deletion', () => {
      expect(userManager.getUserCount()).toBe(2);
      userManager.deleteUser(1);
      expect(userManager.getUserCount()).toBe(1);
      userManager.deleteUser(2);
      expect(userManager.getUserCount()).toBe(0);
    });
  });

  describe('Active Users', () => {
    beforeEach(() => {
      userManager.createUser({ email: 'active1@example.com', isActive: true });
      userManager.createUser({ email: 'inactive1@example.com', isActive: false });
      userManager.createUser({ email: 'active2@example.com', isActive: true });
    });

    test('should return only active users', () => {
      const activeUsers = userManager.getActiveUsers();

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.map(user => user.email)).toEqual(['active1@example.com', 'active2@example.com']);
    });

    test('should return empty array when no active users', () => {
      userManager.deactivateUser(1);
      userManager.deactivateUser(3);

      const activeUsers = userManager.getActiveUsers();
      expect(activeUsers).toHaveLength(0);
    });
  });

  describe('User Activation/Deactivation', () => {
    beforeEach(() => {
      userManager.createUser({ email: 'test@example.com', isActive: true });
    });

    test('should deactivate user', () => {
      const user = userManager.deactivateUser(1);

      expect(user.isActive).toBe(false);
      expect(userManager.getActiveUsers()).toHaveLength(0);
    });

    test('should activate user', () => {
      userManager.deactivateUser(1);
      const user = userManager.activateUser(1);

      expect(user.isActive).toBe(true);
      expect(userManager.getActiveUsers()).toHaveLength(1);
    });

    test('should throw error when activating non-existent user', () => {
      expect(() => userManager.activateUser(999)).toThrow('User not found');
    });

    test('should throw error when deactivating non-existent user', () => {
      expect(() => userManager.deactivateUser(999)).toThrow('User not found');
    });

    test('should update timestamp when changing activation status', () => {
      const originalUpdatedAt = userManager.findUserById(1).updatedAt;

      setTimeout(() => {
        userManager.deactivateUser(1);
        const user = userManager.findUserById(1);
        expect(user.updatedAt).not.toEqual(originalUpdatedAt);
      }, 1);
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      expect(userManager.isValidEmail('test@example.com')).toBe(true);
      expect(userManager.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(userManager.isValidEmail('user+tag@example.org')).toBe(true);
      expect(userManager.isValidEmail('123@numbers.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(userManager.isValidEmail('invalid-email')).toBe(false);
      expect(userManager.isValidEmail('@example.com')).toBe(false);
      expect(userManager.isValidEmail('test@')).toBe(false);
      expect(userManager.isValidEmail('test.example.com')).toBe(false);
      expect(userManager.isValidEmail('test@.com')).toBe(false);
      expect(userManager.isValidEmail('')).toBe(false);
    });
  });
});

/**
 * Mutation Testing Configuration Example
 *
 * This would typically be configured in a stryker.conf.js file
 */
const mutationTestingConfig = {
  // Stryker configuration for mutation testing
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'jest',
  testFramework: 'jest',
  coverageAnalysis: 'perTest',

  // Files to mutate
  mutate: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],

  // Test files
  testFiles: [
    'src/**/*.test.js',
    'src/**/*.spec.js'
  ],

  // Mutation types to apply
  mutators: [
    'ArithmeticOperator',    // +, -, *, /, %
    'ArrayDeclaration',      // [] mutations
    'BlockStatement',        // {} mutations
    'BooleanLiteral',        // true/false mutations
    'ConditionalExpression', // ?: mutations
    'EqualityOperator',      // ==, !=, ===, !==
    'LogicalOperator',       // &&, ||
    'MethodExpression',      // Method call mutations
    'ObjectLiteral',         // {} mutations
    'StringLiteral',         // String mutations
    'UnaryOperator',         // !, -, +
    'UpdateOperator'         // ++, --
  ],

  // Thresholds for mutation score
  thresholds: {
    high: 90,    // High threshold: 90% mutation score
    low: 80,     // Low threshold: 80% mutation score
    break: 70    // Break build if below 70%
  },

  // Timeout settings
  timeoutMS: 5000,
  timeoutFactor: 1.5,

  // Performance settings
  maxConcurrentTestRunners: 2,

  // Dashboard reporter settings
  dashboard: {
    project: 'github.com/your-org/your-repo',
    version: 'main'
  }
};

/**
 * Mutation Testing Best Practices:
 *
 * 1. Start with high test coverage (>90%)
 * 2. Focus on critical business logic
 * 3. Use mutation testing to find weak tests
 * 4. Set realistic mutation score thresholds
 * 5. Review surviving mutants carefully
 * 6. Combine with other testing strategies
 * 7. Run mutation tests in CI/CD pipeline
 * 8. Use mutation testing for test quality assessment
 * 9. Consider performance impact of mutation testing
 * 10. Document mutation testing results and improvements
 *
 * Common Surviving Mutants (mutations that don't fail tests):
 *
 * 1. Equivalent mutants: Changes that don't affect behavior
 * 2. Weak assertions: Tests that don't verify specific values
 * 3. Missing edge cases: Tests that don't cover boundary conditions
 * 4. Insufficient test data: Tests with limited input variations
 * 5. Dead code: Unreachable code that gets mutated
 *
 * How to Improve Mutation Score:
 *
 * 1. Add more specific assertions
 * 2. Test boundary conditions thoroughly
 * 3. Cover all conditional branches
 * 4. Test with diverse input data
 * 5. Remove or test dead code
 * 6. Add negative test cases
 * 7. Test error handling paths
 * 8. Verify exact return values
 * 9. Test state changes completely
 * 10. Use property-based testing for edge cases
 */

module.exports = {
  Calculator,
  UserManager,
  mutationTestingConfig
};