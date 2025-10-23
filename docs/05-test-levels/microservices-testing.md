# Microservices Testing

## Purpose

Comprehensive guide to testing microservices architectures—addressing the unique challenges of distributed systems through effective testing strategies at multiple levels.

## Overview

Microservices testing is:

- Testing distributed, independent services
- Validating service boundaries and contracts
- Ensuring system resilience and fault tolerance
- Testing asynchronous communication
- Critical for maintaining service independence

## What is Microservices Testing?

### Definition

Microservices testing validates individual services in isolation and their interactions within a distributed system, ensuring each service functions correctly independently and as part of the larger ecosystem.

### Microservices Testing Challenges

```
Traditional Monolith vs Microservices Testing:

Monolithic Application          Microservices Architecture
┌─────────────────┐            ┌────┐ ┌────┐ ┌────┐
│                 │            │ S1 │─│ S2 │─│ S3 │
│   All in One   │            └────┘ └────┘ └────┘
│                 │               │     │     │
└─────────────────┘            ┌────┐ ┌────┐ ┌────┐
       │                       │ S4 │─│ S5 │─│ S6 │
   Simple Testing              └────┘ └────┘ └────┘
                                  Complex Testing

Microservices Challenges:
├── Network unreliability
├── Service dependencies
├── Asynchronous communication
├── Data consistency
├── Distributed transactions
├── Service versioning
├── Environment complexity
└── Observability
```

### Testing Pyramid for Microservices

```
           ╱╲
          ╱E2E╲         End-to-End Tests (5%)
         ╱────╲         Full system, slow
        ╱      ╲
       ╱Contract╲       Contract Tests (15%)
      ╱  Tests  ╲       Service boundaries
     ╱──────────╲
    ╱            ╲      Integration Tests (30%)
   ╱ Integration ╲      Service interactions
  ╱────────────────╱
 ╱                ╲     Unit Tests (50%)
╱   Unit Tests    ╱     Service logic
└──────────────────┘

Focus: Maximize unit and contract tests,
       minimize E2E tests
```

## Service Isolation Testing

### Unit Testing Within Services

```javascript
// services/user-service/__tests__/user-service.test.js
const UserService = require('../user-service');

describe('UserService', () => {
  let userService;
  let mockRepository;
  let mockEventBus;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
    };

    userService = new UserService(mockRepository, mockEventBus);
  });

  describe('createUser', () => {
    it('should create user and publish event', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const savedUser = { id: 1, ...userData };
      mockRepository.save.mockResolvedValue(savedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
      expect(mockEventBus.publish).toHaveBeenCalledWith('user.created', {
        userId: savedUser.id,
        email: savedUser.email,
      });
      expect(result).toEqual(savedUser);
    });

    it('should not publish event if save fails', async () => {
      // Arrange
      const userData = { name: 'John Doe', email: 'john@example.com' };
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow('Database error');

      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update user and publish event', async () => {
      // Arrange
      const userId = 1;
      const existingUser = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      const updateData = { name: 'John Smith' };

      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.save.mockResolvedValue({
        ...existingUser,
        ...updateData,
      });

      // Act
      const result = await userService.updateUser(userId, updateData);

      // Assert
      expect(result.name).toBe('John Smith');
      expect(mockEventBus.publish).toHaveBeenCalledWith('user.updated', {
        userId,
        changes: updateData,
      });
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser(999, { name: 'Test' })).rejects.toThrow('User not found');

      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user and publish event', async () => {
      // Arrange
      const userId = 1;
      mockRepository.findById.mockResolvedValue({ id: userId });
      mockRepository.delete.mockResolvedValue(true);

      // Act
      await userService.deleteUser(userId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(userId);
      expect(mockEventBus.publish).toHaveBeenCalledWith('user.deleted', {
        userId,
      });
    });
  });
});
```

### API Testing for Individual Services

```javascript
// services/user-service/__tests__/api/user-api.test.js
const request = require('supertest');
const { createApp } = require('../../app');
const { setupTestDatabase, clearDatabase } = require('../helpers/db');

describe('User Service API', () => {
  let app;
  let db;

  beforeAll(async () => {
    db = await setupTestDatabase();
    app = createApp(db);
  });

  afterAll(async () => {
    await db.close();
  });

  beforeEach(async () => {
    await clearDatabase(db);
  });

  describe('POST /users', () => {
    it('should create user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      const response = await request(app).post('/users').send(userData).expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(response.body.password).toBeUndefined();
    });

    it('should validate email uniqueness', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      await request(app).post('/users').send(userData).expect(201);

      const response = await request(app).post('/users').send(userData).expect(409);

      expect(response.body.error).toContain('Email already exists');
    });
  });

  describe('GET /users/:id', () => {
    it('should return user by id', async () => {
      const user = await db.users.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await request(app).get(`/users/${user.id}`).expect(200);

      expect(response.body.id).toBe(user.id);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).get('/users/99999').expect(404);
    });
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'user-service',
        timestamp: expect.any(String),
        dependencies: {
          database: 'healthy',
        },
      });
    });
  });
});
```

