# API Testing

## Purpose

Comprehensive guide to API testing—verifying the functionality, reliability, performance, and security of application programming interfaces at the protocol level.

## Overview

API testing is:

- Testing APIs directly without a UI
- Validating request/response patterns
- Ensuring data integrity and security
- Performance and load testing
- Critical for microservices and distributed systems

## What is API Testing?

### Definition

API testing validates that APIs meet expectations for functionality, reliability, performance, and security by testing the application logic layer directly.

### Why API Testing Matters

```
Traditional Testing Pyramid:

         ╱╲
        ╱UI╲         UI Tests (5%)
       ╱────╲        Slow, Brittle, Expensive
      ╱      ╲
     ╱  API   ╲      API Tests (30%)
    ╱  Tests  ╲      Fast, Reliable, Efficient
   ╱────────────╲
  ╱              ╲
 ╱  Unit Tests   ╲   Unit Tests (65%)
╱                ╲   Fastest, Most Stable
└──────────────────┘

API Testing Benefits:
├── Language Independent
├── GUI Independent
├── Faster than UI tests
├── Easier to automate
├── Better code coverage
└── Early defect detection
```

### Types of API Testing

```
API Testing Scope:

Functional Testing
├── Verify response codes
├── Validate response data
├── Check error handling
└── Test business logic

Integration Testing
├── Service interactions
├── Database operations
├── External dependencies
└── Data flow validation

Performance Testing
├── Response times
├── Load handling
├── Stress testing
└── Scalability

Security Testing
├── Authentication
├── Authorization
├── Data encryption
├── Injection attacks
└── Rate limiting

Contract Testing
├── Consumer expectations
├── Provider capabilities
├── Schema validation
└── Version compatibility
```

## REST API Testing

### Testing with Supertest (Node.js)

#### Basic API Tests

```javascript
// __tests__/api/users.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');

describe('User API', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  beforeEach(async () => {
    await db.clearUsers();
  });

  describe('GET /api/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all users', async () => {
      // Arrange
      await db.createUser({ name: 'John Doe', email: 'john@example.com' });
      await db.createUser({ name: 'Jane Smith', email: 'jane@example.com' });

      // Act
      const response = await request(app).get('/api/users').expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should support pagination', async () => {
      // Create 15 test users
      for (let i = 1; i <= 15; i++) {
        await db.createUser({
          name: `User ${i}`,
          email: `user${i}@example.com`,
        });
      }

      const response = await request(app)
        .get('/api/users')
        .query({ page: 2, limit: 10 })
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
      });
    });

    it('should filter users by role', async () => {
      await db.createUser({ name: 'Admin User', role: 'admin' });
      await db.createUser({ name: 'Regular User', role: 'user' });

      const response = await request(app).get('/api/users').query({ role: 'admin' }).expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe('admin');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const user = await db.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await request(app).get(`/api/users/${user.id}`).expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        name: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app).get('/api/users/99999').expect(404);

      expect(response.body).toMatchObject({
        error: 'User not found',
      });
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(app).get('/api/users/invalid-id').expect(400);

      expect(response.body.error).toContain('Invalid user ID');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
        createdAt: expect.any(String),
      });
      expect(response.body.password).toBeUndefined();

      // Verify Location header
      expect(response.headers.location).toBe(`/api/users/${response.body.id}`);
    });

    it('should validate required fields', async () => {
      const response = await request(app).post('/api/users').send({}).expect(400);

      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name', message: expect.any(String) }),
          expect.objectContaining({ field: 'email', message: expect.any(String) }),
          expect.objectContaining({ field: 'password', message: expect.any(String) }),
        ])
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'SecurePass123!',
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'Invalid email format',
        })
      );
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
      };

      await request(app).post('/api/users').send(userData).expect(201);

      const response = await request(app).post('/api/users').send(userData).expect(409);

      expect(response.body.error).toContain('Email already exists');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: expect.stringContaining('Password must be'),
        })
      );
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user with valid data', async () => {
      const user = await db.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const updateData = {
        name: 'John Smith',
        email: 'john.smith@example.com',
      };

      const response = await request(app).put(`/api/users/${user.id}`).send(updateData).expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        name: 'John Smith',
        email: 'john.smith@example.com',
        updatedAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).put('/api/users/99999').send({ name: 'John Smith' }).expect(404);
    });

    it('should validate update data', async () => {
      const user = await db.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await request(app)
        .put(`/api/users/${user.id}`)
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should partially update user', async () => {
      const user = await db.createUser({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      });

      const response = await request(app)
        .patch(`/api/users/${user.id}`)
        .send({ name: 'John Smith' })
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        name: 'John Smith',
        email: 'john@example.com', // Unchanged
        role: 'user', // Unchanged
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete existing user', async () => {
      const user = await db.createUser({
        name: 'John Doe',
        email: 'john@example.com',
      });

      await request(app).delete(`/api/users/${user.id}`).expect(204);

      // Verify user is deleted
      const verifyResponse = await request(app).get(`/api/users/${user.id}`).expect(404);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app).delete('/api/users/99999').expect(404);
    });

    it('should handle cascade deletions', async () => {
      const user = await db.createUser({ name: 'John Doe' });
      await db.createOrder({ userId: user.id, total: 100 });

      await request(app).delete(`/api/users/${user.id}`).expect(204);

      // Verify related orders are also deleted
      const orders = await db.getOrdersByUserId(user.id);
      expect(orders).toHaveLength(0);
    });
  });
});
```

