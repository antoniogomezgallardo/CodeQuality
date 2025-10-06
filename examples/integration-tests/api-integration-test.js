/**
 * API Integration Testing Example
 * Demonstrates testing RESTful APIs with real HTTP requests
 */

const request = require('supertest');
const app = require('./app'); // Your Express app
const { setupTestDB, cleanupTestDB } = require('./test-helpers/database');

// ============================================
// 1. API ENDPOINT TESTING
// ============================================

describe('User API Integration Tests', () => {
  let testUser;
  let authToken;

  // Setup test database before all tests
  beforeAll(async () => {
    await setupTestDB();
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestDB();
  });

  // Clean data before each test
  beforeEach(async () => {
    // Create a test user
    testUser = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };
  });

  describe('POST /api/users/register', () => {
    test('should register new user successfully', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }
      });

      // Verify user was created in database
      const userInDB = await User.findOne({ email: testUser.email });
      expect(userInDB).toBeTruthy();
      expect(userInDB.password).not.toBe(testUser.password); // Should be hashed
    });

    test('should reject duplicate email registration', async () => {
      // First registration
      await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(201);

      // Duplicate registration attempt
      const response = await request(app)
        .post('/api/users/register')
        .send(testUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email already exists'
      });
    });

    test('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: '123' // Too short
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveLength(3); // email, password, firstName
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Register user for login tests
      await request(app)
        .post('/api/users/register')
        .send(testUser);
    });

    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        token: expect.any(String),
        user: {
          email: testUser.email
        }
      });

      authToken = response.body.token;
    });

    test('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid credentials'
      });
    });
  });

  describe('GET /api/users/profile', () => {
    beforeEach(async () => {
      // Register and login user
      await request(app)
        .post('/api/users/register')
        .send(testUser);

      const loginResponse = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      authToken = loginResponse.body.token;
    });

    test('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        }
      });

      // Sensitive data should not be returned
      expect(response.body.user.password).toBeUndefined();
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'No token provided'
      });
    });

    test('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid token'
      });
    });
  });
});

// ============================================
// 2. ERROR HANDLING TESTING
// ============================================

describe('API Error Handling', () => {
  test('should handle 404 for non-existent endpoints', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Endpoint not found'
    });
  });

  test('should handle malformed JSON', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .set('Content-Type', 'application/json')
      .send('{"invalid": json}')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid JSON'
    });
  });

  test('should handle server errors gracefully', async () => {
    // Mock a database connection error
    jest.spyOn(User, 'find').mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/users')
      .expect(500);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Internal server error'
    });

    // Clean up mock
    User.find.mockRestore();
  });
});

// ============================================
// 3. RATE LIMITING TESTING
// ============================================

describe('Rate Limiting', () => {
  test('should enforce rate limits', async () => {
    const endpoint = '/api/users/login';
    const invalidCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    // Make multiple requests rapidly
    const requests = Array(6).fill().map(() =>
      request(app)
        .post(endpoint)
        .send(invalidCredentials)
    );

    const responses = await Promise.all(requests);

    // First 5 should be 401 (unauthorized)
    responses.slice(0, 5).forEach(response => {
      expect(response.status).toBe(401);
    });

    // 6th should be rate limited
    expect(responses[5].status).toBe(429);
    expect(responses[5].body).toMatchObject({
      success: false,
      error: 'Too many requests'
    });
  }, 10000); // Longer timeout for multiple requests
});

// ============================================
// 4. PAGINATION TESTING
// ============================================

describe('Pagination', () => {
  beforeAll(async () => {
    // Create test data
    const users = Array(25).fill().map((_, i) => ({
      email: `user${i}@example.com`,
      password: 'password123',
      firstName: `User${i}`,
      lastName: 'Test'
    }));

    // Register all users
    for (const user of users) {
      await request(app)
        .post('/api/users/register')
        .send(user);
    }
  });

  test('should return paginated results', async () => {
    const response = await request(app)
      .get('/api/users?page=1&limit=10')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.any(Array),
      pagination: {
        currentPage: 1,
        totalPages: expect.any(Number),
        totalItems: expect.any(Number),
        limit: 10
      }
    });

    expect(response.body.data).toHaveLength(10);
  });

  test('should handle page out of range', async () => {
    const response = await request(app)
      .get('/api/users?page=999&limit=10')
      .expect(200);

    expect(response.body.data).toHaveLength(0);
    expect(response.body.pagination.currentPage).toBe(999);
  });
});

// ============================================
// 5. FILE UPLOAD TESTING
// ============================================

describe('File Upload', () => {
  let authToken;

  beforeEach(async () => {
    // Login to get auth token
    await request(app)
      .post('/api/users/register')
      .send({
        email: 'upload@example.com',
        password: 'password123',
        firstName: 'Upload',
        lastName: 'Test'
      });

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: 'upload@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  test('should upload profile image successfully', async () => {
    const response = await request(app)
      .post('/api/users/upload-avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('avatar', Buffer.from('fake image data'), 'avatar.jpg')
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      imageUrl: expect.stringContaining('.jpg')
    });
  });

  test('should reject invalid file types', async () => {
    const response = await request(app)
      .post('/api/users/upload-avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('avatar', Buffer.from('fake data'), 'file.txt')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Invalid file type'
    });
  });

  test('should reject oversized files', async () => {
    const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB

    const response = await request(app)
      .post('/api/users/upload-avatar')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('avatar', largeBuffer, 'large.jpg')
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'File too large'
    });
  });
});

// ============================================
// 6. CORS TESTING
// ============================================

describe('CORS Configuration', () => {
  test('should include CORS headers', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeTruthy();
    expect(response.headers['access-control-allow-methods']).toBeTruthy();
  });

  test('should handle preflight requests', async () => {
    const response = await request(app)
      .options('/api/users')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});

// ============================================
// TEST HELPERS
// ============================================

// Test database setup helper
async function setupTestDB() {
  // Connect to test database
  const mongoose = require('mongoose');
  const testDBUrl = process.env.TEST_DB_URL || 'mongodb://localhost/test-db';

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDBUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
}

// Test database cleanup helper
async function cleanupTestDB() {
  const mongoose = require('mongoose');

  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  }
}

module.exports = {
  setupTestDB,
  cleanupTestDB
};