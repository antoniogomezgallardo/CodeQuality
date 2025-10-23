# Integration Testing

## Purpose

Comprehensive guide to integration testing—verifying that different modules, services, and systems work together correctly.

## Overview

Integration testing:

- Tests interactions between components
- Verifies interfaces and data flow
- Catches integration issues early
- Validates system behavior
- Bridges unit and system testing

## What is Integration Testing?

### Definition

Integration testing verifies that multiple units or components work together correctly as a group, focusing on the interfaces and interactions between them.

### Characteristics

```
Integration Tests:

Scope
├── Multiple components
├── Real dependencies (some)
├── External services
└── Data persistence

Speed
├── Slower than unit tests
├── Faster than E2E tests
├── Seconds, not milliseconds
└── Acceptable for CI/CD

Complexity
├── More setup required
├── Real or test databases
├── API interactions
└── Service dependencies
```

### Testing Pyramid Position

```
         ╱╲
        ╱E2E╲
       ╱────╲
      ╱      ╲
     ╱ Integ  ╲      ← Integration Tests
    ╱  Tests  ╲        15% of total tests
   ╱────────────╲      Verify component interactions
  ╱  Unit Tests ╲
 ╱              ╲
└──────────────────┘
```

## Types of Integration Testing

### 1. Big Bang Integration

**Approach:** Test all components together at once

```
Component A ─┐
Component B ─┼─→ Integration Test
Component C ─┘

Pros:
✅ Quick to setup initially
✅ Tests entire system

Cons:
❌ Hard to isolate failures
❌ Late defect detection
❌ Complex debugging
```

### 2. Top-Down Integration

**Approach:** Test from top-level components down

```
Controller (Real)
    ↓
Service (Real)
    ↓
Repository (Stub)
    ↓
Database (Stub)

Pros:
✅ Early UI testing
✅ Matches user flow
✅ Critical paths tested first

Cons:
❌ Requires many stubs
❌ Lower-level issues found late
```

### 3. Bottom-Up Integration

**Approach:** Test from lower-level components up

```
Database (Real)
    ↑
Repository (Real)
    ↑
Service (Real)
    ↑
Controller (Driver)

Pros:
✅ Foundation solid first
✅ Fewer stubs needed
✅ Early infrastructure testing

Cons:
❌ UI tested last
❌ Integration issues found late
```

### 4. Sandwich/Hybrid Integration

**Approach:** Combine top-down and bottom-up

```
    Controller (Real)
         ↓
    Service (Real)
         ↓
    Repository (Real)
         ↓
    Database (Real)

Test both directions simultaneously

Pros:
✅ Balanced approach
✅ Parallel testing
✅ Faster feedback

Cons:
❌ More complex coordination
❌ Resource intensive
```

## API Integration Testing

### REST API Testing

```javascript
// Using Supertest with Express
import request from 'supertest';
import app from './app';
import { setupDatabase, teardownDatabase } from './test-helpers';

describe('User API Integration', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const response = await request(app).post('/api/users').send(userData).expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: userData.name,
        email: userData.email,
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      const response = await request(app).post('/api/users').send(userData).expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        name: 'Jane Doe',
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      // Create first user
      await request(app).post('/api/users').send(userData).expect(201);

      // Try to create duplicate
      const response = await request(app).post('/api/users').send(userData).expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user first
      const createResponse = await request(app).post('/api/users').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Pass123!',
      });

      const userId = createResponse.body.id;

      // Retrieve user
      const response = await request(app).get(`/api/users/${userId}`).expect(200);

      expect(response.body).toMatchObject({
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/99999').expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const createResponse = await request(app).post('/api/users').send({
        name: 'Original Name',
        email: 'original@example.com',
        password: 'Pass123!',
      });

      const userId = createResponse.body.id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.email).toBe('original@example.com');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const createResponse = await request(app).post('/api/users').send({
        name: 'To Delete',
        email: 'delete@example.com',
        password: 'Pass123!',
      });

      const userId = createResponse.body.id;

      await request(app).delete(`/api/users/${userId}`).expect(204);

      await request(app).get(`/api/users/${userId}`).expect(404);
    });
  });
});
```

### GraphQL API Testing

