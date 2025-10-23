/**
 * Pact Provider Testing Example
 * Demonstrates how to verify provider compliance with consumer contracts
 */

const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const { server } = require('../src/server');

describe('User Service Provider Tests', () => {
  let app;
  const PORT = 3001;

  beforeAll(async () => {
    // Start the provider service
    app = server.listen(PORT, () => {
      console.log(`Provider service running on port ${PORT}`);
    });
  });

  afterAll(async () => {
    // Stop the provider service
    if (app) {
      app.close();
    }
  });

  describe('Pact Verification', () => {
    test('should validate the provider against consumer contracts', async () => {
      const opts = {
        provider: 'UserService',
        providerBaseUrl: `http://localhost:${PORT}`,

        // Option 1: Verify against local pact files
        pactUrls: [path.resolve(process.cwd(), 'pacts', 'userwebapp-userservice.json')],

        // Option 2: Verify against Pact Broker
        // pactBrokerUrl: 'https://your-pact-broker.com',
        // pactBrokerToken: process.env.PACT_BROKER_TOKEN,
        // consumerVersionSelectors: [
        //   { tag: 'main', latest: true },
        //   { tag: 'production', latest: true }
        // ],

        // Provider version information
        providerVersion: process.env.GIT_COMMIT || '1.0.0',
        providerVersionTags: ['main'],

        // Publishing verification results
        publishVerificationResult: process.env.CI === 'true',

        // State change handlers
        stateHandlers: {
          'user with ID 123 exists': () => {
            return setupUserState(123, {
              id: 123,
              name: 'John Doe',
              email: 'john.doe@example.com',
              role: 'admin',
              createdAt: '2023-01-15T10:30:00Z',
              isActive: true,
            });
          },

          'user with ID 999 does not exist': () => {
            return clearUserState(999);
          },

          'users exist in the system': () => {
            return setupMultipleUsersState([
              {
                id: 1,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'admin',
                isActive: true,
              },
              {
                id: 2,
                name: 'Jane Smith',
                email: 'jane.smith@example.com',
                role: 'user',
                isActive: true,
              },
              {
                id: 3,
                name: 'Bob Wilson',
                email: 'bob.wilson@example.com',
                role: 'moderator',
                isActive: false,
              },
            ]);
          },

          'system is ready to create users': () => {
            return setupDatabaseForUserCreation();
          },

          'user with ID 123 exists and can be updated': () => {
            return setupUserState(123, {
              id: 123,
              name: 'John Doe',
              email: 'john.doe@example.com',
              role: 'admin',
              createdAt: '2023-01-15T10:30:00Z',
              isActive: true,
            });
          },

          'user with ID 123 exists and can be deleted': () => {
            return setupUserState(123, {
              id: 123,
              name: 'John Doe',
              email: 'john.doe@example.com',
              role: 'admin',
              createdAt: '2023-01-15T10:30:00Z',
              isActive: true,
            });
          },

          'request without valid authentication': () => {
            return Promise.resolve();
          },

          'system validates user input': () => {
            return Promise.resolve();
          },
        },

        // Request filters for authentication
        requestFilter: (req, res, next) => {
          // Add authentication headers for test scenarios
          if (req.headers.authorization && req.headers.authorization.includes('Bearer token123')) {
            req.user = {
              id: 'test-user',
              role: 'admin',
              permissions: ['read:users', 'write:users', 'delete:users'],
            };
          }
          next();
        },

        // Custom timeout for slow operations
        timeout: 30000,

        // Log level for debugging
        logLevel: 'INFO',
      };

      return new Verifier(opts).verifyProvider();
    });
  });
});

/**
 * State setup helper functions
 * These functions prepare the provider state for each consumer interaction
 */

const UserRepository = require('../src/repositories/UserRepository');

async function setupUserState(userId, userData) {
  try {
    // Clear any existing user data
    await UserRepository.deleteUser(userId);

    // Create the user with specified data
    await UserRepository.createUser(userData);

    console.log(`Set up user state for ID ${userId}`);
    return Promise.resolve();
  } catch (error) {
    console.error(`Failed to setup user state for ID ${userId}:`, error);
    return Promise.reject(error);
  }
}

async function clearUserState(userId) {
  try {
    // Ensure the user doesn't exist
    await UserRepository.deleteUser(userId);

    console.log(`Cleared user state for ID ${userId}`);
    return Promise.resolve();
  } catch (error) {
    // If user doesn't exist, that's fine for this state
    console.log(`User with ID ${userId} already doesn't exist`);
    return Promise.resolve();
  }
}

