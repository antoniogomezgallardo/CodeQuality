/**
 * Consumer-Driven Contract Testing with Pact
 *
 * This file demonstrates comprehensive contract testing patterns including:
 * - Consumer contract definition and expectations
 * - Provider state management
 * - Request/response matching
 * - Provider verification
 * - Matchers for flexible matching
 * - Error scenarios and edge cases
 *
 * Contract testing ensures that services can communicate with each other
 * by verifying that the provider's API matches the consumer's expectations.
 *
 * @requires @pact-foundation/pact
 * @requires jest
 * @requires axios
 */

const { Pact, Matchers } = require('@pact-foundation/pact');
const axios = require('axios');
const path = require('path');

// Pact matchers for flexible matching
const { like, eachLike, term, iso8601DateTime } = Matchers;

// ============================================================================
// Consumer: User Service Client
// ============================================================================

/**
 * User Service API Client (Consumer)
 * This client represents a service that consumes the User API
 */
class UserServiceClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Get a user by ID
   * @param {string} userId - User ID
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} User object
   */
  async getUser(userId, token) {
    const response = await axios.get(`${this.baseURL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Get all users with pagination
   * @param {Object} params - Query parameters
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Users list with pagination
   */
  async getUsers(params, token) {
    const response = await axios.get(`${this.baseURL}/api/users`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, token) {
    const response = await axios.post(`${this.baseURL}/api/users`, userData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Update a user
   * @param {string} userId - User ID
   * @param {Object} updates - User updates
   * @param {string} token - Authentication token
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updates, token) {
    const response = await axios.patch(`${this.baseURL}/api/users/${userId}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Delete a user
   * @param {string} userId - User ID
   * @param {string} token - Authentication token
   * @returns {Promise<void>}
   */
  async deleteUser(userId, token) {
    await axios.delete(`${this.baseURL}/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Authentication response
   */
  async login(email, password) {
    const response = await axios.post(
      `${this.baseURL}/api/auth/login`,
      {
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  }
}

// ============================================================================
// Consumer Contract Tests
// ============================================================================

describe('Pact Consumer Contract Tests', () => {
  // Create Pact instance
  const provider = new Pact({
    consumer: 'UserServiceConsumer',
    provider: 'UserServiceProvider',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'warn',
  });

  const client = new UserServiceClient('http://localhost:1234');

  // Setup: Start the mock provider
  beforeAll(async () => {
    await provider.setup();
  });

  // Teardown: Verify all interactions and stop the mock provider
  afterEach(async () => {
    await provider.verify();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  // ==========================================================================
  // Authentication Contract
  // ==========================================================================

  describe('Authentication', () => {
    describe('POST /api/auth/login', () => {
      it('should authenticate with valid credentials', async () => {
        // Define the expected interaction
        await provider.addInteraction({
          state: 'user exists with email admin@example.com',
          uponReceiving: 'a request to login with valid credentials',
          withRequest: {
            method: 'POST',
            path: '/api/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'admin@example.com',
              password: 'admin123',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              token: like('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
              user: {
                id: like(1),
                email: 'admin@example.com',
                role: 'admin',
              },
              expiresIn: like(3600),
            },
          },
        });

        // Execute the request
        const response = await client.login('admin@example.com', 'admin123');

        // Assertions
        expect(response).toHaveProperty('token');
        expect(response).toHaveProperty('user');
        expect(response.user.email).toBe('admin@example.com');
        expect(response.user.role).toBe('admin');
        expect(response).toHaveProperty('expiresIn');
      });

      it('should reject invalid credentials', async () => {
        await provider.addInteraction({
          state: 'user exists with email admin@example.com',
          uponReceiving: 'a request to login with invalid credentials',
          withRequest: {
            method: 'POST',
            path: '/api/auth/login',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              email: 'admin@example.com',
              password: 'wrongpassword',
            },
          },
          willRespondWith: {
            status: 401,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Authentication failed',
              message: like('Invalid email or password'),
            },
          },
        });

        // Execute and expect error
        try {
          await client.login('admin@example.com', 'wrongpassword');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toBe('Authentication failed');
        }
      });
    });
  });

  // ==========================================================================
  // Get User Contract
  // ==========================================================================

  describe('Get User', () => {
    describe('GET /api/users/:id', () => {
      it('should return a user by ID', async () => {
        await provider.addInteraction({
          state: 'user with ID 1 exists',
          uponReceiving: 'a request for user with ID 1',
          withRequest: {
            method: 'GET',
            path: '/api/users/1',
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              id: like(1),
              name: like('Alice Johnson'),
              email: term({
                generate: 'alice@example.com',
                matcher: '^[\\w\\-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
              }),
              role: term({
                generate: 'admin',
                matcher: '^(admin|user)$',
              }),
              createdAt: iso8601DateTime('2025-01-01T00:00:00Z'),
            },
          },
        });

        const user = await client.getUser('1', 'valid-token');

        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('createdAt');
        expect(user.email).toMatch(/^[\w\-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
        expect(['admin', 'user']).toContain(user.role);
      });

      it('should return 404 for non-existent user', async () => {
        await provider.addInteraction({
          state: 'user with ID 9999 does not exist',
          uponReceiving: 'a request for non-existent user',
          withRequest: {
            method: 'GET',
            path: '/api/users/9999',
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 404,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Not found',
              message: like('User with ID 9999 not found'),
            },
          },
        });

        try {
          await client.getUser('9999', 'valid-token');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(404);
          expect(error.response.data.error).toBe('Not found');
        }
      });

      it('should return 401 for missing authentication', async () => {
        await provider.addInteraction({
          state: 'user with ID 1 exists',
          uponReceiving: 'a request without authentication',
          withRequest: {
            method: 'GET',
            path: '/api/users/1',
            headers: {
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 401,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Unauthorized',
              message: like('Missing or invalid authorization header'),
            },
          },
        });

        try {
          // Create a modified client call without token
          await axios.get('http://localhost:1234/api/users/1', {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toBe('Unauthorized');
        }
      });
    });
  });

  // ==========================================================================
  // Get Users with Pagination Contract
  // ==========================================================================

  describe('Get Users', () => {
    describe('GET /api/users', () => {
      it('should return paginated users', async () => {
        await provider.addInteraction({
          state: 'users exist in the system',
          uponReceiving: 'a request for users with pagination',
          withRequest: {
            method: 'GET',
            path: '/api/users',
            query: {
              page: '1',
              limit: '10',
            },
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              users: eachLike(
                {
                  id: like(1),
                  name: like('Alice Johnson'),
                  email: like('alice@example.com'),
                  role: like('admin'),
                  createdAt: iso8601DateTime('2025-01-01T00:00:00Z'),
                },
                { min: 1 }
              ),
              pagination: {
                page: like(1),
                limit: like(10),
                total: like(3),
                totalPages: like(1),
                hasNextPage: like(false),
                hasPrevPage: like(false),
              },
            },
          },
        });

        const response = await client.getUsers({ page: 1, limit: 10 }, 'valid-token');

        expect(response).toHaveProperty('users');
        expect(response).toHaveProperty('pagination');
        expect(Array.isArray(response.users)).toBe(true);
        expect(response.users.length).toBeGreaterThan(0);
        expect(response.pagination).toHaveProperty('page');
        expect(response.pagination).toHaveProperty('limit');
        expect(response.pagination).toHaveProperty('total');
      });

      it('should filter users by role', async () => {
        await provider.addInteraction({
          state: 'users with role admin exist',
          uponReceiving: 'a request for users with role filter',
          withRequest: {
            method: 'GET',
            path: '/api/users',
            query: {
              role: 'admin',
            },
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              users: eachLike({
                id: like(1),
                name: like('Alice Johnson'),
                email: like('alice@example.com'),
                role: 'admin', // Fixed value for this filter
                createdAt: iso8601DateTime('2025-01-01T00:00:00Z'),
              }),
              pagination: like({
                page: 1,
                limit: 10,
                total: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
              }),
            },
          },
        });

        const response = await client.getUsers({ role: 'admin' }, 'valid-token');

        expect(response.users.every(user => user.role === 'admin')).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Create User Contract
  // ==========================================================================

  describe('Create User', () => {
    describe('POST /api/users', () => {
      it('should create a new user', async () => {
        await provider.addInteraction({
          state: 'no user exists with email newuser@example.com',
          uponReceiving: 'a request to create a new user',
          withRequest: {
            method: 'POST',
            path: '/api/users',
            headers: {
              Authorization: 'Bearer admin-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'New User',
              email: 'newuser@example.com',
              role: 'user',
            },
          },
          willRespondWith: {
            status: 201,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Location: like('/api/users/4'),
            },
            body: {
              id: like(4),
              name: 'New User',
              email: 'newuser@example.com',
              role: 'user',
              createdAt: iso8601DateTime('2025-01-01T00:00:00Z'),
            },
          },
        });

        const newUser = await client.createUser(
          {
            name: 'New User',
            email: 'newuser@example.com',
            role: 'user',
          },
          'admin-token'
        );

        expect(newUser).toHaveProperty('id');
        expect(newUser.name).toBe('New User');
        expect(newUser.email).toBe('newuser@example.com');
        expect(newUser.role).toBe('user');
        expect(newUser).toHaveProperty('createdAt');
      });

      it('should return 400 for invalid email', async () => {
        await provider.addInteraction({
          state: 'no user exists',
          uponReceiving: 'a request to create user with invalid email',
          withRequest: {
            method: 'POST',
            path: '/api/users',
            headers: {
              Authorization: 'Bearer admin-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'Test User',
              email: 'invalid-email',
            },
          },
          willRespondWith: {
            status: 400,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Validation error',
              message: like('One or more fields are invalid'),
              fields: {
                email: like('Invalid email format'),
              },
            },
          },
        });

        try {
          await client.createUser(
            {
              name: 'Test User',
              email: 'invalid-email',
            },
            'admin-token'
          );
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toBe('Validation error');
          expect(error.response.data.fields).toHaveProperty('email');
        }
      });

      it('should return 403 for non-admin user', async () => {
        await provider.addInteraction({
          state: 'authenticated user without admin role',
          uponReceiving: 'a request to create user from non-admin',
          withRequest: {
            method: 'POST',
            path: '/api/users',
            headers: {
              Authorization: 'Bearer user-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'New User',
              email: 'newuser@example.com',
            },
          },
          willRespondWith: {
            status: 403,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Forbidden',
              message: like('Access denied. Required role: admin'),
            },
          },
        });

        try {
          await client.createUser(
            {
              name: 'New User',
              email: 'newuser@example.com',
            },
            'user-token'
          );
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(403);
          expect(error.response.data.error).toBe('Forbidden');
        }
      });
    });
  });

  // ==========================================================================
  // Update User Contract
  // ==========================================================================

  describe('Update User', () => {
    describe('PATCH /api/users/:id', () => {
      it('should update user profile', async () => {
        await provider.addInteraction({
          state: 'user with ID 2 exists',
          uponReceiving: 'a request to update user profile',
          withRequest: {
            method: 'PATCH',
            path: '/api/users/2',
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'Updated Name',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              id: 2,
              name: 'Updated Name',
              email: like('bob@example.com'),
              role: like('user'),
              createdAt: iso8601DateTime('2025-01-02T00:00:00Z'),
              updatedAt: iso8601DateTime('2025-01-08T00:00:00Z'),
            },
          },
        });

        const updatedUser = await client.updateUser(
          '2',
          {
            name: 'Updated Name',
          },
          'valid-token'
        );

        expect(updatedUser.id).toBe(2);
        expect(updatedUser.name).toBe('Updated Name');
        expect(updatedUser).toHaveProperty('updatedAt');
      });

      it('should return 404 for non-existent user', async () => {
        await provider.addInteraction({
          state: 'user with ID 9999 does not exist',
          uponReceiving: 'a request to update non-existent user',
          withRequest: {
            method: 'PATCH',
            path: '/api/users/9999',
            headers: {
              Authorization: 'Bearer valid-token',
              'Content-Type': 'application/json',
            },
            body: {
              name: 'Test',
            },
          },
          willRespondWith: {
            status: 404,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Not found',
              message: like('User with ID 9999 not found'),
            },
          },
        });

        try {
          await client.updateUser('9999', { name: 'Test' }, 'valid-token');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(404);
        }
      });
    });
  });

  // ==========================================================================
  // Delete User Contract
  // ==========================================================================

  describe('Delete User', () => {
    describe('DELETE /api/users/:id', () => {
      it('should delete a user', async () => {
        await provider.addInteraction({
          state: 'user with ID 2 exists',
          uponReceiving: 'a request to delete user',
          withRequest: {
            method: 'DELETE',
            path: '/api/users/2',
            headers: {
              Authorization: 'Bearer admin-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 204,
          },
        });

        await client.deleteUser('2', 'admin-token');
        // No assertion needed for 204 response
      });

      it('should return 404 for non-existent user', async () => {
        await provider.addInteraction({
          state: 'user with ID 9999 does not exist',
          uponReceiving: 'a request to delete non-existent user',
          withRequest: {
            method: 'DELETE',
            path: '/api/users/9999',
            headers: {
              Authorization: 'Bearer admin-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 404,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Not found',
              message: like('User with ID 9999 not found'),
            },
          },
        });

        try {
          await client.deleteUser('9999', 'admin-token');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(404);
        }
      });

      it('should return 403 for non-admin user', async () => {
        await provider.addInteraction({
          state: 'user with ID 2 exists and authenticated user is not admin',
          uponReceiving: 'a request to delete user from non-admin',
          withRequest: {
            method: 'DELETE',
            path: '/api/users/2',
            headers: {
              Authorization: 'Bearer user-token',
              'Content-Type': 'application/json',
            },
          },
          willRespondWith: {
            status: 403,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
            },
            body: {
              error: 'Forbidden',
              message: like('Access denied. Required role: admin'),
            },
          },
        });

        try {
          await client.deleteUser('2', 'user-token');
          fail('Expected error to be thrown');
        } catch (error) {
          expect(error.response.status).toBe(403);
          expect(error.response.data.error).toBe('Forbidden');
        }
      });
    });
  });
});

// ============================================================================
// Provider Verification Tests
// ============================================================================

/**
 * Provider Verification
 *
 * These tests run on the provider side to verify that the provider
 * satisfies all the contracts defined by consumers.
 *
 * In a real scenario, this would be in a separate file in the provider's
 * codebase and would verify against the actual provider API.
 */

describe('Pact Provider Verification', () => {
  /**
   * This is a placeholder for provider verification.
   * In practice, you would use the Pact Verifier to:
   *
   * 1. Start your actual provider service
   * 2. Load the pact files generated by consumers
   * 3. Replay the requests against the provider
   * 4. Verify the responses match the contract
   *
   * Example provider verification setup:
   *
   * const { Verifier } = require('@pact-foundation/pact');
   *
   * const opts = {
   *   provider: 'UserServiceProvider',
   *   providerBaseUrl: 'http://localhost:3000',
   *   pactUrls: [path.resolve(process.cwd(), 'pacts', 'userserviceconsumer-userserviceprovider.json')],
   *   stateHandlers: {
   *     'user with ID 1 exists': () => {
   *       // Setup: Create user with ID 1 in database
   *       return Promise.resolve('User created');
   *     },
   *     'user with ID 9999 does not exist': () => {
   *       // Setup: Ensure user with ID 9999 doesn't exist
   *       return Promise.resolve('User removed');
   *     },
   *     // ... other state handlers
   *   }
   * };
   *
   * return new Verifier(opts).verifyProvider();
   */

  it('should verify all consumer contracts', () => {
    // Placeholder test
    expect(true).toBe(true);
  });
});

/**
 * Provider State Handlers
 *
 * State handlers are functions that set up the provider's state
 * before each interaction is verified.
 *
 * Example state handlers:
 *
 * const stateHandlers = {
 *   'user with ID 1 exists': async () => {
 *     await db.users.create({
 *       id: 1,
 *       name: 'Alice Johnson',
 *       email: 'alice@example.com',
 *       role: 'admin'
 *     });
 *   },
 *
 *   'user with ID 9999 does not exist': async () => {
 *     await db.users.deleteMany({ id: 9999 });
 *   },
 *
 *   'users exist in the system': async () => {
 *     await db.users.createMany([
 *       { id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
 *       { id: 2, name: 'Bob', email: 'bob@example.com', role: 'user' },
 *       { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' }
 *     ]);
 *   },
 *
 *   'no user exists with email newuser@example.com': async () => {
 *     await db.users.deleteMany({ email: 'newuser@example.com' });
 *   }
 * };
 */

/**
 * Best Practices for Contract Testing
 *
 * 1. **Consumer-Driven**: Consumers define what they need from the provider
 * 2. **Independent**: Tests should not depend on external services
 * 3. **State Management**: Use state handlers to set up provider state
 * 4. **Flexible Matching**: Use matchers (like, eachLike, term) for flexible matching
 * 5. **Version Control**: Store pact files in version control
 * 6. **Pact Broker**: Use a Pact Broker for sharing contracts between teams
 * 7. **CI/CD Integration**: Verify contracts in CI/CD pipeline
 * 8. **Breaking Changes**: Use can-i-deploy to prevent breaking changes
 *
 * Common Matchers:
 * - like(): Matches type, not exact value
 * - eachLike(): Matches array with elements of same type
 * - term(): Matches regex pattern
 * - iso8601DateTime(): Matches ISO 8601 datetime format
 * - integer(), decimal(), boolean(): Type-specific matchers
 */

/**
 * Publishing Contracts
 *
 * After generating pact files, publish them to a Pact Broker:
 *
 * const { Publisher } = require('@pact-foundation/pact');
 *
 * const opts = {
 *   pactFilesOrDirs: ['./pacts'],
 *   pactBroker: 'https://your-pact-broker.com',
 *   pactBrokerToken: 'your-token',
 *   consumerVersion: '1.0.0',
 *   tags: ['dev', 'feature-branch']
 * };
 *
 * new Publisher(opts).publishPacts();
 */

/**
 * Can I Deploy?
 *
 * Before deploying, check if it's safe:
 *
 * const { CanDeploy } = require('@pact-foundation/pact');
 *
 * const opts = {
 *   pactBroker: 'https://your-pact-broker.com',
 *   pactBrokerToken: 'your-token',
 *   participantName: 'UserServiceConsumer',
 *   participantVersion: '1.0.0',
 *   to: 'production'
 * };
 *
 * new CanDeploy(opts).canDeploy();
 */