## Contract Testing

### Consumer-Driven Contract Testing with Pact

#### Consumer Side (Order Service)

```javascript
// services/order-service/__tests__/contracts/user-service-consumer.test.js
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, eachLike } = MatchersV3;
const UserServiceClient = require('../../clients/user-service-client');

describe('Order Service -> User Service Contract', () => {
  const provider = new PactV3({
    consumer: 'OrderService',
    provider: 'UserService',
    dir: './pacts',
  });

  describe('getUserById', () => {
    it('should get user details for order', async () => {
      await provider
        .given('user 1 exists')
        .uponReceiving('a request for user 1')
        .withRequest({
          method: 'GET',
          path: '/users/1',
          headers: {
            Accept: 'application/json',
            Authorization: like('Bearer token123'),
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: 1,
            name: like('John Doe'),
            email: like('john@example.com'),
            status: like('active'),
          },
        })
        .executeTest(async mockServer => {
          const client = new UserServiceClient(mockServer.url, 'token123');
          const user = await client.getUserById(1);

          expect(user).toMatchObject({
            id: 1,
            name: expect.any(String),
            email: expect.any(String),
            status: expect.any(String),
          });
        });
    });

    it('should handle user not found', async () => {
      await provider
        .given('user 999 does not exist')
        .uponReceiving('a request for user 999')
        .withRequest({
          method: 'GET',
          path: '/users/999',
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: like('User not found'),
          },
        })
        .executeTest(async mockServer => {
          const client = new UserServiceClient(mockServer.url);

          await expect(client.getUserById(999)).rejects.toThrow('User not found');
        });
    });
  });

  describe('validateUser', () => {
    it('should validate user status', async () => {
      await provider
        .given('user 1 is active')
        .uponReceiving('a request to validate user 1')
        .withRequest({
          method: 'POST',
          path: '/users/1/validate',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            valid: true,
            userId: 1,
            status: 'active',
          },
        })
        .executeTest(async mockServer => {
          const client = new UserServiceClient(mockServer.url);
          const validation = await client.validateUser(1);

          expect(validation.valid).toBe(true);
          expect(validation.userId).toBe(1);
        });
    });
  });
});
```

#### Provider Side (User Service)

```javascript
// services/user-service/__tests__/contracts/provider-verification.test.js
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const { createApp } = require('../../app');
const { setupTestDatabase, clearDatabase } = require('../helpers/db');

describe('User Service Provider Verification', () => {
  let server;
  let db;

  beforeAll(async () => {
    db = await setupTestDatabase();
    const app = createApp(db);
    server = app.listen(9000);
  });

  afterAll(async () => {
    server.close();
    await db.close();
  });

  it('should validate contracts from all consumers', async () => {
    const opts = {
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:9000',

      // Pact Broker configuration
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT,

      // State handlers for different scenarios
      stateHandlers: {
        'user 1 exists': async () => {
          await clearDatabase(db);
          await db.users.create({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            status: 'active',
          });
        },
        'user 999 does not exist': async () => {
          await clearDatabase(db);
        },
        'user 1 is active': async () => {
          await clearDatabase(db);
          await db.users.create({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            status: 'active',
          });
        },
      },

      // Request filters
      requestFilter: (req, res, next) => {
        // Add authentication token for protected endpoints
        if (req.headers.authorization) {
          req.headers.authorization = 'Bearer valid-test-token';
        }
        next();
      },
    };

    const verifier = new Verifier(opts);
    await verifier.verifyProvider();
  });
});
```

## Integration Testing Between Services

### Testing Service-to-Service Communication