async function setupMultipleUsersState(users) {
  try {
    // Clear existing users
    await UserRepository.clearAllUsers();

    // Create multiple users
    for (const user of users) {
      await UserRepository.createUser(user);
    }

    console.log(`Set up ${users.length} users in the system`);
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to setup multiple users state:', error);
    return Promise.reject(error);
  }
}

async function setupDatabaseForUserCreation() {
  try {
    // Ensure database is in clean state for user creation
    await UserRepository.initializeDatabase();

    // Set up any required indexes or constraints
    await UserRepository.createIndexes();

    console.log('Database ready for user creation');
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to setup database for user creation:', error);
    return Promise.reject(error);
  }
}

/**
 * Advanced provider verification with custom matchers
 */
describe('Advanced Provider Verification', () => {
  test('should verify provider with custom matchers and filters', async () => {
    const opts = {
      provider: 'UserService',
      providerBaseUrl: `http://localhost:${PORT}`,
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'userwebapp-userservice.json')],

      // Custom matchers for flexible verification
      customProviderHeaders: ['X-API-Version: 1.0', 'X-Service-Name: UserService'],

      // Before hooks for setup
      beforeEach: async () => {
        console.log('Setting up before each verification');
        // Reset database state
        await UserRepository.resetToCleanState();
      },

      // After hooks for cleanup
      afterEach: async () => {
        console.log('Cleaning up after each verification');
        // Clean up test data
        await UserRepository.cleanupTestData();
      },

      // Message handlers for async messaging (if applicable)
      messageProviders: {
        'user created event': () => ({
          eventType: 'UserCreated',
          data: {
            userId: 123,
            name: 'John Doe',
            email: 'john.doe@example.com',
            timestamp: new Date().toISOString(),
          },
        }),
      },

      // Verbose logging for debugging
      verbose: process.env.NODE_ENV === 'development',
    };

    return new Verifier(opts).verifyProvider();
  });
});

/**
 * Provider verification with Pact Broker integration
 */
describe('Pact Broker Integration', () => {
  test('should verify against contracts from Pact Broker', async () => {
    if (!process.env.PACT_BROKER_URL) {
      console.log('Skipping Pact Broker tests - PACT_BROKER_URL not set');
      return;
    }

    const opts = {
      provider: 'UserService',
      providerBaseUrl: `http://localhost:${PORT}`,

      // Pact Broker configuration
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      pactBrokerUsername: process.env.PACT_BROKER_USERNAME,
      pactBrokerPassword: process.env.PACT_BROKER_PASSWORD,

      // Consumer version selectors
      consumerVersionSelectors: [
        { tag: 'main', latest: true },
        { tag: 'develop', latest: true },
        { deployed: 'production' },
        { deployed: 'staging' },
      ],

      // Provider version and tags
      providerVersion: process.env.GIT_COMMIT || 'unknown',
      providerVersionTags: [process.env.GIT_BRANCH || 'unknown', process.env.NODE_ENV || 'test'],

      // Publish verification results back to broker
      publishVerificationResult: true,

      // Include pending pacts in verification
      includePendingStatus: true,
      enablePending: true,

      // State handlers (same as above)
      stateHandlers: {
        'user with ID 123 exists': () =>
          setupUserState(123, {
            id: 123,
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin',
            createdAt: '2023-01-15T10:30:00Z',
            isActive: true,
          }),
        // ... other state handlers
      },
    };

    return new Verifier(opts).verifyProvider();
  });
});

/**
 * Error handling and edge cases
 */
describe('Provider Verification Edge Cases', () => {
  test('should handle provider errors gracefully', async () => {
    // Test what happens when provider is unavailable
    const opts = {
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:9999', // Non-existent port
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'userwebapp-userservice.json')],
      timeout: 5000,
    };

    await expect(new Verifier(opts).verifyProvider()).rejects.toThrow();
  });

  test('should handle missing state handlers', async () => {
    const opts = {
      provider: 'UserService',
      providerBaseUrl: `http://localhost:${PORT}`,
      pactUrls: [path.resolve(process.cwd(), 'pacts', 'userwebapp-userservice.json')],
      // Intentionally missing state handlers
      stateHandlers: {},
    };

    // This should fail because required states are not handled
    await expect(new Verifier(opts).verifyProvider()).rejects.toThrow();
  });
});

module.exports = {
  setupUserState,
  clearUserState,
  setupMultipleUsersState,
  setupDatabaseForUserCreation,
};
