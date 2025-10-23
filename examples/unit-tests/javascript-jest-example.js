/**
 * Unit Testing Example with Jest
 * Demonstrates various testing patterns and best practices
 */

// ============================================
// 1. BASIC TESTING - Simple Functions
// ============================================

// Function to test
function calculateDiscount(price, discountPercent) {
  if (price < 0 || discountPercent < 0 || discountPercent > 100) {
    throw new Error('Invalid input');
  }
  return price * (1 - discountPercent / 100);
}

// Tests
describe('calculateDiscount', () => {
  // Basic happy path test
  test('should apply 20% discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  // Edge cases
  test('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  test('should handle 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  // Error cases
  test('should throw error for negative price', () => {
    expect(() => calculateDiscount(-10, 20)).toThrow('Invalid input');
  });

  test('should throw error for discount over 100%', () => {
    expect(() => calculateDiscount(100, 150)).toThrow('Invalid input');
  });
});

// ============================================
// 2. TESTING CLASSES
// ============================================

class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(item) {
    if (!item.name || !item.price || item.price <= 0) {
      throw new Error('Invalid item');
    }
    this.items.push(item);
  }

  removeItem(itemName) {
    const index = this.items.findIndex(item => item.name === itemName);
    if (index === -1) {
      throw new Error('Item not found');
    }
    this.items.splice(index, 1);
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + (item.quantity || 1), 0);
  }

  clear() {
    this.items = [];
  }
}

describe('ShoppingCart', () => {
  let cart;

  // Setup before each test
  beforeEach(() => {
    cart = new ShoppingCart();
  });

  // Teardown after each test (optional here, but showing the pattern)
  afterEach(() => {
    cart = null;
  });

  describe('addItem', () => {
    test('should add valid item to cart', () => {
      const item = { name: 'Book', price: 10 };
      cart.addItem(item);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0]).toEqual(item);
    });

    test('should throw error for item without name', () => {
      expect(() => cart.addItem({ price: 10 })).toThrow('Invalid item');
    });

    test('should throw error for item with negative price', () => {
      expect(() => cart.addItem({ name: 'Book', price: -5 })).toThrow('Invalid item');
    });
  });

  describe('removeItem', () => {
    beforeEach(() => {
      cart.addItem({ name: 'Book', price: 10 });
      cart.addItem({ name: 'Pen', price: 2 });
    });

    test('should remove existing item', () => {
      cart.removeItem('Book');
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].name).toBe('Pen');
    });

    test('should throw error when removing non-existent item', () => {
      expect(() => cart.removeItem('Laptop')).toThrow('Item not found');
    });
  });

  describe('getTotal', () => {
    test('should calculate total for items without quantity', () => {
      cart.addItem({ name: 'Book', price: 10 });
      cart.addItem({ name: 'Pen', price: 2 });
      expect(cart.getTotal()).toBe(12);
    });

    test('should calculate total for items with quantity', () => {
      cart.addItem({ name: 'Book', price: 10, quantity: 2 });
      cart.addItem({ name: 'Pen', price: 2, quantity: 5 });
      expect(cart.getTotal()).toBe(30);
    });

    test('should return 0 for empty cart', () => {
      expect(cart.getTotal()).toBe(0);
    });
  });
});

// ============================================
// 3. MOCKING EXTERNAL DEPENDENCIES
// ============================================

// Service that depends on external API
class UserService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async getUser(id) {
    try {
      const user = await this.apiClient.fetchUser(id);
      return {
        ...user,
        displayName: `${user.firstName} ${user.lastName}`,
      };
    } catch (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  async createUser(userData) {
    if (!userData.email || !userData.email.includes('@')) {
      throw new Error('Invalid email');
    }
    return await this.apiClient.createUser(userData);
  }
}

describe('UserService', () => {
  let userService;
  let mockApiClient;

  beforeEach(() => {
    // Create mock API client
    mockApiClient = {
      fetchUser: jest.fn(),
      createUser: jest.fn(),
    };
    userService = new UserService(mockApiClient);
  });

  describe('getUser', () => {
    test('should return user with displayName', async () => {
      // Arrange
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      mockApiClient.fetchUser.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUser(1);

      // Assert
      expect(mockApiClient.fetchUser).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        ...mockUser,
        displayName: 'John Doe',
      });
    });

    test('should handle API errors', async () => {
      // Arrange
      mockApiClient.fetchUser.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(userService.getUser(1)).rejects.toThrow('Failed to fetch user: Network error');
    });
  });