```javascript
// __tests__/integration/order-user-integration.test.js
const request = require('supertest');
const { startUserService, stopUserService } = require('../helpers/user-service');
const { createApp } = require('../../services/order-service/app');

describe('Order Service -> User Service Integration', () => {
  let userServiceUrl;
  let orderApp;

  beforeAll(async () => {
    // Start real user service for integration testing
    userServiceUrl = await startUserService();
    orderApp = createApp({ userServiceUrl });
  });

  afterAll(async () => {
    await stopUserService();
  });

  describe('Create Order Flow', () => {
    it('should create order with valid user', async () => {
      // Create user in user service
      const userResponse = await request(userServiceUrl).post('/users').send({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const userId = userResponse.body.id;

      // Create order in order service
      const orderResponse = await request(orderApp)
        .post('/orders')
        .send({
          userId,
          items: [{ productId: 1, quantity: 2, price: 100 }],
        })
        .expect(201);

      expect(orderResponse.body).toMatchObject({
        id: expect.any(Number),
        userId,
        total: 200,
        status: 'pending',
      });
    });

    it('should reject order for non-existent user', async () => {
      const response = await request(orderApp)
        .post('/orders')
        .send({
          userId: 99999,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid user');
    });

    it('should handle user service timeout gracefully', async () => {
      // Simulate user service delay
      await stopUserService();

      const response = await request(orderApp)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(503);

      expect(response.body.error).toContain('User service unavailable');

      // Restart service
      await startUserService();
    });
  });

  describe('Order Validation Flow', () => {
    it('should validate user status before creating order', async () => {
      // Create suspended user
      const userResponse = await request(userServiceUrl).post('/users').send({
        name: 'Suspended User',
        email: 'suspended@example.com',
        status: 'suspended',
      });

      const response = await request(orderApp)
        .post('/orders')
        .send({
          userId: userResponse.body.id,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(403);

      expect(response.body.error).toContain('User account suspended');
    });
  });
});
```

### Testing with Service Virtualization

```javascript
// __tests__/integration/with-mocks/order-service.test.js
const request = require('supertest');
const nock = require('nock');
const { createApp } = require('../../services/order-service/app');

describe('Order Service with Service Virtualization', () => {
  let app;
  const userServiceUrl = 'http://user-service';
  const paymentServiceUrl = 'http://payment-service';

  beforeAll(() => {
    app = createApp({
      userServiceUrl,
      paymentServiceUrl,
    });
  });

  beforeEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  describe('Complete Order Flow', () => {
    it('should process order successfully', async () => {
      // Mock user service
      nock(userServiceUrl).get('/users/1').reply(200, {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
      });

      // Mock payment service
      nock(paymentServiceUrl).post('/payments').reply(200, {
        transactionId: 'txn_123',
        status: 'completed',
        amount: 200,
      });

      // Create order
      const response = await request(app)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 2, price: 100 }],
          paymentMethod: 'credit_card',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        status: 'completed',
        paymentStatus: 'paid',
        transactionId: 'txn_123',
      });
    });

    it('should handle payment failure', async () => {
      // Mock user service
      nock(userServiceUrl).get('/users/1').reply(200, {
        id: 1,
        name: 'John Doe',
        status: 'active',
      });

      // Mock payment service failure
      nock(paymentServiceUrl).post('/payments').reply(400, {
        error: 'Insufficient funds',
      });

      const response = await request(app)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
          paymentMethod: 'credit_card',
        })
        .expect(400);

      expect(response.body.error).toContain('Payment failed');
    });

    it('should handle service unavailability', async () => {
      // Mock user service timeout
      nock(userServiceUrl).get('/users/1').delayConnection(5000).reply(200, {});

      const response = await request(app)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(503);

      expect(response.body.error).toContain('Service unavailable');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed service calls', async () => {
      // First call fails, second succeeds
      nock(userServiceUrl)
        .get('/users/1')
        .reply(500, { error: 'Internal error' })
        .get('/users/1')
        .reply(200, {
          id: 1,
          name: 'John Doe',
          status: 'active',
        });

      nock(paymentServiceUrl).post('/payments').reply(200, {
        transactionId: 'txn_123',
        status: 'completed',
      });

      const response = await request(app)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(201);

      expect(response.body.status).toBe('completed');
    });
  });
});
```

## Testing Asynchronous Communication

### Event-Driven Testing with Message Queues

