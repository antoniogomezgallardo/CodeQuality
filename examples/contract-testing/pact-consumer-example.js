/**
 * Pact Consumer Testing Example
 * Demonstrates how to create and verify consumer-driven contracts
 */

const { Pact } = require('@pact-foundation/pact');
const { like, eachLike, term } = require('@pact-foundation/pact').Matchers;
const path = require('path');
const UserService = require('../src/services/UserService');

describe('User Service Contract Tests', () => {
  let provider;
  let userService;

  beforeAll(async () => {
    // Setup Pact Provider Mock
    provider = new Pact({
      consumer: 'UserWebApp',
      provider: 'UserService',
      port: 1234,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'INFO',
      spec: 2
    });

    await provider.setup();
    userService = new UserService('http://localhost:1234');
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe('Get User by ID', () => {
    test('should return user when valid ID provided', async () => {
      // Setup the expected interaction
      const expectedUser = {
        id: 123,
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'admin',
        createdAt: '2023-01-15T10:30:00Z',
        isActive: true
      };

      await provider.addInteraction({
        state: 'user with ID 123 exists',
        uponReceiving: 'a request for user with ID 123',
        withRequest: {
          method: 'GET',
          path: '/api/users/123',
          headers: {
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: like(123),
            name: like('John Doe'),
            email: term({
              matcher: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              generate: 'john.doe@example.com'
            }),
            role: term({
              matcher: '^(admin|user|moderator)$',
              generate: 'admin'
            }),
            createdAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
              generate: '2023-01-15T10:30:00Z'
            }),
            isActive: like(true)
          }
        }
      });

      // Execute the consumer request
      const user = await userService.getUserById(123, 'Bearer token123');

      // Verify the response matches expectations
      expect(user).toBeDefined();
      expect(user.id).toBe(123);
      expect(user.name).toBe('John Doe');
      expect(user.email).toMatch(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
      expect(['admin', 'user', 'moderator']).toContain(user.role);
      expect(user.isActive).toBe(true);
    });

    test('should return 404 when user not found', async () => {
      await provider.addInteraction({
        state: 'user with ID 999 does not exist',
        uponReceiving: 'a request for non-existent user with ID 999',
        withRequest: {
          method: 'GET',
          path: '/api/users/999',
          headers: {
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: 'User not found',
            code: 'USER_NOT_FOUND',
            message: like('User with ID 999 does not exist')
          }
        }
      });

      await expect(userService.getUserById(999, 'Bearer token123'))
        .rejects.toThrow('User not found');
    });

    test('should return 401 when unauthorized', async () => {
      await provider.addInteraction({
        state: 'request without valid authentication',
        uponReceiving: 'a request without valid authorization header',
        withRequest: {
          method: 'GET',
          path: '/api/users/123',
          headers: {
            'Accept': 'application/json'
          }
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: 'Unauthorized',
            code: 'INVALID_TOKEN',
            message: like('Authentication token is required')
          }
        }
      });

      await expect(userService.getUserById(123))
        .rejects.toThrow('Unauthorized');
    });
  });

  describe('Get Users List', () => {
    test('should return paginated users list', async () => {
      await provider.addInteraction({
        state: 'users exist in the system',
        uponReceiving: 'a request for users list with pagination',
        withRequest: {
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '10',
            sort: 'name'
          },
          headers: {
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            users: eachLike({
              id: like(1),
              name: like('John Doe'),
              email: term({
                matcher: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                generate: 'user@example.com'
              }),
              role: term({
                matcher: '^(admin|user|moderator)$',
                generate: 'user'
              }),
              isActive: like(true)
            }, { min: 1 }),
            pagination: {
              page: like(1),
              limit: like(10),
              total: like(50),
              totalPages: like(5),
              hasNext: like(true),
              hasPrev: like(false)
            }
          }
        }
      });

      const result = await userService.getUsers({
        page: 1,
        limit: 10,
        sort: 'name'
      }, 'Bearer token123');

      expect(result.users).toBeDefined();
      expect(Array.isArray(result.users)).toBe(true);
      expect(result.users.length).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('Create User', () => {
    test('should create new user successfully', async () => {
      const newUser = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'user'
      };

      await provider.addInteraction({
        state: 'system is ready to create users',
        uponReceiving: 'a request to create a new user',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: {
            name: like('Jane Smith'),
            email: term({
              matcher: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
              generate: 'jane.smith@example.com'
            }),
            role: term({
              matcher: '^(admin|user|moderator)$',
              generate: 'user'
            })
          }
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Location': like('/api/users/124')
          },
          body: {
            id: like(124),
            name: like('Jane Smith'),
            email: like('jane.smith@example.com'),
            role: like('user'),
            createdAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
              generate: '2023-01-15T10:30:00Z'
            }),
            isActive: like(true)
          }
        }
      });

      const createdUser = await userService.createUser(newUser, 'Bearer token123');

      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe('Jane Smith');
      expect(createdUser.email).toBe('jane.smith@example.com');
      expect(createdUser.role).toBe('user');
      expect(createdUser.isActive).toBe(true);
    });

    test('should return validation error for invalid email', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid-email',
        role: 'user'
      };

      await provider.addInteraction({
        state: 'system validates user input',
        uponReceiving: 'a request to create user with invalid email',
        withRequest: {
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: invalidUser
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: 'Validation Error',
            code: 'VALIDATION_FAILED',
            message: like('Invalid email format'),
            details: {
              field: 'email',
              value: 'invalid-email',
              constraint: 'must be a valid email address'
            }
          }
        }
      });

      await expect(userService.createUser(invalidUser, 'Bearer token123'))
        .rejects.toThrow('Validation Error');
    });
  });

  describe('Update User', () => {
    test('should update user successfully', async () => {
      const updateData = {
        name: 'John Updated',
        role: 'moderator'
      };

      await provider.addInteraction({
        state: 'user with ID 123 exists and can be updated',
        uponReceiving: 'a request to update user with ID 123',
        withRequest: {
          method: 'PUT',
          path: '/api/users/123',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': like('Bearer token123')
          },
          body: updateData
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: like(123),
            name: like('John Updated'),
            email: like('john.doe@example.com'),
            role: like('moderator'),
            createdAt: like('2023-01-15T10:30:00Z'),
            updatedAt: term({
              matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$',
              generate: '2023-01-15T11:30:00Z'
            }),
            isActive: like(true)
          }
        }
      });

      const updatedUser = await userService.updateUser(123, updateData, 'Bearer token123');

      expect(updatedUser).toBeDefined();
      expect(updatedUser.id).toBe(123);
      expect(updatedUser.name).toBe('John Updated');
      expect(updatedUser.role).toBe('moderator');
      expect(updatedUser.updatedAt).toBeDefined();
    });
  });

  describe('Delete User', () => {
    test('should delete user successfully', async () => {
      await provider.addInteraction({
        state: 'user with ID 123 exists and can be deleted',
        uponReceiving: 'a request to delete user with ID 123',
        withRequest: {
          method: 'DELETE',
          path: '/api/users/123',
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 204
        }
      });

      await expect(userService.deleteUser(123, 'Bearer token123'))
        .resolves.toBeUndefined();
    });

    test('should return 404 when trying to delete non-existent user', async () => {
      await provider.addInteraction({
        state: 'user with ID 999 does not exist',
        uponReceiving: 'a request to delete non-existent user with ID 999',
        withRequest: {
          method: 'DELETE',
          path: '/api/users/999',
          headers: {
            'Authorization': like('Bearer token123')
          }
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            error: 'User not found',
            code: 'USER_NOT_FOUND',
            message: like('User with ID 999 does not exist')
          }
        }
      });

      await expect(userService.deleteUser(999, 'Bearer token123'))
        .rejects.toThrow('User not found');
    });
  });
});

/**
 * Helper function to validate Pact contract after all tests
 * This should be run in a separate test or CI step
 */
async function publishPact() {
  const pact = require('@pact-foundation/pact-node');

  const opts = {
    pactFilesOrDirs: [path.resolve(process.cwd(), 'pacts')],
    pactBroker: 'https://your-pact-broker.com',
    pactBrokerToken: process.env.PACT_BROKER_TOKEN,
    consumerVersion: process.env.GIT_COMMIT || '1.0.0',
    tags: ['main', 'production']
  };

  return pact.publishPacts(opts);
}

module.exports = { publishPact };