#### Advanced Response Validation

```javascript
// __tests__/api/validation.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Advanced Response Validation', () => {
  describe('Response Structure Validation', () => {
    it('should validate response schema', async () => {
      const response = await request(app).get('/api/users/1').expect(200);

      // Validate exact structure
      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
          role: expect.stringMatching(/^(admin|user|guest)$/),
          createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
          updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        })
      );

      // Ensure no extra fields
      expect(Object.keys(response.body)).toEqual(
        expect.arrayContaining(['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'])
      );
    });

    it('should validate nested objects', async () => {
      const response = await request(app).get('/api/users/1').expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(Number),
        profile: {
          firstName: expect.any(String),
          lastName: expect.any(String),
          age: expect.any(Number),
          address: {
            street: expect.any(String),
            city: expect.any(String),
            zipCode: expect.stringMatching(/^\d{5}(-\d{4})?$/),
          },
        },
      });
    });

    it('should validate array responses', async () => {
      const response = await request(app).get('/api/users').expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach(user => {
        expect(user).toMatchObject({
          id: expect.any(Number),
          name: expect.any(String),
          email: expect.any(String),
        });
      });
    });
  });

  describe('Header Validation', () => {
    it('should validate response headers', async () => {
      const response = await request(app).get('/api/users').expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.headers['cache-control']).toBeDefined();
      expect(response.headers['etag']).toBeDefined();
      expect(response.headers['x-ratelimit-limit']).toBe('100');
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should validate CORS headers', async () => {
      const response = await request(app)
        .options('/api/users')
        .set('Origin', 'https://example.com')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });
  });

  describe('Status Code Validation', () => {
    it('should return correct status codes for different scenarios', async () => {
      // Success scenarios
      await request(app).get('/api/users').expect(200);
      await request(app).post('/api/users').send(validUserData).expect(201);
      await request(app).delete('/api/users/1').expect(204);

      // Client error scenarios
      await request(app).get('/api/users/invalid').expect(400);
      await request(app).get('/api/protected').expect(401);
      await request(app).delete('/api/admin/users/1').expect(403);
      await request(app).get('/api/users/99999').expect(404);

      // Server error scenarios
      await request(app).post('/api/users/trigger-error').expect(500);
    });
  });

  describe('Error Response Validation', () => {
    it('should return consistent error format', async () => {
      const response = await request(app).post('/api/users').send({}).expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        message: expect.any(String),
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/users',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
          }),
        ]),
      });
    });
  });
});
```

### Testing with REST Assured (Java)

```java
// UserApiTest.java
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import org.junit.jupiter.api.*;
import static io.restassured.RestAssured.*;
import static org.hamcrest.Matchers.*;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class UserApiTest {

    private static final String BASE_URL = "http://localhost:8080";
    private static String createdUserId;

    @BeforeAll
    static void setup() {
        RestAssured.baseURI = BASE_URL;
        RestAssured.basePath = "/api";
    }

    @Test
    @Order(1)
    void testGetAllUsers() {
        given()
            .contentType(ContentType.JSON)
        .when()
            .get("/users")
        .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("$", hasSize(greaterThanOrEqualTo(0)));
    }

    @Test
    @Order(2)
    void testCreateUser() {
        String requestBody = """
            {
                "name": "John Doe",
                "email": "john@example.com",
                "password": "SecurePass123!",
                "role": "user"
            }
            """;

        Response response = given()
            .contentType(ContentType.JSON)
            .body(requestBody)
        .when()
            .post("/users")
        .then()
            .statusCode(201)
            .contentType(ContentType.JSON)
            .body("id", notNullValue())
            .body("name", equalTo("John Doe"))
            .body("email", equalTo("john@example.com"))
            .body("role", equalTo("user"))
            .body("password", nullValue())
            .extract()
            .response();

        createdUserId = response.path("id").toString();
    }

    @Test
    @Order(3)
    void testGetUserById() {
        given()
            .pathParam("id", createdUserId)
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(200)
            .body("id", equalTo(Integer.parseInt(createdUserId)))
            .body("name", equalTo("John Doe"))
            .body("email", equalTo("john@example.com"));
    }

    @Test
    @Order(4)
    void testUpdateUser() {
        String updateBody = """
            {
                "name": "John Smith",
                "email": "john.smith@example.com"
            }
            """;

        given()
            .pathParam("id", createdUserId)
            .contentType(ContentType.JSON)
            .body(updateBody)
        .when()
            .put("/users/{id}")
        .then()
            .statusCode(200)
            .body("name", equalTo("John Smith"))
            .body("email", equalTo("john.smith@example.com"));
    }

    @Test
    @Order(5)
    void testDeleteUser() {
        given()
            .pathParam("id", createdUserId)
        .when()
            .delete("/users/{id}")
        .then()
            .statusCode(204);

        // Verify deletion
        given()
            .pathParam("id", createdUserId)
        .when()
            .get("/users/{id}")
        .then()
            .statusCode(404);
    }

    @Test
    void testValidationErrors() {
        String invalidBody = """
            {
                "name": "",
                "email": "invalid-email",
                "password": "weak"
            }
            """;

        given()
            .contentType(ContentType.JSON)
            .body(invalidBody)
        .when()
            .post("/users")
        .then()
            .statusCode(400)
            .body("errors", hasSize(greaterThan(0)))
            .body("errors.field", hasItems("name", "email", "password"));
    }
}
```