```javascript
// __tests__/integration/event-driven/user-events.test.js
const { createConnection, createQueue } = require('../helpers/rabbitmq');
const UserService = require('../../services/user-service/user-service');
const NotificationService = require('../../services/notification-service/notification-service');

describe('User Events Integration', () => {
  let connection;
  let userService;
  let notificationService;
  let receivedEvents = [];

  beforeAll(async () => {
    connection = await createConnection();
    const channel = await connection.createChannel();

    // Setup user service
    userService = new UserService(channel);

    // Setup notification service to listen for events
    notificationService = new NotificationService(channel);
    await notificationService.subscribe('user.created', event => {
      receivedEvents.push(event);
    });
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(() => {
    receivedEvents = [];
  });

  describe('User Created Event', () => {
    it('should publish event when user is created', async () => {
      // Arrange
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      // Act
      await userService.createUser(userData);

      // Wait for event to be processed
      await waitFor(() => receivedEvents.length > 0, 5000);

      // Assert
      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toMatchObject({
        type: 'user.created',
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        timestamp: expect.any(String),
      });
    });

    it('should handle event processing failure gracefully', async () => {
      // Setup failing event handler
      const failingHandler = jest.fn().mockRejectedValue(new Error('Processing failed'));

      await notificationService.subscribe('user.created', failingHandler);

      // Create user
      await userService.createUser({
        name: 'Test User',
        email: 'test@example.com',
      });

      // Wait for retry attempts
      await waitFor(() => failingHandler.mock.calls.length >= 3, 10000);

      // Should retry 3 times
      expect(failingHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('User Updated Event', () => {
    it('should publish event when user is updated', async () => {
      // Create user first
      const user = await userService.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      receivedEvents = []; // Clear creation event

      // Subscribe to update events
      await notificationService.subscribe('user.updated', event => {
        receivedEvents.push(event);
      });

      // Update user
      await userService.updateUser(user.id, {
        name: 'John Smith',
      });

      await waitFor(() => receivedEvents.length > 0, 5000);

      expect(receivedEvents[0]).toMatchObject({
        type: 'user.updated',
        data: {
          userId: user.id,
          changes: {
            name: 'John Smith',
          },
        },
      });
    });
  });

  describe('Event Ordering', () => {
    it('should process events in order', async () => {
      const events = [];

      await notificationService.subscribe('user.*', event => {
        events.push(event.type);
      });

      // Create, update, delete
      const user = await userService.createUser({
        name: 'Test',
        email: 'test@example.com',
      });

      await userService.updateUser(user.id, { name: 'Updated' });
      await userService.deleteUser(user.id);

      await waitFor(() => events.length === 3, 5000);

      expect(events).toEqual(['user.created', 'user.updated', 'user.deleted']);
    });
  });
});

// Helper function
async function waitFor(condition, timeout = 5000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}
```

### Testing Kafka Event Streams

```javascript
// __tests__/integration/kafka/order-events.test.js
const { Kafka } = require('kafkajs');
const OrderService = require('../../services/order-service/order-service');
const InventoryService = require('../../services/inventory-service/inventory-service');

describe('Order Events via Kafka', () => {
  let kafka;
  let producer;
  let consumer;
  let orderService;
  let inventoryService;

  beforeAll(async () => {
    kafka = new Kafka({
      clientId: 'test-client',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: 'test-group' });

    await producer.connect();
    await consumer.connect();

    orderService = new OrderService(producer);
    inventoryService = new InventoryService(consumer);
  });

  afterAll(async () => {
    await producer.disconnect();
    await consumer.disconnect();
  });

  describe('Order Created Event', () => {
    it('should update inventory when order is created', async () => {
      const receivedMessages = [];

      // Subscribe to inventory updates
      await consumer.subscribe({ topic: 'inventory.updated' });
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          receivedMessages.push({
            topic,
            value: JSON.parse(message.value.toString()),
          });
        },
      });

      // Create order
      await orderService.createOrder({
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
      });

      // Wait for inventory update
      await waitFor(() => receivedMessages.length > 0, 10000);

      expect(receivedMessages[0]).toMatchObject({
        topic: 'inventory.updated',
        value: {
          productId: expect.any(Number),
          quantityChanged: expect.any(Number),
        },
      });
    });
  });

  describe('Event Idempotency', () => {
    it('should handle duplicate events idempotently', async () => {
      const processedEvents = [];

      await inventoryService.subscribe(event => {
        processedEvents.push(event.eventId);
      });

      const event = {
        eventId: 'event-123',
        type: 'order.created',
        data: { orderId: 1 },
      };

      // Send same event twice
      await producer.send({
        topic: 'orders',
        messages: [
          { key: 'order-1', value: JSON.stringify(event) },
          { key: 'order-1', value: JSON.stringify(event) },
        ],
      });

      await waitFor(() => processedEvents.length >= 1, 5000);

      // Should only process once
      expect(processedEvents.filter(id => id === 'event-123')).toHaveLength(1);
    });
  });
});
```

## End-to-End Testing Strategies

### Testing Complete Business Flows