```javascript
import { ApolloServer } from '@apollo/server';
import { typeDefs, resolvers } from './schema';
import { createTestClient } from 'apollo-server-testing';

describe('GraphQL API Integration', () => {
  let server;
  let query;
  let mutate;

  beforeAll(() => {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: () => ({ db: testDatabase }),
    });

    const testClient = createTestClient(server);
    query = testClient.query;
    mutate = testClient.mutate;
  });

  describe('User Queries', () => {
    it('should fetch user by id', async () => {
      const GET_USER = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }
      `;

      const result = await query({
        query: GET_USER,
        variables: { id: '1' },
      });

      expect(result.data.user).toMatchObject({
        id: '1',
        name: expect.any(String),
        email: expect.any(String),
      });
    });

    it('should fetch all users', async () => {
      const GET_USERS = `
        query GetUsers {
          users {
            id
            name
            email
          }
        }
      `;

      const result = await query({ query: GET_USERS });

      expect(result.data.users).toBeInstanceOf(Array);
      expect(result.data.users.length).toBeGreaterThan(0);
    });
  });

  describe('User Mutations', () => {
    it('should create user', async () => {
      const CREATE_USER = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            id
            name
            email
          }
        }
      `;

      const result = await mutate({
        mutation: CREATE_USER,
        variables: {
          input: {
            name: 'New User',
            email: 'new@example.com',
            password: 'SecurePass123!',
          },
        },
      });

      expect(result.data.createUser).toMatchObject({
        id: expect.any(String),
        name: 'New User',
        email: 'new@example.com',
      });
    });
  });
});
```

## Database Integration Testing

### Setup Test Database

```javascript
// test-helpers.js
import { Pool } from 'pg';
import { migrate } from './migrations';

let pool;

export async function setupDatabase() {
  // Create test database connection
  pool = new Pool({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    database: process.env.TEST_DB_NAME || 'test_db',
    user: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
  });

  // Run migrations
  await migrate(pool);

  return pool;
}

export async function teardownDatabase() {
  if (pool) {
    // Clean up all tables
    await pool.query('TRUNCATE TABLE users, orders, products CASCADE');
    await pool.end();
  }
}

export async function resetDatabase() {
  await pool.query('TRUNCATE TABLE users, orders, products CASCADE');
}

export function getPool() {
  return pool;
}
```

### Repository Integration Tests

```javascript
import { UserRepository } from './userRepository';
import { setupDatabase, teardownDatabase, resetDatabase } from './test-helpers';

describe('UserRepository Integration', () => {
  let repository;

  beforeAll(async () => {
    const pool = await setupDatabase();
    repository = new UserRepository(pool);
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  describe('create', () => {
    it('should insert user into database', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        passwordHash: 'hashed_password',
      };

      const user = await repository.create(userData);

      expect(user).toMatchObject({
        id: expect.any(Number),
        name: userData.name,
        email: userData.email,
        createdAt: expect.any(Date),
      });
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'duplicate@example.com',
        passwordHash: 'hashed',
      };

      await repository.create(userData);

      await expect(repository.create(userData)).rejects.toThrow('duplicate key');
    });
  });

  describe('findById', () => {
    it('should retrieve user by id', async () => {
      const created = await repository.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        passwordHash: 'hashed',
      });

      const found = await repository.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        name: 'Jane Doe',
        email: 'jane@example.com',
      });
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await repository.create({
        name: 'Original',
        email: 'original@example.com',
        passwordHash: 'hashed',
      });

      const updated = await repository.update(user.id, {
        name: 'Updated',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.email).toBe('original@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      await repository.create({
        name: 'Search Test',
        email: 'search@example.com',
        passwordHash: 'hashed',
      });

      const found = await repository.findByEmail('search@example.com');

      expect(found).toMatchObject({
        name: 'Search Test',
        email: 'search@example.com',
      });
    });

    it('should be case-insensitive', async () => {
      await repository.create({
        name: 'Case Test',
        email: 'CaSe@ExAmPle.com',
        passwordHash: 'hashed',
      });

      const found = await repository.findByEmail('case@example.com');
      expect(found).toBeTruthy();
    });
  });

  describe('transactions', () => {
    it('should rollback on error', async () => {
      const client = await repository.pool.connect();

      try {
        await client.query('BEGIN');

        await repository.create(
          {
            name: 'Transaction Test',
            email: 'transaction@example.com',
            passwordHash: 'hashed',
          },
          client
        );

        // Force an error
        throw new Error('Simulated error');

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
      } finally {
        client.release();
      }

      // Verify user was not created
      const found = await repository.findByEmail('transaction@example.com');
      expect(found).toBeNull();
    });
  });
});
```

## External Service Integration

### HTTP Client Testing

```javascript
import axios from 'axios';
import nock from 'nock';
import { PaymentService } from './paymentService';

describe('PaymentService Integration', () => {
  let paymentService;

  beforeAll(() => {
    paymentService = new PaymentService({
      apiKey: 'test_key',
      baseUrl: 'https://api.payment-provider.com',
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('processPayment', () => {
    it('should process successful payment', async () => {
      // Mock external API
      nock('https://api.payment-provider.com').post('/charges').reply(200, {
        id: 'ch_123',
        status: 'succeeded',
        amount: 1000,
      });

      const result = await paymentService.processPayment({
        amount: 1000,
        currency: 'usd',
        token: 'tok_visa',
      });

      expect(result).toMatchObject({
        id: 'ch_123',
        status: 'succeeded',
        amount: 1000,
      });
    });

    it('should handle declined payment', async () => {
      nock('https://api.payment-provider.com')
        .post('/charges')
        .reply(402, {
          error: {
            code: 'card_declined',
            message: 'Your card was declined',
          },
        });

      await expect(
        paymentService.processPayment({
          amount: 1000,
          currency: 'usd',
          token: 'tok_declined',
        })
      ).rejects.toThrow('card was declined');
    });

    it('should retry on network error', async () => {
      nock('https://api.payment-provider.com')
        .post('/charges')
        .replyWithError('Network error')
        .post('/charges')
        .reply(200, {
          id: 'ch_retry',
          status: 'succeeded',
        });

      const result = await paymentService.processPayment({
        amount: 1000,
        currency: 'usd',
        token: 'tok_visa',
      });

      expect(result.id).toBe('ch_retry');
    });
  });

  describe('refundPayment', () => {
    it('should process refund', async () => {
      nock('https://api.payment-provider.com').post('/refunds').reply(200, {
        id: 're_123',
        charge: 'ch_123',
        status: 'succeeded',
        amount: 1000,
      });

      const result = await paymentService.refundPayment('ch_123');

      expect(result).toMatchObject({
        id: 're_123',
        status: 'succeeded',
      });
    });
  });
});
```

### Message Queue Integration

```javascript
import { Consumer } from 'sqs-consumer';
import { OrderProcessor } from './orderProcessor';
import { setupQueue, cleanupQueue } from './test-helpers';

describe('Order Processing Integration', () => {
  let queue;
  let processor;

  beforeAll(async () => {
    queue = await setupQueue('test-orders-queue');
    processor = new OrderProcessor(queue);
  });

  afterAll(async () => {
    await cleanupQueue(queue);
  });

  it('should process order message', async () => {
    const orderMessage = {
      orderId: '123',
      items: [{ productId: 'p1', quantity: 2, price: 10 }],
      totalAmount: 20,
    };

    // Send message to queue
    await queue
      .sendMessage({
        MessageBody: JSON.stringify(orderMessage),
      })
      .promise();

    // Start processor
    await processor.start();

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify order was processed
    const processedOrder = await processor.getProcessedOrder('123');
    expect(processedOrder.status).toBe('completed');

    await processor.stop();
  });
});
```

## Service Integration Testing

### Microservices Integration

```javascript
import { UserService } from './userService';
import { EmailService } from './emailService';
import { AuditService } from './auditService';
import { setupServices, teardownServices } from './test-helpers';

describe('User Registration Integration', () => {
  let userService;
  let emailService;
  let auditService;

  beforeAll(async () => {
    const services = await setupServices();
    userService = services.userService;
    emailService = services.emailService;
    auditService = services.auditService;
  });

  afterAll(async () => {
    await teardownServices();
  });

  it('should complete full registration flow', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
    };

    // Register user
    const user = await userService.register(userData);

    // Verify user created
    expect(user).toMatchObject({
      id: expect.any(String),
      name: userData.name,
      email: userData.email,
      status: 'pending',
    });

    // Verify email sent
    const emails = await emailService.getSentEmails();
    expect(emails).toContainEqual(
      expect.objectContaining({
        to: userData.email,
        subject: expect.stringContaining('Welcome'),
      })
    );

    // Verify audit log created
    const auditLogs = await auditService.getLogsByEntity('user', user.id);
    expect(auditLogs).toContainEqual(
      expect.objectContaining({
        action: 'user.registered',
        userId: user.id,
      })
    );
  });

  it('should handle registration failures gracefully', async () => {
    // Simulate email service failure
    await emailService.simulateFailure();

    const userData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'SecurePass123!',
    };

    const user = await userService.register(userData);

    // User should still be created but marked appropriately
    expect(user.emailVerificationStatus).toBe('pending_retry');

    // Verify retry scheduled
    const retries = await emailService.getScheduledRetries();
    expect(retries).toContainEqual(
      expect.objectContaining({
        email: userData.email,
      })
    );

    await emailService.resetSimulation();
  });
});
```

## Test Containers

### Docker-based Integration Tests

```javascript
import { GenericContainer } from 'testcontainers';
import { Pool } from 'pg';

describe('Database Integration with TestContainers', () => {
  let container;
  let pool;

  beforeAll(async () => {
    // Start PostgreSQL container
    container = await new GenericContainer('postgres:14')
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432)
      .start();

    // Connect to database
    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'testdb',
      user: 'test',
      password: 'test',
    });

    // Run migrations
    await runMigrations(pool);
  }, 60000); // Increased timeout for container startup

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  it('should perform database operations', async () => {
    const result = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [
      'Test User',
      'test@example.com',
    ]);

    expect(result.rows[0]).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
    });
  });
});
```

## Best Practices

### 1. Test Data Management

```javascript
// Use factories for consistent test data
class UserFactory {
  static build(overrides = {}) {
    return {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      passwordHash: 'hashed_password',
      createdAt: new Date(),
      ...overrides,
    };
  }

  static async create(repository, overrides = {}) {
    const userData = this.build(overrides);
    return await repository.create(userData);
  }
}

// Usage in tests
it('should update user email', async () => {
  const user = await UserFactory.create(repository, {
    email: 'original@example.com',
  });

  await userService.updateEmail(user.id, 'new@example.com');

  const updated = await repository.findById(user.id);
  expect(updated.email).toBe('new@example.com');
});
```

### 2. Test Isolation

```javascript
// Each test starts with clean state
describe('Order Service Integration', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedRequiredData();
  });

  it('test 1', async () => {
    // Test runs with fresh data
  });

  it('test 2', async () => {
    // Independent of test 1
  });
});
```

### 3. Use Transactions for Speed

```javascript
describe('Fast Integration Tests', () => {
  let transaction;

  beforeEach(async () => {
    transaction = await db.transaction();
  });

  afterEach(async () => {
    await transaction.rollback();
  });

  it('should create order', async () => {
    const order = await orderService.create(orderData, { transaction });
    expect(order.id).toBeDefined();
    // Rolls back automatically after test
  });
});
```

## Common Pitfalls

```javascript
// ❌ Don't test too much in one test
it('should do everything', async () => {
  // Creates user
  // Updates profile
  // Adds orders
  // Sends emails
  // 100 lines of code
});

// ✅ Break into focused tests
describe('User Order Flow', () => {
  it('should create user account', async () => {
    const user = await userService.register(userData);
    expect(user.id).toBeDefined();
  });

  it('should create order for user', async () => {
    const user = await UserFactory.create(repository);
    const order = await orderService.create(user.id, orderData);
    expect(order.userId).toBe(user.id);
  });
});

// ❌ Don't use production database
process.env.DATABASE_URL = 'postgres://prod-server/prod-db';

// ✅ Use dedicated test database
process.env.DATABASE_URL = 'postgres://localhost/test-db';

// ❌ Don't leave test data
afterAll(async () => {
  // Test finishes, data remains
});

// ✅ Clean up after tests
afterAll(async () => {
  await cleanDatabase();
  await closeConnections();
});
```

## Checklist

### Integration Test Quality Checklist

**Setup:**

- [ ] Test database configured
- [ ] Test data factories created
- [ ] Cleanup procedures defined
- [ ] Test containers ready (if needed)

**Test Design:**

- [ ] Tests real integrations
- [ ] Minimal mocking
- [ ] Tests complete workflows
- [ ] Proper isolation
- [ ] Fast enough for CI

**Coverage:**

- [ ] Happy paths tested
- [ ] Error scenarios covered
- [ ] Edge cases included
- [ ] Transaction behavior verified

**Maintenance:**

- [ ] Tests are reliable
- [ ] No flakiness
- [ ] Easy to debug
- [ ] Clear failure messages

## References

### Books

- "Growing Object-Oriented Software, Guided by Tests" - Freeman & Pryce
- "Continuous Delivery" - Jez Humble & David Farley

### Tools

- **API Testing**: Supertest, REST-assured, Postman
- **Test Containers**: Testcontainers, Docker Compose
- **Database**: pg, mysql2, mongoose
- **Mocking**: nock, MSW, WireMock

## Related Topics

- [Unit Testing](unit-testing.md)
- [Component Testing](component-testing.md)
- [Contract Testing](contract-testing.md)
- [System Testing](system-testing.md)

---

_Part of: [Test Levels](README.md)_