### Testing with Postman/Newman

```javascript
// postman-collection.json
{
  "info": {
    "name": "User API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create User",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 201', function() {",
              "    pm.response.to.have.status(201);",
              "});",
              "",
              "pm.test('Response has user data', function() {",
              "    const jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.have.property('id');",
              "    pm.expect(jsonData.name).to.eql('John Doe');",
              "    pm.expect(jsonData.email).to.eql('john@example.com');",
              "    ",
              "    // Store user ID for subsequent tests",
              "    pm.environment.set('userId', jsonData.id);",
              "});",
              "",
              "pm.test('Response time is less than 200ms', function() {",
              "    pm.expect(pm.response.responseTime).to.be.below(200);",
              "});",
              "",
              "pm.test('Password is not returned', function() {",
              "    const jsonData = pm.response.json();",
              "    pm.expect(jsonData).to.not.have.property('password');",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"SecurePass123!\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/users",
          "host": ["{{baseUrl}}"],
          "path": ["api", "users"]
        }
      }
    },
    {
      "name": "Get User by ID",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function() {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response matches schema', function() {",
              "    const schema = {",
              "        type: 'object',",
              "        required: ['id', 'name', 'email'],",
              "        properties: {",
              "            id: { type: 'number' },",
              "            name: { type: 'string' },",
              "            email: { type: 'string', format: 'email' },",
              "            role: { type: 'string', enum: ['admin', 'user', 'guest'] }",
              "        }",
              "    };",
              "    ",
              "    pm.response.to.have.jsonSchema(schema);",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/users/{{userId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "users", "{{userId}}"]
        }
      }
    }
  ]
}
```

## Authentication and Authorization Testing

### Bearer Token Authentication