```javascript
// __tests__/e2e/complete-order-flow.test.js
const request = require('supertest');
const {
  startAllServices,
  stopAllServices,
  getServiceUrl,
} = require('../helpers/service-orchestrator');

describe('E2E: Complete Order Flow', () => {
  let services;

  beforeAll(async () => {
    services = await startAllServices([
      'user-service',
      'product-service',
      'order-service',
      'payment-service',
      'notification-service',
    ]);
  }, 60000); // Allow time for services to start

  afterAll(async () => {
    await stopAllServices();
  });

  it('should complete full order flow from user registration to order confirmation', async () => {
    // Step 1: Register user
    const userResponse = await request(getServiceUrl('user-service'))
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      })
      .expect(201);

    const userId = userResponse.body.id;
    expect(userId).toBeDefined();

    // Step 2: Login and get token
    const loginResponse = await request(getServiceUrl('user-service'))
      .post('/auth/login')
      .send({
        email: 'john@example.com',
        password: 'SecurePass123!',
      })
      .expect(200);

    const authToken = loginResponse.body.token;

    // Step 3: Browse products
    const productsResponse = await request(getServiceUrl('product-service'))
      .get('/products')
      .expect(200);

    expect(productsResponse.body.length).toBeGreaterThan(0);
    const product = productsResponse.body[0];

    // Step 4: Create order
    const orderResponse = await request(getServiceUrl('order-service'))
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId,
        items: [
          {
            productId: product.id,
            quantity: 2,
            price: product.price,
          },
        ],
      })
      .expect(201);

    const orderId = orderResponse.body.id;
    expect(orderResponse.body.status).toBe('pending');

    // Step 5: Process payment
    const paymentResponse = await request(getServiceUrl('payment-service'))
      .post('/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderId,
        amount: orderResponse.body.total,
        method: 'credit_card',
        cardToken: 'test_card_token',
      })
      .expect(200);

    expect(paymentResponse.body.status).toBe('completed');

    // Step 6: Verify order status updated
    await waitFor(async () => {
      const orderStatus = await request(getServiceUrl('order-service'))
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      return orderStatus.body.status === 'confirmed';
    }, 10000);

    const finalOrder = await request(getServiceUrl('order-service'))
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(finalOrder.body).toMatchObject({
      id: orderId,
      status: 'confirmed',
      paymentStatus: 'paid',
    });

    // Step 7: Verify notification sent
    // Check notification service was called (via logs or events)
    const notifications = await request(getServiceUrl('notification-service'))
      .get(`/notifications/user/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(notifications.body).toContainEqual(
      expect.objectContaining({
        type: 'order_confirmation',
        orderId,
      })
    );
  });

  it('should handle payment failure gracefully', async () => {
    // Create user and login
    const userResponse = await request(getServiceUrl('user-service')).post('/users').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Pass123!',
    });

    const loginResponse = await request(getServiceUrl('user-service')).post('/auth/login').send({
      email: 'test@example.com',
      password: 'Pass123!',
    });

    const authToken = loginResponse.body.token;

    // Create order
    const orderResponse = await request(getServiceUrl('order-service'))
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        userId: userResponse.body.id,
        items: [{ productId: 1, quantity: 1, price: 100 }],
      });

    const orderId = orderResponse.body.id;

    // Attempt payment with invalid card
    const paymentResponse = await request(getServiceUrl('payment-service'))
      .post('/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderId,
        amount: 100,
        method: 'credit_card',
        cardToken: 'invalid_card_token',
      })
      .expect(400);

    expect(paymentResponse.body.error).toContain('Payment failed');

    // Verify order status
    const orderStatus = await request(getServiceUrl('order-service'))
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(orderStatus.body.status).toBe('payment_failed');
  });
});
```

## Testing Resilience and Fault Tolerance

### Circuit Breaker Testing

```javascript
// __tests__/resilience/circuit-breaker.test.js
const CircuitBreaker = require('opossum');
const UserServiceClient = require('../../services/order-service/clients/user-service-client');