  describe('createUser', () => {
    test('should create user with valid email', async () => {
      // Arrange
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      };
      const createdUser = { id: 2, ...userData };
      mockApiClient.createUser.mockResolvedValue(createdUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockApiClient.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);
    });

    test('should reject invalid email', async () => {
      // Arrange
      const userData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'invalid-email',
      };

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Invalid email');
      expect(mockApiClient.createUser).not.toHaveBeenCalled();
    });
  });
});

// ============================================
// 4. ASYNC TESTING
// ============================================

// Async function to test
function fetchData(callback) {
  setTimeout(() => {
    callback('data loaded');
  }, 100);
}

function fetchPromise() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('promise resolved');
    }, 100);
  });
}

describe('Async Testing', () => {
  // Testing callbacks (done parameter)
  test('should handle callback', done => {
    fetchData(data => {
      expect(data).toBe('data loaded');
      done();
    });
  });

  // Testing promises with return
  test('should handle promise with return', () => {
    return fetchPromise().then(data => {
      expect(data).toBe('promise resolved');
    });
  });

  // Testing promises with async/await
  test('should handle promise with async/await', async () => {
    const data = await fetchPromise();
    expect(data).toBe('promise resolved');
  });

  // Testing promise rejection
  test('should handle promise rejection', async () => {
    const failingPromise = () => Promise.reject(new Error('Failed!'));
    await expect(failingPromise()).rejects.toThrow('Failed!');
  });
});

// ============================================
// 5. PARAMETERIZED TESTS
// ============================================

describe('Parameterized Tests', () => {
  // Test the same function with multiple inputs
  test.each([
    [1, 1, 2],
    [1, 2, 3],
    [2, 2, 4],
    [-1, 1, 0],
    [0, 0, 0],
  ])('add(%i, %i) should return %i', (a, b, expected) => {
    expect(a + b).toBe(expected);
  });

  // Named parameters for better readability
  test.each`
    input        | expected
    ${''}        | ${true}
    ${' '}       | ${true}
    ${'abc'}     | ${false}
    ${null}      | ${true}
    ${undefined} | ${true}
  `('isEmpty($input) should return $expected', ({ input, expected }) => {
    const isEmpty = value => !value || value.trim().length === 0;
    expect(isEmpty(input)).toBe(expected);
  });
});

// ============================================
// 6. SNAPSHOT TESTING
// ============================================

function generateUserCard(user) {
  return {
    id: user.id,
    display: `${user.name} (${user.role})`,
    permissions: user.role === 'admin' ? ['read', 'write', 'delete'] : ['read'],
    createdAt: user.createdAt,
  };
}

describe('Snapshot Testing', () => {
  test('should generate correct user card structure', () => {
    const user = {
      id: 1,
      name: 'John Doe',
      role: 'admin',
      createdAt: '2024-01-01',
    };

    const userCard = generateUserCard(user);

    // This creates/compares against a snapshot file
    expect(userCard).toMatchSnapshot();
  });

  // Inline snapshot for smaller objects
  test('should match inline snapshot', () => {
    const config = {
      env: 'test',
      debug: true,
      version: '1.0.0',
    };

    expect(config).toMatchInlineSnapshot(`
      Object {
        "debug": true,
        "env": "test",
        "version": "1.0.0",
      }
    `);
  });
});

// ============================================
// 7. TESTING WITH TIMERS
// ============================================

function delayedGreeting(callback) {
  setTimeout(() => {
    callback('Hello after 1 second');
  }, 1000);
}

describe('Timer Mocking', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should call callback after 1 second', () => {
    const callback = jest.fn();

    delayedGreeting(callback);

    // At this point, callback hasn't been called
    expect(callback).not.toBeCalled();

    // Fast-forward time
    jest.advanceTimersByTime(1000);

    // Now it should have been called
    expect(callback).toBeCalledWith('Hello after 1 second');
  });
});

// ============================================
// 8. CUSTOM MATCHERS
// ============================================

// Extend Jest with custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

describe('Custom Matchers', () => {
  test('should use custom matcher', () => {
    expect(50).toBeWithinRange(1, 100);
    expect(101).not.toBeWithinRange(1, 100);
  });
});

// Export for use in other files
module.exports = {
  calculateDiscount,
  ShoppingCart,
  UserService,
  generateUserCard,
};