```javascript
// __tests__/api/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { generateToken } = require('../../src/utils/jwt');

describe('Authentication Tests', () => {
  let authToken;
  let user;

  beforeEach(async () => {
    user = await db.createUser({
      email: 'user@example.com',
      password: 'SecurePass123!',
      role: 'user',
    });
    authToken = generateToken(user);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123!',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        token: expect.any(String),
        user: {
          id: user.id,
          email: 'user@example.com',
          role: 'user',
        },
      });

      // Validate JWT token structure
      const tokenParts = response.body.token.split('.');
      expect(tokenParts).toHaveLength(3);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid credentials',
      });
    });

    it('should handle account lockout after failed attempts', async () => {
      // Attempt login 5 times with wrong password
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'user@example.com',
            password: 'WrongPassword',
          })
          .expect(401);
      }

      // 6th attempt should be locked out
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'SecurePass123!',
        })
        .expect(423);

      expect(response.body.error).toContain('Account locked');
    });
  });

  describe('Protected Endpoints', () => {
    it('should reject requests without token', async () => {
      const response = await request(app).get('/api/profile').expect(401);

      expect(response.body.error).toContain('No token provided');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toContain('Invalid token');
    });

    it('should reject requests with expired token', async () => {
      const expiredToken = generateToken(user, { expiresIn: '-1h' });

      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.error).toContain('Token expired');
    });

    it('should accept requests with valid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin access to admin endpoints', async () => {
      const admin = await db.createUser({
        email: 'admin@example.com',
        role: 'admin',
      });
      const adminToken = generateToken(admin);

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny user access to admin endpoints', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toContain('Insufficient permissions');
    });

    it('should allow users to access own resources', async () => {
      await request(app)
        .get(`/api/users/${user.id}/orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should deny users access to other users resources', async () => {
      const otherUser = await db.createUser({ email: 'other@example.com' });

      const response = await request(app)
        .get(`/api/users/${otherUser.id}/orders`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error).toContain('Access denied');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const { refreshToken } = await db.createRefreshToken(user.id);

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('should reject invalid refresh token', async () => {
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('API Key Authentication', () => {
    it('should authenticate with valid API key', async () => {
      const apiKey = await db.createApiKey(user.id);

      const response = await request(app).get('/api/data').set('X-API-Key', apiKey.key).expect(200);

      expect(response.body).toBeDefined();
    });

    it('should reject invalid API key', async () => {
      const response = await request(app)
        .get('/api/data')
        .set('X-API-Key', 'invalid-key')
        .expect(401);

      expect(response.body.error).toContain('Invalid API key');
    });

    it('should enforce API key rate limits', async () => {
      const apiKey = await db.createApiKey(user.id, { rateLimit: 5 });

      // Make 5 successful requests
      for (let i = 0; i < 5; i++) {
        await request(app).get('/api/data').set('X-API-Key', apiKey.key).expect(200);
      }

      // 6th request should be rate limited
      const response = await request(app).get('/api/data').set('X-API-Key', apiKey.key).expect(429);

      expect(response.body.error).toContain('Rate limit exceeded');
    });
  });
});
```

### OAuth 2.0 Testing

```javascript
// __tests__/api/oauth.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('OAuth 2.0 Flow', () => {
  describe('Authorization Code Flow', () => {
    let authorizationCode;
    let accessToken;

    it('should initiate authorization', async () => {
      const response = await request(app)
        .get('/oauth/authorize')
        .query({
          client_id: 'test-client',
          redirect_uri: 'http://localhost:3000/callback',
          response_type: 'code',
          scope: 'read write',
          state: 'random-state-string',
        })
        .expect(302);

      expect(response.headers.location).toContain('/login');
    });

    it('should exchange code for token', async () => {
      authorizationCode = await db.createAuthorizationCode({
        clientId: 'test-client',
        userId: 1,
        scope: 'read write',
      });

      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'authorization_code',
          code: authorizationCode.code,
          client_id: 'test-client',
          client_secret: 'test-secret',
          redirect_uri: 'http://localhost:3000/callback',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: expect.any(String),
        scope: 'read write',
      });

      accessToken = response.body.access_token;
    });

    it('should access protected resource with token', async () => {
      await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Client Credentials Flow', () => {
    it('should get token with client credentials', async () => {
      const response = await request(app)
        .post('/oauth/token')
        .send({
          grant_type: 'client_credentials',
          client_id: 'test-client',
          client_secret: 'test-secret',
          scope: 'read',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        access_token: expect.any(String),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    });
  });
});
```

## GraphQL API Testing

### Basic GraphQL Testing

```javascript
// __tests__/api/graphql.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('GraphQL API Tests', () => {
  describe('Queries', () => {
    it('should query user by id', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
            posts {
              id
              title
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { id: '1' },
        })
        .expect(200);

      expect(response.body.data.user).toMatchObject({
        id: '1',
        name: expect.any(String),
        email: expect.any(String),
        posts: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
          }),
        ]),
      });
    });

    it('should query list of users with pagination', async () => {
      const query = `
        query GetUsers($limit: Int, $offset: Int) {
          users(limit: $limit, offset: $offset) {
            edges {
              node {
                id
                name
                email
              }
              cursor
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              totalCount
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query,
          variables: { limit: 10, offset: 0 },
        })
        .expect(200);

      expect(response.body.data.users).toMatchObject({
        edges: expect.any(Array),
        pageInfo: {
          hasNextPage: expect.any(Boolean),
          hasPreviousPage: expect.any(Boolean),
          totalCount: expect.any(Number),
        },
      });
    });

    it('should handle query errors gracefully', async () => {
      const query = `
        query GetUser($id: ID!) {
          user(id: $id) {
            id
            invalidField
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({ query, variables: { id: '1' } })
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0]).toMatchObject({
        message: expect.stringContaining('invalidField'),
      });
    });
  });

  describe('Mutations', () => {
    it('should create user', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            user {
              id
              name
              email
            }
            errors {
              field
              message
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              name: 'John Doe',
              email: 'john@example.com',
              password: 'SecurePass123!',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createUser).toMatchObject({
        user: {
          id: expect.any(String),
          name: 'John Doe',
          email: 'john@example.com',
        },
        errors: null,
      });
    });

    it('should validate input data', async () => {
      const mutation = `
        mutation CreateUser($input: CreateUserInput!) {
          createUser(input: $input) {
            user {
              id
            }
            errors {
              field
              message
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            input: {
              name: '',
              email: 'invalid-email',
            },
          },
        })
        .expect(200);

      expect(response.body.data.createUser.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('should update user', async () => {
      const mutation = `
        mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
          updateUser(id: $id, input: $input) {
            user {
              id
              name
              email
            }
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: {
            id: '1',
            input: {
              name: 'John Smith',
            },
          },
        })
        .expect(200);

      expect(response.body.data.updateUser.user.name).toBe('John Smith');
    });

    it('should delete user', async () => {
      const mutation = `
        mutation DeleteUser($id: ID!) {
          deleteUser(id: $id) {
            success
            message
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .send({
          query: mutation,
          variables: { id: '1' },
        })
        .expect(200);

      expect(response.body.data.deleteUser).toMatchObject({
        success: true,
        message: expect.any(String),
      });
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to user updates', done => {
      const subscription = `
        subscription OnUserUpdated($userId: ID!) {
          userUpdated(userId: $userId) {
            id
            name
            email
          }
        }
      `;

      const client = createSubscriptionClient();

      client.subscribe(
        {
          query: subscription,
          variables: { userId: '1' },
        },
        (error, result) => {
          if (error) {
            done(error);
            return;
          }

          expect(result.data.userUpdated).toMatchObject({
            id: '1',
            name: expect.any(String),
            email: expect.any(String),
          });

          client.close();
          done();
        }
      );

      // Trigger update
      setTimeout(() => {
        updateUser('1', { name: 'Updated Name' });
      }, 100);
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected queries', async () => {
      const query = `
        query GetProfile {
          me {
            id
            email
          }
        }
      `;

      const response = await request(app).post('/graphql').send({ query }).expect(200);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Not authenticated');
    });

    it('should allow authenticated queries', async () => {
      const token = generateAuthToken();
      const query = `
        query GetProfile {
          me {
            id
            email
          }
        }
      `;

      const response = await request(app)
        .post('/graphql')
        .set('Authorization', `Bearer ${token}`)
        .send({ query })
        .expect(200);

      expect(response.body.data.me).toBeDefined();
    });
  });
});
```

## Contract Testing for APIs

### Consumer Contract Tests

```javascript
// __tests__/contracts/user-service-consumer.test.js
const { PactV3, MatchersV3 } = require('@pact-foundation/pact');
const { like, eachLike, regex } = MatchersV3;
const UserService = require('../../src/services/user-service');

describe('User Service Consumer Contract', () => {
  const provider = new PactV3({
    consumer: 'UserWebApp',
    provider: 'UserAPI',
    dir: './pacts',
  });

  describe('GET /api/users/:id', () => {
    it('returns a user by ID', async () => {
      await provider
        .given('user 1 exists')
        .uponReceiving('a request for user 1')
        .withRequest({
          method: 'GET',
          path: '/api/users/1',
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
            email: regex('\\w+@\\w+\\.\\w+', 'john@example.com'),
            role: regex('(admin|user|guest)', 'user'),
            createdAt: regex('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}', '2024-01-01T00:00:00'),
          },
        })
        .executeTest(async mockServer => {
          const userService = new UserService(mockServer.url);
          const user = await userService.getUserById(1, 'token123');

          expect(user).toMatchObject({
            id: 1,
            name: expect.any(String),
            email: expect.stringMatching(/\w+@\w+\.\w+/),
            role: expect.stringMatching(/(admin|user|guest)/),
          });
        });
    });

    it('returns 404 when user not found', async () => {
      await provider
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
            error: like('User not found'),
            statusCode: 404,
          },
        })
        .executeTest(async mockServer => {
          const userService = new UserService(mockServer.url);

          await expect(userService.getUserById(999)).rejects.toThrow('User not found');
        });
    });
  });

  describe('GET /api/users', () => {
    it('returns a list of users', async () => {
      await provider
        .given('users exist')
        .uponReceiving('a request for all users')
        .withRequest({
          method: 'GET',
          path: '/api/users',
          query: {
            page: '1',
            limit: '10',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike(
              {
                id: like(1),
                name: like('John Doe'),
                email: regex('\\w+@\\w+\\.\\w+', 'john@example.com'),
              },
              { min: 1 }
            ),
            pagination: {
              page: 1,
              limit: 10,
              total: like(20),
              totalPages: like(2),
            },
          },
        })
        .executeTest(async mockServer => {
          const userService = new UserService(mockServer.url);
          const result = await userService.getUsers({ page: 1, limit: 10 });

          expect(result.data.length).toBeGreaterThan(0);
          expect(result.pagination).toBeDefined();
        });
    });
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      await provider
        .given('no users exist with email john@example.com')
        .uponReceiving('a request to create a user')
        .withRequest({
          method: 'POST',
          path: '/api/users',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123!',
          },
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            Location: regex('/api/users/\\d+', '/api/users/1'),
          },
          body: {
            id: like(1),
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
            createdAt: regex('\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}', '2024-01-01T00:00:00'),
          },
        })
        .executeTest(async mockServer => {
          const userService = new UserService(mockServer.url);
          const user = await userService.createUser({
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123!',
          });

          expect(user.id).toBeDefined();
          expect(user.name).toBe('John Doe');
          expect(user.email).toBe('john@example.com');
        });
    });
  });
});
```

### Provider Contract Verification

```javascript
// __tests__/contracts/user-api-provider.test.js
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const app = require('../../src/app');
const db = require('../../src/db');

describe('User API Provider Verification', () => {
  let server;

  beforeAll(async () => {
    await db.connect();
    server = app.listen(9000);
  });

  afterAll(async () => {
    server.close();
    await db.disconnect();
  });

  it('should validate the expectations of UserWebApp', async () => {
    const opts = {
      provider: 'UserAPI',
      providerBaseUrl: 'http://localhost:9000',

      // Pact Broker configuration
      pactBrokerUrl: process.env.PACT_BROKER_URL,
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT || '1.0.0',

      // State handlers
      stateHandlers: {
        'user 1 exists': async () => {
          await db.clearUsers();
          await db.createUser({
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'user',
          });
        },
        'user 999 does not exist': async () => {
          await db.clearUsers();
        },
        'users exist': async () => {
          await db.clearUsers();
          for (let i = 1; i <= 20; i++) {
            await db.createUser({
              id: i,
              name: `User ${i}`,
              email: `user${i}@example.com`,
            });
          }
        },
        'no users exist with email john@example.com': async () => {
          await db.clearUsers();
        },
      },

      // Request filters
      requestFilter: (req, res, next) => {
        // Add auth header if needed
        req.headers['Authorization'] = 'Bearer test-token';
        next();
      },
    };

    const verifier = new Verifier(opts);
    await verifier.verifyProvider();
  });
});
```

## Performance Testing for APIs

### Load Testing with k6

```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const userCreationTime = new Trend('user_creation_time');

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 20 }, // Stay at 20 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.1'], // Error rate must be below 10%
  },
};

const BASE_URL = 'http://localhost:3000/api';

export default function () {
  // Test GET /api/users
  let response = http.get(`${BASE_URL}/users`);
  check(response, {
    'get users status is 200': r => r.status === 200,
    'get users response time < 200ms': r => r.timings.duration < 200,
  });
  errorRate.add(response.status !== 200);

  sleep(1);

  // Test POST /api/users
  const payload = JSON.stringify({
    name: `User ${Date.now()}`,
    email: `user${Date.now()}@example.com`,
    password: 'SecurePass123!',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  response = http.post(`${BASE_URL}/users`, payload, params);
  const creationSuccess = check(response, {
    'create user status is 201': r => r.status === 201,
    'user has id': r => r.json('id') !== undefined,
  });

  if (creationSuccess) {
    userCreationTime.add(response.timings.duration);
  }
  errorRate.add(response.status !== 201);

  sleep(1);

  // Test GET /api/users/:id
  if (response.status === 201) {
    const userId = response.json('id');
    response = http.get(`${BASE_URL}/users/${userId}`);
    check(response, {
      'get user by id status is 200': r => r.status === 200,
    });
    errorRate.add(response.status !== 200);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Performance Testing with Artillery

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Warm up'
    - duration: 120
      arrivalRate: 50
      name: 'Sustained load'
    - duration: 60
      arrivalRate: 100
      name: 'Peak load'
  plugins:
    expect: {}
  variables:
    baseUrl: '/api'

scenarios:
  - name: 'User CRUD Operations'
    flow:
      - get:
          url: '{{ baseUrl }}/users'
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: length

      - post:
          url: '{{ baseUrl }}/users'
          json:
            name: '{{ $randomString() }}'
            email: '{{ $randomString() }}@example.com'
            password: 'SecurePass123!'
          capture:
            - json: '$.id'
              as: 'userId'
          expect:
            - statusCode: 201
            - hasProperty: id

      - get:
          url: '{{ baseUrl }}/users/{{ userId }}'
          expect:
            - statusCode: 200
            - hasProperty: id

      - put:
          url: '{{ baseUrl }}/users/{{ userId }}'
          json:
            name: 'Updated {{ $randomString() }}'
          expect:
            - statusCode: 200

      - delete:
          url: '{{ baseUrl }}/users/{{ userId }}'
          expect:
            - statusCode: 204

  - name: 'Search and Filter'
    flow:
      - get:
          url: '{{ baseUrl }}/users?role=admin'
          expect:
            - statusCode: 200

      - get:
          url: '{{ baseUrl }}/users?page=1&limit=10'
          expect:
            - statusCode: 200
            - hasProperty: pagination
```

## API Testing Best Practices

### 1. Test Data Management

```javascript
// __tests__/helpers/test-data.js
class TestDataBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.data = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'SecurePass123!',
      role: 'user',
    };
    return this;
  }

  withName(name) {
    this.data.name = name;
    return this;
  }

  withEmail(email) {
    this.data.email = email;
    return this;
  }

  withRole(role) {
    this.data.role = role;
    return this;
  }

  asAdmin() {
    this.data.role = 'admin';
    return this;
  }

  build() {
    return { ...this.data };
  }
}

// Usage
const userData = new TestDataBuilder().withName('John Doe').asAdmin().build();
```

### 2. Response Assertions Helper

```javascript
// __tests__/helpers/assertions.js
class ApiAssertions {
  static expectSuccessfulResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.headers['content-type']).toMatch(/json/);
  }

  static expectValidationError(response, field) {
    expect(response.status).toBe(400);
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.some(e => e.field === field)).toBe(true);
  }

  static expectNotFound(response, resourceType = 'Resource') {
    expect(response.status).toBe(404);
    expect(response.body.error).toContain(`${resourceType} not found`);
  }

  static expectUnauthorized(response) {
    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  }

  static expectForbidden(response) {
    expect(response.status).toBe(403);
    expect(response.body.error).toContain('permission');
  }

  static expectPaginatedResponse(response, expectedFields) {
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toMatchObject({
      page: expect.any(Number),
      limit: expect.any(Number),
      total: expect.any(Number),
      totalPages: expect.any(Number),
    });

    if (expectedFields && response.body.data.length > 0) {
      expectedFields.forEach(field => {
        expect(response.body.data[0]).toHaveProperty(field);
      });
    }
  }
}

module.exports = ApiAssertions;
```

### 3. API Test Organization

```javascript
// __tests__/api/users/index.test.js
describe('User API', () => {
  require('./get-users.test');
  require('./get-user-by-id.test');
  require('./create-user.test');
  require('./update-user.test');
  require('./delete-user.test');
  require('./user-validation.test');
  require('./user-authorization.test');
});

// __tests__/api/users/create-user.test.js
const request = require('supertest');
const app = require('../../../src/app');

describe('POST /api/users', () => {
  it('should create user with valid data', async () => {
    // Test implementation
  });

  it('should validate required fields', async () => {
    // Test implementation
  });

  // More specific tests...
});
```

### 4. Environment Configuration

```javascript
// __tests__/config/test-config.js
module.exports = {
  api: {
    baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    timeout: 5000,
  },
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: process.env.TEST_DB_PORT || 5432,
    database: 'test_db',
  },
  auth: {
    testUser: {
      email: 'test@example.com',
      password: 'TestPass123!',
    },
    testAdmin: {
      email: 'admin@example.com',
      password: 'AdminPass123!',
    },
  },
};
```

## API Testing Anti-Patterns

### Anti-Pattern 1: Hardcoded Test Data

```javascript
// BAD: Hardcoded, can cause conflicts
it('should create user', async () => {
  const response = await request(app).post('/api/users').send({
    email: 'john@example.com', // Will fail if run multiple times
    name: 'John Doe',
  });
});

// GOOD: Dynamic test data
it('should create user', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({
      email: `test${Date.now()}@example.com`,
      name: 'John Doe',
    });
});
```

### Anti-Pattern 2: Testing Implementation Details

```javascript
// BAD: Testing internal structure
it('should use bcrypt for password hashing', async () => {
  const user = await createUser({ password: 'test' });
  expect(user.password).toMatch(/^\$2[aby]\$/);
});

// GOOD: Testing behavior
it('should not return password in response', async () => {
  const response = await request(app).post('/api/users').send(userData);

  expect(response.body.password).toBeUndefined();
});
```

### Anti-Pattern 3: Dependent Tests

```javascript
// BAD: Tests depend on each other
let userId;

it('should create user', async () => {
  const response = await createUser();
  userId = response.body.id;
});

it('should update user', async () => {
  await updateUser(userId); // Fails if previous test fails
});

// GOOD: Independent tests
it('should update user', async () => {
  const user = await createTestUser();
  const response = await updateUser(user.id);
  expect(response.status).toBe(200);
});
```

## API Testing Metrics

### Key Performance Indicators

```
API Testing KPIs:

Response Time Metrics:
├── Average Response Time: < 200ms
├── 95th Percentile: < 500ms
├── 99th Percentile: < 1000ms
└── Max Response Time: < 2000ms

Reliability Metrics:
├── Success Rate: > 99.9%
├── Error Rate: < 0.1%
├── Timeout Rate: < 0.01%
└── Uptime: > 99.99%

Coverage Metrics:
├── Endpoint Coverage: 100%
├── Status Code Coverage: > 90%
├── Error Path Coverage: > 80%
└── Schema Validation: 100%

Performance Metrics:
├── Throughput: > 1000 req/s
├── Concurrent Users: > 100
├── Peak Load Handling: > 500 req/s
└── Resource Utilization: < 70%
```

### Measuring API Quality

```javascript
// __tests__/metrics/api-quality.test.js
describe('API Quality Metrics', () => {
  it('should meet response time SLA', async () => {
    const iterations = 100;
    const responseTimes = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await request(app).get('/api/users');
      responseTimes.push(Date.now() - start);
    }

    const average = responseTimes.reduce((a, b) => a + b) / iterations;
    const p95 = percentile(responseTimes, 95);
    const p99 = percentile(responseTimes, 99);

    expect(average).toBeLessThan(200);
    expect(p95).toBeLessThan(500);
    expect(p99).toBeLessThan(1000);
  });

  it('should handle concurrent requests', async () => {
    const concurrentRequests = 50;
    const requests = Array(concurrentRequests)
      .fill()
      .map(() => request(app).get('/api/users'));

    const responses = await Promise.all(requests);
    const successfulResponses = responses.filter(r => r.status === 200);

    expect(successfulResponses.length).toBe(concurrentRequests);
  });
});

function percentile(values, p) {
  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}
```

## Integration with CI/CD

### GitHub Actions Configuration

```yaml
# .github/workflows/api-tests.yml
name: API Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  api-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run API tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          NODE_ENV: test
        run: npm run test:api

      - name: Run contract tests
        run: npm run test:contract

      - name: Publish Pact contracts
        if: success()
        env:
          PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
          PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
        run: npm run pact:publish

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: api-test-results
          path: test-results/

      - name: Upload coverage
        if: always()
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: api-tests
```

## Checklist

### API Testing Implementation Checklist

**Functional Testing:**

- [ ] Test all CRUD operations
- [ ] Validate request/response schemas
- [ ] Test all status codes (2xx, 4xx, 5xx)
- [ ] Verify error handling
- [ ] Test edge cases and boundary values
- [ ] Validate data transformations
- [ ] Test filtering and pagination
- [ ] Verify search functionality

**Authentication & Authorization:**

- [ ] Test authentication flows
- [ ] Verify token validation
- [ ] Test token expiration
- [ ] Validate role-based access
- [ ] Test permission checks
- [ ] Verify OAuth flows
- [ ] Test API key authentication
- [ ] Validate rate limiting

**Contract Testing:**

- [ ] Define consumer contracts
- [ ] Implement provider verification
- [ ] Publish contracts to broker
- [ ] Version API contracts
- [ ] Test backward compatibility

**Performance Testing:**

- [ ] Test response times
- [ ] Measure throughput
- [ ] Test concurrent users
- [ ] Perform load testing
- [ ] Conduct stress testing
- [ ] Test scalability
- [ ] Monitor resource usage

**Security Testing:**

- [ ] Test input validation
- [ ] Verify SQL injection prevention
- [ ] Test XSS prevention
- [ ] Validate CSRF protection
- [ ] Test SSL/TLS encryption
- [ ] Verify sensitive data handling
- [ ] Test rate limiting
- [ ] Validate CORS configuration

**Best Practices:**

- [ ] Use test data builders
- [ ] Implement proper cleanup
- [ ] Use environment variables
- [ ] Create reusable helpers
- [ ] Document test scenarios
- [ ] Maintain test independence
- [ ] Use meaningful assertions
- [ ] Track test coverage

## References

### Standards and Guidelines

- **ISO/IEC/IEEE 29119** - Software Testing Standards
- **ISTQB API Testing** - API Testing Certification
- **OpenAPI Specification** - API Documentation Standard
- **RFC 7231** - HTTP/1.1 Semantics and Content
- **OAuth 2.0 RFC 6749** - Authorization Framework

### Tools and Frameworks

- **Supertest** - HTTP assertion library for Node.js
- **REST Assured** - Java DSL for REST API testing
- **Postman/Newman** - API development and testing platform
- **Pact** - Consumer-driven contract testing
- **k6** - Performance testing tool
- **Artillery** - Load testing toolkit

### Books and Resources

- "Testing Web APIs" - Mark Winteringham
- "REST API Design Rulebook" - Mark Massé
- "GraphQL in Action" - Samer Buna
- "Microservices Testing" - J.B. Rainsberger

## Related Topics

- [Contract Testing](contract-testing.md) - Detailed contract testing strategies
- [Microservices Testing](microservices-testing.md) - Testing microservices architectures
- [Integration Testing](integration-testing.md) - Integration testing approaches
- [Performance Testing](../06-quality-attributes/performance.md) - Performance testing techniques
- [Security Testing](../06-quality-attributes/security.md) - Security testing practices

---

_Part of: [Test Levels](05-README.md)_
