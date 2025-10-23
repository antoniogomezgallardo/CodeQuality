# Contract Testing

## Purpose

Comprehensive guide to contract testing—verifying that services can communicate correctly by validating API contracts between consumers and providers.

## Overview

Contract testing:

- Tests API contracts between services
- Validates communication interfaces
- Enables independent service deployment
- Catches integration issues early
- Supports microservices architecture

## What is Contract Testing?

### Definition

Contract testing verifies that two separate systems (consumer and provider) agree on the interface/contract for communication, allowing them to be developed and deployed independently.

### The Problem Contract Testing Solves

```
Without Contract Testing:

Consumer Service          Provider Service
     │                          │
     │   Expects: /api/v1/user │
     ├─────────────────────────→│
     │                          │
     │   Returns: 404           │
     │←─────────────────────────┤
     │  (Provider changed to    │
     │   /api/v2/users)         │
     │                          │
    BREAKS IN PRODUCTION!


With Contract Testing:

Consumer Contract Test    Provider Contract Test
     │                          │
     │   Expects: /api/v1/user │
     │                          │
     │                          │   Provides: /api/v2/users
     │                          │
    ✅ Tests pass             ❌ Contract broken
                                  (Detected before deploy)
```

## Contract Testing with Pact

### Consumer-Driven Contracts

#### Consumer Side Test

```javascript
// user-service-consumer.test.js
import { pactWith } from 'jest-pact';
import { UserService } from './user-service';

pactWith({ consumer: 'UserApp', provider: 'UserAPI' }, interaction => {
  interaction('get user by id', ({ provider, execute }) => {
    beforeEach(() => {
      const expectedUser = {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      };

      return provider
        .given('user 1 exists')
        .uponReceiving('a request for user 1')
        .withRequest({
          method: 'GET',
          path: '/api/users/1',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedUser,
        });
    });

    execute('should return user', async mockServer => {
      const userService = new UserService(mockServer.url);
      const user = await userService.getUserById(1);

      expect(user).toEqual({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  interaction('get user by id - not found', ({ provider, execute }) => {
    beforeEach(() => {
      return provider
        .given('user 999 does not exist')
        .uponReceiving('a request for user 999')
        .withRequest({
          method: 'GET',
          path: '/api/users/999',
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: 'User not found',
          },
        });
    });

    execute('should return 404', async mockServer => {
      const userService = new UserService(mockServer.url);

      await expect(userService.getUserById(999)).rejects.toThrow('User not found');
    });
  });
});
```

#### Provider Side Verification

```javascript
// user-api-provider.test.js
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const app = require('./app');

describe('Pact Verification', () => {
  let server;

  beforeAll(done => {
    server = app.listen(8080, done);
  });

  afterAll(done => {
    server.close(done);
  });

  it('should validate the expectations of UserApp', () => {
    return new Verifier({
      provider: 'UserAPI',
      providerBaseUrl: 'http://localhost:8080',

      // Fetch pacts from broker
      pactBrokerUrl: 'https://pact-broker.example.com',
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT,

      // State handlers
      stateHandlers: {
        'user 1 exists': () => {
          // Setup: Create user 1 in test database
          return setupUser({ id: 1, name: 'John Doe' });
        },
        'user 999 does not exist': () => {
          // Setup: Ensure user 999 doesn't exist
          return deleteUser(999);
        },
      },
    }).verifyProvider();
  });
});
```

### Contract Testing Flow

```
1. Consumer writes contract test
   └─> Defines expectations
   └─> Generates pact file

2. Pact file published to broker
   └─> Central contract repository
   └─> Version controlled

3. Provider verifies contract
   └─> Fetches pact from broker
   └─> Runs verification tests
   └─> Publishes results

4. CI/CD checks contract compatibility
   └─> Before deploying consumer
   └─> Before deploying provider
   └─> Can-I-deploy check
```

## OpenAPI Contract Testing

### API Specification

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: User API
  version: 1.0.0

paths:
  /api/users/{userId}:
    get:
      summary: Get user by ID
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: integer
        name:
          type: string
        email:
          type: string
          format: email

    Error:
      type: object
      properties:
        error:
          type: string
```

### Validating Against Specification

```javascript
// Using OpenAPI validator
import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import app from './app';

describe('API Contract Validation', () => {
  let api;

  beforeAll(async () => {
    api = await SwaggerParser.validate('./openapi.yaml');
  });

  it('should match OpenAPI schema for GET /api/users/:id', async () => {
    const response = await request(app).get('/api/users/1').expect(200);

    // Validate response matches schema
    const userSchema = api.components.schemas.User;
    expect(response.body).toMatchSchema(userSchema);
  });

  it('should return 404 with error schema', async () => {
    const response = await request(app).get('/api/users/999').expect(404);

    const errorSchema = api.components.schemas.Error;
    expect(response.body).toMatchSchema(errorSchema);
  });
});
```

## GraphQL Contract Testing

```javascript
// GraphQL schema
const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    user(id: ID!): User
  }
