/**
 * REST API Testing Examples with Supertest and Jest
 *
 * This file demonstrates comprehensive REST API testing patterns including:
 * - CRUD operations (GET, POST, PUT, PATCH, DELETE)
 * - Authentication and authorization testing
 * - Request/response validation
 * - Error handling (4xx, 5xx)
 * - Query parameters, pagination, filtering, sorting
 * - Rate limiting and CORS
 * - Content-Type validation
 *
 * @requires supertest
 * @requires jest
 * @requires express
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// ============================================================================
// Mock Express Application Setup
// ============================================================================

/**
 * Create a mock Express application for testing
 * In production, this would import your actual Express app
 */
const createApp = () => {
  const app = express();
  app.use(express.json());

  // Mock data store
  let users = [
    {
      id: 1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      role: 'user',
      createdAt: '2025-01-02T00:00:00Z',
    },
    {
      id: 3,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      role: 'user',
      createdAt: '2025-01-03T00:00:00Z',
    },
  ];
  let nextId = 4;

  // Rate limiting state
  const rateLimitStore = new Map();

  // ============================================================================
  // Middleware
  // ============================================================================

  /**
   * Rate limiting middleware
   * Allows 10 requests per minute per IP
   */
  const rateLimit = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 10;

    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }

    const requests = rateLimitStore.get(ip);
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: 60,
      });
    }

    validRequests.push(now);
    rateLimitStore.set(ip, validRequests);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

    next();
  };

  /**
   * CORS middleware
   */
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  });

  /**
   * Authentication middleware
   * Validates JWT tokens or API keys
   */
  const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    // Check for API key authentication
    if (apiKey) {
      if (apiKey === 'valid-api-key-12345') {
        req.user = { id: 1, role: 'admin' };
        return next();
      } else {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid or expired',
        });
      }
    }

    // Check for JWT token authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, 'test-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or expired',
        details: error.message,
      });
    }
  };

  /**
   * Authorization middleware
   * Checks if user has required role
   */
  const authorize = (...roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required role: ${roles.join(' or ')}`,
        });
      }

      next();
    };
  };

  // ============================================================================
  // Routes
  // ============================================================================

  /**
   * POST /api/auth/login
   * Authenticate user and return JWT token
   */
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required',
        fields: {
          email: !email ? 'Email is required' : null,
          password: !password ? 'Password is required' : null,
        },
      });
    }

    // Mock authentication (in production, verify against database)
    if (email === 'admin@example.com' && password === 'admin123') {
      const token = jwt.sign({ id: 1, email, role: 'admin' }, 'test-secret-key', {
        expiresIn: '1h',
      });

      return res.status(200).json({
        token,
        user: { id: 1, email, role: 'admin' },
        expiresIn: 3600,
      });
    }

    if (email === 'user@example.com' && password === 'user123') {
      const token = jwt.sign({ id: 2, email, role: 'user' }, 'test-secret-key', {
        expiresIn: '1h',
      });

      return res.status(200).json({
        token,
        user: { id: 2, email, role: 'user' },
        expiresIn: 3600,
      });
    }

    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password',
    });
  });

  /**
   * GET /api/users
   * Get all users with pagination, filtering, and sorting
   */
  app.get('/api/users', rateLimit, authenticate, (req, res) => {
    try {
      let result = [...users];

      // Filtering
      if (req.query.role) {
        result = result.filter(user => user.role === req.query.role);
      }

      if (req.query.search) {
        const searchLower = req.query.search.toLowerCase();
        result = result.filter(
          user =>
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
      }

      // Sorting
      const sortBy = req.query.sortBy || 'id';
      const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

      result.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1 * sortOrder;
        if (a[sortBy] > b[sortBy]) return 1 * sortOrder;
        return 0;
      });

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const total = result.length;
      const paginatedResult = result.slice(offset, offset + limit);

      res.status(200).json({
        users: paginatedResult,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: offset + limit < total,
          hasPrevPage: page > 1,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        details: error.message,
      });
    }
  });

  /**
   * GET /api/users/:id
   * Get a specific user by ID
   */
  app.get('/api/users/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid user ID format',
      });
    }

    const user = users.find(u => u.id === id);

    if (!user) {
      return res.status(404).json({
        error: 'Not found',
        message: `User with ID ${id} not found`,
      });
    }

    res.status(200).json(user);
  });

  /**
   * POST /api/users
   * Create a new user
   */
  app.post('/api/users', authenticate, authorize('admin'), (req, res) => {
    const { name, email, role } = req.body;

    // Validation
    const errors = {};

    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.length < 2 || name.length > 100) {
      errors.name = 'Name must be between 2 and 100 characters';
    }

    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    } else if (users.some(u => u.email === email)) {
      errors.email = 'Email already exists';
    }

    if (role && !['admin', 'user'].includes(role)) {
      errors.role = 'Role must be either "admin" or "user"';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'One or more fields are invalid',
        fields: errors,
      });
    }

    const newUser = {
      id: nextId++,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    res.status(201).setHeader('Location', `/api/users/${newUser.id}`).json(newUser);
  });

  /**
   * PUT /api/users/:id
   * Replace a user entirely
   */
  app.put('/api/users/:id', authenticate, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, role } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid user ID format',
      });
    }

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Not found',
        message: `User with ID ${id} not found`,
      });
    }

    // Validation
    const errors = {};

    if (!name || name.trim().length === 0) {
      errors.name = 'Name is required';
    }

    if (!email || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    } else if (users.some(u => u.email === email && u.id !== id)) {
      errors.email = 'Email already exists';
    }

    if (role && !['admin', 'user'].includes(role)) {
      errors.role = 'Role must be either "admin" or "user"';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'One or more fields are invalid',
        fields: errors,
      });
    }

    const updatedUser = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role || 'user',
      createdAt: users[userIndex].createdAt,
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;

    res.status(200).json(updatedUser);
  });

  /**
   * PATCH /api/users/:id
   * Partially update a user
   */
  app.patch('/api/users/:id', authenticate, (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid user ID format',
      });
    }

    // Users can only update themselves unless they're admin
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own profile',
      });
    }

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Not found',
        message: `User with ID ${id} not found`,
      });
    }

    const { name, email, role } = req.body;

    // Validation
    const errors = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = 'Name must be a non-empty string';
      } else if (name.length < 2 || name.length > 100) {
        errors.name = 'Name must be between 2 and 100 characters';
      }
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim().length === 0) {
        errors.email = 'Email must be a non-empty string';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Invalid email format';
      } else if (users.some(u => u.email === email && u.id !== id)) {
        errors.email = 'Email already exists';
      }
    }

    if (role !== undefined) {
      if (req.user.role !== 'admin') {
        errors.role = 'Only admins can change user roles';
      } else if (!['admin', 'user'].includes(role)) {
        errors.role = 'Role must be either "admin" or "user"';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'One or more fields are invalid',
        fields: errors,
      });
    }

    const updatedUser = {
      ...users[userIndex],
      ...(name && { name: name.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(role && { role }),
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;

    res.status(200).json(updatedUser);
  });

  /**
   * DELETE /api/users/:id
   * Delete a user
   */
  app.delete('/api/users/:id', authenticate, authorize('admin'), (req, res) => {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid user ID format',
      });
    }

    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Not found',
        message: `User with ID ${id} not found`,
      });
    }

    // Prevent deleting yourself
    if (req.user.id === id) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'You cannot delete your own account',
      });
    }

    users.splice(userIndex, 1);

    res.status(204).end();
  });

  /**
   * GET /api/health
   * Health check endpoint (no authentication required)
   */
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Error handling for unsupported Content-Type
   */
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Invalid JSON payload',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred',
    });
  });

  /**
   * 404 handler for unknown routes
   */
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });

  return app;
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Generate a valid JWT token for testing
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration
 * @returns {string} JWT token
 */
const generateToken = (payload = { id: 1, role: 'admin' }, expiresIn = '1h') => {
  return jwt.sign(payload, 'test-secret-key', { expiresIn });
};

/**
 * Generate an expired JWT token for testing
 * @returns {string} Expired JWT token
 */
const generateExpiredToken = () => {
  return jwt.sign({ id: 1, role: 'admin' }, 'test-secret-key', { expiresIn: '-1h' });
};

// ============================================================================
// Test Suite
// ============================================================================

describe('REST API Testing with Supertest', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  // ==========================================================================
  // Authentication Tests
  // ==========================================================================

  describe('Authentication', () => {
    describe('POST /api/auth/login', () => {
      it('should authenticate with valid credentials and return JWT token', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@example.com',
            password: 'admin123',
          })
          .expect(200)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('expiresIn');
        expect(response.body.user.email).toBe('admin@example.com');
        expect(response.body.user.role).toBe('admin');
        expect(typeof response.body.token).toBe('string');
      });

      it('should return 401 for invalid credentials', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@example.com',
            password: 'wrongpassword',
          })
          .expect(401)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Authentication failed');
        expect(response.body.message).toContain('Invalid email or password');
      });

      it('should return 400 for missing email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            password: 'admin123',
          })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('Validation error');
        expect(response.body.fields.email).toContain('required');
      });

      it('should return 400 for missing password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@example.com',
          })
          .expect(400)
          .expect('Content-Type', /json/);

        expect(response.body).toHaveProperty('error');
        expect(response.body.fields.password).toContain('required');
      });

      it('should return 400 for missing both email and password', async () => {
        const response = await request(app).post('/api/auth/login').send({}).expect(400);

        expect(response.body.fields.email).toBeTruthy();
        expect(response.body.fields.password).toBeTruthy();
      });
    });

    describe('JWT Token Authentication', () => {
      it('should accept valid JWT token', async () => {
        const token = generateToken();

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(response.body).toHaveProperty('users');
      });

      it('should reject expired JWT token', async () => {
        const expiredToken = generateExpiredToken();

        const response = await request(app)
          .get('/api/users')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
        expect(response.body.message).toContain('expired');
      });

      it('should reject invalid JWT token', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', 'Bearer invalid-token-123')
          .expect(401);

        expect(response.body.error).toBe('Invalid token');
      });

      it('should reject missing authorization header', async () => {
        const response = await request(app).get('/api/users').expect(401);

        expect(response.body.error).toBe('Unauthorized');
        expect(response.body.message).toContain('Missing or invalid authorization header');
      });

      it('should reject malformed authorization header', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('Authorization', 'InvalidFormat token123')
          .expect(401);

        expect(response.body.error).toBe('Unauthorized');
      });
    });

    describe('API Key Authentication', () => {
      it('should accept valid API key', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('X-API-Key', 'valid-api-key-12345')
          .expect(200);

        expect(response.body).toHaveProperty('users');
      });

      it('should reject invalid API key', async () => {
        const response = await request(app)
          .get('/api/users')
          .set('X-API-Key', 'invalid-api-key')
          .expect(401);

        expect(response.body.error).toBe('Invalid API key');
      });
    });
  });

  // ==========================================================================
  // Authorization Tests
  // ==========================================================================

  describe('Authorization', () => {
    it('should allow admin to create users', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          role: 'user',
        })
        .expect(201);

      expect(response.body.name).toBe('New User');
    });

    it('should prevent non-admin from creating users', async () => {
      const userToken = generateToken({ id: 2, role: 'user' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'New User',
          email: 'newuser@example.com',
        })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow users to update their own profile', async () => {
      const userToken = generateToken({ id: 2, role: 'user' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });

    it('should prevent users from updating other profiles', async () => {
      const userToken = generateToken({ id: 2, role: 'user' });

      const response = await request(app)
        .patch('/api/users/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacker',
        })
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });

    it('should prevent users from changing their own role', async () => {
      const userToken = generateToken({ id: 2, role: 'user' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'admin',
        })
        .expect(400);

      expect(response.body.fields.role).toContain('Only admins');
    });

    it('should allow admin to change user roles', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'admin',
        })
        .expect(200);

      expect(response.body.role).toBe('admin');
    });
  });

  // ==========================================================================
  // GET Requests
  // ==========================================================================

  describe('GET /api/users', () => {
    it('should return all users with pagination', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('should support pagination with page and limit', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter users by role', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ role: 'admin' })
        .expect(200);

      expect(response.body.users.every(user => user.role === 'admin')).toBe(true);
    });

    it('should search users by name or email', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ search: 'alice' })
        .expect(200);

      expect(response.body.users.length).toBeGreaterThan(0);
      expect(
        response.body.users.some(
          user =>
            user.name.toLowerCase().includes('alice') || user.email.toLowerCase().includes('alice')
        )
      ).toBe(true);
    });

    it('should sort users by name ascending', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ sortBy: 'name', sortOrder: 'asc' })
        .expect(200);

      const names = response.body.users.map(u => u.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort users by name descending', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ sortBy: 'name', sortOrder: 'desc' })
        .expect(200);

      const names = response.body.users.map(u => u.name);
      const sortedNames = [...names].sort().reverse();
      expect(names).toEqual(sortedNames);
    });

    it('should combine filtering, sorting, and pagination', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({
          role: 'user',
          sortBy: 'name',
          sortOrder: 'asc',
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.users.every(user => user.role === 'user')).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a specific user by ID', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('email');
    });

    it('should return 404 for non-existent user', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users/9999')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toContain('9999');
    });

    it('should return 400 for invalid user ID format', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users/invalid')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.message).toContain('Invalid user ID format');
    });
  });

  // ==========================================================================
  // POST Requests
  // ==========================================================================

  describe('POST /api/users', () => {
    it('should create a new user with valid data', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const newUser = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email.toLowerCase());
      expect(response.body.role).toBe(newUser.role);
      expect(response.body).toHaveProperty('createdAt');

      // Check Location header
      expect(response.headers.location).toBe(`/api/users/${response.body.id}`);
    });

    it('should default role to "user" if not provided', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
        })
        .expect(201);

      expect(response.body.role).toBe('user');
    });

    it('should return 400 for missing required fields', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation error');
      expect(response.body.fields).toHaveProperty('name');
      expect(response.body.fields).toHaveProperty('email');
    });

    it('should return 400 for invalid email format', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.fields.email).toContain('Invalid email format');
    });

    it('should return 400 for duplicate email', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate User',
          email: 'alice@example.com', // Already exists
        })
        .expect(400);

      expect(response.body.fields.email).toContain('already exists');
    });

    it('should return 400 for invalid role', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          role: 'superadmin', // Invalid role
        })
        .expect(400);

      expect(response.body.fields.role).toContain('must be either');
    });

    it('should trim whitespace from name and email', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '  Trimmed Name  ',
          email: '  TRIMMED@EXAMPLE.COM  ',
        })
        .expect(201);

      expect(response.body.name).toBe('Trimmed Name');
      expect(response.body.email).toBe('trimmed@example.com');
    });

    it('should return 400 for name that is too short', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'A',
          email: 'test@example.com',
        })
        .expect(400);

      expect(response.body.fields.name).toContain('between 2 and 100');
    });
  });

  // ==========================================================================
  // PUT Requests
  // ==========================================================================

  describe('PUT /api/users/:id', () => {
    it('should replace user entirely with valid data', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        role: 'admin',
      };

      const response = await request(app)
        .put('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.email).toBe(updatedData.email);
      expect(response.body.role).toBe(updatedData.role);
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 404 for non-existent user', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .put('/api/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test',
          email: 'test@example.com',
        })
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    it('should return 400 for missing required fields in PUT', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .put('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Only Name',
          // Missing email
        })
        .expect(400);

      expect(response.body.fields.email).toBeTruthy();
    });
  });

  // ==========================================================================
  // PATCH Requests
  // ==========================================================================

  describe('PATCH /api/users/:id', () => {
    it('should partially update user', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Partially Updated',
        })
        .expect(200);

      expect(response.body.name).toBe('Partially Updated');
      expect(response.body.email).toBe('bob@example.com'); // Unchanged
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should update multiple fields', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Name',
          email: 'newemail@example.com',
        })
        .expect(200);

      expect(response.body.name).toBe('New Name');
      expect(response.body.email).toBe('newemail@example.com');
    });

    it('should validate partial updates', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .patch('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.fields.email).toContain('Invalid email format');
    });
  });

  // ==========================================================================
  // DELETE Requests
  // ==========================================================================

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      await request(app)
        .delete('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify user is deleted
      await request(app)
        .get('/api/users/2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent user', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .delete('/api/users/9999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });

    it('should prevent user from deleting themselves', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toContain('cannot delete your own account');
    });

    it('should require admin role to delete users', async () => {
      const userToken = generateToken({ id: 2, role: 'user' });

      const response = await request(app)
        .delete('/api/users/3')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.error).toBe('Forbidden');
    });
  });

  // ==========================================================================
  // Rate Limiting
  // ==========================================================================

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const token = generateToken();

      // Make 10 requests (should succeed)
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/users').set('Authorization', `Bearer ${token}`).expect(200);
      }

      // 11th request should be rate limited
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(429);

      expect(response.body.error).toBe('Too many requests');
      expect(response.body).toHaveProperty('retryAfter');
    });

    it('should include rate limit headers', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  // ==========================================================================
  // CORS Tests
  // ==========================================================================

  describe('CORS', () => {
    it('should include CORS headers in responses', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBeTruthy();
      expect(response.headers['access-control-allow-headers']).toBeTruthy();
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app).options('/api/users').expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  describe('Error Handling', () => {
    it('should return 400 for invalid JSON', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBe('Bad request');
      expect(response.body.message).toContain('Invalid JSON');
    });

    it('should return 404 for unknown routes', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/nonexistent')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.error).toBe('Not found');
      expect(response.body.message).toContain('/api/nonexistent');
    });

    it('should handle server errors gracefully', async () => {
      const token = generateToken();

      // Simulate error by sending invalid query parameter that causes error
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .query({ limit: 'invalid' })
        .expect(200); // Should still succeed but with default limit

      expect(response.body).toHaveProperty('users');
    });
  });

  // ==========================================================================
  // Content-Type Validation
  // ==========================================================================

  describe('Content-Type Validation', () => {
    it('should accept application/json content type', async () => {
      const adminToken = generateToken({ id: 1, role: 'admin' });

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send({
          name: 'Test User',
          email: 'test@example.com',
        })
        .expect(201);
    });

    it('should return JSON content type', async () => {
      const token = generateToken();

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  // ==========================================================================
  // Health Check
  // ==========================================================================

  describe('GET /api/health', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