describe('Circuit Breaker Pattern', () => {
  let client;
  let circuitBreaker;

  beforeEach(() => {
    client = new UserServiceClient('http://user-service');

    const options = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 5000,
    };

    circuitBreaker = new CircuitBreaker(async userId => client.getUserById(userId), options);
  });

  it('should open circuit after threshold failures', async () => {
    // Mock service to always fail
    jest.spyOn(client, 'getUserById').mockRejectedValue(new Error('Service unavailable'));

    // Trigger failures
    for (let i = 0; i < 10; i++) {
      try {
        await circuitBreaker.fire(1);
      } catch (error) {
        // Expected to fail
      }
    }

    // Circuit should now be open
    expect(circuitBreaker.opened).toBe(true);

    // Subsequent calls should fail fast
    const start = Date.now();
    try {
      await circuitBreaker.fire(1);
    } catch (error) {
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Failed immediately
      expect(error.message).toContain('breaker is open');
    }
  });

  it('should close circuit after successful calls', async () => {
    // Open circuit
    jest.spyOn(client, 'getUserById').mockRejectedValue(new Error('Service unavailable'));

    for (let i = 0; i < 10; i++) {
      try {
        await circuitBreaker.fire(1);
      } catch (error) {
        // Expected
      }
    }

    expect(circuitBreaker.opened).toBe(true);

    // Wait for reset timeout
    await new Promise(resolve => setTimeout(resolve, 5100));

    // Mock service to succeed
    jest.spyOn(client, 'getUserById').mockResolvedValue({
      id: 1,
      name: 'John Doe',
    });

    // Circuit should be half-open, test succeeds
    const result = await circuitBreaker.fire(1);
    expect(result).toMatchObject({ id: 1, name: 'John Doe' });

    // Circuit should be closed
    expect(circuitBreaker.closed).toBe(true);
  });

  it('should use fallback when circuit is open', async () => {
    circuitBreaker.fallback(userId => ({
      id: userId,
      name: 'Fallback User',
      isFallback: true,
    }));

    // Open circuit
    jest.spyOn(client, 'getUserById').mockRejectedValue(new Error('Service unavailable'));

    for (let i = 0; i < 10; i++) {
      try {
        await circuitBreaker.fire(1);
      } catch (error) {
        // Expected
      }
    }

    // Use fallback
    const result = await circuitBreaker.fire(1);
    expect(result).toMatchObject({
      id: 1,
      name: 'Fallback User',
      isFallback: true,
    });
  });
});
```

### Chaos Engineering Tests

```javascript
// __tests__/chaos/network-failures.test.js
const request = require('supertest');
const toxiproxy = require('toxiproxy-node-client');
const { startServices } = require('../helpers/service-orchestrator');

describe('Chaos Engineering: Network Failures', () => {
  let proxy;
  let services;

  beforeAll(async () => {
    // Start services
    services = await startServices(['order-service', 'user-service']);

    // Setup Toxiproxy
    const client = new toxiproxy.Toxiproxy('http://localhost:8474');

    // Create proxy for user service
    proxy = await client.createProxy({
      name: 'user-service-proxy',
      listen: '0.0.0.0:20001',
      upstream: 'localhost:3001',
    });
  });

  afterAll(async () => {
    await proxy.remove();
    await services.stop();
  });

  describe('Latency Injection', () => {
    it('should handle slow downstream service', async () => {
      // Add 2 second latency
      await proxy.addToxic({
        type: 'latency',
        attributes: {
          latency: 2000,
        },
      });

      const start = Date.now();

      const response = await request(services.orderService)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(201);

      const duration = Date.now() - start;

      // Should handle latency gracefully
      expect(duration).toBeGreaterThan(2000);
      expect(response.body).toBeDefined();

      // Cleanup
      await proxy.resetAllToxics();
    });

    it('should timeout on excessive latency', async () => {
      // Add 10 second latency (exceeds timeout)
      await proxy.addToxic({
        type: 'latency',
        attributes: {
          latency: 10000,
        },
      });

      const response = await request(services.orderService)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(503);

      expect(response.body.error).toContain('Service timeout');

      await proxy.resetAllToxics();
    });
  });

  describe('Network Partition', () => {
    it('should handle network partition', async () => {
      // Simulate network partition
      await proxy.addToxic({
        type: 'bandwidth',
        attributes: {
          rate: 0, // Zero bandwidth
        },
      });

      const response = await request(services.orderService)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        })
        .expect(503);

      expect(response.body.error).toContain('unavailable');

      await proxy.resetAllToxics();
    });
  });

  describe('Connection Failures', () => {
    it('should handle connection reset', async () => {
      await proxy.addToxic({
        type: 'reset_peer',
        attributes: {
          timeout: 0,
        },
      });

      const response = await request(services.orderService)
        .post('/orders')
        .send({
          userId: 1,
          items: [{ productId: 1, quantity: 1, price: 100 }],
        });

      // Should handle gracefully with retry or fallback
      expect([503, 201]).toContain(response.status);

      await proxy.resetAllToxics();
    });
  });
});
```

## Testing Data Consistency

### Saga Pattern Testing

```javascript
// __tests__/sagas/order-saga.test.js
const OrderSaga = require('../../services/order-service/sagas/order-saga');

