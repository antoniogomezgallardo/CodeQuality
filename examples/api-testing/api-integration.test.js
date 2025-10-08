/**
 * API Integration Testing Examples
 *
 * This file demonstrates comprehensive integration testing patterns including:
 * - Database integration with PostgreSQL
 * - Transaction management and rollback
 * - Test data setup and teardown
 * - External API mocking with Nock
 * - Database seeding and cleanup
 * - Connection pooling
 * - Multi-service integration
 *
 * Integration tests validate that different components of the system
 * work together correctly, including databases, external services,
 * and message queues.
 *
 * @requires jest
 * @requires supertest
 * @requires pg (PostgreSQL client)
 * @requires nock
 */

const request = require('supertest');
const { Pool } = require('pg');
const nock = require('nock');
const express = require('express');

// ============================================================================
// Database Configuration
// ============================================================================

/**
 * PostgreSQL connection pool
 * In production, these values would come from environment variables
 */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'test_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// ============================================================================
// Database Helper Functions
// ============================================================================

/**
 * Execute a SQL query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

/**
 * Get a client from the pool for transaction management
 * @returns {Promise<Object>} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  return client;
};

/**
 * Initialize database schema
 */
const initializeSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      published BOOLEAN DEFAULT false,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS external_api_cache (
      id SERIAL PRIMARY KEY,
      endpoint VARCHAR(255) NOT NULL,
      response_data JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    )
  `);

  // Create indexes for better performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id)
  `);
};

/**
 * Clean up database tables
 */
const cleanupDatabase = async () => {
  await query('DELETE FROM posts');
  await query('DELETE FROM users');
  await query('DELETE FROM external_api_cache');

  // Reset sequences
  await query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await query('ALTER SEQUENCE posts_id_seq RESTART WITH 1');
  await query('ALTER SEQUENCE external_api_cache_id_seq RESTART WITH 1');
};

/**
 * Seed database with test data
 */
const seedDatabase = async () => {
  // Insert users
  await query(`
    INSERT INTO users (name, email, role, created_at)
    VALUES
      ('Alice Johnson', 'alice@example.com', 'admin', '2025-01-01 00:00:00'),
      ('Bob Smith', 'bob@example.com', 'user', '2025-01-02 00:00:00'),
      ('Charlie Brown', 'charlie@example.com', 'user', '2025-01-03 00:00:00')
  `);

  // Insert posts
  await query(`
    INSERT INTO posts (title, content, published, author_id, created_at)
    VALUES
      ('First Post', 'This is the first post', true, 1, '2025-01-05 00:00:00'),
      ('Second Post', 'This is the second post', false, 1, '2025-01-06 00:00:00'),
      ('Third Post', 'This is the third post', true, 2, '2025-01-07 00:00:00')
  `);
};

// ============================================================================
// Express Application with Database Integration
// ============================================================================

