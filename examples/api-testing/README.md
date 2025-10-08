# API Testing Examples

This directory contains production-ready examples for API testing using modern JavaScript testing tools and frameworks. These examples demonstrate industry best practices for testing RESTful APIs, GraphQL APIs, and implementing contract testing.

## Table of Contents

- [Overview](#overview)
- [Tools & Technologies](#tools--technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Examples](#running-the-examples)
- [Examples Overview](#examples-overview)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)

## Overview

API testing is a crucial aspect of modern software development that validates the functionality, reliability, performance, and security of application programming interfaces. This collection demonstrates:

- **Functional Testing**: Validating API behavior meets requirements
- **Integration Testing**: Testing API interactions with databases and external services
- **Contract Testing**: Ensuring API contracts between consumers and providers
- **Performance Testing**: Measuring API response times and throughput
- **Security Testing**: Validating authentication, authorization, and data protection

## Tools & Technologies

### Core Testing Frameworks

- **[Jest](https://jestjs.io/)** (v29+) - JavaScript testing framework with built-in assertion library, mocking, and code coverage
- **[Supertest](https://github.com/visionmedia/supertest)** (v6+) - HTTP assertion library for testing Node.js HTTP servers
- **[Axios](https://axios-http.com/)** (v1+) - Promise-based HTTP client for browser and Node.js

### Specialized Testing Tools

- **[Pact](https://docs.pact.io/)** (v10+) - Consumer-driven contract testing framework
- **[@pact-foundation/pact](https://www.npmjs.com/package/@pact-foundation/pact)** - Pact implementation for Node.js
- **[GraphQL](https://graphql.org/)** - Query language for APIs with type system
- **[graphql-request](https://github.com/prisma-labs/graphql-request)** - Minimal GraphQL client

### Database & Mocking

- **[node-pg](https://node-postgres.com/)** - PostgreSQL client for Node.js
- **[nock](https://github.com/nock/nock)** - HTTP server mocking library
- **[MSW (Mock Service Worker)](https://mswjs.io/)** - API mocking library

## Prerequisites

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (or yarn/pnpm equivalent)
- **Basic knowledge of**:
  - JavaScript/Node.js
  - RESTful API concepts
  - HTTP protocol
  - JSON data format
  - Async/await patterns

## Installation

1. Navigate to the api-testing examples directory:

```bash
cd examples/api-testing
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and configure:

```bash
cp .env.example .env
```

4. Update `.env` with your configuration (see [Environment Variables](#environment-variables))

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
API_BASE_URL=http://localhost:3000
API_TIMEOUT=5000

# Authentication
API_KEY=your-api-key-here
JWT_TOKEN=your-jwt-token-here

# Database (for integration tests)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USER=postgres
DB_PASSWORD=password

# GraphQL
GRAPHQL_ENDPOINT=http://localhost:4000/graphql

# Test Configuration
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

## Running the Examples

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
# REST API tests
npm test rest-api-supertest

# GraphQL tests
npm test graphql-api

# Contract tests
npm test contract-testing-pact

# Integration tests
npm test api-integration

# Performance tests
npm test api-performance
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

## Examples Overview

### 1. REST API Testing (rest-api-supertest.test.js)

Comprehensive REST API testing examples using Supertest and Jest:

**Coverage:**
- GET requests with query parameters
- POST requests with body validation
- PUT/PATCH requests for resource updates
- DELETE requests with proper cleanup
- Authentication (JWT tokens, API keys)
- Authorization (role-based access control)
- Response validation (status codes, headers, body structure)
- Error handling (4xx client errors, 5xx server errors)
- Content-Type validation
- Pagination with offset/limit
- Filtering and sorting
- Rate limiting behavior
- CORS headers
- Request/response interceptors

**Key Patterns:**
```javascript
// Basic GET request
const response = await request(app)
  .get('/api/users')
  .expect(200)
  .expect('Content-Type', /json/);

// POST with authentication
const response = await request(app)
  .post('/api/users')
  .set('Authorization', `Bearer ${token}`)
  .send({ name: 'John Doe', email: 'john@example.com' })
  .expect(201);

// Query parameters
const response = await request(app)
  .get('/api/users')
  .query({ page: 1, limit: 10, sort: 'name' })
  .expect(200);
```

### 2. GraphQL API Testing (graphql-api.test.js)

GraphQL API testing with queries, mutations, and error handling:

**Coverage:**
- Simple queries with variables
- Complex nested queries
- Mutations (create, update, delete)
- Error handling and validation
- Authentication and authorization
- Fragments for reusable query parts
- Schema introspection
- Batch queries
- Pagination with connections
- Subscriptions testing basics

**Key Patterns:**
```javascript
// GraphQL query
const query = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
    }
  }
`;

// GraphQL mutation
const mutation = `
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
    }
  }
`;
```

### 3. Contract Testing (contract-testing-pact.test.js)

Consumer-driven contract testing using Pact:

**Coverage:**
- Consumer contract definition
- Provider state management
- Interaction expectations
- Request/response matching
- Provider verification
- Contract publishing
- Version management
- Breaking change detection

**Key Patterns:**
```javascript
// Define consumer expectations
await provider.addInteraction({
  state: 'user exists',
  uponReceiving: 'a request for user details',
  withRequest: {
    method: 'GET',
    path: '/api/users/1'
  },
  willRespondWith: {
    status: 200,
    body: like({ id: 1, name: 'John' })
  }
});
```

### 4. Integration Testing (api-integration.test.js)

Integration testing with real databases and external services:

**Coverage:**
- Database integration (PostgreSQL)
- Transaction management
- Test data setup and teardown
- External API mocking with Nock
- Database seeding
- Rollback strategies
- Connection pooling
- Multi-service integration
- Message queue integration

**Key Patterns:**
```javascript
// Database setup
beforeEach(async () => {
  await db.query('BEGIN');
  await seedTestData();
});

// Cleanup
afterEach(async () => {
  await db.query('ROLLBACK');
});
```

### 5. Performance Testing (api-performance.test.js)

Basic API performance testing and monitoring:

**Coverage:**
- Response time assertions
- Throughput measurement
- Concurrent request handling
- Load simulation
- Memory usage monitoring
- Resource utilization
- Bottleneck identification
- Performance regression detection

**Key Patterns:**
```javascript
// Response time assertion
const start = Date.now();
await request(app).get('/api/users');
const duration = Date.now() - start;
expect(duration).toBeLessThan(200); // ms
```

## Best Practices

### 1. Test Organization

```javascript
describe('User API', () => {
  describe('GET /api/users', () => {
    it('should return all users with valid authentication', async () => {
      // Arrange
      const token = await getAuthToken();

      // Act
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('users');
    });
  });
});
```

**Guidelines:**
- Group related tests using `describe` blocks
- Use descriptive test names following "should..." pattern
- Follow AAA pattern (Arrange, Act, Assert)
- One assertion concept per test
- Test both happy path and edge cases

### 2. Test Data Management

```javascript
// Use factories or builders
const createTestUser = (overrides = {}) => ({
  name: 'Test User',
  email: `test-${Date.now()}@example.com`,
  role: 'user',
  ...overrides
});

// Clean up after tests
afterEach(async () => {
  await cleanupTestData();
});
```

**Guidelines:**
- Use unique identifiers (timestamps, UUIDs) to avoid conflicts
- Create minimal test data needed for each test
- Always clean up test data after tests
- Use factories or builders for consistent test data
- Isolate test data between test cases

### 3. Authentication & Authorization

```javascript
// Reusable authentication helper
const authenticateUser = async (role = 'user') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

  return response.body.token;
};

// Use in tests
const token = await authenticateUser('admin');
```

**Guidelines:**
- Test both authenticated and unauthenticated access
- Verify role-based permissions
- Test token expiration and refresh
- Validate authorization headers
- Test invalid credentials scenarios

### 4. Error Handling

```javascript
it('should return 400 for invalid input', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'invalid-email' }) // Missing required fields
    .expect(400);

  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toContain('validation');
});
```

**Guidelines:**
- Test all expected error scenarios
- Verify appropriate HTTP status codes
- Validate error message structure
- Test edge cases and boundary conditions
- Ensure consistent error response format

### 5. Response Validation

```javascript
// Schema validation helper
const validateUserSchema = (user) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(user.email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);
  expect(user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
};
```

**Guidelines:**
- Validate response structure and schema
- Check data types and formats
- Verify required fields are present
- Test nullable and optional fields
- Use JSON schema validation for complex responses

### 6. Async/Await Best Practices

```javascript
// ✅ Good: Proper error handling
it('should handle errors gracefully', async () => {
  await expect(
    request(app).get('/api/nonexistent')
  ).rejects.toThrow();
});

// ❌ Bad: Missing await
it('should return users', () => {
  request(app).get('/api/users').expect(200); // Promise not awaited
});
```

**Guidelines:**
- Always use `async/await` for asynchronous operations
- Handle promise rejections with try/catch or expect().rejects
- Avoid mixing callbacks and promises
- Use `Promise.all()` for parallel operations
- Set appropriate timeouts for long-running tests

### 7. Test Independence

```javascript
// Each test should be independent
describe('User CRUD Operations', () => {
  let userId;

  beforeEach(async () => {
    // Fresh setup for each test
    const user = await createUser();
    userId = user.id;
  });

  afterEach(async () => {
    // Clean up after each test
    await deleteUser(userId);
  });

  it('should update user', async () => {
    // Test uses userId from beforeEach
  });
});
```

**Guidelines:**
- Tests should not depend on execution order
- Each test should set up its own prerequisites
- Clean up test data in afterEach/afterAll
- Avoid shared mutable state between tests
- Use fresh test data for each test

### 8. Mocking External Dependencies

```javascript
// Mock external API
const nock = require('nock');

beforeEach(() => {
  nock('https://api.external.com')
    .get('/data')
    .reply(200, { data: 'mocked response' });
});

afterEach(() => {
  nock.cleanAll();
});
```

**Guidelines:**
- Mock external services to ensure test reliability
- Use libraries like Nock or MSW for HTTP mocking
- Clean up mocks after each test
- Test both success and failure scenarios of external calls
- Document what is being mocked and why

### 9. Performance Considerations

```javascript
// Set reasonable timeouts
jest.setTimeout(10000); // 10 seconds

// Batch operations when possible
await Promise.all([
  request(app).get('/api/users'),
  request(app).get('/api/products'),
  request(app).get('/api/orders')
]);
```

**Guidelines:**
- Set appropriate test timeouts
- Use connection pooling for database tests
- Run independent tests in parallel
- Monitor test execution time
- Identify and optimize slow tests

### 10. Documentation

```javascript
/**
 * Tests for User Management API
 *
 * Prerequisites:
 * - Database must be running
 * - Test user must exist in database
 *
 * @group integration
 * @group api
 */
describe('User API', () => {
  // Tests...
});
```

**Guidelines:**
- Document complex test scenarios
- Explain non-obvious test setup
- Note external dependencies
- Use JSDoc comments for test suites
- Maintain README with setup instructions

## Common Patterns

### Pattern 1: Request Builder

```javascript
class RequestBuilder {
  constructor(app) {
    this.app = app;
    this.headers = {};
  }

  withAuth(token) {
    this.headers.Authorization = `Bearer ${token}`;
    return this;
  }

  async get(path) {
    return request(this.app)
      .get(path)
      .set(this.headers);
  }
}

// Usage
const rb = new RequestBuilder(app);
const response = await rb.withAuth(token).get('/api/users');
```

### Pattern 2: Test Data Factories

```javascript
const UserFactory = {
  build: (overrides = {}) => ({
    name: faker.name.fullName(),
    email: faker.internet.email(),
    age: faker.number.int({ min: 18, max: 65 }),
    ...overrides
  }),

  create: async (overrides = {}) => {
    const user = UserFactory.build(overrides);
    const response = await request(app)
      .post('/api/users')
      .send(user);
    return response.body;
  }
};
```

### Pattern 3: Custom Matchers

```javascript
expect.extend({
  toBeValidUser(received) {
    const hasRequiredFields =
      received.id &&
      received.name &&
      received.email;

    return {
      pass: hasRequiredFields,
      message: () => `Expected ${received} to be a valid user`
    };
  }
});

// Usage
expect(user).toBeValidUser();
```

### Pattern 4: Retry Logic

```javascript
const retryRequest = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Usage
const response = await retryRequest(() =>
  request(app).get('/api/users')
);
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using the port
npx kill-port 3000

# Or manually
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

#### 2. Database Connection Errors

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
- Verify database is running
- Check connection credentials in `.env`
- Ensure database exists
- Verify network connectivity

```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d test_db
```

#### 3. Timeout Errors

**Problem:** `Timeout - Async callback was not invoked within the 5000 ms timeout`

**Solution:**
```javascript
// Increase timeout for specific test
it('should handle slow operation', async () => {
  // Test code
}, 30000); // 30 seconds

// Or globally
jest.setTimeout(30000);
```

#### 4. Pact Verification Failures

**Problem:** Contract verification fails on provider side

**Solution:**
- Ensure provider states are properly implemented
- Verify API versions match contract
- Check provider URL configuration
- Review contract expectations vs actual responses

#### 5. Mock Not Matching

**Problem:** Nock mock not intercepting requests

**Solution:**
```javascript
// Enable Nock debugging
nock.recorder.rec({
  output_objects: true,
  enable_reqheaders_recording: true
});

// Verify mock is set up correctly
nock.isDone(); // Returns true if all mocks were called
```

### Debugging Tips

1. **Enable Verbose Output:**
```bash
npm test -- --verbose --no-coverage
```

2. **Use Jest Debug Mode:**
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

3. **Log Request/Response:**
```javascript
const response = await request(app)
  .get('/api/users')
  .expect(200);

console.log('Request:', response.request);
console.log('Response:', response.body);
```

4. **Check Environment Variables:**
```javascript
console.log('API_BASE_URL:', process.env.API_BASE_URL);
```

## Additional Resources

### Official Documentation

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Pact Documentation](https://docs.pact.io/)
- [GraphQL Testing Guide](https://graphql.org/learn/testing/)
- [REST API Testing Best Practices](https://restfulapi.net/testing/)

### Books & Courses

- "Testing JavaScript Applications" by Lucas da Costa
- "RESTful Web API Patterns and Practices Cookbook" by Mike Amundsen
- "GraphQL in Action" by Samer Buna

### Industry Standards

- **IEEE 829** - Standard for Test Documentation
- **ISO/IEC 25010** - Systems and software Quality Requirements and Evaluation (SQuaRE)
- **OWASP API Security Top 10** - Security testing guidelines

### Related Documentation in This Project

- [Integration Testing Guide](../integration-tests/README.md)
- [Contract Testing Guide](../contract-testing/README.md)
- [E2E Testing Guide](../e2e-tests/README.md)
- [Testing Strategy](../../docs/04-testing-strategy/README.md)

### Tools & Extensions

- **Postman** - API development and testing platform
- **Insomnia** - REST and GraphQL API client
- **HTTPie** - Command-line HTTP client
- **k6** - Load testing tool
- **Artillery** - Modern load testing toolkit

### Community Resources

- [API Testing Best Practices (GitHub)](https://github.com/NoriSte/ui-testing-best-practices)
- [Awesome API Testing](https://github.com/automationhacks/awesome-api-testing)
- [REST API Testing Tutorial](https://www.guru99.com/api-testing.html)

---

## Contributing

When adding new examples to this directory:

1. Follow the existing code style and structure
2. Include comprehensive comments explaining key concepts
3. Add error handling and edge cases
4. Update this README with new examples
5. Ensure all tests pass before committing
6. Add JSDoc documentation for reusable utilities

## License

These examples are part of the Code Quality Documentation Project and are provided for educational purposes.

---

**Last Updated:** 2025-10-08
**Maintainer:** Code Quality Documentation Project
**Version:** 1.0.0