describe('Order Saga', () => {
  let saga;
  let mockServices;

  beforeEach(() => {
    mockServices = {
      inventory: {
        reserve: jest.fn(),
        release: jest.fn(),
      },
      payment: {
        charge: jest.fn(),
        refund: jest.fn(),
      },
      shipping: {
        create: jest.fn(),
        cancel: jest.fn(),
      },
    };

    saga = new OrderSaga(mockServices);
  });

  describe('Successful Order Saga', () => {
    it('should complete all steps successfully', async () => {
      // Mock successful responses
      mockServices.inventory.reserve.mockResolvedValue({
        reservationId: 'res-123',
      });
      mockServices.payment.charge.mockResolvedValue({
        transactionId: 'txn-456',
      });
      mockServices.shipping.create.mockResolvedValue({
        shippingId: 'ship-789',
      });

      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        total: 200,
        paymentMethod: 'credit_card',
      };

      const result = await saga.execute(orderData);

      expect(result).toMatchObject({
        status: 'completed',
        reservationId: 'res-123',
        transactionId: 'txn-456',
        shippingId: 'ship-789',
      });

      expect(mockServices.inventory.reserve).toHaveBeenCalled();
      expect(mockServices.payment.charge).toHaveBeenCalled();
      expect(mockServices.shipping.create).toHaveBeenCalled();
    });
  });

  describe('Saga Compensation', () => {
    it('should compensate when payment fails', async () => {
      // Mock responses
      mockServices.inventory.reserve.mockResolvedValue({
        reservationId: 'res-123',
      });
      mockServices.payment.charge.mockRejectedValue(new Error('Payment declined'));

      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        total: 200,
      };

      await expect(saga.execute(orderData)).rejects.toThrow('Payment declined');

      // Should compensate by releasing inventory
      expect(mockServices.inventory.release).toHaveBeenCalledWith('res-123');
      expect(mockServices.shipping.create).not.toHaveBeenCalled();
    });

    it('should compensate when shipping fails', async () => {
      mockServices.inventory.reserve.mockResolvedValue({
        reservationId: 'res-123',
      });
      mockServices.payment.charge.mockResolvedValue({
        transactionId: 'txn-456',
      });
      mockServices.shipping.create.mockRejectedValue(new Error('Shipping unavailable'));

      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        total: 200,
      };

      await expect(saga.execute(orderData)).rejects.toThrow('Shipping unavailable');

      // Should compensate by refunding and releasing inventory
      expect(mockServices.payment.refund).toHaveBeenCalledWith('txn-456');
      expect(mockServices.inventory.release).toHaveBeenCalledWith('res-123');
    });

    it('should handle partial compensation failures', async () => {
      mockServices.inventory.reserve.mockResolvedValue({
        reservationId: 'res-123',
      });
      mockServices.payment.charge.mockRejectedValue(new Error('Payment declined'));
      mockServices.inventory.release.mockRejectedValue(new Error('Release failed'));

      const orderData = {
        items: [{ productId: 1, quantity: 2 }],
        total: 200,
      };

      // Should log compensation failure for manual intervention
      await expect(saga.execute(orderData)).rejects.toThrow('Payment declined');

      // Verify compensation was attempted
      expect(mockServices.inventory.release).toHaveBeenCalled();
    });
  });
});
```

## Microservices Testing Best Practices

### 1. Test Independence

```javascript
// BAD: Shared state between tests
describe('User Service Tests', () => {
  let testUser;

  it('should create user', async () => {
    testUser = await createUser({ name: 'John' });
  });

  it('should update user', async () => {
    // Depends on previous test
    await updateUser(testUser.id, { name: 'Jane' });
  });
});