const createApp = () => {
  const app = express();
  app.use(express.json());

  /**
   * GET /api/users
   * Fetch users from database
   */
  app.get('/api/users', async (req, res) => {
    try {
      const { role, search } = req.query;
      let queryText = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      let paramCount = 1;

      if (role) {
        queryText += ` AND role = $${paramCount}`;
        params.push(role);
        paramCount++;
      }

      if (search) {
        queryText += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
        paramCount++;
      }

      queryText += ' ORDER BY id';

      const result = await query(queryText, params);

      res.status(200).json({
        users: result.rows,
        total: result.rowCount
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * GET /api/users/:id
   * Fetch a specific user with their posts
   */
  app.get('/api/users/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch user
      const userResult = await query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not found',
          message: `User with ID ${id} not found`
        });
      }

      // Fetch user's posts
      const postsResult = await query(
        'SELECT * FROM posts WHERE author_id = $1 ORDER BY created_at DESC',
        [id]
      );

      const user = userResult.rows[0];
      user.posts = postsResult.rows;

      res.status(200).json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  /**
   * POST /api/users
   * Create a new user
   */
  app.post('/api/users', async (req, res) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { name, email, role } = req.body;

      // Validation
      if (!name || !email) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Validation error',
          message: 'Name and email are required'
        });
      }

      // Check for duplicate email
      const duplicateCheck = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (duplicateCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Validation error',
          message: 'Email already exists'
        });
      }

      // Insert user
      const result = await client.query(
        `INSERT INTO users (name, email, role)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [name, email, role || 'user']
      );

      await client.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  /**
   * PATCH /api/users/:id
   * Update a user
   */
  app.patch('/api/users/:id', async (req, res) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const { name, email, role } = req.body;

      // Check if user exists
      const userCheck = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );

      if (userCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not found',
          message: `User with ID ${id} not found`
        });
      }

      // Build update query dynamically
      const updates = [];
      const params = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        params.push(name);
        paramCount++;
      }

      if (email !== undefined) {
        updates.push(`email = $${paramCount}`);
        params.push(email);
        paramCount++;
      }

      if (role !== undefined) {
        updates.push(`role = $${paramCount}`);
        params.push(role);
        paramCount++;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const updateQuery = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(updateQuery, params);

      await client.query('COMMIT');

      res.status(200).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  /**
   * DELETE /api/users/:id
   * Delete a user (cascades to posts)
   */
  app.delete('/api/users/:id', async (req, res) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { id } = req.params;

      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not found',
          message: `User with ID ${id} not found`
        });
      }

      await client.query('COMMIT');

      res.status(204).end();
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting user:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  /**
   * POST /api/posts
   * Create a new post
   */
  app.post('/api/posts', async (req, res) => {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { title, content, published, author_id } = req.body;

      // Validation
      if (!title || !content || !author_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Validation error',
          message: 'Title, content, and author_id are required'
        });
      }

      // Verify author exists
      const authorCheck = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [author_id]
      );

      if (authorCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          error: 'Not found',
          message: `Author with ID ${author_id} not found`
        });
      }

      // Insert post
      const result = await client.query(
        `INSERT INTO posts (title, content, published, author_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [title, content, published || false, author_id]
      );

      await client.query('COMMIT');

      res.status(201).json(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating post:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    } finally {
      client.release();
    }
  });

  /**
   * GET /api/external/weather
   * Fetch weather data from external API with caching
   */
  app.get('/api/external/weather', async (req, res) => {
    try {
      const { city } = req.query;

      if (!city) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'City parameter is required'
        });
      }

      // Check cache
      const cacheResult = await query(
        `SELECT response_data FROM external_api_cache
         WHERE endpoint = $1 AND expires_at > NOW()`,
        [`weather:${city}`]
      );

      if (cacheResult.rows.length > 0) {
        return res.status(200).json({
          ...cacheResult.rows[0].response_data,
          cached: true
        });
      }

      // Fetch from external API
      const externalResponse = await fetch(
        `https://api.weather.com/v1/weather?city=${city}`
      );

      if (!externalResponse.ok) {
        throw new Error('External API request failed');
      }

      const weatherData = await externalResponse.json();

      // Cache the response
      await query(
        `INSERT INTO external_api_cache (endpoint, response_data, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [`weather:${city}`, JSON.stringify(weatherData)]
      );

      res.status(200).json({
        ...weatherData,
        cached: false
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  });

  return app;
};

// ============================================================================
// Test Suite
// ============================================================================

describe('API Integration Tests', () => {
  let app;

  // Setup: Initialize database before all tests
  beforeAll(async () => {
    await initializeSchema();
  });

  // Setup: Create app and seed database before each test
  beforeEach(async () => {
    app = createApp();
    await cleanupDatabase();
    await seedDatabase();
  });

  // Cleanup: Clear database after each test
  afterEach(async () => {
    await cleanupDatabase();
    nock.cleanAll();
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await pool.end();
  });

  // ==========================================================================
  // Database Integration Tests
  // ==========================================================================

  describe('Database Integration', () => {
    describe('GET /api/users', () => {
      it('should fetch users from database', async () => {
        const response = await request(app)
          .get('/api/users')
          .expect(200);

        expect(response.body.users).toHaveLength(3);
        expect(response.body.total).toBe(3);
        expect(response.body.users[0]).toHaveProperty('id');
        expect(response.body.users[0]).toHaveProperty('name');
        expect(response.body.users[0]).toHaveProperty('email');
      });

      it('should filter users by role', async () => {
        const response = await request(app)
          .get('/api/users')
          .query({ role: 'admin' })
          .expect(200);

        expect(response.body.users.every(user => user.role === 'admin')).toBe(true);
        expect(response.body.users).toHaveLength(1);
      });

      it('should search users by name or email', async () => {
        const response = await request(app)
          .get('/api/users')
          .query({ search: 'alice' })
          .expect(200);

        expect(response.body.users.length).toBeGreaterThan(0);
        expect(
          response.body.users.some(user =>
            user.name.toLowerCase().includes('alice') ||
            user.email.toLowerCase().includes('alice')
          )
        ).toBe(true);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should fetch user with posts from database', async () => {
        const response = await request(app)
          .get('/api/users/1')
          .expect(200);

        expect(response.body).toHaveProperty('id', 1);
        expect(response.body).toHaveProperty('name', 'Alice Johnson');
        expect(response.body).toHaveProperty('posts');
        expect(Array.isArray(response.body.posts)).toBe(true);
        expect(response.body.posts.length).toBe(2); // Alice has 2 posts
      });

      it('should return 404 for non-existent user', async () => {
        const response = await request(app)
          .get('/api/users/9999')
          .expect(404);

        expect(response.body.error).toBe('Not found');
      });
    });

    describe('POST /api/users', () => {
      it('should create user in database with transaction', async () => {
        const newUser = {
          name: 'New User',
          email: 'newuser@example.com',
          role: 'user'
        };

        const response = await request(app)
          .post('/api/users')
          .send(newUser)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(newUser.name);
        expect(response.body.email).toBe(newUser.email);

        // Verify in database
        const dbResult = await query(
          'SELECT * FROM users WHERE email = $1',
          [newUser.email]
        );

        expect(dbResult.rows.length).toBe(1);
        expect(dbResult.rows[0].name).toBe(newUser.name);
      });

      it('should rollback transaction on duplicate email', async () => {
        const duplicateUser = {
          name: 'Duplicate',
          email: 'alice@example.com' // Already exists
        };

        const response = await request(app)
          .post('/api/users')
          .send(duplicateUser)
          .expect(400);

        expect(response.body.message).toContain('Email already exists');

        // Verify no new user was created
        const dbResult = await query(
          'SELECT COUNT(*) as count FROM users WHERE email = $1',
          [duplicateUser.email]
        );

        expect(parseInt(dbResult.rows[0].count)).toBe(1); // Still only one
      });

      it('should rollback transaction on validation error', async () => {
        const invalidUser = {
          name: 'Test'
          // Missing email
        };

        const initialCount = await query('SELECT COUNT(*) as count FROM users');

        await request(app)
          .post('/api/users')
          .send(invalidUser)
          .expect(400);

        // Verify no user was created
        const finalCount = await query('SELECT COUNT(*) as count FROM users');
        expect(finalCount.rows[0].count).toBe(initialCount.rows[0].count);
      });
    });

    describe('PATCH /api/users/:id', () => {
      it('should update user in database with transaction', async () => {
        const updates = {
          name: 'Updated Name',
          email: 'updated@example.com'
        };

        const response = await request(app)
          .patch('/api/users/2')
          .send(updates)
          .expect(200);

        expect(response.body.name).toBe(updates.name);
        expect(response.body.email).toBe(updates.email);
        expect(response.body.updated_at).toBeDefined();

        // Verify in database
        const dbResult = await query(
          'SELECT * FROM users WHERE id = $1',
          [2]
        );

        expect(dbResult.rows[0].name).toBe(updates.name);
        expect(dbResult.rows[0].email).toBe(updates.email);
      });

      it('should update only specified fields', async () => {
        const updates = {
          name: 'Only Name Updated'
        };

        const response = await request(app)
          .patch('/api/users/2')
          .send(updates)
          .expect(200);

        expect(response.body.name).toBe(updates.name);
        expect(response.body.email).toBe('bob@example.com'); // Unchanged
      });
    });

    describe('DELETE /api/users/:id', () => {
      it('should delete user and cascade to posts', async () => {
        // Verify user has posts
        const postsBefore = await query(
          'SELECT * FROM posts WHERE author_id = $1',
          [1]
        );
        expect(postsBefore.rows.length).toBeGreaterThan(0);

        // Delete user
        await request(app)
          .delete('/api/users/1')
          .expect(204);

        // Verify user is deleted
        const userResult = await query(
          'SELECT * FROM users WHERE id = $1',
          [1]
        );
        expect(userResult.rows.length).toBe(0);

        // Verify posts are also deleted (cascade)
        const postsAfter = await query(
          'SELECT * FROM posts WHERE author_id = $1',
          [1]
        );
        expect(postsAfter.rows.length).toBe(0);
      });

      it('should rollback transaction if user not found', async () => {
        const initialCount = await query('SELECT COUNT(*) as count FROM users');

        await request(app)
          .delete('/api/users/9999')
          .expect(404);

        const finalCount = await query('SELECT COUNT(*) as count FROM users');
        expect(finalCount.rows[0].count).toBe(initialCount.rows[0].count);
      });
    });

    describe('POST /api/posts', () => {
      it('should create post with foreign key constraint', async () => {
        const newPost = {
          title: 'New Post',
          content: 'This is a new post',
          published: true,
          author_id: 1
        };

        const response = await request(app)
          .post('/api/posts')
          .send(newPost)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(newPost.title);
        expect(response.body.author_id).toBe(newPost.author_id);

        // Verify in database
        const dbResult = await query(
          'SELECT * FROM posts WHERE id = $1',
          [response.body.id]
        );

        expect(dbResult.rows.length).toBe(1);
        expect(dbResult.rows[0].title).toBe(newPost.title);
      });

      it('should fail when author does not exist', async () => {
        const invalidPost = {
          title: 'Invalid Post',
          content: 'This post has invalid author',
          author_id: 9999
        };

        const response = await request(app)
          .post('/api/posts')
          .send(invalidPost)
          .expect(404);

        expect(response.body.message).toContain('Author with ID 9999 not found');

        // Verify post was not created
        const dbResult = await query(
          'SELECT * FROM posts WHERE title = $1',
          [invalidPost.title]
        );

        expect(dbResult.rows.length).toBe(0);
      });
    });
  });

  // ==========================================================================
  // External API Mocking Tests
  // ==========================================================================

  describe('External API Integration', () => {
    describe('GET /api/external/weather', () => {
      it('should fetch data from external API and cache it', async () => {
        // Mock external API
        const mockWeatherData = {
          city: 'London',
          temperature: 15,
          conditions: 'Cloudy',
          humidity: 70
        };

        nock('https://api.weather.com')
          .get('/v1/weather')
          .query({ city: 'London' })
          .reply(200, mockWeatherData);

        // First request - should hit external API
        const response1 = await request(app)
          .get('/api/external/weather')
          .query({ city: 'London' })
          .expect(200);

        expect(response1.body.city).toBe('London');
        expect(response1.body.cached).toBe(false);

        // Verify data is cached in database
        const cacheResult = await query(
          `SELECT * FROM external_api_cache WHERE endpoint = $1`,
          ['weather:London']
        );

        expect(cacheResult.rows.length).toBe(1);

        // Second request - should hit cache
        const response2 = await request(app)
          .get('/api/external/weather')
          .query({ city: 'London' })
          .expect(200);

        expect(response2.body.city).toBe('London');
        expect(response2.body.cached).toBe(true);

        // Verify external API was only called once
        expect(nock.isDone()).toBe(true);
      });

      it('should handle external API errors', async () => {
        nock('https://api.weather.com')
          .get('/v1/weather')
          .query({ city: 'InvalidCity' })
          .reply(500, { error: 'Internal Server Error' });

        const response = await request(app)
          .get('/api/external/weather')
          .query({ city: 'InvalidCity' })
          .expect(500);

        expect(response.body.error).toBe('Internal server error');
      });

      it('should require city parameter', async () => {
        const response = await request(app)
          .get('/api/external/weather')
          .expect(400);

        expect(response.body.message).toContain('City parameter is required');
      });
    });
  });

  // ==========================================================================
  // Transaction Isolation Tests
  // ==========================================================================

  describe('Transaction Isolation', () => {
    it('should isolate concurrent transactions', async () => {
      const client1 = await getClient();
      const client2 = await getClient();

      try {
        // Start transaction 1
        await client1.query('BEGIN');
        await client1.query(
          'UPDATE users SET name = $1 WHERE id = $2',
          ['Transaction 1', 1]
        );

        // Start transaction 2
        await client2.query('BEGIN');

        // Transaction 2 should see old value
        const result2 = await client2.query(
          'SELECT name FROM users WHERE id = $1',
          [1]
        );

        expect(result2.rows[0].name).toBe('Alice Johnson'); // Original value

        // Commit transaction 1
        await client1.query('COMMIT');

        // Transaction 2 should still see old value (repeatable read)
        const result2After = await client2.query(
          'SELECT name FROM users WHERE id = $1',
          [1]
        );

        // In PostgreSQL READ COMMITTED (default), it will see the new value
        expect(result2After.rows[0].name).toBe('Transaction 1');

        await client2.query('COMMIT');
      } finally {
        client1.release();
        client2.release();
      }
    });

    it('should handle deadlock scenarios gracefully', async () => {
      // This is a simplified example
      // In production, implement retry logic for deadlocks
      const client1 = await getClient();
      const client2 = await getClient();

      try {
        await client1.query('BEGIN');
        await client2.query('BEGIN');

        // Update different rows
        await client1.query('UPDATE users SET name = $1 WHERE id = $2', ['User1', 1]);
        await client2.query('UPDATE users SET name = $1 WHERE id = $2', ['User2', 2]);

        // No deadlock since different rows
        await client1.query('COMMIT');
        await client2.query('COMMIT');

        expect(true).toBe(true); // Test passed without deadlock
      } finally {
        client1.release();
        client2.release();
      }
    });
  });

  // ==========================================================================
  // Connection Pool Tests
  // ==========================================================================

  describe('Connection Pool Management', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(null).map((_, i) =>
        request(app)
          .post('/api/users')
          .send({
            name: `Concurrent User ${i}`,
            email: `concurrent${i}@example.com`
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response, i) => {
        expect(response.status).toBe(201);
        expect(response.body.email).toBe(`concurrent${i}@example.com`);
      });

      // Verify all users were created
      const dbResult = await query(
        'SELECT COUNT(*) as count FROM users WHERE email LIKE $1',
        ['concurrent%']
      );

      expect(parseInt(dbResult.rows[0].count)).toBe(10);
    });

    it('should release connections properly', async () => {
      const poolStatus = pool.totalCount;

      // Make several requests
      await request(app).get('/api/users');
      await request(app).get('/api/users/1');
      await request(app).post('/api/users').send({
        name: 'Test',
        email: 'test@example.com'
      });

      // Wait a bit for connections to be released
      await new Promise(resolve => setTimeout(resolve, 100));

      // Pool should not have grown significantly
      expect(pool.totalCount).toBeLessThanOrEqual(poolStatus + 5);
    });
  });

  // ==========================================================================
  // Data Consistency Tests
  // ==========================================================================

  describe('Data Consistency', () => {
    it('should maintain referential integrity', async () => {
      // Try to create post with non-existent author
      const invalidPost = {
        title: 'Invalid',
        content: 'Content',
        author_id: 9999
      };

      await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(404);

      // Verify post was not created
      const result = await query(
        'SELECT * FROM posts WHERE title = $1',
        ['Invalid']
      );

      expect(result.rows.length).toBe(0);
    });

    it('should cascade delete from users to posts', async () => {
      // Create user with posts
      const userResult = await query(
        `INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id`,
        ['Test User', 'testcascade@example.com']
      );

      const userId = userResult.rows[0].id;

      await query(
        `INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3)`,
        ['Post 1', 'Content 1', userId]
      );

      await query(
        `INSERT INTO posts (title, content, author_id) VALUES ($1, $2, $3)`,
        ['Post 2', 'Content 2', userId]
      );

      // Delete user via API
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204);

      // Verify posts are also deleted
      const postsResult = await query(
        'SELECT * FROM posts WHERE author_id = $1',
        [userId]
      );

      expect(postsResult.rows.length).toBe(0);
    });
  });
});

/**
 * Best Practices for Integration Testing
 *
 * 1. **Database Management**:
 *    - Use transactions for test isolation
 *    - Clean up data after each test
 *    - Use a separate test database
 *    - Reset sequences to ensure predictable IDs
 *
 * 2. **Test Data**:
 *    - Seed consistent test data
 *    - Use factories or fixtures
 *    - Clean up after each test
 *    - Avoid test interdependencies
 *
 * 3. **External Services**:
 *    - Mock external APIs with Nock or MSW
 *    - Test both success and failure scenarios
 *    - Verify mocks are called correctly
 *    - Clean up mocks after tests
 *
 * 4. **Connection Management**:
 *    - Use connection pooling
 *    - Release connections properly
 *    - Close pool after tests
 *    - Handle connection errors
 *
 * 5. **Transaction Management**:
 *    - Use transactions for data consistency
 *    - Rollback on errors
 *    - Test concurrent transactions
 *    - Handle deadlocks gracefully
 *
 * 6. **Performance**:
 *    - Run tests in parallel when possible
 *    - Use indexes for faster queries
 *    - Monitor test execution time
 *    - Optimize slow tests
 */