`;

// Contract test
import { graphql } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

describe('GraphQL Contract', () => {
  let schema;

  beforeAll(() => {
    schema = makeExecutableSchema({
      typeDefs,
      resolvers: mockResolvers,
    });
  });

  it('should match user query contract', async () => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `;

    const result = await graphql({
      schema,
      source: query,
      variableValues: { id: '1' },
    });

    expect(result.data.user).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: expect.stringMatching(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/),
    });
  });
});
```

## Message Queue Contract Testing

```javascript
// Consumer test for message queue
describe('Order Created Event Contract', () => {
  it('should handle order.created message', async () => {
    const message = {
      event: 'order.created',
      data: {
        orderId: '123',
        customerId: '456',
        items: [{ productId: 'p1', quantity: 2, price: 10.0 }],
        total: 20.0,
        timestamp: '2024-10-07T10:00:00Z',
      },
    };

    const handler = new OrderEventHandler();
    await handler.handle(message);

    // Verify consumer can process the message
    expect(handler.processed).toBe(true);
  });

  it('should reject invalid message format', async () => {
    const invalidMessage = {
      event: 'order.created',
      data: {
        // Missing required fields
        orderId: '123',
      },
    };

    const handler = new OrderEventHandler();

    await expect(handler.handle(invalidMessage)).rejects.toThrow('Invalid message format');
  });
});
```

## Pact Broker

### Publishing Pacts

```javascript
// package.json scripts
{
  "scripts": {
    "test:pact": "jest --testMatch='**/*.pact.test.js'",
    "pact:publish": "pact-broker publish ./pacts --consumer-app-version=$GIT_COMMIT --broker-base-url=$PACT_BROKER_URL"
  }
}
```

### Can-I-Deploy Check

```bash
#!/bin/bash
# check-can-deploy.sh

# Check if consumer can be deployed
pact-broker can-i-deploy \
  --pacticipant UserApp \
  --version $GIT_COMMIT \
  --to production \
  --broker-base-url $PACT_BROKER_URL

if [ $? -eq 0 ]; then
  echo "✅ Safe to deploy"
  exit 0
else
  echo "❌ Cannot deploy - contract verification failed"
  exit 1
fi
```

## Best Practices

### 1. Consumer-Driven

```
✅ Consumer defines what it needs
✅ Provider verifies it can meet needs
✅ Contract evolves with consumer requirements

❌ Provider dictates interface
❌ Consumer adapts to provider changes
```

### 2. Test Real Client Code

```javascript
// ✅ Test actual service client
const userService = new UserService(mockServer.url);
const user = await userService.getUserById(1);

// ❌ Don't test mock directly
const mockResponse = { id: 1, name: 'John' };
expect(mockResponse).toEqual({ id: 1, name: 'John' });
```

### 3. Use Provider States

```javascript
// ✅ Define clear states
provider.given('user 1 exists');
provider.given('user 1 is deleted');
provider.given('database is empty');

// ❌ Vague states
provider.given('normal state');
provider.given('test data loaded');
```

### 4. Version Contracts

```
Contract versioning:
├── Tag with semantic versions
├── Track breaking changes
├── Maintain backward compatibility
└── Deprecate old versions gracefully
```

## Contract Testing vs Integration Testing

```
Contract Testing:
├── Fast (mocked provider)
├── Independent deployment
├── Early feedback
├── Isolated failures
└── No environment needed

Integration Testing:
├── Slower (real services)
├── Coupled deployment
├── Later feedback
├── Cascading failures
└── Full environment needed

Use Both:
Contract tests for development
Integration tests before production
```

## Common Pitfalls

```javascript
// ❌ Over-specifying contracts
.willRespondWith({
  body: {
    id: 1,  // Exact value
    name: 'John Doe',  // Exact value
    createdAt: '2024-10-07T10:00:00Z'  // Exact timestamp
  }
});

// ✅ Use matchers
.willRespondWith({
  body: {
    id: like(1),
    name: like('John Doe'),
    createdAt: iso8601DateTime()
  }
});

// ❌ Testing provider implementation
expect(response.body.query).toContain('SELECT * FROM users');

// ✅ Test contract only
expect(response.body).toHaveProperty('id');
expect(response.body).toHaveProperty('name');
```

## Checklist

### Contract Testing Checklist

**Setup:**

- [ ] Pact framework installed
- [ ] Pact broker configured
- [ ] CI/CD integration setup

**Consumer Tests:**

- [ ] All API interactions covered
- [ ] Error scenarios tested
- [ ] Matchers used appropriately
- [ ] Pacts generated
- [ ] Pacts published to broker

**Provider Tests:**

- [ ] Provider states implemented
- [ ] Verification tests passing
- [ ] Results published to broker
- [ ] Can-I-deploy checks configured

**Process:**

- [ ] Contract changes reviewed
- [ ] Breaking changes communicated
- [ ] Version compatibility maintained
- [ ] Documentation updated

## References

### Documentation

- [Pact Documentation](https://docs.pact.io/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [Martin Fowler - Contract Testing](https://martinfowler.com/bliki/ContractTest.html)

### Tools

- **Pact**: Consumer-driven contract testing
- **Spring Cloud Contract**: JVM contract testing
- **Postman**: API contract validation
- **Dredd**: OpenAPI contract testing

## Related Topics

- [Integration Testing](integration-testing.md)
- [API Testing](api-testing.md)
- [Microservices Testing](microservices-testing.md)
- [CI/CD Pipeline](../08-cicd-pipeline/README.md)

---

_Part of: [Test Levels](README.md)_