// GOOD: Independent tests
describe('User Service Tests', () => {
  it('should create user', async () => {
    const user = await createUser({ name: 'John' });
    expect(user.id).toBeDefined();
  });

  it('should update user', async () => {
    const user = await createUser({ name: 'John' });
    const updated = await updateUser(user.id, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
  });
});
```

### 2. Service Test Isolation

```javascript
// __tests__/helpers/test-container.js
const { GenericContainer } = require('testcontainers');

class TestContainer {
  static async startPostgres() {
    const container = await new GenericContainer('postgres:14')
      .withEnvironment({
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'testdb',
      })
      .withExposedPorts(5432)
      .start();

    return {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: 'testdb',
      username: 'postgres',
      password: 'test',
      stop: () => container.stop(),
    };
  }

  static async startRabbitMQ() {
    const container = await new GenericContainer('rabbitmq:3-management')
      .withExposedPorts(5672, 15672)
      .start();

    return {
      url: `amqp://${container.getHost()}:${container.getMappedPort(5672)}`,
      stop: () => container.stop(),
    };
  }

  static async startRedis() {
    const container = await new GenericContainer('redis:7').withExposedPorts(6379).start();

    return {
      host: container.getHost(),
      port: container.getMappedPort(6379),
      stop: () => container.stop(),
    };
  }
}

module.exports = TestContainer;
```

### 3. Observability in Tests

```javascript
// __tests__/helpers/tracing.js
const { trace, context } = require('@opentelemetry/api');

class TestTracer {
  static async traceTest(testName, testFn) {
    const tracer = trace.getTracer('test-tracer');

    return tracer.startActiveSpan(testName, async (span) => {
      try {
        await testFn();
        span.setStatus({ code: 0 }); // OK
      } catch (error) {
        span.setStatus({ code: 2, message: error.message }); // ERROR
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}

// Usage
describe('Order Service', () => {
  it('should create order', async () => {
    await TestTracer.traceTest('create-order-test', async () => {
      const order = await createOrder({ items: [...] });
      expect(order.id).toBeDefined();
    });
  });
});
```

## Testing Metrics and Monitoring

### Service Health Checks

```javascript
// __tests__/health/service-health.test.js
const request = require('supertest');

describe('Service Health Checks', () => {
  const services = ['user-service', 'order-service', 'payment-service', 'notification-service'];

  services.forEach(serviceName => {
    describe(`${serviceName} Health`, () => {
      it('should respond to health check', async () => {
        const response = await request(getServiceUrl(serviceName)).get('/health').expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          service: serviceName,
          timestamp: expect.any(String),
        });
      });

      it('should report dependency health', async () => {
        const response = await request(getServiceUrl(serviceName)).get('/health/ready').expect(200);

        expect(response.body.dependencies).toBeDefined();
        Object.values(response.body.dependencies).forEach(status => {
          expect(['healthy', 'degraded', 'unhealthy']).toContain(status);
        });
      });
    });
  });

  it('should detect cascading failures', async () => {
    // Simulate database failure
    await simulateDatabaseFailure('user-service');

    // Check user service health
    const userHealth = await request(getServiceUrl('user-service')).get('/health').expect(503);

    expect(userHealth.body.status).toBe('unhealthy');

    // Check dependent service health
    const orderHealth = await request(getServiceUrl('order-service')).get('/health/ready');

    expect(orderHealth.body.dependencies['user-service']).toBe('unhealthy');
  });
});
```

## Checklist

### Microservices Testing Implementation Checklist

**Service Isolation Testing:**

- [ ] Unit tests for service logic
- [ ] API tests for endpoints
- [ ] Test data isolation
- [ ] Mock external dependencies
- [ ] Test error handling
- [ ] Validate business rules

**Contract Testing:**

- [ ] Define consumer contracts
- [ ] Implement provider verification
- [ ] Publish contracts to broker
- [ ] Version compatibility tests
- [ ] Breaking change detection

**Integration Testing:**

- [ ] Service-to-service communication
- [ ] Database interactions
- [ ] Message queue integration
- [ ] Event handling
- [ ] Retry mechanisms
- [ ] Timeout handling

**Asynchronous Testing:**

- [ ] Event publishing
- [ ] Event consumption
- [ ] Event ordering
- [ ] Idempotency
- [ ] Dead letter queues
- [ ] Message replay

**Resilience Testing:**

- [ ] Circuit breaker patterns
- [ ] Retry logic
- [ ] Fallback mechanisms
- [ ] Timeout handling
- [ ] Bulkhead isolation
- [ ] Rate limiting

**Chaos Engineering:**

- [ ] Network latency injection
- [ ] Service failures
- [ ] Network partitions
- [ ] Resource exhaustion
- [ ] Data corruption

**E2E Testing:**

- [ ] Complete business flows
- [ ] Multi-service scenarios
- [ ] Happy path testing
- [ ] Error scenarios
- [ ] Compensation logic

**Observability:**

- [ ] Distributed tracing
- [ ] Structured logging
- [ ] Metrics collection
- [ ] Health checks
- [ ] Dependency monitoring

## References

### Standards and Guidelines

- **ISTQB Advanced Level** - Test Automation Engineer
- **ISO/IEC 25010** - Software Quality Model
- **12-Factor App** - Microservices principles
- **Reactive Manifesto** - Resilient systems

### Tools and Frameworks

- **Pact** - Consumer-driven contract testing
- **Testcontainers** - Integration testing with containers
- **Toxiproxy** - Chaos engineering and fault injection
- **WireMock** - HTTP service mocking
- **LocalStack** - AWS service mocking

### Books and Resources

- "Building Microservices" - Sam Newman
- "Testing Microservices with Mountebank" - Brandon Byars
- "Release It!" - Michael Nygard
- "Monolith to Microservices" - Sam Newman

## Related Topics

- [Contract Testing](contract-testing.md) - Detailed contract testing
- [API Testing](api-testing.md) - API testing strategies
- [Integration Testing](integration-testing.md) - Integration approaches
- [E2E Testing](e2e-testing.md) - End-to-end testing
- [System Testing](system-testing.md) - System-level testing

---

_Part of: [Test Levels](05-README.md)_
