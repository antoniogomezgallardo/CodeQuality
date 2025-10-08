/**
 * Jest Setup File
 *
 * This file runs before each test file and can be used to:
 * - Set up global test configuration
 * - Configure custom matchers
 * - Set global timeouts
 * - Load environment variables
 * - Set up global mocks
 */

const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Set global test timeout
jest.setTimeout(30000); // 30 seconds

// Configure console output during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Optionally suppress certain console outputs during tests
if (process.env.SUPPRESS_CONSOLE === 'true') {
  console.error = (...args) => {
    // Only show actual errors, not expected validation errors
    if (!args[0]?.includes?.('Error')) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args) => {
    // Suppress warnings in tests
    return;
  };
}

// Custom matchers
expect.extend({
  /**
   * Check if response has valid user structure
   * @param {Object} received - The user object to validate
   */
  toBeValidUser(received) {
    const hasId = received && typeof received.id !== 'undefined';
    const hasName = received && typeof received.name === 'string';
    const hasEmail = received && typeof received.email === 'string';
    const hasValidEmail = received && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(received.email);

    const pass = hasId && hasName && hasEmail && hasValidEmail;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid user`,
        pass: true
      };
    } else {
      return {
        message: () => {
          const issues = [];
          if (!hasId) issues.push('missing id');
          if (!hasName) issues.push('missing or invalid name');
          if (!hasEmail) issues.push('missing email');
          if (hasEmail && !hasValidEmail) issues.push('invalid email format');

          return `expected ${JSON.stringify(received)} to be a valid user. Issues: ${issues.join(', ')}`;
        },
        pass: false
      };
    }
  },

  /**
   * Check if response has valid pagination structure
   * @param {Object} received - The pagination object to validate
   */
  toHaveValidPagination(received) {
    const hasPage = received && typeof received.page === 'number';
    const hasLimit = received && typeof received.limit === 'number';
    const hasTotal = received && typeof received.total === 'number';
    const hasTotalPages = received && typeof received.totalPages === 'number';

    const pass = hasPage && hasLimit && hasTotal && hasTotalPages;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to have valid pagination`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have valid pagination structure`,
        pass: false
      };
    }
  },

  /**
   * Check if response time is within acceptable range
   * @param {number} received - Response time in milliseconds
   * @param {number} maxTime - Maximum acceptable time
   */
  toBeWithinResponseTime(received, maxTime) {
    const pass = received <= maxTime;

    if (pass) {
      return {
        message: () => `expected ${received}ms not to be within ${maxTime}ms`,
        pass: true
      };
    } else {
      return {
        message: () => `expected response time ${received}ms to be within ${maxTime}ms`,
        pass: false
      };
    }
  },

  /**
   * Check if error response has proper structure
   * @param {Object} received - Error response object
   */
  toBeValidErrorResponse(received) {
    const hasError = received && typeof received.error === 'string';
    const hasMessage = received && typeof received.message === 'string';

    const pass = hasError && hasMessage;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid error response`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to have 'error' and 'message' fields`,
        pass: false
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate random email for testing
   * @returns {string} Random email address
   */
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,

  /**
   * Generate random string
   * @param {number} length - Length of random string
   * @returns {string} Random string
   */
  randomString: (length = 10) => {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  /**
   * Generate random number in range
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  randomInt: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};

// Cleanup after all tests
afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Log test environment info
if (process.env.DEBUG === 'true') {
  console.log('Test Environment Configuration:');
  console.log('  Node Version:', process.version);
  console.log('  Jest Timeout:', jest.getTimerCount());
  console.log('  API Base URL:', process.env.API_BASE_URL || 'not set');
  console.log('  Test Environment:', process.env.TEST_ENV || 'development');
}
